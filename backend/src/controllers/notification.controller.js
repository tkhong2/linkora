const Notification = require('../models/Notification');

exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 20;
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('sender', 'username avatar')
      .populate('post', 'content images');
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ notifications, unreadCount, page, hasMore: notifications.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    if (req.params.id) {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
    } else {
      await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
