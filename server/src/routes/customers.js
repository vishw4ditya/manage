const express = require('express');
const { z } = require('zod');
const { authenticate, requireRoles } = require('../middleware/auth');
const Customer = require('../models/Customer');

const router = express.Router();

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(7),
  location: z.object({
    type: z.literal('Point').optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
  capturedAt: z.string().datetime().optional(),
});

// POST /api/customers
router.post(
  '/',
  authenticate,
  requireRoles('SALESMAN', 'TECHNICIAN'),
  async (req, res, next) => {
    try {
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() });
      }

      const { name, mobile, location, capturedAt } = parsed.data;

      const customer = new Customer({
        name,
        mobile,
        location: location
          ? { type: 'Point', coordinates: location.coordinates || [0, 0] }
          : undefined,
        capturedAt: capturedAt ? new Date(capturedAt) : undefined,
        createdByUserId: req.user.id,
        zoneId: req.user.zoneId || undefined,
        branchId: req.user.branchId || undefined,
      });

      await customer.save();
      return res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/customers
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
    } else {
      // SALESMAN / TECHNICIAN see only own records
      filter.createdByUserId = id;
    }

    const customers = await Customer.find(filter)
      .populate('createdByUserId', 'name employeeId')
      .populate('zoneId', 'name')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return res.json(customers);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
