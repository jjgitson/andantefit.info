// Sitewide case-study journey: read → related evidence → solution.
(function () {
  'use strict';

  const pathname = window.location.pathname;
  if (!pathname.includes('/case-studies/') || !pathname.endsWith('.html')) return;

  const lang = pathname.startsWith('/ko/') ? 'ko' : pathname.startsWith('/es/') ? 'es' : pathname.startsWith('/jp/') ? 'jp' : 'en';
  const filename = pathname.split('/').pop();

  const text = {
    ko: { heading:'이어서 살펴볼 내용', intro:'관련 근거를 더 살펴본 뒤, AndanteFit이 신체기능 평가를 어떻게 표준화하는지 확인할 수 있습니다.', evidence:'관련 근거', list:'← 케이스 스터디 목록으로', solution:'AndanteFit 솔루션 이해하기 →', listUrl:'/ko/case-studies.html', solutionUrl:'/ko/product.html' },
    en: { heading:'Continue exploring', intro:'Review related evidence, then see how AndanteFit standardizes physical-function assessment.', evidence:'Related evidence', list:'← Back to case studies', solution:'Understand the AndanteFit solution →', listUrl:'/case-studies.html', solutionUrl:'/product.html' },
    es: { heading:'Seguir explorando', intro:'Revise la evidencia relacionada y descubra cómo AndanteFit estandariza la evaluación de la función física.', evidence:'Evidencia relacionada', list:'← Volver a casos de estudio', solution:'Conocer la solución AndanteFit →', listUrl:'/es/case-studies.html', solutionUrl:'/es/product.html' },
    jp: { heading:'続けて読む', intro:'関連エビデンスを確認した後、AndanteFitによる身体機能評価の標準化をご覧いただけます。', evidence:'関連エビデンス', list:'← ケーススタディ一覧へ', solution:'AndanteFitのソリューションを見る →', listUrl:'/jp/case-studies.html', solutionUrl:'/jp/product.html' }
  }[lang];

  const koGroups = [
    { test:/Oncology|Cancer|Gastrectomy|Prehabilitation|Perioperative/i, solution:'/ko/sppb.html', items:[
      ['2026-02-20-Oncology-SPPB-AndanteFit-KR.html','항암 환자에서 신체기능평가(SPPB)가 중요한 이유'],
      ['2026-07-11-Sarcopenia-Drug-Development-SPPB-KR.html','근육량보다 신체기능이 중요한 이유'] ] },
    { test:/Sarcopenia|Muscle|GLP1|BNR17/i, solution:'/ko/sppb.html', items:[
      ['2026-04-06-Sarcopenia-Management-Korea-KR.html','근감소증 관리의 전환과 한국의 적용'],
      ['2026-07-28-ADA2026-GLP1-Muscle-Loss-Debate-KR.html','GLP-1 체중감량에서 근육 손실은 실제 위험인가'] ] },
    { test:/Frailty|Community|CIBERFES|4Ms|Digital-Care/i, solution:'/ko/sppb.html', items:[
      ['2026-02-18-Community-Frailty-Prevention-Program-KR.html','지역사회 노쇠예방프로그램'],
      ['2026-02-13-CIBERFES-Consensus-Frailty-Screening-KR.html','CIBERFES 컨센서스: 노쇠 스크리닝 표준화'] ] },
    { test:/Heart-Failure|Cardiopulmonary|Stroke|Rehab/i, solution:'/ko/sppb.html', items:[
      ['2026-02-22-Heart-Failure-Cardiopulmonary-Rehab-SPPB-KR.html','심부전·심폐재활에서의 SPPB 활용'],
      ['2026-02-20-Oncology-SPPB-AndanteFit-KR.html','입원 환자에서 기능평가가 중요한 이유'] ] },
    { test:/Occupational|Work|Checkup|CSR/i, solution:'/ko/product.html', items:[
      ['2026-02-07-SPPB-Occupational-Health-KR.html','산업보건 현장에서의 SPPB 활용'],
      ['2026-02-18-Checkup-Event-Community-CSR-KR.html','신체나이 체크업 이벤트'] ] }
  ];

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; });
  }

  function injectStyles() {
    if (document.getElementById('af-post-reading-style')) return;
    const style = document.createElement('style');
    style.id = 'af-post-reading-style';
    style.textContent = '.af-post-reading{margin-top:56px;padding-top:34px;border-top:1px solid #e2e8f0}.af-post-reading h2{margin:0 0 8px!important;font-size:1.28rem!important;color:#0f172a}.af-post-reading-intro{margin:0 0 22px!important;color:#64748b!important;font-size:.95rem!important;line-height:1.75!important}.af-related-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.af-related-card{display:block;padding:20px;border:1px solid #e2e8f0;border-radius:10px;text-decoration:none;background:#fff;transition:.2s}.af-related-card:hover,.af-related-card:focus-visible{border-color:#5eead4;box-shadow:0 8px 22px rgba(15,23,42,.07);transform:translateY(-2px);outline:none}.af-related-kicker{display:block;margin-bottom:8px;color:#0d9488;font-size:.78rem;font-weight:700}.af-related-title{display:block;color:#0f172a;font-size:1rem;font-weight:700;line-height:1.55}.af-next-actions{display:flex;gap:12px;margin-top:24px}.af-next-actions a{display:flex;flex:1;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;line-height:1.4}.af-back{color:#0f766e;border:1px solid #99f6e4;background:#f0fdfa}.af-solution{color:#fff;background:#0f766e;border:1px solid #0f766e}.af-back:hover{background:#ccfbf1}.af-solution:hover{background:#115e59}@media(max-width:640px){.af-related-grid{grid-template-columns:1fr}.af-next-actions{flex-direction:column}.af-next-actions a{width:100%}}';
    document.head.appendChild(style);
  }

  function render() {
    if (document.querySelector('.post-reading,.af-post-reading')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const target = main.querySelector('.article-body,.body') || main;
    const group = lang === 'ko' ? koGroups.find(function (g) { return g.test.test(filename); }) : null;
    const items = group ? group.items.filter(function (item) { return item[0] !== filename; }).slice(0,2) : [];
    const solutionUrl = group ? group.solution : text.solutionUrl;

    injectStyles();
    const section = document.createElement('section');
    section.className = 'af-post-reading';
    section.setAttribute('aria-labelledby','af-post-reading-title');

    let related = '';
    if (items.length) {
      related = '<div class="af-related-grid">' + items.map(function (item) {
        return '<a class="af-related-card" href="/ko/case-studies/' + esc(item[0]) + '" data-af-event="select_content" data-af-label="' + esc(item[1]) + '" data-af-location="post_reading_related"><span class="af-related-kicker">' + text.evidence + '</span><span class="af-related-title">' + esc(item[1]) + '</span></a>';
      }).join('') + '</div>';
    }

    section.innerHTML = '<h2 id="af-post-reading-title">' + text.heading + '</h2><p class="af-post-reading-intro">' + text.intro + '</p>' + related + '<nav class="af-next-actions" aria-label="Post-reading navigation"><a class="af-back" href="' + text.listUrl + '" data-af-event="view_item_list" data-af-label="case_studies" data-af-location="post_reading">' + text.list + '</a><a class="af-solution" href="' + solutionUrl + '" data-af-event="select_content" data-af-label="solution" data-af-location="post_reading">' + text.solution + '</a></nav>';
    target.appendChild(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();