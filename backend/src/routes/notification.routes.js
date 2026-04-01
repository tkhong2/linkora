const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

router.get('/',        auth, ctrl.getAll);
router.put('/read',    auth, ctrl.markRead);
router.put('/:id/read',auth, ctrl.markRead);

module.exports = router;
