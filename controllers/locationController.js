const Location = require('../models/locationModel');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
const getLocations = async (req, res) => {
    let query = {};

    // Clients see only their assigned locations
    if (req.user.role === 'client') {
        query = { _id: { $in: req.user.assignedLocations } };
    }

    const locations = await Location.find(query);
    res.json(locations);
};

// @desc    Create a location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
    const { name, type, parent, address, clientContact } = req.body;

    const location = new Location({
        name,
        type,
        parent,
        address,
        clientContact,
    });

    const createdLocation = await location.save();
    res.status(201).json(createdLocation);
};

// @desc    Get location by ID
// @route   GET /api/locations/:id
// @access  Private
const getLocationById = async (req, res) => {
    const location = await Location.findById(req.params.id).populate('parent');

    if (location) {
        res.json(location);
    } else {
        res.status(404);
        throw new Error('Location not found');
    }
};

// @desc    Update a location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
    const location = await Location.findById(req.params.id);
    if (location) {
        Object.assign(location, req.body);
        const updatedLocation = await location.save();
        res.json(updatedLocation);
    } else {
        res.status(404);
        throw new Error('Location not found');
    }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
    const location = await Location.findById(req.params.id);
    if (location) {
        await location.deleteOne();
        res.json({ message: 'Location removed' });
    } else {
        res.status(404);
        throw new Error('Location not found');
    }
};

module.exports = { getLocations, createLocation, getLocationById, updateLocation, deleteLocation };
