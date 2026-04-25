const User = require("../models/user.model");
const cloudinaryController = require('./cloudinary.controller');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sanitize = require('mongo-sanitize');
const fs = require('fs');

exports.register = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    // Validation de la complexité du mot de passe
    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères et au moins un chiffre." });
    }

    // Hachage du mot de passe reçu
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Création du nouvel utilisateur avec des champs explicites (Anti-Mass Assignment)
    // Le type est toujours 'user' pour l'inscription publique
    const { firstName, lastName, email, phoneNumber } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      type: 'user'
    });
    const files = req.files;
    if (files && files.length > 0) {
      const uploadResults = await cloudinaryController.uploadImage(files[0]);
      user.profileimageUrl = uploadResults.medium;
    }


    // Sauvegarde dans MongoDB
    await user.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    console.error("Erreur Inscription:", err);
    // Gestion spécifique des doublons d'email
    if (err.code === 11000) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ error: "Une erreur est survenue lors de l'inscription." });
  } finally {
    try {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    } catch (e) {
      console.error("Erreur nettoyage fichiers temporaires (User):", e);
    }
  }
}


exports.toggleLike = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const houseId = sanitize(req.params.houseId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const index = user.likedHouses.findIndex(id => id.toString() === houseId);
    if (index === -1) {
      user.likedHouses.push(houseId);
    } else {
      user.likedHouses.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ liked: index === -1, likedHouses: user.likedHouses.map(id => id.toString()) });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

exports.getLikedHouses = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).populate('likedHouses');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.status(200).json(user.likedHouses);
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

exports.getLikedIds = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId, 'likedHouses');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.status(200).json(user.likedHouses.map(id => id.toString()));
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

exports.login = async (req, res) => {
  req.body = sanitize(req.body);
  try {
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Verifier le mail ou le mot de passe' });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ message: 'Verifier le mail ou le mot de passe' });
    }

    // 🔐 Pour l'instant, on renvoie un token simulé

    const token = jwt.sign(
      { userId: user._id, role: user.type, ownerId: user.ownerId || null },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.status(200).json({ user: user.firstName + " " + user.lastName, token: token, type: user.type, userId: user._id });

  } catch (err) {
    res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
}