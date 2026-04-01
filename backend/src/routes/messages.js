const router = require('express').Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get conversation with a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 }).populate('sender', 'username avatar');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get list of conversations (last message per user)
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).sort({ createdAt: -1 }).populate('sender', 'username avatar').populate('receiver', 'username avatar');

    // Deduplicate by conversation partner
    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partnerId = msg.sender._id.toString() === req.user.id ? msg.receiver._id.toString() : msg.sender._id.toString();
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        conversations.push(msg);
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
