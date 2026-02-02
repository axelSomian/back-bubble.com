require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const houseRoutes = require('./routes/house.route');
const userRoutes = require('./routes/user.route'); // Assurez-vous que le fichier user.route.js existe
const ownerRoutes = require('./routes/owner.route'); // Assurez-vous que le fichier owner.route.js existe
const ankaRoutes = require('./routes/anka.route');

//connexion a la bd mongoDB
const mongoURI = process.env.MONGO_URI; // remplace par ton URI
mongoose.connect(mongoURI, {})
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de debug pour voir ce qui arrive
// app.use((req, res, next) => {
//   console.log('--- DEBUG REQUEST ---');
//   console.log(`[${req.method}] ${req.url}`);
//   console.log('Headers:', JSON.stringify(req.headers, null, 2));
//   console.log('Body:', JSON.stringify(req.body, null, 2));
//   console.log('---------------------');
//   next();
// });

app.disable('X-Powered-By');
// app.use{h÷}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();


});
app.get('/', (req, res) => {
  res.send('API Bubble opérationnelle 🎉');
});
app.use('/api/houses', houseRoutes);
app.use('/api/users', userRoutes); // Assurez-vous que le fichier user.route.js existe
app.use('/api/owners', ownerRoutes); // Assurez-vous que le fichier owner.route.js existe
app.use('/api/anka', ankaRoutes);





module.exports = app;