# Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná

Sistema web institucional do **Concurso de Boas Práticas e Inovação na Gestão Pública de Oriximiná**, iniciativa da Prefeitura Municipal de Oriximiná por meio da Secretaria Municipal de Eficiência Governamental (SEMEG).

Acesso público: [boaspraticas.oriximina.pa.gov.br](https://boaspraticas.oriximina.pa.gov.br)

---

## Visão Geral

O sistema reúne as edições do concurso em um único portal. Cada edição possui páginas de regulamento, inscrição, acompanhamento dos projetos e resultados. O backend é gerenciado pelo Firebase (Firestore + Storage + Cloud Functions). O frontend é HTML/CSS/JS puro, sem framework.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Backend | Firebase Firestore, Firebase Storage |
| Funções serverless | Firebase Cloud Functions v2 (Node.js) |
| E-mail transacional | Nodemailer + Gmail SMTP |
| Geração de PDF (termos) | jsPDF (browser) |
| Ícones | Bootstrap Icons 1.11 (CDN) |
| Hospedagem | VPS Nginx (`/var/www/boaspraticas`) |
| Versionamento | Git + GitHub |

---

## Estrutura de Pastas

```
/
├── index.html                        # Página inicial (home)
├── firebase.json                     # Configuração Firebase (functions + firestore)
├── firestore.rules                   # Regras de segurança do Firestore
├── package.json                      # Dependências (firebase SDK)
│
├── boas praticas 2025/               # Edição 2025 (concluída)
│   ├── projetos-2025.html            # Hub da edição 2025
│   ├── regulamento-2025.html         # Documentos e edital 2025
│   ├── acompanhamento-2025.html      # Projetos inscritos e resultados
│   ├── inscritos-2025.html           # Lista de inscritos
│   └── projeto-2025.html             # Página individual de projeto
│
├── boas praticas 2026/               # Edição 2026 (em andamento)
│   ├── projetos-2026.html            # Hub da edição 2026
│   ├── regulamento-2026.html         # Documentos e edital 2026
│   ├── inscricao-2026.html           # Formulário de inscrição
│   ├── faq-2026.html                 # Perguntas frequentes
│   ├── acompanhamento-2026.html      # Projetos inscritos (em breve)
│   ├── inscritos-2026.html           # Lista de inscritos
│   └── admin-2026.html               # Painel administrativo (acesso restrito)
│
├── css/
│   ├── main.css                      # Ponto de entrada (imports)
│   ├── base/
│   │   ├── reset.css
│   │   ├── variables.css             # Variáveis CSS (cores, fontes)
│   │   └── typography.css
│   ├── layout/
│   │   ├── header.css
│   │   ├── banner.css                # Banners por edição (.banner-home, .banner-2025, .banner-2026)
│   │   ├── container.css
│   │   └── footer.css
│   ├── components/
│   │   ├── buttons.css
│   │   ├── cards.css                 # Cards de ações do concurso
│   │   ├── documents.css
│   │   ├── dropdown.css              # Menu de edições
│   │   ├── podium.css                # Selos de pódio (1º, 2º, 3º)
│   │   ├── termo-modal.css           # Modal do Termo de Compromisso
│   │   └── termo-menor-modal.css     # Modal do Termo de Menor
│   ├── pages/
│   │   ├── home.css
│   │   ├── projetos.css
│   │   ├── regulamento.css
│   │   ├── acompanhamento.css
│   │   ├── inscricao.css
│   │   ├── inscricao-2026.css
│   │   └── faq.css
│   └── responsive/
│       └── responsive.css            # Breakpoints: 768px (tablet) e 480px (mobile)
│
├── js/
│   ├── menu.js                       # Dropdown de edições (toggle)
│   ├── projetos.js                   # Lightbox e listagem de projetos 2025
│   ├── inscricao-2026.js             # Formulário de inscrição 2026 (Firebase)
│   ├── termo-modal.js                # Geração do Termo de Compromisso (jsPDF)
│   └── termo-menor-modal.js          # Geração do Termo de Menor (jsPDF)
│
├── functions/
│   ├── index.js                      # Cloud Function: e-mail de confirmação ao inscrever
│   ├── package.json
│   └── .env                          # Credenciais de e-mail (não versionado)
│
├── config/
│   ├── firebase-config.js            # Configuração do Firebase SDK (não versionado)
│   └── firebase-config.example.js    # Exemplo de configuração
│
├── pdf/
│   ├── regulamentos_2025/            # PDFs do regulamento 2025
│   ├── acompanhamento_2025/          # PDFs de resultados 2025
│   ├── projetos_2025/                # PDFs dos projetos 2025
│   └── ...                           # Pastas equivalentes para 2026
│
└── src/
    ├── img/                          # Logos e banners
    │   ├── prefeitura_oriximina.png
    │   ├── BANNER-1.png              # Banner edição 2025
    │   └── BANNER_2.png              # Banner edição 2026
    └── projetos/                     # Fotos dos projetos inscritos 2025
        ├── primeiro/
        ├── segundo/
        └── ...
```

---

## Funcionalidades por Edição

### Edição 2025 (concluída)
- Regulamento com PDFs linkados (edital, portarias, cronograma)
- Galeria de projetos inscritos com lightbox de fotos
- Página de acompanhamento com resultados e documentos

### Edição 2026 (em andamento)
- Regulamento com EDITAL 001/2026 e Anexos I ao V
- Formulário de inscrição com:
  - Seleção de categoria (Servidores Públicos ou Sociedade)
  - Cadastro de 3 integrantes com validação de CPF, idade e e-mail duplicado
  - Upload de documentos (descrição, evidências, Termo de Compromisso, comprovante de residência)
  - Geração de Termo de Compromisso no browser via jsPDF
  - Bloco condicional para menores de 18 anos (Categoria Sociedade)
  - Comprovante de residência obrigatório para Categoria Sociedade
  - Envio para Firestore + Firebase Storage
  - E-mail de confirmação automático via Cloud Function
- FAQ com 19 perguntas frequentes
- Painel administrativo (`admin-2026.html`) com senha de acesso

---

## Painel Administrativo

Acesso: `/boas%20praticas%202026/admin-2026.html`

Funcionalidades:
- Visualização de todas as inscrições por categoria
- Detalhamento individual de cada inscrição
- Download dos documentos enviados (via links do Firebase Storage)

A senha está definida em `admin-2026.html` na constante `SENHA`.

---

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/HectorCardoso53/boas-praticas-2025.git
cd boas-praticas-2025
```

### 2. Configurar Firebase

Copie o arquivo de exemplo e preencha com as credenciais do projeto Firebase:

```bash
cp config/firebase-config.example.js config/firebase-config.js
```

Edite `config/firebase-config.js` com os dados do console Firebase (`boaspraticas`).

### 3. Configurar Cloud Functions

```bash
cd functions
cp .env.example .env  # ou crie manualmente
```

Variáveis necessárias no `functions/.env`:
```
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

### 4. Instalar dependências e fazer deploy das functions

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only functions
```

### 5. Servidor local

Use o Live Server do VS Code ou qualquer servidor HTTP estático na raiz do projeto. O site usa caminhos absolutos (ex: `/css/main.css`), portanto **não funciona abrindo o `index.html` diretamente no navegador** — é necessário um servidor.

```
http://127.0.0.1:5500/
```

---

## Deploy na VPS

O site é servido por Nginx em `/var/www/boaspraticas`. Para atualizar após push no GitHub:

```bash
ssh root@srv1592401
cd /var/www/boaspraticas
git pull origin main
```

---

## Fluxo de Inscrição 2026

```
Candidato acessa inscricao-2026.html
  → Seleciona categoria (Servidores / Sociedade)
  → Preenche dados dos 3 integrantes
  → Descreve a iniciativa
  → Justifica critérios (Inovação / Economicidade / Aplicabilidade)
  → Gera e assina o Termo de Compromisso (jsPDF, no browser)
  → Faz upload dos documentos obrigatórios
      • Termo de Compromisso assinado
      • Comprovante de residência (somente Sociedade)
      • Termo de Menor, se aplicável
  → Envia formulário
      → Firestore salva a inscrição
      → Firebase Storage armazena os arquivos
      → Cloud Function dispara e-mail de confirmação
```

---

## Categorias do Concurso

| Categoria | Público-alvo |
|---|---|
| Servidores Públicos Municipais | Servidores em exercício na administração direta e indireta |
| Sociedade | Pessoas físicas com 16+ anos, residentes ou atuantes em Oriximiná |

Premiação (por categoria): 1º R$ 10.000 · 2º R$ 8.000 · 3º R$ 5.000

---

## Responsivo

O layout foi projetado com dois breakpoints:

- **≤ 768px** — tablet / mobile landscape: header empilhado, grid de cards em coluna única, banners reduzidos
- **≤ 480px** — mobile portrait: ajustes de tipografia, uploads em coluna, stepper simplificado

---

## Variáveis CSS Principais

Definidas em `css/base/variables.css`:

```css
--azul-principal      /* Azul institucional */
--amarelo-destaque    /* Amarelo de destaque */
--cinza-texto         /* Cor padrão de texto */
--branco              /* Fundo de cards */
```

---

## Responsáveis

**SEMEG – Secretaria Municipal de Eficiência Governamental**
Prefeitura Municipal de Oriximiná – PA

Contato: semeg.pmo@oriximina.pa.gov.br
