// script.js - único script para Home e Textos
// depende de textos.js (carregado antes)

document.addEventListener('DOMContentLoaded', () => {
  const dados = window.textos || [];
  const categorias = Array.from(new Set(dados.map(t => t.categoria)));
  const categoriasComTodos = ['Todos', ...categorias];

  // helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const isTextosPage = () => window.location.pathname.endsWith('textos.html') || window.location.pathname.includes('/textos.html');
  const isHomePage = () => {
    const p = window.location.pathname;
    return p.endsWith('index.html') || p === '/' || p === '' || p.endsWith('/-meus-textos/') ;
  };
  function qsParam(k){ const u = new URL(window.location.href); return u.searchParams.get(k); }
  function escapeHtml(text){
    if(text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /* ---------------- HOME ---------------- */
  const catalogoHomeEl = $('#catalogo-home');
  const tagsHomeEl = $('#tags-home');

  if(catalogoHomeEl && tagsHomeEl){
    // Favoritos: mostra os 2 primeiros textos (se existirem)
    const favoritos = dados.slice(0, 2);
    favoritos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'texto-card';
      const excerpt = t.conteudo.split('\n').filter(Boolean).slice(0,6).join('\n');
      card.innerHTML = `
        <span class="tag">${t.categoria}</span>
        <h3>${t.titulo}</h3>
        <p class="texto-excerpt">${escapeHtml(excerpt)}</p>
      `;
      const btn = document.createElement('button');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      btn.addEventListener('click', () => {
        // abre textos.html com filtro e scrolldown + open (se quiser abrir modal direto)
        window.location.href = `textos.html?tag=${encodeURIComponent(t.categoria)}&open=${encodeURIComponent(t.titulo)}`;
      });
      card.appendChild(btn);
      catalogoHomeEl.appendChild(card);
    });

    // tags no Home (só as categorias que têm textos)
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      tagsHomeEl.appendChild(a);
    });
  }

  /* ------------- TEXTOS (CATÁLOGO) ------------- */
  const catalogoEl = $('#catalogo');
  const filtrosEl = $('#filtros');
  const menuPanel = $('#menuPanel');
  const hambBtn = $('#hambBtn');
  const menuCats = $('#menu-cats');

  // função para criar botão "Ler mais" que abre modal
  function createCardElement(t){
    const art = document.createElement('article');
    art.className = 'card';
    const excerpt = t.conteudo.split('\n').filter(Boolean).slice(0,10).join('\n');
    art.innerHTML = `
      <h3>${t.titulo}</h3>
      <div style="margin-bottom:8px"><span class="tag">${t.categoria}</span></div>
      <p class="card-excerpt">${escapeHtml(excerpt)}</p>
      <div style="margin-top:10px">
        <button class="btn-ler" data-titulo="${encodeURIComponent(t.titulo)}">Ler mais</button>
      </div>
    `;
    // botão abrir modal
    art.querySelector('.btn-ler').addEventListener('click', () => openModal(t));
    return art;
  }

  // modal
  let modalEl = null;
  function createModal(){
    if(modalEl) return;
    modalEl = document.createElement('div');
    modalEl.id = 'overlay-modal';
    modalEl.innerHTML = `
      <div class="modal-wrap" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Fechar">✕</button>
        <div class="modal-content"></div>
      </div>
    `;
    document.body.appendChild(modalEl);

    // fechar clicando fora
    modalEl.addEventListener('click', (e) => {
      if(e.target === modalEl) closeModal();
    });
    modalEl.querySelector('.modal-close').addEventListener('click', closeModal);
  }
  function openModal(texto){
    createModal();
    const content = modalEl.querySelector('.modal-content');
    content.innerHTML = `<h3>${texto.titulo}</h3><div class="modal-tag">${texto.categoria}</div><div class="modal-text">${escapeHtml(texto.conteudo)}</div>`;
    document.body.style.overflow = 'hidden';
    modalEl.classList.add('open');
  }
  function closeModal(){
    if(!modalEl) return;
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  if(catalogoEl && filtrosEl){
    // render filtros no topo (Todos + categorias)
    categoriasComTodos.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat === 'Todos' ? 'Todos' : cat)}`;
      a.textContent = cat;
      filtrosEl.appendChild(a);
    });

    // render menu categorias no painel lateral
    if(menuCats){
      categoriasComTodos.forEach(cat => {
        const a = document.createElement('a');
        a.href = `textos.html?tag=${encodeURIComponent(cat === 'Todos' ? 'Todos' : cat)}`;
        a.textContent = cat;
        menuCats.appendChild(a);
      });
    }

    // render catálogo (filtra se houver ?tag=)
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

      // open param: rolar até o título
      const openTituloRaw = qsParam('open');
      if(openTituloRaw){
        const openTitulo = decodeURIComponent(openTituloRaw);
        // rola até o primeiro que bate no título
        setTimeout(() => {
          const nodes = Array.from(catalogoEl.querySelectorAll('h3'));
          const node = nodes.find(h => h.textContent.trim() === openTitulo.trim());
          if(node){
            node.scrollIntoView({behavior:'smooth', block:'center'});
          }
        }, 150);
      }
    }

    // active filter visual
    function setActiveFilter(tagName){
      const allTags = Array.from(filtrosEl.querySelectorAll('.tag'));
      allTags.forEach(el => {
        el.classList.toggle('active', el.textContent === (tagName || 'Todos'));
      });
    }

    // menu hambúrguer (lateral) open/close
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

    // aplicar filtro inicial por URL ou por padrão (Todos)
    const tagParamRaw = qsParam('tag');
    const tagDecoded = tagParamRaw ? decodeURIComponent(tagParamRaw) : 'Todos';
    renderCatalogo(tagDecoded === 'Todos' ? null : tagDecoded);
    setActiveFilter(tagDecoded === 'Todos' ? 'Todos' : tagDecoded);
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

  // end DOMContentLoaded
});
