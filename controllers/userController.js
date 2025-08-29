const { User, USER_ROLES } = require('../models/User');

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists with this username or email'
        });
      }
      
      // Create new user
      const userData = {
        username,
        email,
        password,
        firstName,
        lastName
      };
      
      // Only admin can assign roles during registration
      if (role && req.user && req.user.isAdmin()) {
        userData.role = role;
      }
      
      const user = new User(userData);
      await user.save();
      
      const token = user.generateAuthToken();
      
      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  },
  
  // Login user
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      const user = await User.findByCredentials(identifier, password);
      const token = user.generateAuthToken();
      
      res.json({
        message: 'Login successful',
        user,
        token
      });
    } catch (error) {
      res.status(401).json({
        error: error.message
      });
    }
  },
  
  // Get current user profile
  getProfile: async (req, res) => {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  },
  
  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const updates = req.body;
      const userId = req.params.id || req.user._id;
      
      // Only allow users to update their own profile unless admin
      if (userId.toString() !== req.user._id.toString() && !req.user.isAdmin()) {
        return res.status(403).json({
          error: 'Access denied. Can only update own profile.'
        });
      }
      
      // Prevent role updates unless admin
      if (updates.role && !req.user.isAdmin()) {
        delete updates.role;
      }
      
      // Prevent password updates through this endpoint
      if (updates.password) {
        delete updates.password;
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  },
  
  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');
      
      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      user.password = newPassword;
      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Admin: Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}).sort({ createdAt: -1 });
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Admin: Update user role
  updateUserRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!Object.values(USER_ROLES).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        message: 'User role updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // Admin: Delete user
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      const user = await User.findByIdAndDelete(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;