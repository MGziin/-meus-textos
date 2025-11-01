/* script.js — central: home + textos.html behavior
   Regras:
   - Detecta se está em index (home) ou textos.html (catalog)
   - Gera cards, tags e modal
   - Preserva todos os textos completos (de textos.js)
*/

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
function qs(name){ return new URLSearchParams(window.location.search).get(name); }
function isCatalogPage(){ return window.location.pathname.includes('textos.html') || window.location.pathname.includes('/textos'); }
function isHomePage(){ const p = window.location.pathname; return p.endsWith('index.html') || p === '/' || p === ''; }

/* ---------- modal ---------- */
function openModalById(id){
  const modal = $('#modal-texto');
  const titleEl = $('#modal-titulo');
  const contentEl = $('#modal-conteudo');
  if(!modal || !titleEl || !contentEl) return;
  const idx = Number(id);
  const item = (window.textos || [])[idx];
  if(!item) return;
  titleEl.textContent = item.titulo;
  // manter quebras do conteudo
  contentEl.innerHTML = `<div class="modal-body">${escapeHtml(item.conteudo)}</div>`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  const modal = $('#modal-texto');
  if(!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

/* fecha clicando fora */
document.addEventListener('click', (ev) => {
  const modal = $('#modal-texto');
  if(!modal || modal.style.display !== 'flex') return;
  if(ev.target === modal) closeModal();
});

/* ---------- render home (lista-favoritos e tags) ---------- */
function renderHome(){
  const homeContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if(!homeContainer || !tagsContainer || !window.textos) return;

  homeContainer.innerHTML = '';
  // spacing between sections: wrap each major section with margin-bottom via CSS (already present)
  // Show favorites first: ensure favorites appear in desired order (A Semente, Muros Falsos)
  const favoritos = window.textos.filter(t => t.favorito).slice(0, 2);
  const fallback = window.textos.slice(0,2);
  const show = favoritos.length ? favoritos : fallback;

  show.forEach(t => {
    const idx = window.textos.indexOf(t);
    const card = document.createElement('div');
    card.className = 'texto-card home-card';
    if(t.favorito) card.classList.add('favorito');
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <div class="meta"><span class="pill">${t.categoria}</span></div>
      <p class="resumo">${escapeHtml(t.resumo)}</p>
      <button class="btn-lermais" data-id="${idx}">Ler mais</button>
    `;
    homeContainer.appendChild(card);
  });

  // tags: we want Todos + unique categories
  const cats = Array.from(new Set(window.textos.map(t => t.categoria))).filter(Boolean);
  tagsContainer.innerHTML = '';
  const todos = document.createElement('a');
  todos.className = 'tag-link';
  todos.href = `textos.html?tag=Todos`;
  todos.textContent = 'Todos';
  tagsContainer.appendChild(todos);
  cats.forEach(cat => {
    const a = document.createElement('a');
    a.className = 'tag-link';
    a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
    a.textContent = cat;
    tagsContainer.appendChild(a);
  });

  // attach ler mais buttons
  $$('.btn-lermais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      // if on catalog, open modal; if on home, redirect to catalog with abrir param
      if(isCatalogPage()){
        openModalById(id);
      } else {
        // go to catalog and request opening
        window.location.href = `textos.html?abrir=${encodeURIComponent(id)}`;
      }
    });
  });
}

/* ---------- render catalog (tags + lista) ---------- */
function renderCatalog(){
  const catalogList = $('#lista-textos');
  const tagsCatalog = $('#tags-catalogo') || $('#tags-catalogo');
  if(!catalogList || !window.textos) return;

  // build tag buttons (Todos + categories)
  const cats = Array.from(new Set(window.textos.map(t => t.categoria))).filter(Boolean);
  if(tagsCatalog){
    tagsCatalog.innerHTML = '';
    const btnTodos = document.createElement('button');
    btnTodos.className = 'tag-btn';
    btnTodos.textContent = 'Todos';
    btnTodos.dataset.tag = 'Todos';
    tagsCatalog.appendChild(btnTodos);
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.className = 'tag-btn';
      b.textContent = cat;
      b.dataset.tag = cat;
      tagsCatalog.appendChild(b);
    });

    tagsCatalog.querySelectorAll('.tag-btn').forEach(b => {
      b.addEventListener('click', () => {
        const tag = b.dataset.tag;
        applyCatalogFilter(tag === 'Todos' ? null : tag);
      });
    });
  }

  // Apply initial filter from URL ?tag=
  const urlTag = qs('tag');
  applyCatalogFilter(urlTag && urlTag !== 'Todos' ? decodeURIComponent(urlTag) : null);

  // Also, open modal if ?abrir=ID
  const abrir = qs('abrir');
  if(abrir !== null){
    // wait a bit to ensure DOM painted
    setTimeout(() => openModalById(abrir), 180);
  }
}

function applyCatalogFilter(tag){
  const listEl = $('#lista-textos');
  listEl.innerHTML = '';
  let list = window.textos.slice();
  if(tag){
    list = list.filter(t => t.categoria === tag);
  }
  if(list.length === 0){
    listEl.innerHTML = `<div class="none">Nenhum texto encontrado para essa categoria.</div>`;
    return;
  }
  list.forEach(t => {
    const idx = window.textos.indexOf(t);
    const card = document.createElement('article');
    card.className = 'texto-card';
    if(t.favorito) card.classList.add('favorito');
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <div class="meta"><span class="pill">${t.categoria}</span></div>
      <p class="resumo">${escapeHtml(t.resumo)}</p>
      <button class="btn-lermais" data-id="${idx}">Ler mais</button>
    `;
    listEl.appendChild(card);
  });

  // attach ler mais
  $$('.btn-lermais').forEach(btn => {
    btn.removeEventListener('click', onLerMaisClick);
    btn.addEventListener('click', onLerMaisClick);
  });
}

function onLerMaisClick(e){
  const id = e.currentTarget.dataset.id;
  openModalById(id);
}

/* ---------- menu hamburger (works on both pages) ---------- */
function setupMenu(){
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if(!burger || !menu) return;
  burger.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if(menu.style.display === 'flex' || menu.style.display === 'block') {
      menu.style.display = 'none';
    } else {
      menu.style.display = 'flex';
      menu.style.flexDirection = 'column';
    }
  });
  // close when clicking a menu link (mobile)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if(window.innerWidth < 760) menu.style.display = 'none';
  }));

  // close menu when clicking outside
  window.addEventListener('click', (ev) => {
    if(!menu) return;
    if(menu.style.display && (menu.style.display === 'flex' || menu.style.display === 'block')){
      if(!menu.contains(ev.target) && !burger.contains(ev.target)){
        menu.style.display = 'none';
      }
    }
  });
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try{
    setupMenu();
    // render depending on page
    if(isHomePage()){
      renderHome();
      // small improvement: ensure sections have spacing
      document.querySelectorAll('section').forEach((s, i) => {
        s.style.marginBottom = '36px';
      });
    }
    if(isCatalogPage()){
      renderCatalog();
    }
    console.log('script.js inicializado — home/catalogo prontos.');
  } catch(err){
    console.error('Erro inicializando script.js', err);
  }
});
