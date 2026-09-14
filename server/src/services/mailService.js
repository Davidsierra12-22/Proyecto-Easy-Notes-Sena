const { Resend } = require('resend');

const { RESEND_API_KEY, MAIL_FROM } = process.env;

const configurado = !!RESEND_API_KEY;

let resend = null;
if (configurado) {
  resend = new Resend(RESEND_API_KEY);
}

const remitente = MAIL_FROM || 'EasyNotes <onboarding@resend.dev>';

const plantillaRecuperacion = ({ nombre, enlace, expira = '1 hora', institucion = 'EasyNotes' }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#2196f3;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">${institucion}</h1>
              <p style="margin:4px 0 0;color:#e3f2fd;font-size:13px;">Sistema de Gestión Académica</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola ${nombre}:</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
                Recibimos una solicitud para recuperar la contraseña de tu cuenta. Para continuar, haz clic en el siguiente botón:
              </p>
              <p align="center" style="margin:24px 0;">
                <a href="${enlace}" style="background:#2196f3;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;display:inline-block;">
                  Restablecer mi contraseña
                </a>
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Este enlace expira en ${expira}. Si no lo solicitaste, ignora este correo.</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">Si el botón no funciona, copia y pega esta dirección en tu navegador:</p>
              <p style="margin:4px 0 0;color:#2196f3;font-size:12px;word-break:break-all;">${enlace}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:16px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const enviarEmail = async ({ to, subject, html }) => {
  if (!configurado || !resend) {
    const error = new Error('Servicio de correo (Resend) no configurado en el servidor');
    error.codigo = 'RESEND_NO_CONFIGURADO';
    throw error;
  }
  const { data, error } = await resend.emails.send({
    from: remitente,
    to,
    subject,
    html
  });
  if (error) {
    const err = new Error(error.message);
    err.codigo = 'RESEND_ERROR';
    throw err;
  }
  return data;
};

const plantillaCredenciales = ({ nombre, usuario, password, institucion = 'EasyNotes' }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#2196f3;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">${institucion}</h1>
              <p style="margin:4px 0 0;color:#e3f2fd;font-size:13px;">Sistema de Gestión Académica</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola ${nombre}:</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
                Tus credenciales de acceso a la plataforma fueron generadas. Usa los siguientes datos para iniciar sesión:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;border-radius:8px;margin:16px 0;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;color:#6b7280;font-size:13px;">Usuario</p>
                    <p style="margin:2px 0 0;color:#111827;font-size:16px;font-weight:bold;">${usuario}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;color:#6b7280;font-size:13px;">Contraseña temporal</p>
                    <p style="margin:2px 0 0;color:#111827;font-size:16px;font-weight:bold;">${password}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                Por seguridad, al iniciar sesión por primera vez el sistema te pedirá cambiar esta contraseña.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:16px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const enviarCredenciales = async ({ to, nombre, usuario, password, institucion }) => {
  return enviarEmail({
    to,
    subject: 'Credenciales de acceso - EasyNotes',
    html: plantillaCredenciales({ nombre, usuario, password, institucion })
  });
};

const enviarRecuperacion = async ({ to, nombre, enlace, expira, institucion }) => {
  return enviarEmail({
    to,
    subject: 'Recuperación de contraseña - EasyNotes',
    html: plantillaRecuperacion({ nombre, enlace, expira, institucion })
  });
};

module.exports = { enviarEmail, enviarCredenciales, enviarRecuperacion, configurado };