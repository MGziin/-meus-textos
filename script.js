// script.js — controla Home e Textos (único arquivo)
// depende de textos.js carregado antes

document.addEventListener('DOMContentLoaded', () => {
  // utils
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const hasEl = sel => !!$(sel);
  const decode = v => v ? decodeURIComponent(v) : v;
  function qsParam(k){ const u=new URL(window.location.href); return u.searchParams.get(k); }

  const dados = window.textos || [];
  const categorias = Array.from(new Set(dados.map(t => t.categoria)));

  /* ---------------- HOME ---------------- */
  if(hasEl('#catalogo-home') && hasEl('#tags-home')){
    const catalogoHomeEl = $('#catalogo-home');
    const tagsHomeEl = $('#tags-home');

    // Favoritos: mostrar os dois primeiros textos do array,
    // mantendo a ordem do textos.js (o segundo será "A Semente" conforme combinado).
    const favoritos = dados.slice(0, 2);

    favoritos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'texto-card';
      const excerptLines = t.conteudo.split('\n').filter(Boolean).slice(0,6);
      const excerpt = excerptLines.join('\n');
      card.innerHTML = `
        <span class="tag">${t.categoria}</span>
        <h3>${t.titulo}</h3>
        <p class="texto-excerpt">${escapeHtml(excerpt)}</p>
      `;
      const btn = document.createElement('a');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      // envia para textos.html filtrando pela categoria e pedindo para abrir o título
      btn.href = `textos.html?tag=${encodeURIComponent(t.categoria)}&open=${encodeURIComponent(t.titulo)}`;
      card.appendChild(btn);
      catalogoHomeEl.appendChild(card);
    });

    // Tags (pílulas) — só texto, sem emoji (opção b)
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      tagsHomeEl.appendChild(a);
    });
  }

  /* ---------------- TEXTOS (CATÁLOGO) ---------------- */
  if(hasEl('#catalogo') && hasEl('#filtros')){
    const catalogoEl = $('#catalogo');
    const filtrosEl = $('#filtros');
    const menuPanel = $('#menuPanel');
    const hambBtn = $('#hambBtn');
    const menuCats = $('#menu-cats');

    // Render filtros no topo
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      filtrosEl.appendChild(a);
    });

    // Render menu interno categorias (no painel lateral)
    if(menuCats){
      categorias.forEach(cat => {
        const a = document.createElement('a');
        a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
        a.textContent = cat;
        menuCats.appendChild(a);
      });
    }

    // Render catálogo (filtra por ?tag= se existir)
    function renderCatalogo(filterTag){
      catalogoEl.innerHTML = '';
      const list = filterTag ? dados.filter(t => t.categoria === filterTag) : dados.slice();
      if(list.length === 0){
        catalogoEl.innerHTML = '<div style="grid-column:1/-1" class="center">Nenhum texto encontrado para essa categoria.</div>';
        return;
      }
      list.forEach(t => {
        const art = document.createElement('article');
        art.className = 'card';
        art.innerHTML = `
          <h3>${t.titulo}</h3>
          <div style="margin-bottom:8px"><span class="tag">${t.categoria}</span></div>
          <p>${escapeHtml(t.conteudo)}</p>
        `;
        catalogoEl.appendChild(art);
      });

      // Se veio &open=Titulo, rola até o título
      const openTitulo = qsParam('open') ? decode(openParamSafe(qsParam('open'))) : null;
      if(openTitulo){
        // pequena espera para garantir renderização na página
        setTimeout(() => {
          const nodes = Array.from(catalogoEl.querySelectorAll('h3'));
          const node = nodes.find(h => h.textContent.trim() === openTitulo.trim());
          if(node){
            node.scrollIntoView({behavior:'smooth', block:'center'});
            // destacar brevemente
            node.style.transition = 'box-shadow .35s ease';
            node.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            setTimeout(()=> node.style.boxShadow = '', 900);
          }
        }, 150);
      }
    }

    // hamburger open/close (painel lateral)
    if(hambBtn && menuPanel){
      hambBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPanel.classList.toggle('open');
        menuPanel.setAttribute('aria-hidden', menuPanel.classList.contains('open') ? 'false' : 'true');
      });

      // fechar ao clicar fora
      window.addEventListener('click', (e) => {
        if(!menuPanel) return;
        if(menuPanel.classList.contains('open') && !menuPanel.contains(e.target) && !hambBtn.contains(e.target)){
          menuPanel.classList.remove('open');
          menuPanel.setAttribute('aria-hidden','true');
        }
      });

      // ESC fecha
      window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && menuPanel.classList.contains('open')){
          menuPanel.classList.remove('open');
          menuPanel.setAttribute('aria-hidden','true');
        }
      });
    }

    // inicial: pega tag da URL
    const tagParam = qsParam('tag');
    const tagDecoded = tagParam ? decodeURIComponent(tagParam) : null;
    renderCatalogo(tagDecoded || null);
  }

  /* ---------------- small utilities ---------------- */
  function escapeHtml(text){
    if(!text && text !== '') return '';
    // preserve line breaks: convert to escaped text and then replace \n with <br>
    const div = document.createElement('div');
    // naive escape
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  function openParamSafe(v){
    // sometimes %20 etc; decode safely
    try{ return decodeURIComponent(v); }catch(e){ return v; }
  }

});
