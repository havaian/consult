const express = require('express');
const router = express.Router();
const appointmentController = require('./controller');
const { authenticateUser, authorizeRoles, ensureOwnership } = require('../auth');
// Import multer configuration for file uploads
const upload = require('../utils/multerConfig');

/**
 * @route POST /api/appointments
 * @desc Create a new appointment
 * @access Private (Clients only - uses authenticated user ID)
 */
router.post(
    '/',
    authenticateUser,
    authorizeRoles(['client', 'admin']),
    appointmentController.createAppointment
);

/**
 * @route GET /api/appointments/client/:clientId
 * @desc Get all appointments for a client
 * @access Private (Client must be the owner or Admin)
 */
router.get(
    '/client/:clientId',
    authenticateUser,
    authorizeRoles(['client', 'admin']),
    ensureOwnership('clientId'),
    appointmentController.getClientAppointments
);

/**
 * @route GET /api/appointments/client/:clientId/pending-followups
 * @desc Get pending follow-up appointments for a client
 * @access Private (Client must be the owner or Admin)
 */
router.get(
    '/client/:clientId/pending-followups',
    authenticateUser,
    authorizeRoles(['client', 'admin']),
    ensureOwnership('clientId'),
    appointmentController.getPendingFollowUps
);

/**
 * @route GET /api/appointments/advisor/:advisorId
 * @desc Get all appointments for a advisor
 * @access Private (Advisor must be the owner or Admin)
 */
router.get(
    '/advisor/:advisorId',
    authenticateUser,
    authorizeRoles(['advisor', 'admin']),
    ensureOwnership('advisorId'),
    appointmentController.getAdvisorAppointments
);

/**
 * @route GET /api/appointments/calendar
 * @desc Get appointments in calendar format
 * @access Private
 */
router.get(
    '/calendar',
    authenticateUser,
    appointmentController.getCalendarAppointments
);

/**
 * @route GET /api/appointments/:id
 * @desc Get a specific appointment by ID
 * @access Private (Only involved parties or Admin)
 */
router.get(
    '/:id',
    authenticateUser,
    appointmentController.getAppointmentById
);

/**
 * @route PATCH /api/appointments/:id/status
 * @desc Update appointment status
 * @access Private (Advisor, Client or Admin - only for their own appointments)
 */
router.patch(
    '/:id/status',
    authenticateUser,
    appointmentController.updateAppointmentStatus
);

/**
 * @route POST /api/appointments/:id/confirm
 * @desc Advisor confirms appointment
 * @access Private (Advisors only - only for their appointments)
 */
router.post(
    '/:id/confirm',
    authenticateUser,
    authorizeRoles(['advisor']),
    appointmentController.confirmAppointment
);

/**
 * @route PATCH /api/appointments/:id/advices
 * @desc Add/update advices for an appointment
 * @access Private (Advisors only - only for their appointments)
 */
router.patch(
    '/:id/advices',
    authenticateUser,
    authorizeRoles(['advisor']),
    appointmentController.updateAdvices
);

/**
 * @route POST /api/appointments/:id/documents
 * @desc Upload legal documents for an appointment
 * @access Private (Clients and Advisors - only for their appointments)
 */
router.post(
    '/:id/documents',
    authenticateUser,
    appointmentController.uploadDocument
);

/**
 * @route GET /api/appointments/:id/documents
 * @desc Get documents for an appointment
 * @access Private (Only involved parties or Admin)
 */
router.get(
    '/:id/documents',
    authenticateUser,
    appointmentController.getDocuments
);

/**
 * @route POST /api/appointments/:id/follow-up
 * @desc Schedule a follow-up appointment
 * @access Private (Advisors only - only for their appointments)
 */
router.post(
    '/:id/follow-up',
    authenticateUser,
    authorizeRoles(['advisor']),
    appointmentController.scheduleFollowUp
);

/**
 * @route GET /api/appointments/availability/:advisorId
 * @desc Get advisor's availability slots
 * @access Public (no authentication needed for viewing availability)
 */
router.get(
    '/availability/:advisorId',
    appointmentController.getAdvisorAvailability
);

/**
 * @route GET /api/appointments/pending-confirmation/advisor/:advisorId
 * @desc Get appointments pending advisor confirmation
 * @access Private (Advisor must be the owner or Admin)
 */
router.get(
    '/pending-confirmation/advisor/:advisorId',
    authenticateUser,
    authorizeRoles(['advisor', 'admin']),
    ensureOwnership('advisorId'),
    appointmentController.getPendingConfirmations
);

/**
 * @route PATCH /api/appointments/:id/consultation-results
 * @desc Update consultation results (summary, advices, follow-up)
 * @access Private (Advisors only - only for their appointments)
 */
router.patch(
    '/:id/consultation-results',
    authenticateUser,
    authorizeRoles(['advisor']),
    appointmentController.updateConsultationResults
);

/**
 * @route POST /api/appointments/:id/documents
 * @desc Upload legal documents for an appointment
 * @access Private (Clients and Advisors - only for their appointments)
 */
router.post(
    '/:id/documents',
    authenticateUser,
    upload.single('document'), // Use multer middleware for file upload
    appointmentController.uploadDocument
);

/**
 * @route GET /api/appointments/:id/documents
 * @desc Get documents for an appointment
 * @access Private (Only involved parties or Admin)
 */
router.get(
    '/:id/documents',
    authenticateUser,
    appointmentController.getDocuments
);

/**
 * @route GET /api/appointments/calendar
 * @desc Get appointments in calendar format
 * @access Private
 */
router.get(
    '/calendar',
    authenticateUser,
    appointmentController.getCalendarAppointments
);

module.exports = router;