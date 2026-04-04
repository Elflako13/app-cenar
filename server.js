const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[${env.toUpperCase()}] AppCenar corriendo en http://localhost:${PORT}`);
  });
});
