const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Ensure uploads dir exists relative to project root (where node runs)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get feed (posts from following + own)
router.get('/feed', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('following');
    if (!me) return res.status(404).json({ message: 'User not found' });
    const ids = [...me.following, me._id];
    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'username avatar')
      .populate('comments.user', 'username avatar');
    res.json(posts);
  } catch (err) {
    console.error('feed error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all posts (explore)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('author', 'username avatar')
      .populate('comments.user', 'username avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user posts
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.user', 'username avatar');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.body.content?.trim() && !req.file) {
      return res.status(400).json({ message: 'Post must have content or image' });
    }
    const data = { author: req.user.id, content: req.body.content || '' };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const post = await Post.create(data);
    await post.populate('author', 'username avatar');
    req.app.get('io')?.emit('new_post', post);
    res.status(201).json(post);
  } catch (err) {
    console.error('create post error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / Unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.includes(req.user.id);
    if (liked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
      if (post.author.toString() !== req.user.id) {
        await Notification.create({ recipient: post.author, sender: req.user.id, type: 'like', post: post._id });
        const sender = await User.findById(req.user.id).select('username avatar');
        req.app.get('io')?.to(post.author.toString()).emit('notification', { type: 'like', sender, postId: post._id });
      }
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    if (!req.body.content?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ user: req.user.id, content: req.body.content });
    await post.save();
    await post.populate('comments.user', 'username avatar');
    const newComment = post.comments[post.comments.length - 1];
    if (post.author.toString() !== req.user.id) {
      await Notification.create({ recipient: post.author, sender: req.user.id, type: 'comment', post: post._id });
      const sender = await User.findById(req.user.id).select('username avatar');
      req.app.get('io')?.to(post.author.toString()).emit('notification', { type: 'comment', sender, postId: post._id });
    }
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    comment.deleteOne();
    await post.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
