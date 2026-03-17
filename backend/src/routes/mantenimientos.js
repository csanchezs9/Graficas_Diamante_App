const { Router } = require('express');
const controller = require('../controllers/mantenimientos');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.delete('/:id', controller.remove);
router.put('/:id', controller.update);

module.exports = router;
