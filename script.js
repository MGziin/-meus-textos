/* script.js — controla home + catálogo + modal
   Mantive nomes e funções já existentes; adicionei criação do modal caso não exista. */

/* helpers */
function q(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(str){
  if(str == null) return "";
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* segurança - textos.js deve ter definido window.textos */
if(typeof window.textos === "undefined") {
  console.error("ERRO: window.textos não encontrado. Verifique textos.js");
  window.textos = []; // evita quebrar
}

/* resumo com preservação de quebras (truncando sem cortar palavras) */
function resumoTexto(texto, maxChars = 280){
  if(!texto) return "";
  // normaliza quebras e corta
  const t = texto.trim().replace(/\r/g, "");
  if(t.length <= maxChars) return t;
  // tenta cortar por palavra
  const corte = t.slice(0, maxChars);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return (ultimoEspaco > 40 ? corte.slice(0, ultimoEspaco) : corte) + "...";
}

/* cria modal no DOM se não existir (assim funciona tanto no index quanto no textos) */
function garantirModal(){
  if(q("#modal-texto")) return;
  const overlay = document.createElement("div");
  overlay.id = "modal-texto";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-caixa" role="dialog" aria-modal="true">
      <h2 id="modal-titulo"></h2>
      <div id="modal-conteudo" class="modal-body"></div>
      <button id="modal-fechar" class="btn-fechar">Fechar</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // eventos
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && overlay.style.display === "flex") fecharModal();
  });
  q("#modal-fechar").addEventListener("click", fecharModal);
}

/* abrir modal por índice (id pode ser index ou id numérico) */
function abrirModalPorId(id){
  garantirModal();
  const overlay = q("#modal-texto");
  const tituloEl = q("#modal-titulo");
  const conteudoEl = q("#modal-conteudo");
  if(!overlay || !tituloEl || !conteudoEl) return;

  // aceita id numérico ou string com id/index
  const idx = Number(id);
  // preferir procurar por id (campo id no objeto) — senão usa posição no array
  let textoObj = window.textos.find(t => Number(t.id) === idx);
  if(!textoObj){
    // tenta usar índice direto (pos 0/1...)
    textoObj = window.textos[idx] || window.textos.find(t => t.titulo === id);
  }
  if(!textoObj){
    console.warn("Texto não encontrado para abrir modal:", id);
    return;
  }

  // preenche modal (converte quebras em <br>)
  tituloEl.textContent = textoObj.titulo || "";
  // conteúdo pode conter quebras; escapamos e substituímos quebras por <br>
  let raw = (textoObj.conteudo || "");
  // se o conteúdo já tiver <p> ou tags, deixamos (simples checagem)
  const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(raw);
  if(hasHTMLTags){
    conteudoEl.innerHTML = raw;
  } else {
    conteudoEl.innerHTML = escapeHtml(raw).replace(/\n{2,}/g, "\n\n").replace(/\n/g, "<br>");
  }

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/* fechar modal */
function fecharModal(){
  const overlay = q("#modal-texto");
  if(!overlay) return;
  overlay.style.display = "none";
  document.body.style.overflow = "";
}

/* monta cards na home (#lista-favoritos) e no catálogo (#lista-catalogo) */
function montarCards(){
  // HOME
  const homeContainer = q("#lista-favoritos");
  if(homeContainer){
    homeContainer.innerHTML = "";
    const favoritos = window.textos.slice(0, 2); // primeiros dois
    favoritos.forEach((t) => {
      // busca índice real (posição no array)
      const realIdx = window.textos.indexOf(t);
      const card = document.createElement("div");
      card.className = "card-texto";
      card.innerHTML = `
        <h3>${escapeHtml(t.titulo)}</h3>
        <div class="tag-item">${escapeHtml(t.categoria || "")}</div>
        <p>${escapeHtml(resumoTexto(t.resumo || t.conteudo, 240)).replace(/\n/g,"<br>")}</p>
        <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
          <button class="btn-lermais" data-id="${realIdx}">Ler mais</button>
          <a class="btn-todos" href="textos.html?abrir=${encodeURIComponent(realIdx)}" style="text-decoration:none">Abrir no catálogo</a>
        </div>
      `;
      homeContainer.appendChild(card);
    });
  }

  // CATALOGO
  const catalogoContainer = q("#lista-catalogo");
  if(catalogoContainer){
    catalogoContainer.innerHTML = "";
    // grid layout se existir class catalogo
    window.textos.forEach((t, idx) => {
      const card = document.createElement("div");
      card.className = "card-texto";
      card.innerHTML = `
        <h3>${escapeHtml(t.titulo)}</h3>
        <div class="tag-item">${escapeHtml(t.categoria || "")}</div>
        <p>${escapeHtml(resumoTexto(t.resumo || t.conteudo, 340)).replace(/\n/g,"<br>")}</p>
        <div style="margin-top:8px"><button class="btn-lermais" data-id="${idx}">Ler mais</button></div>
      `;
      catalogoContainer.appendChild(card);
    });
  }

  // adiciona listeners aos botões Ler mais (delegação simples)
  qAll(".btn-lermais").forEach(btn => {
    btn.removeEventListener("click", onClickLerMais);
    btn.addEventListener("click", onClickLerMais);
  });
}

/* clique Ler Mais: se estiver no catálogo -> abre modal; se estiver na home -> abre modal no próprio home (padrão UX escolhido) */
function onClickLerMais(e){
  const id = e.currentTarget.getAttribute("data-id");
  if(!id) return;
  // detecta se página atual é textos.html
  const isCatalog = window.location.pathname.includes("textos.html") || window.location.pathname.includes("catalogo.html");
  if(isCatalog){
    abrirModalPorId(id);
  } else {
    // se estiver na home, abrir modal inline (não redireciona)
    abrirModalPorId(id);
  }
}

/* gera tags dinâmicas tanto na home (#lista-tags) quanto no catálogo (#tags-catalogo) */
function gerarTags(){
  const tagsSet = Array.from(new Set(window.textos.map(t => t.categoria).filter(Boolean)));
  // HOME
  const listaTagsHome = q("#lista-tags");
  if(listaTagsHome){
    listaTagsHome.innerHTML = "";
    // adiciona "Todos" link para o catálogo
    const aTodos = document.createElement("a");
    aTodos.className = "tag-item";
    aTodos.href = "textos.html?tag=Todos";
    aTodos.textContent = "Todos";
    listaTagsHome.appendChild(aTodos);

    tagsSet.forEach(tag => {
      const a = document.createElement("a");
      a.className = "tag-item";
      a.href = `textos.html?tag=${encodeURIComponent(tag)}`;
      a.textContent = tag;
      listaTagsHome.appendChild(a);
    });
  }

  // CATALOGO (botões)
  const tagsCatalogo = q("#tags-catalogo");
  if(tagsCatalogo){
    tagsCatalogo.innerHTML = "";
    const btnTodos = document.createElement("button");
    btnTodos.className = "tag-btn";
    btnTodos.textContent = "Todos";
    btnTodos.dataset.tag = "Todos";
    btnTodos.addEventListener("click", ()=> filtrarCatalogo("Todos"));
    tagsCatalogo.appendChild(btnTodos);

    tagsSet.forEach(tag => {
      const b = document.createElement("button");
      b.className = "tag-btn";
      b.textContent = tag;
      b.dataset.tag = tag;
      b.addEventListener("click", ()=> filtrarCatalogo(tag));
      tagsCatalogo.appendChild(b);
    });
  }
}

/* filtrar catálogo (re-render) */
function filtrarCatalogo(tag){
  const container = q("#lista-catalogo");
  if(!container) return;
  container.innerHTML = "";
  const list = (!tag || tag === "Todos") ? window.textos.slice() : window.textos.filter(t => t.categoria === tag);
  if(list.length === 0){
    container.innerHTML = `<div class="card-texto">Nenhum texto encontrado para essa categoria.</div>`;
    return;
  }
  list.forEach((t)=>{
    const idx = window.textos.indexOf(t);
    const card = document.createElement("div");
    card.className = "card-texto";
    card.innerHTML = `
      <h3>${escapeHtml(t.titulo)}</h3>
      <div class="tag-item">${escapeHtml(t.categoria || "")}</div>
      <p>${escapeHtml(resumoTexto(t.resumo || t.conteudo, 340)).replace(/\n/g,"<br>")}</p>
      <div style="margin-top:8px"><button class="btn-lermais" data-id="${idx}">Ler mais</button></div>
    `;
    container.appendChild(card);
  });
  // reaplica listeners
  qAll(".btn-lermais").forEach(btn=>{
    btn.removeEventListener("click", onClickLerMais);
    btn.addEventListener("click", onClickLerMais);
  });
}

/* checa URL params: ?abrir=ID ou ?tag=TagName */
function checarQuery(){
  const params = new URLSearchParams(window.location.search);
  const abrir = params.get("abrir");
  const tag = params.get("tag");
  if(tag){
    // se tag informada e estamos na página de catálogo, aplica filtro
    const decoded = decodeURIComponent(tag);
    filtrarCatalogo(decoded === "Todos" ? "Todos" : decoded);
    // marca visual (se quiser) - opcional
  }
  if(abrir !== null){
    // abrir modal (pequeno atraso para garantir DOM)
    setTimeout(()=> abrirModalPorId(abrir), 200);
  }
}

/* Inicializa tudo quando DOM estiver pronto */
document.addEventListener("DOMContentLoaded", ()=>{
  try{
    garantirModal();
    montarCards();
    gerarTags();
    checarQuery();
    // console
    console.log("script.js inicializado — cards, tags e modal prontos.");
  }catch(err){
    console.error("Erro inicializando script.js:", err);
  }
});
