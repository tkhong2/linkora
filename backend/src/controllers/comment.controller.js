const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const { createNotification } = require('../utils/notify');

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;
    const parent = req.query.parent || null;

    const comments = await Comment.find({ post: postId, parent })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username avatar');

    const ids = comments.map(c => c._id);
    const myReactions = await Reaction.find({ user: req.user.id, target: { $in: ids }, targetType: 'comment' });
    const reactionMap = {};
    myReactions.forEach(r => reactionMap[r.target.toString()] = r.type);

    const result = comments.map(c => ({ ...c.toObject(), myReaction: reactionMap[c._id.toString()] || null }));
    res.json({ comments: result, page, hasMore: comments.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { content, parent } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({ post: post._id, author: req.user.id, content, parent: parent || null });
    await comment.populate('author', 'username avatar');

    if (parent) {
      await Comment.findByIdAndUpdate(parent, { $inc: { replyCount: 1 } });
      const parentComment = await Comment.findById(parent);
      await createNotification(req.app.get('io'), { recipient: parentComment.author, sender: req.user.id, type: 'reply', post: post._id, comment: comment._id });
    } else {
      post.commentCount++;
      await post.save();
      await createNotification(req.app.get('io'), { recipient: post.author, sender: req.user.id, type: 'comment', post: post._id, comment: comment._id });
    }

    res.status(201).json({ ...comment.toObject(), myReaction: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    if (!comment.parent) {
      await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    } else {
      await Comment.findByIdAndUpdate(comment.parent, { $inc: { replyCount: -1 } });
    }
    await Promise.all([comment.deleteOne(), Comment.deleteMany({ parent: comment._id }), Reaction.deleteMany({ target: comment._id })]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reactComment = async (req, res) => {
  try {
    const { type } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });

    const existing = await Reaction.findOne({ user: req.user.id, target: comment._id, targetType: 'comment' });
    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        comment.reactionCount = Math.max(0, comment.reactionCount - 1);
        await comment.save();
        return res.json({ reactionCount: comment.reactionCount, myReaction: null });
      }
      existing.type = type;
      await existing.save();
    } else {
      await Reaction.create({ user: req.user.id, target: comment._id, targetType: 'comment', type });
      comment.reactionCount++;
      await comment.save();
    }
    res.json({ reactionCount: comment.reactionCount, myReaction: type });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
