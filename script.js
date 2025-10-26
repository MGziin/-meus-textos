/* script.js — controle home + catálogo + modal + i18n */

/* helpers */
function q(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(str){
  if(str == null) return "";
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ensure textos exists */
if(typeof window.textos === "undefined") window.textos = [];

/* i18n small map for static labels */
const i18n = {
  pt: {
    nav_inicio: "Início",
    nav_sobre: "Sobre",
    nav_textos: "Textos Favoritos",
    nav_tags: "Tags",
    nav_contato: "Contato",
    home_boasvindas: "Bem-vindo ao meu cantinho de textos ✍️",
    sobre_titulo: "Sobre mim",
    sobre_texto: "Sou alguém apaixonado por escrever sobre a vida, emoções e reflexões cotidianas. Este espaço é o meu lugar para transformar sentimentos em palavras e pensamentos em histórias ✨",
    favoritos_titulo: "Textos Favoritos",
    btn_ler_todos: "📖 Ler todos os textos",
    tags_titulo: "Tags",
    contato_titulo: "Contato",
    catalogo_titulo: "Todos os Textos",
    menu_titulo: "Menu",
    menu_cats: "Categorias",
    menu_contato: "Contato",
    cat_sub: "Catálogo completo"
  },
  en: {
    nav_inicio: "Home",
    nav_sobre: "About",
    nav_textos: "My Favorite Texts",
    nav_tags: "Tags",
    nav_contato: "Contact",
    home_boasvindas: "Welcome to my little corner of words ✍️",
    sobre_titulo: "About me",
    sobre_texto: "I love writing about life, emotions and daily reflections. This space is where I turn feelings into words and thoughts into stories ✨",
    favoritos_titulo: "My Favorite Texts",
    btn_ler_todos: "📖 Read all texts",
    tags_titulo: "Tags",
    contato_titulo: "Contact",
    catalogo_titulo: "All Texts",
    menu_titulo: "Menu",
    menu_cats: "Categories",
    menu_contato: "Contact",
    cat_sub: "Full catalog"
  }
};

/* apply language to static elements */
function applyLang(lang){
  document.documentElement.lang = (lang === 'en' ? 'en' : 'pt-BR');
  document.body.dataset.lang = lang;
  Object.keys(i18n[lang]).forEach(key => {
    const els = document.querySelectorAll(`[data-i18n="${key}"]`);
    els.forEach(el => el.textContent = i18n[lang][key]);
  });
}

/* language buttons */
function setupLanguage(){
  const btnPt = q("#lang-pt");
  const btnEn = q("#lang-en");
  const btnPt2 = q("#lang-pt-2");
  const btnEn2 = q("#lang-en-2");

  const set = (lang) => {
    applyLang(lang);
    // visual active state
    qAll(".lang-btn").forEach(b => b.style.opacity = b.textContent.trim().toLowerCase() === lang ? "1" : "0.6");
    // also update any link labels created dynamically
  };

  if(btnPt) btnPt.addEventListener("click", ()=> set('pt'));
  if(btnEn) btnEn.addEventListener("click", ()=> set('en'));
  if(btnPt2) btnPt2.addEventListener("click", ()=> set('pt'));
  if(btnEn2) btnEn2.addEventListener("click", ()=> set('en'));
  // initial language from body or default
  const initial = document.body.dataset.lang || 'pt';
  applyLang(initial);
}

/* resumo */
function resumoTexto(texto, maxChars = 280){
  if(!texto) return "";
  const t = texto.trim().replace(/\r/g, "");
  if(t.length <= maxChars) return t;
  const corte = t.slice(0, maxChars);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return (ultimoEspaco > 40 ? corte.slice(0, ultimoEspaco) : corte) + "...";
}

/* modal (garante existir e comportamento) */
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
  overlay.addEventListener("click", (e)=> { if(e.target === overlay) fecharModal(); });
  document.addEventListener("keydown", (e)=> { if(e.key === "Escape") fecharModal(); });
  q("#modal-fechar").addEventListener("click", fecharModal);
}

/* abrir modal por id (procura por campo id no objeto, senão usa índice) */
function abrirModalPorId(id){
  garantirModal();
  const overlay = q("#modal-texto");
  const tituloEl = q("#modal-titulo");
  const conteudoEl = q("#modal-conteudo");
  if(!overlay || !tituloEl || !conteudoEl) return;

  const idx = Number(id);
  let textoObj = window.textos.find(t => Number(t.id) === idx);
  if(!textoObj) textoObj = window.textos[idx] || window.textos.find(t => t.titulo === id);
  if(!textoObj) {
    console.warn("Texto não encontrado para abrir modal:", id);
    return;
  }

  tituloEl.textContent = textoObj.titulo || "";
  let raw = (textoObj.conteudo || "");
  const hasHTML = /<\/?[a-z][\s\S]*>/i.test(raw);
  if(hasHTML) conteudoEl.innerHTML = raw;
  else conteudoEl.innerHTML = escapeHtml(raw).replace(/\n/g, "<br>");

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

/* monta cards HOME e CATALOGO */
function montarCards(){
  // HOME
  const homeContainer = q("#lista-favoritos");
  if(homeContainer){
    homeContainer.innerHTML = "";
    const favoritos = window.textos.slice(0,2);
    favoritos.forEach(t => {
      const realIdx = window.textos.indexOf(t);
      const card = document.createElement("div");
      card.className = "card-texto";
      card.innerHTML = `
        <h3>${escapeHtml(t.titulo)}</h3>
        <div class="tag-item">${escapeHtml(t.categoria || "")}</div>
        <p>${escapeHtml(resumoTexto(t.resumo || t.conteudo, 240)).replace(/\n/g,"<br>")}</p>
        <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
          <button class="btn-lermais" data-id="${realIdx}">Ler mais</button>
          <a class="btn-todos" href="textos.html?abrir=${encodeURIComponent(realIdx)}">Abrir no catálogo</a>
        </div>
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
        <h3>${escapeHtml(t.titulo)}</h3>
        <div class="tag-item">${escapeHtml(t.categoria || "")}</div>
        <p>${escapeHtml(resumoTexto(t.resumo || t.conteudo, 340)).replace(/\n/g,"<br>")}</p>
        <div style="margin-top:8px"><button class="btn-lermais" data-id="${idx}">Ler mais</button></div>
      `;
      catalogoContainer.appendChild(card);
    });
  }

  // listeners Ler mais
  qAll(".btn-lermais").forEach(btn => {
    btn.removeEventListener("click", onClickLerMais);
    btn.addEventListener("click", onClickLerMais);
  });
}

/* onClick LerMais */
function onClickLerMais(e){
  const id = e.currentTarget.getAttribute("data-id");
  if(!id) return;
  abrirModalPorId(id);
}

/* gerar tags home e catalogo */
function gerarTags(){
  const tagsSet = Array.from(new Set(window.textos.map(t => t.categoria).filter(Boolean)));
  // home tags
  const listaTagsHome = q("#lista-tags");
  if(listaTagsHome){
    listaTagsHome.innerHTML = "";
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
  // catalog tags (buttons)
  const tagsCatalogo = q("#tags-catalogo");
  const menuCats = q("#menu-cats");
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
  if(menuCats){
    menuCats.innerHTML = "";
    const aTodos = document.createElement("a");
    aTodos.href = "textos.html?tag=Todos";
    aTodos.textContent = "Todos";
    menuCats.appendChild(aTodos);
    tagsSet.forEach(tag => {
      const a = document.createElement("a");
      a.href = `textos.html?tag=${encodeURIComponent(tag)}`;
      a.textContent = tag;
      menuCats.appendChild(a);
    });
  }
}

/* filtrar catálogo */
function filtrarCatalogo(tag){
  const container = q("#lista-catalogo");
  if(!container) return;
  container.innerHTML = "";
  const list = (!tag || tag === "Todos") ? window.textos.slice() : window.textos.filter(t => t.categoria === tag);
  if(list.length === 0) { container.innerHTML = `<div class="card-texto">Nenhum texto encontrado para essa categoria.</div>`; return; }
  list.forEach((t) => {
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
  qAll(".btn-lermais").forEach(btn=>{
    btn.removeEventListener("click", onClickLerMais);
    btn.addEventListener("click", onClickLerMais);
  });
}

/* checar query string: ?abrir=ID and ?tag=TagName */
function checarQuery(){
  const params = new URLSearchParams(window.location.search);
  const abrir = params.get("abrir");
  const tag = params.get("tag");
  if(tag){
    const decoded = decodeURIComponent(tag);
    filtrarCatalogo(decoded === "Todos" ? "Todos" : decoded);
  }
  if(abrir !== null){
    setTimeout(()=> abrirModalPorId(abrir), 220);
  }
}

/* menu hamburguer (apenas em textos.html) */
function setupHamburger(){
  const hambBtn = q("#hambBtn");
  const menuPanel = q("#menuPanel");
  if(!hambBtn || !menuPanel) return;
  hambBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    menuPanel.classList.toggle("open");
    menuPanel.setAttribute("aria-hidden", menuPanel.classList.contains("open") ? "false" : "true");
  });
  window.addEventListener("click", (e)=>{
    if(!menuPanel) return;
    if(menuPanel.classList.contains("open") && !menuPanel.contains(e.target) && !hambBtn.contains(e.target)){
      menuPanel.classList.remove("open");
      menuPanel.setAttribute("aria-hidden","true");
    }
  });
  window.addEventListener("keydown", (e)=>{
    if(e.key === 'Escape' && menuPanel.classList.contains("open")){
      menuPanel.classList.remove("open");
      menuPanel.setAttribute("aria-hidden","true");
    }
  });
}

/* image fallback (tenta várias versões se a primeira falhar) */
function setupImageFallback(){
  const img = q("#foto-perfil");
  if(!img) return;
  img.addEventListener("error", function handler(){
    // tenta lista de possibilidades
    const tried = [ 'foto-perfil.jpg', 'foto-perfil.png', 'perfil.jpg', 'perfil.png' ];
    for(let i=0;i<tried.length;i++){
      if(tried[i] !== img.src.split('/').pop()){
        img.src = tried[i];
        return;
      }
    }
    // remove handler se nada funcionar
    img.removeEventListener('error', handler);
  });
}

/* inicialização */
document.addEventListener("DOMContentLoaded", ()=>{
  try{
    setupLanguage();
    garantirModal();
    montarCards();
    gerarTags();
    setupHamburger();
    setupImageFallback();
    checarQuery();

    // favicon link ensure (if missing)
    if(!document.querySelector('link[rel="icon"]')){
      const l = document.createElement('link'); l.rel='icon'; l.href='favicon.png'; document.head.appendChild(l);
    }

    console.log("script.js inicializado — tudo pronto.");
  }catch(err){
    console.error("Erro inicializando script.js:", err);
  }
});
