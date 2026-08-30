/* ═══════════════════════════════════════════════════════════
   Mål — language switcher
   · translates every data-i18n / data-i18n-html element on the page
   · persists the choice in localStorage (mal-lang), same pattern as
     the theme toggle
   · exposes window.MAL_t(key) and window.MAL_titleFor(view) so
     app.js can build language-aware <title> values on view swap
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'de', 'el', 'es', 'it', 'pl'];
  var STORE = 'mal-lang';
  var DICT = window.I18N || {};

  var FLAGS = {
    en: '🇬🇧',
    de: '🇩🇪',
    el: '🇬🇷',
    es: '🇪🇸',
    it: '🇮🇹',
    pl: '🇵🇱'
  };

  function detectLang() {
    try {
      var saved = localStorage.getItem(STORE);
      if (saved && SUPPORTED.indexOf(saved) > -1) return saved;
    } catch (e) { /* storage blocked */ }

    var nav = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) > -1 ? nav : 'en';
  }

  var currentLang = detectLang();

  /* ── translate a single key, falling back to English then the key itself ── */
  function t(key) {
    var langDict = DICT[currentLang] || {};
    if (Object.prototype.hasOwnProperty.call(langDict, key)) return langDict[key];
    var enDict = DICT.en || {};
    if (Object.prototype.hasOwnProperty.call(enDict, key)) return enDict[key];
    return key;
  }

  /* ── titles used for the <title> tag, language-aware ── */
  function titleFor(name) {
    if (name === 'terms')    return t('terms.title') + ' — Mål';
    if (name === 'privacy')  return t('privacy.title') + ' — Mål';
    if (name === 'delete')   return t('delete.title') + ' — Mål';
    if (name === 'releases') return t('releases.title') + ' — Mål';
    return 'Mål — Plan meals, waste less';
  }

  /* ── apply the current language to every marked element ── */
  function applyTranslations() {
    var textEls = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(textEls, function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });

    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    Array.prototype.forEach.call(htmlEls, function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });

    var attrEls = document.querySelectorAll('[data-i18n-attr-aria-label], [data-i18n-attr-title]');
    Array.prototype.forEach.call(attrEls, function (el) {
      var ariaKey = el.getAttribute('data-i18n-attr-aria-label');
      var titleKey = el.getAttribute('data-i18n-attr-title');
      if (ariaKey) el.setAttribute('aria-label', t(ariaKey));
      if (titleKey) el.setAttribute('title', t(titleKey));
    });

    document.documentElement.setAttribute('lang', currentLang);

    var flagEl = document.getElementById('lang-flag');
    var codeEl = document.getElementById('lang-code');
    if (flagEl) flagEl.textContent = FLAGS[currentLang] || '🌐';
    if (codeEl) codeEl.textContent = currentLang.toUpperCase();

    var options = document.querySelectorAll('#lang-menu [data-lang]');
    Array.prototype.forEach.call(options, function (opt) {
      var on = opt.getAttribute('data-lang') === currentLang;
      opt.setAttribute('aria-selected', on ? 'true' : 'false');
      opt.classList.toggle('is-active', on);
    });

    if (window.MAL_currentView) {
      document.title = titleFor(window.MAL_currentView);
    }
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) return;
    currentLang = lang;
    try { localStorage.setItem(STORE, lang); } catch (e) { /* storage blocked */ }
    applyTranslations();
  }

  /* ── switcher UI wiring ── */
  var switchEl = document.getElementById('lang-switch');
  var toggleBtn = document.getElementById('lang-toggle');
  var menu = document.getElementById('lang-menu');

  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  }

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu(); else closeMenu();
    });

    var options = Array.prototype.slice.call(menu.querySelectorAll('[data-lang]'));
    options.forEach(function (opt, idx) {
      opt.setAttribute('tabindex', '0');

      opt.addEventListener('click', function () {
        setLang(opt.getAttribute('data-lang'));
        closeMenu();
        toggleBtn.focus();
      });

      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setLang(opt.getAttribute('data-lang'));
          closeMenu();
          toggleBtn.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          (options[idx + 1] || options[0]).focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          (options[idx - 1] || options[options.length - 1]).focus();
        } else if (e.key === 'Escape') {
          closeMenu();
          toggleBtn.focus();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (switchEl && !switchEl.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── expose for app.js ── */
  window.MAL_t = t;
  window.MAL_titleFor = titleFor;

  applyTranslations();
})();
