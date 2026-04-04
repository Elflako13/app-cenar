const User  = require('../models/User');
const Order = require('../models/Order');

// ─────────────────────────────────────────────
// HOME – orders assigned to this delivery user
// ─────────────────────────────────────────────
const getHome = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const orders = await Order.find({ delivery: userId })
      .populate('commerce')
      .sort({ createdAt: -1 })
      .lean();
    res.render('delivery/home', { title: 'Mis Pedidos', orders, success: req.query.success });
  } catch (err) {
    res.render('delivery/home', { title: 'Mis Pedidos', orders: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// ORDER DETAIL
// ─────────────────────────────────────────────
const getOrderDetail = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const order = await Order.findOne({ _id: req.params.id, delivery: userId })
      .populate('commerce')
      .populate('items.product')
      .lean();

    if (!order) return res.redirect('/delivery');

    const showAddress = order.status !== 'Completed';
    const canComplete = order.status === 'InProgress';

    res.render('delivery/order-detail', {
      title: 'Detalle del Pedido',
      order,
      showAddress,
      canComplete,
      success: req.query.success,
    });
  } catch (err) {
    res.redirect('/delivery');
  }
};

// ─────────────────────────────────────────────
// COMPLETE ORDER
// ─────────────────────────────────────────────
const postCompleteOrder = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const order = await Order.findOne({ _id: req.params.id, delivery: userId });
    if (!order) return res.redirect('/delivery');

    order.status = 'Completed';
    await order.save();

    // Mark delivery user as available again
    await User.findByIdAndUpdate(userId, { isAvailable: true });

    res.redirect(`/delivery/orders/${req.params.id}?success=${encodeURIComponent('Pedido completado exitosamente')}`);
  } catch (err) {
    res.redirect(`/delivery/orders/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
};

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    res.render('delivery/profile', { title: 'Mi Perfil', profileUser: user, success: req.query.success });
  } catch (err) {
    res.render('delivery/profile', { title: 'Mi Perfil', profileUser: {}, error: err.message });
  }
};

const postUpdateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updateData = { firstName, lastName, phone };
    if (req.file) updateData.profileImage = `/uploads/profiles/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(req.session.user.id, updateData, { new: true }).lean();

    // Update session
    req.session.user.firstName     = updated.firstName;
    req.session.user.lastName      = updated.lastName;
    req.session.user.profileImage  = updated.profileImage;

    res.redirect('/delivery/profile?success=Perfil+actualizado+correctamente');
  } catch (err) {
    const user = await User.findById(req.session.user.id).lean().catch(() => ({}));
    res.render('delivery/profile', { title: 'Mi Perfil', profileUser: user, error: err.message });
  }
};

module.exports = {
  getHome,
  getOrderDetail,
  postCompleteOrder,
  getProfile,
  postUpdateProfile,
};
