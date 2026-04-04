const express  = require('express');
const router   = express.Router();
const { requireRole } = require('../middleware/auth.middleware');
const upload   = require('../middleware/upload.middleware');
const ctrl     = require('../controllers/commerce.controller');

const isCommerce = requireRole('Commerce');

router.get('/',                            isCommerce, ctrl.getHome);
router.get('/orders/:id',                  isCommerce, ctrl.getOrderDetail);
router.post('/orders/:id/assign-delivery', isCommerce, ctrl.postAssignDelivery);

router.get('/profile',  isCommerce, ctrl.getProfile);
router.post('/profile', isCommerce, upload.logo, ctrl.postUpdateProfile);

router.get('/categories',             isCommerce, ctrl.getCategories);
router.get('/categories/create',      isCommerce, ctrl.getCreateCategory);
router.post('/categories/create',     isCommerce, ctrl.postCreateCategory);
router.get('/categories/:id/edit',    isCommerce, ctrl.getEditCategory);
router.post('/categories/:id/edit',   isCommerce, ctrl.postEditCategory);
router.get('/categories/:id/delete',  isCommerce, ctrl.getDeleteCategory);
router.post('/categories/:id/delete', isCommerce, ctrl.postDeleteCategory);

router.get('/products',             isCommerce, ctrl.getProducts);
router.get('/products/create',      isCommerce, ctrl.getCreateProduct);
router.post('/products/create',     isCommerce, upload.product, ctrl.postCreateProduct);
router.get('/products/:id/edit',    isCommerce, ctrl.getEditProduct);
router.post('/products/:id/edit',   isCommerce, upload.product, ctrl.postEditProduct);
router.get('/products/:id/delete',  isCommerce, ctrl.getDeleteProduct);
router.post('/products/:id/delete', isCommerce, ctrl.postDeleteProduct);

module.exports = router;
