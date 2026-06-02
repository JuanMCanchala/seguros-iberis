/* Seguros Iberis · review-mode.js
   Widget tipo Figma para que el cliente deje comentarios en la web.
   Se carga solo cuando la URL incluye ?review=1
   Persistencia: Supabase (proyecto flash-contador / tabla seguros_iberis_comments)
*/
(function () {
  'use strict';
  if (!/[?&]review=1\b/.test(location.search)) return;

  const SUPABASE_URL = 'https://ltepezsefdypxzbmfise.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_KgxN0hKQjtopZ-OWLPGtYg_ZX6ZYAZz';
  const TABLE = 'seguros_iberis_comments';
  const PAGE = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const AUTHOR_KEY = 'sib_review_author';

  let comments = [];
  let mode = 'idle'; // 'idle' | 'adding'
  let sbClient = null;
  let realtimeChannel = null;

  // ---------- Supabase REST (operaciones CRUD) ----------
  const baseHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  const api = (path, opts) =>
    fetch(`${SUPABASE_URL}/rest/v1/${TABLE}${path || ''}`, {
      ...(opts || {}),
      headers: Object.assign({}, baseHeaders, (opts && opts.headers) || {}),
    });

  async function loadComments() {
    try {
      const r = await api(`?page_path=eq.${encodeURIComponent(PAGE)}&order=created_at.asc`);
      comments = r.ok ? await r.json() : [];
    } catch {
      comments = [];
    }
    renderAll();
  }
  async function createComment(c) {
    const r = await api('', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(c),
    });
    if (!r.ok) throw new Error(await r.text());
    const arr = await r.json();
    const row = Array.isArray(arr) ? arr[0] : arr;
    // Aplicamos el cambio localmente solo si Realtime aun no nos lo entrego.
    upsertLocal(row);
    return row;
  }
  async function updateComment(id, patch) {
    await api(`?id=eq.${id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    const c = comments.find((x) => x.id === id);
    if (c) {
      Object.assign(c, patch);
      renderAll();
    }
  }
  async function deleteComment(id) {
    await api(`?id=eq.${id}`, { method: 'DELETE' });
    removeLocal(id);
  }

  // ---------- Local cache mutators (usados por Realtime y CRUD optimista) ----------
  function upsertLocal(row) {
    if (!row || row.page_path !== PAGE) return;
    const i = comments.findIndex((x) => x.id === row.id);
    if (i >= 0) comments[i] = row;
    else comments.push(row);
    comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    renderAll();
  }
  function removeLocal(id) {
    const i = comments.findIndex((x) => x.id === id);
    if (i < 0) return;
    comments.splice(i, 1);
    renderAll();
  }

  // ---------- Anchor / positioning ----------
  function closestAnchor(el) {
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (cur.id) return { selector: '#' + CSS.escape(cur.id), el: cur };
      cur = cur.parentElement;
    }
    return { selector: 'body', el: document.body };
  }

  function pinPosition(c) {
    let el;
    try {
      el = document.querySelector(c.anchor_selector);
    } catch {
      el = null;
    }
    if (!el) el = document.body;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY + (c.y_pct / 100) * rect.height;
    const left = rect.left + window.scrollX + (c.x_pct / 100) * rect.width;
    return { top, left };
  }

  // ---------- Styles ----------
  const css = `
    .r-root { position: fixed; bottom: 16px; left: 16px; z-index: 99999; font-family: 'Montserrat', system-ui, sans-serif; }
    .r-fab { background: #224859; color:#fff; border:0; border-radius:999px; padding:.7rem 1.1rem; font-weight:700; font-size:.88rem; box-shadow: 0 10px 26px -10px rgba(0,0,0,.45); cursor:pointer; display:inline-flex; gap:.55rem; align-items:center; transition: transform .15s, background .2s; }
    .r-fab:hover { transform: translateY(-2px); }
    .r-fab.is-active { background: #F28E42; }
    .r-fab .r-dot { width:8px; height:8px; border-radius:50%; background:#1F9D7C; box-shadow:0 0 0 4px rgba(31,157,124,.25); }
    .r-fab.is-active .r-dot { background:#fff; box-shadow:0 0 0 4px rgba(255,255,255,.25); }
    .r-panel { position: fixed; bottom: 72px; left: 16px; width: 340px; max-height: 60vh; background:#fff; border-radius: 16px; box-shadow: 0 24px 64px -20px rgba(0,0,0,.4); overflow:hidden; display:none; flex-direction:column; z-index: 99999; }
    .r-panel.is-open { display:flex; }
    .r-panel .r-head { padding:.85rem 1rem; background: linear-gradient(135deg, #224859, #2E7E94); color:#fff; font-weight:700; display:flex; justify-content:space-between; align-items:center; font-size:.85rem; }
    .r-panel .r-count { background:#F28E42; padding:.15rem .55rem; border-radius:999px; font-size:.72rem; font-weight:800; }
    .r-add { width:100%; padding:.7rem; background:#F28E42; color:#fff; border:0; font-weight:700; cursor:pointer; font-size:.85rem; transition: background .15s; }
    .r-add:hover { background:#DD7C2E; }
    .r-list { list-style:none; margin:0; padding:0; overflow-y:auto; max-height: 45vh; }
    .r-list li { padding:.7rem 1rem; border-bottom:1px solid #eef0f1; cursor:pointer; font-size:.85rem; transition: background .15s; }
    .r-list li:hover { background:#f5f8f9; }
    .r-list li.is-resolved { opacity:.5; }
    .r-list li.is-resolved .r-body { text-decoration: line-through; }
    .r-list .r-head-li { display:flex; gap:.4rem; align-items:center; flex-wrap:wrap; }
    .r-list .r-num { background:#F28E42; color:#fff; font-weight:800; border-radius:999px; padding:.05rem .45rem; font-size:.7rem; }
    .r-list .r-author { font-weight:700; color:#224859; }
    .r-list .r-time { color:#97A6AB; font-size:.7rem; }
    .r-list .r-body { margin-top:.25rem; color:#28434B; }
    .r-empty { padding:1.4rem 1rem; text-align:center; color:#97A6AB; font-size:.83rem; line-height:1.4; }
    body.r-adding { cursor: crosshair !important; }
    body.r-adding * { cursor: crosshair !important; }
    body.r-adding .r-root, body.r-adding .r-pin, body.r-adding .r-root * { cursor: default !important; }
    .r-pin { position: absolute; width: 30px; height: 30px; border-radius: 50% 50% 50% 4px; background: #F28E42; transform: rotate(-45deg); display:grid; place-items:center; color:#fff; font-weight:800; font-size:.78rem; cursor:pointer; box-shadow: 0 8px 18px -4px rgba(0,0,0,.4); border: 2px solid #fff; z-index: 9998; transition: transform .15s; padding: 0;}
    .r-pin > span { transform: rotate(45deg); display:block; }
    .r-pin:hover { transform: rotate(-45deg) scale(1.15); }
    .r-pin.is-resolved { background:#1F9D7C; opacity:.6; }
    .r-popover { position: absolute; min-width:280px; max-width:320px; background:#fff; border-radius:14px; box-shadow:0 24px 64px -16px rgba(0,0,0,.4); padding:.95rem; z-index:99998; font-family:'Montserrat', system-ui, sans-serif; border: 1px solid #eef0f1; }
    .r-popover textarea, .r-popover input { width:100%; box-sizing:border-box; border:1px solid #d8dee0; border-radius:8px; padding:.5rem .6rem; font-family:inherit; font-size:.86rem; resize:vertical; outline:none; transition: border-color .15s; }
    .r-popover textarea:focus, .r-popover input:focus { border-color: #F28E42; }
    .r-popover textarea { min-height:76px; margin-bottom:.55rem; }
    .r-popover input { margin-bottom:.6rem; }
    .r-popover .r-actions { display:flex; gap:.4rem; justify-content:flex-end; }
    .r-popover button { border:0; border-radius:8px; padding:.5rem .85rem; font-weight:700; font-size:.8rem; cursor:pointer; font-family:inherit; transition: background .15s; }
    .r-save { background:#F28E42; color:#fff; }
    .r-save:hover { background:#DD7C2E; }
    .r-cancel { background:#eef0f1; color:#28434B; }
    .r-cancel:hover { background:#dde2e4; }
    .r-thread .r-msg { padding-bottom:.55rem; }
    .r-thread .r-msg-author { font-weight:700; color:#224859; font-size:.85rem; }
    .r-thread .r-msg-time { color:#97A6AB; font-size:.7rem; margin-left:.4rem; }
    .r-thread .r-msg-body { margin-top:.25rem; color:#28434B; white-space: pre-wrap; font-size:.88rem; line-height:1.45; }
    .r-thread .r-meta { display:flex; justify-content:space-between; align-items:center; margin-top:.6rem; padding-top:.55rem; border-top:1px solid #eef0f1; gap:.4rem; }
    .r-thread .r-resolve, .r-thread .r-delete { background:transparent; padding:.3rem .55rem; font-size:.76rem; color:#97A6AB; }
    .r-thread .r-resolve:hover { background:#eef9f4; color:#1F9D7C; }
    .r-thread .r-delete:hover { background:#fdebdc; color:#B5560C; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- DOM scaffold ----------
  const root = document.createElement('div');
  root.className = 'r-root';
  root.innerHTML = `
    <button class="r-fab" id="r-fab" type="button">
      <span class="r-dot"></span><span class="r-fab-label">Modo comentario</span>
    </button>
    <div class="r-panel" id="r-panel">
      <div class="r-head"><span>Comentarios en esta página</span><span class="r-count">0</span></div>
      <button class="r-add" type="button">+ Añadir comentario</button>
      <ul class="r-list"></ul>
    </div>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector('#r-fab');
  const fabLabel = root.querySelector('.r-fab-label');
  const panel = root.querySelector('#r-panel');
  const list = panel.querySelector('.r-list');
  const countEl = panel.querySelector('.r-count');
  const addBtn = panel.querySelector('.r-add');

  // ---------- Helpers ----------
  function escape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return ''; }
  }

  // ---------- Render ----------
  function clearPins() {
    document.querySelectorAll('.r-pin').forEach((n) => n.remove());
  }
  function renderPins() {
    clearPins();
    comments.forEach((c, i) => {
      const pos = pinPosition(c);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'r-pin' + (c.resolved ? ' is-resolved' : '');
      pin.dataset.id = c.id;
      pin.style.top = (pos.top - 30) + 'px';
      pin.style.left = (pos.left - 15) + 'px';
      pin.innerHTML = `<span>${i + 1}</span>`;
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        openThread(c.id, pos);
      });
      document.body.appendChild(pin);
    });
  }
  function renderPanel() {
    countEl.textContent = String(comments.length);
    if (!comments.length) {
      list.innerHTML = '<li class="r-empty">Aún no hay comentarios.<br/>Activa el modo y haz click donde quieras dejar uno.</li>';
      return;
    }
    list.innerHTML = comments
      .map((c, i) => {
        const time = fmtTime(c.created_at);
        return `<li data-id="${c.id}" class="${c.resolved ? 'is-resolved' : ''}">
          <div class="r-head-li">
            <span class="r-num">#${i + 1}</span>
            <span class="r-author">${escape(c.author || 'Anónimo')}</span>
            <span class="r-time">${time}</span>
          </div>
          <div class="r-body">${escape(c.body)}</div>
        </li>`;
      })
      .join('');
    list.querySelectorAll('li[data-id]').forEach((li) => {
      li.addEventListener('click', () => {
        const id = li.dataset.id;
        const c = comments.find((x) => x.id === id);
        if (!c) return;
        const pos = pinPosition(c);
        window.scrollTo({ top: Math.max(0, pos.top - 200), behavior: 'smooth' });
        setTimeout(() => openThread(id, pos), 420);
      });
    });
  }
  function renderAll() {
    renderPins();
    renderPanel();
  }

  // ---------- Popovers ----------
  function closeOpenPopovers() {
    document.querySelectorAll('.r-popover').forEach((n) => n.remove());
  }

  function positionPopover(pop, pos) {
    document.body.appendChild(pop); // make sure dimensions are real
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const w = pop.offsetWidth || 300;
    const h = pop.offsetHeight || 220;
    let top = pos.top + 14;
    let left = pos.left + 14;
    if (left + w > window.scrollX + ww - 16) left = pos.left - w - 14;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (top + h > window.scrollY + wh - 16) top = pos.top - h - 14;
    if (top < window.scrollY + 8) top = window.scrollY + 8;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function openThread(id, pos) {
    closeOpenPopovers();
    const c = comments.find((x) => x.id === id);
    if (!c) return;
    const pop = document.createElement('div');
    pop.className = 'r-popover r-thread';
    pop.innerHTML = `
      <div class="r-msg">
        <span class="r-msg-author">${escape(c.author || 'Anónimo')}</span>
        <span class="r-msg-time">${fmtTime(c.created_at)}</span>
        <div class="r-msg-body">${escape(c.body)}</div>
      </div>
      <div class="r-meta">
        <button class="r-resolve" type="button">${c.resolved ? '↺ Reabrir' : '✓ Resuelto'}</button>
        <button class="r-delete" type="button">Eliminar</button>
      </div>
    `;
    positionPopover(pop, pos);
    pop.querySelector('.r-resolve').addEventListener('click', async (e) => {
      e.stopPropagation();
      await updateComment(id, { resolved: !c.resolved });
      closeOpenPopovers();
    });
    pop.querySelector('.r-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('¿Eliminar este comentario?')) return;
      await deleteComment(id);
      closeOpenPopovers();
    });
  }

  function openNewCommentForm(pageX, pageY, anchorSelector, xPct, yPct) {
    closeOpenPopovers();
    const lastAuthor = localStorage.getItem(AUTHOR_KEY) || '';
    const pop = document.createElement('div');
    pop.className = 'r-popover';
    pop.innerHTML = `
      <input type="text" placeholder="Tu nombre (opcional)" maxlength="80" />
      <textarea placeholder="¿Qué quieres comentar aquí?" maxlength="2000"></textarea>
      <div class="r-actions">
        <button class="r-cancel" type="button">Cancelar</button>
        <button class="r-save" type="button">Guardar</button>
      </div>
    `;
    positionPopover(pop, { top: pageY, left: pageX });

    const inputAuthor = pop.querySelector('input');
    const textarea = pop.querySelector('textarea');
    inputAuthor.value = lastAuthor;
    setTimeout(() => textarea.focus(), 30);

    pop.querySelector('.r-cancel').addEventListener('click', (e) => {
      e.stopPropagation();
      closeOpenPopovers();
    });
    pop.querySelector('.r-save').addEventListener('click', async (e) => {
      e.stopPropagation();
      const body = textarea.value.trim();
      if (!body) {
        textarea.style.borderColor = '#F28E42';
        textarea.focus();
        return;
      }
      const author = (inputAuthor.value || '').trim().slice(0, 80);
      if (author) localStorage.setItem(AUTHOR_KEY, author);
      try {
        await createComment({
          page_path: PAGE,
          anchor_selector: anchorSelector,
          x_pct: xPct,
          y_pct: yPct,
          author: author || null,
          body,
        });
        closeOpenPopovers();
      } catch (err) {
        alert('No pude guardar el comentario: ' + (err && err.message ? err.message : 'error desconocido'));
      }
    });
  }

  // ---------- Mode toggle ----------
  function setMode(next) {
    mode = next;
    if (mode === 'adding') {
      fab.classList.add('is-active');
      fabLabel.textContent = '✖ Cancelar';
      panel.classList.remove('is-open');
      document.body.classList.add('r-adding');
    } else {
      fab.classList.remove('is-active');
      fabLabel.textContent = 'Modo comentario';
      document.body.classList.remove('r-adding');
    }
  }

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mode === 'adding') return setMode('idle');
    panel.classList.toggle('is-open');
  });

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode('adding');
  });

  // Capture-phase: si esta en modo adding, intercepta el click ANTES de que llegue a links/botones
  document.addEventListener(
    'click',
    (e) => {
      if (mode !== 'adding') return;
      if (e.target.closest('.r-root') || e.target.closest('.r-popover') || e.target.closest('.r-pin')) return;
      e.preventDefault();
      e.stopPropagation();
      const anchor = closestAnchor(e.target);
      const rect = anchor.el.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      const pageX = e.clientX + window.scrollX;
      const pageY = e.clientY + window.scrollY;
      setMode('idle');
      openNewCommentForm(pageX, pageY, anchor.selector, xPct, yPct);
    },
    true
  );

  // Click outside cierra popovers (cuando NO esta en modo adding)
  document.addEventListener('click', (e) => {
    if (mode === 'adding') return;
    if (e.target.closest('.r-popover') || e.target.closest('.r-pin') || e.target.closest('.r-root')) return;
    closeOpenPopovers();
  });

  // ESC sale del modo adding o cierra popovers
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mode === 'adding') return setMode('idle');
    closeOpenPopovers();
  });

  // Re-render pins on resize (layout-relative positioning)
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(renderPins, 120);
  });
  window.addEventListener('load', () => setTimeout(renderPins, 300));

  // ---------- Realtime: suscripcion a INSERT/UPDATE/DELETE en la tabla ----------
  // Cargamos el SDK de Supabase desde ESM CDN (solo aqui, no en produccion regular).
  async function bootRealtime() {
    try {
      const mod = await import('https://esm.sh/@supabase/supabase-js@2');
      sbClient = mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
        realtime: { params: { eventsPerSecond: 5 } },
      });
      realtimeChannel = sbClient
        .channel('seguros-iberis-comments-' + PAGE)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE,
            filter: 'page_path=eq.' + PAGE,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              upsertLocal(payload.new);
              flashIndicator('+ Nuevo comentario');
            } else if (payload.eventType === 'UPDATE') {
              upsertLocal(payload.new);
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old || {};
              if (oldRow.id) removeLocal(oldRow.id);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setLiveBadge(true);
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setLiveBadge(false);
        });
    } catch (err) {
      console.warn('[review-mode] Realtime no disponible:', err);
      setLiveBadge(false);
    }
  }

  // Indicador visual: punto verde animado en el FAB cuando estamos suscritos
  function setLiveBadge(on) {
    const dot = fab.querySelector('.r-dot');
    if (!dot) return;
    dot.style.animation = on ? 'r-pulse 1.6s ease-in-out infinite' : 'none';
  }
  // Toast flotante para anunciar comentarios entrantes
  let toastT;
  function flashIndicator(text) {
    let toast = document.querySelector('.r-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'r-toast';
      toast.style.cssText =
        'position:fixed; bottom:18px; left:50%; transform:translateX(-50%); background:#1F9D7C; color:#fff; padding:.55rem 1rem; border-radius:999px; font-family:Montserrat,system-ui,sans-serif; font-weight:700; font-size:.82rem; z-index:99999; box-shadow:0 12px 28px -10px rgba(0,0,0,.4); opacity:0; transition:opacity .25s, transform .25s; pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(-6px)';
    });
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 2400);
  }
  // Keyframes para el pulso del dot
  const pulseStyle = document.createElement('style');
  pulseStyle.textContent =
    '@keyframes r-pulse{0%,100%{box-shadow:0 0 0 4px rgba(31,157,124,.25)}50%{box-shadow:0 0 0 8px rgba(31,157,124,.15)}}';
  document.head.appendChild(pulseStyle);

  // Limpieza al cerrar / navegar
  window.addEventListener('beforeunload', () => {
    try { realtimeChannel && sbClient && sbClient.removeChannel(realtimeChannel); } catch {}
  });

  loadComments();
  bootRealtime();
})();
