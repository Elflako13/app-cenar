const User          = require('../models/User');
const Commerce      = require('../models/Commerce');
const CommerceType  = require('../models/CommerceType');
const Category      = require('../models/Category');
const Product       = require('../models/Product');
const Order         = require('../models/Order');
const Address       = require('../models/Address');
const Favorite      = require('../models/Favorite');
const Configuration = require('../models/Configuration');

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────
const getHome = async (req, res) => {
  try {
    const commerceTypes = await CommerceType.find().lean();
    res.render('client/home', { title: 'Home', commerceTypes });
  } catch (err) {
    res.render('client/home', { title: 'Home', commerceTypes: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// COMMERCE LIST
// ─────────────────────────────────────────────
const getCommerceList = async (req, res) => {
  try {
    const { typeId, search } = req.query;
    const clientId = req.session.user.id;

    const commerceType = await CommerceType.findById(typeId).lean();
    if (!commerceType) return res.redirect('/client');

    // Get all active users (isActive=true)
    const activeUsers = await User.find({ isActive: true }).select('_id').lean();
    const activeUserIds = activeUsers.map(u => u._id);

    // Build query
    const query = {
      commerceType: typeId,
      user: { $in: activeUserIds },
    };
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    let commerces = await Commerce.find(query).populate('user').lean();

    // Mark isFavorite
    const favorites = await Favorite.find({ client: clientId }).select('commerce').lean();
    const favSet = new Set(favorites.map(f => f.commerce.toString()));
    commerces = commerces.map(c => ({
      ...c,
      isFavorite: favSet.has(c._id.toString()),
    }));

    res.render('client/commerces', {
      title: `${commerceType.name}`,
      commerceType,
      commerces,
      search: search || '',
    });
  } catch (err) {
    res.render('client/commerces', {
      title: 'Comercios',
      commerceType: {},
      commerces: [],
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────
// CATALOG
// ─────────────────────────────────────────────
const getCatalog = async (req, res) => {
  try {
    const { commerceId } = req.params;
    const commerce = await Commerce.findById(commerceId).lean();
    if (!commerce) return res.redirect('/client');

    const categories = await Category.find({ commerce: commerceId }).lean();
    const products   = await Product.find({ commerce: commerceId, isActive: true }).lean();

    // Group products by category
    const catalog = categories.map(cat => ({
      category: cat,
      products: products.filter(p => p.category.toString() === cat._id.toString()),
    })).filter(c => c.products.length > 0);

    // Also include products without category or unmatched (safety)
    const categorizedIds = new Set(products.filter(p => categories.some(c => c._id.toString() === p.category.toString())).map(p => p._id.toString()));
    const uncategorized  = products.filter(p => !categorizedIds.has(p._id.toString()));
    if (uncategorized.length > 0) {
      catalog.push({ category: { _id: 'other', name: 'Otros' }, products: uncategorized });
    }

    res.render('client/catalog', {
      title: commerce.name,
      commerce,
      catalog,
    });
  } catch (err) {
    res.render('client/catalog', { title: 'Catálogo', commerce: {}, catalog: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// CHECKOUT (GET)
// ─────────────────────────────────────────────
const getCheckout = async (req, res) => {
  try {
    const clientId = req.session.user.id;
    const { commerceId, items } = req.query;

    const commerce   = await Commerce.findById(commerceId).lean();
    const addresses  = await Address.find({ client: clientId }).lean();
    const configItbis = await Configuration.findOne({ key: 'ITBIS' }).lean();
    const itbisPercentage = configItbis ? parseFloat(configItbis.value) : 18;

    // Parse items to calculate subtotal
    let parsedItems = [];
    let subtotal = 0;
    try {
      parsedItems = JSON.parse(items || '[]');
      const productIds = parsedItems.map(i => i.productId);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
      parsedItems = parsedItems.map(i => {
        const p = dbProducts.find(d => d._id.toString() === i.productId);
        return p ? { ...i, name: p.name, price: p.price } : null;
      }).filter(Boolean);
      subtotal = parsedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    } catch (_) {}

    const itbisAmount = parseFloat((subtotal * itbisPercentage / 100).toFixed(2));
    const total       = parseFloat((subtotal + itbisAmount).toFixed(2));

    res.render('client/checkout', {
      title: 'Checkout',
      commerce,
      addresses,
      items: JSON.stringify(parsedItems.map(i => ({ productId: i.productId, quantity: i.quantity }))),
      subtotal: subtotal.toFixed(2),
      itbisPercentage,
      itbisAmount: itbisAmount.toFixed(2),
      total: total.toFixed(2),
    });
  } catch (err) {
    res.redirect('/client');
  }
};

// ─────────────────────────────────────────────
// CREATE ORDER (POST)
// ─────────────────────────────────────────────
const postCreateOrder = async (req, res) => {
  try {
    const clientId  = req.session.user.id;
    const { commerceId, items: itemsJson, addressId } = req.body;

    const parsedItems = JSON.parse(itemsJson || '[]');
    if (!parsedItems.length) {
      return res.redirect(`/client/commerce/${commerceId}/catalog`);
    }

    // Fetch products from DB to ensure correct prices
    const productIds = parsedItems.map(i => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

    const orderItems = parsedItems.map(i => {
      const p = dbProducts.find(d => d._id.toString() === i.productId);
      if (!p) return null;
      return { product: p._id, name: p.name, price: p.price, quantity: i.quantity };
    }).filter(Boolean);

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const configItbis    = await Configuration.findOne({ key: 'ITBIS' }).lean();
    const itbisPercentage = configItbis ? parseFloat(configItbis.value) : 18;
    const itbisAmount    = parseFloat((subtotal * itbisPercentage / 100).toFixed(2));
    const total          = parseFloat((subtotal + itbisAmount).toFixed(2));

    // Get address snapshot
    const address = await Address.findById(addressId).lean();
    const addressSnapshot = address ? {
      label:     address.label,
      street:    address.street,
      sector:    address.sector,
      city:      address.city,
      reference: address.reference,
    } : {};

    await Order.create({
      client:   clientId,
      commerce: commerceId,
      address:  addressId,
      addressSnapshot,
      items:    orderItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itbisPercentage,
      itbisAmount,
      total,
      status: 'Pending',
    });

    res.redirect('/client/orders?success=Pedido+creado+exitosamente');
  } catch (err) {
    res.redirect('/client?error=' + encodeURIComponent(err.message));
  }
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const clientId = req.session.user.id;
    const orders = await Order.find({ client: clientId })
      .populate('commerce')
      .sort({ createdAt: -1 })
      .lean();

    res.render('client/orders', {
      title: 'Mis Pedidos',
      orders,
      success: req.query.success,
    });
  } catch (err) {
    res.render('client/orders', { title: 'Mis Pedidos', orders: [], error: err.message });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const clientId = req.session.user.id;
    const order = await Order.findOne({ _id: req.params.id, client: clientId })
      .populate('commerce')
      .populate('items.product')
      .lean();

    if (!order) return res.redirect('/client/orders');

    res.render('client/order-detail', { title: 'Detalle del Pedido', order });
  } catch (err) {
    res.redirect('/client/orders');
  }
};

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    res.render('client/profile', { title: 'Mi Perfil', profileUser: user });
  } catch (err) {
    res.render('client/profile', { title: 'Mi Perfil', profileUser: {}, error: err.message });
  }
};

const postUpdateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updateData = { firstName, lastName, phone };
    if (req.file) updateData.profileImage = `/uploads/profiles/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(req.session.user.id, updateData, { new: true }).lean();

    // Update session
    req.session.user.firstName    = updated.firstName;
    req.session.user.lastName     = updated.lastName;
    req.session.user.profileImage = updated.profileImage;

    res.redirect('/client/profile?success=Perfil+actualizado+correctamente');
  } catch (err) {
    const user = await User.findById(req.session.user.id).lean();
    res.render('client/profile', { title: 'Mi Perfil', profileUser: user, error: err.message });
  }
};

// ─────────────────────────────────────────────
// ADDRESSES
// ─────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ client: req.session.user.id }).lean();
    res.render('client/addresses', {
      title: 'Mis Direcciones',
      addresses,
      success: req.query.success,
    });
  } catch (err) {
    res.render('client/addresses', { title: 'Mis Direcciones', addresses: [], error: err.message });
  }
};

const getCreateAddress = (req, res) => {
  res.render('client/address-form', { title: 'Nueva Dirección', isEdit: false });
};

const postCreateAddress = async (req, res) => {
  try {
    const { label, street, sector, city, reference } = req.body;
    await Address.create({ label, street, sector, city, reference, client: req.session.user.id });
    res.redirect('/client/addresses?success=Dirección+creada+exitosamente');
  } catch (err) {
    res.render('client/address-form', { title: 'Nueva Dirección', isEdit: false, error: err.message, address: req.body });
  }
};

const getEditAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.session.user.id }).lean();
    if (!address) return res.redirect('/client/addresses');
    res.render('client/address-form', { title: 'Editar Dirección', isEdit: true, address });
  } catch (err) {
    res.redirect('/client/addresses');
  }
};

const postEditAddress = async (req, res) => {
  try {
    const { label, street, sector, city, reference } = req.body;
    await Address.findOneAndUpdate(
      { _id: req.params.id, client: req.session.user.id },
      { label, street, sector, city, reference }
    );
    res.redirect('/client/addresses?success=Dirección+actualizada+correctamente');
  } catch (err) {
    const address = await Address.findById(req.params.id).lean();
    res.render('client/address-form', { title: 'Editar Dirección', isEdit: true, address, error: err.message });
  }
};

const getDeleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.session.user.id }).lean();
    if (!address) return res.redirect('/client/addresses');
    res.render('client/address-delete', { title: 'Eliminar Dirección', address });
  } catch (err) {
    res.redirect('/client/addresses');
  }
};

const postDeleteAddress = async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, client: req.session.user.id });
    res.redirect('/client/addresses?success=Dirección+eliminada+correctamente');
  } catch (err) {
    res.redirect('/client/addresses?error=' + encodeURIComponent(err.message));
  }
};

// ─────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ client: req.session.user.id })
      .populate({ path: 'commerce', populate: { path: 'commerceType' } })
      .lean();
    res.render('client/favorites', { title: 'Mis Favoritos', favorites });
  } catch (err) {
    res.render('client/favorites', { title: 'Mis Favoritos', favorites: [], error: err.message });
  }
};

const postAddFavorite = async (req, res) => {
  const back = req.headers.referer || '/client';
  try {
    const { commerceId } = req.body;
    const clientId = req.session.user.id;
    const exists = await Favorite.findOne({ client: clientId, commerce: commerceId });
    if (!exists) {
      await Favorite.create({ client: clientId, commerce: commerceId });
    }
    res.redirect(back);
  } catch (err) {
    res.redirect(back);
  }
};

const postRemoveFavorite = async (req, res) => {
  const back = req.headers.referer || '/client/favorites';
  try {
    const { commerceId } = req.body;
    await Favorite.findOneAndDelete({ client: req.session.user.id, commerce: commerceId });
    res.redirect(back);
  } catch (err) {
    res.redirect(back);
  }
};

module.exports = {
  getHome,
  getCommerceList,
  getCatalog,
  getCheckout,
  postCreateOrder,
  getOrders,
  getOrderDetail,
  getProfile,
  postUpdateProfile,
  getAddresses,
  getCreateAddress,
  postCreateAddress,
  getEditAddress,
  postEditAddress,
  getDeleteAddress,
  postDeleteAddress,
  getFavorites,
  postAddFavorite,
  postRemoveFavorite,
};
