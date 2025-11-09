// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

/* ================== HELPERS ================== */

// Seletores DOM
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Leitura de parâmetros da URL
const qs = k => new URLSearchParams(window.location.search).get(k);

// Função para garantir que o texto inserido no HTML seja seguro
function escapeHtml(text) {
  if(text === null || text === undefined) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/* ================== TRADUÇÃO ================== */

function translate(key) {
    if (!window.translations || !window.translations[window.currentLang]) {
        console.warn(`Tradução não encontrada para o idioma: ${window.currentLang}`);
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
    // Catálogo
    const catalogoPageTitle = $('#catalogo-page-title');
    const catalogoHeaderTitle = $('#catalogo-header-title');
    const tagsFiltroLabel = $('#tags-filtro-label');
    const barraBusca = $('#barra-busca');
    
    if (catalogoPageTitle) catalogoPageTitle.textContent = t['catalogo_title'];
    if (catalogoHeaderTitle) catalogoHeaderTitle.textContent = t['catalogo_title'];
    if (tagsFiltroLabel) tagsFiltroLabel.textContent = t['filter_by_tag'];
    if (barraBusca) barraBusca.placeholder = t['search_placeholder'];
    
    // Home
    const homePageTitle = $('#site-page-title');
    if (homePageTitle) homePageTitle.textContent = t['site_title'];
    
    // Conteúdo fixo da Home (para tradução)
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

    // 2. Navegação (Home e Catálogo)
    $$('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // 3. Re-renderizar conteúdo dinâmico (catalogo e home)
    if ($('#lista-textos')) {
        const busca = $('#barra-busca') ? $('#barra-busca').value : '';
        montarCatalogo(busca);
    }
    if ($('#lista-favoritos')) {
        montarHome();
    }
}


/* ================== FUNÇÕES DO MODAL ================== */

// Abrir modal por ID
function abrirModalPorId(id) {
  const t = window.textos.find(x => x.id === id);
  if (!t) {
    console.error("Texto não encontrado com o ID:", id);
    return;
  }
  
  const overlay = $('.modal-overlay');
  if (!overlay) return;

  // Preencher modal (USANDO O IDIOMA ATUAL)
  const langSuffix = window.currentLang === 'en' ? '_en' : '';
  const titulo = t['titulo' + langSuffix] || t.titulo;
  const conteudo = t['conteudo' + langSuffix] || t.conteudo;

  const tituloEl = document.getElementById('modal-titulo');
  const conteudoEl = document.getElementById('modal-conteudo');
  
  if (tituloEl && conteudoEl) {
    tituloEl.textContent = titulo;
    conteudoEl.innerHTML = escapeHtml(conteudo).replace(/\n/g, '<br>');
    
    // CORREÇÃO: Rola o modal para o topo
    conteudoEl.scrollTop = 0;
  }

  // Mostrar modal
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Fechar modal
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

/* ================== FUNÇÕES DO CATÁLOGO ================== */

// Estado atual do filtro (para uso em busca e tag)
let filtroTagAtual = qs('tag') || 'Todos'; 

// Gerar o HTML de um Card de Texto
function criarCardCatalogo(t) {
  const langSuffix = window.currentLang === 'en' ? '_en' : '';
  const titulo = t['titulo' + langSuffix] || t.titulo;
  const categoria = t['categoria' + langSuffix] || t.categoria;
  const resumo = t['resumo' + langSuffix] || t.resumo;
  
  return `
    <div class="card-texto ${t.favorito ? 'favorito' : ''}">
      <h3>${escapeHtml(titulo)}</h3>
      <div class="meta-info">
        <span class="categoria">${escapeHtml(categoria)}</span> | 
        <span class="data">${escapeHtml(t.data || '')}</span>
        ${t.favorito ? `<span class="star">${translate('favorite_star')}</span>` : ''}
      </div>
      <p class="resumo">${escapeHtml(resumo)}</p>
      <button class="btn-ler" data-id="${t.id}">${translate('read_more')}</button>
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
  if (filtroTagAtual !== 'Todos') {
    textosFiltrados = textosFiltrados.filter(t => 
      (t.categoria && t.categoria.toLowerCase() === filtroTagAtual.toLowerCase()) ||
      (t.categoria_en && t.categoria_en.toLowerCase() === filtroTagAtual.toLowerCase())
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
    container.innerHTML = `<div style="padding:36px;text-align:center;color:#6b5314">Nenhum texto encontrado.</div>`;
  }

  // 3. Renderização e Eventos das Tags de Filtro
  const todasCategorias = [
    ...window.textos.map(t => t.categoria).filter(Boolean),
    ...window.textos.map(t => t.categoria_en).filter(Boolean)
  ];
  const tagsUnicas = [...new Set(todasCategorias.map(t => t.toLowerCase()))].sort(); 
  
  tagContainer.innerHTML = '';
  
  // Adiciona a tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = 'javascript:void(0);';
  allPill.textContent = 'Todos'; // A função de tradução para "Todos" pode ser adicionada aqui
  if (filtroTagAtual.toLowerCase() === 'todos') {
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
    
    if (tag === filtroTagAtual.toLowerCase()) {
        tagEl.classList.add('active');
    }
    
    // Exibe o nome da categoria no idioma atual (se disponível)
    const tagDisplayName = window.textos.find(t => 
        (t.categoria && t.categoria.toLowerCase() === tag) || 
        (t.categoria_en && t.categoria_en.toLowerCase() === tag)
    );
    const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
    const displayTag = tagDisplayName ? (tagDisplayName[langKey] || tagDisplayName.categoria) : tag;

    tagEl.textContent = `#${displayTag}`;
    
    tagEl.addEventListener('click', () => {
        if (filtroTagAtual.toLowerCase() === tag) {
            filtroTagAtual = 'Todos';
        } else {
            filtroTagAtual = tag;
        }
        montarCatalogo(document.getElementById('barra-busca').value); 
    });
    tagContainer.appendChild(tagEl);
  });

  // 4. Ligar Listeners de Modal
  $$('.ler-mais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      abrirModalPorId(id);
    });
  });
}


// Configurar menu hamburguer (Catalogo)
function setupHamburguerCatalogo() {
  const abrir = $('#abrir-menu');
  const menu = $('.menu-lateral');
  const fechar = $('#fechar-menu');
  if (!abrir || !menu) return;

  abrir.addEventListener('click', () => menu.classList.add('ativo'));
  if (fechar) fechar.addEventListener('click', () => menu.classList.remove('ativo'));
  
  // Fecha ao clicar fora
  window.addEventListener('click', (e) => {
    if (menu.classList.contains('ativo') && !menu.contains(e.target) && e.target !== abrir) {
      menu.classList.remove('ativo');
    }
  });
}

// Configurar Troca de Idioma e Busca (CATALOGO)
function setupCatalogoInteractions() {
    // Configura a barra de busca
    const searchBar = $('#barra-busca');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            montarCatalogo(e.target.value.trim());
        });
        if (filtroTagAtual !== 'todos') {
             searchBar.value = '';
        }
    }
}


/* ================== FUNÇÕES DA HOME ================== */

// Função que o botão na HOME deve chamar
function abrirCatalogo(parametro, tipo = 'tag') {
  let url = 'catalogo.html?';
  
  if (tipo === 'tag') {
    url += `tag=${encodeURIComponent(parametro)}`;
  } else if (tipo === 'abrir') {
    // Para abrir direto o modal no catálogo
    url += `abrir=${encodeURIComponent(parametro)}`;
  }
  
  // Inclui o idioma atual na URL ao mudar de página
  if (window.currentLang !== 'pt') {
      url += (url.includes('?') ? '&' : '') + `lang=${window.currentLang}`;
  }
  
  window.location.href = url;
}


// Montar a seção de Favoritos e Tags na Home
function montarHome() {
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if (!favContainer || !tagsContainer) return;

  const langSuffix = window.currentLang === 'en' ? '_en' : '';
  
  // 1. Montar Favoritos
  const favoritos = window.textos.filter(t => t.favorito);
  favContainer.innerHTML = '';
  favoritos.forEach(t => {
    const titulo = t['titulo' + langSuffix] || t.titulo;
    const resumo = t['resumo' + langSuffix] || t.resumo;
    
    const card = document.createElement('div');
    card.className = 'card-fav';
    card.innerHTML = `
      <div class="titulo-row">
        <h3>${escapeHtml(titulo)}</h3>
        <div class="star">${translate('favorite_star').replace(' Favorito', '')}</div>
      </div>
      <div class="resumo">${escapeHtml(resumo)}</div>
      <button class="btn-ler" data-id="${t.id}">${translate('read_more')}</button>
    `;
    favContainer.appendChild(card);

    // Event Listener: botão "Ler mais" na HOME
    card.querySelector('.btn-ler').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (id) abrirCatalogo(id, 'abrir'); 
    });
  });

  // 2. Montar Tags (Estilos) Dinamicamente usando o campo 'categoria'
  const todasCategorias = window.textos.map(t => t.categoria).filter(Boolean);
  const tagsUnicas = [...new Set(todasCategorias.map(t => t.toLowerCase()))].sort(); 
  
  tagsContainer.innerHTML = '';
  
    // Adiciona a tag "Todos"
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = `catalogo.html?tag=Todos&lang=${window.currentLang}`;
  allPill.textContent = 'Todos'; // Traduzir "Todos" se necessário
  tagsContainer.appendChild(allPill);
  
  tagsUnicas.forEach(tag => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    
    // Encontra o nome da tag no idioma atual (ou usa o nome em PT)
    const tagDisplayName = window.textos.find(t => t.categoria.toLowerCase() === tag);
    const langKey = window.currentLang === 'en' ? 'categoria_en' : 'categoria';
    const displayTag = tagDisplayName ? (tagDisplayName[langKey] || tagDisplayName.categoria) : tag;
    
    tagEl.href = `catalogo.html?tag=${encodeURIComponent(tag)}&lang=${window.currentLang}`;
    tagEl.textContent = `#${displayTag}`;
    tagsContainer.appendChild(tagEl);
  });
  
  // 3. Listener no botão "Ver todos os textos"
  const btnLerTodos = $('#btn-ler-todos');
  if(btnLerTodos){
    btnLerTodos.textContent = translate('all_texts');
    btnLerTodos.addEventListener('click', (e) => {
      e.preventDefault(); 
      abrirCatalogo('todos', 'tag');
    });
  }
}

// Configura o idioma inicial (URL ou padrão) e os listeners de troca (HOME e CATÁLOGO)
function setupInitialLanguage() {
    // 1. Define o idioma inicial pela URL, se houver
    const urlLang = qs('lang');
    if (urlLang && window.translations[urlLang]) {
        window.currentLang = urlLang;
    }
    
    // 2. Sincroniza os seletores de idioma e configura o listener
    const langSwitches = [$('#lang-switch'), $('#lang-switch-home')].filter(el => el);
    
    langSwitches.forEach(switchEl => {
        if (!switchEl) return;
        // Define o valor inicial
        switchEl.value = window.currentLang;

        // Configura o listener para aplicar a tradução e atualizar a URL
        switchEl.addEventListener('change', (e) => {
            const newLang = e.target.value;
            window.currentLang = newLang;
            
            // Sincroniza o outro seletor (se existir)
            langSwitches.filter(el => el !== switchEl).forEach(el => el.value = newLang);
            
            applyTranslations();

            // Atualiza a URL para manter o idioma ao recarregar/navegar
            const url = new URL(window.location);
            if (newLang !== 'pt') {
                url.searchParams.set('lang', newLang);
            } else {
                url.searchParams.delete('lang');
            }
            window.history.pushState({}, '', url);
        });
    });
}


/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Configuração global de idioma (afeta ambas as páginas ao carregar)
  setupInitialLanguage();
  
  // 2. Montar Home se houver elementos de Home (index.html)
  if ($('#lista-favoritos')) {
    applyTranslations();
  }

  // 3. Montar Catálogo se houver o container do Catálogo (catalogo.html)
  if ($('#lista-textos')) {
    setupCatalogoInteractions(); // Configura busca e filtro
    setupHamburguerCatalogo(); // Configura o menu
    applyTranslations();
    
    // Verifica se deve abrir o modal após carregar (vindo da home)
    const abrirParam = qs('abrir');
    if (abrirParam) {
        setTimeout(() => abrirModalPorId(abrirParam), 100); 
    }
  }

  // 4. Configuração global para fechar o modal (funciona em ambos os sites)
  const overlay = $('.modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharModal();
    });
  }
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', fecharModal);

  // Fecha o modal com a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
      fecharModal();
    }
  });
});
