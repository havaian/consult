const Specialization = require('./model');
const User = require('../user/model');

/**
 * Get all active specializations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActiveSpecializations = async (req, res) => {
    try {
        const specializations = await Specialization.find({ isActive: true })
            .sort({ name: 1 })
            .select('name description icon');

        // Get count of active advisors for each specializations
        const specializationsWithAdvisorCount = await Promise.all(
            specializations.map(async (spec) => {
                const advisorCount = await User.countDocuments({
                    role: 'advisor',
                    specializations: spec.name,
                    isActive: true,
                    isVerified: true
                });

                return {
                    ...spec.toObject(),
                    advisorCount
                };
            })
        );

        res.status(200).json({
            specializations: specializationsWithAdvisorCount
        });
    } catch (error) {
        console.error('Error fetching specializations:', error);
        res.status(500).json({
            message: req.t('errors.serverError'),
            error: error.message
        });
    }
};

/**
 * Get specializations by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSpecializationById = async (req, res) => {
    try {
        const { id } = req.params;

        const specializations = await Specialization.findById(id);

        if (!specializations) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        if (!specializations.isActive) {
            return res.status(404).json({ message: 'Specialization is not active' });
        }

        // Get count of active advisors for this specializations
        const advisorCount = await User.countDocuments({
            role: 'advisor',
            specializations: specializations.name,
            isActive: true,
            isVerified: true
        });

        res.status(200).json({
            specializations: {
                ...specializations.toObject(),
                advisorCount
            }
        });
    } catch (error) {
        console.error('Error fetching specializations:', error);
        res.status(500).json({
            message: req.t('errors.serverError'),
            error: error.message
        });
    }
};

/**
 * Get advisors by specializations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdvisorsBySpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const specializations = await Specialization.findById(id);

        if (!specializations) {
            return res.status(404).json({ message: req.t('errors.notFound') });
        }

        if (!specializations.isActive) {
            return res.status(404).json({ message: 'Specialization is not active' });
        }

        // Query for advisors with this specializations
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const advisors = await User.find({
            role: 'advisor',
            specializations: specializations.name,
            isActive: true,
            isVerified: true
        })
            .select('firstName lastName profilePicture experience consultationFee bio languages address')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ experience: -1 });

        const total = await User.countDocuments({
            role: 'advisor',
            specializations: specializations.name,
            isActive: true,
            isVerified: true
        });

        res.status(200).json({
            specializations: {
                _id: specializations._id,
                name: specializations.name,
                description: specializations.description,
                icon: specializations.icon
            },
            advisors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching advisors by specializations:', error);
        res.status(500).json({
            message: req.t('errors.serverError'),
            error: error.message
        });
    }
};