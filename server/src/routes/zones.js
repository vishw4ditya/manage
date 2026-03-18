const express = require('express');
const { z } = require('zod');
const { authenticate, requireRoles } = require('../middleware/auth');
const Zone = require('../models/Zone');

const router = express.Router();

const zoneSchema = z.object({
  name: z.string().min(1),
  rmUserId: z.string().optional(),
});

// GET /api/zones
router.get('/', authenticate, async (req, res, next) => {
  try {
    const zones = await Zone.find().populate('rmUserId', 'name mobile employeeId');
    return res.json(zones);
  } catch (err) {
    next(err);
  }
});

// POST /api/zones
router.post('/', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const parsed = zoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const zone = new Zone(parsed.data);
    await zone.save();
    return res.status(201).json(zone);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Zone name already exists' });
    }
    next(err);
  }
});

// PUT /api/zones/:id
router.put('/:id', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const parsed = zoneSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
    }

    const zone = await Zone.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    return res.json(zone);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Zone name already exists' });
    }
    next(err);
  }
});

// DELETE /api/zones/:id
router.delete('/:id', authenticate, requireRoles('OWNER'), async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    return res.json({ message: 'Zone deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
