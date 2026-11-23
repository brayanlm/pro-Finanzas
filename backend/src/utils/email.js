import nodemailer from 'nodemailer';
import { getConfig } from '../config/env.js';

let transporter;

export const getTransporter = () => {
  if (transporter) return transporter;

  const config = getConfig();

  transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const config = getConfig();
  const transport = getTransporter();

  const mailOptions = {
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
    text
  };

  const info = await transport.sendMail(mailOptions);
  return info;
};

export const sendPasswordResetEmail = async (email, resetToken, name) => {
  const config = getConfig();
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8fafc; border-radius: 12px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">Finanzas App</h1>
        </div>
        <p style="font-size: 16px; color: #475569;">Hola <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #475569;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Restablecer contraseña</a>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">Este enlace expira en <strong>1 hora</strong> y solo puede usarse una vez.</p>
        <p style="font-size: 14px; color: #94a3b8;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© ${new Date().getFullYear()} Finanzas App. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hola ${name},
    
    Recibimos una solicitud para restablecer tu contraseña.
    
    Enlace: ${resetUrl}
    
    Este enlace expira en 1 hora y solo puede usarse una vez.
    Si no solicitaste este cambio, ignora este correo.
  `;

  return sendEmail({
    to: email,
    subject: 'Restablece tu contraseña - Finanzas App',
    html,
    text
  });
};