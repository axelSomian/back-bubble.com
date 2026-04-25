require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // 1. Admin (owner/propriétaire)
  const adminPassword = await bcrypt.hash('Admin1234', 10);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@bubble.test' },
    {
      firstName: 'Sophie',
      lastName: 'Kouassi',
      email: 'admin@bubble.test',
      phoneNumber: '+225 07 11 22 33',
      password: adminPassword,
      type: 'admin',
      companyName: 'Immo Prestige CI',
    },
    { upsert: true, new: true }
  );
  console.log('✅ Admin créé :', admin._id.toString());

  // 2. Super-gérant (rattaché à l'admin)
  const sgPassword = await bcrypt.hash('Sg1234567', 10);
  const supergerant = await User.findOneAndUpdate(
    { email: 'supergerant@bubble.test' },
    {
      firstName: 'Marc',
      lastName: 'Diallo',
      email: 'supergerant@bubble.test',
      phoneNumber: '+225 07 44 55 66',
      password: sgPassword,
      type: 'supergerant',
      ownerId: admin._id,
    },
    { upsert: true, new: true }
  );
  console.log('✅ Super-gérant créé :', supergerant._id.toString());

  // 3. Gérant (rattaché à l'admin)
  const gPassword = await bcrypt.hash('Gerant1234', 10);
  const gerant = await User.findOneAndUpdate(
    { email: 'gerant@bubble.test' },
    {
      firstName: 'Awa',
      lastName: 'Traoré',
      email: 'gerant@bubble.test',
      phoneNumber: '+225 07 77 88 99',
      password: gPassword,
      type: 'gerant',
      ownerId: admin._id,
    },
    { upsert: true, new: true }
  );
  console.log('✅ Gérant créé :', gerant._id.toString());

  console.log('\n─────────────────────────────────────');
  console.log('CREDENTIALS DE TEST');
  console.log('─────────────────────────────────────');
  console.log('ADMIN (propriétaire)');
  console.log('  Email    : admin@bubble.test');
  console.log('  Password : Admin1234');
  console.log('  Route    : /admin');
  console.log('');
  console.log('SUPER-GÉRANT');
  console.log('  Email    : supergerant@bubble.test');
  console.log('  Password : Sg1234567');
  console.log('  Route    : /gerant');
  console.log('');
  console.log('GÉRANT');
  console.log('  Email    : gerant@bubble.test');
  console.log('  Password : Gerant1234');
  console.log('  Route    : /gerant');
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
