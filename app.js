require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const houseRoutes = require('./routes/house.route');
const userRoutes = require('./routes/user.route'); // Assurez-vous que le fichier user.route.js existe
const ownerRoutes = require('./routes/owner.route'); // Assurez-vous que le fichier owner.route.js existe
const ankaRoutes = require('./routes/anka.route');
const superadminRoutes = require('./routes/superadmin.route');
const adminRoutes = require('./routes/admin.route');
const gerantRoutes = require('./routes/gerant.route');
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

// Rate Limiting — global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Rate Limiting — login strict (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.'
});
app.use('/api/users/login', loginLimiter);

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
  res.send('API Anka opérationnelle 🎉');
});
app.use('/api/houses', houseRoutes);
app.use('/api/users', userRoutes); // Assurez-vous que le fichier user.route.js existe
app.use('/api/owners', ownerRoutes); // Assurez-vous que le fichier owner.route.js existe
app.use('/api/anka', ankaRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gerant', gerantRoutes);

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