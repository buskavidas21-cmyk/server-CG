const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        category: {
            type: String,
            enum: ['Cleaning', 'Maintenance', 'Safety', 'Other'],
            default: 'Cleaning',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'verified'],
            default: 'open',
        },
        category: { type: String },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
        },
        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inspection',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        photos: [{ type: String }],
        dueDate: { type: Date },
        scheduledDate: { type: Date },
        firstResponseAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
