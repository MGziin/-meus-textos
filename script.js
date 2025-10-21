// script.js — único arquivo que gerencia Home e Textos
// depende de textos.js (carregado antes)

document.addEventListener('DOMContentLoaded', () => {
  // helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function qsParam(k){ const u=new URL(window.location.href); return u.searchParams.get(k); }

  // categorias únicas a partir dos dados
  const categorias = Array.from(new Set((window.textos || []).map(t => t.categoria)));

  /* ================== FUNCIONALIDADES DO HOME ================== */
  const catalogoHomeEl = document.getElementById('catalogo-home');
  const tagsHomeEl = document.getElementById('tags-home');

  if(catalogoHomeEl && tagsHomeEl){
    // Render favoritos: mostra os dois primeiros textos (se existirem)
    const favoritos = (window.textos || []).slice(0, 2);
    favoritos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'texto-card';
      const excerpt = t.conteudo.split('\n').slice(0,6).join('\n'); // primeiras linhas
      card.innerHTML = `
        <span class="tag">${t.categoria}</span>
        <h3>${t.titulo}</h3>
        <p class="texto-excerpt">${excerpt.replace(/\n{2,}/g,'\n')}</p>
      `;
      const btn = document.createElement('a');
      btn.className = 'btn-ler';
      btn.textContent = 'Ler mais';
      btn.href = `textos.html?tag=${encodeURIComponent(t.categoria)}&open=${encodeURIComponent(t.titulo)}`;
      card.appendChild(btn);
      catalogoHomeEl.appendChild(card);
    });

    // Render tags dinâmicas no Home (pílulas)
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      tagsHomeEl.appendChild(a);
    });
  }

  /* ================== FUNCIONALIDADES DO SITE DE TEXTOS ================== */
  const catalogoEl = document.getElementById('catalogo');
  const filtrosEl = document.getElementById('filtros');
  const menuPanel = document.getElementById('menuPanel');
  const hambBtn = document.getElementById('hambBtn');
  const menuCats = document.getElementById('menu-cats');

  if(catalogoEl && filtrosEl){
    // RENDERIZA FILTROS (tags) no topo dos textos
    categorias.forEach(cat => {
      const a = document.createElement('a');
      a.className = 'tag';
      a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
      a.textContent = cat;
      filtrosEl.appendChild(a);
    });

    // RENDERIZA CATALOGO (filtra por ?tag= se houver)
    function renderCatalogo(filterTag){
      catalogoEl.innerHTML = '';
      const list = filterTag ? window.textos.filter(t => t.categoria === filterTag) : window.textos.slice();
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
          <p>${t.conteudo}</p>
        `;
        catalogoEl.appendChild(art);
      });

      // se veio &open=Titulo, rola para ele
      const openTitulo = qsParam('open') ? decodeURIComponent(qsParam('open')) : null;
      if(openTitulo){
        // esperar um tick para garantir render
        setTimeout(() => {
          const nodes = Array.from(catalogoEl.querySelectorAll('h3'));
          const node = nodes.find(h => h.textContent.trim() === openTitulo.trim());
          if(node){
            node.scrollIntoView({behavior:'smooth', block:'center'});
          }
        }, 150);
      }
    }

    // Monta menu interno de categorias (menu lateral)
    if(menuCats){
      categorias.forEach(cat => {
        const a = document.createElement('a');
        a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
        a.textContent = cat;
        menuCats.appendChild(a);
      });
    }

    // menu hambúrguer open/close (lateral)
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

      // fechar com ESC
      window.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && menuPanel.classList.contains('open')){
          menuPanel.classList.remove('open');
          menuPanel.setAttribute('aria-hidden','true');
        }
      });
    }

    // inicial: pega ?tag
    const tagParam = qsParam('tag');
    renderCatalogo(tagParam || null);
  }

});
