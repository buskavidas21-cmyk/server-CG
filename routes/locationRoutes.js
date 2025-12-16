const express = require('express');
const router = express.Router();
const {
    getLocations,
    createLocation,
    getLocationById,
    updateLocation,
    deleteLocation,
} = require('../controllers/locationController');
const { protect, adminOrSubAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLocations).post(protect, adminOrSubAdmin, createLocation);
router.route('/:id')
    .get(protect, getLocationById)
    .put(protect, adminOrSubAdmin, updateLocation)
    .delete(protect, adminOrSubAdmin, deleteLocation);

module.exports = router;
