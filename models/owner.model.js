const mongoose = require('mongoose');
const ownerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    profileimageUrl: { type: String, required: true }, // Array of image URLs
})
const Owner = mongoose.model('Owner', ownerSchema);
module.exports = Owner;