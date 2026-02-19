const express = require('express');
const router = express.Router();
const houseController = require('../controllers/house.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/multer-config');

// Créer une maison avec upload de plusieurs images (Protégé)
router.post('/', auth, upload.array('images'), houseController.createHouse);



// Obtenir toutes les maisons
router.get('/', houseController.getHouses);

// Rechercher une maison
router.get('/search', houseController.searchHouses);

// Obtenir une maison par ID
router.get('/:id', houseController.getHouseById);

// Update house (Protégé)
router.put('/:id', auth, upload.array('images'), houseController.updateHouse);

// Update house status (Protégé)
router.patch('/:id/status', auth, houseController.toggleHouseStatus);

module.exports = router;
