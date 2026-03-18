const express = require('express');
const { z } = require('zod');
const { authenticate, requireRoles } = require('../middleware/auth');
const Service = require('../models/Service');

const router = express.Router();

const serviceSchema = z.object({
  customerName: z.string().min(1),
  mobile: z.string().optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
  location: z.object({
    type: z.literal('Point').optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
  capturedAt: z.string().datetime().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']),
});

// POST /api/services
router.post(
  '/',
  authenticate,
  requireRoles('TECHNICIAN'),
  async (req, res, next) => {
    try {
      const parsed = serviceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
      }

      const { customerName, mobile, title, notes, status, location, capturedAt } = parsed.data;

      const service = new Service({
        customerName,
        mobile,
        title,
        notes,
        status,
        location: location
          ? { type: 'Point', coordinates: location.coordinates || [0, 0] }
          : undefined,
        capturedAt: capturedAt ? new Date(capturedAt) : undefined,
        createdByUserId: req.user.id,
        zoneId: req.user.zoneId || undefined,
        branchId: req.user.branchId || undefined,
      });

      await service.save();
      return res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/services
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role, zoneId, branchId, id } = req.user;
    let filter = {};

    if (role === 'OWNER') {
      // all records
    } else if (role === 'REGIONAL_MANAGER') {
      filter.zoneId = zoneId;
    } else if (role === 'MANAGER') {
      filter.branchId = branchId;
    } else if (role === 'TECHNICIAN') {
      filter.createdByUserId = id;
    } else {
      // SALESMAN has no service access
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const services = await Service.find(filter)
      .populate('createdByUserId', 'name employeeId')
      .populate('zoneId', 'name')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return res.json(services);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
