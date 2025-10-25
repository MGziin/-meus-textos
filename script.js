// ======================
// 1) Carregar Textos na HOME
// ======================
function carregarFavoritosHome() {
  const container = document.getElementById("lista-favoritos");
  if (!container) return;

  container.innerHTML = "";

  window.textos.forEach((texto, index) => {
    const preview = texto.conteudo.substring(0, 160) + "...";

    const card = document.createElement("div");
    card.classList.add("card-previa");

    card.innerHTML = `
      <h3>${texto.titulo}</h3>
      <p>${preview}</p>
      <button class="btn-ler-mais" data-id="${index}">Ler mais</button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".btn-ler-mais").forEach(btn => {
    btn.addEventListener("click", event => {
      const id = event.target.getAttribute("data-id");
      window.location.href = `catalogo.html?abrir=${id}`;
    });
  });
}

// ======================
// 2) Carregar Textos NO CATÁLOGO
// ======================
function carregarCatalogo() {
  const container = document.getElementById("lista-catalogo");
  if (!container) return;

  container.innerHTML = "";

  window.textos.forEach((texto, index) => {
    const card = document.createElement("div");
    card.classList.add("card-catalogo");

    card.innerHTML = `
      <h3>${texto.titulo}</h3>
      <p class="tag">${texto.tag}</p>
      <button class="btn-abrir-modal" data-id="${index}">Ler texto</button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".btn-abrir-modal").forEach(btn => {
    btn.addEventListener("click", event => {
      const id = event.target.getAttribute("data-id");
      abrirModal(id);
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const abrirID = urlParams.get("abrir");
  if (abrirID !== null) {
    abrirModal(abrirID);
  }
}

// ======================
// 3) MODAL
// ======================
function abrirModal(id) {
  const modal = document.getElementById("modal-texto");
  const titulo = document.getElementById("modal-titulo");
  const conteudo = document.getElementById("modal-conteudo");

  titulo.textContent = window.textos[id].titulo;
  conteudo.textContent = window.textos[id].conteudo;
  modal.classList.add("ativo");
}

function fecharModal() {
  const modal = document.getElementById("modal-texto");
  modal.classList.remove("ativo");
}

// Fecha ao clicar fora
document.addEventListener("click", event => {
  const modal = document.getElementById("modal-texto");
  if (event.target.classList.contains("modal-overlay")) {
    modal.classList.remove("ativo");
  }
});

// ======================
// 4) Inicialização
// ======================
document.addEventListener("DOMContentLoaded", () => {
  carregarFavoritosHome();
  carregarCatalogo();
});
