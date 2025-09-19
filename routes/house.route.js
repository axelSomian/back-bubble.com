const express = require('express');
const router = express.Router();
const houseController = require('../controllers/house.controller');
const multer = require('multer');

// Stockage temporaire dans le dossier uploads/
const upload = multer({ dest: 'uploads/' });

// Créer une maison avec upload de plusieurs images
router.post('/', upload.array('image'), houseController.createHouse);



// Obtenir toutes les maisons
router.get('/', houseController.getHouses);

// Rechercher une maison
router.get('/search', houseController.searchHouses);

// Obtenir une maison par ID
router.get('/:id', houseController.getHouseById);

module.exports = router;
