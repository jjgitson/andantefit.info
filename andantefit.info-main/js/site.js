(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!btn || !nav) return;

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    };

  // 초기 상태
  setOpen(false);

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  // 바깥 클릭 닫기
  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    if (btn.getAttribute("aria-expanded") !== "true") return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });

  // ESC 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // 링크 클릭 시 닫기 (모바일만)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (isMobile()) setOpen(false);
  });

  // 데스크톱으로 돌아오면 강제로 닫기
  window.addEventListener("resize", () => {
    if (!isMobile()) setOpen(false);
  });
})();
