// AndanteFit Main JavaScript
// Common functionality across all pages

document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      
      // Toggle aria-expanded for accessibility
      const isExpanded = navMenu.classList.contains('active');
      navToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInsideNav = navToggle.contains(event.target) || navMenu.contains(event.target);
      
      if (!isClickInsideNav && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignore empty anchors
      if (href === '#') {
        e.preventDefault();
        return;
      }
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add current year to copyright
  const currentYear = new Date().getFullYear();
  const copyrightElements = document.querySelectorAll('.footer-bottom');
  copyrightElements.forEach(element => {
    if (element.textContent.includes('©')) {
      element.textContent = element.textContent.replace(/© \d{4}/, `© ${currentYear}`);
    }
  });
  
  // External link handling (open in new tab)
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    // Skip if already has target attribute
    if (!link.hasAttribute('target')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  // Lazy loading for images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // Add fade-in animation for cards on scroll
  if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          
          // Trigger animation
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
          
          cardObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all cards except hero cards
    document.querySelectorAll('.card').forEach((card, index) => {
      // Skip cards in hero section
      if (!card.closest('.hero')) {
        cardObserver.observe(card);
      }
    });
  }
  
  // Log page view (for analytics - can be replaced with actual analytics)
  console.log('AndanteFit page loaded:', {
    page: document.title,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});

// Utility functions
const AndanteFit = {
  // Format date
  formatDate: function(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  
  // Scroll to top
  scrollToTop: function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  },
  
  // Show notification
  showNotification: function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      background-color: ${type === 'error' ? '#DC2626' : '#0F4C81'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: var(--font-family);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
};

// Add slideIn and slideOut animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(20px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Expose utility functions globally
window.AndanteFit = AndanteFit;

// ── Copy for AI ──────────────────────────────────────────────────────────────

function copyForAI() {
  const clone = document.body.cloneNode(true);

  ['#navigation-container', 'nav', 'footer', '.copy-for-ai-btn', 'script', 'style', 'noscript', '.cookie-banner']
    .forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));

  const header = '# ' + document.title + '\nSource: ' + window.location.href + '\n\n';

  const md = clone.innerHTML
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => '\n# ' + t.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => '\n## ' + t.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => '\n### ' + t.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => '\n#### ' + t.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => '\n- ' + t.replace(/<[^>]+>/g, '').trim())
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => '\n' + t.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const text = header + md;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      AndanteFit.showNotification('Copied for AI ✓');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); AndanteFit.showNotification('Copied for AI ✓'); }
  catch (e) { AndanteFit.showNotification('Copy failed — try selecting text manually', 'error'); }
  document.body.removeChild(ta);
}

function injectCopyForAIButton() {
  const btn = document.createElement('button');
  btn.className = 'copy-for-ai-btn';
  btn.setAttribute('aria-label', 'Copy page content as clean text for AI assistants');
  btn.setAttribute('title', 'Copy this page as clean text for AI assistants');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy for AI';
  btn.addEventListener('click', copyForAI);
  document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', injectCopyForAIButton);

// Activate obfuscated contact details after dynamic HTML is injected.
//
// Direct contact details (email, phone, LINE ID) are kept out of the HTML
// source so they are not picked up by search engines or address scrapers.
// They are assembled in the browser instead. This is obfuscation, not
// security: it stops indexing and casual harvesting, nothing more.
function initEmailLinks(root) {
    const scope = root || document;

    scope.querySelectorAll('a.obf-email[data-u][data-d]').forEach(function(el) {
        const email = el.dataset.u + '\u0040' + el.dataset.d;
        el.href = 'mailto:' + email;
        el.textContent = email;
    });

    // Base64-encoded values: [data-v] is the visible text, [data-h] the href
    // value, and [data-pre] an optional href prefix (tel:, LINE profile URL).
    scope.querySelectorAll('[data-obf-v]').forEach(function(el) {
        let text;
        try {
            text = decodeURIComponent(escape(window.atob(el.dataset.obfV)));
        } catch (e) {
            return; // leave the element empty rather than showing broken output
        }
        el.textContent = text;
        if (el.tagName === 'A') {
            const prefix = el.dataset.obfPre || '';
            let target = text;
            if (el.dataset.obfH) {
                try {
                    target = decodeURIComponent(escape(window.atob(el.dataset.obfH)));
                } catch (e) {
                    return;
                }
            }
            el.href = prefix + target;
            el.setAttribute('rel', 'nofollow noopener');
        }
        // Reveal the label that belongs to this value only once the value is
        // actually there, so a decode failure never leaves a dangling label.
        const row = el.closest('.obf-row');
        if (row) row.removeAttribute('hidden');
    });
}

// Static pages carry obfuscated details too, not just injected includes.
document.addEventListener('DOMContentLoaded', function () { initEmailLinks(document); });

// js/main.js 파일 맨 아래에 추가
function includeHTML() {
    const elements = document.querySelectorAll('[data-include]');
    elements.forEach(el => {
        const file = el.getAttribute('data-include');
        if (file) {
            fetch(file)
                .then(response => {
                    if (response.ok) return response.text();
                    throw new Error('Network response was not ok');
                })
                .then(data => {
                    el.innerHTML = data;
                    el.removeAttribute('data-include');
                    initEmailLinks(el);
                })
                .catch(error => console.error('Error loading include:', error));
        }
    });
}

// 기존 DOMContentLoaded 이벤트 내부 혹은 외부에 실행 추가
document.addEventListener('DOMContentLoaded', includeHTML);

// ── Analytics: lightweight GA4 event tracking ─────────────────────────────────
// Sends a custom event to GA4 (gtag) when it is present; a safe no-op otherwise.
// Analytics must never throw and break the page, so everything is wrapped.
function afTrack(eventName, params) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  } catch (e) { /* swallow — tracking is best-effort */ }
}
window.afTrack = afTrack;

document.addEventListener('DOMContentLoaded', function () {
  // Delegated click tracking. Any element carrying data-af-event reports a
  // conversion-funnel event; optional data-af-* attributes add context.
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-af-event]');
    if (!el) return;
    afTrack(el.getAttribute('data-af-event'), {
      cta_label: el.getAttribute('data-af-label') || undefined,
      cta_location: el.getAttribute('data-af-location') || undefined,
      link_url: el.getAttribute('href') || undefined,
      page_path: window.location.pathname
    });
  });

  // Lead generation: the product inquiry / materials-request form (product.html).
  //
  // The form is submitted over fetch so the visitor receives the document at
  // once instead of waiting for an email. A delayed reward loses the visitor,
  // and it also loses the internal-approval document they needed right now.
  //
  // The brochure URL comes from data-download-url on the form. When it is
  // absent the form keeps the original "we will email it to you" behaviour,
  // so the page is safe to publish before the PDF is uploaded.
  const leadForm = document.getElementById('materialsForm');
  if (leadForm) {
    // Preset the inquiry type from ?req= so a CTA can carry the visitor's
    // intent ("just the document" vs "lend me a demo unit") into the form.
    const requestField = leadForm.querySelector('[name="request_type"]');
    if (requestField && requestField.tagName === 'SELECT') {
      const requested = new URLSearchParams(window.location.search).get('req');
      if (requested && requestField.querySelector('option[value="' + CSS.escape(requested) + '"]')) {
        requestField.value = requested;
      }
    }

    const successPanel = document.getElementById('formSuccess');
    const downloadUrl = leadForm.getAttribute('data-download-url');

    leadForm.addEventListener('submit', function (e) {
      const requestType = requestField ? requestField.value : 'brochure_download';
      afTrack('generate_lead', {
        form_id: 'materialsForm',
        request_type: requestType,
        page_path: window.location.pathname
      });

      // No success panel to reveal — let the browser do its normal thing.
      if (!successPanel) return;

      e.preventDefault();
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const submitLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = leadForm.getAttribute('data-sending-label') || '…';
      }

      fetch(leadForm.action, {
        method: 'POST',
        body: new FormData(leadForm),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('submit failed');
          leadForm.querySelectorAll('.form-field, button[type="submit"]').forEach(function (el) {
            el.style.display = 'none';
          });
          successPanel.classList.remove('hidden');
          if (downloadUrl) {
            const ready = successPanel.querySelector('[data-download-slot]');
            if (ready) {
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.className = 'btn btn-primary';
              link.setAttribute('download', '');
              link.textContent = leadForm.getAttribute('data-download-label') || 'Download (PDF)';
              link.addEventListener('click', function () {
                afTrack('pdf_download', {
                  cta_location: 'materials_form_success',
                  cta_label: requestType,
                  page_path: window.location.pathname
                });
              });
              ready.appendChild(link);
              // The visitor asked for the document — start it without a second click.
              link.click();
            }
          }
          successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function () {
          // Never lose a lead to a network or CORS problem: fall back to the
          // ordinary browser submit, which Formspree also accepts.
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
          leadForm.submit();
        });
    });
  }
});
