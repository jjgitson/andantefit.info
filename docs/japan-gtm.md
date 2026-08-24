# Japan Go-To-Market Plan

Written after the GA4 review that showed Japanese sessions landing almost
entirely on `/jp/sppb-test.html` and producing **zero** brochure requests or
enquiries.

---

## 1. What the data actually says

| Metric (review window) | Value |
|---|---|
| Japan organic sessions | 8 |
| All sessions, all countries | 38 |
| `/jp/sppb-test.html` avg. engagement time | 10 s |
| `/jp/sppb-test.html` engagement rate | 12.5 % |
| Japan enquiries / brochure requests | 0 |

**Zero enquiries at this volume is the expected outcome, not a signal.** At a
typical B2B medical-device document-request rate of 1–3 %, 8 sessions predict
0.08–0.24 requests. No amount of on-site optimisation produces a lead from 8
visits.

Two things *are* real signals:

1. **Engagement collapsed.** The previous review (`analytics-optimization.md`)
   recorded `/jp/sppb-test.html` at 240 sessions / 32 s / 42 %. It is now
   10 s / 12.5 %.
2. **Intent mismatch.** The page ranks for `SPPB検査方法` — a clinician who
   needs to score a patient *right now*. That visitor has no purchasing
   authority and no purchasing intent. Reading the scoring table and leaving in
   10 s is correct behaviour for them, not a failure.

So the funnel had two separate problems: not enough qualified traffic, and no
step between "I needed a scoring table" and "request a demo".

---

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

At 8 sessions per period, search is not a channel yet. In Japan, institutional
medical devices move through relationships and distributors, not inbound forms.
In rough order of expected speed:

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

### 4d. Search (slowest, but compounding)
`jp/what-is-sppb.html` and `jp/cardiac-rehab.html` target Japanese policy and
clinical vocabulary (後期高齢者の質問票, 基本チェックリスト, 介護予防,
AWGS 2019, J-CHS, 心臓リハビリテーション) rather than translated English terms.
This is a 3–6 month play, not a fix for the current quarter.

---

## 5. Measurement — do this before judging any of the above

The previous review's GA4 console work may still be incomplete, and until it is
done there is no way to see which step of the funnel fails.

1. **Mark key events** (Admin → Events → Key events): `generate_lead`,
   `pdf_download`, `cta_click`, `calc_complete`.
2. **New dimension to register**: `request_type` is now sent with
   `generate_lead` (`doc` / `quote` / `demo` / `regulatory` / `partner` /
   `research`). Register it as a custom dimension so enquiry *type* is visible,
   not just enquiry count.
3. **Watch this micro-funnel** for Japan, in this order — it degrades top-down:
   `session → cta_click(*_hero_band) → page_view(/jp/product.html) →
   generate_lead`. Volume is too low for conversion-rate comparisons; use it to
   see *where* the drop is, not how big it is.
4. **Do not evaluate before ~200 Japanese sessions have accumulated.** Below
   that, the difference between 0 and 2 enquiries is noise.
