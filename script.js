// ======== MENU HAMBÚRGUER ========
const burger = document.querySelector(".burger");
const menu = document.getElementById("menu");

if (burger) {
  burger.addEventListener("click", () => {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  });

  // Fecha o menu ao clicar em um link (modo mobile)
  document.querySelectorAll("#menu a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        menu.style.display = "none";
      }
    });
  });
}

// ======== TEXTOS E TAGS ========
if (document.getElementById("lista-textos")) {
  const listaTextos = document.getElementById("lista-textos");
  const listaTags = document.getElementById("lista-tags");

  let textosFiltrados = window.textos;

  function mostrarTextos(lista) {
    listaTextos.innerHTML = "";

    if (lista.length === 0) {
      listaTextos.innerHTML = `<p style="text-align:center;">Nenhum texto encontrado.</p>`;
      return;
    }

    lista.forEach(t => {
      const card = document.createElement("div");
      card.classList.add("texto-card");
      card.innerHTML = `
        <h4>${t.titulo}</h4>
        <p>${t.conteudo}</p>
      `;
      listaTextos.appendChild(card);
    });
  }

  function criarTags() {
    const tagsUnicas = [...new Set(window.textos.flatMap(t => t.tags || []))];
    listaTags.innerHTML = "";

    tagsUnicas.forEach(tag => {
      const tagEl = document.createElement("span");
      tagEl.classList.add("tag");
      tagEl.textContent = tag;
      tagEl.addEventListener("click", () => filtrarPorTag(tag));
      listaTags.appendChild(tagEl);
    });
  }

  function filtrarPorTag(tag) {
    textosFiltrados = window.textos.filter(t => t.tags && t.tags.includes(tag));
    mostrarTextos(textosFiltrados);
  }

  document.addEventListener("DOMContentLoaded", () => {
    criarTags();
    mostrarTextos(window.textos);
  });
}
