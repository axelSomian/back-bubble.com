const express= require('express');
const mongoose= require('mongoose');
const houseRoutes= require('./routes/house.route'); 
const userRoutes= require('./routes/user.route'); // Assurez-vous que le fichier user.route.js existe
const ownerRoutes= require('./routes/owner.route'); // Assurez-vous que le fichier owner.route.js existe

//connexion a la bd mongoDB
const mongoURI = 'mongodb+srv://asomian:1234567890@cluster0.oywzmmd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // remplace par ton URI
mongoose.connect(mongoURI, {})
.then(() => console.log('✅ Connexion à MongoDB réussie'))
.catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

const app= express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();

});

app.use('/api/houses', houseRoutes);
app.use('/api/users',userRoutes); // Assurez-vous que le fichier user.route.js existe
app.use('/api/owners', ownerRoutes); // Assurez-vous que le fichier owner.route.js existe





module.exports= app;