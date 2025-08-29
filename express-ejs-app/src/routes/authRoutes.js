const express = require('express');
const { login, register } = require('../controllers/authController');

const router = express.Router();

// Login route
router.post('/login', login);

// Registration route
router.post('/register', register);

module.exports = router;