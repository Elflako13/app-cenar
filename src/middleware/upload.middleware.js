const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
  cb(new Error('Solo se permiten imágenes'));
};

const limits = { fileSize: 5 * 1024 * 1024 };

module.exports = {
  profile: multer({ storage: makeStorage('profiles'), fileFilter, limits }).single('profileImage'),
  logo:    multer({ storage: makeStorage('logos'),    fileFilter, limits }).single('logo'),
  product: multer({ storage: makeStorage('products'), fileFilter, limits }).single('image'),
  icon:    multer({ storage: makeStorage('icons'),    fileFilter, limits }).single('icon'),
};
