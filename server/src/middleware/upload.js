const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'logos');

// Asegurar que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = `institucion_${req.usuario?.institucionId || 'default'}_${Date.now()}${ext}`;
    cb(null, nombre);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (PNG, JPG, JPEG, GIF, SVG)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// Subida de foto de perfil de usuarios (jpg/jpeg/png, máx 2MB)
const FOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'fotos');

if (!fs.existsSync(FOTO_DIR)) {
  fs.mkdirSync(FOTO_DIR, { recursive: true });
}

const storageFoto = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FOTO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = req.params.id || req.usuario?._id || 'u';
    cb(null, `usuario_${id}_${Date.now()}${ext}`);
  }
});

const fileFilterFoto = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no soportado. Use jpg o png'));
  }
};

const uploadFotoUsuario = multer({
  storage: storageFoto,
  fileFilter: fileFilterFoto,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB máximo
});

module.exports = { upload, uploadFotoUsuario };
