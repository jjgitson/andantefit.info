/**
 * AndanteFit Language Manager
 * 브라우저 언어를 감지해 /ko/ 또는 /es/ 경로로 자동 리다이렉트합니다.
 * 우선순위: localStorage 저장 설정 > navigator.languages > navigator.language
 *
 * 이 스크립트는 <head> 최상단에서 동기적으로 실행되어
 * 콘텐츠 렌더링 전에 리다이렉트를 수행합니다 (Flash 없음).
 */
(function () {
  'use strict';

  var SUPPORTED_LANGS = ['en', 'ko', 'es'];
  var KNOWN_PAGES = ['index.html', 'product.html', 'case-studies.html', 'validation.html', 'references.html'];
  var path = window.location.pathname;

  // /ko/ 또는 /es/ 경로에 이미 있으면 아무것도 하지 않음
  if (/^\/(ko|es)(\/|$)/.test(path)) return;

  // ── 1. localStorage 저장된 설정 확인 ─────────────────────────────
  var saved = localStorage.getItem('lang_preference');
  if (saved === 'en') return;                        // 영어 명시 선택 → 리다이렉트 안 함
  if (saved === 'ko' || saved === 'es') {
    redirect(saved);
    return;
  }

  // ── 2. 브라우저 언어 감지 (navigator.languages 우선) ──────────────
  var langs = [];
  if (navigator.languages && navigator.languages.length) {
    langs = Array.prototype.slice.call(navigator.languages);
  } else if (navigator.language) {
    langs = [navigator.language];
  }

  for (var i = 0; i < langs.length; i++) {
    var code = langs[i].toLowerCase();
    if (code === 'ko' || code.startsWith('ko-')) { redirect('ko'); return; }
    if (code === 'es' || code.startsWith('es-')) { redirect('es'); return; }
    // 영어 계열이 먼저 나오면 리다이렉트 안 함
    if (code === 'en' || code.startsWith('en-')) return;
  }

  // ── 헬퍼: 현재 파일명을 유지하며 언어 경로로 이동 ─────────────────
  function redirect(lang) {
    var segments = path.split('/').filter(Boolean);
    var filename = segments[segments.length - 1] || 'index.html';
    if (KNOWN_PAGES.indexOf(filename) === -1) filename = 'index.html';
    window.location.replace('/' + lang + '/' + filename);
  }
})();
