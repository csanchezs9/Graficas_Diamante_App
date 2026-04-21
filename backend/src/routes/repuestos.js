const { Router } = require('express');
const controller = require('../controllers/repuestos');
const validateDeletePassword = require('../middleware/validateDeletePassword');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.delete('/:id', validateDeletePassword, controller.remove);
router.put('/:id', controller.update);

module.exports = router;
