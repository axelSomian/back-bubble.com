const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/owner.controller');
const multer = require('multer');

// Stockage temporaire dans le dossier uploads/
const upload = multer({ dest: 'uploads/' });

// Create a new owner
router.get('/getOwnerByToken', ownerController.getOwnerByToken);
router.get('/getOwnerHouses', ownerController.getOwnerHouses);  // Current user's houses
router.get('/getAllOwner', ownerController.getAllOwner);
// router.put('/houses/:id', upload.array('images'), ownerController.updateHouse);

module.exports = router;