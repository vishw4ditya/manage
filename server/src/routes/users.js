const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Helpers for scope-based queries
function buildScopeFilter(requestingUser) {
  const { role, zoneId, branchId, id } = requestingUser;
  if (role === 'OWNER') return {};
  if (role === 'REGIONAL_MANAGER') return { zoneId };
  if (role === 'MANAGER') return { branchId };
  return { _id: id };
}

function canApprove(requestingUser, targetUser) {
  const { role, zoneId, branchId } = requestingUser;

  if (role === 'OWNER') return true;

  const subordinateRoles = ['MANAGER', 'SALESMAN', 'TECHNICIAN'];
  if (role === 'REGIONAL_MANAGER') {
    return (
      subordinateRoles.includes(targetUser.role) &&
      String(targetUser.zoneId) === String(zoneId)
    );
  }

  if (role === 'MANAGER') {
    return (
      ['SALESMAN', 'TECHNICIAN'].includes(targetUser.role) &&
      String(targetUser.branchId) === String(branchId)
    );
  }

  return false;
}

// GET /api/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .populate('zoneId', 'name')
      .populate('branchId', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/pending
router.get('/pending', authenticate, async (req, res, next) => {
  try {
    const { role, zoneId, branchId } = req.user;

    let filter = { status: 'PENDING' };

    if (role === 'OWNER') {
      // no additional filter
    } else if (role === 'REGIONAL_MANAGER') {
      filter.role = { $in: ['MANAGER', 'SALESMAN', 'TECHNICIAN'] };
      filter.zoneId = zoneId;
    } else if (role === 'MANAGER') {
      filter.role = { $in: ['SALESMAN', 'TECHNICIAN'] };
      filter.branchId = branchId;
    } else {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const users = await User.find(filter)
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .populate('zoneId', 'name')
      .populate('branchId', 'name');

    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/approve
router.patch('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.status !== 'PENDING') {
      return res.status(400).json({ message: 'User is not in PENDING status' });
    }

    if (!canApprove(req.user, target)) {
      return res.status(403).json({ message: 'Insufficient permissions to approve this user' });
    }

    target.status = 'APPROVED';
    target.approvedBy = req.user.id;
    target.approvedAt = new Date();
    await target.save();

    return res.json({ message: 'User approved', user: { id: target._id, status: target.status } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/reject
router.patch('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.status !== 'PENDING') {
      return res.status(400).json({ message: 'User is not in PENDING status' });
    }

    if (!canApprove(req.user, target)) {
      return res.status(403).json({ message: 'Insufficient permissions to reject this user' });
    }

    target.status = 'REJECTED';
    // approvedBy/approvedAt track whoever reviewed (approved or rejected) the request
    target.approvedBy = req.user.id;
    target.approvedAt = new Date();
    await target.save();

    return res.json({ message: 'User rejected', user: { id: target._id, status: target.status } });
  } catch (err) {
    next(err);
  }
});

// GET /api/users
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = { status: 'APPROVED', ...buildScopeFilter(req.user) };

    const users = await User.find(filter)
      .select('-passwordHash -resetToken -resetTokenExpiry')
      .populate('zoneId', 'name')
      .populate('branchId', 'name');

    return res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
