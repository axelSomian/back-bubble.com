const House = require('../models/house.model');
const User = require('../models/user.model');
const cloudinaryController = require('./cloudinary.controller');
const sanitize = require('mongo-sanitize');
const fs = require('fs');

// ─── Dashboard gérant ─────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const isSuperGerant = req.auth.role === 'supergerant';
    const ownerId = req.auth.ownerId;

    let query = {};
    if (isSuperGerant) {
      // Le supergerant voit toutes les maisons du propriétaire
      query = { idOwner: ownerId };
    } else {
      // Le gérant voit seulement ses maisons assignées
      query = { assignedGerant: req.auth.userId };
    }

    const [total, pending, published, rejected] = await Promise.all([
      House.countDocuments(query),
      House.countDocuments({ ...query, status: 'pending' }),
      House.countDocuments({ ...query, status: 'published' }),
      House.countDocuments({ ...query, status: 'rejected' }),
    ]);

    res.status(200).json({ total, pending, published, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

// ─── Maisons du gérant ────────────────────────────────────────────────────────

/**
 * Lister les maisons du gérant (ou toutes si supergerant)
 */
exports.getGerantHouses = async (req, res) => {
  req.query = sanitize(req.query);
  try {
    const isSuperGerant = req.auth.role === 'supergerant';
    const ownerId = req.auth.ownerId;

    const query = isSuperGerant
      ? { idOwner: ownerId }
      : { assignedGerant: req.auth.userId };

    const houses = await House.find(query).sort({ createdAt: -1 });
    res.status(200).json(houses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Créer une maison (statut: pending — validation requise)
 * Réservé aux gérants
 */
exports.createHouse = async (req, res) => {
  req.body = sanitize(req.body);
  const files = req.files;

  try {
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucune image envoyée.' });
    }

    if (req.body.price < 0 || req.body.rooms < 0) {
      return res.status(400).json({ error: 'Le prix et le nombre de pièces ne peuvent pas être négatifs.' });
    }

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinaryController.uploadImage(file);
        return result.medium;
      })
    );

    const house = new House({
      ...req.body,
      imageUrl: imageUrls,
      idOwner: req.auth.ownerId,
      assignedGerant: req.auth.userId,
      status: 'pending',
    });

    if (typeof req.body.equipments === 'string') {
      try {
        house.equipments = JSON.parse(req.body.equipments);
      } catch {
        return res.status(400).json({ error: 'Format invalide pour les équipements.' });
      }
    }

    await house.save();
    res.status(201).json({ message: 'Maison créée et en attente de validation.', house });
  } catch (err) {
    console.error('Erreur création maison (gérant):', err);
    res.status(500).json({ error: 'Erreur lors de la création.' });
  } finally {
    try {
      if (files && files.length > 0) {
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
    } catch (e) {
      console.error('Erreur nettoyage fichiers:', e);
    }
  }
};

/**
 * Valider ou rejeter une maison (supergerant uniquement)
 * Body: { action: 'approve' | 'reject', rejectionNote?: string }
 */
exports.validateHouse = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    if (req.auth.role !== 'supergerant') {
      return res.status(403).json({ error: 'Réservé au supergerant.' });
    }

    const { action, rejectionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide.' });
    }

    const house = await House.findOne({ _id: req.params.id, idOwner: req.auth.ownerId, status: 'pending' });
    if (!house) return res.status(404).json({ error: 'Maison introuvable ou non en attente.' });

    house.status = action === 'approve' ? 'published' : 'rejected';
    if (action === 'reject') house.rejectionNote = rejectionNote || null;
    else house.rejectionNote = null;

    await house.save();
    res.status(200).json({ message: `Maison ${action === 'approve' ? 'publiée' : 'rejetée'}.`, house });
  } catch (err) {
    console.error('Erreur validation maison (supergerant):', err);
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Maisons en attente (supergerant uniquement)
 */
exports.getPendingHouses = async (req, res) => {
  try {
    if (req.auth.role !== 'supergerant') {
      return res.status(403).json({ error: 'Réservé au supergerant.' });
    }

    const houses = await House.find({ idOwner: req.auth.ownerId, status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(houses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Lister les gérants du même propriétaire (supergerant uniquement)
 */
exports.listGerants = async (req, res) => {
  try {
    if (req.auth.role !== 'supergerant') {
      return res.status(403).json({ error: 'Réservé au supergerant.' });
    }
    const gerants = await User.find(
      { ownerId: req.auth.ownerId, type: 'gerant' },
      '-password'
    );
    res.status(200).json(gerants);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Profil du propriétaire (supergerant uniquement)
 */
exports.getOwnerProfile = async (req, res) => {
  try {
    if (req.auth.role !== 'supergerant') {
      return res.status(403).json({ error: 'Réservé au supergerant.' });
    }
    const owner = await User.findById(req.auth.ownerId, '-password');
    if (!owner) return res.status(404).json({ error: 'Propriétaire introuvable.' });
    res.status(200).json(owner);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Profil + infos du gérant connecté
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId, '-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    let owner = null;
    if (user.ownerId) {
      owner = await User.findById(user.ownerId, 'firstName lastName email companyName');
    }

    res.status(200).json({ user, owner });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};
