/* Seguros Iberis · main.js · UI interactions */
(() => {
  'use strict';

  /* ---------- 1. Header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 14) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Mobile nav toggle ---------- */
  const toggle = document.getElementById('navToggle');
  const nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- 3. Form tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.form-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
    });
  });

  /* ---------- 4. Form submit feedback (no backend) ---------- */
  document.querySelectorAll('.form-panel').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '✓ Solicitud enviada';
      btn.style.background = '#1F9D7C';
      setTimeout(() => {
        form.reset();
        btn.innerHTML = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 2600);
    });
  });

  /* ---------- 5. Counter animation ---------- */
  const counters = document.querySelectorAll('.stat-num');
  const animateCount = el => {
    const target = +el.dataset.count || 0;
    const duration = 1600;
    const start = performance.now();
    const fmt = new Intl.NumberFormat('es-CO');
    const step = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt.format(Math.floor(target * eased));
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt.format(target);
    };
    requestAnimationFrame(step);
  };

  /* ---------- 6. Intersection reveal + counters ---------- */
  const candidates = document.querySelectorAll(
    '.hero-copy, .hero-visual, .pillar, .service-card, .biz-card, .porque-card, .faq-item, .frame-card, .stat, .logo-pill, .plans, .cta-band, .info-list, .form-card'
  );
  candidates.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        if (entry.target.classList.contains('stat')) {
          const n = entry.target.querySelector('.stat-num');
          if (n && !n.dataset.done) { n.dataset.done = '1'; animateCount(n); }
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    candidates.forEach(el => io.observe(el));
  } else {
    candidates.forEach(el => el.classList.add('in-view'));
    counters.forEach(n => animateCount(n));
  }

  /* ---------- 7. Smooth-scroll offset for sticky header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---------- 8. Year footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
