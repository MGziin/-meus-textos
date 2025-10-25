// script.js (substituir por completo)

// --- helper para segurança
function q(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }

// --- garante que textos estão disponíveis
if(typeof window.textos === "undefined"){
  console.error("ERRO: window.textos não encontrado. Verifique se textos.js foi carregado antes de script.js");
}

// --- Função para criar resumo simples (mantém quebras)
function resumoTexto(texto, max=200){
  const clean = (texto || "").trim();
  if(clean.length <= max) return clean;
  return clean.slice(0, max).trim() + "...";
}

// --- abrir modal (usa o modal com id modal-texto e modal-conteudo)
function abrirModalPorId(id){
  const modal = q("#modal-texto");
  const conteudoEl = q("#modal-conteudo");
  if(!modal || !conteudoEl){
    console.error("Modal ou conteúdo do modal não encontrados (ids: #modal-texto, #modal-conteudo).");
    return;
  }

  const idx = Number(id);
  const textoObj = (window.textos && window.textos[idx]) ? window.textos[idx] : null;
  if(!textoObj){
    console.error("Texto não encontrado para id:", id);
    return;
  }

  // Se o conteúdo no textos.js estiver em HTML ou em texto, adaptamos:
  // aqui assumimos que conteudo pode ter quebras \n - transformamos em <br>
  let html = "";
  if(typeof textoObj.conteudo === "string"){
    html = textoObj.conteudo.replace(/\n/g, "<br>");
  } else {
    html = String(textoObj.conteudo);
  }

  conteudoEl.innerHTML = `<h2>${textoObj.titulo}</h2><div class="modal-body">${html}</div>`;
  modal.style.display = "flex"; // mostra modal
  document.body.style.overflow = "hidden"; // trava scroll atrás
  // acopla listener do botão fechar se houver
  const btnFechar = q("#fechar-modal");
  if(btnFechar) btnFechar.onclick = fecharModal;
}

// --- fechar modal
function fecharModal(){
  const modal = q("#modal-texto");
  if(!modal) return;
  modal.style.display = "none";
  document.body.style.overflow = ""; // libera scroll
}

// --- fecha ao clicar fora (overlay)
document.addEventListener("click", (ev) => {
  const modal = q("#modal-texto");
  if(!modal) return;
  if(ev.target === modal) fecharModal();
});

// --- monta os cards na home (#lista-favoritos) e no catálogo (#lista-catalogo)
function montarCards(){
  // segurança
  if(typeof window.textos === "undefined") return;

  // HOME
  const homeContainer = q("#lista-favoritos");
  if(homeContainer){
    homeContainer.innerHTML = "";
    // mostra só os dois primeiros (favoritos) ou todos se preferir
    const mostra = window.textos.slice(0, 2);
    mostra.forEach((t, i) => {
      const realIndex = window.textos.indexOf(t); // índice original
      const card = document.createElement("div");
      card.className = "card-texto";
      card.innerHTML = `
        <h3>${t.titulo}</h3>
        <p>${resumoTexto(typeof t.resumo !== "undefined" ? t.resumo : t.conteudo, 240)}</p>
        <button class="btn-lermais" data-id="${realIndex}">Ler mais</button>
      `;
      homeContainer.appendChild(card);
    });
  }

  // CATALOGO
  const catalogoContainer = q("#lista-catalogo");
  if(catalogoContainer){
    catalogoContainer.innerHTML = "";
    window.textos.forEach((t, idx) => {
      const card = document.createElement("div");
      card.className = "card-texto";
      card.innerHTML = `
        <h3>${t.titulo}</h3>
        <div class="tag-item">${t.categoria || "Sem categoria"}</div>
        <p>${resumoTexto(typeof t.resumo !== "undefined" ? t.resumo : t.conteudo, 300)}</p>
        <button class="btn-lermais" data-id="${idx}">Ler mais</button>
      `;
      catalogoContainer.appendChild(card);
    });
  }

  // Anexa eventos aos botões (global)
  qAll(".btn-lermais").forEach(btn => {
    btn.removeEventListener("click", onClickLerMais); // remove se já tiver
    btn.addEventListener("click", onClickLerMais);
  });
}

// --- manipulador do clique Ler Mais
function onClickLerMais(e){
  const id = e.currentTarget.getAttribute("data-id");
  // se estivermos na home, queremos ir pro catálogo abrindo o modal
  const thisPath = window.location.pathname;
  const isCatalog = thisPath.endsWith("textos.html") || thisPath.endsWith("catalogo.html");
  if(isCatalog){
    abrirModalPorId(id);
    // scroll até o modal (ele já apareceu)
  } else {
    // redireciona para o catálogo e pede para abrir o modal (param ?abrir=ID)
    // usamos textos.html como rota do catálogo (pode ser catalogo.html dependendo do seu arquivo)
    const target = (location.pathname.includes("textos.html") || location.pathname.includes("catalogo.html"))
      ? location.pathname
      : "textos.html";
    window.location.href = `${target}?abrir=${encodeURIComponent(id)}`;
  }
}

// --- gera as tags dinâmicas no home (#lista-tags) e no catalogo (#tags-catalogo)
function gerarTags(){
  if(typeof window.textos === "undefined") return;
  const tagsSet = Array.from(new Set(window.textos.map(t => t.categoria)));
  const listaTags = q("#lista-tags");
  if(listaTags){
    listaTags.innerHTML = "";
    tagsSet.forEach(tag => {
      const a = document.createElement("a");
      a.className = "tag-item";
      a.href = `textos.html?tag=${encodeURIComponent(tag)}`;
      a.textContent = tag;
      listaTags.appendChild(a);
    });
  }

  const tagsCatalogo = q("#tags-catalogo");
  if(tagsCatalogo){
    tagsCatalogo.innerHTML = "";
    const btnTodos = document.createElement("button");
    btnTodos.className = "tag-btn";
    btnTodos.textContent = "Todos";
    btnTodos.addEventListener("click", () => filtrarCatalogo("Todos"));
    tagsCatalogo.appendChild(btnTodos);

    tagsSet.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = tag;
      btn.addEventListener("click", () => filtrarCatalogo(tag));
      tagsCatalogo.appendChild(btn);
    });
  }
}

// --- filtra catálogo (apenas re-renderiza com filtro)
function filtrarCatalogo(tag){
  const container = q("#lista-catalogo");
  if(!container) return;
  container.innerHTML = "";
  const lista = (tag === "Todos" || !tag) ? window.textos : window.textos.filter(t => t.categoria === tag);
  lista.forEach((t, idx) => {
    const realIdx = window.textos.indexOf(t);
    const card = document.createElement("div");
    card.className = "card-texto";
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <div class="tag-item">${t.categoria || ""}</div>
      <p>${resumoTexto(typeof t.resumo !== "undefined" ? t.resumo : t.conteudo, 300)}</p>
      <button class="btn-lermais" data-id="${realIdx}">Ler mais</button>
    `;
    container.appendChild(card);
  });
  // reaplica listeners
  qAll(".btn-lermais").forEach(btn => {
    btn.removeEventListener("click", onClickLerMais);
    btn.addEventListener("click", onClickLerMais);
  });
}

// --- se a página chegou com ?abrir=ID então abrimos o modal (útil vindo da home)
function checarAbrirNaURL(){
  const params = new URLSearchParams(window.location.search);
  const abrir = params.get("abrir");
  const tag = params.get("tag");
  if(tag){
    // aplica filtro no catálogo (se houver)
    filtrarCatalogo(decodeURIComponent(tag));
  }
  if(abrir !== null){
    // aguarda um pouco para garantir que DOM foi montado
    setTimeout(() => abrirModalPorId(abrir), 180);
  }
}

// --- inicialização
document.addEventListener("DOMContentLoaded", () => {
  try{
    montarCards();
    gerarTags();
    checarAbrirNaURL();
    console.log("script.js inicializado — cards, tags e modal prontos.");
  }catch(err){
    console.error("Erro ao inicializar script.js:", err);
  }
});
