document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  const listaTags = document.getElementById("lista-tags");

  // Renderizar textos
  textos.forEach(texto => {
    const card = document.createElement("div");
    card.classList.add("texto-card");
    card.innerHTML = `
      <span class="tag">${texto.categoria}</span>
      <h3>${texto.titulo}</h3>
      <p>${texto.conteudo}</p>
      <button class="btn-ler">Ler mais</button>
    `;
    catalogo.appendChild(card);
  });

  // Botão Ler Mais / Ler Menos
  document.querySelectorAll(".btn-ler").forEach(botao => {
    botao.addEventListener("click", () => {
      const card = botao.parentElement;
      card.classList.toggle("expanded");
      botao.textContent = card.classList.contains("expanded") ? "Ler menos" : "Ler mais";
    });
  });

  // Renderizar tags dinâmicas
  const categorias = [...new Set(textos.map(t => t.categoria))];
  categorias.forEach(cat => {
    const tag = document.createElement("span");
    tag.classList.add("tag");
    tag.textContent = cat;
    listaTags.appendChild(tag);
  });
});
