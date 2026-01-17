fetch('data/projetos.json')
  .then(res => res.json())
  .then(projetos => {

    /* LISTA DE PROJETOS */
    const lista = document.getElementById('lista-projetos');

    if (lista) {
      projetos.forEach(p => {
        lista.innerHTML += `
          <div class="projeto-card">
            <h3>${p.titulo}</h3>

            <div class="projeto-secretaria">
              ${p.secretaria}
            </div>

            <div class="projeto-resumo">
              ${p.resumo}
            </div>

            <a href="projeto.html?id=${p.id}">Ver detalhes</a>
          </div>
        `;
      });
    }
    /* DETALHE DO PROJETO */
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const detalhe = document.getElementById('detalhe-projeto');

 if (id && detalhe) {
  const projeto = projetos.find(p => p.id == id);

  if (!projeto) {
    detalhe.innerHTML = "<p>Projeto não encontrado.</p>";
    return;
  }

  detalhe.innerHTML = `
    <h2>${projeto.titulo}</h2>
    <p><strong>Secretaria:</strong> ${projeto.secretaria}</p>

    <h3>Resumo</h3>
    <p>${projeto.resumo}</p>

    <h3>Contexto</h3>
    <p>${projeto.contexto}</p>

    <h3>Problema</h3>
    <p>${projeto.problema}</p>

    <h3>Objetivo</h3>
    <p>${projeto.objetivo}</p>

    <h3>Metodologia</h3>
    <p>${projeto.metodologia}</p>

    <h3>Resultados</h3>
    <p>${projeto.resultados}</p>

    <h3>Impacto</h3>
    <p>${projeto.impacto}</p>

    <div style="margin-top:40px;">
      <a href="${projeto.pdf}" class="btn-download" download>
        📄 Baixar projeto em PDF
      </a>
    </div>
  `;
}


  });
