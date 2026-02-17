const mongoose = require('mongoose');
const City = require('../models/city.model');
const District = require('../models/district.model');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

// Hardcoded URI if .env not easily reachable from script execution context, 
// OR assume user runs it with proper environment. 
// For safety, I'll ask user or try to load standard bubble env. 
// Assuming standard Mongo URI usually available. 
// Let's rely on process.env.MONGO_URI or default local.
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://asomian:1234567890@cluster0.oywzmmd.mongodb.net/bubbleDB?retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create or Find City: Abidjan
        let city = await City.findOne({ name: 'Abidjan' });
        if (!city) {
            city = await City.create({ name: 'Abidjan', code: 'ABJ' });
            console.log('City created: Abidjan');
        } else {
            console.log('City already exists: Abidjan');
        }

        // 2. Districts Data
        const districtsData = [
            { orderIndex: 1, label: 'Plateau' },
            { orderIndex: 2, label: 'Adjamé' },
            { orderIndex: 3, label: 'Treichville' },
            { orderIndex: 4, label: 'Cocody' },
            { orderIndex: 5, label: 'Angré' },
            { orderIndex: 6, label: 'Deux-Plateaux' },
            { orderIndex: 7, label: 'Riviera 2' },
            { orderIndex: 8, label: 'Riviera 3' }
        ];

        // 3. Upsert Districts
        for (const d of districtsData) {
            await District.findOneAndUpdate(
                { city: city._id, label: d.label },
                { ...d, city: city._id },
                { upsert: true, new: true }
            );
            console.log(`Processed District: ${d.label} (Index: ${d.orderIndex})`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
