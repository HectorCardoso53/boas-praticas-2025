/**
 * functions/index.js
 * Cloud Function v2 – firebase-functions >= 5.x
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

function criarTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function templateEmail(dados) {
  const {
    nome_responsavel,
    email_responsavel,
    categoria,
    titulo_iniciativa,
    unidade_responsavel,
  } = dados;
  const catLabel =
    categoria === "servidores" ? "Servidores Públicos Municipais" : "Cidadãos";

  return {
    from: process.env.EMAIL_FROM,
    to: email_responsavel,
    subject: "✅ Inscrição confirmada – II Concurso de Boas Práticas 2026",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#001b3d;padding:28px 32px;border-bottom:4px solid #ffd21f;">
            <table width="100%"><tr>
              <td><p style="margin:0;color:#fff;font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:1px;">Prefeitura Municipal de Oriximiná</p>
                  <p style="margin:4px 0 0;color:#fff;font-size:17px;font-weight:bold;">Concurso de Boas Práticas</p></td>
              <td align="right"><span style="background:rgba(255,210,31,.2);border:1px solid rgba(255,210,31,.4);color:#ffd21f;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;">2026</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:36px 32px 20px;">
            <img src="https://boaspraticas.oriximina.pa.gov.br/src/img/prefeitura_oriximina.png" 
     alt="Prefeitura de Oriximiná"
     style="height:72px;margin-bottom:10px;">
            <h1 style="margin:20px 0 8px;color:#001b3d;font-size:22px;">Inscrição Confirmada!</h1>
            <p style="margin:0;color:#555;font-size:15px;">Sua participação foi registrada com sucesso.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" style="background:#f4f6f8;border-radius:8px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 16px;color:#001b3d;font-size:13px;font-weight:700;text-transform:uppercase;">Dados da Inscrição</p>
                <table width="100%">
                  <tr><td style="padding:6px 0;color:#666;font-size:13px;width:40%;">Responsável</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${nome_responsavel}</td></tr>
                  <tr><td style="padding:6px 0;color:#666;font-size:13px;">Categoria</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${catLabel}</td></tr>
                  ${unidade_responsavel ? `<tr><td style="padding:6px 0;color:#666;font-size:13px;">Unidade</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${unidade_responsavel}</td></tr>` : ""}
                  <tr><td style="padding:6px 0;color:#666;font-size:13px;">Ideia</td><td style="padding:6px 0;color:#001b3d;font-size:13px;font-weight:700;">${titulo_iniciativa}</td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <p style="margin:0 0 12px;color:#001b3d;font-size:14px;font-weight:700;">Próximos passos</p>
            <p style="margin:0 0 8px;color:#555;font-size:13px;line-height:1.6;">📋 Sua inscrição será avaliada na fase de <strong>Habilitação</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;">
            <p style="margin:0;color:#999;font-size:11px;">🔒 Dados tratados conforme a LGPD (Lei nº 13.709/2018).</p>
          </td>
        </tr>
        <tr>
          <td style="background:#001428;padding:16px 32px;">
            <table width="100%"><tr>
              <td><p style="margin:0;color:#fff;font-size:12px;font-weight:600;">Prefeitura Municipal de Oriximiná</p>
                  <p style="margin:2px 0 0;color:rgba(255,255,255,.6);font-size:11px;">Secretaria Municipal de Eficiência Governamental – SEMEG</p></td>
              <td align="right"><p style="margin:0;color:rgba(255,255,255,.4);font-size:10px;">A transformação não para</p></td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

exports.enviarEmailInscricao = onDocumentCreated(
  { document: "inscricoes/{docId}", region: "us-east1" },
  async (event) => {
    const dados = event.data?.data();
    if (!dados?.email_responsavel) {
      console.warn("Inscrição sem e-mail:", event.params.docId);
      return null;
    }
    try {
      const transporter = criarTransporter();
      const info = await transporter.sendMail(templateEmail(dados));
      console.log(
        "E-mail enviado:",
        info.messageId,
        "→",
        dados.email_responsavel,
      );
      return null;
    } catch (err) {
      console.error("Erro ao enviar e-mail:", err);
      throw err;
    }
  },
);
