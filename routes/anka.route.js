const express = require('express');
const router = express.Router(); 
const ankaController = require('../controllers/anka.controller');

// Route pour interroger Anka
router.post('/', ankaController.AskAnka);

module.exports = router;