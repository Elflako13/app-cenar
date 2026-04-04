const express  = require('express');
const router   = express.Router();
const { requireRole } = require('../middleware/auth.middleware');
const upload   = require('../middleware/upload.middleware');
const ctrl     = require('../controllers/delivery.controller');

const isDelivery = requireRole('Delivery');

router.get('/',                       isDelivery, ctrl.getHome);
router.get('/orders/:id',             isDelivery, ctrl.getOrderDetail);
router.post('/orders/:id/complete',   isDelivery, ctrl.postCompleteOrder);
router.get('/profile',                isDelivery, ctrl.getProfile);
router.post('/profile',               isDelivery, upload.profile, ctrl.postUpdateProfile);

module.exports = router;
