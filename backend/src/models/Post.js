const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, default: '' },
  images:   [{ type: String }],
  // Share
  sharedFrom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  sharedCaption: { type: String, default: '' },
  // Stats (denormalized for feed algorithm)
  reactionCount: { type: Number, default: 0 },
  commentCount:  { type: Number, default: 0 },
  shareCount:    { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
