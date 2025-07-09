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
  geoSite: { type: String, required: true },
  idOwner: { type: Number, required: true },
  isLocated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  notation: { type: Number, default: 0 },
  equipments: { type: [String], required:true } // Array of strings for equipments
}, { timestamps: true });

const House = mongoose.model('House', houseSchema);
module.exports = House;
