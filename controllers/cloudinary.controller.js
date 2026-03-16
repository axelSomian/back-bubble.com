// cloudinary.controller.js
require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper pour transformer l'URL
function optimizeImage(url, width = 800) {
  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,w_${width}/`
  );
}

exports.uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "houses",
      use_filename: true,
      unique_filename: true,
      // Conversion automatique vers WebP/AVIF selon le navigateur
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1600, crop: 'limit' } // Limite la résolution max
      ]
    });

    // Supprimer le fichier local temporaire
    fs.unlinkSync(file.path);

    // URL brute
    const originalUrl = result.secure_url;

    // Mapper les tailles que tu veux garder
    return {
      original: originalUrl,
      thumb: optimizeImage(originalUrl, 300),
      medium: optimizeImage(originalUrl, 800),
      large: optimizeImage(originalUrl, 1200)
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
