const mongoose = require('mongoose');
require('dotenv').config();
const House = require('./models/house.model');

const OWNER_ID = '6996b9df90f6b5e2cb133004';

async function seedJacuzzi() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const jacuzziHouse = {
            title: "Villa Royale avec Jacuzzi",
            description: "Une villa exceptionnelle avec tout le confort moderne et un jacuzzi privatif sur le toit.",
            type: "Villa",
            city: "Abidjan",
            neighboorhood: "Cocody",
            price: 1500000,
            rooms: 5,
            surface: 450,
            bathrooms: 4,
            equipments: ["Jacuzzi", "Piscine", "WiFi", "Climatisation", "Garage"],
            imageUrl: ["https://res.cloudinary.com/dcxlhvonw/image/upload/v1738104571/bubble/house_placeholder.jpg"],
            idOwner: OWNER_ID,
            isActive: true,
            notation: 5
        };

        await House.create(jacuzziHouse);
        console.log('Successfully inserted a house with a jacuzzi.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedJacuzzi();
