/* script.js — único script que alimenta home + catálogo.
   Depende de textos.js (window.textos) — carregue textos.js antes deste arquivo (já feito nos HTMLs).
*/

(function(){
  // helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const htmlEncode = s => (s||"").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // transforma quebras em <br>
  function nl2br(text){ return htmlEncode(text).replace(/\n/g,'<br>'); }

  // extrai param
  function qs(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  // render home favorites + tags
  function renderHome(){
    const catalogoHome = $('#catalogo-home');
    const tagsHome = $('#tags-home');
    if(!catalogoHome || !tagsHome) return;

    catalogoHome.innerHTML = '';
    tagsHome.innerHTML = '';

    // favorites: pick those with favorito true; if fewer than 2, show first two
    let favoritos = window.textos.filter(t => t.favorito);
    if(favoritos.length < 2) favoritos = window.textos.slice(0,2);

    favoritos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'texto-card';
      if(t.favorito){
        card.classList.add('favorite');
        const border = document.createElement('div'); border.className='favorite-border'; card.appendChild(border);
        const badge = document.createElement('div'); badge.className='favorite-badge'; badge.textContent='★'; card.appendChild(badge);
      }
      card.innerHTML = `
        <h3>${t.titulo}</h3>
        <div class="resumo">${t.resumo || ''}</div>
        <div class="texto-excerpt">${nl2br(t.conteudo.split('\n').slice(0,6).join('\n'))}</div>
        <div style="margin-top:10px">
          <a class="btn-ler" href="catalogo.html?abrir=${encodeURIComponent(t.id)}&tag=${encodeURIComponent(t.categoria)}">Ler mais</a>
        </div>
      `;
      catalogoHome.appendChild(card);
    });

    // tags (dinâmicas, só as categorias que existem)
    const categorias = Array.from(new Set(window.textos.map(t => t.categoria))).filter(Boolean);
    const tagTodos = document.createElement('a');
    tagTodos.className='tag';
    tagTodos.href = 'catalogo.html?tag=Todos';
    tagTodos.textContent = 'Todos';
    tagsHome.appendChild(tagTodos);

    categorias.forEach(c => {
      const a = document.createElement('a');
      a.className='tag';
      a.href = `catalogo.html?tag=${encodeURIComponent(c)}`;
      a.textContent = c;
      tagsHome.appendChild(a);
    });
  }

  // render catálogo (cards grid) com filtro
  function renderCatalogo(){
    const container = $('#catalogo-todos');
    const filtrosRow = $('#filtros-topo');
    if(!container || !filtrosRow) return;

    container.innerHTML = ''; filtrosRow.innerHTML = '';

    const categorias = Array.from(new Set(window.textos.map(t => t.categoria))).filter(Boolean);
    // add Todos
    const todosBtn = document.createElement('button');
    todosBtn.className='tag';
    todosBtn.textContent='Todos';
    todosBtn.addEventListener('click', ()=> applyFilter('Todos'));
    filtrosRow.appendChild(todosBtn);
    categorias.forEach(c => {
      const b = document.createElement('button');
      b.className='tag';
      b.textContent = c;
      b.addEventListener('click', ()=> applyFilter(c));
      filtrosRow.appendChild(b);
    });

    function makeCard(t){
      const art = document.createElement('div');
      art.className='card-texto';
      if(t.favorito){
        art.classList.add('favorite');
        const border = document.createElement('div'); border.className='favorite-border'; art.appendChild(border);
        const badge = document.createElement('div'); badge.className='favorite-badge'; badge.textContent='★'; art.appendChild(badge);
      }
      art.innerHTML = `
        <h3>${t.titulo}</h3>
        <div style="margin-bottom:8px"><span class="tag">${t.categoria}</span></div>
        <div class="card-texto-conteudo">${nl2br(t.conteudo)}</div>
        <div style="margin-top:10px"><a class="btn-ler" data-id="${t.id}" href="#">Ler mais</a></div>
      `;
      // ler mais opens modal
      const btn = art.querySelector('.btn-ler');
      btn.addEventListener('click', (ev)=>{
        ev.preventDefault();
        openModal(t.id);
        history.replaceState({},'',`catalogo.html?tag=${encodeURIComponent(t.categoria)}&abrir=${encodeURIComponent(t.id)}`);
      });
      return art;
    }

    // apply filter function
    function applyFilter(tag){
      container.innerHTML = '';
      let lista = [];
      if(!tag || tag === 'Todos') lista = window.textos.slice();
      else lista = window.textos.filter(t=>t.categoria === tag);
      if(lista.length === 0){
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:18px;color:${'#6b5a25'}">Nenhum texto encontrado para essa categoria.</div>`;
        return;
      }
      lista.forEach(t => container.appendChild(makeCard(t)));
    }

    // initial filter from query param
    const tagParam = qs('tag');
    const tagDecoded = tagParam ? decodeURIComponent(tagParam) : 'Todos';
    applyFilter(tagDecoded);
  }

  // modal open/close
  function openModal(id){
    const modal = $('#modal-texto');
    const body = $('#modal-body');
    if(!modal || !body) return;
    const t = window.textos.find(x => String(x.id) === String(id));
    if(!t) return;
    body.innerHTML = `<h3>${t.titulo}</h3><div class="modal-content">${nl2br(t.conteudo)}</div>`;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    const modal = $('#modal-texto');
    if(!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  // hamburger menu in catalogo
  function setupHamburger(){
    const hambBtn = $('#hambBtn');
    const menuPanel = $('#menuPanel');
    if(!hambBtn || !menuPanel) return;
    hambBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      menuPanel.classList.toggle('open');
      menuPanel.setAttribute('aria-hidden', menuPanel.classList.contains('open') ? 'false' : 'true');
    });
    // close on outside click
    window.addEventListener('click', (e)=>{
      if(!menuPanel) return;
      if(menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && !hambBtn.contains(e.target)){
        menuPanel.classList.remove('open');
        menuPanel.setAttribute('aria-hidden','true');
      }
    });
    // close on escape
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && menuPanel.classList.contains('open')){
        menuPanel.classList.remove('open');
        menuPanel.setAttribute('aria-hidden','true');
      }
    });
  }

  // wire modal close handlers
  function setupModalHandlers(){
    const modal = $('#modal-texto');
    if(!modal) return;
    modal.addEventListener('click', (e)=> { if(e.target === modal) closeModal(); });
    const closeBtn = $('#modal-close');
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
  }

  // when clicking home "Ler mais" links (they point to catalogo.html?abrir=ID&tag=Cat)
  // we rely on catalogo's code that reads ?abrir param

  // initialization on DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{
    try{
      if(window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('cantinho') ){
        // home
        renderHome();
      }
      if(window.location.pathname.includes('catalogo.html')){
        renderCatalogo();
        setupHamburger();
        setupModalHandlers();
        // if URL has abrir param -> open modal after render
        const abrir = qs('abrir');
        if(abrir){
          setTimeout(()=> openModal(abrir), 220);
        }
      }
    }catch(err){
      console.error('Erro inicializando script:', err);
    }
  });

})();
