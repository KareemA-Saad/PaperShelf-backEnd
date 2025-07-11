
//=========================================== User features ============================================

const User = require('../models/userModel');
const Book = require('../models/bookModel.js');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const Joi = require('joi');

// Update user (name or password)

const updateUserProfile = async (req, res) => {
  console.log(" PATCH request reached updateUserProfile");

  try {
    const userId = req.user._id.toString();

    if (req.params.id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
    }

    const { name, currentPassword, newPassword, confirmNewPassword } = req.body;

    console.log(" req.body =", req.body);

    const isTryingToUpdatePassword = newPassword && newPassword.trim() !== "";

    if (!name && !isTryingToUpdatePassword) {
      return res.status(400).json({ success: false, message: 'No update data provided. Please provide a new name or a new password.' });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required to update your profile.' });
    }

    const user = await User.findById(userId).select('+password +tokenVersion');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'The current password you entered is incorrect.' });
    }

    let isModified = false;
    let passwordUpdated = false;

    if (name && user.name !== name) {
      console.log(" Changing name from", user.name, "to", name);
      user.name = name;
      isModified = true;
    }

    if (isTryingToUpdatePassword) {
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation password do not match.' });
      }

      const isSameAsOld = await user.comparePassword(newPassword);
      if (isSameAsOld) {
        return res.status(400).json({ success: false, message: 'New password must be different from the current password.' });
      }

      // modify the password
      user.password = newPassword;
      isModified = true;
      passwordUpdated = true;
    }

    if (!isModified) {
      return res.status(200).json({ success: true, message: 'No changes were detected in your profile information.' });
    }

    if (isModified) {
      if (passwordUpdated) {
        user.tokenVersion += 1;
      }
      await user.save();
    }

    console.log(" User updated successfully");

    if (passwordUpdated) {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
      const emailContent = emailTemplates.passwordChangedNotification(user.name, resetLink);
      await sendEmail({
        email: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      // لا ترجع توكن جديد... فقط ابلّغه بالنجاح
      return res.json({
        success: true,
        message: 'Your password has been updated successfully. You will be logged out. Please log in again with your new password.',
      });
    }
    res.json({
      success: true,
      message: 'Your profile has been updated successfully.',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error(" Error in updateUserProfile:", error);
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

    const {
      page = 1,
      limit = 10,
      q,
      role,
      isActive,
      isEmailVerified
    } = req.query;

    const filter = {};

    // Search by name, email, role
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } },
      ];
    }

    // Filter by role
    if (role) filter.role = role;

    // Filter by active status (true/false)
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Filter by email verification status (true/false)
    if (isEmailVerified !== undefined) {
      filter.isEmailVerified = isEmailVerified === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch users with filter, pagination & sort
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Count total documents matching filter
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("[API Error] getAllUsers failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users"
    });


    // const users = await User.find().select('-password');

    // Add isSuperAdmin flag to each user for frontend use
    //const usersWithSuperAdminFlag = users.map(user => ({
    //   ...user.toObject(),
    //  isSuperAdmin: isSuperAdmin(user.email)
    //  }));

    // res.json({ success: true, users: usersWithSuperAdminFlag });
    // } catch (error) {
    //  res.status(500).json({ success: false, message: "Failed to fetch users" });

  }
};

// Get a user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Add isSuperAdmin flag for frontend use
    const userWithSuperAdminFlag = {
      ...user.toObject(),
      isSuperAdmin: isSuperAdmin(user.email)
    };

    res.json({ success: true, user: userWithSuperAdminFlag });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,

        isActive: req.body.isActive,

        isEmailVerified: req.body.isEmailVerified,
        $inc: { tokenVersion: 1 }
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
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user is the superadmin (protected email)
    if (user.email === process.env.SUPERADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Cannot delete superadmin" });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};


// Get all pending books (isApproved: false)
const getPendingBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      category,
      author,
      minPrice,
      maxPrice,
      rating
    } = req.query;

    // Parse numbers
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
    const minRating = rating ? parseFloat(rating) : 0;
    const maxRating = rating ? minRating + 0.99 : 5;

    // Build match object
    const match = { isApproved: false };
    if (category) match.category = category;
    if (author) {
      const User = require('../models/userModel');
      const authorNames = author.split(',').map(a => a.trim());

      // Find users with these names
      const users = await User.find({
        name: { $in: authorNames },
        role: 'author'
      });

      const userIds = users.map(u => u._id);
      const authorRegexes = authorNames.map(name => new RegExp(name, 'i'));

      match.$or = [
        { author: { $in: authorRegexes } },
        { author: { $in: userIds } }
      ];
    }

    // Aggregation pipeline
    const pipeline = [
      {
        $addFields: {
          discountedPrice: {
            $cond: [
              { $gt: ["$discount", 0] },
              { $multiply: ["$price", { $subtract: [1, { $divide: ["$discount", 100] }] }] },
              "$price"
            ]
          }
        }
      },
      {
        $match: {
          ...match,
          discountedPrice: { $gte: min, $lte: max },
          averageRating: { $gte: minRating, $lte: maxRating }
        }
      },
      { $sort: { [sort]: order === 'asc' ? 1 : -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    // Get total count for pagination
    const countPipeline = [
      {
        $addFields: {
          discountedPrice: {
            $cond: [
              { $gt: ["$discount", 0] },
              { $multiply: ["$price", { $subtract: [1, { $divide: ["$discount", 100] }] }] },
              "$price"
            ]
          }
        }
      },
      {
        $match: {
          ...match,
          discountedPrice: { $gte: min, $lte: max },
          averageRating: { $gte: minRating, $lte: maxRating }
        }
      },
      { $count: "total" }
    ];

    const countResult = await Book.aggregate(countPipeline);
    const totalBooks = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalBooks / parseInt(limit));

    const books = await Book.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBooks,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Search in pending books
const searchPendingBooks = async (req, res) => {
    try {
        const { q, page = 1, limit = 20, searchIn = ['title', 'author', 'description'] } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Build search query based on searchIn fields
        const searchQuery = {
            isApproved:false,
            $or: []
        };

        if (searchIn.includes('title')) {
            searchQuery.$or.push({ title: { $regex: q, $options: 'i' } });
        }
        if (searchIn.includes('author')) {
            searchQuery.$or.push({ author: { $regex: q, $options: 'i' } });
        }
        if (searchIn.includes('description')) {
            searchQuery.$or.push({ description: { $regex: q, $options: 'i' } });
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute search
        const books = await Book.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalBooks = await Book.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalBooks / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBooks,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Approve a book by ID
const approveBook = async (req, res) => {
  try {
    // Ensure the Book model is imported
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    book.isApproved = true;
    await book.save();

    res.status(200).json({ success: true, message: 'Book approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Reject a book by ID (new or updated)
const rejectBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }


    if (book.isApproved) {
      return res.status(400).json({ success: false, message: 'Book is already approved, cannot reject' });
    }


    await book.deleteOne();


    res.json({ success: true, message: 'Book has been rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject book' });
  }
};

//  Get all books with pendingDelete = true
const getPendingDeleteBooks = async (req, res) => {
  try {
    const books = await Book.find({ pendingDelete: true }).populate('author', 'name email');
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending deletions' });
  }
};

//  Approve deletion (delete the book permanently)
const approveBookDeletion = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (!book.pendingDelete) {
      return res.status(400).json({ success: false, message: 'Book is not marked for deletion' });
    }

    await book.deleteOne();

    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error while deleting book:', err);
    res.status(500).json({ success: false, message: 'Failed to delete book' });
  }
};

//  Reject deletion request (set pendingDelete = false)
const rejectBookDeletion = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (!book.pendingDelete) {
      return res.status(400).json({ success: false, message: 'This book is not marked for deletion' });
    }

    book.pendingDelete = false;
    await book.save();

    res.json({ success: true, message: 'Book deletion request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to reject deletion' });
  }
}
//general to show on home page or show by admins
// Get all authors (public endpoint - no authentication required)
const getAllAuthors = async (req, res) => {
  try {
    const authors = await User
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

// Helper function to check if user is superadmin
const isSuperAdmin = (email) => {
  return email === process.env.SUPERADMIN_EMAIL;
};

module.exports = {
  updateUserProfile,
  getAllUsers,
  updateUser,
  deleteMe,
  getUserById,
  deleteUserById,
  getAllAuthors,
  getPendingBooks, // Get all pending books
  approveBook,
  rejectBook,
  getPendingDeleteBooks,
  approveBookDeletion,
  rejectBookDeletion,
  searchPendingBooks,
  isSuperAdmin, // Export helper function for use in other modules
};

