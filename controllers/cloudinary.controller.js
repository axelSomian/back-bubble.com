require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

});

exports.uploadImage = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "houses",
            use_filename: true,
            unique_filename: true
        });

        // Supprime le fichier local temporaire
        fs.unlinkSync(file.path);

        return {
            message: "Image uploaded successfully",
            url: result.secure_url
        };
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
