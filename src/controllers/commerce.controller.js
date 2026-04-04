const User     = require('../models/User');
const Commerce = require('../models/Commerce');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const Role     = require('../models/Role');

// ─────────────────────────────────────────────
// HOME – orders for this commerce
// ─────────────────────────────────────────────
const getHome = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const orders = await Order.find({ commerce: commerceId })
      .populate('commerce')
      .sort({ createdAt: -1 })
      .lean();
    res.render('commerce/home', { title: 'Mis Pedidos', orders, success: req.query.success });
  } catch (err) {
    res.render('commerce/home', { title: 'Mis Pedidos', orders: [], error: err.message });
  }
};

// ─────────────────────────────────────────────
// ORDER DETAIL
// ─────────────────────────────────────────────
const getOrderDetail = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const order = await Order.findOne({ _id: req.params.id, commerce: commerceId })
      .populate('commerce')
      .populate('items.product')
      .populate('delivery')
      .lean();

    if (!order) return res.redirect('/commerce');

    res.render('commerce/order-detail', {
      title: 'Detalle del Pedido',
      order,
      canAssign: order.status === 'Pending',
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    res.redirect('/commerce');
  }
};

// ─────────────────────────────────────────────
// ASSIGN DELIVERY
// ─────────────────────────────────────────────
const postAssignDelivery = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const order = await Order.findOne({ _id: req.params.id, commerce: commerceId });
    if (!order) return res.redirect('/commerce');

    // Find the Delivery role
    const deliveryRole = await Role.findOne({ name: 'Delivery' }).lean();
    if (!deliveryRole) {
      return res.redirect(`/commerce/orders/${req.params.id}?error=${encodeURIComponent('Rol Delivery no encontrado')}`);
    }

    // Find first available delivery user
    const deliveryUser = await User.findOne({
      role: deliveryRole._id,
      isActive: true,
      isAvailable: true,
    });

    if (!deliveryUser) {
      return res.redirect(`/commerce/orders/${req.params.id}?error=${encodeURIComponent('No hay repartidores disponibles en este momento')}`);
    }

    order.delivery = deliveryUser._id;
    order.status   = 'InProgress';
    await order.save();

    deliveryUser.isAvailable = false;
    await deliveryUser.save();

    res.redirect(`/commerce/orders/${req.params.id}?success=${encodeURIComponent('Delivery asignado exitosamente')}`);
  } catch (err) {
    res.redirect(`/commerce/orders/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
};

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const commerce = await Commerce.findById(commerceId)
      .populate('commerceType')
      .populate('user')
      .lean();
    res.render('commerce/profile', { title: 'Mi Perfil', commerce, success: req.query.success });
  } catch (err) {
    res.render('commerce/profile', { title: 'Mi Perfil', commerce: {}, error: err.message });
  }
};

const postUpdateProfile = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const { openingTime, closingTime, phone, email } = req.body;

    const updateComm = { openingTime, closingTime, phone };
    if (req.file) updateComm.logo = `/uploads/logos/${req.file.filename}`;

    await Commerce.findByIdAndUpdate(commerceId, updateComm);
    await User.findByIdAndUpdate(req.session.user.id, { phone, email });

    res.redirect('/commerce/profile?success=Perfil+actualizado+correctamente');
  } catch (err) {
    const commerceId = req.session.user.commerceId;
    const commerce = await Commerce.findById(commerceId).populate('commerceType').populate('user').lean().catch(() => ({}));
    res.render('commerce/profile', { title: 'Mi Perfil', commerce, error: err.message });
  }
};

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const categories = await Category.find({ commerce: commerceId }).lean();

    // Add product count per category
    const Product = require('../models/Product');
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        productCount: await Product.countDocuments({ category: cat._id }),
      }))
    );

    res.render('commerce/categories', { title: 'Categorías', categories: categoriesWithCount, success: req.query.success });
  } catch (err) {
    res.render('commerce/categories', { title: 'Categorías', categories: [], error: err.message });
  }
};

const getCreateCategory = (req, res) => {
  res.render('commerce/category-form', { title: 'Nueva Categoría', isEdit: false });
};

const postCreateCategory = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const { name, description } = req.body;
    await Category.create({ name, description, commerce: commerceId });
    res.redirect('/commerce/categories?success=Categoría+creada+exitosamente');
  } catch (err) {
    res.render('commerce/category-form', { title: 'Nueva Categoría', isEdit: false, category: req.body, error: err.message });
  }
};

const getEditCategory = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const category = await Category.findOne({ _id: req.params.id, commerce: commerceId }).lean();
    if (!category) return res.redirect('/commerce/categories');
    res.render('commerce/category-form', { title: 'Editar Categoría', isEdit: true, category });
  } catch (err) {
    res.redirect('/commerce/categories');
  }
};

const postEditCategory = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const { name, description } = req.body;
    await Category.findOneAndUpdate({ _id: req.params.id, commerce: commerceId }, { name, description });
    res.redirect('/commerce/categories?success=Categoría+actualizada+correctamente');
  } catch (err) {
    const category = await Category.findById(req.params.id).lean().catch(() => ({}));
    res.render('commerce/category-form', { title: 'Editar Categoría', isEdit: true, category, error: err.message });
  }
};

const getDeleteCategory = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const category = await Category.findOne({ _id: req.params.id, commerce: commerceId }).lean();
    if (!category) return res.redirect('/commerce/categories');
    res.render('commerce/category-delete', { title: 'Eliminar Categoría', category });
  } catch (err) {
    res.redirect('/commerce/categories');
  }
};

const postDeleteCategory = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    await Category.findOneAndDelete({ _id: req.params.id, commerce: commerceId });
    res.redirect('/commerce/categories?success=Categoría+eliminada+correctamente');
  } catch (err) {
    res.redirect('/commerce/categories?error=' + encodeURIComponent(err.message));
  }
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const products = await Product.find({ commerce: commerceId })
      .populate('category')
      .lean();
    res.render('commerce/products', { title: 'Productos', products, success: req.query.success });
  } catch (err) {
    res.render('commerce/products', { title: 'Productos', products: [], error: err.message });
  }
};

const getCreateProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const categories = await Category.find({ commerce: commerceId }).lean();
    res.render('commerce/product-form', { title: 'Nuevo Producto', isEdit: false, categories });
  } catch (err) {
    res.render('commerce/product-form', { title: 'Nuevo Producto', isEdit: false, categories: [], error: err.message });
  }
};

const postCreateProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const { name, description, price, category } = req.body;
    const productData = { name, description, price: parseFloat(price), category, commerce: commerceId };
    if (req.file) productData.image = `/uploads/products/${req.file.filename}`;
    await Product.create(productData);
    res.redirect('/commerce/products?success=Producto+creado+exitosamente');
  } catch (err) {
    const categories = await Category.find({ commerce: req.session.user.commerceId }).lean().catch(() => []);
    res.render('commerce/product-form', { title: 'Nuevo Producto', isEdit: false, categories, product: req.body, error: err.message });
  }
};

const getEditProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const product = await Product.findOne({ _id: req.params.id, commerce: commerceId }).lean();
    if (!product) return res.redirect('/commerce/products');
    const categories = await Category.find({ commerce: commerceId }).lean();
    res.render('commerce/product-form', { title: 'Editar Producto', isEdit: true, product, categories });
  } catch (err) {
    res.redirect('/commerce/products');
  }
};

const postEditProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const { name, description, price, category } = req.body;
    const updateData = { name, description, price: parseFloat(price), category };
    if (req.file) updateData.image = `/uploads/products/${req.file.filename}`;
    await Product.findOneAndUpdate({ _id: req.params.id, commerce: commerceId }, updateData);
    res.redirect('/commerce/products?success=Producto+actualizado+correctamente');
  } catch (err) {
    const commerceId = req.session.user.commerceId;
    const product = await Product.findById(req.params.id).lean().catch(() => ({}));
    const categories = await Category.find({ commerce: commerceId }).lean().catch(() => []);
    res.render('commerce/product-form', { title: 'Editar Producto', isEdit: true, product, categories, error: err.message });
  }
};

const getDeleteProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    const product = await Product.findOne({ _id: req.params.id, commerce: commerceId }).lean();
    if (!product) return res.redirect('/commerce/products');
    res.render('commerce/product-delete', { title: 'Eliminar Producto', product });
  } catch (err) {
    res.redirect('/commerce/products');
  }
};

const postDeleteProduct = async (req, res) => {
  try {
    const commerceId = req.session.user.commerceId;
    await Product.findOneAndDelete({ _id: req.params.id, commerce: commerceId });
    res.redirect('/commerce/products?success=Producto+eliminado+correctamente');
  } catch (err) {
    res.redirect('/commerce/products?error=' + encodeURIComponent(err.message));
  }
};

module.exports = {
  getHome,
  getOrderDetail,
  postAssignDelivery,
  getProfile,
  postUpdateProfile,
  getCategories,
  getCreateCategory,
  postCreateCategory,
  getEditCategory,
  postEditCategory,
  getDeleteCategory,
  postDeleteCategory,
  getProducts,
  getCreateProduct,
  postCreateProduct,
  getEditProduct,
  postEditProduct,
  getDeleteProduct,
  postDeleteProduct,
};
