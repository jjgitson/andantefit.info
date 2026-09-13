// Sitewide case-study journey: read → related evidence → solution.
(function () {
  'use strict';

  const pathname = window.location.pathname;
  if (!pathname.includes('/case-studies/') || !pathname.endsWith('.html')) return;

  const lang = pathname.startsWith('/ko/') ? 'ko' : pathname.startsWith('/es/') ? 'es' : pathname.startsWith('/jp/') ? 'jp' : pathname.startsWith('/ru/') ? 'ru' : 'en';
  const filename = pathname.split('/').pop();

  const text = {
    ko: { heading:'이어서 살펴볼 내용', intro:'관련 근거를 더 살펴본 뒤, AndanteFit이 신체기능 평가를 어떻게 표준화하는지 확인할 수 있습니다.', evidence:'관련 근거', list:'← 케이스 스터디 목록으로', solution:'AndanteFit 솔루션 이해하기 →', listUrl:'/ko/case-studies.html', solutionUrl:'/ko/product.html', productUrl:'/ko/product.html', ctaTitle:'이 평가, 3분 안에 자동으로.', ctaSub:'AndanteFit은 SPPB 3개 항목을 LiDAR 센서로 자동 측정하고 채점합니다. 스톱워치도 바닥 표시도 필요 없고, 검사자 간 편차가 줄어듭니다.', ctaDoc:'자료 받기 (무료) →', ctaDemo:'데모 장비 문의 →', ctaHint:'3개 항목, 1분이면 됩니다. 2영업일 이내에 회신드립니다.', steps:['1. 읽기 완료','2. 관련 근거','3. 솔루션 이해'], stepsLabel:'콘텐츠 탐색 단계',navLabel:'이 페이지에서 이동하기' },
    en: { heading:'Continue exploring', intro:'Review related evidence, then see how AndanteFit standardizes physical-function assessment.', evidence:'Related evidence', list:'← Back to case studies', solution:'Understand the AndanteFit solution →', listUrl:'/case-studies.html', solutionUrl:'/product.html', productUrl:'/product.html', ctaTitle:'Automate this assessment in under 3 minutes.', ctaSub:'AndanteFit measures and scores all three SPPB subtests automatically with LiDAR — no stopwatch, no floor markings, and less inter-rater variability.', ctaDoc:'Get the documentation (free) →', ctaDemo:'Request a demo unit →', ctaHint:'Three fields, about a minute — we reply within two business days.', steps:['1. Read','2. Related evidence','3. The solution'], stepsLabel:'Content journey',navLabel:'Where to go next' },
    es: { heading:'Seguir explorando', intro:'Revise la evidencia relacionada y descubra cómo AndanteFit estandariza la evaluación de la función física.', evidence:'Evidencia relacionada', list:'← Volver a casos de estudio', solution:'Conocer la solución AndanteFit →', listUrl:'/es/case-studies.html', solutionUrl:'/es/product.html', productUrl:'/es/product.html', ctaTitle:'Automatice esta evaluación en menos de 3 minutos.', ctaSub:'AndanteFit administra y puntúa las tres subpruebas del SPPB automáticamente con LiDAR: sin cronómetro, sin marcas en el suelo y con menos variabilidad entre evaluadores.', ctaDoc:'Recibir la documentación (gratis) →', ctaDemo:'Solicitar una unidad de demostración →', ctaHint:'Tres campos, un minuto — respondemos en dos días laborables.', steps:['1. Leído','2. Evidencia relacionada','3. La solución'], stepsLabel:'Recorrido del contenido',navLabel:'A dónde ir después' },
    jp: { heading:'続けて読む', intro:'関連エビデンスを確認した後、AndanteFitによる身体機能評価の標準化をご覧いただけます。', evidence:'関連エビデンス', list:'← ケーススタディ一覧へ', solution:'AndanteFitのソリューションを見る →', listUrl:'/jp/case-studies.html', solutionUrl:'/jp/product.html', productUrl:'/jp/product.html', ctaTitle:'この評価を、3分以内に自動で。', ctaSub:'AndanteFitはLiDARセンサーでSPPB全3項目を自動測定・自動採点します。ストップウォッチも床マーキングも不要で、検査者間のばらつきを低減します。', ctaDoc:'資料を受け取る（無料）→', ctaDemo:'デモ機の貸出を相談 →', ctaHint:'日本語対応・2営業日以内にご返信します。', steps:['1. 読了','2. 関連エビデンス','3. ソリューション'], stepsLabel:'コンテンツの流れ',navLabel:'次に進む' },
    ru: { heading:'Продолжить изучение', intro:'Ознакомьтесь со связанными материалами и узнайте, как AndanteFit стандартизирует оценку физической функции.', evidence:'Связанные материалы', list:'← Ко всем практическим примерам', solution:'Узнать о решении AndanteFit →', listUrl:'/ru/case-studies.html', solutionUrl:'/ru/product.html', productUrl:'/ru/product.html', ctaTitle:'Автоматизируйте эту оценку менее чем за 3 минуты.', ctaSub:'AndanteFit проводит и оценивает все три субтеста SPPB автоматически с помощью LiDAR — без секундомера, без разметки на полу и с меньшей вариабельностью между специалистами.', ctaDoc:'Получить материалы (бесплатно) →', ctaDemo:'Запросить демо-устройство →', ctaHint:'Три поля, около минуты — отвечаем в течение двух рабочих дней.', steps:['1. Прочитано','2. Связанные материалы','3. Решение'], stepsLabel:'Порядок изучения',navLabel:'Куда перейти дальше' }
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
    style.textContent = '.af-post-reading{margin-top:56px;padding-top:34px;border-top:1px solid #e2e8f0}.af-post-reading-standalone{max-width:860px;margin:0 auto 56px;padding:34px 20px 0}.af-journey-steps{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px;color:#64748b;font-size:.78rem;font-weight:700}.af-journey-steps .is-current{color:#0F4C81}.af-post-reading h2{margin:0 0 8px!important;font-size:1.28rem!important;color:#0f172a}.af-post-reading-intro{margin:0 0 22px!important;color:#64748b!important;font-size:.95rem!important;line-height:1.75!important}.af-related-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.af-related-card{display:block;padding:20px;border:1px solid #e2e8f0;border-radius:10px;text-decoration:none;background:#fff;transition:.2s}.af-related-card:hover,.af-related-card:focus-visible{border-color:#18BFBF;box-shadow:0 8px 22px rgba(15,23,42,.07);transform:translateY(-2px);outline:none}.af-related-kicker{display:block;margin-bottom:8px;color:#0F4C81;font-size:.78rem;font-weight:700}.af-related-title{display:block;color:#0f172a;font-size:1rem;font-weight:700;line-height:1.55}.af-cta-band{margin-top:28px;padding:26px 28px;border-radius:12px;background:linear-gradient(135deg,#0F4C81 0%,#0B3A62 100%);color:#fff}.af-cta-band h3{margin:0 0 8px!important;font-size:1.08rem!important;font-weight:800;color:#fff!important;line-height:1.45}.af-cta-band p{margin:0 0 18px!important;font-size:.9rem!important;line-height:1.7!important;color:rgba(255,255,255,.85)!important}.af-cta-actions{display:flex;flex-wrap:wrap;gap:10px}.af-cta-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.9rem;line-height:1.4}.af-cta-doc{background:#18BFBF;color:#06323A}.af-cta-doc:hover{background:#14A8A8}.af-cta-demo{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.55)}.af-cta-demo:hover{background:rgba(255,255,255,.12)}.af-cta-hint{flex-basis:100%;margin:2px 0 0!important;font-size:.78rem!important;color:rgba(255,255,255,.6)!important}.af-next-actions{display:flex;flex-wrap:wrap;align-items:center;gap:4px 28px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}.af-next-actions a{display:inline-flex;align-items:center;min-height:44px;color:#475569;font-size:.9rem;font-weight:600;text-decoration:none;border-bottom:1px solid transparent;line-height:1.4}.af-next-actions a:hover,.af-next-actions a:focus-visible{color:#0F4C81;border-bottom-color:#0F4C81;outline:none}.af-solution{margin-left:auto}@media(max-width:640px){.af-related-grid{grid-template-columns:1fr}.af-cta-actions a{width:100%}.af-next-actions{flex-direction:column;align-items:flex-start;gap:0}.af-solution{margin-left:0}}';


    document.head.appendChild(style);
  }

  function render() {
    if (document.querySelector('.post-reading,.af-post-reading')) return;
    // Older case studies are React-rendered and have no <main>; there the
    // section goes just before the footer placeholder, which is in the static
    // markup and therefore present however late the app mounts.
    const host = document.querySelector('main') || document.querySelector('article');
    const target = host ? (host.querySelector('.article-body,.body') || host) : null;
    const anchor = target ? null
      : document.querySelector('footer') || document.querySelector('div[data-include]');
    if (!target && !anchor) return;
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

    // Three zones, in the order a reader moves through them and with distinct
    // visual weight: keep reading (cards), convert (the only filled buttons on
    // the page), then navigate away (plain text). Previously the navigation
    // pair sat above the CTA band as solid buttons, so the darkest, heaviest
    // control on the screen was a link to another page rather than the offer.
    section.innerHTML =
      '<div class="af-journey-steps" aria-label="' + esc(text.stepsLabel) + '">'
      + text.steps.map(function (step, i) {
          return '<span' + (i === 0 ? ' class="is-current"' : '') + '>' + esc(step) + '</span>'
            + (i < text.steps.length - 1 ? '<span aria-hidden="true">\u2192</span>' : '');
        }).join('')
      + '</div>'
      + '<h2 id="af-post-reading-title">' + text.heading + '</h2>'
      + '<p class="af-post-reading-intro">' + text.intro + '</p>'
      + related
      + '<div class="af-cta-band"><h3>' + text.ctaTitle + '</h3><p>' + text.ctaSub + '</p>'
      + '<div class="af-cta-actions">'
      + '<a class="af-cta-doc" href="' + text.productUrl + '?req=doc#materials" data-af-event="cta_click" data-af-location="post_reading_cta" data-af-label="doc">' + text.ctaDoc + '</a>'
      + '<a class="af-cta-demo" href="' + text.productUrl + '?req=demo#materials" data-af-event="cta_click" data-af-location="post_reading_cta" data-af-label="demo">' + text.ctaDemo + '</a>'
      + '<p class="af-cta-hint">' + text.ctaHint + '</p></div></div>'
      + '<nav class="af-next-actions" aria-label="' + esc(text.navLabel) + '">'
      + '<a class="af-back" href="' + text.listUrl + '" data-af-event="view_item_list" data-af-label="case_studies" data-af-location="post_reading">' + text.list + '</a>'
      + '<a class="af-solution" href="' + solutionUrl + '" data-af-event="select_content" data-af-label="solution" data-af-location="post_reading">' + text.solution + '</a>'
      + '</nav>';
    // The article template ends with its own back-to-list link, and this block
    // now carries one too - two links to the same page, worded differently
    // ("Evidence & Insights list" vs "case studies list"). Drop the template's.
    const dupe = document.querySelector('a.back-link[href="' + text.listUrl + '"]');
    if (dupe) dupe.remove();

    if (target) target.appendChild(section);
    else { section.classList.add('af-post-reading-standalone'); anchor.parentNode.insertBefore(section, anchor); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();