const express  = require('express');
const router   = express.Router();
const { requireRole } = require('../middleware/auth.middleware');
const upload   = require('../middleware/upload.middleware');
const ctrl     = require('../controllers/admin.controller');

const isAdmin = requireRole('Admin');

router.get('/', isAdmin, ctrl.getDashboard);

router.get('/clients',              isAdmin, ctrl.getClients);
router.get('/deliveries',           isAdmin, ctrl.getDeliveries);
router.get('/commerces',            isAdmin, ctrl.getCommerces);
router.post('/users/:id/toggle-status', isAdmin, ctrl.postToggleStatus);

router.get('/admins',               isAdmin, ctrl.getAdmins);
router.get('/admins/create',        isAdmin, ctrl.getCreateAdmin);
router.post('/admins/create',       isAdmin, ctrl.postCreateAdmin);
router.get('/admins/:id/edit',      isAdmin, ctrl.getEditAdmin);
router.post('/admins/:id/edit',     isAdmin, ctrl.postEditAdmin);
router.post('/admins/:id/toggle-status', isAdmin, ctrl.postToggleAdminStatus);

router.get('/configurations',              isAdmin, ctrl.getConfigurations);
router.get('/configurations/:key/edit',    isAdmin, ctrl.getEditConfiguration);
router.post('/configurations/:key/edit',   isAdmin, ctrl.postEditConfiguration);

router.get('/commerce-types',              isAdmin, ctrl.getCommerceTypes);
router.get('/commerce-types/create',       isAdmin, ctrl.getCreateCommerceType);
router.post('/commerce-types/create',      isAdmin, upload.icon, ctrl.postCreateCommerceType);
router.get('/commerce-types/:id/edit',     isAdmin, ctrl.getEditCommerceType);
router.post('/commerce-types/:id/edit',    isAdmin, upload.icon, ctrl.postEditCommerceType);
router.get('/commerce-types/:id/delete',   isAdmin, ctrl.getDeleteCommerceType);
router.post('/commerce-types/:id/delete',  isAdmin, ctrl.postDeleteCommerceType);

module.exports = router;
