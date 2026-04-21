const { Router } = require('express');
const controller = require('../controllers/mantenimientos');
const repuestosCtrl = require('../controllers/mantenimientoRepuestos');
const validateDeletePassword = require('../middleware/validateDeletePassword');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.delete('/:id', validateDeletePassword, controller.remove);
router.put('/:id', controller.update);

router.post('/:id/repuestos', repuestosCtrl.link);
router.delete('/:id/repuestos/:repuesto_id', repuestosCtrl.unlink);

module.exports = router;
