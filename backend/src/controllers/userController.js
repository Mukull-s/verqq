const User = require('../models/User');

exports.createOrUpdateUser = async (req, res) => {
    try {
        // Bind strictly to the authenticated user. Never trust uid/email from the
        // request body: doing so allowed account confusion / mass-assignment (VRQ-003).
        const { displayName, photoURL } = req.body;

        const updates = {};
        if (typeof displayName === 'string' && displayName.trim()) {
            updates.displayName = displayName.trim();
        }
        if (typeof photoURL === 'string') {
            updates.photoURL = photoURL;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}; 