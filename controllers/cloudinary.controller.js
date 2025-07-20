const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
    cloud_name: 'dcxlhvonw',
    api_key: '638599752543621',
    api_secret: 's8W4HUN_XZbAEwsn1bsNWeQ6hF8'
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
