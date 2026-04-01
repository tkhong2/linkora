const Friendship = require('../models/Friendship');
const { createNotification } = require('../utils/notify');

exports.sendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ message: 'Cannot add yourself' });

    const existing = await Friendship.findOne({
      $or: [{ requester: req.user.id, recipient: userId }, { requester: userId, recipient: req.user.id }]
    });
    if (existing) return res.status(400).json({ message: 'Request already exists', friendship: existing });

    const friendship = await Friendship.create({ requester: req.user.id, recipient: userId });
    await createNotification(req.app.get('io'), { recipient: userId, sender: req.user.id, type: 'friend_request' });
    res.status(201).json(friendship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const friendship = await Friendship.findOne({ requester: req.params.userId, recipient: req.user.id, status: 'pending' });
    if (!friendship) return res.status(404).json({ message: 'Request not found' });

    friendship.status = action === 'accept' ? 'accepted' : 'rejected';
    await friendship.save();

    if (action === 'accept') {
      await createNotification(req.app.get('io'), { recipient: friendship.requester, sender: req.user.id, type: 'friend_accept' });
    }
    res.json(friendship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
    await Friendship.deleteOne({
      $or: [{ requester: req.user.id, recipient: req.params.userId }, { requester: req.params.userId, recipient: req.user.id }],
      status: 'accepted'
    });
    res.json({ message: 'Unfriended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    await Friendship.deleteOne({ requester: req.user.id, recipient: req.params.userId, status: 'pending' });
    res.json({ message: 'Cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({ recipient: req.user.id, status: 'pending' })
      .populate('requester', 'username avatar bio').sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
