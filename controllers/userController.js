
//=========================================== User features ============================================

// Get single user
// const getUser = (req, res) => {
//   const user = users.find(u => u.id === parseInt(req.params.id));
//   if (!user) return res.status(404).json({ message: 'User not found' });
//   res.json(user);
// }; 

// Create new user
// const createUser = (req, res) => {
//   const newUser = {
//     id: users.length + 1,
//     name: req.body.name,
//     email: req.body.email
//   };
//   users.push(newUser);
//   res.status(201).json(newUser);
// };

// Update user
const updateUser = (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;

  res.json(user);
};

// Delete user
const deleteUser = (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.status(204).send();
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

//=========================================== Admin Book Approval ============================================

// Get all pending books (isApproved: false)
const getPendingBooks = async (req, res) => {
  try {
    const Book = require('../models/bookModel.js'); // Ensure the Book model is imported
    const pendingBooks = await Book.find({ isApproved: false }).populate('author', 'name email');

    res.status(200).json({
      success: true,
      count: pendingBooks.length,
      data: pendingBooks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Approve a book by ID
const approveBook = async (req, res) => {
  try {
    const Book = require('../models/bookModel.js'); // Ensure the Book model is imported
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
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  deleteMe,
  getUserById,
  deleteUserById,
  changeUserRole,

  getPendingBooks, // Get all pending books
  approveBook,
  rejectBook ,
  getPendingDeleteBooks,
  approveBookDeletion,
  rejectBookDeletion,

}

