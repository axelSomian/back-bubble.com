const House = require("../models/house.model");
const cloudinaryController = require('./cloudinary.controller');
const paginate = require('../helpers/paginate');
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sanitize = require('mongo-sanitize');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Créer un logement avec upload d'images
exports.createHouse = async (req, res) => {
    req.body = sanitize(req.body);
    const files = req.files;

    try {
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        // Validation basique des entrées
        if (req.body.price < 0 || req.body.rooms < 0) {
            return res.status(400).json({ error: "Le prix et le nombre de pièces ne peuvent pas être négatifs." });
        }

        // Upload vers Cloudinary via le controller externe
        const imageUrls = await Promise.all(
            files.map(async (file) => {
                const result = await cloudinaryController.uploadImage(file);
                return result.medium;
            })
        );

        // Les gérants créent en statut "pending" (validation requise par le supergerant/admin)
        // Les admins et superadmins publient directement
        const role = req.auth.role;
        const isGerant = role === 'gerant';
        const houseOwnerId = isGerant ? req.auth.ownerId : req.auth.userId;

        // Pour admin/supergerant : assignedGerant peut être passé dans le body (picker)
        // Pour gérant : forcé à lui-même
        const gerantContact = isGerant
          ? req.auth.userId
          : (req.body.assignedGerant || null);

        const house = new House({
            ...req.body,
            imageUrl: imageUrls,
            idOwner: houseOwnerId,
            status: isGerant ? 'pending' : 'published',
            assignedGerant: gerantContact,
        });
        if (process.env.NODE_ENV !== 'production') console.log("Creating house with data:", house);

        // Parser equipments si c’est une string
        if (typeof req.body.equipments === 'string') {
            try {
                house.equipments = JSON.parse(req.body.equipments);
            } catch {
                console.log("Invalid format for equipments");
                return res.status(400).json({ error: "Invalid format for equipments" });
            }
        }

        await house.save();
        res.status(201).json({ message: 'House created successfully!', house });
    } catch (err) {
        console.error("Error creating house:", err);
        res.status(500).json({ error: "Une erreur est survenue lors de la création du logement." });
    } finally {
        try {
            // Nettoyage de sécurité : s'assurer que TOUS les fichiers locaux sont supprimés
            if (files && files.length > 0) {
                files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
        } catch (e) {
            console.error("Erreur nettoyage fichiers temporaires (House Create):", e);
        }
    }
};


exports.updateHouse = async (req, res) => {
    req.body = sanitize(req.body);
    try {
        const idOwner = req.auth.userId;


        const house = await House.findById(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }

        if (house.idOwner !== idOwner) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Update house fields from req.body
        const updateData = { ...req.body };
        // Remove imageUrl from updateData to prevent overwriting with old data if present
        delete updateData.imageUrl;
        delete updateData._id;
        delete updateData.idOwner;

        Object.assign(house, updateData);

        // Parse equipments if strictly string (multipart/form-data often sends JSON as string)
        if (typeof req.body.equipments === 'string') {
            try {
                house.equipments = JSON.parse(req.body.equipments);
            } catch (e) {
                return res.status(400).json({ error: "Invalid format for equipments" });
            }
        }

        // Handle images: Merge existing images (from body) + new uploads
        let finalImages = [];

        // 1. Recover existing images
        if (req.body.existingImages) {
            // If only one image is sent, it might be a string, otherwise an array
            if (Array.isArray(req.body.existingImages)) {
                finalImages = [...req.body.existingImages];
            } else {
                finalImages = [req.body.existingImages];
            }
        }

        // 2. Add new uploaded images
        if (req.files && req.files.length > 0) {
            const file = req.files;
            const newImageUrls = await Promise.all(
                file.map(async (file) => {
                    const result = await cloudinaryController.uploadImage(file);

                    // Security: delete local file even if upload fails (though Promise.all might reject before this if one fails)
                    // Better to wrap in try/catch inside map if we want partial success, but current logic is fine for now
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }

                    return result.medium;
                })
            );
            finalImages = [...finalImages, ...newImageUrls];
        }

        // Always update the image list if we have established a new list (either empty or with items)
        // If the user deleted all images, finalImages will be [], which is correct.
        // If the user didn't touch images but sent existingImages back, it will be the same list.
        house.imageUrl = finalImages;

        await house.save();
        res.status(200).json({ message: 'House updated successfully!', house });
    } catch (error) {
        console.error("Error updating house:", error);
        res.status(500).json({ error: "Une erreur est survenue lors de la mise à jour." });
    } finally {
        try {
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
        } catch (e) {
            console.error("Erreur nettoyage fichiers temporaires (House Update):", e);
        }
    }
};


// Récupérer toutes les maisons (Publiques = Actives + Publiées ou sans statut pour les anciennes)
exports.getHouses = async (req, res) => {
    req.query = sanitize(req.query);
    try {
        const filter = { isActive: true, $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }] };
        const resultat = await paginate(House, filter, req.query);
        res.status(200).json(resultat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Récupérer une maison par ID
exports.getHouseById = async (req, res) => {
    try {
        const house = await House.findById(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        res.status(200).json(house);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Recherche par ville ou quartier, type et prix max
exports.searchHouses = async (req, res) => {
    req.query = sanitize(req.query);
    try {
        const { value, type, maxPrice, verified, page = 1, limit = 20 } = req.query;

        // Filtre de base (publiées ou sans statut pour rétrocompatibilité)
        const query = { isActive: true, $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }] };

        // Recherche texte via l'index MongoDB $text (plus rapide que regex)
        if (value) {
            query.$text = { $search: value };
        }

        if (type) {
            query.type = { $regex: escapeRegex(type), $options: 'i' };
        }

        if (maxPrice && !Number.isNaN(Number(maxPrice))) {
            query.price = { $lte: Number(maxPrice) };
        }

        if (verified === 'true') {
            query.isVerified = true;
        }

        // Recherche principale
        let resultat = await paginate(House, query, req.query);

        let isFallback = false;
        // Fallback : aucune house trouvée → on retourne tout
        if (!resultat || resultat.data.length === 0) {
            const fallbackFilter = { isActive: true, $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }] };
            resultat = await paginate(House, fallbackFilter, req.query);
            isFallback = true;
        }

        res.status(200).json({ ...resultat, isFallback });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// Toggle active status
exports.toggleHouseStatus = async (req, res) => {
    try {
        const idOwner = req.auth.userId;


        const house = await House.findById(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }

        if (house.idOwner !== idOwner) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        house.isActive = !house.isActive;
        await house.save();

        res.status(200).json({ message: 'House status updated successfully', house });
    } catch (error) {
        console.error("Error updating house status:", error);
        res.status(500).json({ error: error.message });
    }
};
