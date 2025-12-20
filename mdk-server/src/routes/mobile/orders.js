const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/orders
 * @desc Get orders for mobile app
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { user } = req;

  const skip = (page - 1) * limit;
  const take = Math.min(parseInt(limit), 50);

  const where = {
    organizationId: user.organizationId,
    deletedAt: null
  };

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        orderType: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
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