import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// The raw token goes in the emailed link; only its hash is stored.
const createVerificationToken = () => {
  const raw = crypto.randomBytes(20).toString('hex');
  return {
    raw,
    hashed: hashToken(raw),
    expires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  };
};

const sendVerificationEmail = (user, rawToken) => {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email/${rawToken}`;
  return sendEmail({
    to: user.email,
    subject: 'SettleUp - Confirm your email address',
    html: `
      <h1>Confirm your email</h1>
      <p>Hello ${user.name},</p>
      <p>Click the link below to confirm this is your email address. The link works for 24 hours.</p>
      <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
      <p>If you didn't create a SettleUp account, you can ignore this email.</p>
    `,
  });
};

// @desc    Confirm an email address from the emailed link
// @route   POST /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      emailVerifyToken: hashToken(req.params.token),
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('This confirmation link is invalid or has expired');
    }

    // The token is left in place until it expires so opening the link twice
    // still succeeds.
    if (!user.isVerified) {
      await User.findByIdAndUpdate(user._id, { isVerified: true });
    }

    res.status(200).json({ message: 'Email confirmed', email: user.email });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a fresh confirmation link to the signed-in user
// @route   POST /api/auth/resend-verification
// @access  Private (Protected)
export const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'Your email is already confirmed' });
    }

    const verification = createVerificationToken();
    await User.findByIdAndUpdate(user._id, {
      emailVerifyToken: verification.hashed,
      emailVerifyExpires: verification.expires,
    });

    try {
      await sendVerificationEmail(user, verification.raw);
    } catch (err) {
      res.status(500);
      throw new Error('Email could not be sent. Please try again later.');
    }

    res.status(200).json({ message: `Confirmation link sent to ${user.email}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const verification = createVerificationToken();

    const user = await User.create({
      name,
      email,
      password,
      emailVerifyToken: verification.hashed,
      emailVerifyExpires: verification.expires,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    // Signing up doesn't wait on the email; the account works either way and
    // the link can be re-sent from the dashboard.
    if (env.NODE_ENV !== 'test') {
      sendVerificationEmail(user, verification.raw).catch((err) => {
        console.error('[Auth] Could not send verification email:', err.message);
      });
    }

    // Convert to object and delete select: false fields just in case
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerifyToken;
    delete userResponse.emailVerifyExpires;

    res.status(201).json({
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendRefreshTokenCookie(res, refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401);
      throw new Error('Refresh token not found');
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }

      const accessToken = generateAccessToken(user._id);

      res.status(200).json({
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          defaultCurrency: user.defaultCurrency,
          isVerified: user.isVerified,
        },
      });
    } catch (err) {
      res.status(401);
      throw new Error('Refresh token invalid or expired');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  try {
    clearRefreshTokenCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reset password token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please enter email');
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token details with 1 hour expiration
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: Date.now() + 60 * 60 * 1000,
    });

    // Create reset URL
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) have requested the reset of a password.</p>
      <p>Please click on the link below, or paste it into your browser to complete the process within 1 hour:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'SettleUp - Password Reset Token',
        html: message,
      });

      res.status(200).json({ message: 'Email sent successfully with reset link' });
    } catch (err) {
      // Clear token details if email send fails
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });

      res.status(500);
      throw new Error('Email could not be sent. Please try again later.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const resetToken = req.params.token;

    if (!newPassword || newPassword.length < 8) {
      res.status(400);
      throw new Error('Please enter a password with at least 8 characters');
    }

    // Hash token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired password reset token');
    }

    // Set new password (will trigger Mongoose pre-save bcrypt hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private (Protected)
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private (Protected)
export const updateMe = async (req, res, next) => {
  try {
    const { name, avatar, defaultCurrency } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (defaultCurrency !== undefined) user.defaultCurrency = defaultCurrency;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};
