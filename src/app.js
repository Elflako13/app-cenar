const express = require('express');
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { engine } = require('express-handlebars');
const Handlebars = require('handlebars');

const app = express();

// Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('ne', (a, b) => a !== b);
Handlebars.registerHelper('not', (a) => !a);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('json', (ctx) => JSON.stringify(ctx));
Handlebars.registerHelper('multiply', (a, b) => (a * b).toFixed(2));
Handlebars.registerHelper('formatDate', (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('es-DO');
});
Handlebars.registerHelper('statusLabel', (status) => {
  const map = { Pending: 'Pendiente', InProgress: 'En Proceso', Completed: 'Completado' };
  return map[status] || status;
});
Handlebars.registerHelper('statusClass', (status) => {
  const map = { Pending: 'warning', InProgress: 'primary', Completed: 'success' };
  return map[status] || 'secondary';
});

// Motor de plantillas
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 día
}));

// Pasar usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Rutas
app.use('/', require('./routes/auth.routes'));
app.use('/client', require('./routes/client.routes'));
app.use('/commerce', require('./routes/commerce.routes'));
app.use('/delivery', require('./routes/delivery.routes'));
app.use('/admin', require('./routes/admin.routes'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { layout: false, message: 'Página no encontrada', code: 404 });
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { layout: false, message: err.message || 'Error interno del servidor', code: 500 });
});

module.exports = app;
