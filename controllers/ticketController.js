const Ticket = require('../models/ticketModel');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    let query = {};

    // Admin and sub_admin see all tickets
    if (req.user.role === 'admin' || req.user.role === 'sub_admin') {
        query = {};
    }
    // Supervisors see only their assigned tickets
    else if (req.user.role === 'supervisor') {
        query = { assignedTo: req.user._id };
    }
    // Clients see only tickets for their assigned locations
    else if (req.user.role === 'client') {
        query = { location: { $in: req.user.assignedLocations } };
    }

    const tickets = await Ticket.find(query)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('location', 'name');
    res.json(tickets);
};

// @desc    Create a ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
    const {
        title,
        description,
        priority,
        category,
        location,
        inspection,
        assignedTo,
        photos,
        dueDate,
        scheduledDate,
    } = req.body;

    const ticket = new Ticket({
        title,
        description,
        priority,
        category,
        location,
        inspection,
        createdBy: req.user._id,
        assignedTo,
        photos,
        dueDate,
        scheduledDate,
    });

    const createdTicket = await ticket.save();
    res.status(201).json(createdTicket);
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
        // Track first response time
        if (req.body.status === 'in_progress' && ticket.status === 'open' && !ticket.firstResponseAt) {
            req.body.firstResponseAt = new Date();
        }

        Object.assign(ticket, req.body);
        const updatedTicket = await ticket.save();
        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

// @desc    Quick assign ticket
// @route   PATCH /api/tickets/:id/assign
// @access  Private
const assignTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket) {
        ticket.assignedTo = req.body.assignedTo;
        const updatedTicket = await ticket.save();
        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

// @desc    Quick schedule ticket
// @route   PATCH /api/tickets/:id/schedule
// @access  Private
const scheduleTicket = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket) {
        ticket.scheduledDate = req.body.scheduledDate;
        const updatedTicket = await ticket.save();
        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

module.exports = { getTickets, createTicket, updateTicket, assignTicket, scheduleTicket };
