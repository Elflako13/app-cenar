const router = require('express').Router();
const { requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const ctrl   = require('../controllers/client.controller');

const isClient = requireRole('Client');

// Home
router.get('/',                             isClient, ctrl.getHome);

// Commerces
router.get('/commerces',                    isClient, ctrl.getCommerceList);
router.get('/commerce/:commerceId/catalog', isClient, ctrl.getCatalog);

// Checkout
router.get('/checkout',                     isClient, ctrl.getCheckout);

// Orders
router.post('/orders',                      isClient, ctrl.postCreateOrder);
router.get('/orders',                       isClient, ctrl.getOrders);
router.get('/orders/:id',                   isClient, ctrl.getOrderDetail);

// Profile
router.get('/profile',                      isClient, ctrl.getProfile);
router.post('/profile',                     isClient, upload.profile, ctrl.postUpdateProfile);

// Addresses
router.get('/addresses',                    isClient, ctrl.getAddresses);
router.get('/addresses/create',             isClient, ctrl.getCreateAddress);
router.post('/addresses/create',            isClient, ctrl.postCreateAddress);
router.get('/addresses/:id/edit',           isClient, ctrl.getEditAddress);
router.post('/addresses/:id/edit',          isClient, ctrl.postEditAddress);
router.get('/addresses/:id/delete',         isClient, ctrl.getDeleteAddress);
router.post('/addresses/:id/delete',        isClient, ctrl.postDeleteAddress);

// Favorites
router.get('/favorites',                    isClient, ctrl.getFavorites);
router.post('/favorites/add',               isClient, ctrl.postAddFavorite);
router.post('/favorites/remove',            isClient, ctrl.postRemoveFavorite);

module.exports = router;
