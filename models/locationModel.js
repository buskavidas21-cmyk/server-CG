const mongoose = require('mongoose');

const locationSchema = mongoose.Schema(
    {
        name: { type: String, required: true }, // e.g., "ABC Plaza"
        type: {
            type: String,
            enum: ['client', 'building', 'floor', 'area', 'office', 'retail', 'warehouse', 'restroom', 'healthcare'],
            required: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            default: null,
        },
        address: { type: String },
        clientContact: { type: String },
    },
    {
        timestamps: true,
    }
);

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
