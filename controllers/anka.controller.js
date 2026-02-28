require('dotenv').config();
const House = require('../models/house.model');

exports.AskAnka = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "Message requis" });
    }

    try {
        const response = await fetch(`${process.env.ANKA_URL}/extraire`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phrase: userMessage }),
        });

        if (!response.ok) {
            throw new Error(`Erreur service externe: ${response.statusText}`);
        }

        const criteria = await response.json();

        if (!criteria.isValid) {
            return res.status(200).json({
                message: criteria.Message || "Je n'ai pas pu identifier vos critères précisément. Pouvez-vous m'en dire plus ?",
                results: []
            });
        }

        //  Construction de la requête MongoDB
        const query = { isActive: true };
        const responseMessage = criteria.Message;

        // Filtres cumulatifs (Location, Type, etc.)
        const filters = [];

        if (criteria.city && typeof criteria.city === 'string') {
            filters.push({
                $or: [
                    { city: new RegExp(criteria.city, 'i') },
                    { neighboorhood: new RegExp(criteria.city, 'i') }
                ]
            });
        }
        if (criteria.neighboorhood && typeof criteria.neighboorhood === 'string') {
            filters.push({
                $or: [
                    { city: new RegExp(criteria.neighboorhood, 'i') },
                    { neighboorhood: new RegExp(criteria.neighboorhood, 'i') }
                ]
            });
        }

        // Type de bien (Recherche dans type ET title pour plus de souplesse)
        if (criteria.Type && typeof criteria.Type === 'string') {
            filters.push({
                $or: [
                    { type: new RegExp(criteria.Type, 'i') },
                    { title: new RegExp(criteria.Type, 'i') }
                ]
            });
        }

        //  Recherche par Équipements / Amenities
        if (criteria.amenities && Array.isArray(criteria.amenities) && criteria.amenities.length > 0) {
            criteria.amenities.forEach(amenity => {
                filters.push({
                    $or: [
                        { equipments: new RegExp(amenity, 'i') },
                        { description: new RegExp(amenity, 'i') },
                        { title: new RegExp(amenity, 'i') }
                    ]
                });
            });
        }

        if (filters.length > 0) {
            query.$and = filters;
        }

        if (criteria.rooms) {
            query.rooms = { $gte: Number(criteria.rooms) };
        }

        if (criteria.minPrice || criteria.maxPrice) {
            query.price = {};
            if (criteria.minPrice) query.price.$gte = Number(criteria.minPrice);
            if (criteria.maxPrice) query.price.$lte = Number(criteria.maxPrice);
        }

        console.log("ANKA Query:", JSON.stringify(query, null, 2));
        let results = await House.find(query).limit(10).sort({ createdAt: -1 });

        let isFallback = false;
        let finalMessage = criteria.Message;

        //  Fallback Logic: Si aucun résultat, on cherche des résidences actives générales
        if (results.length === 0) {
            isFallback = true;
            finalMessage = ` Analyse terminée. Aucun bien ne correspond exactement à ces critères ultra-spécifiques. Activation du protocole de secours Bubble... Affichage des opportunités premium actuellement disponibles.`;
            results = await House.find({ isActive: true }).limit(10).sort({ createdAt: -1 });
        }

        return res.status(200).json({
            criteria,
            results,
            isFallback,
            message: finalMessage
        });

    } catch (error) {
        console.error("Erreur AskAnka Finale:", error);
        return res.status(500).json({
            error: "Désolé, je rencontre une difficulté technique.",
            details: error.message
        });
    }
};