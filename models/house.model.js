// models/House.js
const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  rooms: { type: Number, required: true },
  price: { type: Number, required: true },
  imageUrl: [{ type: String, required: true }],
  city: { type: String, required: true },
  neighboorhood: { type: String, required: true },
  geoSite: { type: String, required: false },
  idOwner: { type: String, required: true },
  isLocated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  notation: { type: Number, default: 0 },
  equipments: { type: [String], required: true } // Array of strings for equipments
}, { timestamps: true });

// Indexation pour booster les performances de recherche
houseSchema.index({ price: 1 });
houseSchema.index({ type: 1 });
houseSchema.index({ idOwner: 1 });
houseSchema.index({ isActive: 1 });
// Index texte composé pour la recherche full-text (remplace les index simples city/neighboorhood)
houseSchema.index({ title: 'text', description: 'text', city: 'text', neighboorhood: 'text' }, { name: 'house_text_search' });

const House = mongoose.model('House', houseSchema);
module.exports = House;
