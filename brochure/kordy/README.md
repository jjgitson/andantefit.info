# Kordy — Two-Panel Fold Brochure

Marketing brochure for **Kordy**, the medical-connection platform operated by
**DYPHI** that helps international patients access hospitals, specialist pathways,
and guided care coordination in Korea.

Three formats, one design:

| File | Use |
|------|-----|
| **`index.html`** | Web version — open in any browser. When the site is deployed it is live at `https://andantefit.info/brochure/kordy/`. Self-contained (fonts + icons inlined), works offline. Has **Print** and **download** buttons. |
| **`Kordy_Brochure_print.pdf`** | **Print-ready file for the print shop (인쇄소).** Vector text, embedded fonts, 2 mm bleed, crop marks + fold marks. |
| **`Kordy_Brochure.pptx`** | Editable master (PowerPoint). Every title, paragraph, card, URL, divider and colour block is an individual object. |
| `preview/*.png` | Reference images of each side. |
| `src/` | Generator scripts + subset fonts, to rebuild any format. |

## For the print shop (인쇄소)

`Kordy_Brochure_print.pdf` — **2 pages**:

1. **Outside** — left = back cover (p4), right = front cover (p1)
2. **Inside** — left = p2 (hospitals), right = p3 (pathways)

| Spec | Value |
|------|-------|
| Format | vertical two-panel bi-fold |
| Finished / trim size | **200 × 210 mm** (two 100 × 210 mm panels) |
| Bleed | **2 mm** all sides (artwork extends to 204 × 214 mm) |
| Safety margin | 3 mm inside trim |
| PDF page size | 210 × 220 mm — includes bleed + crop/fold marks |
| Marks | crop marks at the four trim corners; fold ticks at top & bottom centre |
| Fonts | embedded (vector text, not outlined — text stays selectable) |
| Colour | **RGB**. Most digital print houses accept this and convert. If your shop needs **CMYK**, ask them to convert on import, or request a CMYK export. |

The fold is the vertical centre; the printed artwork carries no fold line, only the
corner crop marks and the two fold ticks in the margin.

## Design system

| Role | Value |
|------|-------|
| Navy (primary) | `#0E3A5F` (darker base `#0A2C48`) |
| Teal (accent) | `#18BFBF` (deep `#0E9C9C`) |
| Light gray (cards) | `#F1F5F9` |
| Border | `#D8E1E8` |
| White | `#FFFFFF` |
| Headings | serif (PPTX: Cambria · web/PDF: Liberation Serif — swap for a brand serif) |
| Body | sans-serif (PPTX: Calibri · web/PDF: Liberation Sans — swap for a brand sans) |

## Logo — placeholder

The wordmark is a **placeholder**: a location-pin-with-medical-plus symbol plus
the word **“kordy.”** The official kordy.kr wordmark could not be pulled into this
build (the domain is not reachable from the build environment). To finalise, drop in
the real kordy.kr logo:

- **PPTX:** replace the pin image + “kordy” text on the cover (slide 1, right panel).
- **Web / PDF:** edit the `.logo` block in `index.html` (or `src/web-build.js`, then rebuild).

## Editing / handoff notes

- All titles, body copy, hospital names, descriptions, URLs and contact lines are **live text**.
- **QR box** (back cover) is a placeholder — drop a real QR image over the inner square, keep the frame.
- **Contact lines** (WhatsApp / Email) are placeholders — replace with real details.
- Hospital & pathway **cards** are shape/text groups: duplicate to add one, or replace the plus icon with an official hospital logo.
- Text boxes are deliberately roomy so **Korean / Chinese** translations can replace the English without reflowing.
- Hospitals are shown “for informational purposes,” with the disclaimer on the inside panel — Kordy is positioned as a care-coordination platform, not a hospital advertiser.

## Regenerating

```bash
cd src
npm install pptxgenjs react react-dom react-icons sharp playwright   # playwright uses the preinstalled browser

node pptx-build.js     # -> Kordy_Brochure.pptx   (editable master)
node web-build.js      # -> index.html            (web + PDF source)
node web-pdf.js        # -> Kordy_Brochure_print.pdf
```
