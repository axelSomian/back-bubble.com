require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkAvailableModels() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("Erreur : La clé API n'est pas définie dans le fichier .env");
        return;
    }

    try {
        // On utilise l'URL directe car le SDK JS ne propose pas 
        // toujours une méthode simple pour lister les modèles.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("Erreur API :", data.error.message);
            return;
        }

        console.log("--- MODÈLES DISPONIBLES POUR VOTRE CLÉ ---");
        data.models.forEach(model => {
            // On filtre pour ne garder que ceux qui permettent de générer du contenu
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ID: ${model.name.replace('models/', '')}`);
                console.log(`  Nom: ${model.displayName}`);
                console.log(`  Description: ${model.description}`);
                console.log('-----------------------------------------');
            }
        });

    } catch (error) {
        console.error("Erreur de connexion :", error.message);
    }
}

checkAvailableModels();