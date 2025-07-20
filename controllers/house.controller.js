const House = require("../models/house.model");
const cloudinaryController = require('./cloudinary.controller');
const fs = require("fs");

// Créer un logement avec upload d'images
exports.createHouse = async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        // Upload vers Cloudinary via le controller externe
        const imageUrls = await Promise.all(
            files.map(async (file) => {
                const result = await cloudinaryController.uploadImage(file);
                // Sécurité : supprime le fichier local même si l’upload échoue
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                return result.url;
            })
        );

        const house = new House({
            ...req.body,
            imageUrl: imageUrls
        });

        // Parser equipments si c’est une string
        if (typeof req.body.equipments === 'string') {
            try {
                house.equipments = JSON.parse(req.body.equipments);
            } catch {
                return res.status(400).json({ error: "Invalid format for equipments" });
            }
        }

        await house.save();

        res.status(201).json({ message: 'House created successfully!', house });
    } catch (err) {
        console.error("Error creating house:", err);
        res.status(500).json({ error: err.message });
    }
};

// Récupérer toutes les maisons
exports.getHouses = async (req, res) => {
    try {
        const houses = await House.find();
        res.status(200).json(houses);
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

// Recherche par ville ou quartier
exports.searchHouses = async (req, res) => {
    try {
        const { city, neighboorhood } = req.query;
        const value = city || neighboorhood;

        if (!value) {
            return res.status(400).json({ error: 'City or neighborhood required' });
        }

        const regex = new RegExp(value, 'i');
        const query = {
            $or: [
                { city: { $regex: regex } },
                { neighboorhood: { $regex: regex } }
            ]
        };

        const houses = await House.find(query);
        res.status(200).json(houses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
