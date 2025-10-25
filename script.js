// ===================== IMPORTA TEXTOS DO textos.js =====================
const listaFavoritos = document.getElementById("lista-favoritos");
const listaTags = document.getElementById("lista-tags");
const catalogoContainer = document.getElementById("lista-catalogo");
const tagsCatalogo = document.getElementById("tags-catalogo");

// ===================== CRIA TAGS =====================
function gerarTagsUnicas() {
  const tags = ["Todos", ...new Set(textos.map(t => t.categoria))];

  if (listaTags) {
    listaTags.innerHTML = "";
    tags.forEach(tag => {
      const span = document.createElement("span");
      span.className = "tag-item";
      span.textContent = tag;
      span.addEventListener("click", () => {
        window.location.href = `textos.html?tag=${tag}`;
      });
      listaTags.appendChild(span);
    });
  }

  if (tagsCatalogo) {
    tagsCatalogo.innerHTML = "";
    tags.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = tag;
      btn.addEventListener("click", () => filtrarPorTag(tag));
      tagsCatalogo.appendChild(btn);
    });
  }
}

// ===================== RESUMO DO TEXTO =====================
function criarResumo(texto, limite = 180) {
  return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
}

// ===================== LISTAR NO HOME =====================
function listarFavoritos() {
  if (!listaFavoritos) return;
  listaFavoritos.innerHTML = "";

  textos.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "card-texto";
    div.innerHTML = `
      <h3>${t.titulo}</h3>
      <p>${criarResumo(t.conteudo)}</p>
      <button class="btn-lermais" data-id="${i}">Ler mais</button>
    `;
    listaFavoritos.appendChild(div);
  });

  document.querySelectorAll(".btn-lermais").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.getAttribute("data-id");
      window.location.href = `textos.html?abrir=${id}`;
    });
  });
}

// ===================== LISTAR NO CATÁLOGO =====================
function listarCatalogo(filtro = "Todos") {
  if (!catalogoContainer) return;
  catalogoContainer.innerHTML = "";

  textos
    .filter(t => filtro === "Todos" || t.categoria === filtro)
    .forEach((t, i) => {
      const div = document.createElement("div");
      div.className = "card-texto";
      div.innerHTML = `
        <h3>${t.titulo}</h3>
        <p>${criarResumo(t.conteudo, 260)}</p>
        <button class="btn-lermais" data-id="${i}">Ler mais</button>
      `;
      catalogoContainer.appendChild(div);
    });

  document.querySelectorAll(".btn-lermais").forEach(btn => {
    btn.addEventListener("click", e => abrirModal(e.target.getAttribute("data-id")));
  });
}

// ===================== FILTRO POR TAG =====================
function filtrarPorTag(tag) {
  listarCatalogo(tag);
}

// ===================== MODAL =====================
function abrirModal(id) {
  const modal = document.getElementById("modal");
  const modalTexto = document.getElementById("modal-texto");
  const texto = textos[id];

  modalTexto.innerHTML = `<h2>${texto.titulo}</h2><p>${texto.conteudo.replace(/\n/g, "<br>")}</p>`;
  modal.style.display = "flex";

  const fechar = document.getElementById("fechar-modal");
  fechar.onclick = () => modal.style.display = "none";

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}

// ===================== ABRE MODAL AUTOMATICAMENTE SE VEIO DO HOME =====================
function checarURL() {
  const params = new URLSearchParams(window.location.search);
  const abrirID = params.get("abrir");
  const tagFiltrada = params.get("tag");

  if (tagFiltrada) listarCatalogo(tagFiltrada);
  if (abrirID) abrirModal(abrirID);
}

// ===================== INICIALIZAÇÃO =====================
gerarTagsUnicas();
listarFavoritos();
listarCatalogo();
checarURL();
