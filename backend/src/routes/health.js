const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Gráficas Diamante API is running' });
});

module.exports = router;
