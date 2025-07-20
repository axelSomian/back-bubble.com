const ownerModel = require('../models/owner.model');
const cloudinaryController = require('./cloudinary.controller');


exports.createOwner = async (req, res) => {
try {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }else{
        // Upload vers Cloudinary
        const uploadResults = await Promise.all(
            files.map(file => cloudinaryController.uploadImage(file))
        );
        const imageUrl = uploadResults.map(result => result.url);

        const ownerData = {
            ...req.body,
            profileimageUrl: imageUrl[0] // Assuming you want to store the first image URL as profile image
        };
        ownerModel.create(ownerData)
            .then(owner => res.status(201).json(owner)) 
            .catch(err => res.status(500).json({ error: err.message }));
    }
        
}catch (error) {
    console.error("Error creating owner:", error);
    res.status(500).json({ error: "Failed to create owner" });
}

};


exports.getOwnerById = (req, res) => {
    const ownerId = req.params.id;
    ownerModel.findOne({ _id: ownerId })
        .then(owners => res.status(200).json(owners))
        .catch(err => res.status(500).json({ error: err.message }));
};