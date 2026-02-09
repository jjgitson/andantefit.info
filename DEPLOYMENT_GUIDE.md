# 🚀 AndanteFit Website - Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `andantefit-website`
3. Description: "Professional website for AndanteFit automated SPPB assessment"
4. Visibility: **Public**
5. Click **Create repository**

### Step 2: Upload Files

#### Option A: GitHub Web Interface (Easiest)

1. On your new repository page, click **uploading an existing file**
2. Drag all files from the `andantefit-website` folder into the upload area
3. Make sure to maintain the folder structure:
   ```
   ├── index.html
   ├── product.html
   ├── validation.html
   ├── case-studies.html
   ├── css/
   ├── js/
   ├── data/
   ├── assets/  (create this empty folder)
   └── case-studies/
   ```
4. Write commit message: "Initial website setup"
5. Click **Commit changes**

#### Option B: Git Command Line

```bash
# Navigate to your website folder
cd andantefit-website

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial website setup"

# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/andantefit-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. In your repository, go to **Settings**
2. Click **Pages** in the left sidebar
3. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

Wait 1-2 minutes for deployment. Your site will be available at:

```
https://YOUR_USERNAME.github.io/andantefit-website/
```

### Step 4: Configure Case Studies Auto-Listing

1. Open `case-studies.html` in your repository
2. Click the **pencil icon** (Edit this file)
3. Find the `GITHUB_CONFIG` object (around line 90)
4. Update:
   ```javascript
   const GITHUB_CONFIG = {
     owner: 'YOUR_GITHUB_USERNAME',  // Replace this
     repo: 'andantefit-website',
     folder: 'case-studies',
     branch: 'main'
   };
   ```
5. Click **Commit changes**

### Step 5: Test Your Website

Visit your GitHub Pages URL and verify:

- ✅ Home page loads correctly
- ✅ Navigation works (Product, Validation, Case Studies)
- ✅ Publications list displays
- ✅ Sample case study appears in Case Studies page

---

## 🎨 Adding Your Logo and Images

### Logo

1. Prepare your logo:
   - Format: PNG with transparent background
   - Size: 400px × 60px (width × height)
   - Name: `logo.png`

2. Upload to `assets/` folder:
   - In GitHub repository, navigate to `assets/`
   - Click **Add file** → **Upload files**
   - Upload `logo.png`
   - Commit changes

3. Update HTML files:
   - Edit the navigation section in each HTML file
   - Replace:
     ```html
     <span>AndanteFit</span>
     ```
   - With:
     ```html
     <img src="assets/logo.png" alt="AndanteFit">
     ```

### Hero Background Image

1. Prepare image:
   - Format: JPG or PNG
   - Size: 1920px × 1080px (or similar 16:9 ratio)
   - Name: `healthy_aging.png` (or your choice)

2. Upload to `assets/` folder

3. Update `index.html` hero section:
   ```css
   .hero {
     background-image: url('assets/healthy_aging.png');
     background-size: cover;
     background-position: center;
   }
   ```

### Product Image

1. Upload product image to `assets/` (e.g., `andantefit.jpg`)

2. Add to `index.html` or `product.html`:
   ```html
   <img src="assets/andantefit.jpg" 
        alt="AndanteFit SPPB Assessment System"
        style="max-width: 100%; border-radius: 12px;">
   ```

---

## 📝 Adding Case Studies (Ongoing)

### Every Time You Create a New Case Study:

1. **Create content** in Canvas (or any tool)
2. **Export as HTML** (single file)
3. **Name correctly**: `YYYY-MM-DD-Your-Title.html`
   - Example: `2026-02-15-Hospital-Trial-Results.html`
4. **Upload** to `case-studies/` folder in GitHub
5. **Wait 1-2 minutes** - it will auto-appear on your website!

**No code editing required!**

---

## 🔧 Common Customizations

### Change Colors

Edit `css/style.css`, find `:root` section:

```css
:root {
  --color-deep-blue: #0F4C81;     /* Change this */
  --color-deep-blue-dark: #0B3A62; /* And this */
}
```

### Update Contact Information

Edit footer in all HTML files:

```html
<div class="footer-section">
  <h4>Contact</h4>
  <p>
    Email: <a href="mailto:YOUR_EMAIL">YOUR_EMAIL</a><br>
    Address 1<br>
    Address 2
  </p>
</div>
```

### Add New Publications

Edit `data/publications.json`:

```json
{
  "publications": [
    {
      "year": "2026",
      "title": "New Paper Title",
      "authors": "Author Names",
      "journal": "Journal Name",
      "volume": "X(Y)",
      "pages": "1-10",
      "doi": "https://doi.org/..."
    }
  ]
}
```

---

## 🆘 Troubleshooting

### Website Not Showing

- Wait 2-3 minutes after enabling GitHub Pages
- Check repository is **Public**
- Verify all files uploaded correctly
- Clear browser cache (Ctrl+Shift+R)

### Case Studies Not Loading

- Check `GITHUB_CONFIG` in `case-studies.html`
- Ensure repository is **Public**
- Verify file naming: `YYYY-MM-DD-Title.html`

### Images Not Displaying

- Check file paths are correct (case-sensitive!)
- Verify images are in `assets/` folder
- Check image files committed to repository

### Need More Help?

Email: snm@dyphi.com

---

## ✅ Post-Deployment Checklist

- [ ] Website loads at GitHub Pages URL
- [ ] Navigation works on all pages
- [ ] Logo displays correctly
- [ ] Publications list loads
- [ ] Case studies auto-generate
- [ ] Mobile responsive (test on phone)
- [ ] Contact email works
- [ ] All links go to correct pages

**Congratulations! Your website is live! 🎉**
