const Story = require('../models/Story');
const Follow = require('../models/Follow');
const Friendship = require('../models/Friendship');

exports.getStories = async (req, res) => {
  try {
    const [follows, friendships] = await Promise.all([
      Follow.find({ follower: req.user.id }).select('following'),
      Friendship.find({ $or: [{ requester: req.user.id }, { recipient: req.user.id }], status: 'accepted' })
    ]);
    const friendIds = friendships.map(f => f.requester.toString() === req.user.id ? f.recipient : f.requester);
    const ids = [...new Set([...follows.map(f => f.following.toString()), ...friendIds.map(String), req.user.id])];

    const stories = await Story.find({ author: { $in: ids }, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 }).populate('author', 'username avatar');

    const grouped = {};
    for (const s of stories) {
      const aid = s.author._id.toString();
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [], hasUnread: false };
      grouped[aid].stories.push(s);
      if (!s.viewers.some(v => v.user.toString() === req.user.id)) grouped[aid].hasUnread = true;
    }
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Media required' });
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const story = await Story.create({
      author: req.user.id,
      media: `/uploads/${req.file.filename}`,
      mediaType,
      caption: req.body.caption || ''
    });
    await story.populate('author', 'username avatar');
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.viewStory = async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: { user: req.user.id, viewedAt: new Date() } }
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    if (story.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await story.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
