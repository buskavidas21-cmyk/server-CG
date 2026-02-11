const express = require('express');
const router = express.Router();
const { getTickets, createTicket, updateTicket, assignTicket, scheduleTicket, getTicketById } = require('../controllers/ticketController');
const { protect, admin, adminOrSubAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTickets);
router.route('/').post(protect, adminOrSubAdmin, createTicket);
router.route('/:id').get(protect, getTicketById).put(protect, updateTicket);
router.patch('/:id/assign', protect, adminOrSubAdmin, assignTicket);
router.patch('/:id/schedule', protect, adminOrSubAdmin, scheduleTicket);

module.exports = router;
