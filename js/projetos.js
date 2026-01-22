fetch('data/projetos.json')
  .then(res => res.json())
  .then(projetos => {

    /* ============================
       LISTA DE PROJETOS (2025)
    ============================ */
    const lista = document.getElementById('lista-projetos');

  if (lista) {
  lista.innerHTML = '';

  projetos.forEach((p, index) => {

    let classePodio = '';
    let seloPodio = '';

    if (index === 0) {
      classePodio = 'primeiro-lugar';
      seloPodio = '🥇 1º Lugar';
    } else if (index === 1) {
      classePodio = 'segundo-lugar';
      seloPodio = '🥈 2º Lugar';
    } else if (index === 2) {
      classePodio = 'terceiro-lugar';
      seloPodio = '🥉 3º Lugar';
    }

    lista.innerHTML += `
      <div class="projeto-card ${classePodio}">
        
        <h3>${p.titulo}</h3>

        <div class="projeto-secretaria">
          ${p.secretaria}
        </div>

        <div class="projeto-resumo">
          ${p.resumo}
        </div>

        <div class="projeto-footer">
          ${seloPodio ? `<span class="selo-podio">${seloPodio}</span>` : ''}
          
          <a href="projeto.html?id=${p.id}">
            Ver detalhes
          </a>
        </div>

      </div>
    `;
  });
}


    /* ============================
       DETALHE DO PROJETO
    ============================ */
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const detalhe = document.getElementById('detalhe-projeto');

    if (!id || !detalhe) return;

    const projeto = projetos.find(p => p.id == id);

    if (!projeto) {
      detalhe.innerHTML = '<p>Projeto não encontrado.</p>';
      return;
    }

    detalhe.innerHTML = `
      <h2>${projeto.titulo}</h2>
      <p><strong>Secretaria:</strong> ${projeto.secretaria}</p>

      ${projeto.resumo ? `
        <h3>Resumo</h3>
        <p>${projeto.resumo}</p>
      ` : ''}

      ${projeto.introducao ? `
        <h3>Introdução</h3>
        <p>${projeto.introducao}</p>
      ` : ''}

      ${projeto.desafio ? `
        <h3>Desafio</h3>
        <p>${projeto.desafio}</p>
      ` : ''}

      ${projeto.resposta ? `
        <h3>Resposta</h3>
        <p>${projeto.resposta}</p>
      ` : ''}

      ${Array.isArray(projeto.etapas) ? `
        <h3>Etapas da Solução</h3>
        <ul>
          ${projeto.etapas.map(e => `<li>${e}</li>`).join('')}
        </ul>
      ` : ''}

      ${projeto.objetivoGeral ? `
        <h3>Objetivo Geral</h3>
        <p>${projeto.objetivoGeral}</p>
      ` : ''}

      ${Array.isArray(projeto.objetivosEspecificos) ? `
        <h3>Objetivos Específicos</h3>
        <ul>
          ${projeto.objetivosEspecificos.map(o => `<li>${o}</li>`).join('')}
        </ul>
      ` : ''}

      ${Array.isArray(projeto.metodologia) ? `
        <h3>Metodologia</h3>
        <ul>
          ${projeto.metodologia.map(m => `<li>${m}</li>`).join('')}
        </ul>
      ` : ''}

      ${Array.isArray(projeto.resultadosEsperados) ? `
        <h3>Resultados Esperados</h3>
        <ul>
          ${projeto.resultadosEsperados.map(r => `<li>${r}</li>`).join('')}
        </ul>
      ` : ''}

      ${Array.isArray(projeto.indicadores) ? `
        <h3>Indicadores de Sucesso</h3>
        <ul>
          ${projeto.indicadores.map(i => `<li>${i}</li>`).join('')}
        </ul>
      ` : ''}

      ${Array.isArray(projeto.cronograma) ? `
        <h3>Cronograma de Execução</h3>
        <ul>
          ${projeto.cronograma.map(c => `<li>${c.etapa} – ${c.prazo}</li>`).join('')}
        </ul>
      ` : ''}

      ${Array.isArray(projeto.orcamento) ? `
        <h3>Orçamento Estimado</h3>
        <ul>
          ${projeto.orcamento.map(o => `<li>${o.item}: ${o.valor}</li>`).join('')}
        </ul>
      ` : ''}

      ${projeto.consideracoes ? `
        <h3>Considerações Finais</h3>
        <p>${projeto.consideracoes}</p>
      ` : ''}

      ${projeto.pdf ? `
        <a href="${projeto.pdf}" class="btn-download" download>
          📄 Baixar PDF do Projeto
        </a>
      ` : ''}
    `;

  });
