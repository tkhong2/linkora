const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Friendship = require('../models/Friendship');
const { createNotification } = require('../utils/notify');

// Feed algorithm: score = reactions*2 + comments*3 + time_decay
function feedScore(post, now) {
  const ageHours = (now - new Date(post.createdAt)) / 3600000;
  const decay = Math.exp(-ageHours / 48); // half-life 48h
  return post.reactionCount * 2 + post.commentCount * 3 + decay * 10;
}

exports.getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Get friends + following
    const [friendships, follows] = await Promise.all([
      Friendship.find({ $or: [{ requester: req.user.id }, { recipient: req.user.id }], status: 'accepted' }),
      Follow.find({ follower: req.user.id })
    ]);

    const friendIds  = friendships.map(f => f.requester.toString() === req.user.id ? f.recipient : f.requester);
    const followIds  = follows.map(f => f.following);
    const authorIds  = [...new Set([...friendIds.map(String), ...followIds.map(String), req.user.id])];

    const posts = await Post.find({ author: { $in: authorIds } })
      .populate('author', 'username avatar')
      .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'username avatar' } })
      .sort({ createdAt: -1 })
      .limit(limit * 3); // fetch more to re-rank

    const now = Date.now();
    const ranked = posts
      .map(p => ({ post: p, score: feedScore(p, now) + (friendIds.some(id => id.toString() === p.author._id.toString()) ? 5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + limit)
      .map(x => x.post);

    // Attach user's reaction
    const postIds = ranked.map(p => p._id);
    const myReactions = await Reaction.find({ user: req.user.id, target: { $in: postIds }, targetType: 'post' });
    const reactionMap = {};
    myReactions.forEach(r => reactionMap[r.target.toString()] = r.type);

    const result = ranked.map(p => ({ ...p.toObject(), myReaction: reactionMap[p._id.toString()] || null }));

    res.json({ posts: result, page, hasMore: posts.length === limit * 3 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, sharedFrom, sharedCaption } = req.body;
    const images = req.files?.map(f => `/uploads/${f.filename}`) || [];

    if (!content?.trim() && images.length === 0 && !sharedFrom)
      return res.status(400).json({ message: 'Post cannot be empty' });

    const postData = { author: req.user.id, content: content || '', images };
    if (sharedFrom) {
      const original = await Post.findById(sharedFrom);
      if (!original) return res.status(404).json({ message: 'Original post not found' });
      postData.sharedFrom = sharedFrom;
      postData.sharedCaption = sharedCaption || '';
      original.shareCount++;
      await original.save();
      await createNotification(req.app.get('io'), { recipient: original.author, sender: req.user.id, type: 'share', post: original._id });
    }

    const post = await Post.create(postData);
    await post.populate('author', 'username avatar');
    if (post.sharedFrom) await post.populate({ path: 'sharedFrom', populate: { path: 'author', select: 'username avatar' } });

    req.app.get('io')?.emit('new_post', post);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    post.content = req.body.content ?? post.content;
    if (req.files?.length) post.images = req.files.map(f => `/uploads/${f.filename}`);
    await post.save();
    await post.populate('author', 'username avatar');
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id }), Reaction.deleteMany({ target: post._id })]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username avatar')
      .populate({ path: 'sharedFrom', populate: { path: 'author', select: 'username avatar' } });

    const postIds = posts.map(p => p._id);
    const myReactions = await Reaction.find({ user: req.user.id, target: { $in: postIds }, targetType: 'post' });
    const reactionMap = {};
    myReactions.forEach(r => reactionMap[r.target.toString()] = r.type);

    const result = posts.map(p => ({ ...p.toObject(), myReaction: reactionMap[p._id.toString()] || null }));
    res.json({ posts: result, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reactPost = async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await Reaction.findOne({ user: req.user.id, target: post._id, targetType: 'post' });

    if (existing) {
      if (existing.type === type) {
        // Remove reaction
        await existing.deleteOne();
        post.reactionCount = Math.max(0, post.reactionCount - 1);
        await post.save();
        return res.json({ reactionCount: post.reactionCount, myReaction: null });
      }
      existing.type = type;
      await existing.save();
    } else {
      await Reaction.create({ user: req.user.id, target: post._id, targetType: 'post', type });
      post.reactionCount++;
      await post.save();
      await createNotification(req.app.get('io'), { recipient: post.author, sender: req.user.id, type: 'like', post: post._id });
    }

    res.json({ reactionCount: post.reactionCount, myReaction: type });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReactions = async (req, res) => {
  try {
    const reactions = await Reaction.find({ target: req.params.id, targetType: 'post' })
      .populate('user', 'username avatar').limit(100);

    const summary = {};
    reactions.forEach(r => { summary[r.type] = (summary[r.type] || 0) + 1; });
    res.json({ reactions, summary, total: reactions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) return res.json({ posts: [] });
    const posts = await Post.find({ $text: { $search: q } })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * 10).limit(10)
      .populate('author', 'username avatar');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
