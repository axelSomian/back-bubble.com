const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');


// Create a new user
router.post('/register', async (req, res) => {
  try {
    // Hachage du mot de passe reçu
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Création du nouvel utilisateur avec le mot de passe haché
    const user = new User({
      ...req.body,
      password: hashedPassword
    });

    // Sauvegarde dans MongoDB
    await user.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
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
    const fakeToken = 'FAKE_TOKEN_TEST_123456789';

    res.status(200).json({ token: fakeToken});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
