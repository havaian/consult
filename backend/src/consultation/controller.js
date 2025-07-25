const Appointment = require('../appointment/model');
const User = require('../user/model');
const JitsiUtils = require('../utils/jitsiUtils');
const { NotificationService } = require('../notification');

/**
 * Controller for handling consultation-related operations
 */
class ConsultationController {
    /**
     * Initialize consultation controller
     */
    constructor() {
        // No need for webRTCService with Jitsi integration
    }

    /**
     * Join a consultation session
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    joinConsultation = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const userId = req.user.id;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId)
                .populate('advisor', 'firstName lastName profilePicture specializations email')
                .populate('client', 'firstName lastName profilePicture dateOfBirth email');

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Check if user is involved in the appointment
            const isAdvisor = req.user.role === 'advisor' && appointment.advisor._id.toString() === userId.toString();
            const isClient = req.user.role === 'client' && appointment.client._id.toString() === userId.toString();

            if (!isAdvisor && !isClient) {
                return res.status(403).json({ message: 'You are not authorized to join this consultation' });
            }

            // Check if appointment is scheduled or in progress
            if (appointment.status !== 'scheduled') {
                return res.status(400).json({
                    message: `Cannot join consultation with status "${appointment.status}"`,
                    status: appointment.status
                });
            }

            // Check if appointment time is valid (not too early, not too late)
            const now = new Date();
            const appointmentTime = new Date(appointment.dateTime);
            const timeDiffMinutes = (appointmentTime - now) / (1000 * 60);

            // Can join 5 minutes before scheduled time
            if (timeDiffMinutes > 5) {
                return res.status(400).json({
                    message: 'Consultation is not ready yet',
                    startsInMinutes: Math.floor(timeDiffMinutes)
                });
            }

            // Cannot join 30 minutes after scheduled time
            if (timeDiffMinutes < -30) {
                return res.status(400).json({ message: 'Consultation time has expired' });
            }

            // Check if consultation has already ended (endTime has passed)
            if (appointment.endTime && now > appointment.endTime) {
                return res.status(400).json({ message: 'Consultation has already ended' });
            }

            // User info for Jitsi token
            const userInfo = {
                id: userId,
                name: isAdvisor ?
                    `Dr. ${appointment.advisor.firstName} ${appointment.advisor.lastName}` :
                    `${appointment.client.firstName} ${appointment.client.lastName}`,
                avatar: isAdvisor ? appointment.advisor.profilePicture : appointment.client.profilePicture,
                email: isAdvisor ? appointment.advisor.email : appointment.client.email,
                role: isAdvisor ? 'advisor' : 'client'
            };

            // Generate Jitsi configuration
            const jitsiConfig = JitsiUtils.getJitsiConfig(appointmentId, userInfo);

            // Add custom configuration for participant limits - maximum of 2 participants
            jitsiConfig.interfaceConfigOverwrite = {
                ...jitsiConfig.interfaceConfigOverwrite,
                MAXIMUM_ZOOMING_COEFFICIENT: 1.0,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                SHOW_JITSI_WATERMARK: false,
                ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 15000,
                // Set maximum number of participants
                MAX_PARTICIPANTS: 2,
                // Don't allow external API manipulation to override this
                ALLOW_MULTIPLE_AUDIO_INPUT: false,
                HIDE_INVITE_MORE_HEADER: true,
                DISABLE_FOCUS_INDICATOR: false,
                DISABLE_VIDEO_BACKGROUND: false,
                // Disable the Lobby feature (waiting room)
                ENABLE_LOBBY: false,
                // Disable the Breakout Rooms feature
                ENABLE_BREAKOUT_ROOMS: false
            };

            // Add participant limits to the token's context
            jitsiConfig.jwt = JitsiUtils.generateJitsiToken(jitsiConfig.roomName, userInfo, {
                maxParticipants: 2,
                allowedParticipants: [
                    appointment.advisor._id.toString(),
                    appointment.client._id.toString()
                ]
            });

            // Prepare response with consultation info
            res.status(200).json({
                message: 'Joined consultation successfully',
                consultation: {
                    appointmentId: appointment._id,
                    type: appointment.type,
                    advisor: {
                        id: appointment.advisor._id,
                        name: `Dr. ${appointment.advisor.firstName} ${appointment.advisor.lastName}`,
                        profilePicture: appointment.advisor.profilePicture,
                        specializations: appointment.advisor.specializations
                    },
                    client: {
                        id: appointment.client._id,
                        name: `${appointment.client.firstName} ${appointment.client.lastName}`,
                        profilePicture: appointment.client.profilePicture,
                        dateOfBirth: appointment.client.dateOfBirth
                    },
                    dateTime: appointment.dateTime,
                    endTime: appointment.endTime,
                    shortDescription: appointment.shortDescription,
                    userRole: isAdvisor ? 'advisor' : 'client',
                    jitsi: jitsiConfig
                }
            });
        } catch (error) {
            console.error('Error joining consultation:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * End a consultation (advisor only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    endConsultation = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const { consultationSummary, chatLog } = req.body;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Only advisor or admin can end consultation
            if (req.user.role !== 'advisor' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only advisors can end consultations' });
            }

            // Advisor must be assigned to the appointment
            if (req.user.role === 'advisor' && appointment.advisor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You are not the advisor for this appointment' });
            }

            // Update appointment status
            appointment.status = 'completed';

            // Add consultation summary if provided
            if (consultationSummary) {
                appointment.consultationSummary = consultationSummary;
            }

            // Save chat log if provided
            if (chatLog && Array.isArray(chatLog) && chatLog.length > 0) {
                appointment.chatLog = chatLog;
            }

            await appointment.save();

            // Send completion notification
            await NotificationService.sendAppointmentCompletionNotification(appointment);

            res.status(200).json({
                message: 'Consultation ended successfully',
                appointment
            });
        } catch (error) {
            console.error('Error ending consultation:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * Add advices to a completed appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    addAdvices = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const { advices } = req.body;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            if (!advices || !Array.isArray(advices) || advices.length === 0) {
                return res.status(400).json({ message: 'Valid advices array is required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Only advisor or admin can add advices
            if (req.user.role !== 'advisor' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only advisors can add advices' });
            }

            // Advisor must be assigned to the appointment
            if (req.user.role === 'advisor' && appointment.advisor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You are not the advisor for this appointment' });
            }

            // Validate advice data
            const validAdvices = advices.filter(advice => {
                return advice.action && advice.dosage && advice.frequency && advice.duration;
            });

            if (validAdvices.length === 0) {
                return res.status(400).json({ message: 'No valid advices provided' });
            }

            // Add advices to appointment
            appointment.advices = validAdvices;
            await appointment.save();

            // Send advice notification
            await NotificationService.sendAdviceNotification(appointment);

            res.status(200).json({
                message: 'Advices added successfully',
                advices: appointment.advices
            });
        } catch (error) {
            console.error('Error adding advices:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * Create a follow-up appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createFollowUp = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const { followUpDate, notes } = req.body;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            if (!followUpDate) {
                return res.status(400).json({ message: 'Follow-up date is required' });
            }

            // Validate follow-up date (must be in the future)
            const followUpDateObj = new Date(followUpDate);
            const now = new Date();
            if (followUpDateObj <= now) {
                return res.status(400).json({ message: 'Follow-up date must be in the future' });
            }

            // Find the original appointment
            const originalAppointment = await Appointment.findById(appointmentId)
                .populate('advisor', 'firstName lastName consultationFee')
                .populate('client', 'firstName lastName');

            if (!originalAppointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Only advisor or admin can create follow-up
            if (req.user.role !== 'advisor' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only advisors can create follow-up appointments' });
            }

            // Advisor must be assigned to the appointment
            if (req.user.role === 'advisor' && originalAppointment.advisor._id.toString() !== req.user.id.toString()) {
                return res.status(403).json({ message: 'You are not the advisor for this appointment' });
            }

            // Update original appointment with follow-up recommendation
            originalAppointment.followUp = {
                recommended: true,
                date: followUpDateObj,
                notes: notes || ''
            };
            await originalAppointment.save();

            // Create new follow-up appointment with 'pending-payment' status
            const followUpAppointment = new Appointment({
                client: originalAppointment.client._id,
                advisor: originalAppointment.advisor._id,
                dateTime: followUpDateObj,
                type: originalAppointment.type,
                shortDescription: `Follow-up to appointment on ${new Date(originalAppointment.dateTime).toLocaleDateString()} - ${notes || 'No notes provided'}`,
                status: 'pending-payment', // Special status for follow-ups pending payment
                payment: {
                    amount: originalAppointment.advisor.consultationFee,
                    status: 'pending'
                }
            });

            await followUpAppointment.save();

            // Notify client about follow-up
            await NotificationService.sendFollowUpNotification(followUpAppointment);

            res.status(201).json({
                message: 'Follow-up appointment created successfully',
                followUpAppointment
            });
        } catch (error) {
            console.error('Error creating follow-up appointment:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * Get consultation status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getConsultationStatus = async (req, res) => {
        try {
            const { appointmentId } = req.params;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            res.status(200).json({
                appointmentId,
                status: appointment.status,
                isActive: appointment.status === 'scheduled',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting consultation status:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * Save chat log from consultation
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    saveChatLog = async (req, res) => {
        try {
            const { appointmentId } = req.params;
            const { chatLog } = req.body;

            if (!appointmentId) {
                return res.status(400).json({ message: 'Appointment ID is required' });
            }

            if (!chatLog || !Array.isArray(chatLog)) {
                return res.status(400).json({ message: 'Valid chat log array is required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Check if user is involved in the appointment
            const isAdvisor = req.user.role === 'advisor' && appointment.advisor.toString() === req.user.id;
            const isClient = req.user.role === 'client' && appointment.client.toString() === req.user.id;

            if (!isAdvisor && !isClient && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'You are not authorized to save chat logs for this appointment' });
            }

            // Save chat log
            appointment.chatLog = chatLog;
            await appointment.save();

            res.status(200).json({
                message: 'Chat log saved successfully'
            });
        } catch (error) {
            console.error('Error saving chat log:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    };

    /**
     * Handle consultation room exit
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
    */
    handleRoomExit = async (req, res) => {
        try {
            const { appointmentId, userId } = req.body;

            if (!appointmentId || !userId) {
                return res.status(400).json({ message: 'Appointment ID and User ID are required' });
            }

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Only process for scheduled appointments
            if (appointment.status !== 'scheduled') {
                return res.status(200).json({
                    message: 'Appointment is not in scheduled status',
                    status: appointment.status
                });
            }

            // Track participant exit in the appointment metadata
            if (!appointment.participantStatus) {
                appointment.participantStatus = {};
            }

            // Record exit time
            appointment.participantStatus[userId] = {
                exitTime: new Date(),
                status: 'left'
            };

            // Check if both participants have left
            const advisorId = appointment.advisor.toString();
            const clientId = appointment.client.toString();

            const bothParticipantsLeft =
                appointment.participantStatus[advisorId]?.status === 'left' &&
                appointment.participantStatus[clientId]?.status === 'left';

            // If both have left and at least 10 minutes have passed since appointment start time
            const appointmentStartTime = new Date(appointment.dateTime);
            const now = new Date();
            const minutesSinceStart = (now - appointmentStartTime) / (1000 * 60);

            if (bothParticipantsLeft && minutesSinceStart >= 10) {
                // Auto-complete the appointment
                appointment.status = 'completed';

                // Add default consultation summary if none exists
                if (!appointment.consultationSummary) {
                    appointment.consultationSummary = 'This consultation was automatically marked as completed when both participants left the session.';
                }

                // Send notification
                await NotificationService.sendConsultationCompletedNotification(appointment);

                console.log(`Auto-completed consultation ${appointment._id} after both participants left the room`);
            }

            await appointment.save();

            res.status(200).json({
                message: 'Room exit recorded successfully',
                bothLeft: bothParticipantsLeft,
                appointmentStatus: appointment.status
            });
        } catch (error) {
            console.error('Error handling room exit:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    }

    /**
     * Update consultation summary and add new advices
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
    */
    updateConsultationResults = async (req, res) => {
        try {
            const { id } = req.params;
            const { consultationSummary, advices, followUp } = req.body;
            const advisorId = req.user.id;

            // Find the appointment
            const appointment = await Appointment.findById(id)
                .populate('client', 'firstName lastName email telegramId')
                .populate('advisor', 'firstName lastName email telegramId');

            if (!appointment) {
                return res.status(404).json({ message: req.t('errors.notFound') });
            }

            // Verify advisor is assigned to this appointment
            if (appointment.advisor._id.toString() !== advisorId.toString()) {
                return res.status(403).json({ message: req.t('errors.unauthorized') });
            }

            // Verify appointment is completed
            if (appointment.status !== 'completed') {
                return res.status(400).json({ message: req.t('consultations.onlyCompleted') });
            }

            // Update consultation summary if provided
            if (consultationSummary) {
                appointment.consultationSummary = consultationSummary;
            }

            // Add new advices if provided (don't replace existing ones)
            if (advices && Array.isArray(advices) && advices.length > 0) {
                // Filter out invalid advices
                const validAdvices = advices.filter(advice => {
                    return advice.action && advice.dosage &&
                        advice.frequency && advice.duration;
                });

                // Add timestamp to each new advice
                const timestampedAdvices = validAdvices.map(advice => ({
                    ...advice,
                    createdAt: Date.now()
                }));

                // If appointment already has advices, append new ones
                if (appointment.advices && Array.isArray(appointment.advices)) {
                    appointment.advices = [...appointment.advices, ...timestampedAdvices];
                } else {
                    appointment.advices = timestampedAdvices;
                }

                // Send advice notification
                if (timestampedAdvices.length > 0) {
                    await NotificationService.sendAdviceNotification(appointment);
                }
            }

            // Update follow-up recommendation if provided
            if (followUp && followUp.recommended) {
                appointment.followUp = {
                    recommended: true,
                    date: new Date(followUp.date),
                    notes: followUp.notes || ''
                };

                // If creating a follow-up appointment was requested
                if (followUp.createAppointment) {
                    // Calculate end time
                    const followUpDateObj = new Date(followUp.date);
                    const duration = followUp.duration || 30;
                    const endTime = new Date(followUpDateObj.getTime() + duration * 60000);

                    // Create a new appointment for the follow-up with pending-payment status
                    const followUpAppointment = new Appointment({
                        client: appointment.client._id,
                        advisor: appointment.advisor._id,
                        dateTime: followUpDateObj,
                        endTime: endTime,
                        duration: duration,
                        type: appointment.type,
                        shortDescription: `Follow-up to appointment on ${appointment.dateTime.toLocaleDateString()} - ${followUp.notes || 'No notes provided'}`,
                        status: 'pending-payment',
                        payment: {
                            amount: appointment.advisor.consultationFee,
                            status: 'pending'
                        }
                    });

                    await followUpAppointment.save();

                    // Notify about follow-up
                    await NotificationService.sendFollowUpNotification(followUpAppointment);
                }
            }

            // Save changes
            await appointment.save();

            res.status(200).json({
                message: req.t('success.updated'),
                appointment
            });

        } catch (error) {
            console.error('Error updating consultation results:', error);
            res.status(500).json({ message: req.t('errors.serverError') });
        }
    }
}

module.exports = ConsultationController;