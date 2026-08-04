const pptxgen = require("pptxgenjs");
const { buildIconSet, Fi, Fa } = require("./icons.js");

// ---------- unit helpers ----------
const MM = 1 / 25.4;              // mm -> inch
const BLEED = 2 * MM;             // 0.0787
const SAFE = 3 * MM;              // 0.1181
const W = 204 * MM;               // work area width  (8.0315)
const H = 214 * MM;               // work area height (8.4252)
const FOLD = W / 2;               // 4.01575
const EDGE = BLEED + SAFE;        // margin from work edge to safe area
const GUT = 0.16;                 // gutter each side of fold

// Panel content boxes
const L = { x0: EDGE, x1: FOLD - GUT };           // left panel
const R = { x0: FOLD + GUT, x1: W - EDGE };       // right panel
L.w = L.x1 - L.x0;                                // ~3.66
R.w = R.x1 - R.x0;
const TOP = EDGE;
const BOT = H - EDGE;

// ---------- palette ----------
const NAVY = "0E3A5F";
const NAVY_D = "0A2C48";
const NAVY_L = "1E5B86";
const TEAL = "18BFBF";
const TEAL_D = "0E9C9C";
const WHITE = "FFFFFF";
const GRAY = "F1F5F9";      // light gray card
const GRAY2 = "E7EDF2";
const BORDER = "D8E1E8";
const TEXT = "1B2A3A";
const MUTED = "667889";
const INK_LT = "AFC7D8";   // light text on navy

const HFONT = "Cambria";   // serif headings (safe list)
const BFONT = "Calibri";   // sans body (safe list)

async function main() {
  const icons = await buildIconSet({
    match:   [Fi.FiUserCheck, TEAL_D],
    coord:   [Fi.FiCalendar, TEAL_D],
    lang:    [Fi.FiGlobe, TEAL_D],
    journey: [Fi.FiCompass, TEAL_D],
    hospital:[Fi.FiPlusSquare, TEAL_D],
    mail:    [Fi.FiMail, NAVY],
    whats:   [Fa.FaWhatsapp, NAVY],
    phone:   [Fi.FiPhone, NAVY],
    weight:  [Fi.FiActivity, TEAL_D],
    men:     [Fi.FiUser, TEAL_D],
    derma:   [Fi.FiSun, TEAL_D],
    regen:   [Fi.FiRefreshCw, TEAL_D],
    bldgW:   [Fi.FiPlus, WHITE],
    pin:     [Fi.FiMapPin, TEAL],
    globeW:  [Fi.FiGlobe, WHITE],
  });

  const p = new pptxgen();
  p.defineLayout({ name: "FOLD", width: W, height: H });
  p.layout = "FOLD";
  p.author = "DYPHI / Kordy";
  p.title = "Kordy 2-Panel Brochure";

  // ============================================================
  // Reusable helpers
  // ============================================================
  const fresh = (o) => JSON.parse(JSON.stringify(o));

  function iconCircle(s, cx, cy, d, fill, imgKey, pad) {
    // circle centered at (cx,cy) diameter d with an icon inside
    s.addShape(p.ShapeType.ellipse, { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    const ip = pad == null ? d * 0.26 : pad;
    s.addImage({ data: icons[imgKey], x: cx - d / 2 + ip, y: cy - d / 2 + ip, w: d - 2 * ip, h: d - 2 * ip });
  }

  function hline(s, x, y, w, color, wt) {
    s.addShape(p.ShapeType.line, { x, y, w, h: 0, line: { color: color, width: wt || 0.75 } });
  }

  // ============================================================
  // SLIDE 1 — OUTSIDE  (Left = p4 back cover, Right = p1 front cover)
  // ============================================================
  const s1 = p.addSlide();
  s1.background = { color: WHITE };

  // ---- fold guide (thin dashed, non-print reference; kept subtle) ----
  s1.addShape(p.ShapeType.line, { x: FOLD, y: 0, w: 0, h: H, line: { color: "C9D3DB", width: 0.5, dashType: "dash" } });

  // ================= PAGE 1 — FRONT COVER (right panel, navy) =================
  // Full-bleed navy panel from fold to right work edge, top to bottom
  s1.addShape(p.ShapeType.rect, { x: FOLD, y: 0, w: W - FOLD, h: H, fill: { color: NAVY }, line: { type: "none" } });
  // subtle darker base band
  s1.addShape(p.ShapeType.rect, { x: FOLD, y: H - 1.5, w: W - FOLD, h: 1.5, fill: { color: NAVY_D }, line: { type: "none" } });

  // Stylized editable Seoul skyline (silhouette of rectangles), lower band
  const skyBase = 6.8;
  const bldg = [
    [0.00, 0.34, 0.42], [0.40, 0.30, 0.60], [0.76, 0.26, 0.34],
    [1.06, 0.40, 0.72], [1.52, 0.30, 0.48], [1.88, 0.24, 0.65],
    [2.18, 0.36, 0.40], [2.60, 0.30, 0.75], [2.96, 0.26, 0.45],
    [3.28, 0.34, 0.58],
  ];
  bldg.forEach(([dx, bw, bh], i) => {
    const x = R.x0 + dx;
    if (x + bw > R.x1 + 0.05) return;
    const col = (i % 4 === 3) ? TEAL_D : NAVY_L;
    s1.addShape(p.ShapeType.rect, { x, y: skyBase - bh, w: bw, h: bh, fill: { color: col }, line: { type: "none" } });
    // a lit window as a teal dot on taller towers
    if (bh > 0.6) {
      s1.addShape(p.ShapeType.rect, { x: x + bw * 0.38, y: skyBase - bh + 0.1, w: 0.05, h: 0.05, fill: { color: TEAL }, line: { type: "none" } });
    }
  });
  hline(s1, R.x0, skyBase, R.w, "17517A", 1);

  // Wordmark
  s1.addText(
    [{ text: "Kordy", options: { color: WHITE, bold: true } }, { text: ".", options: { color: TEAL, bold: true } }],
    { x: R.x0, y: 0.62, w: R.w, h: 0.85, fontFace: HFONT, fontSize: 46, align: "left", margin: 0 }
  );
  s1.addText("MEDICAL ACCESS IN KOREA", { x: R.x0 + 0.03, y: 1.5, w: R.w, h: 0.3, fontFace: BFONT, fontSize: 10.5, color: TEAL, charSpacing: 3, bold: true, align: "left", margin: 0 });
  hline(s1, R.x0 + 0.03, 1.92, 0.9, TEAL, 1.5);

  // Main headline
  s1.addText("Trusted Access to Medical Care in Korea", { x: R.x0, y: 2.35, w: R.w, h: 1.5, fontFace: HFONT, fontSize: 27, bold: true, color: WHITE, align: "left", lineSpacingMultiple: 1.0, margin: 0 });
  // Subheadline
  s1.addText("Kordy connects international patients with leading hospitals, specialist pathways, and guided care coordination across Korea.", { x: R.x0, y: 3.95, w: R.w, h: 1.1, fontFace: BFONT, fontSize: 12, color: INK_LT, align: "left", lineSpacingMultiple: 1.12, margin: 0 });
  // Supporting line (italic accent)
  s1.addText("A structured gateway to hospital access, treatment planning, and patient support in Korea.", { x: R.x0, y: 5.05, w: R.w, h: 0.9, fontFace: BFONT, fontSize: 11, italic: true, color: TEAL, align: "left", lineSpacingMultiple: 1.1, margin: 0 });

  // Trust line + footer (in base band)
  iconCircle(s1, R.x0 + 0.14, 7.42, 0.28, TEAL, "globeW", 0.075);
  s1.addText("Operated by DYPHI, a registered medical tourism facilitator in Korea.", { x: R.x0 + 0.36, y: 7.18, w: R.w - 0.36, h: 0.5, fontFace: BFONT, fontSize: 9.5, color: INK_LT, align: "left", valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  s1.addText("kordy.kr", { x: R.x0, y: 7.85, w: R.w, h: 0.4, fontFace: BFONT, fontSize: 15, bold: true, color: WHITE, align: "left", margin: 0 });

  // ================= PAGE 4 — BACK COVER (left panel, white/info) =================
  let y = TOP + 0.05;
  s1.addText("Why Kordy", { x: L.x0, y, w: L.w, h: 0.5, fontFace: HFONT, fontSize: 24, bold: true, color: NAVY, align: "left", margin: 0 });
  y += 0.5;
  hline(s1, L.x0, y, 0.7, TEAL, 2);
  y += 0.16;

  const feats = [
    ["match", "Personalized hospital matching"],
    ["coord", "Appointment & medical record coordination"],
    ["lang", "Multilingual patient support"],
    ["journey", "Guided care journey — inquiry to follow-up"],
    ["hospital", "Access to major hospitals & specialty centers"],
  ];
  const fRow = 0.5;
  feats.forEach(([ic, txt]) => {
    iconCircle(s1, L.x0 + 0.19, y + fRow / 2, 0.38, GRAY, ic, 0.1);
    s1.addText(txt, { x: L.x0 + 0.5, y: y, w: L.w - 0.5, h: fRow, fontFace: BFONT, fontSize: 11, color: TEXT, align: "left", valign: "middle", lineSpacingMultiple: 1.0, margin: 0 });
    y += fRow;
  });
  y += 0.08;
  s1.addText("For many international patients, choosing the right hospital in Korea can be complex. Kordy helps simplify that process by guiding patients to appropriate institutions, treatment pathways, and next-step planning.", { x: L.x0, y, w: L.w, h: 0.95, fontFace: BFONT, fontSize: 9.5, color: MUTED, align: "left", lineSpacingMultiple: 1.12, margin: 0 });
  y += 1.0;

  // CTA card (navy) with QR + contact
  const ctaH = 1.72;
  s1.addShape(p.ShapeType.roundRect, { x: L.x0, y, w: L.w, h: ctaH, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s1.addText("Start Your Inquiry", { x: L.x0 + 0.22, y: y + 0.16, w: L.w - 1.55, h: 0.35, fontFace: HFONT, fontSize: 15, bold: true, color: WHITE, align: "left", margin: 0 });
  s1.addText([{ text: "Website:  ", options: { color: INK_LT } }, { text: "kordy.kr", options: { color: TEAL, bold: true } }], { x: L.x0 + 0.22, y: y + 0.54, w: L.w - 1.55, h: 0.3, fontFace: BFONT, fontSize: 11, align: "left", margin: 0 });
  // contact placeholders
  iconCircle(s1, L.x0 + 0.34, y + 1.03, 0.3, TEAL, "whats", 0.07);
  s1.addText("WhatsApp: +82 ___ ____ ____", { x: L.x0 + 0.54, y: y + 0.88, w: L.w - 1.55, h: 0.3, fontFace: BFONT, fontSize: 9, color: INK_LT, align: "left", valign: "middle", margin: 0 });
  iconCircle(s1, L.x0 + 0.34, y + 1.4, 0.3, TEAL, "mail", 0.07);
  s1.addText("Email: hello@kordy.kr", { x: L.x0 + 0.54, y: y + 1.25, w: L.w - 1.55, h: 0.3, fontFace: BFONT, fontSize: 9, color: INK_LT, align: "left", valign: "middle", margin: 0 });
  // QR placeholder (editable shapes)
  const qz = 1.12, qx = L.x1 - qz - 0.16, qy = y + (ctaH - qz) / 2;
  s1.addShape(p.ShapeType.roundRect, { x: qx, y: qy, w: qz, h: qz, rectRadius: 0.05, fill: { color: WHITE }, line: { color: TEAL, width: 1 } });
  s1.addShape(p.ShapeType.rect, { x: qx + 0.12, y: qy + 0.12, w: qz - 0.24, h: qz - 0.24, fill: { color: "E8EEF2" }, line: { color: BORDER, width: 0.5 } });
  s1.addText("QR\nplaceholder", { x: qx + 0.12, y: qy + 0.12, w: qz - 0.24, h: qz - 0.24, fontFace: BFONT, fontSize: 8, color: MUTED, align: "center", valign: "middle", margin: 0 });
  y += ctaH + 0.16;

  // Specialty pathways
  s1.addText("Specialty pathways", { x: L.x0, y, w: L.w, h: 0.28, fontFace: BFONT, fontSize: 10.5, bold: true, color: NAVY, charSpacing: 1, align: "left", margin: 0 });
  y += 0.3;
  const paths = ["nextweight.kr", "mensform.kr", "longevityseoul.kr", "regenvalue.com"];
  const colW = L.w / 2;
  paths.forEach((u, i) => {
    const cx = L.x0 + (i % 2) * colW;
    const cy = y + Math.floor(i / 2) * 0.32;
    s1.addShape(p.ShapeType.ellipse, { x: cx + 0.02, y: cy + 0.09, w: 0.07, h: 0.07, fill: { color: TEAL }, line: { type: "none" } });
    s1.addText(u, { x: cx + 0.16, y: cy, w: colW - 0.18, h: 0.26, fontFace: BFONT, fontSize: 10, color: TEXT, align: "left", valign: "middle", margin: 0 });
  });
  y += 0.72;
  hline(s1, L.x0, y, L.w, BORDER, 0.75);
  y += 0.08;
  s1.addText("Kordy is a patient guidance platform designed to help international patients explore appropriate care options in Korea.", { x: L.x0, y, w: L.w, h: 0.5, fontFace: BFONT, fontSize: 8, italic: true, color: MUTED, align: "left", lineSpacingMultiple: 1.05, margin: 0 });

  // ============================================================
  // SLIDE 2 — INSIDE  (Left = p2 hospitals, Right = p3 pathways)
  // ============================================================
  const s2 = p.addSlide();
  s2.background = { color: WHITE };
  s2.addShape(p.ShapeType.line, { x: FOLD, y: 0, w: 0, h: H, line: { color: "C9D3DB", width: 0.5, dashType: "dash" } });

  // ================= PAGE 2 — Hospitals (left) =================
  let y2 = TOP + 0.05;
  s2.addText("Access to Korea's Leading Hospitals", { x: L.x0, y: y2, w: L.w, h: 0.8, fontFace: HFONT, fontSize: 20, bold: true, color: NAVY, align: "left", lineSpacingMultiple: 1.0, margin: 0 });
  y2 += 0.82;
  hline(s2, L.x0, y2, 0.7, TEAL, 2);
  y2 += 0.14;
  s2.addText("Kordy helps patients navigate major tertiary hospitals and selected specialty centers based on diagnosis, treatment goals, and care needs.", { x: L.x0, y: y2, w: L.w, h: 0.65, fontFace: BFONT, fontSize: 9.5, color: MUTED, align: "left", lineSpacingMultiple: 1.12, margin: 0 });
  y2 += 0.68;
  s2.addText("REPRESENTATIVE HOSPITAL ACCESS", { x: L.x0, y: y2, w: L.w, h: 0.24, fontFace: BFONT, fontSize: 9, bold: true, color: TEAL_D, charSpacing: 1.5, align: "left", margin: 0 });
  y2 += 0.3;

  const big5 = [
    ["Seoul National University Hospital", "Flagship national university hospital"],
    ["Asan Medical Center", "One of Korea's largest medical centers"],
    ["Samsung Medical Center", "Leading university-affiliated tertiary hospital"],
    ["Severance Hospital", "Historic leading teaching hospital"],
    ["Seoul St. Mary's Hospital", "Major Catholic university hospital"],
  ];
  const hcH = 0.62, hcGap = 0.09;
  big5.forEach(([nm, ds]) => {
    s2.addShape(p.ShapeType.roundRect, { x: L.x0, y: y2, w: L.w, h: hcH, rectRadius: 0.05, fill: { color: GRAY }, line: { color: BORDER, width: 0.5 } });
    iconCircle(s2, L.x0 + 0.31, y2 + hcH / 2, 0.34, NAVY, "bldgW", 0.095);
    s2.addText(nm, { x: L.x0 + 0.56, y: y2 + 0.08, w: L.w - 0.66, h: 0.28, fontFace: BFONT, fontSize: 10, bold: true, color: NAVY, align: "left", valign: "middle", margin: 0 });
    s2.addText(ds, { x: L.x0 + 0.56, y: y2 + 0.33, w: L.w - 0.66, h: 0.22, fontFace: BFONT, fontSize: 8, color: MUTED, align: "left", valign: "middle", margin: 0 });
    y2 += hcH + hcGap;
  });
  y2 += 0.02;
  // Two additional highlighted cards (teal-tinted)
  const extra = [
    ["Ewha Womans University Seoul Hospital", "Modern tertiary hospital in western Seoul"],
    ["Incheon Sejong Hospital", "Cardiovascular & bariatric / metabolic care pathways"],
  ];
  extra.forEach(([nm, ds]) => {
    s2.addShape(p.ShapeType.roundRect, { x: L.x0, y: y2, w: L.w, h: hcH, rectRadius: 0.05, fill: { color: "E9F7F7" }, line: { color: TEAL, width: 0.75 } });
    iconCircle(s2, L.x0 + 0.31, y2 + hcH / 2, 0.34, TEAL_D, "bldgW", 0.095);
    s2.addText(nm, { x: L.x0 + 0.56, y: y2 + 0.07, w: L.w - 0.66, h: 0.28, fontFace: BFONT, fontSize: 9.5, bold: true, color: NAVY, align: "left", valign: "middle", margin: 0 });
    s2.addText(ds, { x: L.x0 + 0.56, y: y2 + 0.32, w: L.w - 0.66, h: 0.24, fontFace: BFONT, fontSize: 8, color: TEAL_D, align: "left", valign: "middle", lineSpacingMultiple: 0.95, margin: 0 });
    y2 += hcH + hcGap;
  });
  y2 += 0.04;
  s2.addText("Representative institutions are shown for informational purposes. Final hospital recommendation depends on each patient's medical needs and consultation pathway.", { x: L.x0, y: y2, w: L.w, h: 0.6, fontFace: BFONT, fontSize: 7.5, italic: true, color: MUTED, align: "left", lineSpacingMultiple: 1.08, margin: 0 });

  // ================= PAGE 3 — Pathways + How it works (right) =================
  let y3 = TOP + 0.05;
  s2.addText("Specialized Care Pathways", { x: R.x0, y: y3, w: R.w, h: 0.5, fontFace: HFONT, fontSize: 20, bold: true, color: NAVY, align: "left", margin: 0 });
  y3 += 0.5;
  hline(s2, R.x0, y3, 0.7, TEAL, 2);
  y3 += 0.13;
  s2.addText("Kordy connects patients to focused information and care pathways through dedicated websites.", { x: R.x0, y: y3, w: R.w, h: 0.42, fontFace: BFONT, fontSize: 9.5, color: MUTED, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  y3 += 0.46;

  const pcards = [
    ["weight", "NextWeight", "Obesity & metabolic care", "Evidence-based guidance for obesity treatment, bariatric surgery, and metabolic care.", "nextweight.kr"],
    ["men", "Men's Form", "Men's health & procedures", "Focused guidance for urology, personal procedures, and related consultation.", "mensform.kr"],
    ["derma", "Longevity Seoul", "Dermatology, aesthetics & healthy ageing", "Curated access to skin, aesthetic, and healthy ageing pathways in Korea.", "longevityseoul.kr"],
    ["regen", "RegenValue", "Regenerative medicine", "A platform for exploring regenerative medicine information and guided inquiry.", "regenvalue.com"],
  ];
  const pcH = 0.9, pcGap = 0.06, ptx = R.x0 + 0.62, ptw = R.w - 0.7;
  pcards.forEach(([ic, nm, cat, ds, url]) => {
    s2.addShape(p.ShapeType.roundRect, { x: R.x0, y: y3, w: R.w, h: pcH, rectRadius: 0.05, fill: { color: GRAY }, line: { color: BORDER, width: 0.5 } });
    iconCircle(s2, R.x0 + 0.32, y3 + pcH / 2, 0.42, TEAL, ic, 0.115);
    s2.addText(nm, { x: ptx, y: y3 + 0.06, w: ptw, h: 0.22, fontFace: BFONT, fontSize: 11, bold: true, color: NAVY, align: "left", valign: "middle", margin: 0 });
    s2.addText(cat, { x: ptx, y: y3 + 0.27, w: ptw, h: 0.18, fontFace: BFONT, fontSize: 8, italic: true, color: TEAL_D, align: "left", valign: "middle", margin: 0 });
    s2.addText(ds, { x: ptx, y: y3 + 0.45, w: ptw, h: 0.28, fontFace: BFONT, fontSize: 7.5, color: MUTED, align: "left", lineSpacingMultiple: 1.02, margin: 0 });
    s2.addText(url, { x: ptx, y: y3 + 0.7, w: ptw, h: 0.18, fontFace: BFONT, fontSize: 8.5, bold: true, color: TEAL_D, align: "left", valign: "middle", margin: 0 });
    y3 += pcH + pcGap;
  });
  y3 += 0.06;

  // How Kordy Works — compact numbered steps
  s2.addText("How Kordy Works", { x: R.x0, y: y3, w: R.w, h: 0.32, fontFace: HFONT, fontSize: 14, bold: true, color: NAVY, align: "left", margin: 0 });
  y3 += 0.35;
  const steps = [
    ["Initial inquiry", "Share your goals, symptoms, or treatment interest."],
    ["Medical information review", "We review available records and care needs."],
    ["Hospital matching", "Appropriate hospitals or clinics are suggested."],
    ["Appointment planning", "Scheduling, document support, and preparation."],
    ["Treatment in Korea", "Guided access to your selected medical pathway."],
    ["Follow-up support", "Post-visit communication and next-step guidance."],
  ];
  const stH = 0.37;
  steps.forEach(([t, d], i) => {
    const cy = y3 + stH / 2;
    // connector line between step dots
    if (i < steps.length - 1) {
      s2.addShape(p.ShapeType.line, { x: R.x0 + 0.15, y: cy + 0.13, w: 0, h: stH, line: { color: BORDER, width: 1 } });
    }
    s2.addShape(p.ShapeType.ellipse, { x: R.x0 + 0.015, y: cy - 0.135, w: 0.27, h: 0.27, fill: { color: NAVY }, line: { type: "none" } });
    s2.addText(String(i + 1), { x: R.x0 + 0.015, y: cy - 0.135, w: 0.27, h: 0.27, fontFace: BFONT, fontSize: 10, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s2.addText([{ text: t + "  ", options: { bold: true, color: TEXT, fontSize: 9 } }, { text: d, options: { color: MUTED, fontSize: 8 } }], { x: R.x0 + 0.4, y: y3, w: R.w - 0.4, h: stH, fontFace: BFONT, align: "left", valign: "middle", lineSpacingMultiple: 0.98, margin: 0 });
    y3 += stH;
  });
  y3 += 0.03;
  s2.addText("The final hospital and treatment pathway depend on individual medical needs and provider review.", { x: R.x0, y: y3, w: R.w, h: 0.4, fontFace: BFONT, fontSize: 7.5, italic: true, color: MUTED, align: "left", lineSpacingMultiple: 1.05, margin: 0 });

  // ============================================================
  // SLIDE 3 — STYLE GUIDE / EDIT NOTES  (single full page reference)
  // ============================================================
  const s3 = p.addSlide();
  s3.background = { color: WHITE };
  s3.addShape(p.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.15, fill: { color: NAVY }, line: { type: "none" } });
  s3.addText([{ text: "Kordy", options: { bold: true, color: WHITE } }, { text: ".", options: { color: TEAL, bold: true } }, { text: "  Brochure Style & Edit Guide", options: { color: WHITE, bold: false } }], { x: EDGE, y: 0.3, w: W - 2 * EDGE, h: 0.55, fontFace: HFONT, fontSize: 20, align: "left", margin: 0 });
  s3.addText("Reference page — not part of the printed fold. Delete before export to print.", { x: EDGE, y: 0.82, w: W - 2 * EDGE, h: 0.25, fontFace: BFONT, fontSize: 9, italic: true, color: INK_LT, align: "left", margin: 0 });

  let gy = 1.45;
  s3.addText("Color palette", { x: EDGE, y: gy, w: 3.5, h: 0.3, fontFace: HFONT, fontSize: 13, bold: true, color: NAVY, margin: 0 });
  gy += 0.36;
  const sw = [["Navy", NAVY], ["Teal", TEAL], ["Light gray", GRAY], ["Border", BORDER], ["White", WHITE]];
  sw.forEach(([nm, hx], i) => {
    const x = EDGE + i * 1.5;
    s3.addShape(p.ShapeType.roundRect, { x, y: gy, w: 0.55, h: 0.55, rectRadius: 0.04, fill: { color: hx }, line: { color: BORDER, width: 0.75 } });
    s3.addText([{ text: nm + "\n", options: { bold: true, fontSize: 9, color: TEXT } }, { text: "#" + hx, options: { fontSize: 8, color: MUTED } }], { x: x + 0.62, y: gy - 0.02, w: 0.85, h: 0.6, fontFace: BFONT, align: "left", valign: "middle", margin: 0, lineSpacingMultiple: 1.0 });
  });
  gy += 0.85;

  s3.addText("Typography", { x: EDGE, y: gy, w: 4, h: 0.3, fontFace: HFONT, fontSize: 13, bold: true, color: NAVY, margin: 0 });
  gy += 0.36;
  s3.addText([
    { text: "Headings  ", options: { bold: true, color: TEXT, fontSize: 10.5 } },
    { text: "Cambria — clean professional serif (swap for Georgia / a brand serif).\n", options: { color: MUTED, fontSize: 10 } },
    { text: "Body  ", options: { bold: true, color: TEXT, fontSize: 10.5 } },
    { text: "Calibri — modern sans-serif (swap for Arial / a brand sans).", options: { color: MUTED, fontSize: 10 } },
  ], { x: EDGE, y: gy, w: W - 2 * EDGE, h: 0.6, fontFace: BFONT, align: "left", lineSpacingMultiple: 1.25, margin: 0 });
  gy += 0.72;

  s3.addText("Edit notes", { x: EDGE, y: gy, w: 4, h: 0.3, fontFace: HFONT, fontSize: 13, bold: true, color: NAVY, margin: 0 });
  gy += 0.36;
  const notes = [
    "All titles, body copy, hospital names, descriptions, URLs and contact lines are live text — edit directly.",
    "QR box (back cover) is a placeholder group: drop a real QR image over the inner square, keep the frame.",
    "Contact lines (WhatsApp / Email) are placeholders — replace with real numbers and address.",
    "Hospital & pathway cards are shape + text groups: duplicate a card to add one, or replace the plus icon with an official hospital logo (keep the navy circle or remove it).",
    "Color blocks are shapes and dividers are line objects — recolor via Shape Fill / Line Color.",
    "Layout: 200 x 210 mm finished, two 100 x 210 mm panels, 2 mm bleed all sides, 3 mm safety inside trim. Dashed centre line = fold; keep key text and logo inside the safe area.",
    "Slide 1 = outside (left = back cover / p4, right = front cover / p1). Slide 2 = inside (left = p2 hospitals, right = p3 pathways).",
    "Text boxes are left intentionally roomy so Korean / Chinese translations can replace English without reflowing the layout.",
  ];
  notes.forEach((n) => {
    s3.addShape(p.ShapeType.ellipse, { x: EDGE + 0.02, y: gy + 0.07, w: 0.08, h: 0.08, fill: { color: TEAL }, line: { type: "none" } });
    s3.addText(n, { x: EDGE + 0.22, y: gy, w: W - 2 * EDGE - 0.22, h: 0.3, fontFace: BFONT, fontSize: 9.5, color: TEXT, align: "left", valign: "top", lineSpacingMultiple: 1.05, margin: 0 });
    // measure rough height: wrap ~ over width; give 0.24 per ~1 line, allow 2 lines
    gy += (n.length > 95 ? 0.5 : 0.28);
  });

  await p.writeFile({ fileName: "Kordy_Brochure.pptx" });
  console.log("written Kordy_Brochure.pptx");
}

main().catch((e) => { console.error(e); process.exit(1); });
