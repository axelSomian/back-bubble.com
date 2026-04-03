/**
 * Middleware de vérification de rôle.
 * À utiliser APRÈS le middleware auth.
 * Usage : router.get('/route', auth, checkRole('superadmin'), controller)
 */
module.exports = (...allowedRoles) => (req, res, next) => {
    if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
        return res.status(403).json({ message: 'Accès interdit : droits insuffisants.' });
    }
    next();
};
