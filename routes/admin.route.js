const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// Toutes les routes admin sont protégées (role: admin)
router.use(auth, role('admin'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Gérants
router.get('/gerants', adminController.listGerants);
router.post('/gerants', adminController.createGerant);
router.delete('/gerants/:id', adminController.deleteGerant);

// Résidences
router.get('/houses', adminController.getAdminHouses);
router.get('/houses/pending', adminController.getPendingHouses);
router.post('/houses/:id/validate', adminController.validateHouse);
router.post('/houses/:id/assign', adminController.assignGerantToHouse);

module.exports = router;
