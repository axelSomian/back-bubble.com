const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer-config');
const userController = require('../controllers/user.controller');


// Create a new user
router.post('/register', upload.array('image', 1), userController.register);
//login
router.post('/login', userController.login);




module.exports = router;
