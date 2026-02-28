const mongoose = require('mongoose');
require('dotenv').config();
const House = require('./models/house.model');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const houses = await House.find({}).limit(50);
        console.log(`Found ${houses.length} houses.`);

        houses.forEach(h => {
            console.log(`- ${h.title} | City: ${h.city} | Neighborhood: ${h.neighboorhood} | Type: ${h.type} | Price: ${h.price}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
