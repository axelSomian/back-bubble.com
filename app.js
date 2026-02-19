require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const houseRoutes = require('./routes/house.route');
const userRoutes = require('./routes/user.route'); // Assurez-vous que le fichier user.route.js existe
const ownerRoutes = require('./routes/owner.route'); // Assurez-vous que le fichier owner.route.js existe
const ankaRoutes = require('./routes/anka.route');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');


//connexion a la bd mongoDB
const mongoURI = process.env.MONGO_URI; // remplace par ton URI
mongoose.connect(mongoURI, {})
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

const app = express();

// Performance: Gzip Compression
app.use(compression());

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Augmenté pour le développement
  message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de debug (Sécurisé : pas de logs de headers/body sensibles)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${req.method}] ${req.url}`);
  }
  next();
});

app.disable('X-Powered-By');

// CORS Configuration - Permissive for development (as requested)
app.use(cors());
app.get('/', (req, res) => {
  res.send('API Bubble opérationnelle 🎉');
});
app.use('/api/houses', houseRoutes);
app.use('/api/users', userRoutes); // Assurez-vous que le fichier user.route.js existe
app.use('/api/owners', ownerRoutes); // Assurez-vous que le fichier owner.route.js existe
app.use('/api/anka', ankaRoutes);

// Global Error Handler (Anti-Leak)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue.'
    : err.message;

  res.status(status).json({ error: message });
});

module.exports = app;