const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/comment.controller');
const auth = require('../middleware/auth');

router.get('/',          auth, ctrl.getComments);
router.post('/',         auth, ctrl.createComment);
router.delete('/:id',    auth, ctrl.deleteComment);
router.post('/:id/react',auth, ctrl.reactComment);

module.exports = router;
