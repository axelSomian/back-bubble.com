const User = require("../models/user.model");
const cloudinaryController = require('./cloudinary.controller');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sanitize = require('mongo-sanitize');
const fs = require('fs');

exports.register = async (req, res) => {
  req.body = sanitize(req.body);
  console.log(req.body);
  try {
    // Validation de la complexité du mot de passe
    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères et au moins un chiffre." });
    }

    // Hachage du mot de passe reçu
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Création du nouvel utilisateur avec des champs explicites (Anti-Mass Assignment)
    const { firstName, lastName, email, phoneNumber, type } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      type: type || 'user' // Utilise le type fourni ou 'user' par défaut
    });
    const files = req.files;
    let uploadResults;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    } else {
      // Upload vers Cloudinary
      uploadResults = await cloudinaryController.uploadImage(files[0])
    }
    const profileimageUrl = uploadResults.medium;
    user.profileimageUrl = profileimageUrl;


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
      { userId: user._id, role: user.type },
      process.env.JWT_SECRET, // Clé secrète pour signer le token
      { expiresIn: '1h' } // Durée de validité du token
    );

    res.status(200).json({ user: user.firstName + " " + user.lastName, token: token, type: user.type });

  } catch (err) {
    res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
}

