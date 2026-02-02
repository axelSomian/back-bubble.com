const User = require("../models/user.model");
const cloudinaryController = require('./cloudinary.controller');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  console.log(req.body);
  try {
    // Hachage du mot de passe reçu
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Création du nouvel utilisateur avec le mot de passe haché
    const user = new User({
      ...req.body,
      password: hashedPassword
    });
    const files = req.files;
    console.log(files);
    let uploadResults;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    } else {
      // Upload vers Cloudinary
      uploadResults = await cloudinaryController.uploadImage(files[0])
    }
    const profileimageUrl = uploadResults.medium;
    // user.uploadResults = ;
    console.log(uploadResults)
    user.profileimageUrl = profileimageUrl;
    console.log(user)


    // Sauvegarde dans MongoDB
    await user.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


exports.login = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
}

