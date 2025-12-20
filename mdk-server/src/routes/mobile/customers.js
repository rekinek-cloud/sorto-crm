const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/customers
 * @desc Get customers for mobile app
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const { user } = req;

  const skip = (page - 1) * limit;
  const take = Math.min(parseInt(limit), 50);

  const where = {
    organizationId: user.organizationId,
    deletedAt: null
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyLevel: true,
        totalVisits: true,
        totalSpent: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      customers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: page > 1
      }
    }
  });
}));

module.exports = router;