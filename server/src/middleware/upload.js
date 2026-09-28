const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, SVG, WEBP)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const fileFilterFoto = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file.mimetype?.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Use jpg o png'));
  }
};

const uploadFotoUsuario = multer({
  storage,
  fileFilter: fileFilterFoto,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const fileFilterMasivo = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.xlsx', '.csv'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Use .xlsx o .csv'));
  }
};

const uploadCargaMasiva = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilterMasivo,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { upload, uploadFotoUsuario, uploadCargaMasiva };
