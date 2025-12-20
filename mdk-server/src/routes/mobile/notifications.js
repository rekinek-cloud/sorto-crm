const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/notifications
 * @desc Get notifications for mobile app
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { user } = req;

  const skip = (page - 1) * limit;
  const take = Math.min(parseInt(limit), 50);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { organizationId: user.organizationId, userId: null }
        ],
        deletedAt: null
      },
      skip,
      take,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        data: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({
      where: {
        OR: [
          { userId: user.id },
          { organizationId: user.organizationId, userId: null }
        ],
        deletedAt: null
      }
    })
  ]);

  const unreadCount = await prisma.notification.count({
    where: {
      OR: [
        { userId: user.id },
        { organizationId: user.organizationId, userId: null }
      ],
      isRead: false,
      deletedAt: null
    }
  });

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
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

/**
 * @route PATCH /api/v1/mobile/notifications/:id/read
 * @desc Mark notification as read
 */
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  await prisma.notification.updateMany({
    where: {
      id: id,
      OR: [
        { userId: user.id },
        { organizationId: user.organizationId, userId: null }
      ]
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

module.exports = router;