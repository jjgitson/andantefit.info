document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) return;

    const path = window.location.pathname;
    const isKO = path.includes('/ko/');
    const isES = path.includes('/es/');
    const activeLang = isKO ? 'ko' : isES ? 'es' : 'en';

    // 폴더 깊이에 따른 루트 경로 계산
    let rootPath = './';
    if (path.includes('case-studies/')) {
        rootPath = '../../';
    } else if (isKO || isES) {
        rootPath = '../';
    }

    // 현재 페이지 파일명 추출 — 알려진 페이지면 유지, 아니면 index.html로 폴백
    const KNOWN_PAGES = ['index.html', 'product.html', 'case-studies.html', 'validation.html', 'references.html'];
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'index.html';
    const currentPage = KNOWN_PAGES.indexOf(lastSegment) !== -1 ? lastSegment : 'index.html';

    // 언어별 메뉴 라벨
    const labels = isKO ?
        { home: '홈', product: '제품', validation: '검증', cases: '사례 연구', refs: '참고문헌' } :
        isES ?
        { home: 'Inicio', product: 'Producto', validation: 'Validación', cases: 'Casos', refs: 'Referencias' } :
        { home: 'Home', product: 'Product', validation: 'Validation', cases: 'Case Studies', refs: 'References' };

    // 언어 링크 생성 — 현재 페이지 경로 기반, 현재 언어에 aria-current 부여
    function langLink(lang, label) {
        const href = lang === 'en' ? '/' + currentPage : '/' + lang + '/' + currentPage;
        const isCurrent = lang === activeLang;
        return '<a href="' + href + '" data-lang="' + lang + '"' +
               (isCurrent ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }

    const langHtml =
        langLink('en', 'EN') +
        ' <span class="sep">|</span> ' +
        langLink('ko', 'KO') +
        ' <span class="sep">|</span> ' +
        langLink('es', 'ES');

    const langPrefix = isKO ? 'ko/' : isES ? 'es/' : '';

    navContainer.innerHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="${rootPath}${langPrefix}index.html" class="nav-logo">
          <img src="${rootPath}assets/andantefit-logo.png" alt="AndanteFit">
        </a>
        <ul class="nav-menu" id="navMenu">
          <li><a href="${rootPath}${langPrefix}index.html">${labels.home}</a></li>
          <li><a href="${rootPath}${langPrefix}product.html">${labels.product}</a></li>
          <li><a href="${rootPath}${langPrefix}validation.html">${labels.validation}</a></li>
          <li><a href="${rootPath}${langPrefix}case-studies.html">${labels.cases}</a></li>
          <li><a href="${rootPath}${langPrefix}references.html">${labels.refs}</a></li>
          <li class="nav-lang-mobile">${langHtml}</li>
        </ul>
        <div class="nav-lang">${langHtml}</div>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">&#9776;</button>
      </div>
    </nav>`;

    // 언어 선택 클릭 시 lang_preference 저장 (자동 리다이렉트 기준)
    navContainer.querySelectorAll('[data-lang]').forEach(function(link) {
        link.addEventListener('click', function() {
            localStorage.setItem('lang_preference', this.getAttribute('data-lang'));
        });
    });

    // 모바일 토글 — active 클래스 + aria-expanded 동기화
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', function() {
            const isOpen = menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (!navContainer.contains(e.target) && menu.classList.contains('active')) {
                menu.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
