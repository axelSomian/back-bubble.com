const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/owner.controller');
const multer = require('multer');

// Stockage temporaire dans le dossier uploads/
const upload = multer({ dest: 'uploads/' });

// Create a new owner
router.post('/', upload.array('image',1), ownerController.createOwner);
// Get owner by ID
router.get('/:id', ownerController.getOwnerById);
router.get('/', ownerController.getAllOwners);

module.exports = router;