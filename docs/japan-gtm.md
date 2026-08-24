# Japan Go-To-Market Plan

Written after the GA4 / Search Console review covering 29 Jun – 23 Aug 2026.
Japan is our largest search market and `/jp/sppb-test.html` alone takes 56 % of
all organic clicks — yet document and demo requests are near zero, in Japan and
everywhere else.

---

## 1. What the data actually says

Figures below are Google Analytics 4 and Search Console for **29 Jun – 23 Aug
2026** (~8 weeks), site-wide.

| Site-wide | Value |
|---|---|
| Active users | 1,900 |
| Avg. engagement time | 54 s |
| Google organic clicks / impressions | 758 / 24,359 (CTR 3.11 %, avg. position 6.47) |
| **Users reaching `product.html`** | **83 (4.4 % of all users)** |
| Document / demo requests, all countries | ≈ 0 |

**The conversion problem is real and it is not a Japan problem.** At ~1,900
users over eight weeks with near-zero requests, the request rate is under
0.05 %. A gated document on a B2B medical-device content site normally runs
0.5–2 %. We are one to two orders of magnitude below that, in every locale.

*(An earlier draft of this document read the same question off an 8-session
window and concluded zero requests was statistically expected. With eight weeks
of data that reading was wrong, and it is corrected here.)*

### Where the funnel actually breaks

It is not the product page and it is not the form:

| Page | Views | Active users | Bounce |
|---|---|---|---|
| `/jp/sppb-test.html` — SPPB検査方法 | 825 | 607 | 55.2 % |
| `/ko/sppb-test.html` | 638 | 381 | 39.9 % |
| `/ko/sppb.html` | 394 | 270 | 27.3 % |
| `/sppb-test.html` (EN) | 378 | 237 | 54.0 % |
| `/index.html` (EN home) | 350 | 167 | 33.7 % |
| `/jp/sppb.html` | 166 | 142 | 35.6 % |
| **`/product.html`** | **155** | **83** | **19.6 %** |

`product.html` has the **lowest bounce rate on the site**. It converts attention
well; almost nobody arrives. **95.6 % of users never see it.** Every fix should
target the content-page → product-page step, not the form.

### Intent, quantified

| Query | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| `sppb` | 161 | 6,886 | 2.34 % | 5.74 |
| `sppb 評価` | 89 | 2,595 | 3.43 % | 3.90 |
| `안단테핏` | 36 | 175 | 20.57 % | 1.79 |
| `andantefit` | 29 | 95 | 30.53 % | 1.63 |
| `sppb 評価 やり方` | 24 | 122 | 19.67 % | 3.44 |
| `sppb test` | 6 | **1,317** | **0.46 %** | **12.46** |
| `sppbとは` | 6 | 348 | 1.72 % | 5.28 |

Two things stand out:

1. **70 branded clicks** (`안단테핏` + `andantefit` + `andante fit`). These are
   the highest-intent visitors on the site — they searched for the company by
   name. They land on a homepage whose only route onward is a single
   mid-page "System Details →" link. There is no way for them to ask for
   anything. This is the most wasteful leak we have.
2. **`sppb test` sits on page 2** (position 12.46) on 1,317 impressions. The
   English `/sppb-test.html` is at position 9.97 on 1,713 impressions with
   0.82 % CTR. Ranking is the constraint there, not content.

### Locale asymmetry

| Landing page | Clicks | Impressions | CTR | Position | Engagement |
|---|---|---|---|---|---|
| `/jp/sppb-test.html` | 422 | 10,175 | 4.15 % | 4.18 | 43.7 %, 41 s |
| `/jp/sppb.html` | 96 | 2,800 | 3.43 % | 4.70 | 66.7 %, 1m11s |
| `/ko/` | 79 | 1,052 | 7.51 % | 3.86 | 76.7 %, 1m08s |
| `/es/` | 15 | 2,223 | **0.67 %** | 8.54 | 36.4 %, 16 s |
| `/es/sppb.html` | 15 | 2,239 | **0.67 %** | 9.07 | 55.6 %, 38 s |
| `/sppb-test.html` (EN) | 14 | 1,713 | **0.82 %** | 9.97 | 75 %, 48 s |

- **Japan is the largest search market we have** — `/jp/sppb-test.html` alone is
  56 % of all organic clicks and 42 % of impressions. Osaka and Shinjuku City
  are both in the top four cities. Japanese engagement (41 s, 43.7 %) is the
  weakest of the major locales, which is what the on-site work below addresses.
- **Spanish has demand and cannot capture it**: 4,462 impressions across
  `/es/` and `/es/sppb.html` returning 30 clicks. A 0.67 % CTR at position
  8.5–9 is a title/meta and ranking problem, not a content problem.
- **Korea converts attention best** (76.7 %, 1m08s) on the least traffic.

### Before anything else: confirm the form actually works

All five locales post to a single Formspree endpoint (`/f/xdalkejr`). Near-zero
submissions across every locale for eight weeks is equally consistent with a
form that is silently failing — a plan limit reached, a deactivated endpoint, a
changed notification address, or delivery landing in spam.

**Submit the live form once from each locale and confirm the email arrives
before drawing any conclusion from the numbers above.** Everything else in this
document assumes the form works.

## 2. On-site changes made (see the accompanying diff)

| Change | Problem it addresses |
|---|---|
| `includes/footer-jp.html` — Japanese contact, named person, 2-business-day reply | The site read as "not purchasable in Japan": English footer, Korean addresses only |
| Domestic adoption strip above the fold on 4 JP pages | 10 Japanese institutions were buried in a flag list on `references.html` |
| Two-temperature CTAs (free document / demo loan) | Every CTA was the highest-commitment one |
| Instant document delivery on form submit | "We will email it to you" is a delayed reward; the buyer needs the document *now*, for internal circulation |
| Pre-purchase FAQ (price band, 薬機法, lead time, support, rental) | These questions were unanswered anywhere on the site; a buyer leaves rather than ask a foreign vendor |
| `jp/what-is-sppb.html` | Top-of-funnel page existed in EN and RU only — and `jp/llms.txt` already linked to it (404) |
| `jp/cardiac-rehab.html` | Segment page for the one Japanese segment with a real budget line |
| Partner / research / referral routes on `references.html` | No way to reach us as a distributor or ask for an introduction |

**Still open — needs DYPHI to supply facts.** Search the repo for `TODO(DYPHI)`:

1. **Price band** (`jp/product.html`) — a concrete range. "Contact us for
   pricing" is the single largest drop-off point for Japanese buyers.
2. **薬機法 classification** (`jp/product.html`) — whether the device is a
   regulated medical device in Japan and, if so, its class. An imported device
   with no stated regulatory position is removed from consideration by hospital
   procurement before anyone contacts the vendor. **This is the highest-value
   open item on the list.**
3. **Standard lead time** (`jp/product.html`).
4. **Brochure PDF** — upload it and set `data-download-url` on `#materialsForm`
   to switch the form to instant download. Until then it keeps the current
   "we will email you" behaviour.

---

## 3. Segment focus: cardiac rehabilitation

Of the available Japanese segments, cardiac rehabilitation is the one to push
first:

- **A budget exists.** 心大血管疾患リハビリテーション is an established,
  reimbursed programme with staffed multidisciplinary teams — unlike community
  frailty screening, where the buyer is a municipality on an annual grant cycle.
- **We already have references in it**: 順天堂大学 循環器内科, 金沢大学 循環器内科,
  神戸市立医療センター中央市民病院, and 心臓リハビリテーション学会 itself.
- **We already have content**: three Japanese case studies covering heart
  failure, the 2026 ACC Scientific Statement, and the 2026 ISHLT consensus.
- **The clinical argument is settled and published.** ACC and ISHLT both name
  SPPB directly, and both name *implementation* — not the test's value — as the
  open problem. That is exactly what an automated SPPB sells against.

`jp/cardiac-rehab.html` is built around that framing: three implementation
obstacles (inter-rater variability, time inside a clinic slot, records that
never get compared) each answered by a device capability.

---

## 4. Channel — the part the website cannot fix

Search is working: 422 organic clicks to `/jp/sppb-test.html` in eight weeks at
average position 4.18. What it is not doing is producing enquiries — and in
Japan, institutional medical devices move through relationships and
distributors, not inbound forms. Even a fixed on-site funnel will convert a
minority of this traffic. In rough order of expected speed:

### 4a. Referrals from existing Japanese installations (fastest)
Ten Japanese institutions already use AndanteFit. In Japanese institutional
purchasing, an introduction from a peer institution (既存導入先からの紹介) is
worth more than any amount of search traffic. Concretely:

- Ask 順天堂大学 循環器内科 and 金沢大学 循環器内科 for an introduction to
  neighbouring cardiac-rehab programmes.
- Ask whether any will co-author or be named in a Japanese case study. One
  named domestic case study outperforms ten translated ones.

### 4b. A Japanese distributor (highest leverage)
Many Japanese hospitals purchase only through an existing trading partner.
A single medical-device distributor covering the cardiac-rehab / rehabilitation
segment removes the "we cannot buy from an overseas vendor" objection entirely.
The `?req=partner` route on `references.html` exists so a distributor who finds
us can start that conversation; it does not replace outbound approach.

### 4c. Academic societies (builds both of the above)
The audiences are pre-qualified and the same names recur in our reference list:

- 日本心臓リハビリテーション学会 — the priority, given segment focus
- 日本老年医学会
- 日本サルコペニア・フレイル学会

Exhibiting or presenting puts the device in front of the exact buyers, and
produces the domestic case study material 4a needs.

### 4d. Search (already our largest channel — and under-harvested)
`jp/what-is-sppb.html` and `jp/cardiac-rehab.html` target Japanese policy and
clinical vocabulary (後期高齢者の質問票, 基本チェックリスト, 介護予防,
AWGS 2019, J-CHS, 心臓リハビリテーション) rather than translated English terms.

Three ranking items are worth more than new pages, in order of expected return:

1. **`sppb test` at position 12.46 on 1,317 impressions** (CTR 0.46 %). Page 2.
   The English `/sppb-test.html` is at 9.97 on 1,713 impressions. Moving either
   onto page 1 is worth more clicks than any single new article.
2. **Spanish titles and meta descriptions.** `/es/` and `/es/sppb.html` draw
   4,462 impressions and convert 0.67 % of them. Both titles lead with the
   untranslated English string "Short Physical Performance Battery"; neither
   speaks to what a Spanish-language searcher typed.
3. **Branded search has no destination.** 70 clicks for `안단테핏` /
   `andantefit` land on homepages whose only onward route is one mid-page
   "System Details →" link. These visitors already know who we are; they should
   meet a document request, not a product tour.

---

## 5. Measurement — do this before judging any of the above

GA4's "Key events by Platform" card currently reads **No data available**: no
key events are configured on the property, so conversions are invisible in
reporting even where they happen.

1. **Confirm the Formspree endpoint delivers** (see the end of section 1). This
   comes before every other item on this list.
2. **Mark key events** (Admin → Events → Key events): `generate_lead`,
   `pdf_download`, `cta_click`, `calc_complete`.
3. **Register `request_type` as a custom dimension.** It is now sent with
   `generate_lead` (`doc` / `quote` / `demo` / `regulatory` / `partner` /
   `research`), so enquiry *type* becomes visible, not just enquiry count.
4. **Track the one number that matters: content page → `product.html`.**
   Baseline is **83 of 1,900 users = 4.4 %** over 29 Jun – 23 Aug 2026. Every
   change in section 2 exists to move that figure. If it does not move, the CTA
   work failed and the next lever is ranking (section 4d), not more CTAs.
5. **Then** watch `cta_click → page_view(/jp/product.html) → generate_lead` to
   see which of the two remaining steps leaks.
6. **Fix Naver attribution** (still open from the previous review): Admin → Data
   streams → Configure tag settings → List unwanted referrals → add
   `naver.com`, and confirm Naver is registered under organic sources with
   `search.naver.com` and `m.search.naver.com`. Naver currently splits across
   `naver / organic` (228 sessions) and `m.search.naver.com / referral` (212),
   understating our best-engaging market by roughly half.

Volume is sufficient to judge these changes: at ~1,900 users per eight weeks, a
move from 4.4 % to 8 % on the product-page step is visible within a month.
