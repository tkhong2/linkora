const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Search users
router.get('/', auth, async (req, res) => {
  try {
    const q = req.query.q || '';
    const users = await User.find({ username: { $regex: q, $options: 'i' }, _id: { $ne: req.user.id } })
      .select('username avatar bio followers').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Suggested users (not following, not self)
router.get('/suggested', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('following');
    const excluded = [...me.following, me._id];
    const users = await User.find({ _id: { $nin: excluded } })
      .select('username avatar bio followers').limit(6);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.username) updates.username = req.body.username;
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / Unfollow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
      await Notification.create({ recipient: target._id, sender: me._id, type: 'follow' });
      const io = req.app.get('io');
      io?.to(target._id.toString()).emit('notification', {
        type: 'follow',
        sender: { _id: me._id, username: me.username, avatar: me.avatar }
      });
    }
    await me.save();
    await target.save();
    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
