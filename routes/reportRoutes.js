const express = require('express');
const router = express.Router();
const { getSummaryReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/summary', protect, admin, getSummaryReport);

module.exports = router;
