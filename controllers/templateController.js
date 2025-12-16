const Template = require('../models/templateModel');

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getTemplates = async (req, res) => {
    const templates = await Template.find({});
    res.json(templates);
};

// @desc    Create a template
// @route   POST /api/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
    const { name, description, sections } = req.body;

    const template = new Template({
        name,
        description,
        sections,
        createdBy: req.user._id,
    });

    const createdTemplate = await template.save();
    res.status(201).json(createdTemplate);
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (template) {
        res.json(template);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
};

// @desc    Update a template
// @route   PUT /api/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
    const template = await Template.findById(req.params.id);
    if (template) {
        Object.assign(template, req.body);
        const updatedTemplate = await template.save();
        res.json(updatedTemplate);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
};

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
    const template = await Template.findById(req.params.id);
    if (template) {
        await template.deleteOne();
        res.json({ message: 'Template removed' });
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
};

module.exports = { getTemplates, createTemplate, getTemplateById, updateTemplate, deleteTemplate };
