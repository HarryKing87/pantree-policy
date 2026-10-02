/* ═══════════════════════════════════════════════════════════
   Mål — site behaviour
   · hash router with animated view swap (no page reload)
   · legacy deep links preserved (#delete-account is registered
     with the app stores as the data-deletion URL — do not break)
   · scroll reveals, counters, theme toggle
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VIEWS   = ['home', 'terms', 'privacy', 'delete', 'releases'];
  var DEFAULT = 'home';

  /* Legacy anchors that existed on the old single-page policy.
     They must keep working forever — external listings point at them. */
  var LEGACY = {
    'delete-account':           'delete',
    'delete_account':           'delete',
    'privacy':                  'privacy',
    'privacy-policy':           'privacy',
    'request-account-deletion': 'delete',
    'terms':                    'terms',
    'terms-and-conditions':     'terms',
    'tos':                      'terms'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var root      = document.getElementById('view-root');
  var views     = {};
  var tabs      = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var pill      = document.getElementById('tab-pill');
  var topbar    = document.getElementById('topbar');
  var current   = null;

  VIEWS.forEach(function (name) {
    views[name] = root.querySelector('[data-view="' + name + '"]');
  });

  /* ── resolve a hash to a view name ── */
  function parse(hash) {
    var h = (hash || '').replace(/^#/, '');
    if (!h || h === '/') return DEFAULT;

    if (h.charAt(0) === '/') {
      var seg = h.slice(1).split(/[/?]/)[0].toLowerCase();
      return VIEWS.indexOf(seg) > -1 ? seg : DEFAULT;
    }
    /* bare anchor — legacy form */
    var key = h.toLowerCase();
    if (LEGACY[key]) return LEGACY[key];
    return VIEWS.indexOf(key) > -1 ? key : DEFAULT;
  }

  /* ── tab pill ── */
  function movePill(name, instant) {
    var active = tabs.filter(function (t) { return t.dataset.link === name; })[0];
    if (!active || !pill) return;
    if (instant) pill.classList.add('no-anim');
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + (active.offsetLeft - 4) + 'px)';
    if (instant) requestAnimationFrame(function () { pill.classList.remove('no-anim'); });
  }

  function markTabs(name) {
    tabs.forEach(function (t) {
      var on = t.dataset.link === name;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'page');
      else    t.removeAttribute('aria-current');
    });
  }

  /* ── swap views : unmount old, mount new ── */
  function show(name, opts) {
    opts = opts || {};
    if (name === current) return;

    var next = views[name];
    var prev = current ? views[current] : null;
    if (!next) return;

    markTabs(name);
    movePill(name, opts.instant);

    function mount() {
      if (prev) { prev.hidden = true; prev.classList.remove('is-leaving'); }
      next.hidden = false;
      /* restart the enter animation */
      next.style.animation = 'none';
      void next.offsetWidth;
      next.style.animation = '';

      current = name;
      window.MAL_currentView = name;
      document.title = titleFor(name);
      armReveals(next);

      if (!opts.keepScroll) {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }
    }

    if (prev && !reduced && !opts.instant) {
      prev.classList.add('is-leaving');
      var done = false;
      var finish = function () { if (!done) { done = true; mount(); } };
      prev.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, 320); /* safety net */
    } else {
      mount();
    }
  }

  function titleFor(name) {
    /* i18n.js (loaded first) exposes a language-aware version of this
       same mapping; fall back to the English strings if it isn't ready. */
    if (window.MAL_titleFor) return window.MAL_titleFor(name);
    if (name === 'terms')    return 'Terms & Conditions — Mål';
    if (name === 'privacy')  return 'Privacy Policy — Mål';
    if (name === 'delete')   return 'Delete your account — Mål';
    if (name === 'releases') return 'Release Notes — Mål';
    return 'Mål — Plan meals, waste less';
  }

  /* ── scroll reveal ── */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            countUp(e.target);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

  function armReveals(scope) {
    var els = scope.querySelectorAll('.reveal:not(.is-in)');
    if (!io) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
      return;
    }
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ── number count-up inside phone mockups ── */
  function countUp(scope) {
    if (reduced) return;
    var nums = scope.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(nums, function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      var target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      var start = null, dur = 1100, settled = false;
      function settle() {
        settled = true;
        el.textContent = target.toLocaleString('en-US');
      }
      function tick(ts) {
        if (settled) return;
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
        else settled = true;
      }
      el.textContent = '0';
      requestAnimationFrame(tick);
      /* rAF is throttled in hidden/background tabs — never leave a tile
         stranded on a half-counted number. */
      setTimeout(settle, dur + 250);
    });
  }

  /* stagger the sparkline bars */
  Array.prototype.forEach.call(document.querySelectorAll('.ph-spark'), function (s) {
    Array.prototype.forEach.call(s.children, function (bar, i) {
      bar.style.setProperty('--i', i);
    });
  });

  /* ── theme toggle ──
     The saved theme is applied pre-paint by the inline script in <head>;
     this only handles switching. Colour transitions are enabled a frame
     after load so the first paint never cross-fades. */
  var STORE = 'mal-theme';
  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function enableThemeAnim() {
    document.documentElement.classList.add('theme-anim');
  }
  requestAnimationFrame(function () { requestAnimationFrame(enableThemeAnim); });
  /* rAF is throttled in background tabs — make sure the class lands regardless */
  setTimeout(enableThemeAnim, 400);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
    });
  }

  /* ── sticky top bar hairline ── */
  function onScroll() {
    topbar.classList.toggle('is-stuck', window.scrollY > 6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── link interception ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-link]') : null;
    if (!a) return;
    var name = a.dataset.link;
    if (VIEWS.indexOf(name) === -1) return;
    e.preventDefault();
    if (location.hash !== '#/' + name && !(name === DEFAULT && (location.hash === '' || location.hash === '#/'))) {
      history.pushState(null, '', '#/' + (name === DEFAULT ? '' : name));
    }
    show(name);
  });

  /* ── history / hash changes ── */
  window.addEventListener('hashchange', function () { show(parse(location.hash)); });
  window.addEventListener('popstate',   function () { show(parse(location.hash)); });

  /* ── resize keeps the pill aligned ── */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { movePill(current, true); }, 100);
  });

  /* ── boot ── */
  var startHash = location.hash;
  var start = parse(startHash);

  /* Hide every view up front, then mount the requested one. */
  VIEWS.forEach(function (n) { views[n].hidden = true; });
  current = null;
  show(start, { instant: true, keepScroll: true });

  /* Normalise a legacy anchor into the new route without adding history noise. */
  var bare = startHash.replace(/^#/, '');
  if (bare && bare.charAt(0) !== '/') {
    history.replaceState(null, '', '#/' + (start === DEFAULT ? '' : start));
  }

  /* fonts can shift tab widths — realign once they land */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { movePill(current, true); });
  }
  window.addEventListener('load', function () { movePill(current, true); });

  /* current year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

})();
