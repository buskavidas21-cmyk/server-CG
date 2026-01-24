const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Inspection = require('../models/inspectionModel');
const Ticket = require('../models/ticketModel');

// API v4 endpoints - JSON format with consistent structure
// Matches Crescent Cleaning Company API pattern: /api/v4/endpoint.json

// @route   GET /api/v4/inspection_count.json
// @desc    Get inspection count for date range
// @access  Private
// Query params: start_date, end_date, location_id
router.get('/inspection_count.json', protect, async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        const query = {};
        
        if (start_date || end_date) {
            query.createdAt = {};
            if (start_date) {
                query.createdAt.$gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations };
        } else if (req.user.role === 'supervisor') {
            query.$or = [
                { inspector: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const count = await Inspection.countDocuments(query);
        res.json({ count });
    } catch (error) {
        console.error('Inspection count error:', error);
        res.status(500).json({ error: 'Failed to fetch inspection count' });
    }
});

// @route   GET /api/v4/inspection_score_average.json
// @desc    Get average inspection score for date range
// @access  Private
// Query params: start_date, end_date, location_id
router.get('/inspection_score_average.json', protect, async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        const query = {};
        
        if (start_date || end_date) {
            query.createdAt = {};
            if (start_date) {
                query.createdAt.$gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations };
        } else if (req.user.role === 'supervisor') {
            query.$or = [
                { inspector: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const inspections = await Inspection.find(query).select('totalScore');
        const average = inspections.length > 0
            ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
            : 0;

        res.json({ average });
    } catch (error) {
        console.error('Inspection score average error:', error);
        res.status(500).json({ error: 'Failed to fetch score average' });
    }
});

// @route   GET /api/v4/ticket_count.json
// @desc    Get ticket count for date range
// @access  Private
// Query params: start_date, end_date, location_id
router.get('/ticket_count.json', protect, async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        const query = {};
        
        if (start_date || end_date) {
            query.createdAt = {};
            if (start_date) {
                query.createdAt.$gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations };
        } else if (req.user.role === 'supervisor') {
            query.assignedTo = req.user._id;
        }

        const count = await Ticket.countDocuments(query);
        res.json({ count });
    } catch (error) {
        console.error('Ticket count error:', error);
        res.status(500).json({ error: 'Failed to fetch ticket count' });
    }
});

module.exports = router;
