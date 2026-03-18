const express = require('express');
const { z } = require('zod');
const { authenticate, requireRoles } = require('../middleware/auth');
const Branch = require('../models/Branch');

const router = express.Router();

const branchSchema = z.object({
  name: z.string().min(1),
  zoneId: z.string().min(1),
  managerUserId: z.string().optional(),
});

const branchUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  zoneId: z.string().min(1).optional(),
  managerUserId: z.string().optional(),
});

// GET /api/branches
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.zoneId) filter.zoneId = req.query.zoneId;

    const branches = await Branch.find(filter)
      .populate('zoneId', 'name')
      .populate('managerUserId', 'name mobile employeeId');
    return res.json(branches);
  } catch (err) {
    next(err);
  }
});

// POST /api/branches
router.post('/', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const parsed = branchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const branch = new Branch(parsed.data);
    await branch.save();
    return res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
});

// PUT /api/branches/:id
router.put('/:id', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const parsed = branchUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const branch = await Branch.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    return res.json(branch);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/branches/:id
router.delete('/:id', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    return res.json({ message: 'Branch deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
