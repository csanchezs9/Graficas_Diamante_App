const supabase = require('../config/supabase');

const PING_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const RETRY_INTERVAL = 5 * 60 * 1000;     // 5 min on failure
const MAX_RETRIES = 3;

let intervalId = null;
let lastPing = null;
let lastStatus = 'unknown';

async function pingSupabase(attempt = 1) {
  try {
    const result = await supabase.from('maquinas').select('id').limit(1);

    if (result.error) throw result.error;

    lastPing = new Date().toISOString();
    lastStatus = 'ok';
    console.log(`[KeepAlive] Ping OK — ${lastPing}`);
  } catch (err) {
    lastStatus = 'error';
    console.error(`[KeepAlive] Ping FAILED (attempt ${attempt}/${MAX_RETRIES}) —`, err.message);

    if (attempt < MAX_RETRIES) {
      const delay = RETRY_INTERVAL * attempt; // backoff: 5m, 10m, 15m
      console.log(`[KeepAlive] Retrying in ${delay / 60000} min...`);
      setTimeout(() => pingSupabase(attempt + 1), delay);
    } else {
      console.error('[KeepAlive] All retries exhausted. Will try again at next interval.');
    }
  }
}

function startKeepAlive() {
  console.log('[KeepAlive] Started — pinging Supabase every 4 hours');

  // Ping immediately on server start (covers restarts/deploys)
  pingSupabase();

  // Then every 4 hours
  intervalId = setInterval(() => pingSupabase(), PING_INTERVAL);

  // Ensure interval survives unhandled rejections
  process.on('uncaughtException', (err) => {
    console.error('[KeepAlive] Uncaught exception, keepalive still running:', err.message);
  });
}

function getKeepAliveStatus() {
  return { lastPing, lastStatus };
}

module.exports = { startKeepAlive, getKeepAliveStatus };
