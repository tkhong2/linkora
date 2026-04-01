const Message = require('../models/Message');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).sort({ createdAt: -1 })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partnerId = msg.sender._id.toString() === req.user.id ? msg.receiver._id.toString() : msg.sender._id.toString();
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        const unread = await Message.countDocuments({ sender: partnerId, receiver: req.user.id, seen: false });
        conversations.push({ ...msg.toObject(), unreadCount: unread });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 30;
    const messages = await Message.find({
      $or: [{ sender: req.user.id, receiver: req.params.userId }, { sender: req.params.userId, receiver: req.user.id }]
    }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('sender', 'username avatar');

    // Mark as seen
    await Message.updateMany({ sender: req.params.userId, receiver: req.user.id, seen: false }, { seen: true, seenAt: new Date() });
    const io = req.app.get('io');
    io?.to(req.params.userId).emit('messages_seen', { by: req.user.id });

    res.json({ messages: messages.reverse(), page, hasMore: messages.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
