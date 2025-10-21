// Lista de textos
const textos = [
    {
        titulo: "A Semente",
        categoria: "Fábula",
        conteudo: "Essa é a história de um fazendeiro que tinha um sonho: conseguir uma semente especial...",
        link: "#"
    },
    {
        titulo: "Minha Primeira Crônica",
        categoria: "Crônicas",
        conteudo: "Exemplo de texto de crônica...",
        link: "#"
    }
];

// Renderiza tags no Home
function renderTagsHome() {
    const tagsContainer = document.getElementById("tagsContainer");
    if (!tagsContainer) return;

    const tags = [...new Set(textos.map(t => t.categoria))];

    tagsContainer.innerHTML = tags.map(tag => `
        <a href="textos.html?tag=${tag}" class="tag">${tag}</a>
    `).join("");
}

// Renderiza textos no textos.html
function renderTextos(filtro = null) {
    const container = document.getElementById("textosContainer");
    if (!container) return;

    let lista = textos;
    if (filtro) {
        lista = textos.filter(t => t.categoria === filtro);
    }

    container.innerHTML = lista.map(t => `
        <div class="card">
            <h3>${t.titulo}</h3>
            <span class="tag">${t.categoria}</span>
            <p>${t.conteudo}</p>
        </div>
    `).join("");
}

// Detecta filtro via URL
function aplicarFiltroURL() {
    const url = new URLSearchParams(window.location.search);
    const tag = url.get("tag");

    if (tag) {
        document.getElementById("filterInfo").style.display = "block";
        document.getElementById("filterTag").innerText = `Filtrando por: ${tag}`;
        renderTextos(tag);
    } else {
        renderTextos();
    }
}

// Botão limpar filtro
const btnClear = document.getElementById("clearFilter");
if (btnClear) {
    btnClear.addEventListener("click", () => {
        window.location.href = "textos.html";
    });
}

// Inicia Home ou Textos
renderTagsHome();
aplicarFiltroURL();
