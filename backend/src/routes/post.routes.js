const router = require('express').Router();
const ctrl = require('../controllers/post.controller');
const auth = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/feed',              auth, ctrl.getFeed);
router.get('/search',            auth, ctrl.searchPosts);
router.get('/user/:userId',      auth, ctrl.getUserPosts);
router.post('/',                 auth, upload.array('images', 5), ctrl.createPost);
router.put('/:id',               auth, upload.array('images', 5), ctrl.updatePost);
router.delete('/:id',            auth, ctrl.deletePost);
router.post('/:id/react',        auth, ctrl.reactPost);
router.get('/:id/reactions',     auth, ctrl.getReactions);

module.exports = router;
