const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const Commerce = require('../models/Commerce');
const CommerceType = require('../models/CommerceType');
const { sendActivationEmail, sendResetPasswordEmail } = require('../services/mail.service');
const { redirectByRole } = require('../middleware/auth.middleware');

const getLogin = (req, res) => res.render('auth/login', { title: 'Login', layout: 'main' });

const postLogin = async (req, res) => {
  try {
    const { userNameOrEmail, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: userNameOrEmail }, { userName: userNameOrEmail }],
    }).populate('role');

    if (!user) return res.render('auth/login', { error: 'Credenciales inválidas.' });
    if (!user.isActive) return res.render('auth/login', { error: 'Tu cuenta está inactiva. Revisa tu correo o contacta un administrador.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render('auth/login', { error: 'Credenciales inválidas.' });

    // Guardar en sesión
    const sessionUser = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      role: user.role.name,
      profileImage: user.profileImage,
    };

    if (user.role.name === 'Commerce') {
      const commerce = await Commerce.findOne({ user: user._id });
      if (commerce) {
        sessionUser.commerceId = commerce._id.toString();
        sessionUser.commerceName = commerce.name;
        sessionUser.logo = commerce.logo;
      }
    }

    req.session.user = sessionUser;
    redirectByRole(user.role.name, res);
  } catch (err) {
    res.render('auth/login', { error: err.message });
  }
};

const getRegister = (req, res) => res.render('auth/register', { title: 'Registro' });

const postRegister = async (req, res) => {
  try {
    const { firstName, lastName, phone, userName, email, role, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('auth/register', { error: 'Las contraseñas no coinciden.' });
    }

    const exists = await User.findOne({ $or: [{ userName }, { email }] });
    if (exists) return res.render('auth/register', { error: 'El usuario o correo ya existe.' });

    const roleDoc = await Role.findOne({ name: role });
    const hashed = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');

    const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    await User.create({
      firstName, lastName, phone, userName, email,
      password: hashed, role: roleDoc._id,
      isActive: false, profileImage,
      activationToken,
      activationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendActivationEmail(email, activationToken);
    res.render('auth/login', { success: 'Registro exitoso. Revisa tu correo para activar tu cuenta.' });
  } catch (err) {
    res.render('auth/register', { error: err.message });
  }
};

const getRegisterCommerce = async (req, res) => {
  const commerceTypes = await CommerceType.find();
  res.render('auth/register-commerce', { title: 'Registro Comercio', commerceTypes });
};

const postRegisterCommerce = async (req, res) => {
  try {
    const { name, phone, userName, email, openingTime, closingTime, commerceTypeId, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      const commerceTypes = await CommerceType.find();
      return res.render('auth/register-commerce', { error: 'Las contraseñas no coinciden.', commerceTypes });
    }

    const exists = await User.findOne({ $or: [{ userName }, { email }] });
    if (exists) {
      const commerceTypes = await CommerceType.find();
      return res.render('auth/register-commerce', { error: 'El usuario o correo ya existe.', commerceTypes });
    }

    const roleDoc = await Role.findOne({ name: 'Commerce' });
    const hashed = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const logo = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const user = await User.create({
      userName, email, password: hashed, phone,
      role: roleDoc._id, isActive: false,
      activationToken,
      activationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await Commerce.create({ user: user._id, name, phone, logo, openingTime, closingTime, commerceType: commerceTypeId });
    await sendActivationEmail(email, activationToken);

    res.render('auth/login', { success: 'Comercio registrado. Revisa tu correo para activar tu cuenta.' });
  } catch (err) {
    const commerceTypes = await CommerceType.find();
    res.render('auth/register-commerce', { error: err.message, commerceTypes });
  }
};

const confirmEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ activationToken: token, activationTokenExpires: { $gt: new Date() } });
    if (!user) return res.render('auth/login', { error: 'Token inválido o expirado.' });

    user.isActive = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    await user.save();

    res.render('auth/login', { success: 'Cuenta activada. Ya puedes iniciar sesión.' });
  } catch (err) {
    res.render('auth/login', { error: err.message });
  }
};

const getForgotPassword = (req, res) => res.render('auth/forgot-password', { title: 'Restablecer contraseña' });

const postForgotPassword = async (req, res) => {
  try {
    const { userNameOrEmail } = req.body;
    const user = await User.findOne({ $or: [{ email: userNameOrEmail }, { userName: userNameOrEmail }] });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendResetPasswordEmail(user.email, resetToken);
    }
    res.render('auth/forgot-password', { success: 'Si el usuario existe, recibirás un correo con instrucciones.' });
  } catch (err) {
    res.render('auth/forgot-password', { error: err.message });
  }
};

const getResetPassword = async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
  if (!user) return res.render('auth/login', { error: 'Token inválido o expirado.' });
  res.render('auth/reset-password', { title: 'Nueva contraseña', token });
};

const postResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.render('auth/reset-password', { error: 'Las contraseñas no coinciden.', token });

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.render('auth/login', { error: 'Token inválido o expirado.' });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.render('auth/login', { success: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    res.render('auth/reset-password', { error: err.message, token: req.body.token });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

module.exports = {
  getLogin, postLogin, getRegister, postRegister,
  getRegisterCommerce, postRegisterCommerce,
  confirmEmail, getForgotPassword, postForgotPassword,
  getResetPassword, postResetPassword, logout,
};
