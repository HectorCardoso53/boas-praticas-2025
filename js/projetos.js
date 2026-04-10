fetch("/data/projetos.json")
  .then((res) => res.json())
  .then((projetos) => {
    /* ============================
       LISTA DE PROJETOS (2025)
    ============================ */
    const lista = document.getElementById("lista-projetos");

    if (lista) {
      lista.innerHTML = "";

      projetos.forEach((p, index) => {
        let classePodio = "";
        let seloPodio = "";

        if (index === 0) {
          classePodio = "primeiro-lugar";
          seloPodio = '<i class="bi bi-trophy-fill text-warning"></i> 1º Lugar';
        } else if (index === 1) {
          classePodio = "segundo-lugar";
          seloPodio =
            '<i class="bi bi-award-fill text-secondary"></i> 2º Lugar';
        } else if (index === 2) {
          classePodio = "terceiro-lugar";
          seloPodio = '<i class="bi bi-award text-danger"></i> 3º Lugar';
        }
        lista.innerHTML += `
  <div class="projeto-card ${classePodio}">

    <div class="projeto-topo">

      ${
        Array.isArray(p.fotos) && p.fotos.length
          ? `
        <img 
          src="${p.fotos[0]}"
          alt="Foto do projeto ${p.titulo}"
          class="projeto-foto"
           data-fotos='${JSON.stringify(p.fotos)}'
        >
      `
          : ""
      }

      <div class="projeto-info">
        <h3>${p.titulo}</h3>

        <div class="projeto-secretaria">
          ${p.secretaria}
        </div>

        <div class="projeto-resumo">
          ${p.resumo}
        </div>
      </div>

    </div>

    <div class="projeto-footer">
      ${seloPodio ? `<span class="selo-podio">${seloPodio}</span>` : ""}
      <a href="projeto-2025.html?id=${p.id}">Ver detalhes</a>
    </div>

  </div>
`;
      });
    }
    /* ============================
       DETALHE DO PROJETO
    ============================ */
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const detalhe = document.getElementById("detalhe-projeto");

    if (!id || !detalhe) return;

    const projeto = projetos.find((p) => p.id == id);

    if (!projeto) {
      detalhe.innerHTML = "<p>Projeto não encontrado.</p>";
      return;
    }

    detalhe.innerHTML = `
      
      <h2>${projeto.titulo}</h2>
      <p><strong>Secretaria:</strong> ${projeto.secretaria}</p>

      ${
        projeto.resumo
          ? `
        <h3>Resumo</h3>
        <p>${projeto.resumo}</p>
      `
          : ""
      }

      ${
        projeto.introducao
          ? `
        <h3>Introdução</h3>
        <p>${projeto.introducao}</p>
      `
          : ""
      }

      ${
        projeto.desafio
          ? `
        <h3>Desafio</h3>
        <p>${projeto.desafio}</p>
      `
          : ""
      }

      ${
        projeto.resposta
          ? `
        <h3>Resposta</h3>
        <p>${projeto.resposta}</p>
      `
          : ""
      }

      ${
        Array.isArray(projeto.etapas)
          ? `
        <h3>Etapas da Solução</h3>
        <ul>
          ${projeto.etapas.map((e) => `<li>${e}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        projeto.objetivoGeral
          ? `
        <h3>Objetivo Geral</h3>
        <p>${projeto.objetivoGeral}</p>
      `
          : ""
      }

      ${
        Array.isArray(projeto.objetivosEspecificos)
          ? `
        <h3>Objetivos Específicos</h3>
        <ul>
          ${projeto.objetivosEspecificos.map((o) => `<li>${o}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        Array.isArray(projeto.metodologia)
          ? `
        <h3>Metodologia</h3>
        <ul>
          ${projeto.metodologia.map((m) => `<li>${m}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        Array.isArray(projeto.resultadosEsperados)
          ? `
        <h3>Resultados Esperados</h3>
        <ul>
          ${projeto.resultadosEsperados.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        Array.isArray(projeto.indicadores)
          ? `
        <h3>Indicadores de Sucesso</h3>
        <ul>
          ${projeto.indicadores.map((i) => `<li>${i}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        Array.isArray(projeto.cronograma)
          ? `
        <h3>Cronograma de Execução</h3>
        <ul>
          ${projeto.cronograma.map((c) => `<li>${c.etapa} – ${c.prazo}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        Array.isArray(projeto.orcamento)
          ? `
        <h3>Orçamento Estimado</h3>
        <ul>
          ${projeto.orcamento.map((o) => `<li>${o.item}: ${o.valor}</li>`).join("")}
        </ul>
      `
          : ""
      }

      ${
        projeto.consideracoes
          ? `
        <h3>Considerações Finais</h3>
        <p>${projeto.consideracoes}</p>
      `
          : ""
      }

      ${
        projeto.pdf
          ? `
    <a href="${projeto.pdf}" class="btn-download" download>
      <i class="bi bi-file-earmark-arrow-down"></i> Baixar PDF do Projeto
    </a>
  `
          : ""
      }
    `;
  });

let fotosAtuais = [];
let indexAtual = 0;

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("projeto-foto")) {
    fotosAtuais = JSON.parse(e.target.dataset.fotos);
    indexAtual = 0;
    abrirLightbox();
  }
});

const lightbox = document.getElementById("lightbox");
const track = document.querySelector(".lightbox-track");
const btnClose = document.querySelector(".lightbox-close");
const btnPrev = document.querySelector(".lightbox-nav.prev");
const btnNext = document.querySelector(".lightbox-nav.next");

if (lightbox && track && btnClose && btnPrev && btnNext) {
  function renderFoto() {
    track.innerHTML = `<img src="${fotosAtuais[indexAtual]}">`;
  }

  function abrirLightbox() {
    renderFoto();
    lightbox.classList.add("ativo");
  }

  function fecharLightbox() {
    lightbox.classList.remove("ativo");
    track.innerHTML = "";
  }

  btnClose.onclick = fecharLightbox;

  btnPrev.onclick = () => {
    indexAtual = (indexAtual - 1 + fotosAtuais.length) % fotosAtuais.length;
    renderFoto();
  };

  btnNext.onclick = () => {
    indexAtual = (indexAtual + 1) % fotosAtuais.length;
    renderFoto();
  };

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) fecharLightbox();
  });
}
