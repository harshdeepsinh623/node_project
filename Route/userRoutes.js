const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, adminOnly, authorize } = require('../middleware/Auth');
const { USER_ROLES } = require('../models/User');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile/:id?', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin only routes
router.get('/all', adminOnly, userController.getAllUsers);
router.put('/:userId/role', adminOnly, userController.updateUserRole);
router.delete('/:userId', adminOnly, userController.deleteUser);

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});