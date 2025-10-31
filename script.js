// script.js — controlador único (Home + Catálogo)
// depende de window.textos (textos.js) — deve ser carregado antes deste script

(() => {
  // helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const qs = k => new URLSearchParams(window.location.search).get(k);

  // modal
  const modal = $("#modal-texto");
  const modalTitulo = modal ? modal.querySelector("#modal-titulo") : null;
  const modalConteudo = modal ? modal.querySelector("#modal-conteudo") : null;
  const fecharModalBtn = modal ? modal.querySelector("#fechar-modal") : null;

  function abrirModal(index){
    const i = Number(index);
    const obj = window.textos && window.textos[i] ? window.textos[i] : null;
    if(!obj || !modal) return;
    modalTitulo.textContent = obj.titulo;
    // manter as quebras originais: converte \n em <br>
    const raw = (obj.conteudo || "").trim();
    modalConteudo.innerHTML = raw.replace(/\n{2,}/g, "\n\n").replace(/\n/g, "<br>");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }
  function fecharModal(){
    if(!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }
  if(fecharModalBtn) fecharModalBtn.addEventListener("click", fecharModal);
  document.addEventListener("click", e => {
    if(!modal) return;
    if(e.target === modal) fecharModal();
  });

  // hamburger (home + catalog)
  function initHamburg(){
    const hambHome = $("#hamb-home");
    const hambCatalog = $("#hamb-catalog");
    // criar painel simples (menu flutuante) - reaproveita .cab-center links
    function toggleMenu(panelButton){
      // painel é cópia das cab-center
      const existing = $("#float-menu");
      if(existing){
        existing.remove();
        return;
      }
      const menu = document.createElement("div");
      menu.id = "float-menu";
      menu.style.position = "fixed";
      menu.style.top = "76px"; menu.style.right = "14px";
      menu.style.background = "rgba(255,250,236,0.98)";
      menu.style.border = "1px solid rgba(200,170,110,0.14)";
      menu.style.borderRadius = "10px";
      menu.style.padding = "10px";
      menu.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)";
      menu.style.zIndex = 1400;
      // clone center links or build links
      const center = document.querySelector(".cab-center");
      if(center){
        const clone = center.cloneNode(true);
        clone.style.display = "flex";
        clone.style.flexDirection = "column";
        clone.style.gap = "8px";
        clone.querySelectorAll("a").forEach(a => {
          a.style.padding = "6px 8px";
          a.addEventListener("click", () => menu.remove());
        });
        menu.appendChild(clone);
      } else {
        // fallback
        const a = document.createElement("a");
        a.href = "index.html";
        a.textContent = "Início";
        menu.appendChild(a);
      }
      document.body.appendChild(menu);
      // close on outside click
      setTimeout(()=>{
        const onDoc = (ev) => {
          if(!menu.contains(ev.target) && ev.target !== panelButton){
            menu.remove();
            document.removeEventListener("click", onDoc);
          }
        };
        document.addEventListener("click", onDoc);
      }, 10);
    }

    if(hambHome) hambHome.addEventListener("click", (e) => toggleMenu(hambHome));
    if(hambCatalog) hambCatalog.addEventListener("click", (e) => toggleMenu(hambCatalog));
  }

  // montar / render (home)
  function renderHome(){
    if(!window.textos) return;
    const favContainer = $("#lista-favoritos");
    const tagsHome = $("#lista-tags");
    if(favContainer){
      favContainer.innerHTML = "";
      // favoritos: garantir que A Semente e Muros Falsos estejam no início (marcados como favorito true)
      const favoritos = window.textos.filter(t => t.favorito).concat(window.textos.filter(t => !t.favorito));
      // pegar só os 2 primeiros favoritos (você pediu que A Semente e Muros Falsos sejam favoritos)
      const top = favoritos.filter(t=>t.favorito).slice(0, 2);
      top.forEach(t => {
        const idx = window.textos.indexOf(t);
        const el = document.createElement("div");
        el.className = "card favorite";
        el.innerHTML = `
          <h3>${t.titulo} <span class="badge-fav">⭐ Favorito</span></h3>
          <p class="summary">${escapeHtml(t.resumo || "")}</p>
          <button class="btn-ler" data-id="${idx}">Ler mais</button>
        `;
        favContainer.appendChild(el);
      });
    }

    // tags home (mostrar apenas tags que existem)
    if(tagsHome){
      tagsHome.innerHTML = "";
      const cats = Array.from(new Set(window.textos.map(t => t.categoria)));
      // incluir Todos
      const allBtn = document.createElement("a");
      allBtn.className = "tag";
      allBtn.href = `textos.html?tag=Todos`;
      allBtn.textContent = "Todos";
      tagsHome.appendChild(allBtn);

      cats.forEach(cat=>{
        const a = document.createElement("a");
        a.className = "tag";
        a.href = `textos.html?tag=${encodeURIComponent(cat)}`;
        a.textContent = cat;
        tagsHome.appendChild(a);
      });
    }

    // Delegação de cliques "Ler mais" na home
    document.addEventListener("click", function(ev){
      const btn = ev.target.closest && ev.target.closest(".btn-ler");
      if(!btn) return;
      const id = btn.getAttribute("data-id");
      // redireciona para catálogo e abre modal lá
      window.location.href = `textos.html?abrir=${encodeURIComponent(id)}`;
    });
  }

  // montar catálogo
  function renderCatalog(){
    if(!window.textos) return;
    const catalogEl = $("#catalogo-list");
    const filtros = $("#filtros");
    const tagParam = qs("tag");
    const abrirParam = qs("abrir");

    // criar filtros topo
    if(filtros){
      filtros.innerHTML = "";
      const cats = Array.from(new Set(window.textos.map(t => t.categoria)));
      const todosBtn = document.createElement("button");
      todosBtn.className = "tag";
      todosBtn.textContent = "Todos";
      todosBtn.addEventListener("click", ()=> renderItems(null));
      filtros.appendChild(todosBtn);

      cats.forEach(c=>{
        const b = document.createElement("button");
        b.className = "tag";
        b.textContent = c;
        b.addEventListener("click", ()=> renderItems(c));
        filtros.appendChild(b);
      });
    }

    function renderItems(filter){
      if(!catalogEl) return;
      catalogEl.innerHTML = "";
      const list = (!filter || filter === "Todos") ? window.textos.slice() : window.textos.filter(t => t.categoria === filter);
      if(list.length === 0){
        catalogEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px">Nenhum texto encontrado para essa categoria.</div>`;
        return;
      }
      list.forEach(t=>{
        const idx = window.textos.indexOf(t);
        const c = document.createElement("div");
        c.className = "card-text";
        c.innerHTML = `
          <h3>${t.titulo}</h3>
          <div class="tag-inline">${t.categoria}</div>
          <p class="summary">${escapeHtml(t.resumo || "")}</p>
          <button class="btn-ler" data-id="${idx}">Ler mais</button>
        `;
        if(t.favorito) c.classList.add("favorite");
        catalogEl.appendChild(c);
      });
      // attach listeners for new buttons
      const btns = catalogEl.querySelectorAll(".btn-ler");
      btns.forEach(b => b.addEventListener("click", (ev) => {
        const id = b.getAttribute("data-id");
        abrirModal(id);
      }));
    }

    // inicial filtro por query param
    if(tagParam){
      renderItems(tagParam === "Todos" ? null : tagParam);
    } else {
      renderItems(null);
    }

    // se veio abrir por param
    if(abrirParam !== null){
      setTimeout(()=> abrirModal(abrirParam), 180);
    }
  }

  // escape text for innerHTML in small pieces
  function escapeHtml(text){
    if(!text) return "";
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  }

  // init on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    initHamburg();
    if(typeof window.textos === "undefined"){
      console.error("window.textos não encontrado — verifique textos.js está sendo carregado antes de script.js");
      return;
    }
    // detecta pagina
    if(document.getElementById("lista-favoritos")) renderHome();
    if(document.getElementById("catalogo-list")) renderCatalog();

    // fechar modal com tecla Esc
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape") fecharModal();
    });
  });

})();
