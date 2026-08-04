# Kordy — Two-Panel Fold Brochure (editable)

An editable, print-ready two-panel (bi-fold) brochure introducing **Kordy**, the
medical-connection platform operated by **DYPHI** that helps international patients
access hospitals, specialist pathways, and guided care coordination in Korea.

The deliverable is a fully editable **PowerPoint** file — every title, paragraph,
hospital name, description, URL, card, colour block, divider and icon is an
individual object. Only the line icons are images (placed inside editable circles);
no page is a flattened picture.

## Files

| File | Purpose |
|------|---------|
| `Kordy_Brochure.pptx` | The editable brochure. Open in PowerPoint / Keynote / Google Slides. |
| `preview/outside-p4-p1.png` | Approx render of the outside side (left = p4 back cover, right = p1 cover). |
| `preview/inside-p2-p3.png` | Approx render of the inside side (left = p2 hospitals, right = p3 pathways). |
| `preview/style-edit-guide.png` | Approx render of the style & edit-guide reference slide. |
| `build.js`, `icons.js` | Generator scripts (pptxgenjs + react-icons) used to produce the `.pptx`. |

> Preview PNGs are approximate renders for reference only. Font substitution and
> spacing in the actual PowerPoint may differ slightly; the `.pptx` is the source of truth.

## Print specification

- **Format:** vertical two-panel fold (bi-fold)
- **Finished / trim size:** 200 × 210 mm (two 100 × 210 mm panels)
- **Working size (with bleed):** 204 × 214 mm — 2 mm bleed on all sides
- **Safety margin:** 3 mm inside the trim line
- **Fold:** the dashed centre line marks the fold; keep logos and key text inside the safe area

### Page layout (matches the print imposition)

- **Slide 1 — Outside:** left panel = **page 4 (back cover)**, right panel = **page 1 (front cover)**
- **Slide 2 — Inside:** left panel = **page 2**, right panel = **page 3**
- **Slide 3 — Style & Edit Guide:** reference only. **Delete before sending to print.**

## Design system

| Role | Value |
|------|-------|
| Navy (primary) | `#0E3A5F` |
| Teal (accent) | `#18BFBF` |
| Light gray (cards) | `#F1F5F9` |
| Border | `#D8E1E8` |
| White | `#FFFFFF` |
| Headings | Cambria (clean professional serif — swap for a brand serif) |
| Body | Calibri (modern sans-serif — swap for a brand sans) |

## Editing / handoff notes

- All titles, body copy, hospital names, descriptions, URLs and contact lines are **live text** — edit directly.
- **QR box** (back cover) is a placeholder: drop a real QR image over the inner square, keep the frame.
- **Contact lines** (WhatsApp / Email) are placeholders — replace with real details.
- **Hospital & pathway cards** are shape + text groups: duplicate a card to add one, or replace the plus icon with an official hospital logo (keep or remove the circle).
- Colour blocks are shapes; dividers are line objects — recolour via *Shape Fill* / *Line Color*.
- Text boxes are deliberately roomy so **Korean / Chinese** translations can replace the English without reflowing the layout.

## Regenerating the file

```bash
cd brochure/kordy
npm install pptxgenjs react react-dom react-icons sharp
node build.js          # writes Kordy_Brochure.pptx
```

Positioning is angled toward **Kordy as a care-coordination platform**, not a hospital
advertiser — hospital names are shown for informational purposes only, with the
matching disclaimer on the inside panel.
