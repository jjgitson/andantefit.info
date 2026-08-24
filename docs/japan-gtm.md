# Japan Go-To-Market Plan

Written after the GA4 / Search Console review covering 29 Jun – 23 Aug 2026.
Japan is our largest search market — `/jp/sppb-test.html` alone takes 56 % of
all organic clicks and Japan 68 % of them in total — and it has produced none of
the roughly ten document requests the site has received. Italy, which we do not
localise for, produced one.

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
| Formspree submissions, all countries | ~10 (one from Italy) |
| **Submissions from Japan** | **0** |

### The form works. The funnel is one step wide.

| Step | Rate |
|---|---|
| All users → `product.html` | **4.4 %** (83 / 1,900) |
| `product.html` → submitted form | **12 %** (10 / 83) |
| End to end | 0.53 % |

0.53 % end-to-end sits at the low end of the normal 0.5–2 % band for a gated
document on a B2B medical-device site — so the site is not broken. But the two
steps are wildly asymmetric. **The form converts one visitor in eight who
reaches it**, which is strong; `product.html` also has the lowest bounce rate on
the site (19.6 %). Almost nobody arrives.

That makes the arithmetic unusually clean: requests scale with reach, and reach
is the only lever that matters right now.

| If reach goes to | Users on `product.html` | Requests / 8 weeks |
|---|---|---|
| 6 % | 114 | ~14 |
| 8 % | 152 | ~18 |
| 10 % | 190 | ~23 |
| 15 % | 285 | ~34 |

Nothing about the form, the copy on `product.html`, or the offer needs to change
to get there. Do not spend effort on them.

*(Two earlier readings of this question were wrong and are corrected here: an
8-session window suggested zero requests was statistically expected, and a
later revision assumed submissions were near zero site-wide. Neither held.)*

### Japan's zero is the anomaly, and it is not a volume effect

Japan supplies **68 % of all Google organic clicks** (518 of 758) and is the
site's largest market by landing-page users — and produced **none** of the ten
requests. Italy, which we do not localise for at all, produced one.

If Japan converted at the same rate as everywhere else, zero out of ten is
unlikely on its own:

| Japan's share of traffic | Expected requests | P(observing 0) |
|---|---|---|
| 30 % | 3.0 | 2.8 % |
| 35 % | 3.5 | 1.4 % |
| 40 % | 4.0 | 0.6 % |

So Japan is converting materially worse than the rest of the site, not merely
producing a small number. A locale we serve fully in its own language lost to
one we do not serve at all — which points at trust and contact, not language.
That is what the changes in section 2 address.

### Where the reach problem lives

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

### The Formspree endpoint is confirmed working

All five locales post to a single endpoint (`/f/xdalkejr`); roughly ten
submissions have arrived through it, so silent failure is ruled out. Worth
keeping in view: a single shared endpoint gives no locale attribution on the
Formspree side. The form now posts a `locale` field and `request_type`, so
future submissions can be split by market and by intent without relying on GA4.

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

## 5. Measurement

GA4's "Key events by Platform" card currently reads **No data available**: no
key events are configured on the property, so conversions are invisible in
reporting even where they happen. The Formspree inbox is the only record today.

1. **Mark key events** (Admin → Events → Key events): `generate_lead`,
   `pdf_download`, `cta_click`, `calc_complete`.
2. **Register `request_type` as a custom dimension.** It is now sent with
   `generate_lead` (`doc` / `quote` / `demo` / `regulatory` / `partner` /
   `research`), so enquiry *type* becomes visible, not just enquiry count. The
   form also posts a `locale` field, so Formspree submissions can be split by
   market without relying on GA4.
3. **Track the one number that matters: all users → `product.html`.**
   Baseline is **83 of 1,900 users = 4.4 %** over 29 Jun – 23 Aug 2026. Every
   change in section 2 exists to move that figure. The second step
   (`product.html` → submission) is already at 12 % and needs no work; if reach
   moves and requests do not follow, that assumption is what broke.
4. **Watch Japan separately.** Japan is 68 % of organic clicks and produced none
   of the ten requests. One Japanese request inside the next eight weeks is the
   first evidence that the section 2 changes did anything.
5. **Fix Naver attribution** (still open from the previous review): Admin → Data
   streams → Configure tag settings → List unwanted referrals → add
   `naver.com`, and confirm Naver is registered under organic sources with
   `search.naver.com` and `m.search.naver.com`. Naver currently splits across
   `naver / organic` (228 sessions) and `m.search.naver.com / referral` (212),
   understating Korea by roughly half.

Volume is sufficient to judge this: at ~1,900 users per eight weeks, a move from
4.4 % to 8 % on the product-page step is visible within a month, and would take
requests from ~10 to ~18 per period.
