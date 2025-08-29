const jwt = require('jsonwebtoken');
const { User, USER_ROLES } = require('../models/User');

class AuthController {
  // Generate JWT token with user data
  generateToken(user) {
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    
    return jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: process.env.JWT_EXPIRE || '7d',
        issuer: 'your-app-name',
        audience: 'your-app-users'
      }
    );
  }

  // Set JWT token as HTTP-only cookie
  setTokenCookie(res, token) {
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF protection
      path: '/', // Cookie available for entire domain
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };

    res.cookie('token', token, cookieOptions);
  }

  // Clear token cookie
  clearTokenCookie(res) {
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
  }

  // User Registration
  register = async (req, res) => {
    try {
      const { 
        username, 
        email, 
        password, 
        confirmPassword, 
        firstName, 
        lastName, 
        role 
      } = req.body;

      // Validation
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          required: ['username', 'email', 'password', 'firstName', 'lastName']
        });
      }

      // Password confirmation check
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // Password strength validation
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      });

      if (existingUser) {
        const field = existingUser.username === username.toLowerCase() ? 'username' : 'email';
        return res.status(409).json({
          success: false,
          message: `User already exists with this ${field}`,
          field
        });
      }

      // Create user data
      const userData = {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      };

      // Only existing admins can assign roles during registration
      if (role && req.user && req.user.role === USER_ROLES.ADMIN) {
        if (Object.values(USER_ROLES).includes(role)) {
          userData.role = role;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid role provided',
            validRoles: Object.values(USER_ROLES)
          });
        }
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Set token as cookie
      this.setTokenCookie(res, token);

      // Log registration activity
      console.log(`New user registered: ${user.username} (${user.email}) with role: ${user.role}`);

      // Send response (exclude password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userResponse,
        token // Also send token in response body for mobile apps
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          message: `User already exists with this ${field}`,
          field
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  };

  // User Login
  login = async (req, res) => {
    try {
      const { identifier, password, rememberMe } = req.body;

      // Validation
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        $or: [
          { username: identifier.toLowerCase() },
          { email: identifier.toLowerCase() }
        ],
        isActive: true
      }).select('+password'); // Include password for verification

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Set token as cookie with extended expiry if "remember me" is checked
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      };

      if (rememberMe) {
        // 30 days for "remember me"
        cookieOptions.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        // 7 days for regular login
        cookieOptions.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
      }

      res.cookie('token', token, cookieOptions);

      // Log login activity
      console.log(`User logged in: ${user.username} (${user.role}) at ${new Date().toISOString()}`);

      // Send response (exclude password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token, // Also send token in response body
        expiresIn: rememberMe ? '30d' : '7d'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  };

  // User Logout
  logout = async (req, res) => {
    try {
      // Clear the token cookie
      this.clearTokenCookie(res);

      // Log logout activity
      if (req.user) {
        console.log(`User logged out: ${req.user.username} at ${new Date().toISOString()}`);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  };

  // Get current user profile
  getProfile = async (req, res) => {
    try {
      // User is already attached to req by authentication middleware
      const user = await User.findById(req.user.id);
      
      if (!user || !user.isActive) {
        this.clearTokenCookie(res);
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile'
      });
    }
  };

  // Refresh token
  refreshToken = async (req, res) => {
    try {
      // User is already authenticated via middleware
      const user = await User.findById(req.user.id);
      
      if (!user || !user.isActive) {
        this.clearTokenCookie(res);
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new token
      const newToken = this.generateToken(user);
      
      // Set new token as cookie
      this.setTokenCookie(res, newToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Error refreshing token'
      });
    }
  };

  // Verify token status
  verifyToken = async (req, res) => {
    try {
      // If we reach here, token is valid (middleware already verified it)
      res.json({
        success: true,
        message: 'Token is valid',
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role
        },
        tokenExpiry: req.user.exp ? new Date(req.user.exp * 1000) : null
      });

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying token'
      });
    }
  };
}

module.exports = new AuthController();