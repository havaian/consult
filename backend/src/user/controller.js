const User = require('./model');
const { validateUserInput } = require('../utils/validators');
const { NotificationService } = require('../notification');
const crypto = require('crypto');

// Register a new user (client or advisor)
exports.registerUser = async (req, res) => {
    try {
        // First, we need to preprocess the data to prevent validation issues with role-specific fields
        const userData = { ...req.body };
        
        // If the user is a client, explicitly remove all advisor-specific fields before validation
        if (userData.role === 'client' || !userData.role) {
            delete userData.specializations;
            delete userData.specializations;
            delete userData.licenseNumber;
            delete userData.experience;
            delete userData.consultationFee;
            delete userData.bio;
            delete userData.languages;
            delete userData.education;
            delete userData.certifications;
            delete userData.availability;
        }
        
        // Now validate the processed data
        const { error } = validateUserInput(userData);
        if (error) {
            return res.status(400).json({ message: req.t('errors.validationError') });
        }

        const { email, password, firstName, lastName, phone, role } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Create new user with base fields
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: role || 'client',
            verificationToken,
            isVerified: false
        });

        // Add role-specific fields
        if (role === 'advisor') {
            // Handle specializations (array)
            if (userData.specializations) {
                user.specializations = userData.specializations;
            } else {
                user.specializations = []; // Default empty array
            }
            
            user.licenseNumber = userData.licenseNumber || '';
            user.experience = userData.experience || 0;
            user.bio = userData.bio ? decodeURIComponent(userData.bio) : '';
            user.languages = userData.languages || [];
            user.consultationFee = userData.consultationFee || 0;
            user.education = userData.education || [];
            user.certifications = userData.certifications || [];

            // Default availability (can be updated later)
            user.availability = [
                { dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 6, isAvailable: false, startTime: '00:00', endTime: '00:00' },
                { dayOfWeek: 7, isAvailable: false, startTime: '00:00', endTime: '00:00' }
            ];
        }
        else if (role === 'client' || !role) {
            const { dateOfBirth, gender, legalHistory } = userData;

            user.dateOfBirth = dateOfBirth;
            user.gender = gender;

            if (legalHistory) {
                user.legalHistory = legalHistory;
            }
            
            // Explicitly ensure advisor-specific fields are unset for clients
            user.specializations = undefined;
            user.licenseNumber = undefined;
            user.experience = undefined;
            user.consultationFee = undefined;
            user.bio = undefined;
            user.languages = undefined;
            user.education = undefined;
            user.certifications = undefined;
            user.availability = undefined;
        }

        // Save user to database
        await user.save();

        // Send verification email
        await NotificationService.sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email before logging in.',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: false
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Verify user email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user (include password field which is excluded by default)
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password is correct
        if (!user || !(await user.matchPassword(password))) {
            console.log('Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            console.log('Please verify your email first');
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        // Check if user is active
        if (!user.isActive) {
            console.log('Your account has been deactivated. Please contact support.');
            return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
        }

        // Update last login time
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpire -verificationToken -jwtSecret');

        if (!user) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        // res.status(200).json({ user: user.getPublicProfile() });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            'firstName', 'lastName', 'phone', 'profilePicture',
            'address', 'bio', 'languages', 'availability',
            'consultationFee', 'legalHistory', 'emergencyContact',
            'specializations', 'education', 'certifications', 'experience'
        ];

        const updates = {};

        // Filter only allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Decode bio if present
        if (updates.bio) {
            updates.bio = decodeURIComponent(updates.bio);
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide your email' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send password reset email
        await NotificationService.sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetPasswordToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

        if (!password) {
            return res.status(400).json({ message: 'Please provide a new password' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Find user with the token and check if token is still valid
        const user = await User.findOne({
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Update password and clear reset token fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Get all advisors (with optional filters)
exports.getAdvisors = async (req, res) => {
    try {
        const {
            specializations,
            name,
            city,
            availableDay,
            minExperience,
            maxFee,
            language,
            page = 1,
            limit = 10
        } = req.query;

        const query = { role: 'advisor', isActive: true, isVerified: true };

        // Apply filters
        if (specializations) {
            query.specializations = specializations;
        }

        if (name) {
            query.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } }
            ];
        }

        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        if (availableDay) {
            const day = parseInt(availableDay);
            query.availability = {
                $elemMatch: { dayOfWeek: day, isAvailable: true }
            };
        }

        if (minExperience) {
            query.experience = { $gte: parseInt(minExperience) };
        }

        if (maxFee) {
            query['consultationFee'] = { $lte: parseInt(maxFee) };
        }

        if (language) {
            query.languages = language;
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const advisors = await User.find(query)
            .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ experience: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            advisors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching advisors:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Get advisor by ID
exports.getAdvisorById = async (req, res) => {
    try {
        const { id } = req.params;

        const advisor = await User.findOne({
            _id: id,
            role: 'advisor',
            isActive: true,
            isVerified: true
        }).select('-password -verificationToken -resetPasswordToken -resetPasswordExpire');

        if (!advisor) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        res.status(200).json({ advisor });
    } catch (error) {
        console.error('Error fetching advisor details:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Link Telegram account
exports.linkTelegramAccount = async (req, res) => {
    try {
        const { telegramId, verificationCode } = req.body;

        // Verify the code
        const user = await User.findOne({
            telegramVerificationCode: verificationCode,
            telegramVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Link Telegram account
        user.telegramId = telegramId;
        user.telegramVerificationCode = undefined;
        user.telegramVerificationExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Telegram account linked successfully' });
    } catch (error) {
        console.error('Error linking Telegram account:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Deactivate account
exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating account:', error);
        res.status(500).json({ message: req.t('errors.serverError') });
    }
};

// Get advisor's availability slots
exports.getAdvisorAvailability = async (req, res) => {
    try {
        const { advisorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: req.t('validation.required') });
        }

        // Get advisor's working hours
        const advisor = await User.findById(advisorId);
        if (!advisor || advisor.role !== 'advisor') {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        // Parse date and get working hours for that day of week
        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-based (Monday = 0, Sunday = 6)

        const dayAvailability = advisor.availability.find(a => a.dayOfWeek === dayIndex);
        if (!dayAvailability || !dayAvailability.isAvailable) {
            return res.status(200).json({
                message: req.t('appointments.advisorNotAvailableDay'),
                availableSlots: []
            });
        }

        let availableSlots = [];

        // Check if the advisor has time slots defined
        if (Array.isArray(dayAvailability.timeSlots) && dayAvailability.timeSlots.length > 0) {
            // For each time slot, generate available appointment slots
            for (const timeSlot of dayAvailability.timeSlots) {
                const slots = await generateTimeSlots(
                    requestedDate,
                    timeSlot.startTime,
                    timeSlot.endTime,
                    advisorId
                );
                availableSlots = [...availableSlots, ...slots];
            }
        } else {
            // Fallback to old format
            availableSlots = await generateTimeSlots(
                requestedDate,
                dayAvailability.startTime,
                dayAvailability.endTime,
                advisorId
            );
        }

        res.status(200).json({
            availableSlots,
            workingHours: Array.isArray(dayAvailability.timeSlots) ?
                dayAvailability.timeSlots :
                { start: dayAvailability.startTime, end: dayAvailability.endTime }
        });
    } catch (error) {
        console.error('Error fetching advisor availability:', error);
        res.status(500).json({ message: req.t('errors.serverError')  });
    }
};

// Helper function to generate time slots
async function generateTimeSlots(date, startTimeStr, endTimeStr, advisorId) {
    // Parse start and end times
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate slots at 15-minute intervals
    const slots = [];
    let currentSlot = new Date(startTime);

    while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30); // Default 30-min slots

        if (slotEnd <= endTime) {
            slots.push({
                start: new Date(currentSlot),
                end: new Date(slotEnd)
            });
        }

        currentSlot.setMinutes(currentSlot.getMinutes() + 15); // Move to next 15-min interval
    }

    // Remove slots that already have appointments
    const bookedAppointments = await Appointment.find({
        advisor: advisorId,
        dateTime: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'pending-advisor-confirmation'] }
    });

    // Check for conflicts with each potential slot
    return slots.filter(slot => {
        return !bookedAppointments.some(appointment => {
            const apptStart = new Date(appointment.dateTime);
            const apptEnd = appointment.endTime ||
                new Date(apptStart.getTime() + (appointment.duration || 30) * 60000);

            // Check if there's an overlap
            return (
                (slot.start < apptEnd && slot.end > apptStart) || // Slot overlaps with appointment
                (apptStart < slot.end && apptEnd > slot.start)    // Appointment overlaps with slot
            );
        });
    });
}