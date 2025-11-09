// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

/* ================== HELPERS ================== */

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

function translate(key) {
    if (!window.translations || !window.translations[window.currentLang]) {
        return key;
    }
    return window.translations[window.currentLang][key] || key;
}

// ... [Funções de Tradução e Lógica da Home omitidas por brevidade, mas devem ser mantidas] ...
function applyTranslations() {
    const lang = window.currentLang;
    const t = window.translations[lang];
    if (!t) return;

    // ... [Traduções de títulos e elementos estáticos] ...

    // 3. Re-renderizar conteúdo dinâmico (catalogo e home)
    if ($('#lista-textos')) {
        // Quando a linguagem muda, a busca é mantida, mas o filtro de tag deve ser resetado/atualizado
        const busca = $('#barra-busca') ? $('#barra-busca').value : '';
        // Reseta o filtro de tag para 'Todos' ao mudar de idioma para evitar inconsistências
        filtroTagAtual = 'Todos'; 
        montarCatalogo(busca);
    }
    if ($('#lista-favoritos')) {
        montarHome();
    }
}

// ... [Funções de Modal e Menu Hamburguer omitidas por brevidade, mas devem ser mantidas] ...
function abrirModalPorId(id) {
  const t = window.textos.find(x => x.id === id);
  if (!t) return;
  
  const overlay = $('.modal-overlay');
  if (!overlay) return;

  const langSuffix = window.currentLang === 'en' ? '_en' : '';
  const titulo = t['titulo' + langSuffix] || t.titulo;
  const conteudo = t['conteudo' + langSuffix] || t.conteudo;

  const tituloEl = document.getElementById('modal-titulo');
  const conteudoEl = document.getElementById('modal-conteudo');
  
  if (tituloEl && conteudoEl) {
    tituloEl.textContent = titulo;
    // Usa innerHTML para processar <br>
    conteudoEl.innerHTML = escapeHtml(conteudo).replace(/\n/g, '<br>');
    conteudoEl.scrollTop = 0; // CORREÇÃO DE SCROLL (MANTIDA)
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  const u = new URL(window.location.href);
  u.searchParams.set('abrir', id);
  history.replaceState({}, '', u.toString());
}

function fecharModal() {
  const overlay = $('.modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  const u = new URL(window.location.href);
  u.searchParams.delete('abrir');
  history.replaceState({}, '', u.toString());
}


/* ================== LÓGICA DO CATÁLOGO ================== */

// HELPER: Cria o HTML do card de texto para o catálogo
function criarCardCatalogo(t) {
    const langSuffix = window.currentLang === 'en' ? '_en' : '';
    const titulo = t['titulo' + langSuffix] || t.titulo;
    const categoria = t['categoria' + langSuffix] || t.categoria;
    const resumo = t['resumo' + langSuffix] || t.resumo;
    
    return `
      <div class="card-texto ${t.favorito ? 'favorito' : ''}">
        <h3>${escapeHtml(titulo)} ${t.favorito ? '<span class="selo">★</span>' : ''}</h3>
        <p class="resumo">${escapeHtml(resumo)}</p>
        <button class="ler-mais" data-id="${t.id}">${translate('read_more')}</button>
      </div>
    `;
}

// Montar e Renderizar o Catálogo
function montarCatalogo(filtroBusca = '') {
  const container = $('#lista-textos');
  const tagContainer = $('#lista-tags-catalogo');
  if (!container || !tagContainer) return;

  // 1. Filtragem de Textos
  let textosFiltrados = window.textos.slice().reverse(); // Começa do mais novo
  
  // 1a. Filtro por Categoria (Tag)
  const tagFilterValue = filtroTagAtual.toLowerCase();
  if (tagFilterValue !== 'todos') {
    textosFiltrados = textosFiltrados.filter(t => 
      (t.categoria && t.categoria.toLowerCase() === tagFilterValue) ||
      (t.categoria_en && t.categoria_en.toLowerCase() === tagFilterValue)
    );
  }
  
  // 1b. Filtro por Busca (título, resumo, conteúdo)
  if (filtroBusca) {
    const termo = filtroBusca.toLowerCase();
    textosFiltrados = textosFiltrados.filter(t => {
      const ptMatch = (t.titulo && t.titulo.toLowerCase().includes(termo)) || 
                      (t.resumo && t.resumo.toLowerCase().includes(termo)) || 
                      (t.conteudo && t.conteudo.toLowerCase().includes(termo));
      const enMatch = (t.titulo_en && t.titulo_en.toLowerCase().includes(termo)) ||
                      (t.resumo_en && t.resumo_en.toLowerCase().includes(termo)) ||
                      (t.conteudo_en && t.conteudo_en.toLowerCase().includes(termo));
      return ptMatch || enMatch;
    });
  }

  // 2. Renderização dos Textos
  container.innerHTML = textosFiltrados.map(t => criarCardCatalogo(t)).join('');
  if (textosFiltrados.length === 0) {
    container.innerHTML = `<div style="padding:36px;text-align:center;color:#6b5314">
        ${translate('no_texts_found') || 'Nenhum texto encontrado.'}
    </div>`;
  }
  
  // 3. Renderização e Eventos das Tags de Filtro
  // 🟢 CORREÇÃO: Usar um Set para garantir tags únicas, ignorando a diferença entre pt/en no Set, mas mostrando o nome no idioma correto.
  const tagsSet = new Set();
  const tagMap = new Map(); // Mapa para garantir que a exibição da tag seja correta no idioma
  
  window.textos.forEach(t => {
    if (t.categoria) {
      const lowerTag = t.categoria.toLowerCase();
      if (!tagsSet.has(lowerTag)) {
        tagsSet.add(lowerTag);
        tagMap.set(lowerTag, t.categoria);
      }
    }
    if (t.categoria_en) {
        const lowerTag = t.categoria_en.toLowerCase();
        if (!tagsSet.has(lowerTag)) {
            tagsSet.add(lowerTag);
            tagMap.set(lowerTag, t.categoria_en);
        }
    }
  });

  const tagsUnicas = Array.from(tagsSet).sort();
  
  tagContainer.innerHTML = '';
  
  // Tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = 'javascript:void(0);';
  allPill.textContent = 'Todos'; 
  if (tagFilterValue === 'todos') {
      allPill.classList.add('active');
  }
  allPill.addEventListener('click', () => {
      filtroTagAtual = 'Todos';
      montarCatalogo(document.getElementById('barra-busca').value);
  });
  tagContainer.appendChild(allPill);


  tagsUnicas.forEach(tag => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    tagEl.href = 'javascript:void(0);'; 
    
    if (tag === tagFilterValue) {
        tagEl.classList.add('active');
    }
    
    // Obtém o nome da tag no idioma atual para exibição
    const displayTag = window.currentLang === 'en' 
        ? (tagMap.get(tag).toLowerCase() === tag ? tagMap.get(tag) : tag)
        : (tagMap.get(tag).toLowerCase() === tag ? tagMap.get(tag) : tag);

    tagEl.textContent = `#${displayTag}`;
    
    tagEl.addEventListener('click', () => {
        if (filtroTagAtual.toLowerCase() === tag) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = displayTag; // Usa o nome exibido (ex: 'Conto') para o filtro interno
        }
        montarCatalogo(document.getElementById('barra-busca').value); 
    });
    tagContainer.appendChild(tagEl);
  });
  
  // 4. Reaplicar eventos de clique dos botões "Ler mais"
  setupCatalogoInteractions();
}


// 🟢 CORREÇÃO: Nova função para configurar todos os eventos do Catálogo
function setupCatalogoInteractions() {
    // 1. Evento de clique para o botão "Ler mais"
    $$('.ler-mais').forEach(button => {
        button.removeEventListener('click', handleLerMaisClick); // Remove listener anterior
        button.addEventListener('click', handleLerMaisClick);
    });

    // 2. Evento de digitação na barra de busca
    const barraBusca = $('#barra-busca');
    if (barraBusca) {
        // Remove listener anterior para evitar duplicação
        barraBusca.removeEventListener('input', handleSearchInput); 
        barraBusca.addEventListener('input', handleSearchInput);
    }
}

// Handler para o botão "Ler mais"
function handleLerMaisClick(e) {
    const id = e.currentTarget.getAttribute('data-id');
    abrirModalPorId(id);
}

// Handler para a busca
function handleSearchInput(e) {
    montarCatalogo(e.target.value);
}

// ... [Outras funções, como setupHamburguerCatalogo, mantidas] ...

/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  setupInitialLanguage(); // Deve ser a primeira coisa a rodar!

  // Lógica de Inicialização da Home
  if($('#lista-favoritos') || $('#lista-tags')){
    montarHome();
  }

  // Lógica de Inicialização do Catálogo
  if($('#lista-textos')){
    // Monta o catálogo inicialmente (já chama setupCatalogoInteractions internamente)
    montarCatalogo(qs('busca') || ''); 
    // Garante que o menu hamburguer funcione
    setupHamburguerCatalogo(); 
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

  // Se houver parâmetro 'abrir' na URL, abre o modal
  const openId = qs('abrir');
  if (openId) {
      abrirModalPorId(openId);
  }
});
