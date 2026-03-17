const { Router } = require('express');
const controller = require('../controllers/maquinas');

const router = Router();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
