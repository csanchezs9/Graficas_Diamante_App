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

// DELETE /api/upload?url=<encoded_public_url>
router.delete('/', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Se requiere el parámetro url' });
  }

  try {
    // Extract bucket and filename from Supabase public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/storage/v1/object/public/');
    if (parts.length < 2) {
      return res.status(400).json({ error: 'URL no es una URL válida de Supabase Storage' });
    }

    const pathAfterPublic = parts[1]; // e.g. "maquinas/abc-123.jpg"
    const slashIndex = pathAfterPublic.indexOf('/');
    if (slashIndex === -1) {
      return res.status(400).json({ error: 'No se pudo extraer bucket y archivo de la URL' });
    }

    const bucket = pathAfterPublic.substring(0, slashIndex);
    const filename = pathAfterPublic.substring(slashIndex + 1);

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `Bucket no permitido: ${bucket}` });
    }

    const { error } = await supabase.storage.from(bucket).remove([filename]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    return res.status(400).json({ error: 'URL inválida' });
  }
});

module.exports = router;
