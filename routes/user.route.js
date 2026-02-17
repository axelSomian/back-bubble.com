const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/user.controller');


uploadImage = multer({ dest: 'uploads/' });
// Create a new user
router.post('/register', uploadImage.array('image', 1), userController.register);
//login
router.post('/login', userController.login);




module.exports = router;
