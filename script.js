// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

// helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const qs = k => new URLSearchParams(window.location.search).get(k);

// Estado atual do filtro (compartilhado entre as funções)
let filtroTagAtual = qs('tag') || 'Todos';

// monta home (lista favoritos, tags, botão "ler todos")
function montarHome(){
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if(!favContainer || !tagsContainer) return;

  // ... (a lógica da home que você já tem)

  // tags home — pegar categorias existentes (Crônica, Fábula, etc) e adicionar "Todos"
  const tagsNoIndex = document.getElementById('tags'); // Se a seção tags existir no index.html
  if (tagsNoIndex) {
      // O index.html possui botões de tag estáticos (reflexão, vida, emoções).
      // Se você quiser gerar dinamicamente, precisará mudar o index.html também.
      // Por enquanto, apenas garantimos que a lógica de navegação do index para o catalogo funcione.
  }
}

// NOVO HELPER: Cria o HTML do card de texto para o catálogo
function criarCardCatalogo(t) {
    return `
      <div class="card-texto ${t.favorito ? 'favorito' : ''}">
        <h3>${escapeHtml(t.titulo)} ${t.favorito ? '<span class="selo">★</span>' : ''}</h3>
        <p class="resumo">${escapeHtml(t.resumo)}</p>
        <button class="ler-mais" data-id="${t.id}">Ler mais</button>
      </div>
    `;
}

// montar catálogo (AGORA COM LÓGICA DE FILTRO E RENDERIZAÇÃO DE TAGS)
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

  // 2. RENDERIZAÇÃO DAS TAGS (CORRIGIDO PARA ÚNICAS)
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
      montarCatalogo($('#barra-busca').value || '');
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
        // Alternar filtro: se a tag clicada já estiver ativa, desativa o filtro
        if (filtroTagAtual === tag) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = tag;
        }
        montarCatalogo($('#barra-busca').value || '');
    });
    tagContainer.appendChild(tagEl);
  });
  
  // 3. RENDERIZAÇÃO DOS TEXTOS
  container.innerHTML = textosFiltrados.map(t => criarCardCatalogo(t)).join('');

  if (textosFiltrados.length === 0) {
    container.innerHTML = `<div style="padding:36px;text-align:center;color:#6b5314">Nenhum texto encontrado para essa categoria.</div>`;
  }
  
  // 4. ADICIONAR LISTENERS DE MODAL
  $$('.ler-mais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      abrirModalPorId(id);
      const u = new URL(window.location.href);
      u.searchParams.set('abrir', id);
      history.replaceState({}, '', u.toString());
    });
  });

  // se veio ?abrir=..., abrir o modal automaticamente
  const abrirParam = qs('abrir');
  if (abrirParam) {
    setTimeout(() => abrirModalPorId(abrirParam), 160);
  }
}

// Configura a barra de busca e interação das tags
function setupCatalogoInteractions() {
    const searchBar = $('#barra-busca');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            montarCatalogo(e.target.value.trim());
        });
    }
}

// abrir modal por id (procura no window.textos)
function abrirModalPorId(id){
  const t = window.textos.find(x => x.id === id);
  if(!t) return;
  
  // Seletores do modal compatíveis com o novo catalogo.html e script.js
  const overlay = $('.modal-overlay');
  const tituloEl = $('#modal-titulo');
  const conteudoEl = $('#modal-conteudo');
  
  if(!overlay || !tituloEl || !conteudoEl) return;
  
  tituloEl.textContent = t.titulo;
  conteudoEl.innerHTML = escapeHtml(t.conteudo).replace(/\n/g, '<br>');
  
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// fechar modal
function fecharModal(){
  const overlay = $('.modal-overlay');
  if(overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  // limpa abrir param da URL
  const u = new URL(window.location.href);
  u.searchParams.delete('abrir');
  history.replaceState({}, '', u.toString());
}

// small util
function escapeHtml(text){
  if(text === null || text === undefined) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  // montar home se houver elementos
  if($('#lista-favoritos') || $('#lista-tags')){
    // Aqui você chamaria montarHome();
  }

  // montar catálogo se houver
  if($('#lista-textos')){
    setupCatalogoInteractions(); // Configura a busca/filtro
    montarCatalogo();
    
    // Liga o fechamento do modal
    const overlay = $('.modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    if(overlay){
      overlay.addEventListener('click', (e) => {
        if(e.target === overlay) fecharModal();
      });
    }
    if(closeBtn) closeBtn.addEventListener('click', fecharModal);
  }

});
