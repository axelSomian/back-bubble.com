const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profileimageUrl: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  type: { type: String, required: true, enum: ['user', 'admin', 'superadmin', 'gerant', 'supergerant'], default: 'user' },
  // Pour les gérants : référence au propriétaire (admin) qui les a créés
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Pour les admins : nom de l'entreprise ou structure
  companyName: { type: String, default: null },
  likedHouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'House', default: [] }],
})

// Indexation pour booster les recherches par email
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;