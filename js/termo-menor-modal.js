/* ============================================================
   termo-menor-modal.js
   Modal: Termo de Autorização do Responsável Legal — Anexo V
   Cidadão menor de 18 anos
   Dependência: jsPDF (carregado via CDN no HTML)
   ============================================================ */

(function () {

  /* ── ESTADO ───────────────────────────────────────────────── */
  let canvasMenor = null;
  let ctxMenor    = null;
  let pdfBlobMenor = null;

  /* ── HELPERS ──────────────────────────────────────────────── */
  function getData() {
    return new Date().toLocaleDateString('pt-BR');
  }

  function lerCampo(seletor) {
    try {
      const el = document.querySelector(seletor);
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

  function formatData(v) {
    v = v.replace(/\D/g, '').slice(0, 8);
    if (v.length > 4) return v.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,2})/, '$1/$2');
    return v;
  }

  /* Puxar dados do menor do formulário principal */
  function puxarDadosMenor() {
    /* Identifica integrante(s) menor(es) pelas datas de nascimento */
    const hoje  = new Date();
    const ids   = ['responsavel','int2','int3'];
    const menores = [];

    ids.forEach(key => {
      const prefix = key === 'responsavel' ? '' : '-' + key.replace('int','int');
      const nascId = key === 'responsavel' ? 'nasc-responsavel' : `nasc-${key}`;
      const nomeId = key === 'responsavel' ? 'nome-responsavel' : `nome-${key}`;
      const val    = lerCampo('#' + nascId);
      if (!val) return;
      const dn   = new Date(val);
      let idade  = hoje.getFullYear() - dn.getFullYear();
      const m    = hoje.getMonth() - dn.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < dn.getDate())) idade--;
      if (idade < 18) {
        menores.push({
          nome: lerCampo('#' + nomeId),
          cpf:  lerCampo('#cpf-' + (key === 'responsavel' ? 'responsavel' : key)),
          nasc: dn.toLocaleDateString('pt-BR'),
        });
      }
    });

    return menores;
  }

  function isCanvasMenorVazio() {
    if (!canvasMenor) return true;
    const data = ctxMenor.getImageData(0, 0, canvasMenor.width, canvasMenor.height).data;
    const ctx = canvasMenor.getContext('2d', { willReadFrequently: true });
    for (let i = 3; i < data.length; i += 4) { if (data[i] > 0) return false; }
    return true;
  }

  /* ── RENDERIZAR MODAL ─────────────────────────────────────── */
  function renderModal() {
    const menores  = puxarDadosMenor();
    const hoje     = getData();
    const corpo    = document.getElementById('mn-corpo');
    if (!corpo) return;

    /* Lista de nomes dos menores para exibir no card */
    const listaMenores = menores.length > 0
      ? menores.map(m => m.nome || '—').join(', ')
      : '—';
    const nascMenores = menores.length > 0
      ? menores.map(m => m.nasc || '—').join(', ')
      : '—';

    corpo.innerHTML = `

      <!-- DADOS DO(S) MENOR(ES) — puxados do formulário -->
      <div class="mn-dados-card">
        <div class="mn-dados-label">Dados do(s) participante(s) menor(es) — puxados do formulário</div>
        <div class="mn-dados-grid">
          <div>
            <p class="mn-dado-rotulo">Nome(s) do(s) menor(es)</p>
            <p class="mn-dado-valor" id="mn-disp-menor-nome">${listaMenores}</p>
          </div>
          <div>
            <p class="mn-dado-rotulo">Data(s) de nascimento</p>
            <p class="mn-dado-valor">${nascMenores}</p>
          </div>
          <div>
            <p class="mn-dado-rotulo">Data de preenchimento</p>
            <p class="mn-dado-valor">${hoje}</p>
          </div>
        </div>
      </div>

      <!-- DADOS DO RESPONSÁVEL LEGAL -->
      <p class="mn-secao-titulo">Dados do Responsável Legal</p>

      <div class="mn-campo">
        <label>Nome completo do responsável legal <span style="color:#dc2626;">*</span></label>
        <input type="text" id="mn-resp-nome" placeholder="Nome completo">
      </div>

      <div class="mn-dupla">
        <div class="mn-campo">
          <label>CPF <span style="color:#dc2626;">*</span></label>
          <input type="text" id="mn-resp-cpf" placeholder="000.000.000-00" maxlength="14">
        </div>
        <div class="mn-campo">
          <label>Nº do documento de identificação <span style="color:#dc2626;">*</span></label>
          <input type="text" id="mn-resp-doc" placeholder="RG ou CNH">
        </div>
      </div>

      <div class="mn-campo">
        <label>Endereço completo (rua, número, bairro, cidade) <span style="color:#dc2626;">*</span></label>
        <input type="text" id="mn-resp-endereco" placeholder="Rua, nº — Bairro — Cidade">
      </div>

      <div class="mn-dupla">
        <div class="mn-campo">
          <label>Grau de parentesco <span style="color:#dc2626;">*</span></label>
          <select id="mn-resp-parentesco">
            <option value="">— Selecione —</option>
            <option>Pai</option>
            <option>Mãe</option>
            <option>Tutor(a) legal</option>
            <option>Curador(a)</option>
            <option>Outro responsável legal</option>
          </select>
        </div>
        <div class="mn-campo">
          <label>Telefone <span style="color:#dc2626;">*</span></label>
          <input type="tel" id="mn-resp-tel" placeholder="(93) 9 0000-0000" maxlength="16">
        </div>
      </div>

      <div class="mn-campo">
        <label>E-mail <span style="color:#dc2626;">*</span></label>
        <input type="email" id="mn-resp-email" placeholder="email@exemplo.com">
      </div>

      <!-- MENOR: doc de identificação -->
      <div class="mn-campo" style="margin-top:4px;">
        <label>Nº do documento de identificação do(a) menor <span style="color:#dc2626;">*</span></label>
        <input type="text" id="mn-menor-doc" placeholder="RG ou Certidão de nascimento">
      </div>

      <!-- TEXTO DO TERMO -->
      <p class="mn-secao-titulo" style="margin-top:16px;">Termo de Autorização</p>
      <div class="mn-termo-texto" id="mn-texto-termo">
        Eu, <strong id="mn-t-nome">_______________</strong>, portador(a) do documento de identificação
        nº <strong id="mn-t-doc">_______________</strong>, CPF nº <strong id="mn-t-cpf">___.___.___-__</strong>,
        residente e domiciliado(a) à <strong id="mn-t-end">_______________</strong>, na qualidade de
        responsável legal pelo(a) menor <strong>${listaMenores}</strong>,
        nascido(a) em ${nascMenores}, portador(a) do documento de identificação
        nº <strong id="mn-t-menor-doc">_______________</strong>.
        <br><br>
        <strong>AUTORIZO</strong>, de forma livre, expressa e inequívoca, a participação do(a) menor acima
        identificado(a) no <strong>II Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná
        – Prêmio "Chico Florenzano"</strong>, na Categoria Cidadão, nos termos do Edital nº 001/2026 – SEMEG/PMO.
      </div>

      <!-- DECLARAÇÕES DO TERMO -->
      <div class="mn-declaracoes">
        <p style="font-size:11px;font-weight:600;color:#92400e;margin:0 0 8px;">DECLARO QUE:</p>
        ${[
          'Estou ciente e de acordo com todas as regras estabelecidas no referido edital.',
          'Autorizo a participação do(a) menor em todas as etapas do concurso, incluindo eventuais apresentações públicas (defesa oral/pitch).',
          'Assumo integral responsabilidade civil pelos atos praticados pelo(a) menor no âmbito do concurso.',
          'Tenho conhecimento de que a participação do(a) menor não poderá envolver atividades que ofereçam risco à sua integridade física ou moral.',
          'Estou ciente de que a ausência deste termo e dos documentos exigidos implicará no indeferimento da inscrição.',
          'Autorizo o uso da imagem, voz e nome do(a) menor, bem como da ideia inovadora apresentada, para fins institucionais, educacionais e de divulgação, conforme previsto no edital, sem qualquer ônus para a Administração Pública.',
          'Declaro que as informações prestadas são verdadeiras, estando ciente das responsabilidades legais em caso de falsidade.',
        ].map(d => `
          <div class="mn-declaracao-item">
            <span class="mn-decl-bullet"></span>
            <span>${d}</span>
          </div>
        `).join('')}
      </div>

      <!-- ASSINATURA DIGITAL -->
      <p class="mn-secao-titulo">Assinatura Digital do Responsável Legal</p>
      <div class="mn-canvas-wrap">
        <canvas id="mn-canvas" class="mn-canvas" width="600" height="120"></canvas>
      </div>
      <div class="mn-canvas-actions">
        <span class="mn-canvas-hint">Desenhe com mouse ou dedo</span>
        <button type="button" class="mn-btn-limpar-canvas" onclick="limparCanvasMenor()">Limpar</button>
      </div>

      <!-- CONCORDÂNCIA -->
      <div class="mn-check-linha">
        <input type="checkbox" id="mn-chk-concordo">
        <label for="mn-chk-concordo">
          Concordo com os termos acima e declaro que as informações são verdadeiras.
          Esta assinatura eletrônica tem validade conforme a Lei nº 14.063/2020.
        </label>
      </div>

      <!-- DOCUMENTOS ANEXOS -->
      <p class="mn-secao-titulo" style="margin-top:4px;">Documentos Anexos Obrigatórios</p>
      <div class="mn-campo">
        <label>Documento de identificação do responsável legal <span style="color:#dc2626;">*</span></label>
        <span style="font-size:11px;color:#6b7280;display:block;margin-bottom:4px;">RG, CNH ou outro documento oficial com foto.</span>
        <div class="mn-upload-area">
          <input type="file" id="mn-arquivo-resp" accept=".pdf,.jpg,.jpeg,.png"
            onchange="mnAtualizarNomeArquivo('mn-arquivo-resp','mn-nome-resp')">
          <div class="mn-upload-texto"><strong>Clique para selecionar</strong> o documento</div>
          <div class="mn-upload-nome" id="mn-nome-resp"></div>
        </div>
      </div>
      <div class="mn-campo">
        <label>Documento de identificação do(a) menor <span style="color:#dc2626;">*</span></label>
        <span style="font-size:11px;color:#6b7280;display:block;margin-bottom:4px;">RG, Certidão de Nascimento ou outro documento oficial.</span>
        <div class="mn-upload-area">
          <input type="file" id="mn-arquivo-menor" accept=".pdf,.jpg,.jpeg,.png"
            onchange="mnAtualizarNomeArquivo('mn-arquivo-menor','mn-nome-menor')">
          <div class="mn-upload-texto"><strong>Clique para selecionar</strong> o documento</div>
          <div class="mn-upload-nome" id="mn-nome-menor"></div>
        </div>
      </div>

      <p class="mn-erro" id="mn-erro-geral"></p>
    `;

    /* Inicializar canvas */
    canvasMenor = document.getElementById('mn-canvas');
    ctxMenor    = canvasMenor.getContext('2d');

    let drawing = false;
    function getPos(e) {
      const r  = canvasMenor.getBoundingClientRect();
      const sx = canvasMenor.width  / r.width;
      const sy = canvasMenor.height / r.height;
      if (e.touches) return { x:(e.touches[0].clientX-r.left)*sx, y:(e.touches[0].clientY-r.top)*sy };
      return { x:(e.clientX-r.left)*sx, y:(e.clientY-r.top)*sy };
    }
    function tracar(p) { ctxMenor.lineTo(p.x,p.y); ctxMenor.strokeStyle='#111'; ctxMenor.lineWidth=2; ctxMenor.lineCap='round'; ctxMenor.stroke(); }

    canvasMenor.addEventListener('mousedown',  e => { drawing=true; const p=getPos(e); ctxMenor.beginPath(); ctxMenor.moveTo(p.x,p.y); });
    canvasMenor.addEventListener('mousemove',  e => { if(!drawing) return; tracar(getPos(e)); });
    canvasMenor.addEventListener('mouseup',    () => drawing=false);
    canvasMenor.addEventListener('mouseleave', () => drawing=false);
    canvasMenor.addEventListener('touchstart', e => { e.preventDefault(); drawing=true; const p=getPos(e); ctxMenor.beginPath(); ctxMenor.moveTo(p.x,p.y); }, {passive:false});
    canvasMenor.addEventListener('touchmove',  e => { e.preventDefault(); if(!drawing) return; tracar(getPos(e)); }, {passive:false});
    canvasMenor.addEventListener('touchend',   () => drawing=false);

    /* Atualizar texto do termo em tempo real */
    function bind(id, targetId, transform) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const t = document.getElementById(targetId);
        if (t) t.textContent = transform ? transform(el.value) : (el.value || '_______________');
      });
    }
    bind('mn-resp-nome',      'mn-t-nome',      null);
    bind('mn-resp-doc',       'mn-t-doc',       null);
    bind('mn-resp-endereco',  'mn-t-end',       null);
    bind('mn-menor-doc',      'mn-t-menor-doc', null);
    bind('mn-resp-cpf',       'mn-t-cpf',       v => { document.getElementById('mn-resp-cpf').value = formatCPF(v); return formatCPF(v) || '___.___.___-__'; });

    /* Máscara CPF */
    document.getElementById('mn-resp-cpf')?.addEventListener('input', function() {
      this.value = formatCPF(this.value);
      const t = document.getElementById('mn-t-cpf');
      if (t) t.textContent = this.value || '___.___.___-__';
    });

    /* Máscara telefone */
    document.getElementById('mn-resp-tel')?.addEventListener('input', function() {
      let v = this.value.replace(/\D/g,'').slice(0,11);
      v = v.length <= 10
        ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      this.value = v.trim().replace(/-$/,'');
    });
  }

  /* ── FEEDBACK UPLOAD ──────────────────────────────────────── */
  window.mnAtualizarNomeArquivo = function(inputId, nomeId) {
    const input = document.getElementById(inputId);
    const el    = document.getElementById(nomeId);
    if (!el || !input) return;
    el.textContent   = input.files?.[0] ? '✅ ' + input.files[0].name : '';
    el.style.display = input.files?.[0] ? 'block' : 'none';
  };

  /* ── LIMPAR CANVAS ────────────────────────────────────────── */
  window.limparCanvasMenor = function() {
    if (ctxMenor) ctxMenor.clearRect(0, 0, canvasMenor.width, canvasMenor.height);
  };

  /* ── VALIDAR ──────────────────────────────────────────────── */
  function validar() {
    const erroEl = document.getElementById('mn-erro-geral');
    erroEl.style.display = 'none';

    const campos = [
      ['mn-resp-nome',       'Informe o nome completo do responsável legal.'],
      ['mn-resp-cpf',        'Informe o CPF do responsável legal.'],
      ['mn-resp-doc',        'Informe o documento de identificação do responsável.'],
      ['mn-resp-endereco',   'Informe o endereço do responsável.'],
      ['mn-resp-parentesco', 'Selecione o grau de parentesco.'],
      ['mn-resp-tel',        'Informe o telefone do responsável.'],
      ['mn-resp-email',      'Informe o e-mail do responsável.'],
      ['mn-menor-doc',       'Informe o documento de identificação do(a) menor.'],
    ];

    for (const [id, msg] of campos) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        erroEl.textContent   = msg;
        erroEl.style.display = 'block';
        el?.focus();
        return false;
      }
    }

    const cpf = document.getElementById('mn-resp-cpf').value.replace(/\D/g,'');
    if (cpf.length < 11) {
      erroEl.textContent   = 'Informe o CPF completo do responsável.';
      erroEl.style.display = 'block';
      return false;
    }

    if (isCanvasMenorVazio()) {
      erroEl.textContent   = 'O responsável deve assinar no campo acima.';
      erroEl.style.display = 'block';
      return false;
    }

    if (!document.getElementById('mn-chk-concordo')?.checked) {
      erroEl.textContent   = 'Marque a concordância com os termos.';
      erroEl.style.display = 'block';
      return false;
    }

    if (!document.getElementById('mn-arquivo-resp')?.files?.length) {
      erroEl.textContent   = 'Anexe o documento de identificação do responsável legal.';
      erroEl.style.display = 'block';
      return false;
    }

    if (!document.getElementById('mn-arquivo-menor')?.files?.length) {
      erroEl.textContent   = 'Anexe o documento de identificação do(a) menor.';
      erroEl.style.display = 'block';
      return false;
    }

    return true;
  }

  /* ── GERAR PDF ────────────────────────────────────────────── */
  async function gerarPDFMenor() {
    if (!validar()) return;

    const nome       = document.getElementById('mn-resp-nome').value.trim();
    const cpf        = document.getElementById('mn-resp-cpf').value.trim();
    const doc_resp   = document.getElementById('mn-resp-doc').value.trim();
    const endereco   = document.getElementById('mn-resp-endereco').value.trim();
    const parentesco = document.getElementById('mn-resp-parentesco').value;
    const tel        = document.getElementById('mn-resp-tel').value.trim();
    const email      = document.getElementById('mn-resp-email').value.trim();
    const docMenor   = document.getElementById('mn-menor-doc').value.trim();
    const menores    = puxarDadosMenor();
    const nomeMenor  = menores.map(m => m.nome).join(', ') || '—';
    const nascMenor  = menores.map(m => m.nasc).join(', ') || '—';
    const hoje       = getData();
    const sigImg     = canvasMenor.toDataURL('image/png');

    /* Carregar logo */
    const logoBase64 = await new Promise(resolve => {
      const img = new Image();
      img.src = '/src/img/prefeitura_oriximina.png';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W=210, ml=20, mr=20, tw=W-ml-mr;

    /* ── Header ── */
    doc.setFillColor(146, 64, 14); // marrom âmbar
    doc.rect(0, 0, W, 30, 'F');
    if (logoBase64) doc.addImage(logoBase64, 'PNG', ml, 5, 20, 20);
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold').setFontSize(12);
    doc.text('PREFEITURA DE ORIXIMINÁ', W/2, 11, {align:'center'});
    doc.setFontSize(9).setFont('helvetica','normal');
    doc.text('TERMO DE AUTORIZAÇÃO DO RESPONSÁVEL LEGAL — ANEXO V', W/2, 19, {align:'center'});
    doc.setFontSize(8);
    doc.text('Categoria Cidadão · Participante menor de 18 anos · Edital nº 001/2026 – SEMEG/PMO', W/2, 25, {align:'center'});
    doc.setTextColor(0,0,0);

    /* Linha amarela */
    doc.setDrawColor(245,158,11).setLineWidth(1.5);
    doc.line(ml, 33, W-mr, 33);

    /* ── Dados do responsável ── */
    let y = 38;
    doc.setFillColor(255,248,225).setDrawColor(253,230,138);
    doc.roundedRect(ml, y, tw, 40, 2, 2, 'FD');
    doc.setFont('helvetica','bold').setFontSize(8).setTextColor(146,64,14);
    doc.text('RESPONSÁVEL LEGAL', ml+4, y+5);

    doc.setFont('helvetica','normal').setFontSize(9).setTextColor(0,0,0);
    doc.text('Nome:', ml+4, y+12);
    doc.setFont('helvetica','bold').text(nome, ml+20, y+12);

    doc.setFont('helvetica','normal').text('CPF:', ml+4, y+18);
    doc.setFont('helvetica','bold').text(cpf, ml+16, y+18);

    doc.setFont('helvetica','normal').text('Doc:', ml+70, y+18);
    doc.setFont('helvetica','bold').text(doc_resp, ml+82, y+18);

    doc.setFont('helvetica','normal').text('Parentesco:', ml+4, y+24);
    doc.setFont('helvetica','bold').text(parentesco, ml+30, y+24);

    doc.setFont('helvetica','normal').text('End.:', ml+4, y+30);
    doc.setFont('helvetica','bold').text(doc.splitTextToSize(endereco, tw-30)[0], ml+16, y+30);

    doc.setFont('helvetica','normal').text('Tel:', ml+4, y+36);
    doc.setFont('helvetica','bold').text(tel, ml+14, y+36);
    doc.setFont('helvetica','normal').text('E-mail:', ml+60, y+36);
    doc.setFont('helvetica','bold').text(email, ml+78, y+36);

    y += 46;

    /* ── Dados do menor ── */
    doc.setFillColor(249,250,251).setDrawColor(209,213,219);
    doc.roundedRect(ml, y, tw, 20, 2, 2, 'FD');
    doc.setFont('helvetica','bold').setFontSize(8).setTextColor(55,65,81);
    doc.text('PARTICIPANTE MENOR', ml+4, y+5);

    doc.setFont('helvetica','normal').setFontSize(9).setTextColor(0,0,0);
    doc.text('Nome:', ml+4, y+12);
    doc.setFont('helvetica','bold').text(nomeMenor, ml+20, y+12);
    doc.setFont('helvetica','normal').text('Nasc.:', ml+4, y+18);
    doc.setFont('helvetica','bold').text(nascMenor, ml+18, y+18);
    doc.setFont('helvetica','normal').text('Doc.:', ml+80, y+18);
    doc.setFont('helvetica','bold').text(docMenor, ml+92, y+18);

    y += 26;

    /* ── Texto da autorização ── */
    doc.setFont('helvetica','bold').setFontSize(9).setTextColor(146,64,14);
    doc.text('AUTORIZAÇÃO E DECLARAÇÕES', ml, y);
    y += 5;

    doc.setFont('helvetica','normal').setFontSize(9).setTextColor(55,65,81);
    const textoAuth = doc.splitTextToSize(
      `Eu, ${nome}, portador(a) do documento de identificação nº ${doc_resp}, CPF nº ${cpf}, residente e domiciliado(a) à ${endereco}, na qualidade de responsável legal pelo(a) menor ${nomeMenor}, nascido(a) em ${nascMenor}, portador(a) do documento de identificação nº ${docMenor}, AUTORIZO, de forma livre, expressa e inequívoca, a participação do(a) menor acima identificado(a) no II Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná – Prêmio "Chico Florenzano", na Categoria Cidadão, nos termos do Edital nº 001/2026 – SEMEG/PMO.`,
      tw
    );
    doc.text(textoAuth, ml, y);
    y += textoAuth.length * 4.5 + 4;

    /* Declarações */
    const declaracoes = [
      'Estou ciente e de acordo com todas as regras estabelecidas no referido edital.',
      'Autorizo a participação do(a) menor em todas as etapas do concurso, incluindo eventuais apresentações públicas.',
      'Assumo integral responsabilidade civil pelos atos praticados pelo(a) menor no âmbito do concurso.',
      'Autorizo o uso da imagem, voz e nome do(a) menor para fins institucionais, educacionais e de divulgação.',
      'Declaro que as informações prestadas são verdadeiras, estando ciente das responsabilidades legais em caso de falsidade.',
    ];

    doc.setFont('helvetica','bold').setFontSize(8).setTextColor(146,64,14);
    doc.text('DECLARO QUE:', ml, y); y += 4;

    declaracoes.forEach(d => {
      const linhas = doc.splitTextToSize(`• ${d}`, tw);
      doc.setFont('helvetica','normal').setFontSize(8.5).setTextColor(55,65,81);
      doc.text(linhas, ml, y);
      y += linhas.length * 4.2 + 1;
    });

    y += 4;

    /* ── Local e data ── */
    doc.setFont('helvetica','normal').setFontSize(9).setTextColor(0,0,0);
    doc.text(`Oriximiná – PA, ${hoje}.`, ml, y);
    y += 10;

    /* ── Assinatura ── */
    doc.setFont('helvetica','bold').setFontSize(9).setTextColor(146,64,14);
    doc.text('ASSINATURA DIGITAL DO RESPONSÁVEL LEGAL', ml, y);
    y += 4;

    doc.setDrawColor(209,213,219).setFillColor(249,250,251);
    doc.roundedRect(ml, y, 85, 32, 2, 2, 'FD');
    doc.addImage(sigImg, 'PNG', ml+2, y+2, 81, 28);
    y += 34;

    doc.setDrawColor(0,0,0).line(ml, y, ml+85, y);
    y += 3;
    doc.setFont('helvetica','normal').setFontSize(8).setTextColor(55,65,81);
    doc.text(nome, ml, y);
    y += 4;
    doc.setTextColor(107,114,128).setFontSize(7.5);
    doc.text(`Assinatura eletrônica gerada em ${hoje} — validade conforme Lei nº 14.063/2020.`, ml, y, {maxWidth:tw});

    /* ── Rodapé ── */
    doc.setDrawColor(146,64,14).line(ml, 282, W-mr, 282);
    doc.setFontSize(7.5).setTextColor(146,64,14);
    doc.text('Documento eletrônico — Termo de Autorização do Responsável Legal · Edital nº 001/2026 – SEMEG/PMO', W/2, 287, {align:'center'});

    pdfBlobMenor = doc.output('blob');

    /* ── Injetar no campo de upload do menor ── */
    const nomeArq = `termo-menor-${nome.replace(/[^a-z0-9]/gi,'_').toLowerCase().slice(0,25)}.pdf`;
    injetarArquivoMenor(pdfBlobMenor, nomeArq);

    /* ── Tela de sucesso ── */
    document.getElementById('mn-tela-form').style.display = 'none';
    document.getElementById('mn-tela-ok').style.display   = 'block';
    document.getElementById('mn-ok-nome-arquivo').textContent = nomeArq;
    document.getElementById('mn-btn-baixar-ok').onclick = () => {
      const url = URL.createObjectURL(pdfBlobMenor);
      const a   = document.createElement('a');
      a.href = url; a.download = nomeArq; a.click();
      URL.revokeObjectURL(url);
    };
  }

  /* ── INJETAR NO INPUT DE UPLOAD DO MENOR ─────────────────── */
  function injetarArquivoMenor(blob, nome) {
    const file = new File([blob], nome, {type:'application/pdf'});
    for (const s of ['#arquivo-termo-menor-cidadao', '[name="arquivo_termo_menor_cidadao"]']) {
      try {
        const el = document.querySelector(s);
        if (!el) continue;
        const dt = new DataTransfer();
        dt.items.add(file);
        el.files = dt.files;
        el.dispatchEvent(new Event('change', {bubbles:true}));

        /* Atualiza feedback visual do campo no formulário */
        const uploadArea = el.closest('.upload-area');
        if (uploadArea) {
          uploadArea.style.borderColor = '#1a7a4a';
          uploadArea.style.borderStyle = 'solid';
          uploadArea.style.background  = '#f0fdf4';
          uploadArea.querySelectorAll('.upload-icon,.upload-texto,.upload-nome')
            .forEach(e => e.style.display = 'none');
          const fb = document.createElement('div');
          fb.style.cssText = 'pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;';
          fb.innerHTML = `
            <i class="bi bi-file-earmark-check-fill" style="color:#1a7a4a;font-size:2rem;"></i>
            <div style="color:#1a7a4a;font-weight:600;font-size:.88rem;">${nome}</div>
            <div style="font-size:.78rem;color:#6b7280;">Termo do menor gerado digitalmente</div>
          `;
          uploadArea.insertBefore(fb, el);
        }
        break;
      } catch(e) {}
    }
  }

  /* ── ABRIR MODAL ──────────────────────────────────────────── */
  window.abrirModalMenor = function () {
    canvasMenor   = null;
    ctxMenor      = null;
    pdfBlobMenor  = null;

    document.getElementById('mn-tela-form').style.display = 'block';
    document.getElementById('mn-tela-ok').style.display   = 'none';
    document.getElementById('modal-menor-overlay').classList.add('aberto');
    renderModal();
  };

  /* ── FECHAR MODAL ─────────────────────────────────────────── */
  window.fecharModalMenor = function () {
    document.getElementById('modal-menor-overlay').classList.remove('aberto');
  };

  /* Fechar ao clicar fora */
  document.getElementById('modal-menor-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) fecharModalMenor();
  });

  /* ── EXPOR FUNÇÃO DE GERAR ────────────────────────────────── */
  window.gerarTermoMenor = gerarPDFMenor;

})();