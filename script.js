/* script.js — único script para index.html e textos.html
   Requisitos:
   - textos.js deve ser carregado antes deste (definindo window.textos)
*/

(() => {
  // Helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function escapeHtml(s){ return (s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function nl2br(s){ return escapeHtml(s).replace(/\n/g,"<br>"); }
  function qsParam(k){ return new URLSearchParams(window.location.search).get(k); }

  // Modal
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close');

  function openModal(htmlContent){
    if(!modalOverlay || !modalBody) return;
    modalBody.innerHTML = htmlContent;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalOverlay.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    if(!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    modalOverlay.setAttribute('aria-hidden','true');
  }

  if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if(modalOverlay){
    modalOverlay.addEventListener('click', (e) => {
      if(e.target === modalOverlay) closeModal();
    });
    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeModal();
    });
  }

  // render excerpt (max chars)
  function excerpt(text, max=260){
    const t = (text||"").trim().replace(/\n+/g,' ');
    if(t.length <= max) return t;
    return t.slice(0,max).trim() + '...';
  }

  // Render Home (index.html)
  function renderHome(){
    const favContainer = $('#lista-favoritos');
    const tagsHome = $('#tags-home');
    if(!window.textos) return console.error('textos não carregados (window.textos)');
    // Favoritos: pegar primeiros 2 marcados favorito=true, se menos, pegar primeiros do array
    const favoritos = window.textos.filter(t => t.favorito).slice(0,2);
    const fallback = window.textos.slice(0,2);
    const mostrar = favoritos.length ? favoritos : fallback;

    if(favContainer){
      favContainer.innerHTML = '';
      mostrar.forEach(t => {
        const idx = window.textos.indexOf(t);
        const card = document.createElement('div');
        card.className = 'card-home';
        card.innerHTML = `
          <h3>${t.titulo}</h3>
          <p>${excerpt(t.conteudo, 280)}</p>
          <div style="display:flex;gap:10px;margin-top:8px">
            <a class="btn-ler" href="textos.html?abrir=${encodeURIComponent(idx)}">Ler mais</a>
            <span class="tag" style="align-self:center">${t.categoria || ''}</span>
          </div>
        `;
        favContainer.appendChild(card);
      });
    }

    // Tags home (dinâmicas: incluir "Todos" + categorias presentes)
    if(tagsHome){
      tagsHome.innerHTML = '';
      const categorias = Array.from(new Set(window.textos.map(x => x.categoria))).filter(Boolean);
      const todosA = document.createElement('a');
      todosA.className = 'tag';
      todosA.href = 'textos.html?tag=Todos';
      todosA.textContent = 'Todos';
      tagsHome.appendChild(todosA);
      categorias.forEach(cat => {
        const a = document.createElement('a');
        a.className = 'tag';
        a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
        a.textContent = cat;
        tagsHome.appendChild(a);
      });
    }
  }

  // Render Textos page (catalog)
  function renderCatalog(filterTag){
    const catalogEl = document.getElementById('catalogo-list');
    const filtrosEl = document.getElementById('filtros');
    if(!window.textos) return;
    // filtros
    if(filtrosEl){
      filtrosEl.innerHTML = '';
      const categorias = Array.from(new Set(window.textos.map(x => x.categoria))).filter(Boolean);
      const allBtn = document.createElement('button');
      allBtn.className = 'tag';
      allBtn.textContent = 'Todos';
      allBtn.onclick = () => {
        history.replaceState(null,'', 'textos.html');
        renderCatalog(null);
      };
      filtrosEl.appendChild(allBtn);
      categorias.forEach(cat => {
        const b = document.createElement('button');
        b.className = 'tag';
        b.textContent = cat;
        b.onclick = () => {
          history.replaceState(null,'', `textos.html?tag=${encodeURIComponent(cat)}`);
          renderCatalog(cat);
        };
        filtrosEl.appendChild(b);
      });
    }

    // conteúdo (filtrar)
    const list = (!filterTag || filterTag === 'Todos') ? window.textos.slice() : window.textos.filter(t => t.categoria === filterTag);
    if(catalogEl){
      catalogEl.innerHTML = '';
      if(list.length === 0){
        catalogEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:18px;color:#5b4526">Nenhum texto encontrado para essa categoria.</div>`;
        return;
      }
      list.forEach((t, idx) => {
        const realIdx = window.textos.indexOf(t);
        const art = document.createElement('article');
        art.className = 'card-texto';
        art.innerHTML = `
          <h3>${t.titulo}</h3>
          <div style="margin-bottom:8px"><span class="tag">${t.categoria || ''}</span></div>
          <p>${excerpt(t.conteudo, 380)}</p>
          <div style="margin-top:8px"><button class="btn-ler" data-id="${realIdx}">Ler mais</button></div>
        `;
        catalogEl.appendChild(art);
      });

      // attach listeners
      $$('.btn-ler').forEach(btn => {
        btn.onclick = (e) => {
          const id = btn.getAttribute('data-id');
          const item = window.textos[id];
          if(!item) return;
          const html = `<h2>${escapeHtml(item.titulo)}</h2><div style="margin-top:8px">${nl2br(item.conteudo)}</div>`;
          openModal(html);
        };
      });
    }
  }

  // open modal if ?abrir=ID present
  function handleOpenFromURL(){
    const abrir = qsParam('abrir');
    const tag = qsParam('tag');
    if(tag){
      // render catalog with tag
      renderCatalog(decodeURIComponent(tag));
    }
    if(abrir !== null && abrir !== undefined){
      const id = Number(abrir);
      if(!isNaN(id) && window.textos && window.textos[id]){
        const item = window.textos[id];
        const html = `<h2>${escapeHtml(item.titulo)}</h2><div style="margin-top:8px">${nl2br(item.conteudo)}</div>`;
        // ensure catalog rendered before opening
        setTimeout(() => openModal(html), 200);
      }
    }
  }

  // header/hamburger toggles (small screens)
  function setupHeader(){
    // simple toggle for mobile: show/hide central nav by copying it into an accessible menu
    const hambHome = $('#hamb-home') || $('#hamb-catalog') || $('.hamburguer');
    const cabCenter = document.querySelector('.cab-center');
    if(!hambHome) return;
    hambHome.addEventListener('click', () => {
      // toggle a simple mobile menu (we'll create an overlay menu)
      let mobileMenu = document.querySelector('.mobile-menu');
      if(!mobileMenu){
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `<div class="mobile-menu-inner"></div>`;
        document.body.appendChild(mobileMenu);
      }
      const inner = mobileMenu.querySelector('.mobile-menu-inner');
      if(inner.children.length === 0 && cabCenter){
        // clone links
        Array.from(cabCenter.children).forEach(a => {
          const node = a.cloneNode(true);
          node.addEventListener('click', () => mobileMenu.remove());
          inner.appendChild(node);
        });
      }
      mobileMenu.classList.toggle('open');
    });

    // close mobile menu on outside click
    document.addEventListener('click', (e) => {
      const mm = document.querySelector('.mobile-menu.open');
      if(!mm) return;
      if(!mm.contains(e.target) && !e.target.classList.contains('hamburguer')) mm.remove();
    });

    // style mobile menu basic (injected)
    if(!document.getElementById('mobile-menu-style')){
      const s = document.createElement('style');
      s.id = 'mobile-menu-style';
      s.innerHTML = `
      .mobile-menu{position:fixed;inset:0;background:rgba(0,0,0,0.35);display:flex;justify-content:flex-end;z-index:1500}
      .mobile-menu-inner{width:260px;background:var(--header);padding:18px;display:flex;flex-direction:column;gap:10px}
      .mobile-menu-inner a{color:var(--texto);text-decoration:none;font-weight:700;padding:8px;border-radius:8px}
      .mobile-menu.open{}
      `;
      document.head.appendChild(s);
    }
  }

  // main init
  document.addEventListener('DOMContentLoaded', () => {
    if(typeof window.textos === 'undefined'){
      console.error('textos não definido (carregue textos.js antes de script.js)');
      return;
    }

    // determine page
    const path = window.location.pathname;
    const isCatalog = path.endsWith('textos.html') || path.includes('/textos.html');
    const isHome = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/index.html');

    // setup header toggles
    setupHeader();

    // render home tags/cards if on index
    if(isHome || window.location.href.includes('index.html')){
      try{ renderHome(); }catch(err){ console.error('erro renderHome',err); }
    }

    // render catalog if on textos
    if(isCatalog || window.location.href.includes('textos.html')){
      try{
        const tagParam = qsParam('tag');
        renderCatalog(tagParam ? decodeURIComponent(tagParam) : null);
      }catch(err){ console.error('erro renderCatalog',err); }
    }

    // handle abrir param (works on textos page)
    handleOpenFromURL();
  });
})();
