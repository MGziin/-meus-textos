// Dados virão do textos.js
console.log("Site carregado com sucesso!");

// Carregar favoritos
function carregarFavoritos() {
  const lista = document.getElementById("lista-favoritos");
  FAVORITOS.forEach(texto => {
    const card = document.createElement("div");
    card.className = "card-texto";
    card.innerHTML = `<h3>${texto.titulo}</h3><p>${texto.previa}</p>`;
    lista.appendChild(card);
  });
}

// Carregar tags
function carregarTags() {
  const lista = document.getElementById("lista-tags");
  TAGS.forEach(tag => {
    const item = document.createElement("span");
    item.className = "tag-item";
    item.textContent = tag;
    lista.appendChild(item);
  });
}

carregarFavoritos();
carregarTags();
