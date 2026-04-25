const User = require('../models/user.model');
const House = require('../models/house.model');
const sanitize = require('mongo-sanitize');
const bcrypt = require('bcrypt');

// ─── Stats globales ───────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalOwners, totalHouses, verifiedHouses, activeHouses] = await Promise.all([
            User.countDocuments({ type: 'user' }),
            User.countDocuments({ type: 'admin' }),
            House.countDocuments(),
            House.countDocuments({ isVerified: true }),
            House.countDocuments({ isActive: true }),
        ]);

        res.status(200).json({ totalUsers, totalOwners, totalHouses, verifiedHouses, activeHouses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Créer un compte privilégié (admin / owner / superadmin) ─────────────────
exports.createPrivilegedUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, role } = sanitize(req.body);

        const allowedRoles = ['admin', 'superadmin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide. Valeurs acceptées : admin, superadmin.' });
        }

        const passwordRegex = /^(?=.*[0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères et un chiffre.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { companyName } = sanitize(req.body);
        const user = new User({ firstName, lastName, email, phoneNumber, password: hashedPassword, type: role, companyName: companyName || null });
        await user.save();

        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json({ message: 'Compte créé avec succès.', user: userObj });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }
        res.status(500).json({ error: err.message });
    }
};

// ─── Liste tous les utilisateurs ─────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip  = (page - 1) * limit;
        const search = req.query.search ? sanitize(req.query.search) : null;

        const filter = search
            ? { $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } },
            ]}
            : {};

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.status(200).json({ data: users, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Changer le rôle d'un utilisateur ────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = sanitize(req.body);
        const allowed = ['user', 'admin', 'superadmin'];

        if (!allowed.includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide.' });
        }

        // Un superadmin ne peut pas modifier son propre rôle
        if (req.params.id === req.auth.userId) {
            return res.status(400).json({ error: 'Impossible de modifier votre propre rôle.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { type: role },
            { new: true, select: '-password' }
        );

        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

        res.status(200).json({ message: 'Rôle mis à jour.', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Supprimer un utilisateur ─────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.auth.userId) {
            return res.status(400).json({ error: 'Impossible de supprimer votre propre compte.' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

        res.status(200).json({ message: 'Utilisateur supprimé.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Liste tous les biens (avec filtre verified) ──────────────────────────────
exports.getHouses = async (req, res) => {
    try {
        const page     = parseInt(req.query.page)  || 1;
        const limit    = parseInt(req.query.limit) || 20;
        const skip     = (page - 1) * limit;
        const verified = req.query.verified; // 'true' | 'false' | undefined

        const filter = {};
        if (verified === 'true')  filter.isVerified = true;
        if (verified === 'false') filter.isVerified = false;

        const [houses, total] = await Promise.all([
            House.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            House.countDocuments(filter),
        ]);

        res.status(200).json({ data: houses, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── Vérifier / dévérifier un bien ───────────────────────────────────────────
exports.toggleVerifyHouse = async (req, res) => {
    try {
        const house = await House.findById(req.params.id);
        if (!house) return res.status(404).json({ error: 'Bien introuvable.' });

        house.isVerified = !house.isVerified;
        await house.save();

        res.status(200).json({
            message: house.isVerified ? 'Bien vérifié.' : 'Vérification retirée.',
            isVerified: house.isVerified,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
