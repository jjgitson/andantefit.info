# Analytics & Conversion Optimization

Actions taken after the 2-month GA4 review (traffic dominated by Japan Google
organic and Korea Naver/Google organic, landing mostly on `sppb-test.html` and
`sppb.html`). The headline problem: the top-traffic page (`/jp/sppb-test.html`,
240 sessions) had the **lowest engagement** (42% engagement rate, 32 s), while
Korea's Naver organic traffic engaged best (84%, 2 min). We were pulling in
readers but giving them almost no path toward the product.

---

## 1. What changed in code

### Conversion CTAs on the SPPB test pages (all 4 languages)
`sppb-test.html` (en / ko / jp / es):

- **Inline CTA band** placed high on the page (right after the hero), so the
  readers who leave within seconds still see the AndanteFit value proposition
  ("automate these three tests in under 3 minutes"). Primary button → `product.html`.
- **Print/PDF "field kit" card** — the print & PDF buttons are now framed as a
  downloadable A4 field reference with a short description, instead of two loose
  buttons.
- **Premium product-CTA card** at the foot of the page with three stat
  highlights (`< 3 min`, `no wearables`, `automatic scoring`) and a clear
  primary action ("Request a demo / 문의 / お問い合わせ / demo").

Shared styles live in `css/style.css` (`.cta-band`, `.print-kit`, `.pro-cta`,
`.btn-accent`, `.btn-on-dark`), so the same components can be reused on other
content pages (e.g. `sppb.html`) later without new CSS.

### Top procedure page reframed from reference → tool (`sppb-test.html`, all 4 languages)
The #1-traffic page (`/jp/sppb-test.html`) was consumed as a quick reference and
bounced in ~32 s. To match the visiting clinician's actual job (scoring a
patient) and create a natural conversion moment:

- **Interactive SPPB score calculator** (`js/sppb-calculator.js`, styled in
  `css/style.css`) placed high on the page, linked from the hero. The clinician
  picks the three subtest scores (0–4) and instantly gets the total (0–12),
  functional band, and clinical interpretation — then a result-panel CTA
  ("automate this scoring") into `product.html`. Emits `calc_complete`.
  Progressive enhancement: the static scoring tables remain the no-JS fallback.
- **FAQ section** answering the real search queries (4 m vs 6 m gait, chair
  type, normal score, test duration).
- **Structured data**: `HowTo` (the 3-step protocol) and `FAQPage` JSON-LD added
  to each language's `<head>` for richer search results on procedure queries.

### Print / PDF pages upgraded (all 4 languages)
`sppb-test-print.html` (en / ko / jp / es):

- Screen view now looks like a real sheet of paper (soft gray backdrop, white
  page with shadow) and has a proper toolbar (Back + **Print / Save as PDF**).
- A **print-visible brand strip** at the bottom carries the value prop
  (`manual ~10–15 min → AndanteFit < 3 min`) plus the URL, so every printed
  handout markets the product. `@media print` hides the screen toolbar.

### GA4 event tracking (`js/main.js`)
A small, safe `afTrack()` helper sends GA4 events (no-op if gtag is absent):

| Event            | Fires when                                              |
|------------------|----------------------------------------------------------|
| `cta_click`      | any CTA with `data-af-event` is clicked (band, bottom, calculator result) |
| `pdf_download`   | "Download PDF" is clicked                                 |
| `print_view`     | "Print-friendly version" is clicked                      |
| `calc_complete`  | all three subtests are entered in the SPPB calculator (carries `sppb_total`, `sppb_band`) |
| `generate_lead`  | the product inquiry form (`#materialsForm`) is submitted  |

Each event carries `cta_location`, `cta_label`, `link_url`, and `page_path` so
you can see **which page and which CTA** drove the action. Tracking is wired via
`data-af-*` attributes, so adding a tracked CTA to another page needs no JS.

---

## 2. What must be done in the GA4 console (cannot be done in code)

These are Admin-panel settings on the GA4 property (`G-0L4ENVHFYP`).

### 2a. Mark the new events as key events (conversions)
**Admin → Events → Key events** (or Events, toggle "Mark as key event") for:
`generate_lead`, `pdf_download`, `cta_click`, `calc_complete`.
`calc_complete` is a strong engagement signal on the top procedure page — track
it to confirm the interactive calculator lifts engagement, and watch the
`calc_complete → cta_click(calc_result)` step as the new micro-funnel.
Until this is done, GA4 records the events but does not report them as
conversions — so we still can't see which content actually produces leads.
Give it 24–48 h after the first events arrive for them to appear in the list.

### 2b. Fix Naver attribution (organic vs. referral split)
Naver mobile search arrives as `m.search.naver.com / referral` instead of
`organic`, splitting Korea's (our best-engaging) traffic across two rows.

- **Admin → Data streams → (web stream) → Configure tag settings → List
  unwanted referrals**: add `naver.com` so Naver stops being counted as a
  referral.
- **Admin → Data streams → (web stream) → Configure tag settings → Manage
  organic search sources** (or "Define organic sources"): confirm/add Naver
  with domains `search.naver.com` and `m.search.naver.com`. Then the mobile and
  desktop Naver traffic both roll up under Organic Search.

### 2c. Filter bot / junk sessions
Rows 9–10 (`naver`/`google` with landing page `(not set)`, ~2–3% engagement,
3–4 s) look like bot or mis-tagged traffic and drag the averages down.

- **Admin → Data settings → Data filters**: ensure the internal/developer
  traffic filters are Active (not just Testing).
- GA4 already excludes known bots automatically; if `(not set)` landing pages
  persist, check they aren't caused by the tag firing on a redirect/404 before
  the page resolves. Consider a **custom exploration** segmented on
  `landing page = (not set)` to quantify and, if needed, exclude it from key
  reports.

---

## 3. Priorities / next steps

1. Do **2a** now — without it we can't measure whether any of this works.
2. Do **2b** to see the true size of Korea/Naver, our strongest segment.
3. After ~2–4 weeks, compare `sppb-test.html` engagement and `cta_click` →
   `generate_lead` rates before/after; iterate on CTA copy.
4. Reuse the shared `.cta-band` / `.pro-cta` components on `sppb.html`
   (the #2–#4 landing pages) once the test-page results validate the approach.
