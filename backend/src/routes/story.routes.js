const router = require('express').Router();
const ctrl = require('../controllers/story.controller');
const auth = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/',           auth, ctrl.getStories);
router.post('/',          auth, upload.single('media'), ctrl.createStory);
router.post('/:id/view',  auth, ctrl.viewStory);
router.delete('/:id',     auth, ctrl.deleteStory);

module.exports = router;
