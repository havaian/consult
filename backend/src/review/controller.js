const Review = require('./model');
const Appointment = require('../appointment/model');
const User = require('../user/model');
const { validateReviewInput } = require('../utils/validators');

/**
 * Create a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createReview = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { appointmentId, rating, comment, communicationRating, professionalismRating, satisfactionRating } = req.body;

        // Validate input
        const { error } = validateReviewInput(req.body);
        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        // Check if appointment exists and is completed
        const appointment = await Appointment.findById(appointmentId)
            .populate('advisor', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify the client is the owner of the appointment
        if (appointment.client._id.toString() !== clientId.toString()) {
            return res.status(403).json({ message: 'You can only review your own appointments' });
        }

        // Verify appointment is completed
        if (appointment.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed appointments' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            client: clientId,
            appointment: appointmentId
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this appointment' });
        }

        // Create new review
        const review = new Review({
            client: clientId,
            advisor: appointment.advisor._id,
            appointment: appointmentId,
            rating,
            comment,
            communicationRating,
            professionalismRating,
            satisfactionRating
        });

        await review.save();

        // Populate client data for response
        await review.populate('client', 'firstName lastName profilePicture');

        res.status(201).json({
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this appointment' });
        }
        res.status(500).json({ message: 'An error occurred while creating the review' });
    }
};

/**
 * Get review for a specific appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getReviewByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        // Check if user has access to this appointment
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify user is involved in the appointment
        const isClient = appointment.client.toString() === userId;
        const isAdvisor = appointment.advisor.toString() === userId;

        if (!isClient && !isAdvisor && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this review' });
        }

        const review = await Review.findOne({ appointment: appointmentId })
            .populate('client', 'firstName lastName profilePicture')
            .populate('advisor', 'firstName lastName profilePicture');

        if (!review) {
            return res.status(404).json({ message: 'Review not found for this appointment' });
        }

        res.status(200).json({ review });
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ message: 'An error occurred while fetching the review' });
    }
};

/**
 * Get all reviews for an advisor with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdvisorReviews = async (req, res) => {
    try {
        const { advisorId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        // Verify advisor exists
        const advisor = await User.findById(advisorId);
        if (!advisor || advisor.role !== 'advisor') {
            return res.status(404).json({ message: 'Advisor not found' });
        }

        // Build query
        const query = {
            advisor: advisorId,
            isApproved: true
        };

        // Determine sort order
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'rating-high') {
            sortOption = { rating: -1, createdAt: -1 };
        } else if (sort === 'rating-low') {
            sortOption = { rating: 1, createdAt: -1 };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch reviews
        const reviews = await Review.find(query)
            .populate('client', 'firstName lastName profilePicture')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Review.countDocuments(query);

        res.status(200).json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching advisor reviews:', error);
        res.status(500).json({ message: 'An error occurred while fetching reviews' });
    }
};

/**
 * Get advisor review statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdvisorReviewStats = async (req, res) => {
    try {
        const { advisorId } = req.params;

        // Verify advisor exists
        const advisor = await User.findById(advisorId);
        if (!advisor || advisor.role !== 'advisor') {
            return res.status(404).json({ message: 'Advisor not found' });
        }

        // Get review statistics
        const stats = await Review.getAdvisorRating(advisorId);

        // Get recent reviews
        const recentReviews = await Review.getRecentReviews(advisorId, 3);

        res.status(200).json({
            stats,
            recentReviews
        });
    } catch (error) {
        console.error('Error fetching advisor review stats:', error);
        res.status(500).json({ message: 'An error occurred while fetching review statistics' });
    }
};

/**
 * Get all reviews written by a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClientReviews = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch client reviews
        const reviews = await Review.find({ client: clientId })
            .populate('advisor', 'firstName lastName profilePicture specializations')
            .populate('appointment', 'dateTime shortDescription')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Review.countDocuments({ client: clientId });

        res.status(200).json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching client reviews:', error);
        res.status(500).json({ message: 'An error occurred while fetching client reviews' });
    }
};

/**
 * Update a review (only within 24 hours and before advisor response)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { rating, comment, communicationRating, professionalismRating, satisfactionRating } = req.body;

        // Validate input
        const { error } = validateReviewInput(req.body);
        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership (client who wrote the review or admin)
        if (review.client.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only update your own reviews' });
        }

        // Check if review can be updated (within 24 hours and no advisor response)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (review.createdAt < twentyFourHoursAgo && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Reviews can only be updated within 24 hours of creation' });
        }

        if (review.advisorResponse && review.advisorResponse.text && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Cannot update review after advisor has responded' });
        }

        // Update review
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        review.communicationRating = communicationRating || review.communicationRating;
        review.professionalismRating = professionalismRating || review.professionalismRating;
        review.satisfactionRating = satisfactionRating || review.satisfactionRating;

        await review.save();

        // Populate client data for response
        await review.populate('client', 'firstName lastName profilePicture');

        res.status(200).json({
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'An error occurred while updating the review' });
    }
};

/**
 * Delete a review (only if no advisor response exists)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership (client who wrote the review or admin)
        if (review.client.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own reviews' });
        }

        // Check if review can be deleted (no advisor response)
        if (review.advisorResponse && review.advisorResponse.text && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Cannot delete review after advisor has responded' });
        }

        // Delete review
        await Review.findByIdAndDelete(id);

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'An error occurred while deleting the review' });
    }
};

/**
 * Add advisor response to a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addAdvisorResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const advisorId = req.user.id;
        const { response } = req.body;

        // Validate response
        if (!response || response.trim().length === 0) {
            return res.status(400).json({ message: 'Response text is required' });
        }

        if (response.length > 500) {
            return res.status(400).json({ message: 'Response cannot exceed 500 characters' });
        }

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the advisor is the one who received the review
        if (review.advisor.toString() !== advisorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only respond to reviews about your services' });
        }

        // Check if response already exists
        if (review.advisorResponse && review.advisorResponse.text) {
            return res.status(400).json({ message: 'Response already exists. Use PATCH to update it.' });
        }

        // Add response
        review.advisorResponse = {
            text: response.trim(),
            respondedAt: new Date()
        };

        await review.save();

        res.status(200).json({
            message: 'Response added successfully',
            advisorResponse: review.advisorResponse
        });
    } catch (error) {
        console.error('Error adding advisor response:', error);
        res.status(500).json({ message: 'An error occurred while adding the response' });
    }
};

/**
 * Update advisor response to a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAdvisorResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const advisorId = req.user.id;
        const { response } = req.body;

        // Validate response
        if (!response || response.trim().length === 0) {
            return res.status(400).json({ message: 'Response text is required' });
        }

        if (response.length > 500) {
            return res.status(400).json({ message: 'Response cannot exceed 500 characters' });
        }

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the advisor is the one who received the review
        if (review.advisor.toString() !== advisorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only update responses to reviews about your services' });
        }

        // Check if response exists
        if (!review.advisorResponse || !review.advisorResponse.text) {
            return res.status(400).json({ message: 'No response exists to update. Use POST to add a response.' });
        }

        // Update response
        review.advisorResponse.text = response.trim();
        review.advisorResponse.respondedAt = new Date();

        await review.save();

        res.status(200).json({
            message: 'Response updated successfully',
            advisorResponse: review.advisorResponse
        });
    } catch (error) {
        console.error('Error updating advisor response:', error);
        res.status(500).json({ message: 'An error occurred while updating the response' });
    }
};

/**
 * Delete advisor response to a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteAdvisorResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const advisorId = req.user.id;

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the advisor is the one who received the review
        if (review.advisor.toString() !== advisorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete responses to reviews about your services' });
        }

        // Check if response exists
        if (!review.advisorResponse || !review.advisorResponse.text) {
            return res.status(400).json({ message: 'No response exists to delete' });
        }

        // Delete response
        review.advisorResponse = undefined;

        await review.save();

        res.status(200).json({ message: 'Response deleted successfully' });
    } catch (error) {
        console.error('Error deleting advisor response:', error);
        res.status(500).json({ message: 'An error occurred while deleting the response' });
    }
};

/**
 * Get recent approved reviews across all advisors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecentReviews = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const reviews = await Review.find({ isApproved: true })
            .populate('client', 'firstName lastName profilePicture')
            .populate('advisor', 'firstName lastName profilePicture specializations')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({ reviews });
    } catch (error) {
        console.error('Error fetching recent reviews:', error);
        res.status(500).json({ message: 'An error occurred while fetching recent reviews' });
    }
};

/**
 * Moderate a review (approve/reject)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.moderateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved, rejectionReason } = req.body;

        // Validate input
        if (typeof isApproved !== 'boolean') {
            return res.status(400).json({ message: 'isApproved must be a boolean value' });
        }

        if (isApproved === false && (!rejectionReason || rejectionReason.trim().length === 0)) {
            return res.status(400).json({ message: 'Rejection reason is required when rejecting a review' });
        }

        // Find review
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Update review
        review.isApproved = isApproved;
        if (!isApproved) {
            review.rejectionReason = rejectionReason.trim();
        } else {
            review.rejectionReason = undefined;
        }

        await review.save();

        res.status(200).json({
            message: isApproved ? 'Review approved successfully' : 'Review rejected successfully',
            review
        });
    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({ message: 'An error occurred while moderating the review' });
    }
};

/**
 * Get pending reviews for moderation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPendingReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch pending reviews
        const reviews = await Review.find({ isApproved: false, rejectionReason: { $exists: false } })
            .populate('client', 'firstName lastName profilePicture email')
            .populate('advisor', 'firstName lastName profilePicture email')
            .populate('appointment', 'dateTime shortDescription')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Review.countDocuments({ isApproved: false, rejectionReason: { $exists: false } });

        res.status(200).json({
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ message: 'An error occurred while fetching pending reviews' });
    }
};