const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const sendActivationEmail = async (email, token) => {
  const url = `${process.env.APP_URL}/confirm-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Activa tu cuenta en AppCenar',
    html: `<h2>Bienvenido a AppCenar</h2><p>Haz clic para activar tu cuenta:</p><a href="${url}">${url}</a>`,
  });
};

const sendResetPasswordEmail = async (email, token) => {
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Restablecer contraseña - AppCenar',
    html: `<h2>Restablecer contraseña</h2><p>Haz clic para cambiar tu contraseña:</p><a href="${url}">${url}</a>`,
  });
};

module.exports = { sendActivationEmail, sendResetPasswordEmail };
