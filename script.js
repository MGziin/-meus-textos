const catalogo = document.getElementById("catalogo");
const categoriaBtns = document.querySelectorAll(".categoria-btn");

function mostrarTextos(categoria) {
  catalogo.innerHTML = "";
  const filtrados = categoria === "todas" ? textos : textos.filter(t => t.categoria === categoria);

  filtrados.forEach(t => {
    const card = document.createElement("div");
    card.classList.add("texto-card");

    const resumo = t.conteudo.substring(0, 400) + "...";
    const textoCompleto = document.createElement("p");
    textoCompleto.textContent = resumo;

    const botao = document.createElement("a");
    botao.href = "#";
    botao.classList.add("ler-mais");
    botao.textContent = "Ler mais";

    let expandido = false;
    botao.addEventListener("click", e => {
      e.preventDefault();
      expandido = !expandido;
      textoCompleto.textContent = expandido ? t.conteudo : resumo;
      botao.textContent = expandido ? "Ler menos" : "Ler mais";
    });

    card.innerHTML = `<h3>${t.titulo}</h3><span class="tag">${t.categoria}</span>`;
    card.appendChild(textoCompleto);
    card.appendChild(botao);
    catalogo.appendChild(card);
  });
}

categoriaBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    categoriaBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mostrarTextos(btn.dataset.categoria);
    // ======= Menu Hambúrguer =======
document.getElementById('menu-toggle')?.addEventListener('click', () => {
  document.getElementById('menu').classList.toggle('active');
});

  });
});

mostrarTextos("todas");

