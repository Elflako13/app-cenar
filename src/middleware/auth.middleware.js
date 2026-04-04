const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (!roles.includes(req.session.user.role)) {
    return res.redirect('/login');
  }
  next();
};

const redirectIfAuth = (req, res, next) => {
  if (req.session.user) {
    return redirectByRole(req.session.user.role, res);
  }
  next();
};

const redirectByRole = (role, res) => {
  const map = {
    Admin:    '/admin',
    Client:   '/client',
    Commerce: '/commerce',
    Delivery: '/delivery',
  };
  res.redirect(map[role] || '/login');
};

module.exports = { requireAuth, requireRole, redirectIfAuth, redirectByRole };
