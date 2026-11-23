// Manual theme toggle. Progressive enhancement: the button is hidden in markup
// and only revealed here, so JS-disabled users never see a dead control.
// The no-flash bootstrap in <head> has already applied any saved preference.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  var label = btn.querySelector('[data-theme-label]');

  // Dark is the site's default ("lab at night"); light is an explicit choice.
  function effectiveTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') return explicit;
    return 'dark';
  }

  function render() {
    var t = effectiveTheme();
    if (label) label.textContent = t === 'dark' ? 'Light' : 'Dark';
    btn.setAttribute('aria-pressed', String(t === 'dark'));
  }

  btn.hidden = false;
  render();

  btn.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
    render();
  });
})();
