const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/analytics/dashboard
 * @desc Get mobile dashboard analytics
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { user } = req;
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get today's stats
  const [
    todayReservations,
    todayOrders,
    weeklyReservations,
    weeklyOrders
  ] = await Promise.all([
    prisma.reservation.count({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: startOfDay },
        deletedAt: null
      }
    }),
    prisma.order.count({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: startOfDay },
        deletedAt: null
      }
    }),
    prisma.reservation.count({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: startOfWeek },
        deletedAt: null
      }
    }),
    prisma.order.count({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: startOfWeek },
        deletedAt: null
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      today: {
        reservations: todayReservations,
        orders: todayOrders
      },
      thisWeek: {
        reservations: weeklyReservations,
        orders: weeklyOrders
      }
    }
  });
}));

module.exports = router;