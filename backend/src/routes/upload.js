const { Router } = require('express');
const multer = require('multer');
const supabase = require('../config/supabase');
const path = require('path');
const crypto = require('crypto');

const router = Router();

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_BUCKETS = ['maquinas', 'trabajo', 'repuesto'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan imágenes (JPEG, PNG, WebP).`));
    }
  },
});

router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La imagen excede el límite de 5MB' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const bucket = req.query.bucket || 'maquinas';

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return res.status(400).json({ error: `Bucket no permitido: ${bucket}` });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileName = `${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  res.json({ url: data.publicUrl });
});

module.exports = router;
