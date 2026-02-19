document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) return;

    const path = window.location.pathname;
    const isKO = path.includes('/ko/');
    const isES = path.includes('/es/');

    // 폴더 깊이에 따른 루트 경로 계산
    let rootPath = './';
    if (path.includes('case-studies/')) {
        rootPath = '../../';
    } else if (isKO || isES) {
        rootPath = '../';
    }

    // 언어별 메뉴 라벨
    const labels = isKO ? 
        { home: "홈", product: "제품", validation: "검증", cases: "사례 연구", refs: "참고문헌" } :
        isES ? 
        { home: "Inicio", product: "Producto", validation: "Validación", cases: "Casos", refs: "Referencias" } :
        { home: "Home", product: "Product", validation: "Validation", cases: "Case Studies", refs: "References" };

    navContainer.innerHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}index.html" class="nav-logo">
          <img src="${rootPath}assets/andantefit-logo.png" alt="AndanteFit">
        </a>
        <ul class="nav-menu" id="navMenu">
          <li><a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}index.html">${labels.home}</a></li>
          <li><a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}product.html">${labels.product}</a></li>
          <li><a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}validation.html">${labels.validation}</a></li>
          <li><a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}case-studies.html">${labels.cases}</a></li>
          <li><a href="${rootPath}${isKO ? 'ko/' : isES ? 'es/' : ''}references.html">${labels.refs}</a></li>
          <li class="nav-lang-mobile">
            <a href="/index.html" data-lang="en">EN</a> | <a href="/ko/index.html" data-lang="ko">KO</a> | <a href="/es/index.html" data-lang="es">ES</a>
          </li>
        </ul>
        <div class="nav-lang">
          <a href="/index.html" data-lang="en">EN</a> | <a href="/ko/index.html" data-lang="ko">KO</a> | <a href="/es/index.html" data-lang="es">ES</a>
        </div>
        <button class="nav-toggle" id="navToggle">☰</button>
      </div>
    </nav>`;

    // 언어 선택 클릭 시 lang_preference 저장 (이후 자동 리다이렉트 기준)
    navContainer.querySelectorAll('[data-lang]').forEach(function(link) {
        link.addEventListener('click', function() {
            localStorage.setItem('lang_preference', this.getAttribute('data-lang'));
        });
    });

    // 모바일 토글 로직 유지
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.onclick = () => menu.classList.toggle('active');
    }
});
