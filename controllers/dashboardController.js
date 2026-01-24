const Inspection = require('../models/inspectionModel');
const Ticket = require('../models/ticketModel');
const Location = require('../models/locationModel');

// @desc    Get inspection count by date range
// @route   GET /api/dashboard/inspection_count
// @access  Private
const getInspectionCount = async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        // Build query
        const query = {};
        
        // Date range filter
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

        // Location filter
        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user && req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
            // Supervisors see their own inspections or assigned locations
            query.$or = [
                { inspector: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const count = await Inspection.countDocuments(query);

        res.json({ count });
    } catch (error) {
        console.error('Inspection count error:', error);
        res.status(500).json({ message: 'Failed to get inspection count' });
    }
};

// @desc    Get inspection score average by date range
// @route   GET /api/dashboard/inspection_score_average
// @access  Private
const getInspectionScoreAverage = async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        // Build query
        const query = {};
        
        // Date range filter
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

        // Location filter
        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user && req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
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
        res.status(500).json({ message: 'Failed to get inspection score average' });
    }
};

// @desc    Get ticket count by date range
// @route   GET /api/dashboard/ticket_count
// @access  Private
const getTicketCount = async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        // Build query
        const query = {};
        
        // Date range filter
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

        // Location filter
        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user && req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
            query.$or = [
                { assignedTo: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const count = await Ticket.countDocuments(query);

        res.json({ count });
    } catch (error) {
        console.error('Ticket count error:', error);
        res.status(500).json({ message: 'Failed to get ticket count' });
    }
};

// @desc    Get inspections over time (for chart)
// @route   GET /api/dashboard/inspections_over_time
// @access  Private
const getInspectionsOverTime = async (req, res) => {
    try {
        const { start_date, end_date, location_id, group_by = 'week' } = req.query;

        // Build query
        const query = {};
        
        // Date range filter
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

        // Location filter
        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user && req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
            query.$or = [
                { inspector: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const inspections = await Inspection.find(query).select('createdAt').sort({ createdAt: 1 });

        // Group by week or month
        const grouped = {};
        inspections.forEach(inspection => {
            const date = new Date(inspection.createdAt);
            let key;
            
            if (group_by === 'week') {
                // Get week start (Monday)
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(date.setDate(diff));
                weekStart.setHours(0, 0, 0, 0);
                key = weekStart.toISOString().split('T')[0];
            } else {
                // Group by month
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            
            grouped[key] = (grouped[key] || 0) + 1;
        });

        // Format for chart
        const chartData = Object.keys(grouped).map(key => ({
            date: key,
            count: grouped[key]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(chartData);
    } catch (error) {
        console.error('Inspections over time error:', error);
        res.status(500).json({ message: 'Failed to get inspections over time' });
    }
};

// @desc    Get tickets created over time (for chart)
// @route   GET /api/dashboard/tickets_over_time
// @access  Private
const getTicketsOverTime = async (req, res) => {
    try {
        const { start_date, end_date, location_id, group_by = 'week' } = req.query;

        // Build query
        const query = {};
        
        // Date range filter
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

        // Location filter
        if (location_id && location_id !== 'all') {
            query.location = location_id;
        }

        // Role-based filtering
        if (req.user && req.user.role === 'client') {
            query.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
            query.$or = [
                { assignedTo: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        const tickets = await Ticket.find(query).select('createdAt').sort({ createdAt: 1 });

        // Group by week or month
        const grouped = {};
        tickets.forEach(ticket => {
            const date = new Date(ticket.createdAt);
            let key;
            
            if (group_by === 'week') {
                // Get week start (Monday)
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(date.setDate(diff));
                weekStart.setHours(0, 0, 0, 0);
                key = weekStart.toISOString().split('T')[0];
            } else {
                // Group by month
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            
            grouped[key] = (grouped[key] || 0) + 1;
        });

        // Format for chart
        const chartData = Object.keys(grouped).map(key => ({
            date: key,
            count: grouped[key]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(chartData);
    } catch (error) {
        console.error('Tickets over time error:', error);
        res.status(500).json({ message: 'Failed to get tickets over time' });
    }
};

// @desc    Get dashboard summary metrics
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;

        // Build base query
        const baseQuery = {};
        
        // Date range filter
        if (start_date || end_date) {
            baseQuery.createdAt = {};
            if (start_date) {
                baseQuery.createdAt.$gte = new Date(start_date);
            }
            if (end_date) {
                const endDate = new Date(end_date);
                endDate.setHours(23, 59, 59, 999);
                baseQuery.createdAt.$lte = endDate;
            }
        }

        // Location filter
        if (location_id && location_id !== 'all') {
            baseQuery.location = location_id;
        }

        // Role-based filtering
        let inspectionQuery = { ...baseQuery };
        let ticketQuery = { ...baseQuery };

        if (req.user && req.user.role === 'client') {
            inspectionQuery.location = { $in: req.user.assignedLocations || [] };
            ticketQuery.location = { $in: req.user.assignedLocations || [] };
        } else if (req.user && req.user.role === 'supervisor') {
            inspectionQuery.$or = [
                { inspector: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
            ticketQuery.$or = [
                { assignedTo: req.user._id },
                { location: { $in: req.user.assignedLocations || [] } }
            ];
        }

        // Get inspections
        const inspections = await Inspection.find(inspectionQuery).select('totalScore appaScore createdAt');
        
        // Get tickets
        const tickets = await Ticket.find(ticketQuery).select('status createdAt firstResponseAt');

        // Calculate metrics
        const totalInspections = inspections.length;
        const avgScore = totalInspections > 0
            ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalInspections)
            : 0;
        
        const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
        const resolvedTickets = tickets.filter(t => ['resolved', 'closed', 'verified'].includes(t.status)).length;
        
        const avgAppaScore = inspections.length > 0
            ? Math.round(inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / inspections.length)
            : 5;
        
        const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
        const avgResponseTime = ticketsWithResponse.length > 0
            ? Math.round(ticketsWithResponse.reduce((acc, curr) => {
                const created = new Date(curr.createdAt);
                const responded = new Date(curr.firstResponseAt);
                return acc + (responded - created);
            }, 0) / ticketsWithResponse.length / (1000 * 60 * 60)) // In hours
            : 0;

        res.json({
            totalInspections,
            averageScore: avgScore,
            openIssues: openTickets,
            resolvedIssues: resolvedTickets,
            avgAppaScore,
            avgResponseTime
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ message: 'Failed to get dashboard summary' });
    }
};

module.exports = {
    getInspectionCount,
    getInspectionScoreAverage,
    getTicketCount,
    getInspectionsOverTime,
    getTicketsOverTime,
    getDashboardSummary
};
