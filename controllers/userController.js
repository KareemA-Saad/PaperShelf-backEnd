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
  getAllUsers,
  updateUser,
  deleteUser,
  deleteMe,
  getUserById,
  deleteUserById,
  changeUserRole,
  getAllAuthors
};



