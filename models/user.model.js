const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profileimageUrl: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, required: true, enum: ['user', 'admin', 'owner'], default: 'user' },
})

// Indexation pour booster les recherches par email
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;