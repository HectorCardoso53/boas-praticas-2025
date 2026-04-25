  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

    const app = initializeApp({
      apiKey: "AIzaSyB8KDe-VKeRg4WkXBaAY_oipkA_1W55h2I",
      authDomain: "boaspraticas.firebaseapp.com",
      projectId: "boaspraticas",
      storageBucket: "boaspraticas.firebasestorage.app",
      messagingSenderId: "910386630808",
      appId: "1:910386630808:web:fd2b3d2a58527fb5ecc0ed"
    });
    const db = getFirestore(app);
    const storage = getStorage(app);

    /* ── CPF REAL (dígitos verificadores) ── */
    function cpfValido(cpf) {
      const n = cpf.replace(/\D/g, '');
      if (n.length !== 11 || /^(\d)+$/.test(n)) return false;
      let s = 0, r;
      for (let i = 0; i < 9; i++) s += parseInt(n[i]) * (10 - i);
      r = (s * 10) % 11; if (r >= 10) r = 0;
      if (r !== parseInt(n[9])) return false;
      s = 0;
      for (let i = 0; i < 10; i++) s += parseInt(n[i]) * (11 - i);
      r = (s * 10) % 11; if (r >= 10) r = 0;
      return r === parseInt(n[10]);
    }

    /* ── UNICIDADE NO FIRESTORE ── */
    async function cpfJaCadastrado(cpf) {
      const n = cpf.replace(/\D/g, '');
      for (const campo of ['cpf_responsavel', 'integrante2.cpf', 'integrante3.cpf']) {
        const snap = await getDocs(query(collection(db, 'inscricoes'), where(campo, '==', n)));
        if (!snap.empty) return true;
      }
      return false;
    }
    async function emailJaCadastrado(email) {
      const snap = await getDocs(query(collection(db, 'inscricoes'), where('email_responsavel', '==', email.toLowerCase().trim())));
      return !snap.empty;
    }

    /* ── CATEGORIA ── */
    window.selecionarCategoria = function (cat) {
      ['servidores', 'cidadaos'].forEach(c => {
        document.getElementById('card-' + c).classList.toggle('selecionado', c === cat);
        document.getElementById('check-' + c).innerHTML = c === cat ? '<i class="bi bi-check-lg"></i>' : '';
        document.getElementById('cat-' + c).checked = c === cat;
      });
      document.getElementById('erro-categoria').classList.remove('visivel');
      const bloco = document.getElementById('bloco-formulario');
      bloco.classList.add('visivel');
      const nomes = { servidores: 'Servidores Públicos Municipais', cidadaos: 'Cidadãos' };
      document.getElementById('badge-categoria-texto').textContent = 'Categoria: ' + nomes[cat];
      document.getElementById('bloco-unidade-responsavel').style.display = cat === 'servidores' ? 'block' : 'none';
      if (cat !== 'servidores') {
        document.getElementById('unidade-responsavel').value = '';
        document.getElementById('campo-outra-unidade').style.display = 'none';
      }
      ['bloco-unidade-int2', 'bloco-unidade-int3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = cat === 'servidores' ? 'block' : 'none';
      });
      verificarMenor();
      setTimeout(() => {
        document.getElementById('bloco-formulario').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };

    /* ── MUDAR CATEGORIA ── */
    window.mudarCategoria = function () {
      ['servidores', 'cidadaos'].forEach(c => {
        document.getElementById('card-' + c).classList.remove('selecionado');
        document.getElementById('check-' + c).innerHTML = '';
        document.getElementById('cat-' + c).checked = false;
      });
      document.getElementById('bloco-formulario').classList.remove('visivel');
      window.scrollTo({ top: document.querySelector('.form-body').offsetTop - 20, behavior: 'smooth' });
    };

    /* ── MÁSCARAS ── */
    function mascaraCPF(el) {
      let v = el.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      el.value = v;
    }
    function mascaraTel(el) {
      let v = el.value.replace(/\D/g, '').slice(0, 11);
      v = v.length <= 10 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3') : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      el.value = v.trim().replace(/-$/, '');
    }
    document.querySelectorAll('[id^="cpf-"]').forEach(el => el.addEventListener('input', () => mascaraCPF(el)));
    document.getElementById('telefone-responsavel').addEventListener('input', function () { mascaraTel(this); });
    document.getElementById('unidade-responsavel').addEventListener('change', function () {
      document.getElementById('campo-outra-unidade').style.display = this.value === 'outro' ? 'block' : 'none';
    });

    /* ── MENOR DE IDADE ── */
    function verificarMenor() {
      const hoje = new Date();
      const datas = ['nasc-responsavel', 'nasc-int2', 'nasc-int3'].map(id => document.getElementById(id)?.value).filter(Boolean);
      const ehMenor = datas.some(d => {
        const dn = new Date(d); let idade = hoje.getFullYear() - dn.getFullYear();
        const m = hoje.getMonth() - dn.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < dn.getDate())) idade--;
        return idade < 18;
      });
      const cat = document.querySelector('input[name="categoria"]:checked')?.value;
      document.getElementById('bloco-menor-cidadao').style.display = (ehMenor && cat === 'cidadaos') ? 'block' : 'none';
      document.getElementById('bloco-menor-servidor').style.display = (ehMenor && cat === 'servidores') ? 'block' : 'none';
    }
    ['nasc-responsavel', 'nasc-int2', 'nasc-int3'].forEach(id => document.getElementById(id)?.addEventListener('change', verificarMenor));

    /* ── UPLOADS ── */
    [['arquivo-descricao', 'nome-arquivo-descricao'], ['arquivo-evidencias', 'nome-arquivo-evidencias'],
    ['arquivo-termo', 'nome-arquivo-termo'], ['arquivo-termo-menor-cidadao', 'nome-termo-menor-cidadao'],
    ['arquivo-autorizacao-menor', 'nome-autorizacao-menor'], ['arquivo-doc-responsavel-legal', 'nome-doc-responsavel-legal']
    ].forEach(([i, n]) => {
      document.getElementById(i)?.addEventListener('change', function () {
        const el = document.getElementById(n);
        el.textContent = this.files?.[0] ? '✅ ' + this.files[0].name : '';
        el.style.display = this.files?.[0] ? 'block' : 'none';
      });
    });

    /* ── VALIDAÇÃO COMPLETA ── */
    function checar(id, erroId, tipo, msg) {
      const el = document.getElementById(id);
      if (!el) return true;
      const erroEl = document.getElementById(erroId);
      const val = el.value.trim();
      let ok = true;
      if (['texto', 'select'].includes(tipo)) ok = val !== '';
      else if (tipo === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      else if (tipo === 'cpf')   ok = cpfValido(val);
      else if (tipo === 'min200') ok = val.length >= 200 || document.getElementById('arquivo-descricao')?.files.length > 0;
      else if (tipo === 'min100') ok = val.length >= 100;
      el.classList.toggle('campo-erro', !ok);
      if (erroEl) { if (!ok && msg) erroEl.textContent = msg; erroEl?.classList.toggle('visivel', !ok); }
      return ok;
    }

    function validarTudo() {
      let ok = true;
      const cat = document.querySelector('input[name="categoria"]:checked');
      if (!cat) { document.getElementById('erro-categoria').classList.add('visivel'); ok = false; }

      ok = checar('nome-responsavel', 'erro-nome-responsavel', 'texto') && ok;
      ok = checar('cpf-responsavel',  'erro-cpf-responsavel',  'cpf', 'CPF inválido. Verifique os dígitos.') && ok;
      ok = checar('nasc-responsavel', 'erro-nasc-responsavel', 'texto') && ok;
      ok = checar('email-responsavel',    'erro-email-responsavel',    'email') && ok;
      ok = checar('telefone-responsavel', 'erro-telefone-responsavel', 'texto') && ok;
      if (cat?.value === 'servidores') ok = checar('unidade-responsavel', 'erro-unidade-responsavel', 'select') && ok;

      ok = checar('nome-int2', 'erro-nome-int2', 'texto') && ok;
      ok = checar('cpf-int2',  'erro-cpf-int2',  'cpf', 'CPF inválido. Verifique os dígitos.') && ok;
      ok = checar('nasc-int2', 'erro-nasc-int2', 'texto') && ok;
      ok = checar('nome-int3', 'erro-nome-int3', 'texto') && ok;
      ok = checar('cpf-int3',  'erro-cpf-int3',  'cpf', 'CPF inválido. Verifique os dígitos.') && ok;
      ok = checar('nasc-int3', 'erro-nasc-int3', 'texto') && ok;

      /* CPFs duplicados na equipe */
      const cpfIds = ['cpf-responsavel', 'cpf-int2', 'cpf-int3'];
      const cpfs = cpfIds.map(id => document.getElementById(id).value.replace(/\D/g, ''));
      cpfIds.forEach((id, i) => {
        if (cpfs[i].length === 11 && cpfs.filter(c => c === cpfs[i]).length > 1) {
          document.getElementById(id).classList.add('campo-erro');
          const er = document.getElementById('erro-' + id);
          if (er) { er.textContent = 'CPF repetido na equipe.'; er.classList.add('visivel'); }
          ok = false;
        }
      });

      ok = checar('titulo-iniciativa',      'erro-titulo-iniciativa',      'texto') && ok;
      ok = checar('descricao-iniciativa',   'erro-descricao-iniciativa',   'min200') && ok;
      ok = checar('justificativa-criterios','erro-justificativa-criterios','min100') && ok;

      const termo = document.getElementById('arquivo-termo');
      const erroTermo = document.getElementById('erro-arquivo-termo');
      if (!termo?.files?.length) { erroTermo.classList.add('visivel'); ok = false; }
      else erroTermo.classList.remove('visivel');

      if (document.getElementById('bloco-menor-cidadao').style.display !== 'none') {
        const el = document.getElementById('arquivo-termo-menor-cidadao');
        const er = document.getElementById('erro-termo-menor-cidadao');
        if (!el?.files?.length) { er.classList.add('visivel'); ok = false; } else er.classList.remove('visivel');
      }
      if (document.getElementById('bloco-menor-servidor').style.display !== 'none') {
        ['arquivo-autorizacao-menor', 'arquivo-doc-responsavel-legal'].forEach(id => {
          const el = document.getElementById(id), er = document.getElementById('erro-' + id);
          if (!el?.files?.length) { er.classList.add('visivel'); ok = false; } else er.classList.remove('visivel');
        });
      }

      ['check-autoria', 'check-edital', 'check-lgpd'].forEach(id => {
        const el = document.getElementById(id);
        const label = document.getElementById('label-termo-' + id.replace('check-', ''));
        const er = document.getElementById('erro-' + id);
        label?.classList.toggle('checkbox-erro', !el.checked);
        er?.classList.toggle('visivel', !el.checked);
        if (!el.checked) ok = false;
      });

      if (!ok) {
        document.querySelector('.campo-erro, .checkbox-erro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return ok;
    }

    /* ── SUBMIT ── */
    async function uploadArquivo(file, pasta) {
      if (!file) return null;
      const r = ref(storage, pasta + '/' + Date.now() + '_' + file.name);
      await uploadBytes(r, file);
      return getDownloadURL(r);
    }

    document.getElementById('form-inscricao').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validarTudo()) return;

      const btn = document.getElementById('btn-enviar');
      btn.classList.add('carregando'); btn.disabled = true;

      try {
        const cpfResp   = document.getElementById('cpf-responsavel').value.replace(/\D/g, '');
        const emailResp = document.getElementById('email-responsavel').value.toLowerCase().trim();

        /* Unicidade: CPF e e-mail no Firestore */
        const [cpfDup, emailDup] = await Promise.all([
          cpfJaCadastrado(cpfResp),
          emailJaCadastrado(emailResp),
        ]);
        if (cpfDup) {
          const er = document.getElementById('erro-cpf-responsavel');
          document.getElementById('cpf-responsavel').classList.add('campo-erro');
          er.textContent = 'Este CPF já possui uma inscrição registrada.';
          er.classList.add('visivel');
          document.getElementById('cpf-responsavel').scrollIntoView({ behavior: 'smooth', block: 'center' });
          btn.classList.remove('carregando'); btn.disabled = false; return;
        }
        if (emailDup) {
          const er = document.getElementById('erro-email-responsavel');
          document.getElementById('email-responsavel').classList.add('campo-erro');
          er.textContent = 'Este e-mail já possui uma inscrição registrada.';
          er.classList.add('visivel');
          document.getElementById('email-responsavel').scrollIntoView({ behavior: 'smooth', block: 'center' });
          btn.classList.remove('carregando'); btn.disabled = false; return;
        }

        const [urlDesc, urlEvid, urlTermo, urlTermoMenorCidadao, urlAutMenor, urlDocLegal] = await Promise.all([
          uploadArquivo(document.getElementById('arquivo-descricao').files[0], 'descricoes'),
          uploadArquivo(document.getElementById('arquivo-evidencias').files[0], 'evidencias'),
          uploadArquivo(document.getElementById('arquivo-termo').files[0], 'termos'),
          uploadArquivo(document.getElementById('arquivo-termo-menor-cidadao').files[0], 'menores'),
          uploadArquivo(document.getElementById('arquivo-autorizacao-menor').files[0], 'menores'),
          uploadArquivo(document.getElementById('arquivo-doc-responsavel-legal').files[0], 'menores'),
        ]);

        await addDoc(collection(db, 'inscricoes'), {
          categoria:            document.querySelector('input[name="categoria"]:checked')?.value,
          nome_responsavel:     document.getElementById('nome-responsavel').value,
          cpf_responsavel:      cpfResp,
          nasc_responsavel:     document.getElementById('nasc-responsavel').value,
          email_responsavel:    emailResp,
          telefone_responsavel: document.getElementById('telefone-responsavel').value,
          unidade_responsavel:  document.getElementById('unidade-responsavel').value,
          outra_unidade:        document.getElementById('outra-unidade').value,
          integrante2: { nome: document.getElementById('nome-int2').value, cpf: document.getElementById('cpf-int2').value.replace(/\D/g,''), nasc: document.getElementById('nasc-int2').value, unidade: document.getElementById('unidade-int2').value },
          integrante3: { nome: document.getElementById('nome-int3').value, cpf: document.getElementById('cpf-int3').value.replace(/\D/g,''), nasc: document.getElementById('nasc-int3').value, unidade: document.getElementById('unidade-int3').value },
          titulo_iniciativa:       document.getElementById('titulo-iniciativa').value,
          descricao_iniciativa:    document.getElementById('descricao-iniciativa').value,
          evidencias:              document.getElementById('evidencias').value,
          justificativa_criterios: document.getElementById('justificativa-criterios').value,
          urlDesc, urlEvid, urlTermo, urlTermoMenorCidadao, urlAutMenor, urlDocLegal,
          criadoEm: new Date()
        });

        document.getElementById('modal-sucesso').classList.add('ativo');
        this.reset();
        ['servidores', 'cidadaos'].forEach(c => {
          document.getElementById('card-' + c).classList.remove('selecionado');
          document.getElementById('check-' + c).innerHTML = '';
        });
        document.querySelectorAll('.upload-nome').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
        ['bloco-unidade-responsavel', 'campo-outra-unidade', 'bloco-menor-cidadao', 'bloco-menor-servidor', 'bloco-formulario']
          .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; });
        document.getElementById('bloco-formulario').classList.remove('visivel');
      } catch (err) {
        console.error(err);
        alert('Erro ao enviar. Verifique sua conexão e tente novamente.Se o problema persistir, entre em contato com a SEMEG.');
      } finally {
        btn.classList.remove('carregando'); btn.disabled = false;
      }
    });

    window.fecharModal = function () {
      document.getElementById('modal-sucesso').classList.remove('ativo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.getElementById('modal-sucesso').addEventListener('click', function (e) { if (e.target === this) fecharModal(); });