// ======== MENU ========
const burger = document.querySelector(".burger");
const menu = document.getElementById("menu");

if (burger && menu) {
  burger.addEventListener("click", () => {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  });

  document.querySelectorAll("#menu a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) menu.style.display = "none";
    });
  });
}

// ======== TEXTOS (somente se existir no HTML) ========
if (document.getElementById("lista-textos")) {
  const listaTextos = document.getElementById("lista-textos");
  const listaTags = document.getElementById("lista-tags");

  function mostrarTextos(lista) {
    listaTextos.innerHTML = "";
    if (!lista || lista.length === 0) {
      listaTextos.innerHTML = `<p style="text-align:center;">Nenhum texto encontrado.</p>`;
      return;
    }

    lista.forEach(t => {
      const card = document.createElement("div");
      card.classList.add("texto-card");
      card.innerHTML = `
        <h4>${t.titulo}</h4>
        <p>${t.conteudo.substring(0, 150)}...</p>
      `;
      listaTextos.appendChild(card);
    });
  }

  function criarTags() {
    const tagsUnicas = [...new Set(textos.flatMap(t => t.tags || []))];
    listaTags.innerHTML = "";

    tagsUnicas.forEach(tag => {
      const tagEl = document.createElement("span");
      tagEl.classList.add("tag");
      tagEl.textContent = tag;
      tagEl.addEventListener("click", () => {
        mostrarTextos(textos.filter(t => t.tags?.includes(tag)));
      });
      listaTags.appendChild(tagEl);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof textos !== "undefined") {
      criarTags();
      mostrarTextos(textos);
    }
  });
}
