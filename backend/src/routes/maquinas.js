const { Router } = require('express');
const controller = require('../controllers/maquinas');
const validateDeletePassword = require('../middleware/validateDeletePassword');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', validateDeletePassword, controller.remove);

module.exports = router;
