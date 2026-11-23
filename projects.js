// /projects: category and hashtag filters, placeholder art, and the click glow.
// Progressive enhancement: without JS every tile shows and links work normally.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function accent(el) {
    return getComputedStyle(el).getPropertyValue('--pf-accent').trim() || '#7cc4ff';
  }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  // A deterministic line study per project, white at rest and accent when hot.
  function draw(cv, hot) {
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var d = window.devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
    var c = cv.getContext('2d');
    c.scale(d, d);
    var W = r.width, H = r.height, h = hash(cv.getAttribute('data-seed') || ''), s = h;
    function rnd() {
      s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909);
      return ((s >>> 0) % 10000) / 10000;
    }
    c.strokeStyle = c.fillStyle = hot ? accent(cv) : 'rgba(255,255,255,.55)';
    c.lineWidth = 1;
    var kind = h % 4, i, x, y;
    if (kind === 0) {
      var n = 18 + (h % 14);
      for (i = 0; i < n; i++) {
        y = (H * (i + 0.5)) / n;
        c.beginPath(); c.moveTo(0, y); c.lineTo(rnd() * W * 0.8 + W * 0.15, y); c.stroke();
      }
    } else if (kind === 1) {
      var cx = W * (0.3 + rnd() * 0.4), cy = H / 2;
      for (i = 1; i < 26; i++) {
        c.globalAlpha = 1 - i / 30;
        c.beginPath(); c.arc(cx, cy, (i * Math.max(W, H)) / 40, 0, Math.PI * 2); c.stroke();
      }
      c.globalAlpha = 1;
    } else if (kind === 2) {
      var st = Math.max(10, Math.min(W, H) / 12);
      for (y = st / 2; y < H; y += st)
        for (x = st / 2; x < W; x += st) {
          var q = rnd();
          c.beginPath(); c.arc(x, y, q < 0.25 ? 2.6 : q < 0.6 ? 1.4 : 0.6, 0, Math.PI * 2); c.fill();
        }
    } else {
      c.beginPath();
      for (x = 0; x <= W; x += 3) {
        y = H / 2 + Math.sin(x / (14 + (h % 20))) * H * 0.28 * Math.sin((x / W) * Math.PI);
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      c.globalAlpha = 0.25;
      for (i = 0; i < 40; i++) {
        x = rnd() * W;
        c.beginPath(); c.moveTo(x, H * 0.15); c.lineTo(x, H * 0.85); c.stroke();
      }
      c.globalAlpha = 1;
    }
  }

  var canvases = Array.prototype.slice.call(document.querySelectorAll('canvas[data-seed]'));
  function drawAll() { canvases.forEach(function (cv) { draw(cv, false); }); }
  drawAll();
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(drawAll, 150); });

  // Tiles: art turns accent on hover/focus; a click glows, then navigates.
  Array.prototype.forEach.call(document.querySelectorAll('.pt'), function (t) {
    var cv = t.querySelector('canvas[data-seed]');
    if (cv) {
      t.addEventListener('mouseenter', function () { draw(cv, true); });
      t.addEventListener('mouseleave', function () { draw(cv, false); });
      t.addEventListener('focus', function () { draw(cv, true); });
      t.addEventListener('blur', function () { draw(cv, false); });
    }
    t.addEventListener('click', function (e) {
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      t.classList.remove('is-pressed');
      void t.offsetWidth;
      t.classList.add('is-pressed');
      setTimeout(function () { window.location.href = t.href; }, 170);
    });
  });

  // Filters (grid page only).
  var grid = document.querySelector('[data-pf-grid]');
  if (!grid) return;
  var tiles = Array.prototype.slice.call(grid.querySelectorAll('.pt'));
  var empty = document.querySelector('[data-pf-empty]');
  var cat = 'All', tag = null;
  Array.prototype.forEach.call(document.querySelectorAll('[data-pf-controls]'), function (el) { el.hidden = false; });

  function matches(t) {
    return (cat === 'All' || t.getAttribute('data-cat') === cat) &&
      (!tag || (' ' + t.getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') !== -1);
  }

  // FLIP: remember where every visible tile is, apply the filter, then slide
  // the tiles that stay from their old spots to their new ones and fade in the
  // ones that appear, so a category's tiles visibly gather together.
  function apply() {
    var before = new Map();
    tiles.forEach(function (t) { if (!t.hidden) before.set(t, t.getBoundingClientRect()); });

    var shown = 0;
    tiles.forEach(function (t) {
      var ok = matches(t);
      t.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    Array.prototype.forEach.call(document.querySelectorAll('[data-filter-cat]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter-cat') === cat));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-filter-tag]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter-tag') === tag));
    });
    drawAll();

    if (reduce || !tiles[0] || !tiles[0].animate) return;
    var i = 0;
    tiles.forEach(function (t) {
      if (t.hidden) return;
      var now = t.getBoundingClientRect();
      var was = before.get(t);
      if (was) {
        var dx = was.left - now.left, dy = was.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        t.animate(
          [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
          { duration: 520, easing: 'cubic-bezier(.2,.75,.2,1)' }
        );
      } else {
        t.animate(
          [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, delay: Math.min(i++ * 18, 260), easing: 'ease-out', fill: 'backwards' }
        );
      }
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-filter-cat],[data-filter-tag]');
    if (!b) return;
    if (b.hasAttribute('data-filter-cat')) cat = b.getAttribute('data-filter-cat');
    else tag = tag === b.getAttribute('data-filter-tag') ? null : b.getAttribute('data-filter-tag');
    apply();
  });
})();
