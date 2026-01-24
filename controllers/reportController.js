const Inspection = require('../models/inspectionModel');
const Ticket = require('../models/ticketModel');
const Location = require('../models/locationModel');
const Template = require('../models/templateModel');
const User = require('../models/userModel');

// @desc    Get Overall Report Data
// @route   GET /api/reports/overall
// @access  Private
const getOverallReport = async (req, res) => {
    try {
        const { startDate, endDate, locationId } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };
        let ticketQuery = { createdAt: { $gte: start, $lte: end } };

        if (locationId && locationId !== 'all') {
            inspectionQuery.location = locationId;
            ticketQuery.location = locationId;
        }

        // Role-based filtering
        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
            ticketQuery.assignedTo = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
            ticketQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('location', 'name')
            .populate('template', 'name')
            .populate('inspector', 'name');

        const tickets = await Ticket.find(ticketQuery)
            .populate('location', 'name')
            .populate('assignedTo', 'name');

        // Overall Statistics
        const totalInspections = inspections.length;
        const avgScore = totalInspections > 0
            ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalInspections)
            : 0;
        const avgAppaScore = totalInspections > 0
            ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / totalInspections).toFixed(1)
            : 0;

        const totalTickets = tickets.length;
        const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
        const resolvedTickets = tickets.filter(t => ['resolved', 'closed', 'verified'].includes(t.status)).length;

        // Location Performance (Lowest-performing locations)
        const locationPerformance = {};
        inspections.forEach(inspection => {
            const locId = inspection.location?._id || inspection.location;
            const locName = inspection.location?.name || 'Unknown';
            if (!locationPerformance[locId]) {
                locationPerformance[locId] = {
                    locationId: locId,
                    locationName: locName,
                    inspections: [],
                    totalScore: 0,
                    count: 0
                };
            }
            locationPerformance[locId].inspections.push(inspection);
            locationPerformance[locId].totalScore += inspection.totalScore || 0;
            locationPerformance[locId].count += 1;
        });

        const locationStats = Object.values(locationPerformance).map(loc => ({
            locationId: loc.locationId,
            locationName: loc.locationName,
            inspectionCount: loc.count,
            averageScore: Math.round(loc.totalScore / loc.count),
            avgAppaScore: (loc.inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / loc.count).toFixed(1),
            ticketCount: tickets.filter(t => (t.location?._id || t.location)?.toString() === loc.locationId.toString()).length
        })).sort((a, b) => a.averageScore - b.averageScore); // Sort by lowest score first

        res.json({
            period: { start, end },
            overall: {
                totalInspections,
                avgScore,
                avgAppaScore,
                totalTickets,
                openTickets,
                resolvedTickets
            },
            locationPerformance: locationStats,
            trendData: {
                inspectionsOverTime: getTimeSeriesData(inspections, 'createdAt'),
                ticketsOverTime: getTimeSeriesData(tickets, 'createdAt')
            }
        });
    } catch (error) {
        console.error('Overall report error:', error);
        res.status(500).json({ message: 'Failed to generate overall report' });
    }
};

// @desc    Get Tickets Report Data
// @route   GET /api/reports/tickets
// @access  Private
const getTicketsReport = async (req, res) => {
    try {
        const { startDate, endDate, locationId } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let ticketQuery = { createdAt: { $gte: start, $lte: end } };

        if (locationId && locationId !== 'all') {
            ticketQuery.location = locationId;
        }

        // Role-based filtering
        if (req.user.role === 'supervisor') {
            ticketQuery.assignedTo = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            ticketQuery.location = { $in: locationIds };
        }

        const tickets = await Ticket.find(ticketQuery)
            .populate('location', 'name')
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name');

        // Response Time Analysis
        const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
        const responseTimes = ticketsWithResponse.map(t => {
            const created = new Date(t.createdAt);
            const responded = new Date(t.firstResponseAt);
            return (responded - created) / (1000 * 60 * 60); // hours
        });
        const avgResponseTime = responseTimes.length > 0
            ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(1)
            : 0;

        // Resolution Time Analysis (use updatedAt for resolved tickets)
        const resolvedTickets = tickets.filter(t => ['resolved', 'verified'].includes(t.status));
        const resolutionTimes = resolvedTickets.map(t => {
            const created = new Date(t.createdAt);
            const resolved = new Date(t.updatedAt);
            return (resolved - created) / (1000 * 60 * 60); // hours
        });
        const avgResolutionTime = resolutionTimes.length > 0
            ? (resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length).toFixed(1)
            : 0;

        // Location Complaints (Most complaints by location)
        const locationComplaints = {};
        tickets.forEach(ticket => {
            const locId = ticket.location?._id || ticket.location;
            const locName = ticket.location?.name || 'Unknown';
            if (!locationComplaints[locId]) {
                locationComplaints[locId] = {
                    locationId: locId,
                    locationName: locName,
                    totalTickets: 0,
                    openTickets: 0,
                    resolvedTickets: 0,
                    avgResponseTime: 0,
                    tickets: []
                };
            }
            locationComplaints[locId].totalTickets += 1;
            locationComplaints[locId].tickets.push(ticket);
            if (['open', 'in_progress'].includes(ticket.status)) {
                locationComplaints[locId].openTickets += 1;
            } else {
                locationComplaints[locId].resolvedTickets += 1;
            }
        });

        // Calculate avg response time per location
        Object.values(locationComplaints).forEach(loc => {
            const locTicketsWithResponse = loc.tickets.filter(t => t.firstResponseAt);
            if (locTicketsWithResponse.length > 0) {
                const times = locTicketsWithResponse.map(t => {
                    const created = new Date(t.createdAt);
                    const responded = new Date(t.firstResponseAt);
                    return (responded - created) / (1000 * 60 * 60);
                });
                loc.avgResponseTime = (times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(1);
            }
            delete loc.tickets; // Remove full ticket array
        });

        const locationStats = Object.values(locationComplaints)
            .sort((a, b) => b.totalTickets - a.totalTickets); // Sort by most complaints first

        // Status Distribution
        const statusDistribution = {
            open: tickets.filter(t => t.status === 'open').length,
            in_progress: tickets.filter(t => t.status === 'in_progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            verified: tickets.filter(t => t.status === 'verified').length
        };

        // Priority Distribution
        const priorityDistribution = {
            low: tickets.filter(t => t.priority === 'low').length,
            medium: tickets.filter(t => t.priority === 'medium').length,
            high: tickets.filter(t => t.priority === 'high').length,
            urgent: tickets.filter(t => t.priority === 'urgent').length
        };

        res.json({
            period: { start, end },
            responsiveness: {
                totalTickets: tickets.length,
                avgResponseTime: parseFloat(avgResponseTime),
                avgResolutionTime: parseFloat(avgResolutionTime),
                responseRate: tickets.length > 0 ? ((ticketsWithResponse.length / tickets.length) * 100).toFixed(1) : 0
            },
            locationComplaints: locationStats,
            statusDistribution,
            priorityDistribution,
            trendData: {
                ticketsOverTime: getTimeSeriesData(tickets, 'createdAt'),
                responseTimeOverTime: getTimeSeriesData(ticketsWithResponse, 'firstResponseAt')
            }
        });
    } catch (error) {
        console.error('Tickets report error:', error);
        res.status(500).json({ message: 'Failed to generate tickets report' });
    }
};

// @desc    Get Inspector Leaderboard Report
// @route   GET /api/reports/inspectors
// @access  Private
const getInspectorLeaderboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };

        // Role-based filtering
        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('inspector', 'name email')
            .populate('location', 'name');

        // Inspector Statistics
        const inspectorStats = {};
        inspections.forEach(inspection => {
            const inspectorId = inspection.inspector?._id || inspection.inspector;
            const inspectorName = inspection.inspector?.name || 'Unknown';
            if (!inspectorStats[inspectorId]) {
                inspectorStats[inspectorId] = {
                    inspectorId,
                    inspectorName,
                    inspections: [],
                    totalScore: 0,
                    totalAppaScore: 0,
                    count: 0
                };
            }
            inspectorStats[inspectorId].inspections.push(inspection);
            inspectorStats[inspectorId].totalScore += inspection.totalScore || 0;
            inspectorStats[inspectorId].totalAppaScore += inspection.appaScore || 0;
            inspectorStats[inspectorId].count += 1;
        });

        const leaderboard = Object.values(inspectorStats).map(stat => {
            const avgScore = stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0;
            const avgAppaScore = stat.count > 0 ? (stat.totalAppaScore / stat.count).toFixed(1) : 0;
            
            // Score distribution
            const excellent = stat.inspections.filter(i => (i.totalScore || 0) >= 90).length;
            const good = stat.inspections.filter(i => (i.totalScore || 0) >= 75 && (i.totalScore || 0) < 90).length;
            const poor = stat.inspections.filter(i => (i.totalScore || 0) < 75).length;

            return {
                inspectorId: stat.inspectorId,
                inspectorName: stat.inspectorName,
                inspectionCount: stat.count,
                averageScore: avgScore,
                avgAppaScore: parseFloat(avgAppaScore),
                scoreDistribution: {
                    excellent: excellent,
                    good: good,
                    poor: poor
                },
                locationsInspected: [...new Set(stat.inspections.map(i => (i.location?._id || i.location)?.toString()))].length
            };
        }).sort((a, b) => b.inspectionCount - a.inspectionCount); // Sort by inspection count

        res.json({
            period: { start, end },
            leaderboard,
            summary: {
                totalInspectors: leaderboard.length,
                totalInspections: inspections.length,
                overallAvgScore: inspections.length > 0
                    ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
                    : 0
            }
        });
    } catch (error) {
        console.error('Inspector leaderboard error:', error);
        res.status(500).json({ message: 'Failed to generate inspector leaderboard' });
    }
};

// @desc    Get Private Inspections Report
// @route   GET /api/reports/private_inspections
// @access  Private
const getPrivateInspectionsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { 
            createdAt: { $gte: start, $lte: end },
            isPrivate: true
        };

        // Role-based filtering
        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        } else if (req.user.role === 'client') {
            // Clients typically don't see private inspections
            return res.json({ message: 'Private inspections are internal only' });
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('inspector', 'name')
            .populate('location', 'name')
            .populate('template', 'name');

        // Internal Team Performance
        const inspectorPerformance = {};
        inspections.forEach(inspection => {
            const inspectorId = inspection.inspector?._id || inspection.inspector;
            const inspectorName = inspection.inspector?.name || 'Unknown';
            if (!inspectorPerformance[inspectorId]) {
                inspectorPerformance[inspectorId] = {
                    inspectorId,
                    inspectorName,
                    inspections: [],
                    totalScore: 0,
                    count: 0
                };
            }
            inspectorPerformance[inspectorId].inspections.push(inspection);
            inspectorPerformance[inspectorId].totalScore += inspection.totalScore || 0;
            inspectorPerformance[inspectorId].count += 1;
        });

        const performance = Object.values(inspectorPerformance).map(stat => ({
            inspectorId: stat.inspectorId,
            inspectorName: stat.inspectorName,
            inspectionCount: stat.count,
            averageScore: Math.round(stat.totalScore / stat.count),
            avgAppaScore: (stat.inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / stat.count).toFixed(1)
        })).sort((a, b) => b.averageScore - a.averageScore);

        const totalPrivateInspections = inspections.length;
        const avgScore = totalPrivateInspections > 0
            ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalPrivateInspections)
            : 0;

        res.json({
            period: { start, end },
            summary: {
                totalPrivateInspections,
                avgScore,
                avgAppaScore: totalPrivateInspections > 0
                    ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / totalPrivateInspections).toFixed(1)
                    : 0
            },
            inspectorPerformance: performance,
            trendData: {
                privateInspectionsOverTime: getTimeSeriesData(inspections, 'createdAt')
            }
        });
    } catch (error) {
        console.error('Private inspections report error:', error);
        res.status(500).json({ message: 'Failed to generate private inspections report' });
    }
};

// @desc    Get Inspection Forms Report
// @route   GET /api/reports/inspection_forms
// @access  Private
const getInspectionFormsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };

        // Role-based filtering
        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('template', 'name sections')
            .populate('location', 'name type');

        // Get all templates
        const templates = await Template.find({});

        // Area Type Performance (by location type)
        const areaTypePerformance = {};
        inspections.forEach(inspection => {
            const areaType = inspection.location?.type || 'unknown';
            if (!areaTypePerformance[areaType]) {
                areaTypePerformance[areaType] = {
                    areaType,
                    inspections: [],
                    totalScore: 0,
                    count: 0,
                    itemPerformance: {}
                };
            }
            areaTypePerformance[areaType].inspections.push(inspection);
            areaTypePerformance[areaType].totalScore += inspection.totalScore || 0;
            areaTypePerformance[areaType].count += 1;

            // Track item performance
            inspection.sections.forEach(section => {
                section.items.forEach(item => {
                    const itemKey = `${section.name} - ${item.name}`;
                    if (!areaTypePerformance[areaType].itemPerformance[itemKey]) {
                        areaTypePerformance[areaType].itemPerformance[itemKey] = {
                            itemName: itemKey,
                            passCount: 0,
                            failCount: 0,
                            totalScore: 0,
                            count: 0
                        };
                    }
                    if (item.status === 'pass' || (typeof item.score === 'number' && item.score >= 3)) {
                        areaTypePerformance[areaType].itemPerformance[itemKey].passCount += 1;
                    } else {
                        areaTypePerformance[areaType].itemPerformance[itemKey].failCount += 1;
                    }
                    if (typeof item.score === 'number') {
                        areaTypePerformance[areaType].itemPerformance[itemKey].totalScore += item.score;
                    }
                    areaTypePerformance[areaType].itemPerformance[itemKey].count += 1;
                });
            });
        });

        const areaTypeStats = Object.values(areaTypePerformance).map(area => {
            const avgScore = area.count > 0 ? Math.round(area.totalScore / area.count) : 0;
            
            // Get lowest-performing line items
            const items = Object.values(area.itemPerformance);
            const lowestItems = items
                .map(item => ({
                    itemName: item.itemName,
                    failRate: item.count > 0 ? ((item.failCount / item.count) * 100).toFixed(1) : 0,
                    avgScore: item.count > 0 ? (item.totalScore / item.count).toFixed(1) : 0,
                    passCount: item.passCount,
                    failCount: item.failCount,
                    totalCount: item.count
                }))
                .sort((a, b) => parseFloat(b.failRate) - parseFloat(a.failRate))
                .slice(0, 10); // Top 10 lowest-performing items

            return {
                areaType: area.areaType,
                inspectionCount: area.count,
                averageScore: avgScore,
                lowestPerformingItems: lowestItems
            };
        }).sort((a, b) => a.averageScore - b.averageScore); // Sort by lowest score first

        // Template Performance
        const templatePerformance = {};
        inspections.forEach(inspection => {
            const templateId = inspection.template?._id || inspection.template;
            const templateName = inspection.template?.name || 'Unknown';
            if (!templatePerformance[templateId]) {
                templatePerformance[templateId] = {
                    templateId,
                    templateName,
                    inspections: [],
                    totalScore: 0,
                    count: 0
                };
            }
            templatePerformance[templateId].inspections.push(inspection);
            templatePerformance[templateId].totalScore += inspection.totalScore || 0;
            templatePerformance[templateId].count += 1;
        });

        const templateStats = Object.values(templatePerformance).map(template => ({
            templateId: template.templateId,
            templateName: template.templateName,
            inspectionCount: template.count,
            averageScore: Math.round(template.totalScore / template.count)
        })).sort((a, b) => a.averageScore - b.averageScore);

        res.json({
            period: { start, end },
            areaTypePerformance: areaTypeStats,
            templatePerformance: templateStats
        });
    } catch (error) {
        console.error('Inspection forms report error:', error);
        res.status(500).json({ message: 'Failed to generate inspection forms report' });
    }
};

// Helper function to generate time series data
const getTimeSeriesData = (items, dateField) => {
    const data = {};
    items.forEach(item => {
        const date = new Date(item[dateField]);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        data[dateKey] = (data[dateKey] || 0) + 1;
    });
    return Object.keys(data).map(date => ({
        date,
        count: data[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Keep existing getSummaryReport for backward compatibility
const getSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate, type = 'all' } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const query = {
            createdAt: { $gte: start, $lte: end }
        };

        let inspections = [];
        let tickets = [];

        if (type === 'all' || type === 'inspections') {
            inspections = await Inspection.find(query)
                .populate('location', 'name')
                .populate('template', 'name')
                .populate('inspector', 'name')
                .sort({ createdAt: -1 });
        }

        if (type === 'all' || type === 'tickets') {
            tickets = await Ticket.find(query)
                .populate('location', 'name')
                .populate('assignedTo', 'name')
                .sort({ createdAt: -1 });
        }

        const stats = {
            totalInspections: inspections.length,
            avgScore: inspections.length > 0
                ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
                : 0,
            totalTickets: tickets.length,
            resolvedTickets: tickets.filter(t => ['resolved', 'verified'].includes(t.status)).length,
            avgAppaScore: inspections.length > 0
                ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / inspections.length).toFixed(1)
                : 0,
            avgResponseTime: tickets.filter(t => t.firstResponseAt).length > 0
                ? Math.round(tickets.filter(t => t.firstResponseAt).reduce((acc, curr) => {
                    const created = new Date(curr.createdAt);
                    const responded = new Date(curr.firstResponseAt);
                    return acc + (responded - created);
                }, 0) / tickets.filter(t => t.firstResponseAt).length / (1000 * 60 * 60))
                : 0
        };

        const reportData = {
            startDate: start,
            endDate: end,
            type,
            stats,
            inspections,
            tickets
        };

        // Generate PDF (if pdfGenerator exists)
        try {
            const { generateSummaryReport } = require('../utils/pdfGenerator');
            const path = require('path');
            const fs = require('fs');

            const reportsDir = path.join(__dirname, '../reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const filename = `summary-report-${Date.now()}.pdf`;
            const filepath = path.join(reportsDir, filename);

            await generateSummaryReport(reportData, filepath);

            res.download(filepath, filename, (err) => {
                if (err) console.error('Download error:', err);
                fs.unlink(filepath, (unlinkErr) => {
                    if (unlinkErr) console.error('File deletion error:', unlinkErr);
                });
            });
        } catch (pdfError) {
            // If PDF generation fails, return JSON
            res.json(reportData);
        }

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

// Export functions for PDF generation
const exportOverallReport = async (req, res) => {
    try {
        const { startDate, endDate, locationId } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Get report data (reuse existing function logic)
        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };
        let ticketQuery = { createdAt: { $gte: start, $lte: end } };

        if (locationId && locationId !== 'all') {
            inspectionQuery.location = locationId;
            ticketQuery.location = locationId;
        }

        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
            ticketQuery.assignedTo = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
            ticketQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery).populate('location', 'name');
        const tickets = await Ticket.find(ticketQuery).populate('location', 'name');

        const reportData = {
            period: { start, end },
            overall: {
                totalInspections: inspections.length,
                avgScore: inspections.length > 0 ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length) : 0,
                avgAppaScore: inspections.length > 0 ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / inspections.length).toFixed(1) : 0,
                totalTickets: tickets.length,
                openTickets: tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length,
                resolvedTickets: tickets.filter(t => ['resolved', 'verified'].includes(t.status)).length
            },
            locationPerformance: [] // Simplified for export
        };

        // Generate PDF
        const { generateOverallReportPDF } = require('../utils/pdfGenerator');
        const path = require('path');
        const fs = require('fs');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `overall-report-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        // Get full location performance data
        const locationPerformance = {};
        inspections.forEach(inspection => {
            const locId = inspection.location?._id || inspection.location;
            const locName = inspection.location?.name || 'Unknown';
            if (!locationPerformance[locId]) {
                locationPerformance[locId] = { locationId: locId, locationName: locName, inspections: [], totalScore: 0, count: 0 };
            }
            locationPerformance[locId].inspections.push(inspection);
            locationPerformance[locId].totalScore += inspection.totalScore || 0;
            locationPerformance[locId].count += 1;
        });

        reportData.locationPerformance = Object.values(locationPerformance).map(loc => ({
            locationId: loc.locationId,
            locationName: loc.locationName,
            inspectionCount: loc.count,
            averageScore: Math.round(loc.totalScore / loc.count),
            avgAppaScore: (loc.inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / loc.count).toFixed(1),
            ticketCount: tickets.filter(t => (t.location?._id || t.location)?.toString() === loc.locationId.toString()).length
        })).sort((a, b) => a.averageScore - b.averageScore);

        await generateOverallReportPDF(reportData, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export report' });
    }
};

const exportTicketsReport = async (req, res) => {
    try {
        // Get report data (duplicate logic from getTicketsReport)
        const { startDate, endDate, locationId } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let ticketQuery = { createdAt: { $gte: start, $lte: end } };
        if (locationId && locationId !== 'all') {
            ticketQuery.location = locationId;
        }
        if (req.user.role === 'supervisor') {
            ticketQuery.assignedTo = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            ticketQuery.location = { $in: locationIds };
        }

        const tickets = await Ticket.find(ticketQuery)
            .populate('location', 'name')
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name');

        const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
        const responseTimes = ticketsWithResponse.map(t => {
            const created = new Date(t.createdAt);
            const responded = new Date(t.firstResponseAt);
            return (responded - created) / (1000 * 60 * 60);
        });
        const avgResponseTime = responseTimes.length > 0
            ? (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length).toFixed(1)
            : 0;

        const resolvedTickets = tickets.filter(t => ['resolved', 'verified'].includes(t.status));
        const resolutionTimes = resolvedTickets.map(t => {
            const created = new Date(t.createdAt);
            const resolved = new Date(t.updatedAt);
            return (resolved - created) / (1000 * 60 * 60);
        });
        const avgResolutionTime = resolutionTimes.length > 0
            ? (resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length).toFixed(1)
            : 0;

        const locationComplaints = {};
        tickets.forEach(ticket => {
            const locId = ticket.location?._id || ticket.location;
            const locName = ticket.location?.name || 'Unknown';
            if (!locationComplaints[locId]) {
                locationComplaints[locId] = {
                    locationId: locId,
                    locationName: locName,
                    totalTickets: 0,
                    openTickets: 0,
                    resolvedTickets: 0,
                    avgResponseTime: 0,
                    tickets: []
                };
            }
            locationComplaints[locId].totalTickets += 1;
            locationComplaints[locId].tickets.push(ticket);
            if (['open', 'in_progress'].includes(ticket.status)) {
                locationComplaints[locId].openTickets += 1;
            } else {
                locationComplaints[locId].resolvedTickets += 1;
            }
        });

        Object.values(locationComplaints).forEach(loc => {
            const locTicketsWithResponse = loc.tickets.filter(t => t.firstResponseAt);
            if (locTicketsWithResponse.length > 0) {
                const times = locTicketsWithResponse.map(t => {
                    const created = new Date(t.createdAt);
                    const responded = new Date(t.firstResponseAt);
                    return (responded - created) / (1000 * 60 * 60);
                });
                loc.avgResponseTime = (times.reduce((sum, time) => sum + time, 0) / times.length).toFixed(1);
            }
            delete loc.tickets;
        });

        const locationStats = Object.values(locationComplaints)
            .sort((a, b) => b.totalTickets - a.totalTickets);

        const reportData = {
            period: { start, end },
            responsiveness: {
                totalTickets: tickets.length,
                avgResponseTime: parseFloat(avgResponseTime),
                avgResolutionTime: parseFloat(avgResolutionTime),
                responseRate: tickets.length > 0 ? ((ticketsWithResponse.length / tickets.length) * 100).toFixed(1) : 0
            },
            locationComplaints: locationStats
        };

        // Generate PDF
        const { generateTicketsReportPDF } = require('../utils/pdfGenerator');
        const path = require('path');
        const fs = require('fs');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `tickets-report-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generateTicketsReportPDF(reportData, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export report' });
    }
};

const exportInspectorLeaderboard = async (req, res) => {
    try {
        // Get report data
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };
        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('inspector', 'name email')
            .populate('location', 'name');

        const inspectorStats = {};
        inspections.forEach(inspection => {
            const inspectorId = inspection.inspector?._id || inspection.inspector;
            const inspectorName = inspection.inspector?.name || 'Unknown';
            if (!inspectorStats[inspectorId]) {
                inspectorStats[inspectorId] = {
                    inspectorId,
                    inspectorName,
                    inspections: [],
                    totalScore: 0,
                    totalAppaScore: 0,
                    count: 0
                };
            }
            inspectorStats[inspectorId].inspections.push(inspection);
            inspectorStats[inspectorId].totalScore += inspection.totalScore || 0;
            inspectorStats[inspectorId].totalAppaScore += inspection.appaScore || 0;
            inspectorStats[inspectorId].count += 1;
        });

        const leaderboard = Object.values(inspectorStats).map(stat => ({
            inspectorId: stat.inspectorId,
            inspectorName: stat.inspectorName,
            inspectionCount: stat.count,
            averageScore: stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0,
            avgAppaScore: stat.count > 0 ? (stat.totalAppaScore / stat.count).toFixed(1) : 0,
            locationsInspected: [...new Set(stat.inspections.map(i => (i.location?._id || i.location)?.toString()))].length
        })).sort((a, b) => b.inspectionCount - a.inspectionCount);

        const reportData = {
            period: { start, end },
            leaderboard,
            summary: {
                totalInspectors: leaderboard.length,
                totalInspections: inspections.length,
                overallAvgScore: inspections.length > 0
                    ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
                    : 0
            }
        };

        // Generate PDF
        const { generateInspectorLeaderboardPDF } = require('../utils/pdfGenerator');
        const path = require('path');
        const fs = require('fs');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `inspector-leaderboard-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generateInspectorLeaderboardPDF(reportData, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export report' });
    }
};

const exportPrivateInspectionsReport = async (req, res) => {
    try {
        // Get report data
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { 
            createdAt: { $gte: start, $lte: end },
            isPrivate: true
        };

        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('inspector', 'name')
            .populate('location', 'name')
            .populate('template', 'name');

        const inspectorPerformance = {};
        inspections.forEach(inspection => {
            const inspectorId = inspection.inspector?._id || inspection.inspector;
            const inspectorName = inspection.inspector?.name || 'Unknown';
            if (!inspectorPerformance[inspectorId]) {
                inspectorPerformance[inspectorId] = {
                    inspectorId,
                    inspectorName,
                    inspections: [],
                    totalScore: 0,
                    count: 0
                };
            }
            inspectorPerformance[inspectorId].inspections.push(inspection);
            inspectorPerformance[inspectorId].totalScore += inspection.totalScore || 0;
            inspectorPerformance[inspectorId].count += 1;
        });

        const performance = Object.values(inspectorPerformance).map(stat => ({
            inspectorId: stat.inspectorId,
            inspectorName: stat.inspectorName,
            inspectionCount: stat.count,
            averageScore: Math.round(stat.totalScore / stat.count),
            avgAppaScore: (stat.inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / stat.count).toFixed(1)
        })).sort((a, b) => b.averageScore - a.averageScore);

        const reportData = {
            period: { start, end },
            summary: {
                totalPrivateInspections: inspections.length,
                avgScore: inspections.length > 0
                    ? Math.round(inspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / inspections.length)
                    : 0,
                avgAppaScore: inspections.length > 0
                    ? (inspections.reduce((acc, curr) => acc + (curr.appaScore || 0), 0) / inspections.length).toFixed(1)
                    : 0
            },
            inspectorPerformance: performance
        };

        // Generate PDF
        const { generatePrivateInspectionsReportPDF } = require('../utils/pdfGenerator');
        const path = require('path');
        const fs = require('fs');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `private-inspections-report-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generatePrivateInspectionsReportPDF(reportData, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export report' });
    }
};

const exportInspectionFormsReport = async (req, res) => {
    try {
        // Get report data
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        let inspectionQuery = { createdAt: { $gte: start, $lte: end } };

        if (req.user.role === 'supervisor') {
            inspectionQuery.inspector = req.user._id;
        } else if (req.user.role === 'client') {
            const userLocations = await Location.find({ _id: { $in: req.user.assignedLocations } }).select('_id');
            const locationIds = userLocations.map(loc => loc._id);
            inspectionQuery.location = { $in: locationIds };
        }

        const inspections = await Inspection.find(inspectionQuery)
            .populate('template', 'name sections')
            .populate('location', 'name type');

        const templates = await Template.find({});

        const areaTypePerformance = {};
        inspections.forEach(inspection => {
            const areaType = inspection.location?.type || 'unknown';
            if (!areaTypePerformance[areaType]) {
                areaTypePerformance[areaType] = {
                    areaType,
                    inspections: [],
                    totalScore: 0,
                    count: 0,
                    itemPerformance: {}
                };
            }
            areaTypePerformance[areaType].inspections.push(inspection);
            areaTypePerformance[areaType].totalScore += inspection.totalScore || 0;
            areaTypePerformance[areaType].count += 1;

            inspection.sections.forEach(section => {
                section.items.forEach(item => {
                    const itemKey = `${section.name} - ${item.name}`;
                    if (!areaTypePerformance[areaType].itemPerformance[itemKey]) {
                        areaTypePerformance[areaType].itemPerformance[itemKey] = {
                            itemName: itemKey,
                            passCount: 0,
                            failCount: 0,
                            totalScore: 0,
                            count: 0
                        };
                    }
                    if (item.status === 'pass' || (typeof item.score === 'number' && item.score >= 3)) {
                        areaTypePerformance[areaType].itemPerformance[itemKey].passCount += 1;
                    } else {
                        areaTypePerformance[areaType].itemPerformance[itemKey].failCount += 1;
                    }
                    if (typeof item.score === 'number') {
                        areaTypePerformance[areaType].itemPerformance[itemKey].totalScore += item.score;
                    }
                    areaTypePerformance[areaType].itemPerformance[itemKey].count += 1;
                });
            });
        });

        const areaTypeStats = Object.values(areaTypePerformance).map(area => {
            const avgScore = area.count > 0 ? Math.round(area.totalScore / area.count) : 0;
            const items = Object.values(area.itemPerformance);
            const lowestItems = items
                .map(item => ({
                    itemName: item.itemName,
                    failRate: item.count > 0 ? ((item.failCount / item.count) * 100).toFixed(1) : 0,
                    avgScore: item.count > 0 ? (item.totalScore / item.count).toFixed(1) : 0,
                    passCount: item.passCount,
                    failCount: item.failCount,
                    totalCount: item.count
                }))
                .sort((a, b) => parseFloat(b.failRate) - parseFloat(a.failRate))
                .slice(0, 10);

            return {
                areaType: area.areaType,
                inspectionCount: area.count,
                averageScore: avgScore,
                lowestPerformingItems: lowestItems
            };
        }).sort((a, b) => a.averageScore - b.averageScore);

        const templatePerformance = {};
        inspections.forEach(inspection => {
            const templateId = inspection.template?._id || inspection.template;
            const templateName = inspection.template?.name || 'Unknown';
            if (!templatePerformance[templateId]) {
                templatePerformance[templateId] = {
                    templateId,
                    templateName,
                    inspections: [],
                    totalScore: 0,
                    count: 0
                };
            }
            templatePerformance[templateId].inspections.push(inspection);
            templatePerformance[templateId].totalScore += inspection.totalScore || 0;
            templatePerformance[templateId].count += 1;
        });

        const templateStats = Object.values(templatePerformance).map(template => ({
            templateId: template.templateId,
            templateName: template.templateName,
            inspectionCount: template.count,
            averageScore: Math.round(template.totalScore / template.count)
        })).sort((a, b) => a.averageScore - b.averageScore);

        const reportData = {
            period: { start, end },
            areaTypePerformance: areaTypeStats,
            templatePerformance: templateStats
        };

        // Generate PDF
        const { generateInspectionFormsReportPDF } = require('../utils/pdfGenerator');
        const path = require('path');
        const fs = require('fs');

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `inspection-forms-report-${Date.now()}.pdf`;
        const filepath = path.join(reportsDir, filename);

        await generateInspectionFormsReportPDF(reportData, filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, (unlinkErr) => {
                if (unlinkErr) console.error('File deletion error:', unlinkErr);
            });
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export report' });
    }
};

module.exports = {
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
};
