// script.js — compartilha comportamento entre home e catálogo
// depende de textos.js (carregado antes)

// helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const qs = k => new URLSearchParams(window.location.search).get(k);

// transforma texto com quebras em HTML
function toHtml(text){
  return text.split('\n').map(ln => ln.trim()).join('\n\n').replace(/\n/g, '<br>');
}

// monta home (lista favoritos, tags, botão "ler todos")
function montarHome(){
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if(!favContainer || !tagsContainer) return;

  // favoritos: A Semente e Muros Falsos devem aparecer como favoritos
  const favoritos = window.textos.filter(t => t.favorito);
  favContainer.innerHTML = '';
  favoritos.forEach(t => {
    const card = document.createElement('div');
    card.className = 'card-fav';
    card.innerHTML = `
      <div class="titulo-row">
        <h3>${t.titulo}</h3>
        <div class="star">★</div>
      </div>
      <div class="resumo">${escapeHtml(t.resumo)}</div>
      <button class="btn-ler" data-id="${t.id}">Ler mais</button>
    `;
    favContainer.appendChild(card);
  });

  // tags home — pegar categorias existentes (Crônica, Fábula, etc) e adicionar "Todos"
  const cats = Array.from(new Set(window.textos.map(t => t.categoria)));
  tagsContainer.innerHTML = '';
  const allPill = document.createElement('a');
  allPill.className = 'tag-pill';
  allPill.href = `catalogo.html?tag=Todos`;
  allPill.textContent = 'Todos';
  tagsContainer.appendChild(allPill);

  cats.forEach(cat => {
    const a = document.createElement('a');
    a.className = 'tag-pill';
    a.href = `catalogo.html?tag=${encodeURIComponent(cat)}`;
    a.textContent = cat;
    tagsContainer.appendChild(a);
  });

  // botão "Ler todos os textos"
  const btnTodos = $('#btn-ler-todos');
  if(btnTodos){
    btnTodos.href = `catalogo.html?tag=Todos`;
  }

  // adiciona eventos "Ler mais" na home — enviam para catalogo com abrir=<id>
  $$('.btn-ler').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      // abre catálogo e indica abrir
      window.location.href = `catalogo.html?abrir=${encodeURIComponent(id)}`;
    });
  });
}

// monta catálogo
function montarCatalogo(){
  const container = $('#lista-textos');
  if(!container) return;
  container.innerHTML = '';

  // qual tag vem na URL?
  const tagParam = qs('tag') || 'Todos';
  const abrirParam = qs('abrir');

  let lista = window.textos.slice();
  if(tagParam && tagParam !== 'Todos'){
    lista = lista.filter(t => t.categoria === tagParam);
  }

  if(lista.length === 0){
    container.innerHTML = `<div style="padding:36px;text-align:center;color:#6b5314">Nenhum texto encontrado para essa categoria.</div>`;
    return;
  }

  lista.forEach(t => {
    const card = document.createElement('div');
    card.className = 'texto-card';
    if(t.favorito) card.classList.add('favorito');

    // mostra resumo na listagem (limitado por CSS)
    card.innerHTML = `
      <h3>${t.titulo} ${t.favorito ? '<span class="selo">★</span>' : ''}</h3>
      <p class="preview">${escapeHtml(t.resumo)}</p>
      <button class="ler-mais" data-id="${t.id}">Ler mais</button>
    `;
    container.appendChild(card);
  });

  // ligar botões Ler mais: abrem modal com texto completo
  $$('.ler-mais').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      abrirModalPorId(id);
      // atualiza URL sem recarregar para permitir voltar / copia do link
      const u = new URL(window.location.href);
      u.searchParams.set('abrir', id);
      history.replaceState({}, '', u.toString());
    });
  });

  // se veio ?abrir=..., abrir o modal automaticamente
  if(abrirParam){
    setTimeout(() => abrirModalPorId(abrirParam), 160);
  }
}

// abrir modal por id (procura no window.textos)
function abrirModalPorId(id){
  const t = window.textos.find(x => x.id === id);
  if(!t) return;
  const overlay = $('.modal-overlay');
  const box = $('.modal-box');
  if(!overlay || !box) return;
  $('.modal-box #modal-titulo')?.remove?.(); // small cleanup
  // preencher
  const tituloEl = document.getElementById('modal-titulo');
  const conteudoEl = document.getElementById('modal-conteudo');
  if(tituloEl && conteudoEl){
    tituloEl.textContent = t.titulo;
    conteudoEl.innerHTML = escapeHtml(t.conteudo).replace(/\n/g, '<br>');
  }
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// fechar modal
function fecharModal(){
  const overlay = $('.modal-overlay');
  if(overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  // limpa abrir param da URL (não necessário, mas útil)
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

/* ================== MENU HAMBURGUER (catalogo) ================== */
function setupHamburguerCatalogo(){
  const abrir = $('#abrir-menu');
  const menu = $('.menu-lateral');
  const fechar = $('#fechar-menu');
  if(!abrir || !menu) return;
  abrir.addEventListener('click', () => menu.classList.add('ativo'));
  if(fechar) fechar.addEventListener('click', () => menu.classList.remove('ativo'));
  // fecha ao clicar fora
  window.addEventListener('click', (e) => {
    if(menu.classList.contains('ativo') && !menu.contains(e.target) && e.target !== abrir){
      menu.classList.remove('ativo');
    }
  });
}

/* ================== INICIALIZAÇÃO ================== */
document.addEventListener('DOMContentLoaded', () => {
  // montar home se houver elementos
  if($('#lista-favoritos') || $('#lista-tags')){
    montarHome();
  }

  // montar catálogo se houver
  if($('#lista-textos')){
    montarCatalogo();
    setupHamburguerCatalogo();
  }

  // modal overlay close
  const overlay = $('.modal-overlay');
  if(overlay){
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) fecharModal();
    });
  }
  const closeBtn = document.getElementById('modal-close-btn');
  if(closeBtn) closeBtn.addEventListener('click', fecharModal);

  // header nav links smoother scroll on home (if anchors exist)
  $$('.header-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      // standard anchor handles it — keep default; if on other page, link will navigate
    });
  });

});
