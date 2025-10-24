// script.js — unificado para index.html e textos.html
// depende de window.textos (textos.js)

document.addEventListener('DOMContentLoaded', () => {
  const dados = window.textos || [];
  const categorias = Array.from(new Set(dados.map(t => t.categoria)));
  const categoriasComTodos = ['Todos', ...categorias];

  // HELPERS
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const isTextosPage = () => window.location.pathname.endsWith('textos.html') || window.location.pathname.includes('/textos.html');
  const isHomePage = () => {
    const p = window.location.pathname;
    return p.endsWith('index.html') || p === '/' || p === '' || p.endsWith('/-meus-textos/');
  };
  function qsParam(k){ const u = new URL(window.location.href); return u.searchParams.get(k); }
  function escapeHtml(text){
    if(text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /* ---------------- RENDER HOME ---------------- */
  const catalogoHomeEl = $('#catalogo-home');
  const tagsHomeEl = $('#tags-home');

  if(catalogoHomeEl && tagsHomeEl){
    // Favoritos (mostrar os primeiros 2 textos)
    const favoritos = dados.slice(0, 2);
    catalogoHomeEl.innerHTML = '';
    favoritos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'texto-card';
      card.innerHTML = `
        <span class="tag">${t.categoria}</span>
        <h3>${t.titulo}</h3>
        <p class="texto-excerpt">${escapeHtml(t.resumo)}</p>
      `;
      // Ler mais: redireciona para textos.html e abre modal do texto
      const btn = document.createElement('button');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      btn.addEventListener('click', () => {
        // redirect to catalog with query param texto=id
        window.location.href = `textos.html?texto=${encodeURIComponent(t.id)}`;
      });
      card.appendChild(btn);
      catalogoHomeEl.appendChild(card);
    });

    // tags no Home (só categorias que têm textos)
    tagsHomeEl.innerHTML = '';
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      tagsHomeEl.appendChild(a);
    });
  }

  /* ---------------- RENDER CATALOGO ---------------- */
  const catalogoEl = $('#catalogo');
  const filtrosEl = $('#filtros');
  const menuPanel = $('#menuPanel');
  const hambBtn = $('#hambBtn');
  const menuCats = $('#menu-cats');

  // modal utilities
  const overlay = $('#overlay-modal') || createOverlay();
  function createOverlay(){
    const el = document.createElement('div');
    el.id = 'overlay-modal';
    el.setAttribute('aria-hidden','true');
    document.body.appendChild(el);
    return el;
  }

  function buildModalStructure(){
    if(overlay.querySelector('.modal-wrap')) return;
    overlay.innerHTML = `
      <div class="modal-wrap" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Fechar">✕</button>
        <div class="modal-header">
          <h3 class="modal-title"></h3>
          <div class="modal-tag"></div>
        </div>
        <div class="modal-body"></div>
      </div>
    `;
    // click outside closes
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) closeModal();
    });
    // close button
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  }

  function openModalById(id){
    const texto = dados.find(t => t.id === id);
    if(!texto) return false;
    buildModalStructure();
    const wrap = overlay.querySelector('.modal-wrap');
    overlay.querySelector('.modal-title').textContent = texto.titulo;
    overlay.querySelector('.modal-tag').textContent = texto.categoria;
    overlay.querySelector('.modal-body').innerHTML = `<div class="modal-text">${escapeHtml(texto.conteudo)}</div>`;
    document.body.style.overflow = 'hidden'; // lock page scroll
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    return true;
  }

  function closeModal(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  // ESC to close
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  if(catalogoEl && filtrosEl){
    // render top filters (Todos + categorias)
    filtrosEl.innerHTML = '';
    categoriasComTodos.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      filtrosEl.appendChild(a);
    });

    // menu categories in side panel
    if(menuCats){
      menuCats.innerHTML = '';
      categoriasComTodos.forEach(cat => {
        const a = document.createElement('a');
        a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
        a.textContent = cat;
        menuCats.appendChild(a);
      });
    }

    // create card element
    function createCardElement(t){
      const art = document.createElement('article');
      art.className = 'card';
      art.innerHTML = `
        <h3>${t.titulo}</h3>
        <div style="margin-bottom:8px"><span class="tag">${t.categoria}</span></div>
        <p class="card-excerpt">${escapeHtml(t.resumo)}</p>
        <div style="margin-top:10px"><button class="btn-ler" data-id="${t.id}">Ler mais</button></div>
      `;
      art.querySelector('.btn-ler').addEventListener('click', (e) => {
        openModalById(t.id);
      });
      return art;
    }

    function renderCatalogo(filterTag){
      catalogoEl.innerHTML = '';
      const list = (!filterTag || filterTag === 'Todos') ? dados.slice() : dados.filter(t => t.categoria === filterTag);
      if(list.length === 0){
        catalogoEl.innerHTML = '<div style="grid-column:1/-1" class="center">Nenhum texto encontrado para essa categoria.</div>';
        return;
      }
      list.forEach(t => {
        const node = createCardElement(t);
        catalogoEl.appendChild(node);
      });
      // if open param present (texto id), scroll to it and open modal
      const openIdRaw = qsParam('texto');
      if(openIdRaw){
        const openId = decodeURIComponent(openIdRaw);
        // delay to allow render
        setTimeout(() => {
          // open modal directly
          openModalById(openId);
          // optionally scroll to the opened article if exists
          const node = Array.from(catalogoEl.querySelectorAll('h3')).find(h => h.textContent.trim() === (dados.find(d=>d.id===openId)?.titulo || ''));
          if(node) node.scrollIntoView({behavior:'smooth', block:'center'});
        }, 150);
      }
    }

    // hamburger panel open/close (catalogo)
    if(hambBtn && menuPanel){
      hambBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPanel.classList.toggle('open');
        menuPanel.setAttribute('aria-hidden', menuPanel.classList.contains('open') ? 'false' : 'true');
      });

      window.addEventListener('click', (e) => {
        if(!menuPanel) return;
        if(menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && !hambBtn.contains(e.target)){
          menuPanel.classList.remove('open');
          menuPanel.setAttribute('aria-hidden','true');
        }
      });

      window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && menuPanel.classList.contains('open')){
          menuPanel.classList.remove('open');
          menuPanel.setAttribute('aria-hidden','true');
        }
      });
    }

    // apply filter initial by URL ?tag=
    const tagParamRaw = qsParam('tag');
    const tagDecoded = tagParamRaw ? decodeURIComponent(tagParamRaw) : 'Todos';
    renderCatalogo(tagDecoded === 'Todos' ? null : tagDecoded);

    // highlight active filter visually
    setTimeout(() => {
      const allTags = Array.from(filtrosEl.querySelectorAll('.tag'));
      allTags.forEach(el => el.classList.toggle('active', el.textContent === (tagDecoded || 'Todos')));
    }, 200);
  }

  /* --------- Smooth scroll for menu links (HOME) ---------- */
  document.querySelectorAll('.menu-links a').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(!href || !href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if(target){
        window.scrollTo({top: target.offsetTop - 70, behavior: 'smooth'});
      }
    });
  });

  /* --------- If page loaded with ?texto=ID and it's home, redirect to textos.html?texto=ID --------- */
  if(isHomePage()){
    const textoParam = qsParam('texto');
    if(textoParam){
      // redirect to catalog and preserve tag param if any
      window.location.href = `textos.html?texto=${encodeURIComponent(textoParam)}`;
    }
  }

  // end DOMContentLoaded
});
