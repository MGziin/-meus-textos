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
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
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

  // Preencher modal
  const tituloEl = document.getElementById('modal-titulo');
  const conteudoEl = document.getElementById('modal-conteudo');
  
  if (tituloEl && conteudoEl) {
    tituloEl.textContent = t.titulo;
    
    // CORREÇÃO: Usamos textContent para que o CSS (white-space: pre-line)
    // formate as quebras de linha do texto (campo 'conteudo') corretamente.
    conteudoEl.textContent = t.conteudo;
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
}

/* ================== FUNÇÕES DO CATÁLOGO ================== */

// Gerar o HTML de um Card de Texto
function criarCardHtml(t) {
  // O foco agora é na Categoria/Estilo (que já aparece no meta-info)
  
  return `
    <div class="card-texto ${t.favorito ? 'favorito' : ''}">
      <h3>${escapeHtml(t.titulo)}</h3>
      <div class="meta-info">
        <span class="categoria">${escapeHtml(t.categoria)}</span> | 
        <span class="data">${escapeHtml(t.data)}</span>
        ${t.favorito ? '<span class="star">★ Favorito</span>' : ''}
      </div>
      <p class="resumo">${escapeHtml(t.resumo)}</p>
      <button class="btn-ler" data-id="${t.id}">Ler mais</button>
    </div>
  `;
}

// Montar e Renderizar o Catálogo
function montarCatalogo() {
  const container = $('#lista-textos');
  if (!container) return;

  const tagFiltro = qs('tag');
  const abrirId = qs('abrir');
  
  let textosFiltrados = window.textos;

  // 1. Filtragem por Categoria (a nova lógica de filtro)
  if (tagFiltro && tagFiltro !== 'todos') {
    textosFiltrados = window.textos.filter(t => 
      t.categoria && t.categoria.toLowerCase() === tagFiltro.toLowerCase()
    );
    document.title = `Catálogo - #${tagFiltro}`; 
  }

  // 2. Renderização
  // Exibe os mais novos primeiro
  const textosParaMostrar = textosFiltrados.slice().reverse(); 
  container.innerHTML = textosParaMostrar.map(t => criarCardHtml(t)).join('');

  // 3. Adicionar Event Listeners aos botões "Ler mais"
  $$('.btn-ler').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (id) abrirModalPorId(id);
    });
  });

  // 4. Abrir Modal Automaticamente se houver o parâmetro 'abrir' na URL
  if (abrirId) {
    abrirModalPorId(abrirId);
    history.replaceState(null, '', location.pathname + (tagFiltro ? `?tag=${tagFiltro}` : ''));
  }
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

/* ================== FUNÇÕES DA HOME ================== */

// Função que o botão na HOME deve chamar
function abrirCatalogo(parametro, tipo = 'tag') {
  if (tipo === 'tag') {
    window.location.href = `catalogo.html?tag=${encodeURIComponent(parametro)}`;
  } else if (tipo === 'abrir') {
    window.location.href = `catalogo.html?abrir=${encodeURIComponent(parametro)}`;
  } else {
    window.location.href = `catalogo.html`; 
  }
}

// Montar a seção de Favoritos e Tags na Home
function montarHome() {
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if (!favContainer || !tagsContainer) return;

  // 1. Montar Favoritos
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

    // Event Listener: botão "Ler mais" na HOME
    card.querySelector('.btn-ler').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (id) abrirCatalogo(id, 'abrir'); 
    });
  });

  // 2. Montar Tags (Estilos) Dinamicamente usando o campo 'categoria'
  const todasAsCategorias = window.textos.map(t => t.categoria).filter(Boolean);
  // Remove duplicatas e coloca em minúsculas
  const tagsUnicas = [...new Set(todasAsCategorias.map(t => t.toLowerCase()))].sort(); 
  
  tagsContainer.innerHTML = '';
  tagsUnicas.forEach(tag => {
    const tagEl = document.createElement('a');
    tagEl.className = 'tag-pill';
    // O filtro na URL é sempre minúsculo
    tagEl.href = `catalogo.html?tag=${encodeURIComponent(tag)}`;
    // Exibe com a primeira letra maiúscula para melhor aparência
    tagEl.textContent = `#${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
    tagsContainer.appendChild(tagEl);
  });
  
  // 3. Listener no botão "Ver todos os textos"
  const btnLerTodos = $('#btn-ler-todos');
  if(btnLerTodos){
    btnLerTodos.addEventListener('click', (e) => {
      e.preventDefault(); 
      abrirCatalogo('todos', 'tag');
    });
  }
}

/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  // Montar Home se houver elementos de Home (index.html)
  if ($('#lista-favoritos') || $('#lista-tags')) {
    montarHome();
  }

  // Montar Catálogo se houver o container do Catálogo (catalogo.html)
  if ($('#lista-textos')) {
    montarCatalogo();
    setupHamburguerCatalogo();
  }

  // Configuração global para fechar o modal (funciona em ambos os sites)
  const overlay = $('.modal-overlay');
  if (overlay) {
    // Fecha ao clicar no fundo
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
