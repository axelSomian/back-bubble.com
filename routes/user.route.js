const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer-config');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', upload.array('image', 1), userController.register);
router.post('/login', userController.login);

// Likes
router.post('/likes/:houseId', auth, userController.toggleLike);
router.get('/likes', auth, userController.getLikedHouses);
router.get('/likes/ids', auth, userController.getLikedIds);

module.exports = router;
