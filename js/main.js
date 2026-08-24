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
        submitBtn.textContent = '送信中…';
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
              link.textContent = 'パンフレットをダウンロード（PDF） ↓';
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

// ── Sitewide post-reading journey for Korean case studies ────────────────────
// Reading → related evidence → solution understanding.
(function () {
  const path = window.location.pathname;
  const isKoreanCaseStudy = /^\/ko\/case-studies\/[^/]+\.html$/.test(path);
  if (!isKoreanCaseStudy) return;

  const library = {
    oncology: [
      { href: '/ko/case-studies/2026-02-20-Oncology-SPPB-AndanteFit-KR.html', kicker: '암 환자 기능평가', title: '항암 환자에서 신체기능평가(SPPB)가 중요한 이유' },
      { href: '/ko/case-studies/2026-08-02-Perioperative-Prehabilitation-Early-Exercise-SPPB-KR.html', kicker: '수술 전후 회복', title: '수술 전부터 회복을 설계해야 하는 이유' }
    ],
    sarcopenia: [
      { href: '/ko/case-studies/2026-04-06-Sarcopenia-Management-Korea-KR.html', kicker: '근감소증 관리', title: '근감소증 관리의 전환과 한국의 적용' },
      { href: '/ko/case-studies/2026-07-11-Sarcopenia-Drug-Development-SPPB-KR.html', kicker: '임상 결과평가', title: '근육량보다 신체기능이 중요한 이유' }
    ],
    cardiopulmonary: [
      { href: '/ko/case-studies/2026-02-22-Heart-Failure-Cardiopulmonary-Rehab-SPPB-KR.html', kicker: '심폐재활', title: '심부전·심폐재활에서의 SPPB 활용' },
      { href: '/ko/case-studies/2026-02-21-Endocrinology-SPPB-Strategy-KR.html', kicker: '만성질환 관리', title: '내분비 클리닉의 SPPB 도입 전략' }
    ],
    community: [
      { href: '/ko/case-studies/2026-02-18-Community-Frailty-Prevention-Program-KR.html', kicker: '지역사회 노쇠예방', title: '지역사회 노쇠예방 프로그램의 설계' },
      { href: '/ko/case-studies/2026-02-18-Checkup-Event-Community-CSR-KR.html', kicker: '커뮤니티 체크업', title: '신체나이 체크업 이벤트 운영 사례' }
    ],
    occupational: [
      { href: '/ko/case-studies/2026-04-04-SPPB-Occupational-Health-KR.html', kicker: '산업보건', title: '산업보건 현장에서의 SPPB 활용' },
      { href: '/ko/case-studies/2026-04-05-Pain-To-Function-Paradigm-Shift-KR.html', kicker: '기능 중심 관리', title: '통증 중심에서 기능 중심으로의 전환' }
    ],
    default: [
      { href: '/ko/case-studies/2026-07-11-Sarcopenia-Drug-Development-SPPB-KR.html', kicker: '임상 결과평가', title: '근육량보다 신체기능이 중요한 이유' },
      { href: '/ko/case-studies/2026-02-20-Oncology-SPPB-AndanteFit-KR.html', kicker: '임상 적용', title: '항암 환자에서 SPPB가 중요한 이유' }
    ]
  };

  function getTopicKey() {
    const text = [
      document.title,
      document.querySelector('meta[name="keywords"]')?.content || '',
      document.querySelector('meta[name="description"]')?.content || '',
      document.querySelector('h1')?.textContent || ''
    ].join(' ').toLowerCase();

    if (/암|oncolog|cancer|수술|prehabilitation|eras/.test(text)) return 'oncology';
    if (/근감소|sarcopen|glp-1|근육|frailty|노쇠/.test(text)) return 'sarcopenia';
    if (/심부전|심폐|cardiac|heart failure|pulmonary/.test(text)) return 'cardiopulmonary';
    if (/지역사회|community|csr|체크업|예방프로그램/.test(text)) return 'community';
    if (/산업보건|occupational|근로자|작업/.test(text)) return 'occupational';
    return 'default';
  }

  function injectJourney() {
    if (document.querySelector('.post-reading, .af-post-reading')) return;

    const article = document.querySelector('main .article-body, main .body, main article, main');
    if (!article) return;

    const topicKey = getTopicKey();
    const currentPath = window.location.pathname;
    const related = (library[topicKey] || library.default)
      .filter(item => item.href !== currentPath)
      .slice(0, 2);

    const section = document.createElement('section');
    section.className = 'af-post-reading';
    section.setAttribute('aria-labelledby', 'af-continue-reading-title');
    section.innerHTML = `
      <div class="af-journey-steps" aria-label="콘텐츠 탐색 단계">
        <span class="is-current">1. 읽기 완료</span><span aria-hidden="true">→</span><span>2. 관련 근거</span><span aria-hidden="true">→</span><span>3. 솔루션 이해</span>
      </div>
      <h2 id="af-continue-reading-title">다음 단계로 이어서 살펴보세요</h2>
      <p class="af-post-reading-intro">관련 연구와 적용 사례를 확인한 뒤, SPPB와 자동화 신체기능평가가 임상 현장에서 어떻게 활용되는지 살펴볼 수 있습니다.</p>
      <div class="af-related-grid">
        ${related.map(item => `<a class="af-related-card" href="${item.href}" data-af-event="select_related_content" data-af-label="${item.title}" data-af-location="post_reading"><span class="af-related-kicker">${item.kicker}</span><span class="af-related-title">${item.title}</span><span class="af-related-more">관련 근거 읽기 →</span></a>`).join('')}
      </div>
      <nav class="af-next-actions" aria-label="글을 읽은 뒤 이동">
        <a class="af-back-link" href="/ko/case-studies.html" data-af-event="return_to_case_studies" data-af-label="케이스 스터디 목록" data-af-location="post_reading">← 케이스 스터디 목록</a>
        <a class="af-solution-link" href="/ko/sppb.html" data-af-event="view_solution" data-af-label="SPPB와 자동화 평가" data-af-location="post_reading">SPPB와 자동화 평가 알아보기 →</a>
      </nav>`;

    article.appendChild(section);
  }

  const journeyStyle = document.createElement('style');
  journeyStyle.textContent = `
    .af-post-reading{margin-top:56px;padding-top:34px;border-top:1px solid #e2e8f0}
    .af-post-reading h2{margin:16px 0 8px!important;font-size:1.28rem!important;color:#0f172a!important}
    .af-post-reading-intro{margin:0 0 22px!important;color:#64748b!important;font-size:.95rem!important;line-height:1.75!important}
    .af-journey-steps{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:#64748b;font-size:.78rem;font-weight:700}
    .af-journey-steps .is-current{color:#0f766e}
    .af-related-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .af-related-card{display:flex;flex-direction:column;padding:20px;border:1px solid #e2e8f0;border-radius:10px;text-decoration:none;background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s}
    .af-related-card:hover,.af-related-card:focus-visible{border-color:#5eead4;box-shadow:0 8px 22px rgba(15,23,42,.07);transform:translateY(-2px);outline:none}
    .af-related-kicker{display:block;margin-bottom:8px;color:#0d9488;font-size:.78rem;font-weight:700}
    .af-related-title{display:block;color:#0f172a;font-size:1rem;font-weight:700;line-height:1.55}
    .af-related-more{display:block;margin-top:auto;padding-top:14px;color:#0f766e;font-size:.82rem;font-weight:700}
    .af-next-actions{display:flex;align-items:stretch;gap:12px;margin-top:24px}
    .af-next-actions a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;line-height:1.4}
    .af-back-link{flex:1;color:#0f766e;border:1px solid #99f6e4;background:#f0fdfa}
    .af-solution-link{flex:1;color:#fff;background:#0f766e;border:1px solid #0f766e}
    .af-back-link:hover,.af-back-link:focus-visible{background:#ccfbf1}.af-solution-link:hover,.af-solution-link:focus-visible{background:#115e59}
    .af-back-link:focus-visible,.af-solution-link:focus-visible{outline:3px solid rgba(13,148,136,.22);outline-offset:2px}
    @media(max-width:640px){.af-related-grid{grid-template-columns:1fr}.af-next-actions{flex-direction:column}.af-next-actions a{width:100%}.af-journey-steps{font-size:.74rem}}
  `;
  document.head.appendChild(journeyStyle);
  document.addEventListener('DOMContentLoaded', injectJourney);
})();
