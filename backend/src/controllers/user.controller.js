const User = require('../models/User');
const Follow = require('../models/Follow');
const Friendship = require('../models/Friendship');
const Post = require('../models/Post');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [followerCount, followingCount, friendCount, isFollowing, friendship] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Friendship.countDocuments({ $or: [{ requester: user._id }, { recipient: user._id }], status: 'accepted' }),
      Follow.exists({ follower: req.user.id, following: user._id }),
      Friendship.findOne({
        $or: [{ requester: req.user.id, recipient: user._id }, { requester: user._id, recipient: req.user.id }]
      }).populate('requester', '_id username').populate('recipient', '_id username')
    ]);

    res.json({ ...user.toObject(), followerCount, followingCount, friendCount, isFollowing: !!isFollowing, friendship });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    ['username', 'bio', 'website', 'location'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.files?.avatar?.[0]) updates.avatar = `/uploads/${req.files.avatar[0].filename}`;
    if (req.files?.cover?.[0])  updates.cover  = `/uploads/${req.files.cover[0].filename}`;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password -refreshToken');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json([]);
    const users = await User.find({ username: { $regex: q, $options: 'i' }, _id: { $ne: req.user.id } })
      .select('username avatar bio').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSuggested = async (req, res) => {
  try {
    const [follows, friendships] = await Promise.all([
      Follow.find({ follower: req.user.id }).select('following'),
      Friendship.find({ $or: [{ requester: req.user.id }, { recipient: req.user.id }] }).select('requester recipient')
    ]);
    const excluded = new Set([req.user.id, ...follows.map(f => f.following.toString())]);
    friendships.forEach(f => { excluded.add(f.requester.toString()); excluded.add(f.recipient.toString()); });

    const users = await User.find({ _id: { $nin: Array.from(excluded) } })
      .select('username avatar bio').limit(8);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.params.id }).populate('follower', 'username avatar bio');
    res.json(follows.map(f => f.follower));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.params.id }).populate('following', 'username avatar bio');
    res.json(follows.map(f => f.following));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.params.id }, { recipient: req.params.id }], status: 'accepted'
    }).populate('requester', 'username avatar').populate('recipient', 'username avatar');

    const friends = friendships.map(f =>
      f.requester._id.toString() === req.params.id ? f.recipient : f.requester
    );
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
