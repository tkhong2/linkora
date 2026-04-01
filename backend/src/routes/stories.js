const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get stories from following + own
router.get('/', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('following');
    const ids = [...me.following, me._id];
    const stories = await Story.find({ author: { $in: ids }, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar');

    // Group by author
    const grouped = {};
    for (const s of stories) {
      const aid = s.author._id.toString();
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [], hasUnread: false };
      grouped[aid].stories.push(s);
      if (!s.viewers.includes(req.user.id)) grouped[aid].hasUnread = true;
    }
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create story
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image required' });
    const story = await Story.create({
      author: req.user.id,
      image: `/uploads/${req.file.filename}`,
      caption: req.body.caption || ''
    });
    await story.populate('author', 'username avatar');
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark story as viewed
router.post('/:id/view', auth, async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.user.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete own story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    if (story.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await story.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
