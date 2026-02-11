# AndanteFit Website

Professional, data-driven website for AndanteFit automated physical performance assessment system.

## 🎯 Design Philosophy

- **Customer-Oriented**: Data, logic, and standardization over marketing copy
- **Zero-Maintenance**: Case studies auto-update from folder uploads
- **Professional**: Research-grade typography (Inter), ample whitespace, "older adults" terminology

## 🛠️ Technology Stack

- **Hosting**: GitHub Pages
- **Framework**: Vanilla JavaScript + GitHub API
- **Build**: None required - instant updates on file upload

## 📁 Project Structure

```
andantefit-website/
├── index.html              # Home page
├── product.html            # Product details
├── validation.html         # Evidence & publications
├── case-studies.html       # Auto-generated from folder
├── css/
│   └── style.css          # Design system
├── js/
│   └── main.js            # Common functionality
├── data/
│   └── publications.json  # Publication database
├── assets/                # Images (logo, hero, etc.)
└── case-studies/          # Drop HTML files here (auto-listed)
```

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/YOUR_USERNAME/andantefit-website.git
cd andantefit-website
```

### 2. GitHub Pages Setup

1. Go to repository **Settings** → **Pages**
2. Under "Source", select **Deploy from a branch**
3. Branch: `main`, Folder: `/ (root)`
4. Click **Save**

Your site will be available at: `https://YOUR_USERNAME.github.io/andantefit-website/`

### 3. Configure Case Studies Auto-Listing

Edit `case-studies.html` and update the `GITHUB_CONFIG` object:

```javascript
const GITHUB_CONFIG = {
  owner: 'YOUR_GITHUB_USERNAME',  // Your GitHub username
  repo: 'andantefit-website',     // Your repository name
  folder: 'case-studies',         // Don't change this
  branch: 'main'                  // Or 'master' if that's your default
};
```

## 📝 Adding Case Studies (Zero-Maintenance Workflow)

### Step 1: Create Content in Canvas

Create your case study/report in Canvas (or any tool that exports HTML).

### Step 2: Export as HTML

- Export as a **single HTML file**
- Ensure all assets are embedded (base64 images, inline CSS)

### Step 3: Name File Correctly

Use this naming convention:

```
YYYY-MM-DD-Title-Words.html
```

**Examples:**
- `2026-02-10-Pilot-Study-Seoul.html`
- `2025-12-15-Clinical-Trial-Results.html`
- `2026-01-20-Community-Implementation.html`

### Step 4: Upload to Repository

1. Navigate to `case-studies/` folder in your GitHub repository
2. Click **Add file** → **Upload files**
3. Drag and drop your HTML file
4. Click **Commit changes**

### Step 5: Verify (1-2 minutes)

Wait 1-2 minutes for GitHub Pages to rebuild, then visit:
`https://YOUR_USERNAME.github.io/andantefit-website/case-studies.html`

Your new case study will appear automatically as a card!

## 🎨 Design System

### Colors

```css
--color-deep-blue: #0F4C81       /* Primary brand color */
--color-deep-blue-dark: #0B3A62  /* Hover states */
--color-soft-gray: #F8FAFC       /* Background */
--color-white: #FFFFFF           /* Cards, navigation */
```

### Typography

```css
--font-family: 'Inter'           /* Primary font */
--line-height-base: 1.7          /* Body text (research-grade) */
--line-height-tight: 1.3         /* Headings */
```

### Spacing

```css
--spacing-section: 80px          /* Between major sections */
--spacing-component: 40px        /* Between components */
```

### Layout

```css
--max-width: 1200px              /* Content container */
```

## 📊 Managing Publications

### Update Publications

Edit `data/publications.json`:

```json
{
  "lastUpdated": "2026-02-01",
  "publications": [
    {
      "year": "2026",
      "title": "Your Paper Title",
      "authors": "Author Names",
      "journal": "Journal Name",
      "volume": "X(Y)",
      "pages": "123-456",
      "doi": "https://doi.org/10.xxxx/xxxxx"
    }
  ]
}
```

The validation page will automatically display the updated list.

## 🖼️ Adding Images

### Logo

Replace `assets/logo.png` with your logo file (recommended: PNG, transparent background).

### Hero Background

Replace `assets/hero-bg.png` with a high-quality background image.

### Product Images

Add product photos to `assets/` folder and reference them in HTML:

```html
<img src="assets/product.jpg" alt="AndanteFit System">
```

## 🔧 Customization

### Change Colors

Edit `css/style.css`, find the `:root` section:

```css
:root {
  --color-deep-blue: #YOUR_COLOR;
  /* ... other colors ... */
}
```

### Modify Navigation

Edit the `<nav>` section in each HTML file to add/remove links.

### Update Contact Info

Edit footer in each HTML file:

```html
<div class="footer-section">
  <h4>Contact</h4>
  <p>
    Email: <a href="mailto:YOUR_EMAIL">YOUR_EMAIL</a><br>
    <!-- Update addresses -->
  </p>
</div>
```

## 📱 Mobile Responsive

The site is fully responsive and works on all devices. Test at:

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## ♿ Accessibility

- Semantic HTML5
- ARIA labels on navigation
- Proper heading hierarchy
- Sufficient color contrast (WCAG AA compliant)
- Keyboard navigation support

## 🔍 SEO

Each page includes:

- Descriptive `<title>` tags
- Meta descriptions
- Open Graph tags (for social sharing)
- Semantic HTML structure

To improve SEO, edit the `<head>` section of each page.

## 🐛 Troubleshooting

### Case Studies Not Loading

1. Check GitHub Pages is enabled (Settings → Pages)
2. Verify `GITHUB_CONFIG` in `case-studies.html` is correct
3. Ensure repository is **public** (or use GitHub token for private repos)
4. Wait 1-2 minutes after upload for GitHub Pages to rebuild

### Publications Not Showing

1. Check `data/publications.json` is valid JSON (use https://jsonlint.com)
2. Clear browser cache
3. Check browser console for errors (F12)

### Images Not Loading

1. Ensure images are in correct folder (`assets/`)
2. Check file paths are correct (case-sensitive)
3. Verify image files are committed to repository

## 📞 Support

For technical issues or questions:

- **Email**: snm@dyphi.com
- **GitHub Issues**: [Repository Issues Page]

## 📄 License

© 2026 DYPHI Inc. All Rights Reserved.

---

**Last Updated**: February 2026
