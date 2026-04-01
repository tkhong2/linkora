const router = require('express').Router();
const ctrl = require('../controllers/message.controller');
const auth = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/',           auth, ctrl.getConversations);
router.get('/:userId',    auth, ctrl.getMessages);
router.post('/upload',    auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
