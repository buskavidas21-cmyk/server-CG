const express = require('express');
const {
    getInspections,
    createInspection,
    getInspectionById,
    updateInspection,
    deleteInspection,
    generatePDF,
    assignInspection,
    scheduleInspection,
} = require('../controllers/inspectionController');
const { protect, admin, adminOrSubAdmin, adminOrSubAdminOrSupervisor } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getInspections).post(protect, adminOrSubAdminOrSupervisor, createInspection);
router.route('/:id').get(protect, getInspectionById).put(protect, updateInspection).delete(protect, admin, deleteInspection);
router.route('/:id/pdf').get(protect, generatePDF);
router.patch('/:id/assign', protect, adminOrSubAdmin, assignInspection);
router.patch('/:id/schedule', protect, adminOrSubAdmin, scheduleInspection);

module.exports = router;
