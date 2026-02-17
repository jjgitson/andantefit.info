// js/navigation.js
document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navigation-container');
    if (!navContainer) return;

    // 상단 예시와 동일한 영문 구조 (글로벌 표준)
    const navHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="../index.html" class="nav-logo">
          <img src="../assets/andantefit-logo.png" alt="AndanteFit">
        </a>
        <ul class="nav-menu" id="navMenu">
          <li><a href="../index.html" class="nav-link">Home</a></li>
          <li><a href="../product.html" class="nav-link">Product</a></li>
          <li><a href="../validation.html" class="nav-link">Validation</a></li>
          <li><a href="../case-studies.html" class="nav-link active">Case Studies</a></li>
          <li><a href="../references.html" class="nav-link">References</a></li>
        </ul>
        <div class="nav-lang">
          <a href="../../index.html">EN</a> <span class="sep">|</span>
          <a href="../index.html" class="active">KO</a> <span class="sep">|</span>
          <a href="../../es/index.html">ES</a>
        </div>
        <button class="nav-toggle" id="navToggle">☰</button>
      </div>
    </nav>`;

    navContainer.innerHTML = navHTML;

    // main.js의 이벤트를 다시 바인딩하거나 토글 기능을 실행
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.onclick = () => navMenu.classList.toggle('active');
    }
});
