const User = require('../models/user.model');
const House = require('../models/house.model');
const bcrypt = require('bcrypt');
const sanitize = require('mongo-sanitize');

// ─── Gérants ──────────────────────────────────────────────────────────────────

/**
 * Créer un gérant ou supergerant rattaché à l'admin connecté
 */
exports.createGerant = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const allowedRoles = ['gerant', 'supergerant'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide. Choisissez gerant ou supergerant.' });
    }

    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères et un chiffre.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const gerant = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      type: role,
      ownerId: req.auth.userId,
    });

    await gerant.save();
    res.status(201).json({ message: 'Gérant créé avec succès.', gerant: { _id: gerant._id, firstName, lastName, email, type: role } });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    console.error('Erreur création gérant:', err);
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Lister les gérants de l'admin connecté
 */
exports.listGerants = async (req, res) => {
  try {
    const gerants = await User.find(
      { ownerId: req.auth.userId, type: { $in: ['gerant', 'supergerant'] } },
      '-password'
    );
    res.status(200).json(gerants);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Supprimer un gérant
 */
exports.deleteGerant = async (req, res) => {
  try {
    const gerant = await User.findOne({ _id: req.params.id, ownerId: req.auth.userId });
    if (!gerant) return res.status(404).json({ error: 'Gérant introuvable.' });

    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Gérant supprimé.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

// ─── Résidences ───────────────────────────────────────────────────────────────

/**
 * Toutes les maisons de l'admin (tous statuts)
 */
exports.getAdminHouses = async (req, res) => {
  try {
    const houses = await House.find({ idOwner: req.auth.userId })
      .sort({ createdAt: -1 });
    res.status(200).json(houses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Maisons en attente de validation (pending)
 */
exports.getPendingHouses = async (req, res) => {
  try {
    const houses = await House.find({ idOwner: req.auth.userId, status: 'pending' })
      .sort({ createdAt: -1 });
    res.status(200).json(houses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Valider ou rejeter une maison en attente
 * Body: { action: 'approve' | 'reject', rejectionNote?: string }
 */
exports.validateHouse = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    const { action, rejectionNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide.' });
    }

    const house = await House.findOne({ _id: req.params.id, idOwner: req.auth.userId, status: 'pending' });
    if (!house) return res.status(404).json({ error: 'Maison introuvable ou non en attente.' });

    house.status = action === 'approve' ? 'published' : 'rejected';
    if (action === 'reject') house.rejectionNote = rejectionNote || null;
    else house.rejectionNote = null;

    await house.save();
    res.status(200).json({ message: `Maison ${action === 'approve' ? 'publiée' : 'rejetée'}.`, house });
  } catch (err) {
    console.error('Erreur validation maison:', err);
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Assigner un gérant à une maison
 */
exports.assignGerantToHouse = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    const { gerantId } = req.body;

    const house = await House.findOne({ _id: req.params.id, idOwner: req.auth.userId });
    if (!house) return res.status(404).json({ error: 'Maison introuvable.' });

    if (gerantId) {
      const gerant = await User.findOne({ _id: gerantId, ownerId: req.auth.userId });
      if (!gerant) return res.status(404).json({ error: 'Gérant introuvable.' });
    }

    house.assignedGerant = gerantId || null;
    await house.save();
    res.status(200).json({ message: 'Gérant assigné.', house });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

/**
 * Dashboard stats pour l'admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalHouses, publishedHouses, pendingHouses, gerantsCount] = await Promise.all([
      House.countDocuments({ idOwner: req.auth.userId }),
      House.countDocuments({ idOwner: req.auth.userId, status: 'published' }),
      House.countDocuments({ idOwner: req.auth.userId, status: 'pending' }),
      User.countDocuments({ ownerId: req.auth.userId, type: { $in: ['gerant', 'supergerant'] } }),
    ]);

    res.status(200).json({ totalHouses, publishedHouses, pendingHouses, gerantsCount });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};
