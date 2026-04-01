const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, minlength: 6 },
  avatar:       { type: String, default: '' },
  cover:        { type: String, default: '' },
  bio:          { type: String, default: '', maxlength: 200 },
  website:      { type: String, default: '' },
  location:     { type: String, default: '' },
  refreshToken: { type: String, default: '' },
}, { timestamps: true });

userSchema.index({ username: 'text' });

module.exports = mongoose.model('User', userSchema);
