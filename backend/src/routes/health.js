const { Router } = require('express');
const supabase = require('../config/supabase');
const { getKeepAliveStatus } = require('../utils/keepAlive');

const router = Router();

const DB_LIMIT_MB = 500;       // Supabase free tier
const STORAGE_LIMIT_MB = 1024; // 1 GB

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Gráficas Diamante API is running' });
});

router.get('/db', async (req, res) => {
  try {
    // DB size via SQL function
    const { data: dbSize, error: dbErr } = await supabase.rpc('get_db_size');
    if (dbErr) throw dbErr;

    const dbUsedMb = dbSize?.[0]?.size_mb ?? 0;
    const dbPercent = Math.round((dbUsedMb / DB_LIMIT_MB) * 100);

    // Storage size via SQL function
    const { data: storageSize, error: storageErr } = await supabase.rpc('get_storage_size');

    let storageUsedMb = 0;
    if (!storageErr && storageSize?.[0]) {
      storageUsedMb = storageSize[0].size_mb;
    }
    const storagePercent = Math.round((storageUsedMb / STORAGE_LIMIT_MB) * 100);

    const keepAlive = getKeepAliveStatus();

    res.json({
      status: 'ok',
      supabase: 'connected',
      database: {
        used_mb: dbUsedMb,
        limit_mb: DB_LIMIT_MB,
        percent: dbPercent,
      },
      storage: {
        used_mb: storageUsedMb,
        limit_mb: STORAGE_LIMIT_MB,
        percent: storagePercent,
      },
      keepAlive,
    });
  } catch (err) {
    // If we can't reach Supabase at all, report it
    res.json({
      status: 'error',
      supabase: 'unreachable',
      error: err.message,
      keepAlive: getKeepAliveStatus(),
    });
  }
});

module.exports = router;
