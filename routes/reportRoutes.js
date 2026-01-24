const express = require('express');
const router = express.Router();
const {
    getSummaryReport,
    getOverallReport,
    getTicketsReport,
    getInspectorLeaderboard,
    getPrivateInspectionsReport,
    getInspectionFormsReport,
    exportOverallReport,
    exportTicketsReport,
    exportInspectorLeaderboard,
    exportPrivateInspectionsReport,
    exportInspectionFormsReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Legacy endpoint (backward compatibility)
router.get('/summary', protect, getSummaryReport);

// New Phase 2 report endpoints
router.get('/overall', protect, getOverallReport);
router.get('/tickets', protect, getTicketsReport);
router.get('/inspectors', protect, getInspectorLeaderboard);
router.get('/private_inspections', protect, getPrivateInspectionsReport);
router.get('/inspection_forms', protect, getInspectionFormsReport);

// Export endpoints
router.get('/overall/export', protect, exportOverallReport);
router.get('/tickets/export', protect, exportTicketsReport);
router.get('/inspectors/export', protect, exportInspectorLeaderboard);
router.get('/private_inspections/export', protect, exportPrivateInspectionsReport);
router.get('/inspection_forms/export', protect, exportInspectionFormsReport);

module.exports = router;
