const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate, getTemplateById, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { protect, adminOrSubAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTemplates).post(protect, adminOrSubAdmin, createTemplate);
router.route('/:id')
    .get(protect, getTemplateById)
    .put(protect, adminOrSubAdmin, updateTemplate)
    .delete(protect, adminOrSubAdmin, deleteTemplate);

module.exports = router;
