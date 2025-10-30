/* script.js — unificado para home + catálogo */

/* helpers */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const isCatalogPage = () => location.pathname.includes('textos.html');
const qs = k => new URLSearchParams(location.search).get(k);

/* MENU BURGER */
function initMenu(){
  const burger = $('.burger');
  const menu = $('#menu');
  if(!burger || !menu) return;
  burger.addEventListener('click', e=>{
    e.stopPropagation();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });
  // fechar ao clicar fora (mobile)
  window.addEventListener('click', (ev)=>{
    if(!menu) return;
    if(menu.style.display === 'flex' && !menu.contains(ev.target) && !$('.burger').contains(ev.target)){
      menu.style.display = 'none';
    }
  });
  // fechar no resize quando desktop
  window.addEventListener('resize', ()=> {
    if(window.innerWidth >= 768) menu.style.display = 'flex';
    else if(menu) menu.style.display = 'none';
  });
}

/* Modal */
function abrirModal(idx){
  const modal = $('#modal-texto');
  const tituloEl = $('#modal-titulo');
  const conteudoEl = $('#modal-conteudo');
  if(!modal || !tituloEl || !conteudoEl) return;

  const t = window.textos && window.textos[idx];
  if(!t) return;

  tituloEl.textContent = t.titulo;
  conteudoEl.textContent = t.conteudo;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function fecharModal(){
  const modal = $('#modal-texto');
  if(!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function initModalEvents(){
  const modal = $('#modal-texto');
  if(!modal) return;
  $('#modal-fechar')?.addEventListener('click', fecharModal);
  modal.addEventListener('click', (e)=>{
    if(e.target === modal) fecharModal();
  });
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape') fecharModal(); });
}

/* fallback foto (escolhe um arquivo disponível) */
function setFotoPerfilFallback(){
  const foto = $('#foto-perfil');
  if(!foto) return;
  const candidates = ['foto-perfil.jpg','foto-perfil.png','perfil.jpg','perfil.png','minha-foto.jpg'];
  // tenta carregar o primeiro que existir
  (async ()=>{
    for(const c of candidates){
      try{
        const resp = await fetch(c, {method:'HEAD'});
        if(resp.ok){
          foto.src = c;
          return;
        }
      }catch(e){}
    }
    // se não encontrou nenhum, usa placeholder (data URL ou deixa vazio)
    foto.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="%23efe1bf"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%235a4632" font-size="18">Sem Foto</text></svg>';
  })();
}

/* render na home (favoritos + tags) */
function renderHome(){
  const favContainer = $('#lista-favoritos');
  const tagsContainer = $('#lista-tags');
  if(!window.textos) return;
  if(favContainer){
    favContainer.innerHTML = '';
    // escolhe os primeiros dois ou os marcados favorite
    let favoritos = window.textos.filter(t=>t.favorito).slice(0,2);
    if(favoritos.length === 0) favoritos = window.textos.slice(0,2);
    favoritos.forEach(t=>{
      const idx = window.textos.indexOf(t);
      const card = document.createElement('div');
      card.className = 'texto-card';
      card.innerHTML = `<h4>${t.titulo}</h4><p>${(t.resumo || t.conteudo).slice(0,240)}${(t.resumo || t.conteudo).length>240 ? '...' : ''}</p>`;
      const btn = document.createElement('button');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      btn.addEventListener('click', ()=> {
        // abrir o catálogo e solicitar abrir o modal
        const url = `textos.html?abrir=${idx}`;
        window.location.href = url;
      });
      card.appendChild(btn);
      favContainer.appendChild(card);
    });
  }

  if(tagsContainer){
    tagsContainer.innerHTML = '';
    const tags = Array.from(new Set(window.textos.flatMap(t => t.tags || [t.categoria]).filter(Boolean)));
    tags.unshift('Todos');
    tags.forEach(tag=>{
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(tag)}`;
      a.textContent = tag;
      tagsContainer.appendChild(a);
    });
  }
}

/* render no catálogo (lista + filtros) */
function renderCatalogo(){
  const lista = $('#lista-textos');
  const filtros = $('#filtros');
  if(!window.textos || !lista) return;

  // constrói filtros
  const tagsSet = Array.from(new Set(window.textos.flatMap(t => t.tags || [t.categoria]).filter(Boolean)));
  const allTags = ['Todos', ...tagsSet];
  if(filtros){
    filtros.innerHTML = '';
    allTags.forEach(tag=>{
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = tag;
      btn.addEventListener('click', ()=> {
        applyFilter(tag === 'Todos' ? null : tag);
      });
      filtros.appendChild(btn);
    });
  }

  function applyFilter(tag){
    lista.innerHTML = '';
    const list = !tag ? window.textos.slice() : window.textos.filter(t => (t.tags || [t.categoria]).includes(tag));
    if(list.length === 0){
      lista.innerHTML = `<div class="texto-card">Nenhum texto encontrado para essa categoria.</div>`;
      return;
    }
    list.forEach(t=>{
      const idx = window.textos.indexOf(t);
      const card = document.createElement('article');
      card.className = 'texto-card';
      const excerpt = (t.resumo || t.conteudo).slice(0,350);
      card.innerHTML = `<h4>${t.titulo}</h4><div style="margin-bottom:10px"><span class="tag">${t.categoria || (t.tags||[])[0] || ''}</span></div><p>${excerpt}${(t.conteudo.length>350)?'...':''}</p>`;
      const btn = document.createElement('button');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      btn.addEventListener('click', ()=> abrirModal(idx));
      card.appendChild(btn);
      lista.appendChild(card);
    });
  }

  // aplica filtro vindo na URL se houver
  const tagParam = qs('tag');
  applyFilter(tagParam ? decodeURIComponent(tagParam) : null);
}

/* abrir modal se ?abrir=INDEX estiver na URL (vindo da home) */
function checkOpenFromURL(){
  const abrir = qs('abrir');
  if(abrir !== null && abrir !== undefined){
    const idx = Number(abrir);
    if(!Number.isNaN(idx)) {
      // se estamos no catálogo, abrir direto
      if(isCatalogPage()){
        setTimeout(()=> abrirModal(idx), 200);
      } else {
        // se estamos na home, navegar pra catálogo
        location.href = `textos.html?abrir=${idx}`;
      }
    }
  }
}

/* inicialização */
document.addEventListener('DOMContentLoaded', ()=>{
  initMenu();
  initModalEvents();
  setFotoPerfilFallback();

  if(typeof window.textos === 'undefined'){
    console.error('window.textos não encontrado — verifique textos.js');
    return;
  }

  if(isCatalogPage()){
    renderCatalogo();
  } else {
    renderHome();
  }

  checkOpenFromURL();
  // console log pra diagnósticos
  console.log('script.js inicializado — página:', isCatalogPage() ? 'catalogo' : 'home');
});
