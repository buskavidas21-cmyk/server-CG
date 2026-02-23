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

// @desc    Get work stats (per-user activity: tickets worked, inspections done, time taken)
// @route   GET /api/dashboard/work-stats
// @access  Private (admin/sub_admin see all, supervisor sees own, client blocked)
const getWorkStats = async (req, res) => {
    try {
        const { start_date, end_date, user_id } = req.query;

        if (req.user.role === 'client') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = end_date ? new Date(end_date) : new Date();
        end.setHours(23, 59, 59, 999);

        // --- Build queries ---
        let ticketQuery = { createdAt: { $gte: start, $lte: end } };
        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };

        if (req.user.role === 'supervisor') {
            ticketQuery.assignedTo = req.user._id;
            inspectionQuery.inspector = req.user._id;
        } else if (user_id && user_id !== 'all') {
            ticketQuery.assignedTo = user_id;
            inspectionQuery.inspector = user_id;
        }

        // --- Fetch data ---
        const tickets = await Ticket.find(ticketQuery)
            .populate('assignedTo', 'name email role')
            .populate('location', 'name')
            .sort({ createdAt: -1 });

        const inspections = await Inspection.find(inspectionQuery)
            .populate('inspector', 'name email role')
            .populate('location', 'name')
            .populate('template', 'name')
            .sort({ createdAt: -1 });

        // --- Per-user aggregation ---
        const userMap = {};

        const ensureUser = (id, name, role) => {
            const key = id?.toString();
            if (!key) return null;
            if (!userMap[key]) {
                userMap[key] = {
                    userId: key,
                    name: name || 'Unknown',
                    role: role || 'supervisor',
                    tickets: { assigned: 0, started: 0, resolved: 0, totalResolutionHours: 0 },
                    inspections: { assigned: 0, completed: 0, totalScore: 0, totalCompletionHours: 0 },
                };
            }
            return userMap[key];
        };

        tickets.forEach(t => {
            const u = ensureUser(t.assignedTo?._id, t.assignedTo?.name, t.assignedTo?.role);
            if (!u) return;
            u.tickets.assigned++;
            if (t.firstResponseAt) u.tickets.started++;
            if (t.resolvedAt) {
                u.tickets.resolved++;
                const hours = (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
                u.tickets.totalResolutionHours += hours;
            }
        });

        inspections.forEach(i => {
            const u = ensureUser(i.inspector?._id, i.inspector?.name, i.inspector?.role);
            if (!u) return;
            u.inspections.assigned++;
            if (i.status === 'completed' || i.status === 'submitted') {
                u.inspections.completed++;
                u.inspections.totalScore += i.totalScore || 0;
                const hours = (new Date(i.updatedAt) - new Date(i.createdAt)) / (1000 * 60 * 60);
                u.inspections.totalCompletionHours += hours;
            }
        });

        const userStats = Object.values(userMap).map(u => ({
            userId: u.userId,
            name: u.name,
            role: u.role,
            tickets: {
                assigned: u.tickets.assigned,
                started: u.tickets.started,
                resolved: u.tickets.resolved,
                avgResolutionHours: u.tickets.resolved > 0
                    ? parseFloat((u.tickets.totalResolutionHours / u.tickets.resolved).toFixed(1))
                    : 0,
            },
            inspections: {
                assigned: u.inspections.assigned,
                completed: u.inspections.completed,
                avgScore: u.inspections.completed > 0
                    ? Math.round(u.inspections.totalScore / u.inspections.completed)
                    : 0,
                avgCompletionHours: u.inspections.completed > 0
                    ? parseFloat((u.inspections.totalCompletionHours / u.inspections.completed).toFixed(1))
                    : 0,
            },
        }));

        // --- Activity log (combined recent items) ---
        const activity = [];

        tickets.forEach(t => {
            activity.push({
                type: 'ticket',
                id: t._id,
                title: t.title,
                locationName: t.location?.name || 'N/A',
                person: t.assignedTo?.name || 'Unassigned',
                personId: t.assignedTo?._id?.toString() || null,
                status: t.status,
                priority: t.priority,
                startedAt: t.firstResponseAt || null,
                completedAt: t.resolvedAt || null,
                scheduledDate: t.scheduledDate || null,
                createdAt: t.createdAt,
                timeTakenHours: t.resolvedAt
                    ? parseFloat(((new Date(t.resolvedAt) - new Date(t.firstResponseAt || t.createdAt)) / (1000 * 60 * 60)).toFixed(1))
                    : null,
            });
        });

        inspections.forEach(i => {
            const isCompleted = i.status === 'completed' || i.status === 'submitted';
            activity.push({
                type: 'inspection',
                id: i._id,
                title: i.template?.name || 'Inspection',
                locationName: i.location?.name || 'N/A',
                person: i.inspector?.name || 'Unknown',
                personId: i.inspector?._id?.toString() || null,
                status: i.status,
                score: i.totalScore,
                startedAt: i.createdAt,
                completedAt: isCompleted ? i.updatedAt : null,
                scheduledDate: i.scheduledDate || null,
                createdAt: i.createdAt,
                timeTakenHours: isCompleted
                    ? parseFloat(((new Date(i.updatedAt) - new Date(i.createdAt)) / (1000 * 60 * 60)).toFixed(1))
                    : null,
            });
        });

        activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // --- Summary totals ---
        const totalTicketsResolved = tickets.filter(t => t.resolvedAt).length;
        const totalInspectionsCompleted = inspections.filter(i => i.status === 'completed' || i.status === 'submitted').length;

        const avgTicketResolutionHours = totalTicketsResolved > 0
            ? parseFloat((tickets.filter(t => t.resolvedAt).reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60), 0) / totalTicketsResolved).toFixed(1))
            : 0;

        const avgInspectionScore = totalInspectionsCompleted > 0
            ? Math.round(inspections.filter(i => i.status === 'completed' || i.status === 'submitted').reduce((sum, i) => sum + (i.totalScore || 0), 0) / totalInspectionsCompleted)
            : 0;

        // --- Get supervisors list for filter dropdown (admin only) ---
        let supervisors = [];
        if (req.user.role === 'admin' || req.user.role === 'sub_admin') {
            const User = require('../models/userModel');
            supervisors = await User.find({ role: { $in: ['supervisor', 'admin', 'sub_admin'] } })
                .select('name email role')
                .sort({ name: 1 });
        }

        res.json({
            period: { start, end },
            summary: {
                totalTickets: tickets.length,
                totalTicketsResolved,
                avgTicketResolutionHours,
                totalInspections: inspections.length,
                totalInspectionsCompleted,
                avgInspectionScore,
            },
            userStats,
            activity,
            supervisors: supervisors.map(s => ({ _id: s._id, name: s.name, role: s.role })),
        });
    } catch (error) {
        console.error('Work stats error:', error);
        res.status(500).json({ message: 'Failed to get work stats' });
    }
};

module.exports = {
    getInspectionCount,
    getInspectionScoreAverage,
    getTicketCount,
    getInspectionsOverTime,
    getTicketsOverTime,
    getDashboardSummary,
    getWorkStats
};
