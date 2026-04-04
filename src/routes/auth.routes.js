const router = require('express').Router();
const upload = require('../middleware/upload.middleware');
const { redirectIfAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

router.get('/',                   redirectIfAuth, (req, res) => res.redirect('/login'));
router.get('/login',              redirectIfAuth, ctrl.getLogin);
router.post('/login',             ctrl.postLogin);
router.get('/register',           redirectIfAuth, ctrl.getRegister);
router.post('/register',          upload.profile, ctrl.postRegister);
router.get('/register-commerce',  redirectIfAuth, ctrl.getRegisterCommerce);
router.post('/register-commerce', upload.logo,    ctrl.postRegisterCommerce);
router.get('/confirm-email',      ctrl.confirmEmail);
router.get('/forgot-password',    ctrl.getForgotPassword);
router.post('/forgot-password',   ctrl.postForgotPassword);
router.get('/reset-password',     ctrl.getResetPassword);
router.post('/reset-password',    ctrl.postResetPassword);
router.get('/logout',             ctrl.logout);

module.exports = router;
