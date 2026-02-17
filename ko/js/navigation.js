document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) return;

    // 현재 페이지가 case-studies 폴더 안에 있는지 확인
    const isSubPage = window.location.pathname.includes('case-studies');
    // 하위 페이지면 ../ 를, 루트 페이지면 ./ 를 사용
    const base = isSubPage ? '../' : './';
    const langBase = isSubPage ? '../../' : '../';

    navContainer.innerHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="${base}index.html" class="nav-logo">
          <img src="${base}assets/andantefit-logo.png" alt="AndanteFit">
        </a>
        <ul class="nav-menu" id="navMenu">
          <li><a href="${base}index.html" class="nav-link">Home</a></li>
          <li><a href="${base}product.html" class="nav-link">Product</a></li>
          <li><a href="${base}validation.html" class="nav-link">Validation</a></li>
          <li><a href="${base}case-studies.html" class="nav-link active">Case Studies</a></li>
          <li><a href="${base}references.html" class="nav-link">References</a></li>
        </ul>
        <div class="nav-lang">
          <a href="${langBase}index.html">EN</a> <span class="sep">|</span>
          <a href="${base}index.html" class="active">KO</a> <span class="sep">|</span>
          <a href="${langBase}es/index.html">ES</a>
        </div>
        <button class="nav-toggle" id="navToggle">☰</button>
      </div>
    </nav>`;

    // 모바일 토글 이벤트 재연결
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.onclick = () => navMenu.classList.toggle('active');
    }
});
