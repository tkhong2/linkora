const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media:     { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption:   { type: String, default: '' },
  viewers:   [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: Date }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ author: 1 });

module.exports = mongoose.model('Story', storySchema);
