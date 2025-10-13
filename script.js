const botoes = document.querySelectorAll('.categoria-btn');
const textos = document.querySelectorAll('.texto-card');


botoes.forEach(botao => {
  botao.addEventListener('click', () => {
    botoes.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');


    const categoria = botao.dataset.categoria;
    textos.forEach(texto => {
      texto.style.display = categoria === 'todos' || texto.dataset.categoria === categoria
        ? 'block'
        : 'none';
    });
  });
});