/* Seguros Iberis · main.js · UI interactions + dual-view router */
(() => {
  'use strict';

  const body = document.body;

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
  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ---------- 3. Contact form tabs ---------- */
  const tabs = document.querySelectorAll('.form-tabs .tab');
  const panels = document.querySelectorAll('.form-panel');
  const setFormTab = target => {
    tabs.forEach(t => {
      const active = t.dataset.tab === target;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
  };
  tabs.forEach(tab => tab.addEventListener('click', () => setFormTab(tab.dataset.tab)));

  /* ---------- 4. Counter animation helper ---------- */
  const fmt = new Intl.NumberFormat('es-CO');
  const animateCount = el => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count || 0;
    const duration = 1500;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt.format(Math.floor(target * eased));
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt.format(target);
    };
    requestAnimationFrame(step);
  };

  /* ---------- 5. Reveal-on-scroll ---------- */
  const revealSelector =
    '.hero-copy, .hero-visual, .pillar, .service-card, .feature-card, .biz-card, .porque-card, .faq-item, .frame-card, .stat, .logo-pill, .plans, .cta-band, .info-list, .form-card';
  document.querySelectorAll(revealSelector).forEach(el => el.classList.add('reveal'));

  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        if (entry.target.classList.contains('stat')) {
          const n = entry.target.querySelector('.stat-num');
          if (n) animateCount(n);
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll(revealSelector).forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(revealSelector).forEach(el => el.classList.add('in-view'));
    document.querySelectorAll('.stat-num').forEach(animateCount);
  }

  /* ---------- 6. Dual-view router (Personas / Empresas) ---------- */
  const VIEWS = ['personas', 'empresas'];
  const switchButtons = document.querySelectorAll('.vs-btn');

  const revealActiveView = view => {
    const container = document.querySelector('.view--' + view);
    if (!container) return;
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    container.querySelectorAll('.stat-num').forEach(animateCount);
  };

  const setView = (view, opts = {}) => {
    if (!VIEWS.includes(view)) view = 'personas';
    body.setAttribute('data-view', view);

    switchButtons.forEach(btn => {
      const active = btn.dataset.view === view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    // Sync contact form to the relevant audience
    setFormTab(view === 'empresas' ? 'juridica' : 'natural');

    // Make sure freshly shown content is visible
    revealActiveView(view);

    if (history.replaceState) history.replaceState(null, '', '#' + view);
    else location.hash = view;

    if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  switchButtons.forEach(btn =>
    btn.addEventListener('click', () => { setView(btn.dataset.view); closeMenu(); })
  );

  // Footer quick-links that jump to a specific view
  document.querySelectorAll('[data-goto]').forEach(link =>
    link.addEventListener('click', e => {
      e.preventDefault();
      setView(link.dataset.goto);
    })
  );

  // Initial view from hash
  const initial = (location.hash || '').replace('#', '');
  if (VIEWS.includes(initial)) setView(initial, { scroll: false });
  else revealActiveView('personas');

  window.addEventListener('hashchange', () => {
    const h = (location.hash || '').replace('#', '');
    if (VIEWS.includes(h) && h !== body.getAttribute('data-view')) setView(h, { scroll: false });
  });

  /* ---------- 7. Form submit feedback (no backend) ---------- */
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

  /* ---------- 8. Smooth-scroll offset for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      if (VIEWS.includes(id.replace('#', ''))) return; // handled by view router
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---------- 9. Year footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 10. Cotizador exprés → WhatsApp ---------- */
  const WA_PHONE = '573336025110';
  const quoteTabs = document.querySelectorAll('.qt');
  const quoteForms = document.querySelectorAll('.quote-form');

  const setQuoteTab = target => {
    quoteTabs.forEach(t => {
      const active = t.dataset.quote === target;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    quoteForms.forEach(f => f.classList.toggle('is-active', f.dataset.form === target));
  };
  quoteTabs.forEach(t => t.addEventListener('click', () => setQuoteTab(t.dataset.quote)));

  // Sync con la vista actual al cambiar de view
  const syncQuoteWithView = () => {
    const v = body.getAttribute('data-view');
    if (v === 'empresas' || v === 'personas') setQuoteTab(v);
  };
  syncQuoteWithView();
  window.addEventListener('hashchange', syncQuoteWithView);
  document.querySelectorAll('.vs-btn').forEach(b => b.addEventListener('click', () => setTimeout(syncQuoteWithView, 50)));

  // Submit → WhatsApp con mensaje pre-armado
  const labels = {
    producto: 'Producto', ciudad: 'Ciudad', edad: 'Edad', nombre: 'Nombre',
    telefono: 'Teléfono', tamano: 'Tamaño', sector: 'Sector', empresa: 'Empresa'
  };
  quoteForms.forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const tipo = form.dataset.form === 'empresas' ? 'EMPRESA' : 'PERSONA';
      const lines = [`*Solicitud de cotización (${tipo})*`, ''];
      for (const [k, v] of data.entries()) {
        if (!v || !String(v).trim()) continue;
        lines.push(`• *${labels[k] || k}*: ${v}`);
      }
      lines.push('', 'Quiero recibir asesoría personalizada. Gracias 🌼');
      const msg = encodeURIComponent(lines.join('\n'));
      window.open(`https://wa.me/${WA_PHONE}?text=${msg}`, '_blank', 'noopener');

      // Feedback visual
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '✓ Abriendo WhatsApp…';
      setTimeout(() => { btn.innerHTML = original; }, 2200);
    });
  });
})();
