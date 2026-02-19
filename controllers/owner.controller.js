const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/user.model');
const House = require('../models/house.model');

/**
 * Get the currently logged-in owner based on the JWT token.
 * Prevents race conditions by using local scope for user IDs.
 */
exports.getOwnerByToken = async (req, res) => {
    try {
        const owner = await User.findById(req.auth.userId);

        if (!owner) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(owner);

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getOwnerByID = async (req, res) => {
    const { id } = req.params;
    try {
        const owner = await User.findOne({ _id: id, type: 'admin' });
        if (!owner) {
            return res.status(404).json({ message: "Owner not found" });
        }
        return res.status(200).json(owner);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

}

/**
 * Get all houses belonging to the logged-in owner.
 */
exports.getOwnerHouses = async (req, res) => {
    try {
        const houses = await House.find({ idOwner: req.auth.userId });

        if (!houses || houses.length === 0) {
            return res.status(200).json({ message: "No houses found" });
        }
        return res.status(200).json(houses);
    } catch (err) {
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
