const Follow = require('../models/Follow');
const { createNotification } = require('../utils/notify');

exports.toggle = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    const existing = await Follow.findOne({ follower: req.user.id, following: userId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ following: false });
    }
    await Follow.create({ follower: req.user.id, following: userId });
    await createNotification(req.app.get('io'), { recipient: userId, sender: req.user.id, type: 'follow' });
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
