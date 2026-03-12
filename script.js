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

window.translations = {
    pt: {
        site_title: 'Meu Cantinho',
        home: 'Início',
        favorites: 'Textos Favoritos',
        tags: 'Tags',
        about: 'Sobre Mim',
        contact: 'Contato',
        read_more: 'Ler mais',
        all_texts: 'Ver todos os textos',
        catalogo_title: 'Catálogo de Textos',
        filter_by_tag: 'Filtrar por Categoria:',
        search_placeholder: 'Buscar por título, resumo ou conteúdo...',
        no_texts_found: 'Nenhum texto encontrado.',
        all_tags: 'Todos',
        // Categorias (usadas no filter e display quando o idioma é PT)
        'crônica': 'Crônica',
        'conto': 'Conto',
        'short story': 'Conto',
        'chronicle': 'Crônica',
        'enviar e-mail': 'Enviar e-mail', // Adicionado para o botão de contato
    },
    en: {
        site_title: 'My Author Corner',
        home: 'Home',
        favorites: 'Favorite Texts',
        tags: 'Tags',
        about: 'About Me',
        contact: 'Contact',
        read_more: 'Read more',
        all_texts: 'View all texts',
        catalogo_title: 'Texts Catalog',
        filter_by_tag: 'Filter by Category:',
        search_placeholder: 'Search by title, summary, or content...',
        no_texts_found: 'No texts found.',
        all_tags: 'All',
        // Categorias (usadas no filter e display quando o idioma é EN)
        'crônica': 'Chronicle',
        'conto': 'Short Story',
        'short story': 'Short Story',
        'chronicle': 'Chronicle',
        'enviar e-mail': 'Send email', // Adicionado para o botão de contato
    }
};


function translate(key) {
    if (!window.translations || !window.translations[window.currentLang]) {
        return key;
    }
    // Tenta encontrar a chave exata ou a chave em minúsculas
    return window.translations[window.currentLang][key.toLowerCase()] || window.translations[window.currentLang][key] || key;
}

// Aplica a tradução a todos os elementos com o atributo data-lang-key e dinâmicos
function applyTranslations() {
    const lang = window.currentLang;
    const t = window.translations[lang];
    if (!t) return;

    // 1. Títulos principais e Placeholders
    const sitePageTitle = $('#site-page-title'); // Título da aba Home
    if (sitePageTitle) sitePageTitle.textContent = translate('site_title') || 'Meu Cantinho';

    const catalogoPageTitle = $('#catalogo-page-title'); // Título da aba Catálogo
    const catalogoHeaderTitle = $('#catalogo-header-title');
    const tagsFiltroLabel = $('#tags-filtro-label');
    const barraBusca = $('#barra-busca');
    
    // Elementos do Catálogo
    if (catalogoPageTitle) catalogoPageTitle.textContent = translate('catalogo_title');
    if (catalogoHeaderTitle) catalogoHeaderTitle.textContent = translate('catalogo_title');
    if (tagsFiltroLabel) tagsFiltroLabel.textContent = translate('filter_by_tag');
    if (barraBusca) barraBusca.placeholder = translate('search_placeholder');
    
    // 2. Navegação e Textos com data-lang-key
    $$('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // 3. Conteúdo fixo da Home (para as frases mais longas)
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

    // 4. Tradução do botão de contato (que não tem data-lang-key no seu HTML)
    const emailButton = $('.secao a.botao-catalogo');
    if (emailButton) {
        // Assume que o botão de email está na seção de contato
        if (emailButton.getAttribute('href') && emailButton.getAttribute('href').startsWith('mailto')) {
            emailButton.textContent = translate('enviar e-mail');
        }
    }

    // 5. Re-renderizar conteúdo dinâmico (tags e cards)
    if ($('#lista-textos')) {
        montarCatalogo(qs('busca') || '');
    }
    if ($('#lista-favoritos')) {
        montarHome();
    }
}

function setupLanguageSwitch(selectId) {
    const selector = $(selectId);
    if (selector) {
        selector.value = window.currentLang; 
        selector.addEventListener('change', (e) => {
            window.currentLang = e.target.value;
            // Atualiza o parâmetro na URL para persistir o idioma
            const u = new URL(window.location.href);
            u.searchParams.set('lang', window.currentLang);
            
            // Redireciona para a Home ou Catálogo, mantendo o filtro de tag se estiver no Catálogo
            if (window.location.pathname.includes('catalogo.html')) {
                 u.searchParams.set('tag', filtroTagAtual);
            } else {
                 u.searchParams.delete('tag');
            }
            history.replaceState({}, '', u.toString());
            
            // Re-aplica as traduções e re-monta o conteúdo dinâmico
            applyTranslations();
        });
    }
}

function setupInitialLanguage() {
    // 1. Tenta obter o idioma da URL
    const langFromUrl = qs('lang');
    
    // 2. Se não houver, tenta obter do seletor da Home ou Catálogo
    const langSelectHome = $('#lang-switch-home');
    const langSelectCatalogo = $('#lang-switch');
    
    if (langFromUrl && ['pt', 'en'].includes(langFromUrl)) {
        window.currentLang = langFromUrl;
    } else if (langSelectHome) {
        window.currentLang = langSelectHome.value;
    } else if (langSelectCatalogo) {
        window.currentLang = langSelectCatalogo.value;
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
    // Tenta buscar o texto no idioma atual, senão usa o PT como fallback
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
  // Usa um Map para garantir unicidade e exibir no idioma correto
  const tagsMap = new Map(); // Key: tag em minúscula (do idioma atual), Value: tag para exibição
  const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
  const otherLangKey = window.currentLang === 'en' ? 'categoria' : 'categoria_en';
  
  window.textos.forEach(t => {
      let tagDisplay = t[langKey];
      
      // Se a tag do idioma atual não existe, usa o PT (ou EN)
      if (!tagDisplay && t[otherLangKey]) {
          tagDisplay = t[otherLangKey];
      }
      
      if (tagDisplay) {
          // Traduz para o idioma atual (ex: se currentLang=PT, traduz 'Short Story' para 'Conto')
          const translatedDisplay = translate(tagDisplay) || tagDisplay;
          
          // A chave do Map é o nome traduzido em minúsculas (para unicidade)
          tagsMap.set(translatedDisplay.toLowerCase(), translatedDisplay);
      }
  });

  const tagsUnicasSorted = Array.from(tagsMap.keys()).sort();
  
  tagsContainer.innerHTML = '';

  tagsUnicasSorted.forEach(tagLower => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    
    // Pega o nome correto para exibição (valor do Map)
    const displayTag = tagsMap.get(tagLower) || tagLower;
    
    // Linka para a página de catálogo e passa o nome da tag em minúsculas como parâmetro para o filtro
    tagEl.href = `catalogo.html?tag=${encodeURIComponent(tagLower)}&lang=${window.currentLang}`; 
    
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
    lerTodosBtn.href = `catalogo.html?tag=Todos&lang=${window.currentLang}`;
  }
}

/* ================== FUNÇÕES DO MODAL ================== */

function abrirModalPorId(id) {
  const t = window.textos.find(x => x.id === id);
  if (!t) return;
  
  const overlay = $('.modal-overlay');
  if (!overlay) return;

  // Seleciona o título e conteúdo no idioma atual
  const langSuffix = window.currentLang === 'en' ? '_en' : '';
  const titulo = t['titulo' + langSuffix] || t.titulo;
  const conteudo = t['conteudo' + langSuffix] || t.conteudo;

  const tituloEl = document.getElementById('modal-titulo');
  const conteudoEl = document.getElementById('modal-conteudo');
  
  if (tituloEl && conteudoEl) {
    tituloEl.textContent = titulo;
    conteudoEl.innerHTML = escapeHtml(conteudo).replace(/\n/g, '<br>');
    conteudoEl.scrollTop = 0; 
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Atualiza o parâmetro 'abrir' na URL apenas se estiver no catálogo
  if (window.location.pathname.includes('catalogo.html')) {
      const u = new URL(window.location.href);
      u.searchParams.set('abrir', id);
      history.replaceState({}, '', u.toString());
  }
}

function fecharModal() {
  const overlay = $('.modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  // Limpa o parâmetro 'abrir' da URL
  const u = new URL(window.location.href);
  u.searchParams.delete('abrir');
  history.replaceState({}, '', u.toString());
}

/* ================== LÓGICA DO CATÁLOGO ================== */

// HELPER: Cria o HTML do card de texto para o catálogo
function criarCardCatalogo(t) {
    // Tenta buscar o texto no idioma atual, senão usa o PT como fallback
    const langSuffix = window.currentLang === 'en' ? '_en' : '';
    const titulo = t['titulo' + langSuffix] || t.titulo;
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
    textosFiltrados = textosFiltrados.filter(t => {
      // O filtro é feito comparando o valor em minúsculas (da URL/clique)
      const ptMatch = t.categoria && t.categoria.toLowerCase() === tagFilterValue;
      const enMatch = t.categoria_en && t.categoria_en.toLowerCase() === tagFilterValue;
      
      // O filtro também deve funcionar se o nome da tag em PT traduzido para EN (ou vice-versa) for igual ao filtro
      const translatedFilter = translate(tagFilterValue).toLowerCase();
      const ptMatchTranslated = t.categoria && translate(t.categoria).toLowerCase() === translatedFilter;
      const enMatchTranslated = t.categoria_en && translate(t.categoria_en).toLowerCase() === translatedFilter;
      
      return ptMatch || enMatch || ptMatchTranslated || enMatchTranslated;
    });
  }
  
  // 1b. Filtro por Busca
  if (filtroBusca) {
    const termo = filtroBusca.toLowerCase();
    textosFiltrados = textosFiltrados.filter(t => {
      // Busca em PT e EN
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
  // CORREÇÃO: Garante unicidade e exibe no idioma correto (a lógica foi refeita no prompt anterior e está mantida)
  const tagsMap = new Map(); 
  const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
  const otherLangKey = window.currentLang === 'en' ? 'categoria' : 'categoria_en';
  
  window.textos.forEach(t => {
      let tagDisplay = t[langKey]; 

      if (!tagDisplay) {
          tagDisplay = t[otherLangKey];
      }
      
      if (tagDisplay) {
          // Traduz para o idioma atual
          const translatedDisplay = translate(tagDisplay) || tagDisplay;
          
          // Chave do Map é o nome traduzido em minúsculas (para unicidade)
          tagsMap.set(translatedDisplay.toLowerCase(), translatedDisplay);
      }
  });

  const tagsUnicasSorted = Array.from(tagsMap.keys()).sort();
  
  tagContainer.innerHTML = '';
  
  // Tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = 'javascript:void(0);';
  allPill.textContent = translate('all_tags') || 'Todos'; 
  
  if (filtroTagAtual.toLowerCase() === 'todos') {
      allPill.classList.add('active');
  }
  allPill.addEventListener('click', () => {
      filtroTagAtual = 'Todos';
      montarCatalogo(document.getElementById('barra-busca').value);
  });
  tagContainer.appendChild(allPill);

  tagsUnicasSorted.forEach(tagLower => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    tagEl.href = 'javascript:void(0);'; 
    
    // Pega o nome correto para exibição (nome mapeado/traduzido)
    const displayTag = tagsMap.get(tagLower) || tagLower;
    
    if (filtroTagAtual.toLowerCase() === displayTag.toLowerCase()) {
        tagEl.classList.add('active');
    }
    
    tagEl.textContent = `#${displayTag}`;
    
    tagEl.addEventListener('click', () => {
        if (filtroTagAtual.toLowerCase() === displayTag.toLowerCase()) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = displayTag;
        }

        montarCatalogo(document.getElementById('barra-busca').value); 
    });
    tagContainer.appendChild(tagEl);
  });
  
  // 4. Reaplicar eventos de clique dos botões "Ler mais"
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

  // Lógica de Abrir/Fechar
  const toggleMenu = (open) => {
    if (open) {
        menu.classList.add('ativo');
        document.body.style.overflow = 'hidden';
    } else {
        menu.classList.remove('ativo');
        document.body.style.overflow = '';
    }
  };

  abrir.addEventListener('click', () => toggleMenu(true));
  if(fechar) fechar.addEventListener('click', () => toggleMenu(false));
  
  // Fecha o menu ao clicar fora
  window.addEventListener('click', (e) => {
    if(menu.classList.contains('ativo') && !menu.contains(e.target) && e.target !== abrir){
      toggleMenu(false);
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
    // Obtém o filtro de tag da URL
    const tagFromUrl = qs('tag');
    if (tagFromUrl) {
      filtroTagAtual = decodeURIComponent(tagFromUrl);
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
    // Timeout para garantir que o DOM esteja carregado/renderizado antes de abrir
    setTimeout(() => abrirModalPorId(openId), 50); 
  }
});

// No final do script.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-theme');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
        });
    }
});
