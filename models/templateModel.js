const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['pass_fail', 'rating_1_5', 'yes_no'],
        default: 'pass_fail',
    },
    weight: { type: Number, default: 1 },
});

const sectionSchema = mongoose.Schema({
    name: { type: String, required: true },
    items: [itemSchema],
});

const templateSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        sections: [sectionSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;
