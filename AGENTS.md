# AGENTS.md — AndanteFit Repository Guide

This file is the entry point for AI coding agents working on the andantefit.info repository.

## What This Project Is

AndanteFit is a static HTML website (GitHub Pages) for a clinical hardware device that automates the Short Physical Performance Battery (SPPB) — the international gold standard for measuring physical function in older adults. The site is multilingual (English, Korean, Spanish, Japanese) and serves clinicians, geriatric researchers, and pharmaceutical companies.

**Live site:** https://andantefit.info  
**Hosting:** GitHub Pages (branch: main, CNAME: andantefit.info)

## Project Structure

```
/
├── index.html              # Homepage (EN)
├── what-is-sppb.html       # SPPB clinical reference guide (EN)
├── product.html            # Product/device details (EN)
├── validation.html         # Peer-reviewed evidence (EN)
├── references.html         # Institutional clients (EN)
├── case-studies.html       # Case study index (EN)
├── sppb-test.html          # Interactive SPPB scoring tool (EN)
├── what-is-sppb.md         # Clean Markdown version for AI agents (EN)
├── product.md              # Clean Markdown version for AI agents (EN)
├── llms.txt                # AI agent site index (EN)
├── robots.txt              # Crawler access rules
├── AGENTS.md               # This file
├── sitemap-main.xml        # Sitemap index
├── css/style.css           # Single stylesheet (911 lines)
├── js/
│   ├── language-manager.js # Browser language detection + redirect
│   ├── main.js             # Common functionality (nav, lazy-load, copy-for-ai)
│   └── navigation.js       # Navigation component
├── assets/                 # Images and SVGs
├── data/publications.json  # 50+ peer-reviewed SPPB publications database
├── includes/footer.html    # Shared footer component
├── case-studies/           # Individual case study HTML files (EN)
├── ko/                     # Korean language mirror (same structure as root)
├── es/                     # Spanish language mirror
└── jp/                     # Japanese language mirror
```

## Key Patterns and Conventions

- **No build system.** All HTML is hand-authored. Edit `.html` files directly.
- **Language routing** is handled by `js/language-manager.js` on every page load — it reads the browser's `navigator.language` and redirects to `/ko/`, `/es/`, or `/jp/` paths. Do not break synchronous script loading in `<head>`.
- **Navigation** is dynamically injected into `<div id="navigation-container">` by `js/navigation.js`. The navigation HTML is not in individual page files.
- **CSS variables** are defined at the top of `css/style.css`. Use these instead of hardcoded colors or sizes.
- **Multilingual parity:** Any content change to an English page should have a corresponding change in `/ko/`, `/es/`, `/jp/` equivalents. Note that Japanese pages live under `/jp/` (not `/ja/`).
- **Images** use `.webp` format where available for performance; PNG fallbacks exist.
- **Token count meta tags** are included in key page `<head>` sections for AI agent context budgeting.

## AEO (Agentic Engine Optimization) Files

This site implements AEO to ensure AI agents can discover and use the content:

| File | Purpose |
|------|---------|
| `/llms.txt` | AI agent site index with page descriptions and token estimates |
| `/ko/llms.txt`, `/es/llms.txt`, `/jp/llms.txt` | Language-specific AI agent indexes |
| `AGENTS.md` | This file — repository guide for AI coding agents |
| `robots.txt` | Explicitly allows all major AI crawlers |
| `*.md` (key pages) | Clean Markdown versions of content pages |

## Analytics

- **Google Analytics 4** — Measurement ID: `G-0L4ENVHFYP`
- Included via standard gtag script in each page's `<head>`
- Track AI referral traffic from: `claude.ai`, `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`

## No API / No Backend

This is a pure static site. There is no:
- REST API or GraphQL endpoint
- Server-side rendering
- Database
- Authentication system
- CMS

Contact/inquiry is via Formspree embedded in `product.html`.

## Content Guidelines

- All clinical claims must be supported by peer-reviewed publications listed in `data/publications.json`
- SPPB scores: 0–12 scale; cut-off ≤6 = severe functional limitation, ≤9 = moderate limitation
- Do not add unsupported medical claims
- Preferred terminology: "SPPB" (not "sppb"), "AndanteFit" (one word, capital A and F)

## Deployment

Push to `main` branch → GitHub Pages auto-deploys within ~1 minute. No build step required.
