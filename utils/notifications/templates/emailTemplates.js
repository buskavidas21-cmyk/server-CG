/**
 * Email Templates
 * 
 * HTML email templates for all notification events.
 * Each template function receives data and returns { subject, html }.
 */

// ─── Base Layout ────────────────────────────────────────────────────
const baseLayout = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 32px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; max-width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 28px 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                                🛡️ CleanGuard QC
                            </h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px;">
                            ${bodyContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                This is an automated notification from CleanGuard QC.<br>
                                Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// ─── Helper: Badge ──────────────────────────────────────────────────
const badge = (text, color) => `
    <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #fff; background-color: ${color};">
        ${text}
    </span>`;

const priorityColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
};

const statusColors = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    resolved: '#22c55e',
    verified: '#8b5cf6',
    pending: '#f59e0b',
    completed: '#22c55e',
    submitted: '#8b5cf6',
};

// ─── Helper: Info Row ───────────────────────────────────────────────
const infoRow = (label, value) => `
    <tr>
        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 140px; vertical-align: top;">${label}:</td>
        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${value}</td>
    </tr>`;


// ═══════════════════════════════════════════════════════════════════
//  TICKET TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const ticketCreated = (data) => {
    const { ticket, createdByName } = data;
    const subject = `New Ticket: ${ticket.title}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">New Ticket Created</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">A new ticket has been created and requires attention.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Description', ticket.description || 'N/A')}
                    ${infoRow('Category', ticket.category || 'N/A')}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Created By', createdByName || 'N/A')}
                    ${ticket.dueDate ? infoRow('Due Date', new Date(ticket.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) : ''}
                    ${ticket.assignedToName ? infoRow('Assigned To', ticket.assignedToName) : ''}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Log in to CleanGuard QC to view and manage this ticket.</p>
    `);
    return { subject, html };
};

const ticketAssigned = (data) => {
    const { ticket, assignedToName, assignedByName } = data;
    const subject = `Ticket Assigned: ${ticket.title}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📋 Ticket Assigned to You</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">You have been assigned a new ticket by <strong>${assignedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Description', ticket.description || 'N/A')}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Category', ticket.category || 'N/A')}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${ticket.dueDate ? infoRow('Due Date', new Date(ticket.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) : ''}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please log in to CleanGuard QC to review and work on this ticket.</p>
    `);
    return { subject, html };
};

const ticketScheduled = (data) => {
    const { ticket, scheduledDate } = data;
    const subject = `Ticket Scheduled: ${ticket.title}`;
    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📅 Ticket Scheduled</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">A ticket assigned to you has been scheduled.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Scheduled For', `<strong style="color: #3b82f6;">${formattedDate}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please make sure to complete this ticket by the scheduled date.</p>
    `);
    return { subject, html };
};

const ticketStatusChanged = (data) => {
    const { ticket, oldStatus, newStatus, changedByName } = data;
    const subject = `Ticket Update: ${ticket.title} — ${newStatus.replace('_', ' ').toUpperCase()}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🔄 Ticket Status Updated</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">The status of a ticket has been updated by <strong>${changedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Previous Status', badge(oldStatus?.replace('_', ' ').toUpperCase(), statusColors[oldStatus] || '#6b7280'))}
                    ${infoRow('New Status', badge(newStatus?.replace('_', ' ').toUpperCase(), statusColors[newStatus] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                </table>
            </td></tr>
        </table>
    `);
    return { subject, html };
};

const ticketResolved = (data) => {
    const { ticket, resolvedByName, resolutionNotes } = data;
    const subject = `✅ Ticket Resolved: ${ticket.title}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">✅ Ticket Resolved</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">A ticket has been resolved by <strong>${resolvedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Status', badge('RESOLVED', '#22c55e'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Resolved By', resolvedByName)}
                    ${resolutionNotes ? infoRow('Resolution Notes', resolutionNotes) : ''}
                </table>
            </td></tr>
        </table>
    `);
    return { subject, html };
};

const ticketUrgent = (data) => {
    const { ticket, createdByName } = data;
    const subject = `🚨 URGENT Ticket: ${ticket.title}`;
    const html = baseLayout(subject, `
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #dc2626; font-size: 20px;">🚨 URGENT TICKET</h2>
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">Immediate action required!</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong style="color: #dc2626;">${ticket.title}</strong>`)}
                    ${infoRow('Description', ticket.description || 'N/A')}
                    ${infoRow('Priority', badge('URGENT', '#ef4444'))}
                    ${infoRow('Category', ticket.category || 'N/A')}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Created By', createdByName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">Please address this ticket immediately.</p>
    `);
    return { subject, html };
};


const ticketReopened = (data) => {
    const { ticket, reopenedByName } = data;
    const subject = `🔁 Ticket Reopened: ${ticket.title}`;
    const html = baseLayout(subject, `
        <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #c2410c; font-size: 20px;">🔁 Ticket Reopened</h2>
            <p style="margin: 0; color: #9a3412; font-size: 14px;">This ticket requires further attention</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Reopened By', reopenedByName || 'N/A')}
                    ${infoRow('Status', badge('OPEN', statusColors.open))}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please review and take action on this ticket.</p>
    `);
    return { subject, html };
};

const ticketPriorityEscalated = (data) => {
    const { ticket, oldPriority, newPriority, escalatedByName } = data;
    const subject = `🚨 Priority Escalated: ${ticket.title} → ${newPriority.toUpperCase()}`;
    const html = baseLayout(subject, `
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #dc2626; font-size: 20px;">🚨 Priority Escalated</h2>
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">A ticket's priority has been raised</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Previous Priority', badge(oldPriority?.toUpperCase(), priorityColors[oldPriority] || '#6b7280'))}
                    ${infoRow('New Priority', badge(newPriority?.toUpperCase(), priorityColors[newPriority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Escalated By', escalatedByName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">Please address this ticket with the updated priority.</p>
    `);
    return { subject, html };
};

const ticketReassigned = (data) => {
    const { ticket, assignedToName, reassignedByName, previousAssigneeName } = data;
    const subject = `Ticket Reassigned: ${ticket.title}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🔄 Ticket Reassigned</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">A ticket has been reassigned by <strong>${reassignedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${previousAssigneeName ? infoRow('Previously Assigned', previousAssigneeName) : ''}
                    ${infoRow('Now Assigned To', `<strong>${assignedToName}</strong>`)}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please log in to CleanGuard QC to review this ticket.</p>
    `);
    return { subject, html };
};

const ticketVerified = (data) => {
    const { ticket, verifiedByName } = data;
    const subject = `✅ Ticket Verified: ${ticket.title}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">✅ Ticket Verified & Closed</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">A resolved ticket has been verified by <strong>${verifiedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Status', badge('VERIFIED', '#8b5cf6'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Verified By', verifiedByName)}
                </table>
            </td></tr>
        </table>
    `);
    return { subject, html };
};


// ═══════════════════════════════════════════════════════════════════
//  INSPECTION TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const inspectionAssigned = (data) => {
    const { inspection, assignedByName } = data;
    const subject = `Inspection Assigned: ${inspection.locationName}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🔍 Inspection Assigned to You</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">You have been assigned a new inspection by <strong>${assignedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${infoRow('Status', badge('PENDING', '#f59e0b'))}
                    ${inspection.scheduledDate ? infoRow('Scheduled', new Date(inspection.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) : ''}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please log in to CleanGuard QC to start this inspection.</p>
    `);
    return { subject, html };
};

const inspectionScheduled = (data) => {
    const { inspection, scheduledDate } = data;
    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const subject = `Inspection Scheduled: ${inspection.locationName}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📅 Inspection Scheduled</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">An inspection assigned to you has been scheduled.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Scheduled For', `<strong style="color: #3b82f6;">${formattedDate}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please complete this inspection by the scheduled date.</p>
    `);
    return { subject, html };
};

const inspectionCompleted = (data) => {
    const { inspection, inspectorName } = data;
    const scoreColor = inspection.totalScore >= 90 ? '#22c55e' : inspection.totalScore >= 75 ? '#f59e0b' : '#ef4444';
    const subject = `Inspection Completed: ${inspection.locationName} — Score: ${inspection.totalScore}%`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📝 Inspection Completed</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">An inspection has been completed by <strong>${inspectorName}</strong>.</p>
        
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: ${scoreColor}15; border: 2px solid ${scoreColor}; border-radius: 12px; padding: 16px 32px;">
                <span style="font-size: 36px; font-weight: 700; color: ${scoreColor};">${inspection.totalScore}%</span>
                <br><span style="font-size: 13px; color: #64748b;">APPA Level ${inspection.appaScore || 'N/A'}</span>
            </div>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Inspector', inspectorName)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${infoRow('Score', `<strong style="color: ${scoreColor};">${inspection.totalScore}%</strong>`)}
                    ${inspection.summaryComment ? infoRow('Summary', inspection.summaryComment) : ''}
                </table>
            </td></tr>
        </table>
    `);
    return { subject, html };
};

const inspectionDeficient = (data) => {
    const { inspection, inspectorName } = data;
    const subject = `⚠️ DEFICIENT Inspection: ${inspection.locationName} — Score: ${inspection.totalScore}%`;
    const html = baseLayout(subject, `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #b45309; font-size: 20px;">⚠️ DEFICIENT INSPECTION</h2>
            <p style="margin: 0; color: #92400e; font-size: 14px;">Score is below the acceptable threshold</p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 16px 32px;">
                <span style="font-size: 36px; font-weight: 700; color: #ef4444;">${inspection.totalScore}%</span>
                <br><span style="font-size: 13px; color: #64748b;">APPA Level ${inspection.appaScore || 'N/A'}</span>
            </div>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong style="color: #dc2626;">${inspection.locationName}</strong>`)}
                    ${infoRow('Inspector', inspectorName)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${inspection.summaryComment ? infoRow('Summary', inspection.summaryComment) : ''}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #b91c1c; font-size: 14px; font-weight: 600;">Please review this inspection and take corrective action.</p>
    `);
    return { subject, html };
};


const inspectionReassigned = (data) => {
    const { inspection, reassignedByName, previousInspectorName } = data;
    const subject = `Inspection Reassigned: ${inspection.locationName}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🔄 Inspection Reassigned</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">An inspection has been reassigned by <strong>${reassignedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${previousInspectorName ? infoRow('Previously Assigned', previousInspectorName) : ''}
                    ${infoRow('Status', badge('PENDING', '#f59e0b'))}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please log in to CleanGuard QC to start this inspection.</p>
    `);
    return { subject, html };
};

const inspectionDeleted = (data) => {
    const { inspection, deletedByName } = data;
    const subject = `Inspection Deleted: ${inspection.locationName}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🗑️ Inspection Deleted</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">An inspection has been deleted by <strong>${deletedByName}</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${inspection.totalScore !== undefined ? infoRow('Score', `${inspection.totalScore}%`) : ''}
                    ${infoRow('Deleted By', deletedByName)}
                </table>
            </td></tr>
        </table>
    `);
    return { subject, html };
};


// ═══════════════════════════════════════════════════════════════════
//  USER TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const userWelcome = (data) => {
    const { name, email, role, tempPassword } = data;
    const subject = `Welcome to CleanGuard QC`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">👋 Welcome to CleanGuard QC!</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Your account has been created. Here are your login details:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Name', `<strong>${name}</strong>`)}
                    ${infoRow('Email', email)}
                    ${infoRow('Role', badge(role?.replace('_', ' ').toUpperCase(), '#3b82f6'))}
                    ${tempPassword ? infoRow('Temporary Password', `<code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code>`) : ''}
                </table>
            </td></tr>
        </table>
        <p style="margin: 0; color: #64748b; font-size: 13px;">Log in to CleanGuard QC to get started.</p>
    `);
    return { subject, html };
};

const userUpdated = (data) => {
    const { name, changes } = data;
    const subject = `Account Updated — CleanGuard QC`;
    const changesList = Object.entries(changes)
        .map(([key, value]) => `<li style="padding: 4px 0;"><strong>${key}:</strong> ${value}</li>`)
        .join('');
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">🔄 Account Updated</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Hi <strong>${name}</strong>, your account has been updated:</p>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <ul style="margin: 0; padding: 0 0 0 20px; color: #1e293b; font-size: 14px;">
                ${changesList}
            </ul>
        </div>

        <p style="margin: 0; color: #64748b; font-size: 13px;">If you did not request these changes, please contact your administrator.</p>
    `);
    return { subject, html };
};


// ═══════════════════════════════════════════════════════════════════
//  BULK TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const bulkTicketsCreated = (data) => {
    const { count, locationName, inspectionId, items } = data;
    const itemList = (items || [])
        .slice(0, 10)
        .map(item => `<li style="padding: 2px 0;">${item}</li>`)
        .join('');
    const subject = `${count} Tickets Created from Inspection at ${locationName}`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📋 Bulk Tickets Created</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;"><strong>${count}</strong> tickets were created from a failed inspection.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${locationName}</strong>`)}
                    ${infoRow('Tickets Created', `<strong>${count}</strong>`)}
                </table>
            </td></tr>
        </table>

        ${itemList ? `
        <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e293b; font-size: 14px;">Failed Items:</p>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #64748b; font-size: 13px;">
                ${itemList}
                ${(items || []).length > 10 ? '<li>... and more</li>' : ''}
            </ul>
        </div>` : ''}
    `);
    return { subject, html };
};


// ═══════════════════════════════════════════════════════════════════
//  REMINDER & OVERDUE TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const ticketReminderTomorrow = (data) => {
    const { ticket } = data;
    const schedDate = new Date(ticket.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const subject = `📅 Reminder: Ticket "${ticket.title}" — Tomorrow`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📅 Ticket Reminder — Tomorrow</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">You have a ticket scheduled for <strong>tomorrow</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Scheduled For', `<strong style="color: #2563eb;">${schedDate}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please prepare for this task so you can start on time.</p>
    `);
    return { subject, html };
};

const ticketReminderToday = (data) => {
    const { ticket } = data;
    const subject = `🔔 Today: Ticket "${ticket.title}" — Work Starts Today`;
    const html = baseLayout(subject, `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #b45309; font-size: 20px;">🔔 Work Starts Today!</h2>
            <p style="margin: 0; color: #92400e; font-size: 14px;">You have a ticket scheduled for today</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong>${ticket.title}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Status', badge(ticket.status?.replace('_', ' ').toUpperCase(), statusColors[ticket.status] || '#6b7280'))}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #b45309; font-size: 14px; font-weight: 600;">Please start working on this ticket today.</p>
    `);
    return { subject, html };
};

const ticketOverdue = (data) => {
    const { ticket, daysOverdue } = data;
    const dueDate = new Date(ticket.dueDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const subject = `🚨 OVERDUE: Ticket "${ticket.title}" — ${daysOverdue} day(s) overdue`;
    const html = baseLayout(subject, `
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #dc2626; font-size: 20px;">🚨 TICKET OVERDUE</h2>
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">${daysOverdue} day(s) past the due date</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Title', `<strong style="color: #dc2626;">${ticket.title}</strong>`)}
                    ${infoRow('Due Date', `<strong style="color: #dc2626;">${dueDate}</strong>`)}
                    ${infoRow('Days Overdue', `<strong style="color: #dc2626;">${daysOverdue}</strong>`)}
                    ${infoRow('Priority', badge(ticket.priority?.toUpperCase(), priorityColors[ticket.priority] || '#6b7280'))}
                    ${infoRow('Location', ticket.locationName || 'N/A')}
                    ${infoRow('Status', badge(ticket.status?.replace('_', ' ').toUpperCase(), statusColors[ticket.status] || '#6b7280'))}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">Please address this overdue ticket immediately.</p>
    `);
    return { subject, html };
};

const inspectionReminderTomorrow = (data) => {
    const { inspection } = data;
    const schedDate = new Date(inspection.scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const subject = `📅 Reminder: Inspection at ${inspection.locationName} — Tomorrow`;
    const html = baseLayout(subject, `
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">📅 Inspection Reminder — Tomorrow</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">You have an inspection scheduled for <strong>tomorrow</strong>.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Scheduled For', `<strong style="color: #2563eb;">${schedDate}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #64748b; font-size: 13px;">Please prepare for this inspection so you can start on time.</p>
    `);
    return { subject, html };
};

const inspectionReminderToday = (data) => {
    const { inspection } = data;
    const subject = `🔔 Today: Inspection at ${inspection.locationName} — Work Starts Today`;
    const html = baseLayout(subject, `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px 0; color: #b45309; font-size: 20px;">🔔 Inspection Today!</h2>
            <p style="margin: 0; color: #92400e; font-size: 14px;">You have an inspection scheduled for today</p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${infoRow('Location', `<strong>${inspection.locationName}</strong>`)}
                    ${infoRow('Template', inspection.templateName || 'N/A')}
                    ${infoRow('Status', badge(inspection.status?.toUpperCase(), statusColors[inspection.status] || '#6b7280'))}
                </table>
            </td></tr>
        </table>

        <p style="margin: 0; color: #b45309; font-size: 14px; font-weight: 600;">Please complete this inspection today.</p>
    `);
    return { subject, html };
};


// ═══════════════════════════════════════════════════════════════════
//  TEMPLATE MAP — Maps event keys to template functions
// ═══════════════════════════════════════════════════════════════════

const TEMPLATES = {
    TICKET_CREATED: ticketCreated,
    TICKET_ASSIGNED: ticketAssigned,
    TICKET_SCHEDULED: ticketScheduled,
    TICKET_STATUS_CHANGED: ticketStatusChanged,
    TICKET_RESOLVED: ticketResolved,
    TICKET_URGENT: ticketUrgent,
    TICKET_REOPENED: ticketReopened,
    TICKET_PRIORITY_ESCALATED: ticketPriorityEscalated,
    TICKET_REASSIGNED: ticketReassigned,
    TICKET_VERIFIED: ticketVerified,
    INSPECTION_ASSIGNED: inspectionAssigned,
    INSPECTION_SCHEDULED: inspectionScheduled,
    INSPECTION_COMPLETED: inspectionCompleted,
    INSPECTION_DEFICIENT: inspectionDeficient,
    INSPECTION_REASSIGNED: inspectionReassigned,
    INSPECTION_DELETED: inspectionDeleted,
    USER_WELCOME: userWelcome,
    USER_UPDATED: userUpdated,
    BULK_TICKETS_CREATED: bulkTicketsCreated,
    TICKET_REMINDER_TOMORROW: ticketReminderTomorrow,
    TICKET_REMINDER_TODAY: ticketReminderToday,
    TICKET_OVERDUE: ticketOverdue,
    INSPECTION_REMINDER_TOMORROW: inspectionReminderTomorrow,
    INSPECTION_REMINDER_TODAY: inspectionReminderToday,
};

module.exports = TEMPLATES;
