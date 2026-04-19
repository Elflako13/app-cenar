const bcrypt        = require('bcryptjs');
const User          = require('../models/User');
const Role          = require('../models/Role');
const Commerce      = require('../models/Commerce');
const CommerceType  = require('../models/CommerceType');
const Configuration = require('../models/Configuration');
const Order         = require('../models/Order');
const Product       = require('../models/Product');

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const clientRole   = await Role.findOne({ name: 'Client' }).lean();
    const deliveryRole = await Role.findOne({ name: 'Delivery' }).lean();
    const commerceRole = await Role.findOne({ name: 'Commerce' }).lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      activeCommerces,
      inactiveCommerces,
      totalClients,
      totalDeliveries,
      totalProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Commerce.countDocuments({ user: { $in: await User.find({ role: commerceRole?._id, isActive: true }).distinct('_id') } }),
      Commerce.countDocuments({ user: { $in: await User.find({ role: commerceRole?._id, isActive: false }).distinct('_id') } }),
      User.countDocuments({ role: clientRole?._id }),
      User.countDocuments({ role: deliveryRole?._id }),
      Product.countDocuments(),
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: { totalOrders, todayOrders, activeCommerces, inactiveCommerces, totalClients, totalDeliveries, totalProducts },
    });
  } catch (err) {
    res.render('admin/dashboard', { title: 'Dashboard', stats: {}, error: err.message });
  }
};

// ─────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────
const getClients = async (req, res) => {
  try {
    const clientRole = await Role.findOne({ name: 'Client' }).lean();
    const clients    = await User.find({ role: clientRole?._id }).lean();
    const clientsWithCount = await Promise.all(
      clients.map(async (c) => ({
        ...c,
        orderCount: await Order.countDocuments({ client: c._id }),
      }))
    );
    res.render('admin/clients', { title: 'Clientes', clients: clientsWithCount, success: req.query.success });
  } catch (err) {
    res.render('admin/clients', { title: 'Clientes', clients: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELIVERIES
// ─────────────────────────────────────────────
const getDeliveries = async (req, res) => {
  try {
    const deliveryRole = await Role.findOne({ name: 'Delivery' }).lean();
    const deliveries   = await User.find({ role: deliveryRole?._id }).lean();
    const deliveriesWithCount = await Promise.all(
      deliveries.map(async (d) => ({
        ...d,
        deliveredCount: await Order.countDocuments({ delivery: d._id, status: 'Completed' }),
      }))
    );
    res.render('admin/deliveries', { title: 'Repartidores', deliveries: deliveriesWithCount, success: req.query.success });
  } catch (err) {
    res.render('admin/deliveries', { title: 'Repartidores', deliveries: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// COMMERCES
// ─────────────────────────────────────────────
const getCommerces = async (req, res) => {
  try {
    const commerces = await Commerce.find()
      .populate('user')
      .populate('commerceType')
      .lean();
    const commercesWithCount = await Promise.all(
      commerces.map(async (c) => ({
        ...c,
        orderCount: await Order.countDocuments({ commerce: c._id }),
      }))
    );
    res.render('admin/commerces', { title: 'Comercios', commerces: commercesWithCount, success: req.query.success });
  } catch (err) {
    res.render('admin/commerces', { title: 'Comercios', commerces: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// TOGGLE STATUS (clients, deliveries, commerces)
// ─────────────────────────────────────────────
const postToggleStatus = async (req, res) => {
  const back = req.headers.referer || '/admin';
  try {
    const adminId = req.session.user.id;
    const target  = await User.findById(req.params.id);

    if (!target) return res.redirect(back);
    if (target._id.toString() === adminId) return res.redirect(back);
    if (target.isDefault) return res.redirect(back);

    target.isActive = !target.isActive;
    await target.save();

    res.redirect(back);
  } catch (err) {
    res.redirect(back);
  }
};

// ─────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────
const getAdmins = async (req, res) => {
  try {
    const adminRole = await Role.findOne({ name: 'Admin' }).lean();
    const admins    = await User.find({ role: adminRole?._id }).lean();
    res.render('admin/admins', {
      title: 'Administradores',
      admins,
      currentUserId: req.session.user.id,
      success: req.query.success,
    });
  } catch (err) {
    res.render('admin/admins', { title: 'Administradores', admins: [], error: err.message });
  }
};

const getCreateAdmin = (req, res) => {
  res.render('admin/admin-form', { title: 'Nuevo Administrador', isEdit: false });
};

const postCreateAdmin = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('admin/admin-form', {
        title: 'Nuevo Administrador',
        isEdit: false,
        formData: req.body,
        error: 'Las contraseñas no coinciden',
      });
    }

    const adminRole = await Role.findOne({ name: 'Admin' }).lean();
    const hashed    = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashed,
      role: adminRole._id,
      isActive: true,
    });

    res.redirect('/admin/admins?success=Administrador+creado+exitosamente');
  } catch (err) {
    res.render('admin/admin-form', {
      title: 'Nuevo Administrador',
      isEdit: false,
      formData: req.body,
      error: err.message,
    });
  }
};

const getEditAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).lean();
    if (!admin) return res.redirect('/admin/admins');
    res.render('admin/admin-form', { title: 'Editar Administrador', isEdit: true, formData: admin });
  } catch (err) {
    res.redirect('/admin/admins');
  }
};

const postEditAdmin = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password, confirmPassword } = req.body;
    const updateData = { firstName, lastName, userName, email };

    if (password && password.trim()) {
      if (password !== confirmPassword) {
        const admin = await User.findById(req.params.id).lean();
        return res.render('admin/admin-form', {
          title: 'Editar Administrador',
          isEdit: true,
          formData: { ...admin, ...req.body },
          error: 'Las contraseñas no coinciden',
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/admins?success=Administrador+actualizado+correctamente');
  } catch (err) {
    const admin = await User.findById(req.params.id).lean().catch(() => ({}));
    res.render('admin/admin-form', {
      title: 'Editar Administrador',
      isEdit: true,
      formData: { ...admin, ...req.body },
      error: err.message,
    });
  }
};

const postToggleAdminStatus = async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const target  = await User.findById(req.params.id);

    if (!target) return res.redirect('/admin/admins');
    if (target._id.toString() === adminId) return res.redirect('/admin/admins');
    if (target.isDefault) return res.redirect('/admin/admins');

    target.isActive = !target.isActive;
    await target.save();

    res.redirect('/admin/admins');
  } catch (err) {
    res.redirect('/admin/admins');
  }
};

// ─────────────────────────────────────────────
// CONFIGURATIONS
// ─────────────────────────────────────────────
const getConfigurations = async (req, res) => {
  try {
    const configurations = await Configuration.find().lean();
    res.render('admin/configurations', { title: 'Configuraciones', configurations, success: req.query.success });
  } catch (err) {
    res.render('admin/configurations', { title: 'Configuraciones', configurations: [], error: err.message });
  }
};

const getEditConfiguration = async (req, res) => {
  try {
    const config = await Configuration.findOne({ key: req.params.key.toUpperCase() }).lean();
    if (!config) return res.redirect('/admin/configurations');
    res.render('admin/configuration-form', { title: 'Editar Configuración', config });
  } catch (err) {
    res.redirect('/admin/configurations');
  }
};

const postEditConfiguration = async (req, res) => {
  try {
    const { value } = req.body;
    await Configuration.findOneAndUpdate({ key: req.params.key.toUpperCase() }, { value });
    res.redirect('/admin/configurations?success=Configuración+actualizada+correctamente');
  } catch (err) {
    const config = await Configuration.findOne({ key: req.params.key.toUpperCase() }).lean().catch(() => ({}));
    res.render('admin/configuration-form', { title: 'Editar Configuración', config, error: err.message });
  }
};

// ─────────────────────────────────────────────
// COMMERCE TYPES
// ─────────────────────────────────────────────
const getCommerceTypes = async (req, res) => {
  try {
    const types = await CommerceType.find().lean();
    const typesWithCount = await Promise.all(
      types.map(async (t) => ({
        ...t,
        commerceCount: await Commerce.countDocuments({ commerceType: t._id }),
      }))
    );
    res.render('admin/commerce-types', { title: 'Tipos de Comercio', types: typesWithCount, success: req.query.success });
  } catch (err) {
    res.render('admin/commerce-types', { title: 'Tipos de Comercio', types: [], error: err.message });
  }
};

const getCreateCommerceType = (req, res) => {
  res.render('admin/commerce-type-form', { title: 'Nuevo Tipo de Comercio', isEdit: false });
};

const postCreateCommerceType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const typeData = { name, description };
    if (req.file) typeData.icon = `/uploads/icons/${req.file.filename}`;
    await CommerceType.create(typeData);
    res.redirect('/admin/commerce-types?success=Tipo+de+comercio+creado+exitosamente');
  } catch (err) {
    res.render('admin/commerce-type-form', {
      title: 'Nuevo Tipo de Comercio',
      isEdit: false,
      formData: req.body,
      error: err.message,
    });
  }
};

const getEditCommerceType = async (req, res) => {
  try {
    const type = await CommerceType.findById(req.params.id).lean();
    if (!type) return res.redirect('/admin/commerce-types');
    res.render('admin/commerce-type-form', { title: 'Editar Tipo de Comercio', isEdit: true, formData: type });
  } catch (err) {
    res.redirect('/admin/commerce-types');
  }
};

const postEditCommerceType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updateData = { name, description };
    if (req.file) updateData.icon = `/uploads/icons/${req.file.filename}`;
    await CommerceType.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/commerce-types?success=Tipo+de+comercio+actualizado+correctamente');
  } catch (err) {
    const type = await CommerceType.findById(req.params.id).lean().catch(() => ({}));
    res.render('admin/commerce-type-form', {
      title: 'Editar Tipo de Comercio',
      isEdit: true,
      formData: { ...type, ...req.body },
      error: err.message,
    });
  }
};

const getDeleteCommerceType = async (req, res) => {
  try {
    const type = await CommerceType.findById(req.params.id).lean();
    if (!type) return res.redirect('/admin/commerce-types');
    const commerceCount = await Commerce.countDocuments({ commerceType: req.params.id });
    res.render('admin/commerce-type-delete', { title: 'Eliminar Tipo de Comercio', type, commerceCount });
  } catch (err) {
    res.redirect('/admin/commerce-types');
  }
};

const postDeleteCommerceType = async (req, res) => {
  try {
    const typeId = req.params.id;
    // Cascade: remove all commerces of this type and their associated data
    const commerces = await Commerce.find({ commerceType: typeId }).lean();
    const commerceIds = commerces.map(c => c._id);
    const userIds     = commerces.map(c => c.user);

    // Delete categories and products of these commerces
    const Category = require('../models/Category');
    const Product  = require('../models/Product');
    await Category.deleteMany({ commerce: { $in: commerceIds } });
    await Product.deleteMany({ commerce: { $in: commerceIds } });
    await Commerce.deleteMany({ commerceType: typeId });
    await User.deleteMany({ _id: { $in: userIds } });

    await CommerceType.findByIdAndDelete(typeId);
    res.redirect('/admin/commerce-types?success=Tipo+de+comercio+eliminado+correctamente');
  } catch (err) {
    res.redirect('/admin/commerce-types?error=' + encodeURIComponent(err.message));
  }
};

module.exports = {
  getDashboard,
  getClients,
  getDeliveries,
  getCommerces,
  postToggleStatus,
  getAdmins,
  getCreateAdmin,
  postCreateAdmin,
  getEditAdmin,
  postEditAdmin,
  postToggleAdminStatus,
  getConfigurations,
  getEditConfiguration,
  postEditConfiguration,
  getCommerceTypes,
  getCreateCommerceType,
  postCreateCommerceType,
  getEditCommerceType,
  postEditCommerceType,
  getDeleteCommerceType,
  postDeleteCommerceType,
};
