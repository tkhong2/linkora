const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target:     { type: mongoose.Schema.Types.ObjectId, required: true }, // post or comment id
  targetType: { type: String, enum: ['post', 'comment'], required: true },
  type:       { type: String, enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], required: true },
}, { timestamps: true });

reactionSchema.index({ user: 1, target: 1, targetType: 1 }, { unique: true });
reactionSchema.index({ target: 1, targetType: 1 });

module.exports = mongoose.model('Reaction', reactionSchema);
