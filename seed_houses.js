const mongoose = require('mongoose');
require('dotenv').config();
const House = require('./models/house.model');

const OWNER_ID = '6996b9df90f6b5e2cb133004';

const cities = ['Abidjan', 'Yamoussoukro', 'Bouaké'];
const neighborhoods = {
    'Abidjan': ['Cocody', 'Marcory', 'Plateau', 'Koumassi', 'Yopougon', 'Riviera', 'Angré'],
    'Yamoussoukro': ['220 Logements', 'Assabou', 'Habitat'],
    'Bouaké': ['Air France', 'Kennedy', 'Nimbo']
};
const types = ['Studio', 'Villa', 'Appartement', 'Maison de ville'];
const equipments = ['WiFi', 'Climatisation', 'Piscine', 'Parking', 'Sécurité 24/7', 'Cuisine équipée'];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Optional: clear existing test data if needed, but the user just asked to add 30.
        // await House.deleteMany({ idOwner: OWNER_ID }); 

        const houses = [];
        for (let i = 1; i <= 30; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const neighborhoodList = neighborhoods[city];
            const neighboorhood = neighborhoodList[Math.floor(Math.random() * neighborhoodList.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const price = Math.floor(Math.random() * (500000 - 25000 + 1)) + 25000;
            const rooms = Math.floor(Math.random() * 6) + 1;

            houses.push({
                title: `${type} de luxe à ${neighboorhood}`,
                description: `Une magnifique propriété située à ${neighboorhood}, ${city}. Offrant tout le confort moderne avec une vue imprenable. Idéal pour résidence ou investissement.`,
                type: type,
                rooms: rooms,
                price: Math.round(price / 1000) * 1000, // Round to nearest 1000
                imageUrl: ["https://res.cloudinary.com/dcxlhvonw/image/upload/v1738104571/bubble/house_placeholder.jpg"],
                city: city,
                neighboorhood: neighboorhood,
                idOwner: OWNER_ID,
                isActive: true,
                isLocated: Math.random() > 0.5,
                notation: Math.floor(Math.random() * 5) + 1,
                equipments: equipments.sort(() => 0.5 - Math.random()).slice(0, 3)
            });
        }

        await House.insertMany(houses);
        console.log('Successfully inserted 30 houses.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();
