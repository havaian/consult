const express = require('express');
const router = express.Router();
const ConsultationController = require('./controller');
const { authenticateUser, ensureAppointmentAccess } = require('../auth');

// Initialize controller
const consultationController = new ConsultationController();

/**
 * @route GET /api/consultations/:appointmentId/join
 * @desc Join a consultation session
 * @access Private (Client or Advisor involved in appointment)
 */
router.get(
    '/:appointmentId/join',
    authenticateUser,
    (req, res, next) => {
        // Log the appointment ID to help debug
        console.log(`Consultation join attempt for appointment: ${req.params.appointmentId}`);
        next();
    },
    consultationController.joinConsultation
);

/**
 * @route POST /api/consultations/:appointmentId/end
 * @desc End a consultation
 * @access Private (Advisors only)
 */
router.post(
    '/:appointmentId/end',
    authenticateUser,
    consultationController.endConsultation
);

/**
 * @route POST /api/consultations/:appointmentId/advices
 * @desc Add advices to a completed appointment
 * @access Private (Advisors only)
 */
router.post(
    '/:appointmentId/advices',
    authenticateUser,
    consultationController.addAdvices
);

/**
 * @route POST /api/consultations/:appointmentId/follow-up
 * @desc Create a follow-up appointment
 * @access Private (Advisors only)
 */
router.post(
    '/:appointmentId/follow-up',
    authenticateUser,
    consultationController.createFollowUp
);

/**
 * @route GET /api/consultations/:appointmentId/status
 * @desc Get consultation status
 * @access Private (Client or Advisor involved in appointment)
 */
router.get(
    '/:appointmentId/status',
    authenticateUser,
    consultationController.getConsultationStatus
);

/**
 * @route POST /api/consultations/:appointmentId/chat-log
 * @desc Save chat log from consultation
 * @access Private (Client or Advisor involved in appointment)
 */
router.post(
    '/:appointmentId/chat-log',
    authenticateUser,
    consultationController.saveChatLog
);

/**
 * @route POST /api/consultations/:appointmentId/exit
 * @desc Handle exit from consultation room
 * @access Private (Client or Advisor involved in appointment)
 */
router.post(
    '/:appointmentId/exit',
    authenticateUser,
    consultationController.handleRoomExit
);

module.exports = router;