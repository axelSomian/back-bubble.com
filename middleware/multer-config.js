const multer = require('multer');
const path = require('path');

// Configuration du stockage temporaire
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads/');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = path.extname(file.originalname);
        callback(null, name + Date.now() + extension);
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, callback) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|heic|heif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return callback(null, true);
    }
    callback(new Error('Erreur : Seules les images (jpeg, png, webp, gif, heic, heif) sont autorisées !'));
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite à 5 Mo
    },
    fileFilter: fileFilter
});

module.exports = upload;
