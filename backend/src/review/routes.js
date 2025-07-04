const express = require('express');
const router = express.Router();
const reviewController = require('./controller');
const { authenticateUser, authorizeRoles, ensureOwnership } = require('../auth');

/**
 * @route POST /api/reviews
 * @desc Create a new review for an appointment
 * @access Private (Clients only)
 */
router.post(
    '/',
    authenticateUser,
    authorizeRoles(['client', 'admin']),
    reviewController.createReview
);

/**
 * @route GET /api/reviews/appointment/:appointmentId
 * @desc Get review for a specific appointment
 * @access Private (Client, Advisor, or Admin)
 */
router.get(
    '/appointment/:appointmentId',
    authenticateUser,
    reviewController.getReviewByAppointment
);

/**
 * @route GET /api/reviews/advisor/:advisorId
 * @desc Get all reviews for an advisor
 * @access Public
 */
router.get(
    '/advisor/:advisorId',
    reviewController.getAdvisorReviews
);

/**
 * @route GET /api/reviews/advisor/:advisorId/stats
 * @desc Get review statistics for an advisor
 * @access Public
 */
router.get(
    '/advisor/:advisorId/stats',
    reviewController.getAdvisorReviewStats
);

/**
 * @route GET /api/reviews/client/:clientId
 * @desc Get all reviews written by a client
 * @access Private (Client must be owner or Admin)
 */
router.get(
    '/client/:clientId',
    authenticateUser,
    authorizeRoles(['client', 'admin']),
    ensureOwnership('clientId'),
    reviewController.getClientReviews
);

/**
 * @route PATCH /api/reviews/:id
 * @desc Update a review (only within 24 hours and before advisor response)
 * @access Private (Client who wrote the review or Admin)
 */
router.patch(
    '/:id',
    authenticateUser,
    reviewController.updateReview
);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review (only if no advisor response exists)
 * @access Private (Client who wrote the review or Admin)
 */
router.delete(
    '/:id',
    authenticateUser,
    reviewController.deleteReview
);

/**
 * @route POST /api/reviews/:id/response
 * @desc Add advisor response to a review
 * @access Private (Advisor who received the review or Admin)
 */
router.post(
    '/:id/response',
    authenticateUser,
    authorizeRoles(['advisor', 'admin']),
    reviewController.addAdvisorResponse
);

/**
 * @route PATCH /api/reviews/:id/response
 * @desc Update advisor response to a review
 * @access Private (Advisor who received the review or Admin)
 */
router.patch(
    '/:id/response',
    authenticateUser,
    authorizeRoles(['advisor', 'admin']),
    reviewController.updateAdvisorResponse
);

/**
 * @route DELETE /api/reviews/:id/response
 * @desc Delete advisor response to a review
 * @access Private (Advisor who received the review or Admin)
 */
router.delete(
    '/:id/response',
    authenticateUser,
    authorizeRoles(['advisor', 'admin']),
    reviewController.deleteAdvisorResponse
);

/**
 * @route GET /api/reviews/recent
 * @desc Get recent approved reviews across all advisors
 * @access Public
 */
router.get(
    '/recent',
    reviewController.getRecentReviews
);

/**
 * @route PATCH /api/reviews/:id/approve
 * @desc Approve or reject a review (Admin only)
 * @access Private (Admin only)
 */
router.patch(
    '/:id/approve',
    authenticateUser,
    authorizeRoles(['admin']),
    reviewController.moderateReview
);

/**
 * @route GET /api/reviews/pending
 * @desc Get pending reviews for moderation
 * @access Private (Admin only)
 */
router.get(
    '/pending',
    authenticateUser,
    authorizeRoles(['admin']),
    reviewController.getPendingReviews
);

module.exports = router;