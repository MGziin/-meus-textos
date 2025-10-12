const container = document.getElementById('cards-container');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');
const modalTexto = document.getElementById('modal-texto');

function mostrarCards(listaTextos) {
  container.innerHTML = '';
  listaTextos.forEach(texto => {
    const card = document.createElement('div');
    card.className = `card ${texto.categoria}`; // adiciona a classe da categoria
    card.innerHTML = `<h3>${texto.titulo}</h3><p>${texto.resumo}</p>`;
    card.onclick = () => abrirModal(texto);
    container.appendChild(card);
  });
}

function abrirModal(texto) {
  modalTitulo.textContent = texto.titulo;
  modalTexto.textContent = texto.conteudo;
  modal.style.display = 'block';
}

function fecharModal() {
  modal.style.display = 'none';
}

function filtrarCategoria(categoria) {
  if(categoria === 'Todos') {
    mostrarCards(textos);
  } else {
    const filtrados = textos.filter(t => t.categoria === categoria);
    mostrarCards(filtrados);
  }
}

mostrarCards(textos);
