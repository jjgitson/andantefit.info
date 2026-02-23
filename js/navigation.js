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
        { home: '홈', product: '제품', validation: '검증', cases: '사례 연구', refs: '주요 도입처' } :
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

    // 내비게이션 링크 배열 (데스크톱 메뉴 + 모바일 오버레이 공유)
    const navItems = [
        { href: rootPath + langPrefix + 'index.html',        label: labels.home },
        { href: rootPath + langPrefix + 'product.html',      label: labels.product },
        { href: rootPath + langPrefix + 'validation.html',   label: labels.validation },
        { href: rootPath + langPrefix + 'case-studies.html', label: labels.cases },
        { href: rootPath + langPrefix + 'references.html',   label: labels.refs },
    ];

    const navLinksHtml = navItems.map(function(item) {
        return '<li><a href="' + item.href + '">' + item.label + '</a></li>';
    }).join('');

    const closeLabel  = isKO ? '메뉴 닫기'      : isES ? 'Cerrar menú'       : 'Close menu';
    const panelLabel  = isKO ? '모바일 내비게이션' : isES ? 'Navegación móvil'  : 'Mobile navigation';

    navContainer.innerHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="${rootPath}${langPrefix}index.html" class="nav-logo">
          <img src="${rootPath}assets/andantefit-logo.png" alt="AndanteFit">
        </a>
        <!-- Desktop: always-visible nav links and lang switcher -->
        <ul class="nav-menu" id="navMenu">${navLinksHtml}</ul>
        <div class="nav-lang">${langHtml}</div>
        <!-- Mobile: hamburger toggle -->
        <button class="nav-toggle" id="navToggle"
                aria-label="Open navigation menu"
                aria-expanded="false"
                aria-controls="navOverlay">&#9776;</button>
      </div>
    </nav>

    <!-- Mobile overlay panel (fixed, outside nav bar flow) -->
    <div class="nav-overlay" id="navOverlay" aria-hidden="true">
      <div class="nav-overlay-dim" id="navOverlayDim"></div>
      <nav class="nav-overlay-panel" aria-label="${panelLabel}">
        <button class="nav-overlay-close" id="navOverlayClose"
                aria-label="${closeLabel}">&#x2715;</button>
        <ul class="nav-overlay-links">${navLinksHtml}</ul>
        <div class="nav-overlay-lang">${langHtml}</div>
      </nav>
    </div>`;

    // 언어 선택 클릭 시 lang_preference 저장 (자동 리다이렉트 기준)
    navContainer.querySelectorAll('[data-lang]').forEach(function(link) {
        link.addEventListener('click', function() {
            localStorage.setItem('lang_preference', this.getAttribute('data-lang'));
        });
    });

    // 오버레이 열기 / 닫기
    const toggle  = document.getElementById('navToggle');
    const overlay = document.getElementById('navOverlay');
    const dim     = document.getElementById('navOverlayDim');
    const closeBtn = document.getElementById('navOverlayClose');

    function openMenu() {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (toggle)   toggle.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (dim)      dim.addEventListener('click', closeMenu);

    // 오버레이 내 링크(nav + 언어) 클릭 시 즉시 닫기
    if (overlay) {
        overlay.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });
    }

    // Escape 키로 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
            closeMenu();
            if (toggle) toggle.focus();
        }
    });
});
