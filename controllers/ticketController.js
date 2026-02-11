const Ticket = require('../models/ticketModel');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    // 1. Initialize filter with basic properties from request
    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;

    // 2. Apply Role-Based Constraints
    if (req.user.role === 'admin' || req.user.role === 'sub_admin') {
        // Admins can filter by specific assignee
        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }
        // Otherwise, they see everything (subject to status/priority filters above)
    }
    else if (req.user.role === 'supervisor') {
        // Supervisors are restricted to their assigned tickets
        query.assignedTo = req.user._id;
    }
    else if (req.user.role === 'client') {
        // Clients are restricted to their locations
        query.location = { $in: req.user.assignedLocations };
    }

    try {
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name')
            .populate('location', 'name')
            .sort({ createdAt: -1 }); // Show newest first
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
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

        // Track resolution details
        if (req.body.status === 'resolved' && ticket.status !== 'resolved') {
            req.body.resolvedAt = new Date();
            req.body.resolvedBy = req.user._id;
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

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('location', 'name');

    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
};

module.exports = { getTickets, createTicket, updateTicket, assignTicket, scheduleTicket, getTicketById };
