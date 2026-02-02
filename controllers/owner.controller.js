const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/user.model');
const House = require('../models/house.model');

/**
 * Get the currently logged-in owner based on the JWT token.
 * Prevents race conditions by using local scope for user IDs.
 */
exports.getOwnerByToken = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token not found" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const owner = await User.findById(userId);

        if (!owner) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(owner);

    } catch (err) {
        return res.status(401).json({ message: "Unauthorized or invalid token" });
    }
};

/**
 * Get all houses belonging to the logged-in owner.
 */
exports.getOwnerHouses = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const ownerId = decoded.userId;

        const houses = await House.find({ idOwner: ownerId });

        if (!houses || houses.length === 0) {
            return res.status(200).json({ message: "No houses found" });
        }
        return res.status(200).json(houses);
    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Token expired or invalid" });
        }
        console.log(err);
        return res.status(500).json({ message: "Error fetching houses" });
    }
};

/**
 * Get all users with type 'admin' (Owners).
 */
exports.getAllOwner = async (req, res) => {
    try {
        const owners = await User.find({ type: "admin" });

        if (!owners || owners.length === 0) {
            return res.status(404).json({ message: "No owners found" });
        }
        return res.status(200).json(owners);
    } catch (err) {
        return res.status(500).json({ message: "Error fetching owners" });
    }
};

/**
 * Get houses by a specific owner ID (Admin usage).
 */
exports.getHousesByOwnerId = async (req, res) => {
    const headers = req.headers;
    const token = headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const ownerId = decoded.userId;
    }

    const ownerId = req.params.id;


    try {
        const houses = await House.find({ idOwner: ownerId });
        if (!houses || houses.length === 0) {
            return res.status(404).json({ message: "No houses found for this owner" });
        }
        return res.status(200).json(houses);
    } catch (err) {
        return res.status(500).json({ message: "Error fetching houses for owner" });
    }
};



