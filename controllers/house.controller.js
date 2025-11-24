const House = require("../models/house.model");
const cloudinaryController = require('./cloudinary.controller');
const paginate = require('../helpers/paginate');
const fs = require("fs");

// Créer un logement avec upload d'images
exports.createHouse = async (req, res) => {
    try {
        const file = req.files;
        

        if (!file || file.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        // Upload vers Cloudinary via le controller externe
        const imageUrls = await Promise.all(
            file.map(async (file) => {
                const result = await cloudinaryController.uploadImage(file);
                
                // Sécurité : supprime le fichier local même si l’upload échoue
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
              
                return result.medium;
            })
        );

        const house = new House({
            ...req.body,
            imageUrl: imageUrls
        });
        console.log("Creating house with data:", house);

        // Parser equipments si c’est une string
        if (typeof req.body.equipments === 'string') {
            try {
                house.equipments = JSON.parse(req.body.equipments);
            } catch {
                console.log("Invalid format for equipments");
                return res.status(400).json({ error: "Invalid format for equipments" });
                
            }
        }

        await house.save();

        res.status(201).json({ message: 'House created successfully!', house });
    } catch (err) {
        console.error("Error creating house:", err);
        res.status(500).json({ error: err.message });
    }
};

// Récupérer toutes les maisons
exports.getHouses = async (req, res) => { 
    try { 
         const resultat = await paginate(House, {}, req.query); 
        res.status(200).json(resultat); 
    } catch (err) { 
        res.status(500).json({ error: err.message });
     } };

// Récupérer une maison par ID
exports.getHouseById = async (req, res) => {
    try {
        const house = await House.findById(req.params.id);
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        res.status(200).json(house);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Recherche par ville ou quartier, type et prix max
const escapeRegex = s => s ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : s;

exports.searchHouses = async (req, res) => {
  try {
   // console.log("Search request received with query:", req.query);
    const { value, type, maxPrice, page = 1, limit = 20, sort = 'price' } = req.query;
  //  console.log(value)
    const query = {};

    //console.log(`Search parameters: place=${value}, type=${type}, maxPrice=${maxPrice}, page=${page}, limit=${limit}, sort=${sort}`);
    if (value) {
      const regex = new RegExp(escapeRegex(value), 'i');
      query.$or = [{ city: regex }, { neighboorhood: regex },{desciption :regex},{title:regex}];
    }

    if (type) {
      query.type = { $regex: new RegExp(escapeRegex(type), 'i') };
    }

    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      query.price = { $lte: Number(maxPrice) };
    }

    const resultat = await paginate(House, query, req.query); 

    //console.log(`Search query: ${JSON.stringify(query)}`);

    res.status(200).json(resultat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




