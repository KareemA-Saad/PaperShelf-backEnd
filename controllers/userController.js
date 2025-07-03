//=========================================== User features ============================================

const User = require('../models/userModel');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// Update user (name or password)
const updateUserProfile = async (req, res) => {
  try {
    // Only allow updating self (or admin updating anyone, if needed)
    const userId = req.user._id.toString();
    if (req.params.id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update name (requires current password)
    if (req.body.name) {
      if (!req.body.password) {
        return res.status(400).json({ success: false, message: 'Current password is required to update name' });
      }
      const isMatch = await user.comparePassword(req.body.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.name = req.body.name;
    }

    // Update password (requires currentPassword, newPassword, and confirmNewPassword)
    if (req.body.currentPassword && req.body.newPassword && req.body.confirmNewPassword) {
      // Check current password
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Check if new password matches confirmation
      if (req.body.newPassword !== req.body.confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation password do not match' });
      }

      // Validate new password (will be validated by schema on save)
      user.password = req.body.newPassword;
      await user.save();

      // Send notification email with reset link
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
      const emailContent = emailTemplates.passwordChangedNotification(user.name, resetLink);
      await sendEmail({
        email: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Delete current user's account
const deleteMe = async (req, res) => {
  try {
    await req.user.deleteOne(); // req.user is set by authenticateUser
    res.status(204).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};


//=========================================== Admin features ============================================
// List all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await require('../models/userModel').find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// Get a user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await require('../models/userModel').findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await require('../models/userModel').findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        isActive: req.body.status,
        isEmailVerified: req.body.isEmailVerified,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// Delete any user by ID (admin only)
const deleteUserById = async (req, res) => {
  try {
    const user = await require('../models/userModel').findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// Change user role (admin only)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'author']; // Add more roles if needed

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await require('../models/userModel').findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};


//=========================================== generic features ============================================
//general to show on home page or show by admins
// Get all authors (public endpoint - no authentication required)
const getAllAuthors = async (req, res) => {
  try {
    const authors = await require('../models/userModel')
      .find({ role: 'author', isActive: true })
      .select('name email avatar createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: authors.length,
      authors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch authors" });
  }
};

module.exports = {
  updateUserProfile,
  getAllUsers,
  updateUser,
  deleteMe,
  getUserById,
  deleteUserById,
  changeUserRole,
  getAllAuthors
};



