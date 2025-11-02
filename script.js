// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

// helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const qs = k => new URLSearchParams(window.location.search).get(k);

// Estado atual do filtro (para uso em busca e tag)
let filtroTagAtual = qs('tag') || 'Todos';

// small util: Escapa HTML (segurança)
function escapeHtml(text){
  if(text === null || text === undefined) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// HELPER: Cria o HTML do card de texto para o catálogo
function criarCardCatalogo(t) {
    return `
      <div class="card-texto ${t.favorito ? 'favorito' : ''}">
        <h3>${escapeHtml(t.titulo)} ${t.favorito ? '<span class="selo">★</span>' : ''}</h3>
        <p class="resumo">${escapeHtml(t.resumo)}</p>
        <button class="ler-mais" data-id="${t.id}">Ler mais</button>
      </div>
    `;
}

// ===================================
// LÓGICA DA HOME (INDEX.HTML)
// ===================================
function montarHome(){
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if(!favContainer || !tagsContainer) return;

  // 1. Renderiza Favoritos
  const favoritos = window.textos.filter(t => t.favorito);
  favContainer.innerHTML = '';
  favoritos.forEach(t => {
    const card = document.createElement('div');
    card.className = 'card-fav';
    card.innerHTML = `
      <div class="titulo-row">
        <h3>${escapeHtml(t.titulo)}</h3>
        <div class="star">★</div>
      </div>
      <div class="resumo">${escapeHtml(t.resumo)}</div>
      <button class="btn-ler" data-id="${t.id}">Ler mais</button>
    `;
    favContainer.appendChild(card);
  });

  // 2. Renderiza Tags para a Home
  const todasCategorias = window.textos.map(t => t.categoria);
  const tagsUnicas = Array.from(new Set(todasCategorias));
  
  tagsContainer.innerHTML = '';
  
  // Adiciona a tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = `catalogo.html?tag=Todos`;
  allPill.textContent = 'Todos';
  tagsContainer.appendChild(allPill);

  // Adiciona as tags únicas restantes (com link para o catálogo)
  tagsUnicas.forEach(cat => {
    const a = document.createElement('a');
    a.className = 'tag-pill';
    a.href = `catalogo.html?tag=${encodeURIComponent(cat)}`;
    a.textContent = `#${cat}`;
    tagsContainer.appendChild(a);
  });

  // 3. LIGA EVENTOS
  $$('.btn-ler').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      // Abre catálogo e indica para abrir o modal
      window.location.href = `catalogo.html?abrir=${encodeURIComponent(id)}`;
    });
  });
}


// ===================================
// LÓGICA DO CATÁLOGO (CATALOGO.HTML)
// ===================================
function montarCatalogo(filtroBusca = '') {
  const container = $('#lista-textos');
  const tagContainer = $('#lista-tags-catalogo');
  if (!container || !tagContainer) return;

  // 1. FILTRAGEM DE TEXTOS
  let textosFiltrados = window.textos.slice();
  
  // 1a. Filtro por Categoria (Tag)
  if (filtroTagAtual !== 'Todos') {
    textosFiltrados = textosFiltrados.filter(t => t.categoria === filtroTagAtual);
  }
  
  // 1b. Filtro por Busca (título, resumo, conteúdo)
  if (filtroBusca) {
    const termo = filtroBusca.toLowerCase();
    textosFiltrados = textosFiltrados.filter(t => 
      t.titulo.toLowerCase().includes(termo) || 
      t.resumo.toLowerCase().includes(termo) || 
      t.conteudo.toLowerCase().includes(termo)
    );
  }

  // 2. RENDERIZAÇÃO DAS TAGS DE FILTRO
  const todasCategorias = window.textos.map(t => t.categoria);
  const tagsUnicas = Array.from(new Set(todasCategorias));
  
  tagContainer.innerHTML = '';
  
  // Adiciona a tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = 'javascript:void(0);';
  allPill.textContent = 'Todos';
  if (filtroTagAtual === 'Todos') {
      allPill.classList.add('active');
  }
  allPill.addEventListener('click', () => {
      filtroTagAtual = 'Todos';
      montarCatalogo($('#barra-busca')?.value || '');
  });
  tagContainer.appendChild(allPill);

  // Adiciona as tags únicas restantes
  tagsUnicas.forEach(tag => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    tagEl.href = 'javascript:void(0);';
    tagEl.textContent = `#${tag}`;
    
    if (tag === filtroTagAtual) {
        tagEl.classList.add('active');
    }
    
    tagEl.addEventListener('click', () => {
        // Alterna o filtro: se clicar na mesma tag, desativa
        if (filtroTagAtual === tag) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = tag;
        }
        montarCatalogo($('#barra-busca')?.value || '');
    });
    tagContainer.appendChild(tagEl);
  });
  
  // 3. RENDERIZAÇÃO DOS TEXTOS
  container.innerHTML = textosFiltrados.map(t => criarCardCatalogo(t)).join('');

  if (textosFiltrados.length === 0) {
    container.innerHTML = `<div style="padding:36px;text-align:center;color:#6b5314">Nenhum texto encontrado para essa busca/categoria.</div>`;
  }
  
  // 4. LIGAR LISTENERS DE MODAL (Ler mais)
  $$('.ler-mais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      abrirModalPorId(id);
      const u = new URL(window.location.href);
      u.searchParams.set('abrir', id);
      history.replaceState({}, '', u.toString());
    });
  });

  // 5. Abertura Automática do Modal (se veio da Home)
  const abrirParam = qs('abrir');
  if (abrirParam) {
    setTimeout(() => abrirModalPorId(abrirParam), 160);
  }
}

// Configura a barra de busca
function setupCatalogoInteractions() {
    const searchBar = $('#barra-busca');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            // Mantém a tag atual, mas aplica o filtro de busca
            montarCatalogo(e.target.value.trim());
        });
    }
}

// ===================================
// LÓGICA DO MODAL
// ===================================
function abrirModalPorId(id){
  const t = window.textos.find(x => x.id === id);
  if(!t) return;
  
  const overlay = $('.modal-overlay');
  const tituloEl = $('#modal-titulo');
  const conteudoEl = $('#modal-conteudo');
  
  if(!overlay || !tituloEl || !conteudoEl) return;
  
  tituloEl.textContent = t.titulo;
  // Usa t.conteudo e substitui \n por <br> para manter a formatação
  conteudoEl.innerHTML = escapeHtml(t.conteudo).replace(/\n/g, '<br>');
  
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function fecharModal(){
  const overlay = $('.modal-overlay');
  if(overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  // Limpa o parâmetro 'abrir' da URL
  const u = new URL(window.location.href);
  u.searchParams.delete('abrir');
  history.replaceState({}, '', u.toString());
}


/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  // Lógica de Inicialização da Home
  if($('#lista-favoritos') || $('#lista-tags')){
    montarHome();
  }

  // Lógica de Inicialização do Catálogo
  if($('#lista-textos')){
    setupCatalogoInteractions(); // Configura a busca/filtro
    montarCatalogo();
  }

  // Ligar eventos de fechamento do modal
  const overlay = $('.modal-overlay');
  if(overlay){
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) fecharModal();
    });
  }
  const closeBtn = document.getElementById('modal-close-btn');
  if(closeBtn) closeBtn.addEventListener('click', fecharModal);

  // Home: Função global para links antigos funcionarem (apenas para manter compatibilidade)
  if (typeof window.abrirCatalogo === 'undefined') {
      window.abrirCatalogo = (parametro) => {
          if (parametro === 'todos') {
              window.location.href = `catalogo.html?tag=Todos`;
          } else {
              // assume que o parâmetro é uma tag
              window.location.href = `catalogo.html?tag=${encodeURIComponent(parametro)}`;
          }
      };
  }
});
