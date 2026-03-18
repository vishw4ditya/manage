const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { generateEmployeeId } = require('../utils/employeeId');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(7),
  password: z.string().min(6),
  role: z.enum(['OWNER', 'REGIONAL_MANAGER', 'MANAGER', 'SALESMAN', 'TECHNICIAN']),
  zoneId: z.string().optional(),
  branchId: z.string().optional(),
});

const loginSchema = z.object({
  mobile: z.string().min(1),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  employeeId: z.string().min(1),
});

const resetSchema = z.object({
  employeeId: z.string().min(1),
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const { name, mobile, password, role, zoneId, branchId } = parsed.data;

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(409).json({ message: 'Mobile number already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const employeeId = await generateEmployeeId();

    const isOwner = role === 'OWNER';
    const ownerExists = await User.findOne({ role: 'OWNER' });

    // Only one OWNER allowed; first OWNER auto-approved
    if (isOwner && ownerExists) {
      return res.status(409).json({ message: 'An owner already exists' });
    }

    const user = new User({
      name,
      mobile,
      passwordHash,
      role,
      employeeId,
      zoneId: zoneId || undefined,
      branchId: branchId || undefined,
      status: isOwner ? 'APPROVED' : 'PENDING',
      approvedAt: isOwner ? new Date() : undefined,
    });

    await user.save();

    return res.status(201).json({
      message: isOwner
        ? 'Owner account created and approved'
        : 'Registration successful. Awaiting approval.',
      employeeId,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const { mobile, password } = parsed.data;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'APPROVED') {
      const msgs = {
        PENDING: 'Your account is pending approval',
        REJECTED: 'Your account has been rejected',
      };
      return res.status(403).json({ message: msgs[user.status] || 'Account not approved' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        zoneId: user.zoneId,
        branchId: user.branchId,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        employeeId: user.employeeId,
        zoneId: user.zoneId,
        branchId: user.branchId,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const { employeeId } = parsed.data;
    const user = await User.findOne({ employeeId });
    if (!user) {
      // Return generic message to avoid user enumeration
      return res.json({ message: 'If that employee ID exists, a reset token has been issued.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const response = { message: 'If that employee ID exists, a reset token has been issued.' };

    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = rawToken;
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const { employeeId, token, newPassword } = parsed.data;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      employeeId,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
