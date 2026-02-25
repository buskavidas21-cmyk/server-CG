const mongoose = require('mongoose');

const inspectionItemSchema = mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    score: { type: mongoose.Schema.Types.Mixed }, // boolean or number
    comment: { type: String },
    photos: [{ type: String }], // URLs
    status: { type: String, enum: ['pass', 'fail'], default: 'pass' },
});

const inspectionSubsectionSchema = mongoose.Schema({
    subsectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    parentItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
    parentItemIndex: { type: Number, default: null },
    items: [inspectionItemSchema],
});

const inspectionSectionPromptSchema = mongoose.Schema({
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Add comment...' },
    value: { type: String, default: '' },
});

const inspectionSectionSchema = mongoose.Schema({
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    items: [inspectionItemSchema],
    subsections: [inspectionSubsectionSchema],
    sectionPrompt: { type: inspectionSectionPromptSchema, default: undefined },
    sectionScore: { type: Number },
});

const inspectionSchema = mongoose.Schema(
    {
        template: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Template',
            required: true,
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: true,
        },
        inspector: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: { type: Date, default: Date.now },
        sections: [inspectionSectionSchema],
        totalScore: { type: Number },
        appaScore: { type: Number },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'submitted', 'pending'],
            default: 'in_progress',
        },
        summaryComment: { type: String },
        scheduledDate: { type: Date },
        isDeficient: { type: Boolean, default: false }, // Score below threshold
        isFlagged: { type: Boolean, default: false }, // Has issues or tickets
        isPrivate: { type: Boolean, default: false }, // Private/internal inspection
    },
    {
        timestamps: true,
    }
);

const Inspection = mongoose.model('Inspection', inspectionSchema);

module.exports = Inspection;
