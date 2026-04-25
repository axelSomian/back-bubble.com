const express = require('express');
const router = express.Router();
const gerantController = require('../controllers/gerant.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const upload = require('../middleware/multer-config');

// Toutes les routes gérant sont protégées (role: gerant ou supergerant)
router.use(auth, role('gerant', 'supergerant'));

// Profil
router.get('/profile', gerantController.getProfile);

// Supergerant — données du propriétaire
router.get('/owner-profile', gerantController.getOwnerProfile);
router.get('/gerants', gerantController.listGerants);

// Dashboard
router.get('/dashboard', gerantController.getDashboard);

// Maisons
router.get('/houses', gerantController.getGerantHouses);
router.post('/houses', upload.array('images'), gerantController.createHouse);

// Validation (supergerant uniquement — vérifié dans le controller)
router.get('/houses/pending', gerantController.getPendingHouses);
router.post('/houses/:id/validate', gerantController.validateHouse);

module.exports = router;
