const axios = require('axios');

const sendMail = async (to, subject, html) => {
  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: 'AppCenar', email: 'geraldlara537@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
  });
};

const sendActivationEmail = async (email, token) => {
  const url = `${process.env.APP_URL}/confirm-email?token=${token}`;
  await sendMail(
    email,
    'Activa tu cuenta en AppCenar',
    `<h2>Bienvenido a AppCenar</h2><p>Haz clic para activar tu cuenta:</p><a href="${url}">${url}</a>`
  );
};

const sendResetPasswordEmail = async (email, token) => {
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  await sendMail(
    email,
    'Restablecer contraseña - AppCenar',
    `<h2>Restablecer contraseña</h2><p>Haz clic para cambiar tu contraseña:</p><a href="${url}">${url}</a>`
  );
};

module.exports = { sendActivationEmail, sendResetPasswordEmail };
