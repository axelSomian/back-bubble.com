const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth.middleware');
const checkRole  = require('../middleware/role.middleware');
const ctrl       = require('../controllers/superadmin.controller');

// Toutes les routes nécessitent auth + rôle superadmin
router.use(auth, checkRole('superadmin'));

// Stats
router.get('/stats', ctrl.getStats);

// Gestion utilisateurs
router.post('/users',             ctrl.createPrivilegedUser);
router.get('/users',              ctrl.getUsers);
router.patch('/users/:id/role',   ctrl.updateUserRole);
router.delete('/users/:id',       ctrl.deleteUser);

// Gestion biens
router.get('/houses',                    ctrl.getHouses);
router.patch('/houses/:id/verify',       ctrl.toggleVerifyHouse);

module.exports = router;
