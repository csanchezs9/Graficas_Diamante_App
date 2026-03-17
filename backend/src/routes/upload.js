const { Router } = require('express');
const multer = require('multer');
const supabase = require('../config/supabase');
const path = require('path');
const crypto = require('crypto');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req, res) => {
  console.log('[UPLOAD] Request received');
  console.log('[UPLOAD] File:', req.file ? { name: req.file.originalname, size: req.file.size, mime: req.file.mimetype } : 'NO FILE');
  
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const ext = path.extname(req.file.originalname);
  const fileName = `${crypto.randomUUID()}${ext}`;

  console.log('[UPLOAD] Uploading to Supabase:', fileName);

  const { error } = await supabase.storage
    .from('maquinas')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
    });

  if (error) {
    console.log('[UPLOAD] Supabase error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const { data } = supabase.storage.from('maquinas').getPublicUrl(fileName);
  console.log('[UPLOAD] Success, URL:', data.publicUrl);

  res.json({ url: data.publicUrl });
});

module.exports = router;
