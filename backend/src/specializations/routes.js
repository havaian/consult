const express = require('express');
const router = express.Router();
const specializationController = require('./controller');

/**
 * @route GET /api/specializations
 * @desc Get all active specializations
 * @access Public
 */
router.get('/', specializationController.getActiveSpecializations);

/**
 * @route GET /api/specializations/:id
 * @desc Get specializations by ID
 * @access Public
 */
router.get('/:id', specializationController.getSpecializationById);

/**
 * @route GET /api/specializations/:id/advisors
 * @desc Get advisors by specializations
 * @access Public
 */
router.get('/:id/advisors', specializationController.getAdvisorsBySpecialization);

module.exports = router;