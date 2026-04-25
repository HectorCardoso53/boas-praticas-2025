/* ============================================================
   termo-modal.js
   Modal: Termo de Responsabilidade — Anexo V
   Dependência: jsPDF (carregado via CDN no HTML)
   ============================================================ */

(function () {

  /* ── CONFIGURAÇÃO DOS PARTICIPANTES ──────────────────────── */
  const PARTICIPANTES = [
    {
      label: 'Responsável (Integrante 1)',
      ids: {
        nome:      '#nome-responsavel',
        cpf:       '#cpf-responsavel',
        unidade:   '#unidade-responsavel',
        categoria: 'input[name="categoria"]'
      }
    },
    {
      label: 'Integrante 2',
      ids: {
        nome:    '#nome-int2',
        cpf:     '#cpf-int2',
        unidade: '#unidade-int2'
      }
    },
    {
      label: 'Integrante 3',
      ids: {
        nome:    '#nome-int3',
        cpf:     '#cpf-int3',
        unidade: '#unidade-int3'
      }
    }
  ];

  /* ── ESTADO ───────────────────────────────────────────────── */
  let abaAtual  = 0;
  let assinados = [false, false, false];
  let canvases  = [null, null, null];
  let ctxs      = [null, null, null];
  let dados     = [{}, {}, {}];
  let pdfBlob   = null;

  /* ── HELPERS ──────────────────────────────────────────────── */
  function getData() {
    return new Date().toLocaleDateString('pt-BR');
  }

  function lerCampo(seletor) {
    try {
      let el = document.querySelector(seletor);
      if (!el) return '';
      if (el.type === 'radio') {
        const sel = document.querySelector(seletor + ':checked');
        return sel ? sel.value : '';
      }
      return (el.value || '').trim();
    } catch (e) { return ''; }
  }

  function formatCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    return v;
  }

  function puxarDados(idx) {
    const cfg = PARTICIPANTES[idx].ids;
    return {
      nome:      lerCampo(cfg.nome),
      cpf:       lerCampo(cfg.cpf),
      unidade:   cfg.unidade   ? lerCampo(cfg.unidade)   : '',
      categoria: cfg.categoria ? lerCampo(cfg.categoria) : ''
    };
  }

  function isCanvasVazio(idx) {
    if (!canvases[idx]) return true;
    const data = ctxs[idx].getImageData(0, 0, canvases[idx].width, canvases[idx].height).data;
    for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) return false; }
    return true;
  }

  /* ── RENDERIZAR ABA ───────────────────────────────────────── */
  function renderAba(idx) {
    const d       = puxarDados(idx);
    dados[idx]    = Object.assign({}, d);
    const temDados = !!(d.nome || d.cpf);
    const part    = PARTICIPANTES[idx];
    const id      = 'p' + idx;
    const hoje    = getData();

    let html = '';

    if (temDados) {
      html += `
      <div class="mt-dados-card">
        <div class="mt-dados-label">Dados puxados do formulário</div>
        <div class="mt-dados-grid">
          <div class="mt-dado-item">
            <p class="mt-dado-rotulo">Nome completo</p>
            <p class="mt-dado-valor">${d.nome || '—'}</p>
          </div>
          <div class="mt-dado-item">
            <p class="mt-dado-rotulo">CPF</p>
            <p class="mt-dado-valor">${d.cpf || '—'}</p>
          </div>
          ${d.unidade ? `<div class="mt-dado-item">
            <p class="mt-dado-rotulo">Unidade</p>
            <p class="mt-dado-valor">${d.unidade}</p>
          </div>` : ''}
          ${d.categoria ? `<div class="mt-dado-item">
            <p class="mt-dado-rotulo">Categoria</p>
            <p class="mt-dado-valor">${
              d.categoria === 'servidores' ? 'Servidor Público' :
              d.categoria === 'cidadaos'   ? 'Cidadão' : d.categoria
            }</p>
          </div>` : ''}
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
      Eu, <strong id="${id}-t-nome">${d.nome || '_______________'}</strong>, portador(a) do CPF
      <strong id="${id}-t-cpf">${d.cpf || '___.___.___-__'}</strong>, participante da equipe inscrita no
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

    document.getElementById('mt-corpo-aba').innerHTML = html;

    /* Inicializar canvas */
    const canvas = document.getElementById(id + '-canvas');
    canvases[idx] = canvas;
    const ctx = canvas.getContext('2d');
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
      const r  = canvas.getBoundingClientRect();
      const sx = canvas.width  / r.width;
      const sy = canvas.height / r.height;
      if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }
    function tracar(p) { ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke(); }

    canvas.addEventListener('mousedown',  e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove',  e => { if (!drawing) return; tracar(getPos(e)); });
    canvas.addEventListener('mouseup',    () => drawing = false);
    canvas.addEventListener('mouseleave', () => drawing = false);

    /* Eventos do canvas — touch */
    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!drawing) return; tracar(getPos(e)); }, { passive: false });
    canvas.addEventListener('touchend',   () => drawing = false);

    /* Atualizar texto do termo ao digitar nos campos manuais */
    if (!temDados) {
      const inNome = document.getElementById(id + '-inp-nome');
      const inCpf  = document.getElementById(id + '-inp-cpf');
      if (inNome) inNome.addEventListener('input', () => {
        document.getElementById(id + '-t-nome').textContent = inNome.value || '_______________';
      });
      if (inCpf) inCpf.addEventListener('input', () => {
        inCpf.value = formatCPF(inCpf.value);
        document.getElementById(id + '-t-cpf').textContent = inCpf.value || '___.___.___-__';
      });
    }

    atualizarUI();
  }

  /* ── LIMPAR CANVAS ────────────────────────────────────────── */
  function limparCanvas(idx) {
    if (ctxs[idx]) ctxs[idx].clearRect(0, 0, canvases[idx].width, canvases[idx].height);
  }

  /* ── NAVEGAÇÃO ENTRE ABAS ─────────────────────────────────── */
  function irParaAba(idx) {
    abaAtual = idx;
    document.querySelectorAll('.mt-aba').forEach((b, i) => b.classList.toggle('ativa', i === idx));
    document.getElementById('mt-btn-voltar').style.display  = idx > 0 ? 'flex' : 'none';
    document.getElementById('mt-btn-avancar').textContent   = idx < 2 ? 'Próximo →' : '✅ Gerar PDF';
    atualizarProgresso();
    renderAba(idx);
  }

  function voltarAba() {
    if (abaAtual > 0) irParaAba(abaAtual - 1);
  }

  function atualizarProgresso() {
    const pct = Math.round(((abaAtual + 1) / 3) * 100);
    document.getElementById('mt-prog-fill').style.width    = pct + '%';
    document.getElementById('mt-prog-texto').textContent   = `Participante ${abaAtual + 1} de 3`;
  }

  function atualizarUI() {
    atualizarProgresso();
    assinados.forEach((ok, i) => {
      const ch = document.getElementById('aba-check-' + i);
      if (ch) ch.classList.toggle('ok', ok);
    });
  }

  /* ── VALIDAR ABA ──────────────────────────────────────────── */
  function validarAba(idx) {
    const id     = 'p' + idx;
    const erroEl = document.getElementById(id + '-erro');
    erroEl.style.display = 'none';

    const d        = puxarDados(idx);
    const temDados = !!(d.nome || d.cpf);

    let nome = d.nome, cpf = d.cpf, unidade = d.unidade, categoria = d.categoria;

    if (!temDados) {
      nome      = (document.getElementById(id + '-inp-nome')?.value      || '').trim();
      cpf       = (document.getElementById(id + '-inp-cpf')?.value       || '').trim();
      unidade   = (document.getElementById(id + '-inp-unidade')?.value   || '').trim();
      categoria = (document.getElementById(id + '-inp-categoria')?.value || '');
    }

    if (!nome)                                       { erroEl.textContent = 'Informe o nome completo.';  erroEl.style.display = 'block'; return false; }
    if (!cpf || cpf.replace(/\D/g,'').length < 11)  { erroEl.textContent = 'Informe o CPF completo.';   erroEl.style.display = 'block'; return false; }
    if (isCanvasVazio(idx))                          { erroEl.textContent = 'Assine no campo acima.';    erroEl.style.display = 'block'; return false; }

    const chk = document.getElementById(id + '-chk');
    if (!chk?.checked) { erroEl.textContent = 'Marque a concordância com os termos.'; erroEl.style.display = 'block'; return false; }

    dados[idx] = { nome, cpf, unidade, categoria, data: getData(), _sigImg: canvases[idx].toDataURL('image/png') };
    assinados[idx] = true;
    document.getElementById('aba-check-' + idx)?.classList.add('ok');

    return true;
  }

  /* ── AVANÇAR OU GERAR ─────────────────────────────────────── */
  function avancarOuGerar() {
    if (!validarAba(abaAtual)) return;
    if (abaAtual < 2) irParaAba(abaAtual + 1);
    else gerarPDF();
  }

  /* ── GERAR PDF ────────────────────────────────────────────── */
  function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, ml = 20, mr = 20, tw = W - ml - mr;

    dados.forEach((d, idx) => {
      if (idx > 0) doc.addPage();

      const catLabel =
        d.categoria === 'servidores' ? 'Servidor Público Municipal' :
        d.categoria === 'cidadaos'   ? 'Cidadão' : (d.categoria || '');

      /* Cabeçalho */
      doc.setFont('helvetica', 'bold').setFontSize(12);
      doc.text('TERMO DE RESPONSABILIDADE — ANEXO V', W / 2, 22, { align: 'center' });
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(100, 100, 100);
      doc.text('II Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná — Prêmio "Chico Florenzano" 2026', W / 2, 28, { align: 'center' });
      doc.setTextColor(0, 0, 0).setDrawColor(200, 200, 200);
      doc.line(ml, 32, W - mr, 32);

      /* Badge participante */
      doc.setFillColor(26, 122, 74);
      doc.roundedRect(ml, 36, 60, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(255, 255, 255);
      doc.text(`Integrante ${idx + 1} de 3 — ${PARTICIPANTES[idx].label}`, ml + 30, 41, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      /* Box de dados */
      let y = 50;
      doc.setFillColor(245, 250, 247).setDrawColor(187, 247, 208);
      doc.roundedRect(ml, y, tw, 28, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(107, 114, 128);
      doc.text('DADOS DO PARTICIPANTE', ml + 4, y + 5);

      doc.setFontSize(9).setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal').text('Nome:', ml + 4, y + 12);
      doc.setFont('helvetica', 'bold').text(d.nome || '—', ml + 22, y + 12);
      doc.setFont('helvetica', 'normal').text('CPF:', ml + 4, y + 18);
      doc.setFont('helvetica', 'bold').text(d.cpf || '—', ml + 22, y + 18);

      if (catLabel) {
        doc.setFont('helvetica', 'normal').text('Categoria:', ml + 4, y + 24);
        doc.setFont('helvetica', 'bold').text(catLabel, ml + 26, y + 24);
      }
      if (d.unidade) {
        doc.setFont('helvetica', 'normal').text('Unidade:', ml + 80, y + 12);
        doc.setFont('helvetica', 'bold').text(doc.splitTextToSize(d.unidade, 50)[0], ml + 100, y + 12);
      }
      doc.setFont('helvetica', 'normal').text('Data:', ml + 80, y + 18);
      doc.setFont('helvetica', 'bold').text(d.data, ml + 95, y + 18);

      y += 36;

      /* Corpo do termo */
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(31, 41, 55);
      doc.text('DECLARAÇÃO DE RESPONSABILIDADE', ml, y);
      y += 6;

      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(55, 65, 81);
      const corpo = doc.splitTextToSize(
        `Eu, ${d.nome || '_______________'}, portador(a) do CPF ${d.cpf || '___.___.___-__'}, participante da equipe inscrita no II Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná — Prêmio "Chico Florenzano" 2026, declaro, para os devidos fins, que estou ciente das normas e condições estabelecidas no Edital do certame, comprometendo-me a cumprir todas as regras previstas, bem como a zelar pela integridade das informações prestadas.\n\nDeclaro ainda que as informações fornecidas são verdadeiras e assumo total responsabilidade por eventuais irregularidades cometidas ou informações inverídicas prestadas durante o processo seletivo.\n\nA presente declaração é firmada de forma voluntária e com plena consciência das responsabilidades legais dela decorrentes, nos termos da legislação vigente.`,
        tw
      );
      doc.text(corpo, ml, y);
      y += corpo.length * 4.8 + 10;

      /* Assinatura */
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(31, 41, 55);
      doc.text('ASSINATURA DIGITAL DO PARTICIPANTE', ml, y);
      y += 4;

      doc.setDrawColor(209, 213, 219).setFillColor(249, 250, 251);
      doc.roundedRect(ml, y, 85, 35, 2, 2, 'FD');
      if (d._sigImg) doc.addImage(d._sigImg, 'PNG', ml + 2, y + 2, 81, 30);

      y += 37;
      doc.setDrawColor(31, 41, 55).line(ml, y, ml + 85, y);
      y += 3;
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(55, 65, 81).text(d.nome || '', ml, y);
      y += 4;
      doc.setTextColor(107, 114, 128).setFontSize(7.5);
      doc.text(`Assinatura eletrônica gerada em ${d.data} — validade conforme Lei nº 14.063/2020.`, ml, y, { maxWidth: tw });

      /* Rodapé */
      doc.setDrawColor(209, 213, 219).line(ml, 282, W - mr, 282);
      doc.setFontSize(7.5).setTextColor(150, 150, 150);
      doc.text(`Página ${idx + 1} de 3 · Documento eletrônico — sem necessidade de assinatura manuscrita.`, W / 2, 287, { align: 'center' });
    });

    pdfBlob = doc.output('blob');

    const nomeResp = (dados[0].nome || 'equipe').replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
    const nomeArq  = `termo-responsabilidade-${nomeResp}.pdf`;

    injetarArquivo(pdfBlob, nomeArq);

    document.getElementById('mt-tela-form').style.display = 'none';
    document.getElementById('mt-tela-ok').style.display   = 'block';
    document.getElementById('mt-ok-nome-arquivo').textContent = nomeArq;
    document.getElementById('mt-btn-baixar-ok').onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a   = document.createElement('a');
      a.href = url; a.download = nomeArq; a.click();
      URL.revokeObjectURL(url);
    };
  }

  /* ── INJETAR NO INPUT DE UPLOAD ───────────────────────────── */
  function injetarArquivo(blob, nome) {
    const file = new File([blob], nome, { type: 'application/pdf' });
    for (const s of ['#arquivo-termo', '[name="arquivo_termo"]']) {
      try {
        const el = document.querySelector(s);
        if (!el) continue;
        const dt = new DataTransfer();
        dt.items.add(file);
        el.files = dt.files;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        const nomEl = document.getElementById('nome-arquivo-termo');
        if (nomEl) { nomEl.textContent = '✅ ' + nome; nomEl.style.display = 'block'; }
        break;
      } catch (e) { /* segue */ }
    }
  }

  /* ── ABRIR MODAL ──────────────────────────────────────────── */
  window.abrirModalTermo = function () {
    abaAtual  = 0;
    assinados = [false, false, false];
    canvases  = [null, null, null];
    ctxs      = [null, null, null];
    dados     = [{}, {}, {}];
    pdfBlob   = null;

    document.getElementById('mt-tela-form').style.display = 'block';
    document.getElementById('mt-tela-ok').style.display   = 'none';
    document.querySelectorAll('.mt-aba').forEach((b, i) => b.classList.toggle('ativa', i === 0));
    [0, 1, 2].forEach(i => document.getElementById('aba-check-' + i)?.classList.remove('ok'));
    document.getElementById('mt-btn-voltar').style.display  = 'none';
    document.getElementById('mt-btn-avancar').textContent   = 'Próximo →';
    document.getElementById('modal-termo-overlay').classList.add('aberto');
    renderAba(0);
  };

  /* ── FECHAR MODAL ─────────────────────────────────────────── */
  window.fecharModalTermo = function () {
    document.getElementById('modal-termo-overlay').classList.remove('aberto');
  };

  /* Fechar ao clicar fora */
  document.getElementById('modal-termo-overlay')?.addEventListener('click', function (e) {
    if (e.target === this) fecharModalTermo();
  });

  /* ── EXPOR FUNÇÕES GLOBAIS (usadas pelo HTML inline) ─────── */
  window.irParaAba      = irParaAba;
  window.voltarAba      = voltarAba;
  window.avancarOuGerar = avancarOuGerar;
  window.limparCanvas   = limparCanvas;

})();