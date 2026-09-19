const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;

function ensureDir(dir) {
  try {
    if (!isVercel && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'logos');
const FOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'fotos');

ensureDir(UPLOAD_DIR);
ensureDir(FOTO_DIR);

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
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
  limits: { fileSize: 5 * 1024 * 1024 }
});

const storageFoto = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
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
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = { upload, uploadFotoUsuario };
