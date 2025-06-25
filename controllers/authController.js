// Pseudocode — assume async/await and proper error handling
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const users = []; // Replace with DB in real app
const resetTokens = {};

// Register user
const register = (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role: role || 'user',
    verified: false
  };
  users.push(newUser);
  res.status(201).json({ message: 'User registered' });
};

// Login user
const login = (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, 'secret', { expiresIn: '1h' });
  res.json({ token });
};

// Logout user
const logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

// Request password reset
const requestPasswordReset = (req, res) => {
  const { email } = req.body;
  const token = Math.floor(100000 + Math.random() * 900000);
  resetTokens[email] = token;
  sendEmail(email, 'Password Reset Code', `Your code: ${token}`);
  res.json({ message: 'Reset email sent' });
};

// Reset password
const resetPassword = (req, res) => {
  const { email, token, newPassword } = req.body;
  if (resetTokens[email] != token) return res.status(400).json({ message: 'Invalid token' });

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.password = newPassword;
  delete resetTokens[email];
  res.json({ message: 'Password updated' });
};

module.exports = {
  register,
  login,
  logout,
  requestPasswordReset,
  resetPassword
};
