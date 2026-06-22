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

  // Modo "captura" (?screenshot=1): oculta elementos fixed para capturas full-page limpias
  if (location.search.includes('screenshot=1')) {
    const style = document.createElement('style');
    style.textContent = '.float-whats { display: none !important; }';
    document.head.appendChild(style);
  }

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

  /* ---------- 12. Modal de detalle por producto ----------
     Toda la data viene del manual/web original — sin invento.
  */
  const PRODUCTS = {
    // ===== EMPRESAS · Líneas financieras =====
    'vida-deudor': {
      eyebrow: 'Empresas · Línea financiera',
      num: '01',
      image: 'assets/vidadeudor.png',
      title: 'Vida Deudor',
      lead: 'Protección financiera que salvaguarda tu familia y tu patrimonio. Cubre el saldo de la deuda si el titular fallece o queda incapacitado.',
      cubre: [
        'Preexistencias cubiertas',
        'Valor asegurado equivalente al saldo insoluto de la deuda',
        'Muerte por cualquier causa desde el primer día (incluye suicidio, homicidio y SIDA)',
        'Incapacidad total y permanente (no aplica si ya estás pensionado)'
      ],
      respaldo: [],
      ventajas: ['Continuidad financiera', 'Protección del patrimonio', 'Tranquilidad para los socios']
    },
    'infidelidad': {
      eyebrow: 'Empresas · Línea financiera',
      num: '02',
      image: 'assets/infidelidad.png',
      tag: 'Antifraude',
      title: 'Infidelidad y riesgos financieros',
      lead: 'Antifraude corporativo para entidades financieras y firmas contables.',
      cubre: [
        'Malversación de fondos',
        'Falsificación documental',
        'Volatilidad de mercados'
      ],
      respaldo: [
        'Pérdidas financieras causadas por la infidelidad de empleados',
        'Mala gestión de riesgos financieros',
        'Otros eventos que puedan afectar la estabilidad financiera de la empresa'
      ],
      ventajas: ['Entidades financieras', 'Firmas contables / auditorías', 'Empresas con manejo de datos sensibles']
    },
    'cyber': {
      eyebrow: 'Empresas · Línea financiera',
      num: '03',
      image: 'assets/cyber.png',
      tag: 'Defensa digital',
      title: 'Seguro Cyber',
      lead: 'Defensa digital integral para empresas con datos sensibles.',
      cubre: [
        'Extorsión cibernética',
        'Restauración de datos',
        'Multas regulatorias',
        'Gestión de crisis'
      ],
      respaldo: [
        'Riesgos y pérdidas financieras que pueden surgir de incidentes cibernéticos'
      ],
      ventajas: ['Continuidad del negocio', 'Protección reputacional', 'Servicios de respuesta a incidentes']
    },
    'do': {
      eyebrow: 'Empresas · Línea financiera',
      num: '04',
      image: 'assets/do.png',
      tag: 'Talento directivo',
      title: 'D&O · Directores y Administradores',
      lead: 'Protección del talento directivo. Blindaje patrimonial personal para directores y funcionarios.',
      cubre: [
        'Demandas por negligencia',
        'Reclamos por discriminación',
        'Gastos de defensa jurídica'
      ],
      respaldo: [
        'Pérdidas personales que puedan sufrir como resultado de demandas presentadas contra directores y funcionarios de una empresa por presuntos actos ilícitos cometidos en su capacidad de gestión'
      ],
      ventajas: ['Atracción de ejecutivos calificados', 'Blindaje patrimonial personal', 'Cumplimiento de normativas']
    },
    'rc': {
      eyebrow: 'Empresas · Línea financiera',
      num: '05',
      image: 'assets/responsabilidadcivil.png',
      title: 'Responsabilidad Civil Extracontractual (RCE)',
      lead: 'Escudo legal para imprevistos derivados de tu operación empresarial.',
      cubre: [
        'Daños a terceros por actividades empresariales',
        'Indemnizaciones y gastos legales',
        'Eventos durante ejecución de contratos'
      ],
      respaldo: [
        'Protección en caso de demandas y reclamos de terceros',
        'Asistencia legal',
        'Seguridad y tranquilidad para tu negocio'
      ],
      ventajas: ['Resguardo del patrimonio corporativo', 'Asesoría en prevención de riesgos', 'Coberturas adaptables a cada sector']
    },
    'pymes': {
      eyebrow: 'Empresas · Línea financiera',
      num: '06',
      image: 'assets/danosmateriales.png',
      tag: 'Capital tangible',
      title: 'Daños Materiales Pymes',
      lead: 'Tu capital tangible protegido frente a siniestros. Para empresas pequeñas o medianas.',
      cubre: [
        'Incendios',
        'Robos',
        'Fallas eléctricas',
        'Explosiones',
        'Averías',
        'Lucro cesante'
      ],
      respaldo: [
        'Pérdidas o daños a tus bienes'
      ],
      ventajas: ['Reemplazo de activos dañados', 'Responsabilidad civil incluida', 'Soporte para continuidad operativa']
    },

    // ===== PERSONAS =====
    'accidentes': {
      eyebrow: 'Personas · Plan Potenciado para Florecer',
      image: 'assets/accidentespersonales.png',
      title: 'Accidentes personales',
      lead: 'Tres planes anuales: Plan A $150.000 ($10M), Plan A $170.000 ($15M) y Plan 400 AMPLIADO $400.000 ($50M con asistencias VIP).',
      cubre: [
        'Muerte accidental (hasta $50.000.000 en Plan 400)',
        'Incapacidad total y permanente por accidente',
        'Desmembración accidental',
        'Ruptura de hueso, reembolso de gastos médicos y renta de hogar (Plan 400)'
      ],
      respaldo: [
        'Lesiones en el trabajo, accidentes de tráfico, caídas, lesiones deportivas y otros eventos accidentales'
      ],
      ventajas: ['Plan A · $150.000 ($411/día)', 'Plan A · $170.000 ($466/día)', 'Plan 400 AMPLIADO · $400.000 ($1.095/día)']
    },
    'hogar': {
      eyebrow: 'Personas · Asistencia incluida',
      image: 'assets/asistenciadelhogar.png',
      title: 'Asistencias del hogar',
      lead: 'Plomería, cerrajería y electricidad cubiertas. Soporte completo e individualizado cuando algo se sale de tus manos.',
      cubre: [
        'Plomería de urgencias',
        'Cerrajería ante pérdida de llaves o daños',
        'Electricidad: cortos, fallas y emergencias',
        '3 eventos al año en Plan 400 (1 por especialidad)'
      ],
      respaldo: [],
      ventajas: ['Plan A $150k: 2 eventos combinados', 'Plan A $170k: 2 eventos combinados', 'Plan 400: 3 eventos (1 por especialidad)']
    },
    'juridica': {
      eyebrow: 'Personas · Asistencia incluida',
      image: 'assets/asistenciajuridica.png',
      title: 'Asistencia jurídica',
      lead: 'Derechos de petición, tutelas, pensión de invalidez y sobrevivientes con minutas y acompañamiento legal continuo.',
      cubre: [
        'Derechos de petición (medicamentos, citas médicas, temas pensionales)',
        'Tutelas (medicamentos, citas, negación de prestaciones)',
        'Reclamación de prestaciones sociales ante el empleador',
        'Reconocimiento de pensión de invalidez',
        'Pensión de sobrevivientes y solicitud de bono pensional'
      ],
      respaldo: [],
      ventajas: ['Minuta para solicitud de pensión incluida', 'Asistencia legal continua', 'Disponible en todos los planes']
    },
    'educativo': {
      eyebrow: 'Personas · Producto Iberis',
      image: 'assets/iberis-asesor.jpg',
      tag: 'Nuevo',
      title: 'Seguro Educativo',
      lead: 'Invierte en su futuro con seguridad y confianza. Has que la formación de los tuyos pueda germinar.',
      cubre: [
        'Protección del proyecto educativo',
        'Inversión segura en formación'
      ],
      respaldo: [],
      ventajas: ['Producto oficial del catálogo Iberis', 'Asesoría personalizada para tu caso']
    }
  };

  const modal = document.getElementById('productModal');
  if (modal) {
    const elTitle = modal.querySelector('.pm-title');
    const elEyebrow = modal.querySelector('.pm-eyebrow');
    const elLead = modal.querySelector('.pm-lead');
    const elImg = modal.querySelector('.pm-img');
    const elNum = modal.querySelector('.pm-num');
    const elTag = modal.querySelector('.pm-tag');
    const elCubre = modal.querySelector('.pm-cubre ul');
    const elCubreSec = modal.querySelector('.pm-cubre');
    const elResp = modal.querySelector('.pm-respaldo ul');
    const elRespSec = modal.querySelector('.pm-respaldo');
    const elVentajas = modal.querySelector('.pm-ventajas .pm-pills');
    const elVentSec = modal.querySelector('.pm-ventajas');
    const elCta = modal.querySelector('.pm-cta');
    const elWa = modal.querySelector('.pm-wa');
    const closeBtn = modal.querySelector('.pm-close');

    const openProduct = key => {
      const p = PRODUCTS[key];
      if (!p) return;
      elTitle.textContent = p.title;
      elEyebrow.textContent = p.eyebrow || '';
      elLead.textContent = p.lead;
      elImg.src = p.image;
      elImg.alt = p.title;
      elNum.textContent = p.num || '';
      elNum.style.display = p.num ? '' : 'none';
      elTag.textContent = p.tag || '';

      elCubre.innerHTML = (p.cubre || []).map(x => `<li>${x}</li>`).join('');
      elCubreSec.classList.toggle('is-empty', !p.cubre || p.cubre.length === 0);

      elResp.innerHTML = (p.respaldo || []).map(x => `<li>${x}</li>`).join('');
      elRespSec.classList.toggle('is-empty', !p.respaldo || p.respaldo.length === 0);

      elVentajas.innerHTML = (p.ventajas || []).map(x => `<span>${x}</span>`).join('');
      elVentSec.classList.toggle('is-empty', !p.ventajas || p.ventajas.length === 0);

      // WhatsApp directo con mensaje pre-armado
      const waMsg = encodeURIComponent(`Hola Iberis, quiero información sobre el producto: ${p.title}`);
      elWa.href = `https://wa.me/573336025110?text=${waMsg}`;

      // CTA cotizar: cierra modal y enfoca cotizador
      elCta.onclick = () => modal.close();

      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
      // Click en el backdrop (área fuera del contenido)
      const rect = modal.querySelector('.pm-grid').getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        closeModal();
      }
    });
    modal.addEventListener('close', () => { document.body.style.overflow = ''; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.open) closeModal(); });

    // Trigger en todos los enlaces con data-product
    document.querySelectorAll('[data-product]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        openProduct(a.dataset.product);
      });
    });
  }

  /* ---------- 11. Calculadora "¿Cuál plan me conviene?" ---------- */
  const quizCard = document.getElementById('quizCard');
  if (quizCard) {
    const steps = quizCard.querySelectorAll('.quiz-step');
    const bar = quizCard.querySelector('.qp-bar');
    const current = quizCard.querySelector('.qc-current');
    const total = quizCard.querySelectorAll('.quiz-step:not(.quiz-result)').length;
    const answers = {};
    let stepIdx = 0;

    const showStep = i => {
      steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === i));
      stepIdx = i;
      if (i < total) {
        current.textContent = String(i + 1);
        bar.style.width = `${((i + 1) / total) * 100}%`;
      } else {
        bar.style.width = '100%';
      }
    };

    // Plan recommendation logic — derived strictly from sourced coverage data
    // (ayudaventas Plan A150 → $10M, Plan A170 → $15M, Plan B400 → $50M con asistencias VIP)
    const recommend = a => {
      const needsExtras = ['mascota', 'auto', 'todo'].includes(a.proteger)
        || a.cobertura === '50'
        || (a.extras && a.extras !== 'ninguno');

      if (needsExtras) {
        return {
          plan: 'B', name: 'Plan 400 AMPLIADO', price: '$400.000', daily: '$1.095/día',
          coverage: '$50.000.000',
          subtitle: 'Cobertura VIP con todas las asistencias',
          reasons: buildReasons(a, 'B'),
          quoteValue: 'Plan 400 · $400.000 VIP (cobertura $50M + asistencias)'
        };
      }
      if (a.cobertura === '15') {
        return {
          plan: 'A170', name: 'Plan A $170.000', price: '$170.000', daily: '$466/día',
          coverage: '$15.000.000',
          subtitle: 'Cobertura reforzada para tu tranquilidad',
          reasons: buildReasons(a, 'A170'),
          quoteValue: 'Plan A · $170.000 (cobertura $15M)'
        };
      }
      return {
        plan: 'A150', name: 'Plan A $150.000', price: '$150.000', daily: '$411/día',
        coverage: '$10.000.000',
        subtitle: 'Cobertura esencial al mejor precio',
        reasons: buildReasons(a, 'A150'),
        quoteValue: 'Plan A · $150.000 (cobertura $10M)'
      };
    };

    function buildReasons(a, plan) {
      const r = [];
      if (plan === 'B') {
        if (a.proteger === 'mascota' || a.proteger === 'todo') r.push('Asistencia veterinaria 24/7 + refuerzo de vacunación');
        if (a.proteger === 'auto' || a.proteger === 'todo') r.push('Remolque grúa y auxilio vial para tu carro o moto');
        if (a.extras === 'odonto') r.push('Odontología básica de urgencias');
        if (a.extras === 'reembolso') r.push('Reembolso de gastos médicos por accidente ($1M)');
        if (a.extras === 'renta') r.push('Renta de gastos de hogar por muerte accidental ($2M)');
        r.push('Cobertura $50M y todas las asistencias del catálogo Iberis');
      } else if (plan === 'A170') {
        r.push('Cobertura por accidente reforzada: $15.000.000');
        r.push('Asistencia médica 24/7 sin límite + acompañamiento a citas');
        r.push('Asistencia al hogar (plomería, cerrajería, electricidad)');
        r.push('Asistencia legal: derechos de petición y tutelas');
      } else {
        r.push('Cobertura esencial $10.000.000 por accidente');
        r.push('Orientación médica 24/7 sin límite');
        r.push('Asistencia al hogar y jurídica incluidas');
        r.push('Solo $411 al día por la protección que necesitas');
      }
      return r.slice(0, 4);
    }

    const showResult = () => {
      const result = quizCard.querySelector('.quiz-result');
      const r = recommend(answers);
      result.innerHTML = `
        <span class="qr-badge">Plan recomendado para ti</span>
        <h3 class="qr-title">${r.name}</h3>
        <p class="qr-sub">${r.subtitle}</p>
        <div class="qr-stat">
          <div><strong>${r.coverage}</strong><span>Cobertura por accidente</span></div>
          <div><strong>${r.price}</strong><span>Anual · ${r.daily}</span></div>
        </div>
        <ul class="qr-reasons">
          ${r.reasons.map(x => `<li>${x}</li>`).join('')}
        </ul>
        <div class="qr-actions">
          <a href="#cotizador" class="btn btn-orange qr-cta" data-prefill="${r.quoteValue}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M19.05 4.91A10 10 0 0 0 12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.32A10 10 0 1 0 19.05 4.91z"/></svg>
            Quiero este plan
          </a>
          <button type="button" class="qr-restart">Volver a empezar</button>
        </div>
      `;
      showStep(3);

      // Pre-fill cotizador with the recommended plan
      result.querySelector('.qr-cta').addEventListener('click', e => {
        const select = document.querySelector('.quote-form[data-form="personas"] select[name="producto"]');
        if (select) {
          // Find matching option (or first that includes the plan name fragment)
          const target = r.quoteValue;
          for (const opt of select.options) {
            if (opt.textContent === target) { select.value = opt.textContent; break; }
          }
          setQuoteTab('personas');
        }
      });
      result.querySelector('.qr-restart').addEventListener('click', () => {
        Object.keys(answers).forEach(k => delete answers[k]);
        quizCard.querySelectorAll('.qopt.is-selected').forEach(b => b.classList.remove('is-selected'));
        showStep(0);
      });
    };

    quizCard.querySelectorAll('.qopt').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.closest('.quiz-step');
        const q = step.dataset.question;
        answers[q] = btn.dataset.value;
        step.querySelectorAll('.qopt').forEach(b => b.classList.toggle('is-selected', b === btn));
        // Advance to next step with a small delay for feedback
        setTimeout(() => {
          if (stepIdx + 1 < total) showStep(stepIdx + 1);
          else showResult();
        }, 250);
      });
    });

    showStep(0);
  }

  /* ---------- 10. Cotizador (continuación) — Submit → Supabase ---------- */
  const SB_URL = 'https://ltepezsefdypxzbmfise.supabase.co';
  const SB_KEY = 'sb_publishable_KgxN0hKQjtopZ-OWLPGtYg_ZX6ZYAZz';

  quoteForms.forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = Object.fromEntries(new FormData(form).entries());
      const esEmpresa = form.dataset.form === 'empresas';
      const extra = [];
      if (d.edad) extra.push('Edad: ' + d.edad);
      if (d.tamano) extra.push('Tamaño: ' + d.tamano);
      if (d.sector) extra.push('Sector: ' + d.sector);
      const payload = {
        tipo: 'cotizacion',
        audiencia: esEmpresa ? 'empresas' : 'personas',
        producto: (d.producto || '').trim() || null,
        nombre: (d.nombre || d.empresa || '').trim(),
        telefono: (d.telefono || '').trim(),
        ciudad: (d.ciudad || '').trim() || null,
        empresa: (d.empresa || '').trim() || null,
        notas: extra.join(' · ') || null,
      };

      const btn = form.querySelector('button[type="submit"]');
      const note = form.querySelector('.quote-note');
      const noteOriginal = note ? note.textContent : '';
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Enviando…';

      try {
        const r = await fetch(`${SB_URL}/rest/v1/seguros_iberis_cotizaciones`, {
          method: 'POST',
          headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        btn.innerHTML = '✓ Solicitud enviada';
        btn.style.background = '#1F9D7C';
        if (note) { note.textContent = '¡Listo! Un asesor te contactará en menos de 24h hábiles.'; note.style.color = '#1F9D7C'; }
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = '';
          btn.disabled = false;
          if (note) { note.textContent = noteOriginal; note.style.color = ''; }
        }, 4000);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = original;
        if (note) { note.textContent = 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'; note.style.color = '#B5560C'; }
        console.error('[cotizador]', err);
      }
    });
  });

  // Renovación se movió a /renovacion.html (handler inline en esa página).
})();
