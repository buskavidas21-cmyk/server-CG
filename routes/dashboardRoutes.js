const express = require('express');
const router = express.Router();
const {
    getInspectionCount,
    getInspectionScoreAverage,
    getTicketCount,
    getInspectionsOverTime,
    getTicketsOverTime,
    getDashboardSummary,
    getWorkStats
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Dashboard metrics endpoints
router.get('/inspection_count', protect, getInspectionCount);
router.get('/inspection_score_average', protect, getInspectionScoreAverage);
router.get('/ticket_count', protect, getTicketCount);
router.get('/inspections_over_time', protect, getInspectionsOverTime);
router.get('/tickets_over_time', protect, getTicketsOverTime);
router.get('/summary', protect, getDashboardSummary);
router.get('/work-stats', protect, getWorkStats);

module.exports = router;
