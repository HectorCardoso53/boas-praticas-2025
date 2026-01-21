document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-edicoes');
  const menu = document.getElementById('menu-edicoes');

  if (!btn || !menu) return;

  // Abre/fecha ao clicar no botão
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('ativo');
  });

  // Fecha ao clicar fora
  document.addEventListener('click', () => {
    menu.classList.remove('ativo');
  });

  // Evita fechar ao clicar dentro do menu
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
});
