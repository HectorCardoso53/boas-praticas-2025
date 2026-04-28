/* ============================================================
   termo-modal.js
   Modal: Termo de Responsabilidade — Anexo V
   Dependência: jsPDF (carregado via CDN no HTML)
   ============================================================ */

(function () {
  /* ── CONFIGURAÇÃO DOS PARTICIPANTES ──────────────────────── */
  const PARTICIPANTES = [
    {
      label: "Responsável (Integrante 1)",
      ids: {
        nome: "#nome-responsavel",
        cpf: "#cpf-responsavel",
        unidade: "#unidade-responsavel",
        categoria: 'input[name="categoria"]',
      },
    },
    {
      label: "Integrante 2",
      ids: {
        nome: "#nome-int2",
        cpf: "#cpf-int2",
        unidade: "#unidade-int2",
      },
    },
    {
      label: "Integrante 3",
      ids: {
        nome: "#nome-int3",
        cpf: "#cpf-int3",
        unidade: "#unidade-int3",
      },
    },
  ];

  /* ── ESTADO ───────────────────────────────────────────────── */
  let abaAtual = 0;
  let assinados = [false, false, false];
  let canvases = [null, null, null];
  let ctxs = [null, null, null];
  let dados = [{}, {}, {}];
  let pdfBlob = null;

  /* ── HELPERS ──────────────────────────────────────────────── */
  function getData() {
    return new Date().toLocaleDateString("pt-BR");
  }

  function lerCampo(seletor) {
    try {
      let el = document.querySelector(seletor);
      if (!el) return "";
      if (el.type === "radio") {
        const sel = document.querySelector(seletor + ":checked");
        return sel ? sel.value : "";
      }
      return (el.value || "").trim();
    } catch (e) {
      return "";
    }
  }

  function formatCPF(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9)
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
    if (v.length > 3) return v.replace(/(\d{3})(\d{0,3})/, "$1.$2");
    return v;
  }

  function puxarDados(idx) {
    const cfg = PARTICIPANTES[idx].ids;
    return {
      nome: lerCampo(cfg.nome),
      cpf: lerCampo(cfg.cpf),
      unidade: cfg.unidade ? lerCampo(cfg.unidade) : "",
      categoria: cfg.categoria ? lerCampo(cfg.categoria) : "",
    };
  }

  function isCanvasVazio(idx) {
    if (!canvases[idx]) return true;
    const data = ctxs[idx].getImageData(
      0,
      0,
      canvases[idx].width,
      canvases[idx].height,
    ).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return false;
    }
    return true;
  }

  /* ── RENDERIZAR ABA ───────────────────────────────────────── */
  function renderAba(idx) {
    const d = puxarDados(idx);
    dados[idx] = Object.assign({}, d);
    const temDados = !!(d.nome || d.cpf);
    const part = PARTICIPANTES[idx];
    const id = "p" + idx;
    const hoje = getData();

    let html = "";

    if (temDados) {
      html += `
      <div class="mt-dados-card">
        <div class="mt-dados-label">Dados puxados do formulário</div>
        <div class="mt-dados-grid">
          <div class="mt-dado-item">
            <p class="mt-dado-rotulo">Nome completo</p>
            <p class="mt-dado-valor">${d.nome || "—"}</p>
          </div>
          <div class="mt-dado-item">
            <p class="mt-dado-rotulo">CPF</p>
            <p class="mt-dado-valor">${d.cpf || "—"}</p>
          </div>
          ${
            d.unidade
              ? `<div class="mt-dado-item">
            <p class="mt-dado-rotulo">Unidade</p>
            <p class="mt-dado-valor">${d.unidade}</p>
          </div>`
              : ""
          }
          ${
            d.categoria
              ? `<div class="mt-dado-item">
            <p class="mt-dado-rotulo">Categoria</p>
            <p class="mt-dado-valor">${
              d.categoria === "servidores"
                ? "Servidor Público"
                : d.categoria === "cidadaos"
                  ? "Cidadão"
                  : d.categoria
            }</p>
          </div>`
              : ""
          }
          <div class="mt-dado-item">
            <p class="mt-dado-rotulo">Data</p>
            <p class="mt-dado-valor">${hoje}</p>
          </div>
        </div>
      </div>`;
    } else {
      html += `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#92400e;">
        ⚠ Os campos deste integrante ainda não foram preenchidos no formulário. Preencha os dados abaixo.
      </div>
      <div class="mt-dupla">
        <div class="mt-campo">
          <label>Nome completo <span style="color:#dc2626;">*</span></label>
          <input type="text" id="${id}-inp-nome" placeholder="Nome completo">
        </div>
        <div class="mt-campo">
          <label>CPF <span style="color:#dc2626;">*</span></label>
          <input type="text" id="${id}-inp-cpf" placeholder="000.000.000-00" maxlength="14">
        </div>
      </div>
      <div class="mt-dupla">
        <div class="mt-campo">
          <label>Unidade Administrativa</label>
          <input type="text" id="${id}-inp-unidade" placeholder="Secretaria / órgão">
        </div>
        <div class="mt-campo">
          <label>Categoria</label>
          <select id="${id}-inp-categoria">
            <option value="">— Selecione —</option>
            <option value="Servidor Público Municipal">Servidor Público Municipal</option>
            <option value="Cidadão">Cidadão</option>
          </select>
        </div>
      </div>`;
    }

    html += `
    <div class="mt-termo-texto">
      Eu, <strong id="${id}-t-nome">${d.nome || "_______________"}</strong>, portador(a) do CPF
      <strong id="${id}-t-cpf">${d.cpf || "___.___.___-__"}</strong>, participante da equipe inscrita no
      II Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná — Prêmio "Chico Florenzano" (2026),
      declaro que estou ciente das normas e condições estabelecidas no Edital do certame, comprometendo-me a cumprir
      todas as regras previstas, bem como a zelar pela integridade das informações prestadas. Declaro que as
      informações fornecidas são verdadeiras e assumo total responsabilidade por eventuais irregularidades.
      Data: <strong>${hoje}</strong>.
    </div>

    <label style="display:block;font-size:12px;font-weight:500;color:#374151;margin-bottom:6px;">
      Assinatura digital de ${part.label} <span style="color:#dc2626;">*</span>
    </label>
    <div class="mt-canvas-wrap">
      <canvas id="${id}-canvas" class="mt-canvas" width="600" height="130"></canvas>
    </div>
    <div class="mt-canvas-actions">
      <span class="mt-canvas-hint">Desenhe com mouse ou dedo</span>
      <button class="mt-btn-limpar" onclick="limparCanvas(${idx})">Limpar</button>
    </div>

    <div class="mt-check-linha">
      <input type="checkbox" id="${id}-chk">
      <label for="${id}-chk">
        Concordo com os termos acima. Esta assinatura eletrônica tem validade conforme a Lei nº 14.063/2020.
      </label>
    </div>

    <p class="mt-erro" id="${id}-erro"></p>`;

    document.getElementById("mt-corpo-aba").innerHTML = html;

    /* Inicializar canvas */
    const canvas = document.getElementById(id + "-canvas");
    canvases[idx] = canvas;
    const ctx = canvas.getContext("2d");
    ctxs[idx] = ctx;

    /* Restaurar assinatura anterior se voltar na aba */
    if (assinados[idx] && dados[idx]._sigImg) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = dados[idx]._sigImg;
    }

    /* Eventos do canvas — mouse */
    let drawing = false;
    function getPos(e) {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width;
      const sy = canvas.height / r.height;
      if (e.touches)
        return {
          x: (e.touches[0].clientX - r.left) * sx,
          y: (e.touches[0].clientY - r.top) * sy,
        };
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }
    function tracar(p) {
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    canvas.addEventListener("mousedown", (e) => {
      drawing = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("mousemove", (e) => {
      if (!drawing) return;
      tracar(getPos(e));
    });
    canvas.addEventListener("mouseup", () => (drawing = false));
    canvas.addEventListener("mouseleave", () => (drawing = false));

    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (!drawing) return;
        tracar(getPos(e));
      },
      { passive: false },
    );
    canvas.addEventListener("touchend", () => (drawing = false));

    /* Atualizar texto do termo nos campos manuais */
    if (!temDados) {
      const inNome = document.getElementById(id + "-inp-nome");
      const inCpf = document.getElementById(id + "-inp-cpf");
      if (inNome)
        inNome.addEventListener("input", () => {
          document.getElementById(id + "-t-nome").textContent =
            inNome.value || "_______________";
        });
      if (inCpf)
        inCpf.addEventListener("input", () => {
          inCpf.value = formatCPF(inCpf.value);
          document.getElementById(id + "-t-cpf").textContent =
            inCpf.value || "___.___.___-__";
        });
    }

    atualizarUI();
  }

  /* ── LIMPAR CANVAS ────────────────────────────────────────── */
  function limparCanvas(idx) {
    if (ctxs[idx])
      ctxs[idx].clearRect(0, 0, canvases[idx].width, canvases[idx].height);
  }

  /* ── NAVEGAÇÃO ENTRE ABAS ─────────────────────────────────── */
  function irParaAba(idx) {
    abaAtual = idx;
    document
      .querySelectorAll(".mt-aba")
      .forEach((b, i) => b.classList.toggle("ativa", i === idx));
    document.getElementById("mt-btn-voltar").style.display =
      idx > 0 ? "flex" : "none";
    document.getElementById("mt-btn-avancar").textContent =
      idx < 2 ? "Próximo →" : "✅ Gerar PDF";
    atualizarProgresso();
    renderAba(idx);
  }

  function voltarAba() {
    if (abaAtual > 0) irParaAba(abaAtual - 1);
  }

  function atualizarProgresso() {
    const pct = Math.round(((abaAtual + 1) / 3) * 100);
    document.getElementById("mt-prog-fill").style.width = pct + "%";
    document.getElementById("mt-prog-texto").textContent =
      `Participante ${abaAtual + 1} de 3`;
  }

  function atualizarUI() {
    atualizarProgresso();
    assinados.forEach((ok, i) => {
      const ch = document.getElementById("aba-check-" + i);
      if (ch) ch.classList.toggle("ok", ok);
    });
  }

  /* ── VALIDAR ABA ──────────────────────────────────────────── */
  function validarAba(idx) {
    const id = "p" + idx;
    const erroEl = document.getElementById(id + "-erro");
    erroEl.style.display = "none";

    const d = puxarDados(idx);
    const temDados = !!(d.nome || d.cpf);

    let nome = d.nome,
      cpf = d.cpf,
      unidade = d.unidade,
      categoria = d.categoria;

    if (!temDados) {
      nome = (document.getElementById(id + "-inp-nome")?.value || "").trim();
      cpf = (document.getElementById(id + "-inp-cpf")?.value || "").trim();
      unidade = (
        document.getElementById(id + "-inp-unidade")?.value || ""
      ).trim();
      categoria = document.getElementById(id + "-inp-categoria")?.value || "";
    }

    if (!nome) {
      erroEl.textContent = "Informe o nome completo.";
      erroEl.style.display = "block";
      return false;
    }
    if (!cpf || cpf.replace(/\D/g, "").length < 11) {
      erroEl.textContent = "Informe o CPF completo.";
      erroEl.style.display = "block";
      return false;
    }
    if (isCanvasVazio(idx)) {
      erroEl.textContent = "Assine no campo acima.";
      erroEl.style.display = "block";
      return false;
    }

    const chk = document.getElementById(id + "-chk");
    if (!chk?.checked) {
      erroEl.textContent = "Marque a concordância com os termos.";
      erroEl.style.display = "block";
      return false;
    }

    dados[idx] = {
      nome,
      cpf,
      unidade,
      categoria,
      data: getData(),
      _sigImg: canvases[idx].toDataURL("image/png"),
    };
    assinados[idx] = true;
    document.getElementById("aba-check-" + idx)?.classList.add("ok");

    return true;
  }

  /* ── AVANÇAR OU GERAR ─────────────────────────────────────── */
  function avancarOuGerar() {
    if (!validarAba(abaAtual)) return;
    if (abaAtual < 2) irParaAba(abaAtual + 1);
    else gerarPDF();
  }

  /* ================= CARREGAR LOGO (CORRETO) ================= */
  function carregarLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/src/img/prefeitura_oriximina.png";

      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };

      img.onerror = function () {
        console.error("Erro ao carregar logo");
        resolve(null);
      };
    });
  }

  /* ================= GERAR PDF ================= */
  async function gerarPDF() {
    const logoBase64 = await carregarLogo();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const W = 210,
      ml = 20,
      mr = 20,
      tw = W - ml - mr;

    dados.forEach((d, idx) => {
      if (idx > 0) doc.addPage();

      const catLabel =
        d.categoria === "servidores"
          ? "Servidor Público Municipal"
          : d.categoria === "cidadaos"
            ? "Cidadão"
            : d.categoria || "";

      /* ===== HEADER ===== */
      doc.setFillColor(0, 27, 61);
      doc.rect(0, 0, W, 30, "F");

      // LOGO (AGORA FUNCIONA)
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", ml, 5, 20, 20);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("PREFEITURA DE ORIXIMINÁ", W / 2, 12, { align: "center" });

      doc.setFontSize(10);
      doc.text("TERMO DE RESPONSABILIDADE", W / 2, 20, {
        align: "center",
      });

      doc.setTextColor(0, 0, 0);

      /* Linha amarela */
      doc.setDrawColor(255, 210, 31);
      doc.setLineWidth(1.5);
      doc.line(ml, 35, W - mr, 35);

      /* ===== BADGE ===== */
      doc.setFillColor(0, 27, 61);
      doc.roundedRect(ml, 40, 60, 7, 1.5, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold").setFontSize(8);
      doc.text(`Integrante ${idx + 1} de 3`, ml + 30, 45, { align: "center" });

      doc.setTextColor(0, 0, 0);

      /* ===== DADOS ===== */
      let y = 52;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 27, 61);
      doc.roundedRect(ml, y, tw, 28, 2, 2, "FD");

      doc.setTextColor(0, 27, 61);
      doc.setFont("helvetica", "bold").setFontSize(8);
      doc.text("DADOS DO PARTICIPANTE", ml + 4, y + 5);

      doc.setTextColor(0, 0, 0).setFontSize(9);

      doc.text("Nome:", ml + 4, y + 12);
      doc.setFont("helvetica", "bold").text(d.nome || "—", ml + 22, y + 12);

      doc.setFont("helvetica", "normal").text("CPF:", ml + 4, y + 18);
      doc.setFont("helvetica", "bold").text(d.cpf || "—", ml + 22, y + 18);

      if (catLabel) {
        doc.text("Categoria:", ml + 4, y + 24);
        doc.setFont("helvetica", "bold").text(catLabel, ml + 26, y + 24);
      }

      y += 36;

      /* ===== TEXTO ===== */
      doc.setTextColor(0, 27, 61);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("DECLARAÇÃO DE RESPONSABILIDADE", ml, y);

      y += 6;

      doc
        .setFont("helvetica", "normal")
        .setFontSize(9.5)
        .setTextColor(60, 60, 60);

      const corpo = doc.splitTextToSize(
        `Eu, ${d.nome || "_______________"}, portador(a) do CPF ${
          d.cpf || "___.___.___-__"
        }, declaro que estou ciente das normas e assumo responsabilidade pelas informações prestadas.`,
        tw,
      );

      doc.text(corpo, ml, y);
      y += corpo.length * 4.8 + 10;

      /* ===== ASSINATURA ===== */
      doc.setTextColor(0, 27, 61);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("ASSINATURA", ml, y);

      y += 4;

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(ml, y, 85, 35, 2, 2, "FD");

      if (d._sigImg) {
        doc.addImage(d._sigImg, "PNG", ml + 2, y + 2, 81, 30);
      }

      y += 37;

      doc.line(ml, y, ml + 85, y);

      y += 3;

      doc.setFontSize(8).setTextColor(0, 0, 0);
      doc.text(d.nome || "", ml, y);

      /* ===== RODAPÉ ===== */
      doc.setDrawColor(0, 27, 61);
      doc.line(ml, 282, W - mr, 282);

      doc.setFontSize(7.5).setTextColor(0, 27, 61);
      doc.text(`Página ${idx + 1}`, W / 2, 287, {
        align: "center",
      });
    });

    pdfBlob = doc.output("blob");

    const nomeArq = "termo.pdf";

    injetarArquivo(pdfBlob, nomeArq);
    fecharModalTermo();
    mostrarFeedbackTermo(nomeArq, pdfBlob);
  }

  /* ── INJETAR NO INPUT DE UPLOAD ───────────────────────────── */
  function injetarArquivo(blob, nome) {
    const file = new File([blob], nome, { type: "application/pdf" });
    for (const s of ["#arquivo-termo", '[name="arquivo_termo"]']) {
      try {
        const el = document.querySelector(s);
        if (!el) continue;
        const dt = new DataTransfer();
        dt.items.add(file);
        el.files = dt.files;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      } catch (e) {
        /* segue */
      }
    }
  }

  /* ── FEEDBACK NA UPLOAD-AREA + TOAST ──────────────────────── */
  function mostrarFeedbackTermo(nomeArq, blob) {
    const uploadArea = document
      .querySelector("#arquivo-termo")
      ?.closest(".upload-area");
    if (uploadArea) {
      uploadArea.style.borderColor = "#1a7a4a";
      uploadArea.style.borderStyle = "solid";
      uploadArea.style.background = "#f0fdf4";

      // Esconde os elementos visuais originais sem tocar no input
      uploadArea
        .querySelectorAll(".upload-icon, .upload-texto, .upload-nome")
        .forEach((el) => (el.style.display = "none"));

      // Remove feedback anterior se existir
      uploadArea.querySelector(".termo-feedback")?.remove();

      // Cria o bloco visual por cima (sem substituir o input)
      const feedback = document.createElement("div");
      feedback.className = "termo-feedback";
      feedback.style.cssText =
        "pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;";
      feedback.innerHTML = `
      <i class="bi bi-file-earmark-check-fill" style="color:#1a7a4a;font-size:2rem;"></i>
      <div style="color:#1a7a4a;font-weight:600;font-size:.88rem;">${nomeArq}</div>
      <div style="font-size:.78rem;color:#6b7280;">Assinado por 3 integrantes · gerado agora</div>
    `;
      uploadArea.insertBefore(
        feedback,
        uploadArea.querySelector('input[type="file"]'),
      );

      // Botão baixar fora do pointer-events:none
      const btnWrap = document.createElement("div");
      btnWrap.style.cssText = "position:relative;z-index:3;margin-top:8px;";
      btnWrap.innerHTML = `
      <button type="button" id="btn-baixar-termo-inline"
        style="padding:5px 16px;font-size:.8rem;font-weight:500;
               background:#e8f5ee;color:#1a7a4a;border:1px solid #b5ddc8;
               border-radius:6px;cursor:pointer;">
        ⬇ Baixar PDF
      </button>
    `;
      uploadArea.insertBefore(
        btnWrap,
        uploadArea.querySelector('input[type="file"]'),
      );

      btnWrap
        .querySelector("#btn-baixar-termo-inline")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = nomeArq;
          a.click();
          URL.revokeObjectURL(url);
        });
    }

    // Toast
    const existing = document.getElementById("toast-termo");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "toast-termo";
    toast.innerHTML = `
    <i class="bi bi-check-circle-fill" style="color:#1a7a4a;font-size:1rem;flex-shrink:0;"></i>
    <span>Termo assinado pelos 3 integrantes e anexado com sucesso!</span>
  `;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "28px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      opacity: "0",
      background: "#fff",
      border: "1px solid #bbf7d0",
      color: "#155724",
      padding: "10px 20px",
      borderRadius: "8px",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,.12)",
      zIndex: "99999",
      whiteSpace: "nowrap",
      transition: "opacity .25s ease, transform .25s ease",
      pointerEvents: "none",
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
      }),
    );
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ── ABRIR MODAL ──────────────────────────────────────────── */
  window.abrirModalTermo = function () {
    abaAtual = 0;
    assinados = [false, false, false];
    canvases = [null, null, null];
    ctxs = [null, null, null];
    dados = [{}, {}, {}];
    pdfBlob = null;

    document.getElementById("mt-tela-form").style.display = "block";
    document.getElementById("mt-tela-ok").style.display = "none";
    document
      .querySelectorAll(".mt-aba")
      .forEach((b, i) => b.classList.toggle("ativa", i === 0));
    [0, 1, 2].forEach((i) =>
      document.getElementById("aba-check-" + i)?.classList.remove("ok"),
    );
    document.getElementById("mt-btn-voltar").style.display = "none";
    document.getElementById("mt-btn-avancar").textContent = "Próximo →";
    document.getElementById("modal-termo-overlay").classList.add("aberto");
    renderAba(0);
  };

  /* ── FECHAR MODAL ─────────────────────────────────────────── */
  window.fecharModalTermo = function () {
    document.getElementById("modal-termo-overlay").classList.remove("aberto");
  };

  /* Fechar ao clicar fora */
  document
    .getElementById("modal-termo-overlay")
    ?.addEventListener("click", function (e) {
      if (e.target === this) fecharModalTermo();
    });

  /* ── EXPOR FUNÇÕES GLOBAIS ────────────────────────────────── */
  window.irParaAba = irParaAba;
  window.voltarAba = voltarAba;
  window.avancarOuGerar = avancarOuGerar;
  window.limparCanvas = limparCanvas;
})();
