// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

/* ================== HELPERS ================== */

// Seletores DOM
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Leitura de parâmetros da URL
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

/* ================== TRADUÇÃO ================== */

function translate(key) {
    if (!window.translations || !window.translations[window.currentLang]) {
        return key;
    }
    return window.translations[window.currentLang][key] || key;
}

// Aplica a tradução a todos os elementos com o atributo data-lang-key
function applyTranslations() {
    const lang = window.currentLang;
    const t = window.translations[lang];
    if (!t) return;

    // 1. Títulos principais e Placeholders
    const catalogoPageTitle = $('#catalogo-page-title');
    const catalogoHeaderTitle = $('#catalogo-header-title');
    const tagsFiltroLabel = $('#tags-filtro-label');
    const barraBusca = $('#barra-busca');
    
    if (catalogoPageTitle) catalogoPageTitle.textContent = t['catalogo_title'];
    if (catalogoHeaderTitle) catalogoHeaderTitle.textContent = t['catalogo_title'];
    if (tagsFiltroLabel) tagsFiltroLabel.textContent = t['filter_by_tag'];
    if (barraBusca) barraBusca.placeholder = t['search_placeholder'];
    
    const homePageTitle = $('#site-page-title');
    if (homePageTitle) homePageTitle.textContent = t['site_title'];
    
    // Conteúdo fixo da Home
    if ($('#inicio')) {
        $('#home-inicio-text').textContent = (lang === 'en') 
            ? 'Welcome to my little corner — here you will find all my texts, reflections, and stories. 💛' 
            : 'Bem-vindo(a) ao meu cantinho — aqui você encontra todos os meus textos, reflexões e histórias. 💛';
        $('#home-sobre-text').textContent = (lang === 'en')
            ? 'I am someone who transforms thoughts into words. Every text here is a part of what I have lived, felt, and learned.'
            : 'Sou alguém que transforma pensamentos em palavras. Cada texto aqui é uma parte do que vivi, senti e aprendi.';
        $('#home-contato-text').textContent = (lang === 'en')
            ? 'Want to chat, exchange ideas, or suggest something? Contact me! 💬'
            : 'Quer conversar, trocar ideias ou sugerir algo? Entre em contato comigo! 💬';
    }

    // 2. Navegação
    $$('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // 3. Re-renderizar conteúdo dinâmico
    if ($('#lista-textos')) {
        const busca = $('#barra-busca') ? $('#barra-busca').value : '';
        filtroTagAtual = 'Todos'; // Resetar tag ao mudar de idioma
        montarCatalogo(busca);
    }
    if ($('#lista-favoritos')) {
        montarHome();
    }
}

function setupLanguageSwitch(selectId) {
    const selector = $(selectId);
    if (selector) {
        selector.value = window.currentLang; // Define o valor inicial
        selector.addEventListener('change', (e) => {
            window.currentLang = e.target.value;
            applyTranslations();
        });
    }
}

function setupInitialLanguage() {
    // Tenta obter o idioma do seletor de idioma na URL ou usa 'pt'
    const langFromUrl = qs('lang');
    const langSelect = $('#lang-switch') || $('#lang-switch-home');
    
    if (langFromUrl && ['pt', 'en'].includes(langFromUrl)) {
        window.currentLang = langFromUrl;
    } else if (langSelect) {
        window.currentLang = langSelect.value;
    } else {
        window.currentLang = 'pt';
    }
    
    applyTranslations();
    
    // Configura os eventos de troca de idioma
    setupLanguageSwitch('#lang-switch');
    setupLanguageSwitch('#lang-switch-home');
}


/* ================== FUNÇÕES DA HOME (INDEX.HTML) ================== */

// HELPER: Cria o HTML do card favorito
function criarCardFavorito(t) {
    const langSuffix = window.currentLang === 'en' ? '_en' : '';
    const titulo = t['titulo' + langSuffix] || t.titulo;
    const resumo = t['resumo' + langSuffix] || t.resumo;
    
    return `
      <div class="card-fav favorito">
        <h3>${escapeHtml(titulo)}</h3>
        <p class="resumo">${escapeHtml(resumo)}</p>
        <button class="btn-ler" data-id="${t.id}">${translate('read_more')}</button>
      </div>
    `;
}

// Montar a Home (Favoritos e Tags)
function montarHome() {
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if (!favContainer || !tagsContainer) return;

  // 1. Favoritos
  favContainer.innerHTML = '';
  const favoritos = window.textos.filter(t => t.favorito);
  favoritos.forEach(t => {
      favContainer.innerHTML += criarCardFavorito(t);
  });
  
  // 2. Tags da Home
  const todasCategorias = [
    ...window.textos.map(t => t.categoria).filter(Boolean),
    ...window.textos.map(t => t.categoria_en).filter(Boolean)
  ];
  const tagsUnicas = [...new Set(todasCategorias.map(t => t.toLowerCase()))].sort(); 
  
  tagsContainer.innerHTML = '';

  tagsUnicas.forEach(tag => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    // Linka para a página de catálogo e passa a tag como parâmetro na URL
    tagEl.href = `catalogo.html?tag=${tag}`; 
    
    // Tenta exibir o nome da categoria no idioma atual (se disponível)
    const tagDisplayName = window.textos.find(t => 
        (t.categoria && t.categoria.toLowerCase() === tag) || 
        (t.categoria_en && t.categoria_en.toLowerCase() === tag)
    );
    const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
    const displayTag = tagDisplayName ? (tagDisplayName[langKey] || tagDisplayName.categoria) : tag;

    tagEl.textContent = `#${displayTag}`;
    
    tagsContainer.appendChild(tagEl);
  });
  
  // 3. Eventos "Ler mais" na Home
  $$('.btn-ler').forEach(button => {
    button.removeEventListener('click', handleLerMaisClick); 
    button.addEventListener('click', handleLerMaisClick);
  });
  
  // 4. Botão "Ver todos os textos"
  const lerTodosBtn = $('#btn-ler-todos');
  if (lerTodosBtn) {
    lerTodosBtn.href = 'catalogo.html?tag=Todos';
  }
}

/* ================== FUNÇÕES DO MODAL ================== */

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
    conteudoEl.innerHTML = escapeHtml(conteudo).replace(/\n/g, '<br>');
    conteudoEl.scrollTop = 0; // Rola o modal para o topo
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  const u = new URL(window.location.href);
  u.searchParams.set('abrir', id);
  // Usa replaceState para não encher o histórico do navegador
  if (window.location.pathname.includes('catalogo.html')) {
    history.replaceState({}, '', u.toString());
  }
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
  let textosFiltrados = window.textos.slice().reverse(); 
  
  // 1a. Filtro por Categoria (Tag)
  const tagFilterValue = filtroTagAtual.toLowerCase();
  if (tagFilterValue !== 'todos') {
    textosFiltrados = textosFiltrados.filter(t => 
      (t.categoria && t.categoria.toLowerCase() === tagFilterValue) ||
      (t.categoria_en && t.categoria_en.toLowerCase() === tagFilterValue)
    );
  }
  
  // 1b. Filtro por Busca
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
  // CORREÇÃO DE TAGS: Garante a unicidade e exibe no idioma correto
  const tagsSet = new Set();
  const tagMap = new Map(); 
  
  window.textos.forEach(t => {
    // Adiciona as categorias em minúsculas ao Set (para unicidade)
    if (t.categoria) tagsSet.add(t.categoria.toLowerCase());
    if (t.categoria_en) tagsSet.add(t.categoria_en.toLowerCase());

    // Mapeia o nome da tag em minúscula para o nome exibível no idioma atual
    const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
    const currentTag = t[langKey] || t.categoria;
    if (currentTag) tagMap.set(currentTag.toLowerCase(), currentTag);
  });

  const tagsUnicas = Array.from(tagsSet).sort();
  
  tagContainer.innerHTML = '';
  
  // Tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = 'javascript:void(0);';
  allPill.textContent = translate('all_tags') || 'Todos'; 
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
    
    // Usa o nome mapeado ou a tag em si
    const displayTag = tagMap.get(tag) || tag;
    
    if (filtroTagAtual.toLowerCase() === tag) {
        tagEl.classList.add('active');
    }
    
    tagEl.textContent = `#${displayTag}`;
    
    tagEl.addEventListener('click', () => {
        if (filtroTagAtual.toLowerCase() === tag) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = displayTag; 
        }
        montarCatalogo(document.getElementById('barra-busca').value); 
    });
    tagContainer.appendChild(tagEl);
  });
  
  // 4. Reaplicar eventos de clique dos botões "Ler mais" (Fix do problema anterior)
  setupCatalogoInteractions();
}


function setupCatalogoInteractions() {
    // 1. Evento de clique para o botão "Ler mais"
    $$('.ler-mais, .btn-ler').forEach(button => {
        button.removeEventListener('click', handleLerMaisClick); 
        button.addEventListener('click', handleLerMaisClick);
    });

    // 2. Evento de digitação na barra de busca
    const barraBusca = $('#barra-busca');
    if (barraBusca) {
        barraBusca.removeEventListener('input', handleSearchInput); 
        barraBusca.addEventListener('input', handleSearchInput);
    }
}

function handleLerMaisClick(e) {
    const id = e.currentTarget.getAttribute('data-id');
    abrirModalPorId(id);
}

function handleSearchInput(e) {
    montarCatalogo(e.target.value);
}

/* ================== MENU HAMBURGUER (CATÁLOGO) ================== */

function setupHamburguerCatalogo(){
  const abrir = $('#abrir-menu');
  const menu = $('.menu-lateral');
  const fechar = $('#fechar-menu');
  if(!abrir || !menu) return;

  abrir.addEventListener('click', () => menu.classList.add('ativo'));
  if(fechar) fechar.addEventListener('click', () => menu.classList.remove('ativo'));
  
  window.addEventListener('click', (e) => {
    // Fecha o menu se ele estiver ativo E se o clique não foi no próprio menu ou no botão de abrir
    if(menu.classList.contains('ativo') && !menu.contains(e.target) && e.target !== abrir){
      menu.classList.remove('ativo');
    }
  });
}

/* ================== INICIALIZAÇÃO ================== */

document.addEventListener('DOMContentLoaded', () => {
  setupInitialLanguage(); // Inicializa o idioma e aplica as traduções primeiro

  // Lógica de Inicialização da Home
  if($('#lista-favoritos') || $('#lista-tags')){
    montarHome();
  }

  // Lógica de Inicialização do Catálogo
  if($('#lista-textos')){
    // Obtém o filtro de tag da URL, se existir (usado quando se clica em uma tag na Home)
    const tagFromUrl = qs('tag');
    if (tagFromUrl) {
      filtroTagAtual = tagFromUrl;
    }
    montarCatalogo(qs('busca') || ''); 
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
