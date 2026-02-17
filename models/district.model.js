const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    label: { type: String, required: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    orderIndex: { type: Number, required: true }
}, {
    timestamps: true
});

// Indexes critiques pour la performance et l'unicité
districtSchema.index({ city: 1, orderIndex: 1 }, { unique: true });
districtSchema.index({ label: 1, city: 1 }, { unique: true });

const District = mongoose.model('District', districtSchema);
module.exports = District;
