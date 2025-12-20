const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/menu
 * @desc Get menu items for mobile app
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const { user } = req;

  const where = {
    organizationId: user?.organizationId,
    isActive: true,
    deletedAt: null
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      category: true,
      imageUrl: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      allergens: true,
      nutritionalInfo: true
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // Group by category for mobile display
  const menuByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      menuItems,
      menuByCategory,
      categories: Object.keys(menuByCategory)
    }
  });
}));

module.exports = router;