const fs = require("fs");
const path = require("path");

// ---- embed subset fonts as base64 woff2 ----
const fdir = path.join(__dirname, "fonts");
const b64 = (f) => fs.readFileSync(path.join(fdir, f)).toString("base64");
const fontFace = (fam, file, weight, style) =>
  `@font-face{font-family:'${fam}';font-weight:${weight};font-style:${style};font-display:block;` +
  `src:url(data:font/woff2;base64,${b64(file)}) format('woff2');}`;

const fontsCss = [
  fontFace("LibSans", "sans.woff2", 400, "normal"),
  fontFace("LibSans", "sansB.woff2", 700, "normal"),
  fontFace("LibSans", "sansI.woff2", 400, "italic"),
  fontFace("LibSerif", "serifB.woff2", 700, "normal"),
].join("");

// ---- inline SVG icons (feather-style, currentColor) ----
const I = {
  match: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-2 2-2-2"/>',
  coord: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lang: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z"/>',
  journey: '<circle cx="12" cy="12" r="10"/><polygon points="16 8 10 10 8 16 14 14 16 8"/>',
  hospital: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  whats: '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 21l1.5-5.5a8.5 8.5 0 1 1 16.5-4z"/>',
  weight: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  men: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>',
  derma: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>',
  regen: '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
function icon(name, cls, sw) {
  return `<svg class="ic ${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;
}
// logo symbol: location pin containing a medical plus (place + care)
const logoSymbol = `<svg class="logo-sym" viewBox="0 0 40 48" fill="none" aria-hidden="true">
  <path d="M20 2C11.2 2 4 9.1 4 17.8C4 29 20 46 20 46S36 29 36 17.8C36 9.1 28.8 2 20 2Z" fill="currentColor"/>
  <path d="M20 10.5V25M12.8 17.8H27.2" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
</svg>`;

// ---- skyline (vector) ----
function skyline() {
  const b = [[0,34,42],[40,30,60],[76,26,34],[106,40,72],[152,30,48],[188,24,65],[218,36,40],[260,30,75],[296,26,45],[328,34,58]];
  const base = 100;
  let r = "";
  b.forEach((d, i) => {
    const [x, w, h] = d;
    const col = i % 4 === 3 ? "#0E9C9C" : "#1E5B86";
    r += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${col}"/>`;
    if (h > 60) r += `<rect x="${x + w * 0.38}" y="${base - h + 10}" width="5" height="5" fill="#18BFBF"/>`;
  });
  return `<svg class="sky" viewBox="0 0 362 100" preserveAspectRatio="none" aria-hidden="true">${r}<line x1="0" y1="100" x2="362" y2="100" stroke="#17517A" stroke-width="2"/></svg>`;
}

// ---- data ----
const feats = [
  ["match", "Personalized hospital matching"],
  ["coord", "Appointment & medical record coordination"],
  ["lang", "Multilingual patient support"],
  ["journey", "Guided care journey — inquiry to follow-up"],
  ["hospital", "Access to major hospitals & specialty centers"],
];
const big5 = [
  ["Seoul National University Hospital", "Flagship national university hospital"],
  ["Asan Medical Center", "One of Korea's largest medical centers"],
  ["Samsung Medical Center", "Leading university-affiliated tertiary hospital"],
  ["Severance Hospital", "Historic leading teaching hospital"],
  ["Seoul St. Mary's Hospital", "Major Catholic university hospital"],
];
const extra = [
  ["Ewha Womans University Seoul Hospital", "Modern tertiary hospital in western Seoul"],
  ["Incheon Sejong Hospital", "Cardiovascular & bariatric / metabolic care pathways"],
];
const pcards = [
  ["weight", "NextWeight", "Obesity & metabolic care", "Evidence-based guidance for obesity treatment, bariatric surgery, and metabolic care in Korea.", "nextweight.kr"],
  ["men", "Men's Form", "Men's health & procedures", "Focused guidance for men's urology, personal procedures, and related consultation pathways.", "mensform.kr"],
  ["derma", "Longevity Seoul", "Dermatology, aesthetics & healthy ageing", "Curated access to skin, aesthetic, and healthy ageing pathways in Korea.", "longevityseoul.kr"],
  ["regen", "RegenValue", "Regenerative medicine information", "A platform for exploring regenerative medicine information and guided inquiry pathways.", "regenvalue.com"],
];
const steps = [
  ["Initial inquiry", "Share your goals, symptoms, or treatment interest."],
  ["Medical information review", "We review available records and care needs."],
  ["Hospital matching", "Appropriate hospitals or clinics are suggested."],
  ["Appointment planning", "Scheduling, document support, and preparation."],
  ["Treatment in Korea", "Guided access to your selected medical pathway."],
  ["Follow-up support", "Post-visit communication and next-step guidance."],
];
const paths = ["nextweight.kr", "mensform.kr", "longevityseoul.kr", "regenvalue.com"];

// ---- panel builders ----
function coverPanel() {
  return `<section class="panel cover">
    <div class="cover-base"></div>
    <div class="pad">
      <div class="logo">${logoSymbol}<span class="wm">kordy</span></div>
      <div class="eyebrow">MEDICAL ACCESS IN KOREA</div>
      <div class="eyebrow-rule"></div>
      <h1 class="cover-h">Trusted Access to Medical Care in Korea</h1>
      <p class="cover-sub">Kordy connects international patients with leading hospitals, specialist pathways, and guided care coordination across Korea.</p>
      <p class="cover-supp">A structured gateway to hospital access, treatment planning, and patient support in Korea.</p>
      <div class="cover-fill"></div>
      ${skyline()}
      <div class="trust"><span class="trust-ic">${icon("globe")}</span><span>Operated by DYPHI, a registered medical tourism facilitator in Korea.</span></div>
      <div class="cover-foot">kordy.kr</div>
    </div>
  </section>`;
}
function backPanel() {
  const featRows = feats.map(([ic, t]) =>
    `<li><span class="chip chip-lt">${icon(ic)}</span><span>${t}</span></li>`).join("");
  const pathCells = paths.map((u) => `<div class="pw-cell"><span class="dot"></span>${u}</div>`).join("");
  return `<section class="panel back">
    <div class="pad">
      <h2 class="sec">Why Kordy</h2><div class="sec-rule"></div>
      <ul class="feat">${featRows}</ul>
      <p class="body muted">For many international patients, choosing the right hospital in Korea can be complex. Kordy helps simplify that process by guiding patients to appropriate institutions, treatment pathways, and next-step planning.</p>
      <div class="cta">
        <div class="cta-l">
          <div class="cta-h">Start Your Inquiry</div>
          <div class="cta-web"><span class="ink">Website:&nbsp;</span><b>kordy.kr</b></div>
          <div class="cta-row"><span class="chip chip-teal sm">${icon("whats")}</span>WhatsApp: +82 ___ ____ ____</div>
          <div class="cta-row"><span class="chip chip-teal sm">${icon("mail")}</span>Email: hello@kordy.kr</div>
        </div>
        <div class="qr"><div class="qr-inner">QR<br>placeholder</div></div>
      </div>
      <div class="pw-label">Specialty pathways</div>
      <div class="pw-grid">${pathCells}</div>
      <div class="thin-rule"></div>
      <p class="foot-note">Kordy is a patient guidance platform designed to help international patients explore appropriate care options in Korea.</p>
    </div>
  </section>`;
}
function hospitalsPanel() {
  const b5 = big5.map(([n, d]) =>
    `<div class="hcard"><span class="chip chip-navy">${icon("plus")}</span><div class="hc-txt"><div class="hc-name">${n}</div><div class="hc-desc">${d}</div></div></div>`).join("");
  const ex = extra.map(([n, d]) =>
    `<div class="hcard hi"><span class="chip chip-teal">${icon("plus")}</span><div class="hc-txt"><div class="hc-name">${n}</div><div class="hc-desc td">${d}</div></div></div>`).join("");
  return `<section class="panel hosp">
    <div class="pad">
      <h2 class="sec">Access to Korea's Leading Hospitals</h2><div class="sec-rule"></div>
      <p class="body muted">Kordy helps patients navigate major tertiary hospitals and selected specialty centers based on diagnosis, treatment goals, and care needs.</p>
      <div class="mini-label">REPRESENTATIVE HOSPITAL ACCESS</div>
      <div class="hlist">${b5}${ex}</div>
      <p class="disc">Representative institutions are shown for informational purposes. Final hospital recommendation depends on each patient's medical needs and consultation pathway.</p>
    </div>
  </section>`;
}
function pathwaysPanel() {
  const cards = pcards.map(([ic, n, cat, d, u]) =>
    `<div class="pcard"><span class="chip chip-teal lg">${icon(ic)}</span><div class="pc-txt"><div class="pc-name">${n}</div><div class="pc-cat">${cat}</div><div class="pc-desc">${d}</div><div class="pc-url">${u}</div></div></div>`).join("");
  const st = steps.map(([t, d], i) =>
    `<li><span class="stepn">${i + 1}</span><span class="step-txt"><b>${t}</b>&nbsp;&nbsp;${d}</span></li>`).join("");
  return `<section class="panel path">
    <div class="pad">
      <h2 class="sec">Specialized Care Pathways</h2><div class="sec-rule"></div>
      <p class="body muted">Kordy connects patients to focused information and care pathways through dedicated websites.</p>
      <div class="pgrid">${cards}</div>
      <h3 class="sub">How Kordy Works</h3>
      <ol class="steps">${st}</ol>
      <p class="disc">The final hospital and treatment pathway depend on individual medical needs and provider review.</p>
    </div>
  </section>`;
}

// crop + fold marks for a sheet
const marks = `
  <div class="cm" style="left:5mm;top:0;width:.3mm;height:2.6mm"></div><div class="cm" style="left:0;top:5mm;width:2.6mm;height:.3mm"></div>
  <div class="cm" style="left:205mm;top:0;width:.3mm;height:2.6mm"></div><div class="cm" style="left:207.4mm;top:5mm;width:2.6mm;height:.3mm"></div>
  <div class="cm" style="left:5mm;top:217.4mm;width:.3mm;height:2.6mm"></div><div class="cm" style="left:0;top:215mm;width:2.6mm;height:.3mm"></div>
  <div class="cm" style="left:205mm;top:217.4mm;width:.3mm;height:2.6mm"></div><div class="cm" style="left:207.4mm;top:215mm;width:2.6mm;height:.3mm"></div>
  <div class="fold" style="left:105mm;top:0;width:.3mm;height:2.6mm"></div><div class="fold" style="left:105mm;top:217.4mm;width:.3mm;height:2.6mm"></div>
`;

function sheet(label, left, right) {
  return `<div class="sheet"><span class="sheet-tag">${label}</span>${marks}
    <div class="art"><div class="fold-guide"></div>${left}${right}</div>
  </div>`;
}

const CSS = `
${fontsCss}
:root{
  --navy:#0E3A5F;--navy-d:#0A2C48;--teal:#18BFBF;--teal-d:#0E9C9C;
  --gray:#F1F5F9;--gray2:#E9F7F7;--border:#D8E1E8;--text:#1B2A3A;--muted:#667889;--ink:#AFC7D8;
  --serif:'LibSerif',Georgia,'Times New Roman',serif;
  --sans:'LibSans',Arial,Helvetica,sans-serif;
}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
html,body{margin:0;padding:0;font-family:var(--sans);color:var(--text);}
@page{size:210mm 220mm;margin:0;}
.sheet{position:relative;width:210mm;height:220mm;background:#fff;overflow:hidden;page-break-after:always;}
.sheet:last-child{page-break-after:auto;}
.art{position:absolute;left:3mm;top:3mm;width:204mm;height:214mm;}
.cm{position:absolute;background:#000;}
.fold{position:absolute;background:#9aa7b2;}
.fold-guide{position:absolute;left:102mm;top:2mm;width:0;height:210mm;border-left:.2mm dashed #c9d3db;}
.sheet-tag{position:absolute;left:3mm;top:1mm;font-size:6pt;letter-spacing:.08em;color:#9aa7b2;text-transform:uppercase;}
.panel{position:absolute;top:0;height:214mm;}
.panel.back,.panel.hosp{left:0;width:102mm;padding:5mm 4mm 5mm 5mm;}
.panel.cover,.panel.path{left:102mm;width:102mm;padding:5mm 5mm 5mm 4mm;}
.pad{position:relative;width:100%;height:100%;}
.ic{width:1em;height:1em;display:block;}
.chip{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex:none;}
.chip-lt{width:8.2mm;height:8.2mm;background:var(--gray);color:var(--teal-d);}
.chip-lt .ic{width:4.4mm;height:4.4mm;}
.chip-navy{width:7mm;height:7mm;background:var(--navy);color:#fff;}
.chip-teal{width:7mm;height:7mm;background:var(--teal-d);color:#fff;}
.chip-navy .ic,.chip-teal .ic{width:3.6mm;height:3.6mm;stroke-width:2.6;}
.chip.lg{width:8.4mm;height:8.4mm;background:var(--teal);}
.chip.lg .ic{width:4.4mm;height:4.4mm;}
.chip.sm{width:6mm;height:6mm;background:var(--teal);}
.chip.sm .ic{width:3.2mm;height:3.2mm;}

/* headings */
.sec{font-family:var(--serif);font-weight:700;color:var(--navy);font-size:19pt;line-height:1.06;margin:0;}
.sec-rule{width:15mm;height:.9mm;background:var(--teal);border-radius:1mm;margin:2.4mm 0 2.6mm;}
.sub{font-family:var(--serif);font-weight:700;color:var(--navy);font-size:14pt;margin:1mm 0 2.4mm;}
.body{font-size:9.5pt;line-height:1.34;margin:0;}
.muted{color:var(--muted);}
.mini-label{font-size:8.5pt;font-weight:700;letter-spacing:.09em;color:var(--teal-d);margin:3mm 0 2.2mm;}

/* cover */
.cover{background:var(--navy);color:#fff;}
.cover-base{position:absolute;left:0;right:0;bottom:0;height:52mm;background:var(--navy-d);z-index:0;}
.cover .pad{display:flex;flex-direction:column;height:100%;position:relative;z-index:1;}
.logo{display:flex;align-items:center;gap:3mm;margin-top:1mm;}
.logo-sym{width:11mm;height:13.2mm;color:var(--teal);flex:none;}
.wm{font-family:var(--serif);font-weight:700;font-size:33pt;letter-spacing:-.01em;line-height:1;}
.eyebrow{margin-top:5mm;color:var(--teal);font-size:9.5pt;font-weight:700;letter-spacing:.22em;}
.eyebrow-rule{width:16mm;height:.8mm;background:var(--teal);margin-top:2mm;}
.cover-h{font-family:var(--serif);font-weight:700;font-size:25pt;line-height:1.08;margin:9mm 0 0;color:#fff;}
.cover-sub{font-size:11.5pt;line-height:1.36;color:var(--ink);margin:7mm 0 0;}
.cover-supp{font-style:italic;color:var(--teal);font-size:10.5pt;line-height:1.32;margin:5mm 0 0;}
.cover-fill{flex:1 1 auto;min-height:3mm;}
.sky{width:100%;height:27mm;display:block;margin-bottom:4.5mm;}
.trust{display:flex;align-items:center;gap:2.6mm;color:var(--ink);font-size:9pt;line-height:1.2;}
.trust-ic{color:var(--teal);width:5mm;height:5mm;flex:none;}
.trust-ic .ic{width:5mm;height:5mm;}
.cover-foot{font-weight:700;font-size:15pt;margin-top:3.4mm;}

/* back cover */
.feat{list-style:none;margin:0;padding:0;}
.feat li{display:flex;align-items:center;gap:3mm;font-size:10.5pt;color:var(--text);min-height:9.6mm;}
.cta{margin-top:3mm;background:var(--navy);border-radius:2mm;color:#fff;padding:3.4mm 4mm;display:flex;gap:3mm;}
.cta-l{flex:1 1 auto;min-width:0;}
.cta-h{font-family:var(--serif);font-weight:700;font-size:14pt;}
.cta-web{font-size:10.5pt;margin-top:1.6mm;}
.cta-web .ink{color:var(--ink);} .cta-web b{color:var(--teal);}
.cta-row{display:flex;align-items:center;gap:2.4mm;font-size:8.5pt;color:var(--ink);margin-top:2.6mm;}
.qr{flex:none;width:24mm;height:24mm;background:#fff;border:.4mm solid var(--teal);border-radius:1.4mm;padding:2.2mm;align-self:center;}
.qr-inner{width:100%;height:100%;background:#E8EEF2;border:.3mm solid var(--border);display:flex;align-items:center;justify-content:center;text-align:center;color:var(--muted);font-size:7.5pt;line-height:1.25;}
.pw-label{font-weight:700;color:var(--navy);font-size:10.5pt;margin-top:3.6mm;}
.pw-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.6mm 3mm;margin-top:2mm;}
.pw-cell{display:flex;align-items:center;gap:2mm;font-size:10pt;color:var(--text);}
.dot{width:1.8mm;height:1.8mm;border-radius:50%;background:var(--teal);flex:none;}
.thin-rule{height:.3mm;background:var(--border);margin:3.4mm 0 2.2mm;}
.foot-note{font-style:italic;color:var(--muted);font-size:8pt;line-height:1.3;margin:0;}

/* hospitals */
.hlist{display:flex;flex-direction:column;gap:1.7mm;}
.hcard{display:flex;align-items:center;gap:3mm;background:var(--gray);border:.3mm solid var(--border);border-radius:1.4mm;padding:2.5mm 3mm;}
.hcard.hi{background:var(--gray2);border-color:var(--teal);}
.hc-name{font-weight:700;color:var(--navy);font-size:10pt;line-height:1.1;}
.hc-desc{color:var(--muted);font-size:8pt;margin-top:.6mm;}
.hc-desc.td{color:var(--teal-d);}
.disc{font-style:italic;color:var(--muted);font-size:7.5pt;line-height:1.3;margin:3mm 0 0;}

/* pathways */
.pgrid{display:flex;flex-direction:column;gap:2mm;}
.pcard{display:flex;gap:3mm;align-items:center;background:var(--gray);border:.3mm solid var(--border);border-radius:1.4mm;padding:2.6mm 3mm;}
.pc-name{font-weight:700;color:var(--navy);font-size:11pt;line-height:1.05;}
.pc-cat{font-style:italic;color:var(--teal-d);font-size:8pt;margin-top:.5mm;}
.pc-desc{color:var(--muted);font-size:7.6pt;line-height:1.25;margin-top:1mm;}
.pc-url{font-weight:700;color:var(--teal-d);font-size:8.5pt;margin-top:1mm;}
.steps{list-style:none;margin:0;padding:0;}
.steps li{display:flex;align-items:center;gap:2.8mm;min-height:8.4mm;position:relative;}
.steps li:not(:last-child)::before{content:"";position:absolute;left:2.75mm;top:6.4mm;width:.3mm;height:3.2mm;background:var(--border);}
.stepn{flex:none;width:5.5mm;height:5.5mm;border-radius:50%;background:var(--navy);color:#fff;font-size:9pt;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:1;}
.step-txt{font-size:8.5pt;line-height:1.16;} .step-txt b{color:var(--text);}

/* screen presentation only */
@media screen{
  body{background:#eef2f6;padding:26px 12px 60px;}
  .toolbar{max-width:794px;margin:0 auto 20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-family:var(--sans);}
  .toolbar h1{font-size:16px;margin:0 auto 0 0;color:var(--navy);font-family:var(--serif);}
  .toolbar a,.toolbar button{font:600 13px var(--sans);padding:8px 14px;border-radius:8px;border:1px solid var(--border);background:#fff;color:var(--navy);text-decoration:none;cursor:pointer;}
  .toolbar .primary{background:var(--navy);color:#fff;border-color:var(--navy);}
  .sheet{margin:0 auto 22px;box-shadow:0 6px 30px rgba(15,58,95,.16);}
  .stage{max-width:794px;margin:0 auto;}
}
@media print{ .toolbar,.fold-guide,.sheet-tag{display:none!important;} .sheet{box-shadow:none;} }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kordy — Trusted Access to Medical Care in Korea</title>
<meta name="description" content="Kordy connects international patients with leading hospitals, specialist pathways, and guided care coordination across Korea.">
<style>${CSS}</style></head>
<body>
<div class="toolbar">
  <h1>Kordy · Bi-fold brochure</h1>
  <a class="primary" href="Kordy_Brochure_print.pdf" download>Download print PDF</a>
  <a href="Kordy_Brochure.pptx" download>Editable PowerPoint</a>
  <button onclick="window.print()">Print</button>
</div>
<div class="stage">
${sheet("Outside · back cover (p4) + front cover (p1)", backPanel(), coverPanel())}
${sheet("Inside · hospitals (p2) + pathways (p3)", hospitalsPanel(), pathwaysPanel())}
</div>
</body></html>`;

fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("wrote index.html", (html.length / 1024).toFixed(0) + "KB");
