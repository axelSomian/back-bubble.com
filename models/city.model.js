const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index separateur
citySchema.index({ name: 1 }, { unique: true });

const City = mongoose.model('City', citySchema);
module.exports = City;
