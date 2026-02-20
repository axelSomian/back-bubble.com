require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const House = require('../models/house.model');
exports.AskAnka = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "Message requis" });
    }
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const systemInstruction = `
            Tu es Anka, un assistant immobilier de luxe prestigieux et chaleureux.
            Ta mission est d'analyser la demande du client avec une grande attention et de lui répondre avec élégance.
            
            1. **Analyse** : Identifie la ville, le quartier (commune), le type de bien, le budget, et le nombre de pièces/chambres.
            2. **Extraction** : Tu DOIS extraire ces données au format JSON strict.
            3. **Message** : Tu dois rédiger un message ("Message") court, accueillant et très professionnel, qui reformule la demande du client sur un ton rassurant (ex: "J'ai sélectionné pour vous des villas d'exception à Cocody..."). Sois poli et engageant.

            Format JSON attendu (Strictement ce format, sans markdown) :
            {
                "Message": "string",
                "isValid": true,
                "city": "string|null",
                "neighboorhood": "string|null",
                "rooms": "number|null",
                "Type": "string|null",
                "minPrice": "number|null",
                "maxPrice": "number|null"
            }
        `;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction
        });

        // 🔹 1. Obtenir les critères depuis Anka
        const result = await model.generateContent(userMessage);
        let responseText = result.response.text().trim();

        // Nettoyage
        responseText = responseText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
        let criteria;
        try {
            criteria = JSON.parse(responseText);
            if (criteria.isValid === false) {
                return res.status(500).json({
                    error: criteria.Message || "Je n'ai pas compris votre demande."
                });
            }
            console.log("Critères extraits:", criteria);
        } catch (error) {
            return res.status(500).json({
                error: "Erreur parsing JSON IA",
                raw: responseText
            });
        }
        // 🔹 2. Construire la requête MongoDB
        const query = {};
        message = criteria.Message; // Le beau message généré par l'IA
        delete criteria.Message;
        delete criteria.isValid;

        if (criteria.city) {
            query.city = new RegExp(criteria.city, 'i');
        }
        if (criteria.neighboorhood) {
            // Recherche dans le quartier (ou la description si quartier non trouvé, optionnel)
            query.neighboorhood = new RegExp(criteria.neighboorhood, 'i');
        }
        if (criteria.Type) {
            query.type = new RegExp(criteria.Type, 'i');
        }
        if (criteria.rooms) {
            query.rooms = { $gte: Number(criteria.rooms) };
        }
        if (criteria.minPrice || criteria.maxPrice) {
            query.price = {};
            if (criteria.minPrice) query.price.$gte = Number(criteria.minPrice);
            if (criteria.maxPrice) query.price.$lte = Number(criteria.maxPrice);
        }
        console.log("Requête MongoDB construite:", query);
        // 🔹 3. Exécuter la recherche MongoDB
        const results = await House.find(query).limit(10);
        // 🔹 4. Retourner la réponse finale 
        if (results.length === 0) {
            return res.status(200).json({
                criteria,
                results: [],
                message: "Desolé, aucune maison ne correspond à vos critères. "
            });

        }
        return res.status(200).json({
            criteria,
            results,
            message
        });
    } catch (error) {
        console.error("Erreur AskAnka:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};
