const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../../middleware/errorHandler');
const { versioningMiddleware } = require('../../middleware/sync');
const socketService = require('../../services/socket');
const pushNotificationService = require('../../services/pushNotification');
const logger = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/mobile/reservations
 * @desc Get paginated reservations with mobile optimizations
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, date, search } = req.query;
  const { user } = req;

  const skip = (page - 1) * limit;
  const take = Math.min(parseInt(limit), 50); // Max 50 items per page

  // Build where clause
  const where = {
    organizationId: user.organizationId,
    deletedAt: null
  };

  if (status) where.status = status;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    where.reservationDate = { gte: startDate, lt: endDate };
  }
  if (search) {
    where.OR = [
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Get reservations with minimal data for mobile
  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        partySize: true,
        reservationDate: true,
        reservationTime: true,
        status: true,
        specialRequests: true,
        table: {
          select: {
            id: true,
            number: true,
            section: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            loyaltyLevel: true
          }
        },
        version: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { reservationDate: 'desc' },
        { reservationTime: 'desc' }
      ]
    }),
    prisma.reservation.count({ where })
  ]);

  // Mobile-optimized response
  res.json({
    success: true,
    data: {
      reservations: reservations.map(reservation => ({
        ...reservation,
        // Add computed fields for mobile UI
        displayTime: formatTimeForMobile(reservation.reservationTime),
        displayDate: formatDateForMobile(reservation.reservationDate),
        statusColor: getStatusColor(reservation.status),
        isToday: isToday(reservation.reservationDate),
        isPast: isPast(reservation.reservationDate, reservation.reservationTime)
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: page > 1
      }
    },
    meta: {
      serverTime: new Date().toISOString(),
      cacheKey: `reservations_${user.organizationId}_${page}_${JSON.stringify(where)}`
    }
  });
}));

/**
 * @route GET /api/v1/mobile/reservations/:id
 * @desc Get single reservation with full details
 */
router.get('/:id', versioningMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: id,
      organizationId: user.organizationId,
      deletedAt: null
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          loyaltyLevel: true,
          preferences: true,
          allergies: true,
          notes: true
        }
      },
      table: {
        select: {
          id: true,
          number: true,
          section: true,
          capacity: true,
          features: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!reservation) {
    return res.status(404).json({
      success: false,
      error: 'Reservation not found',
      code: 'RESERVATION_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: {
      ...reservation,
      displayTime: formatTimeForMobile(reservation.reservationTime),
      displayDate: formatDateForMobile(reservation.reservationDate),
      statusColor: getStatusColor(reservation.status),
      canModify: canModifyReservation(reservation),
      canCancel: canCancelReservation(reservation)
    }
  });
}));

/**
 * @route POST /api/v1/mobile/reservations
 * @desc Create new reservation with mobile optimizations
 */
router.post('/', asyncHandler(async (req, res) => {
  const { user } = req;
  const {
    customerName,
    customerEmail,
    customerPhone,
    partySize,
    reservationDate,
    reservationTime,
    specialRequests,
    tableId,
    customerId
  } = req.body;

  // Validate required fields
  if (!customerName || !partySize || !reservationDate || !reservationTime) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Check table availability if specified
  if (tableId) {
    const isAvailable = await checkTableAvailability(
      tableId, 
      reservationDate, 
      reservationTime, 
      user.organizationId
    );
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Table not available at requested time',
        code: 'TABLE_NOT_AVAILABLE'
      });
    }
  }

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      customerName,
      customerEmail,
      customerPhone,
      partySize: parseInt(partySize),
      reservationDate: new Date(reservationDate),
      reservationTime,
      specialRequests,
      status: 'PENDING',
      organizationId: user.organizationId,
      userId: user.id,
      customerId: customerId || null,
      tableId: tableId || null,
      version: 1
    },
    include: {
      customer: true,
      table: true
    }
  });

  // Send real-time notification
  socketService.emitToOrganization(
    user.organizationId,
    'reservation_created',
    {
      reservation: reservation,
      createdBy: user.name
    },
    user.id
  );

  // Send push notification to staff
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    await pushNotificationService.sendToOrganization(
      user.organizationId,
      {
        title: 'New Reservation',
        body: `${customerName} for ${partySize} people`,
        data: { reservationId: reservation.id }
      },
      user.id
    );
  }

  logger.info(`Reservation created: ${reservation.id} by user ${user.id}`);

  res.status(201).json({
    success: true,
    data: {
      ...reservation,
      displayTime: formatTimeForMobile(reservation.reservationTime),
      displayDate: formatDateForMobile(reservation.reservationDate),
      statusColor: getStatusColor(reservation.status)
    }
  });
}));

/**
 * @route PUT /api/v1/mobile/reservations/:id
 * @desc Update reservation with conflict resolution
 */
router.put('/:id', versioningMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;

  // Get current reservation
  const currentReservation = await prisma.reservation.findFirst({
    where: {
      id: id,
      organizationId: user.organizationId,
      deletedAt: null
    }
  });

  if (!currentReservation) {
    return res.status(404).json({
      success: false,
      error: 'Reservation not found',
      code: 'RESERVATION_NOT_FOUND'
    });
  }

  // Check if user can modify this reservation
  if (!canModifyReservation(currentReservation, user)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to modify this reservation',
      code: 'NOT_AUTHORIZED'
    });
  }

  // Update reservation
  const updatedReservation = await prisma.reservation.update({
    where: { id: id },
    data: {
      ...updateData,
      version: currentReservation.version + 1,
      updatedAt: new Date()
    },
    include: {
      customer: true,
      table: true
    }
  });

  // Send real-time notification
  socketService.emitToOrganization(
    user.organizationId,
    'reservation_updated',
    {
      reservation: updatedReservation,
      updatedBy: user.name,
      changes: getChangedFields(currentReservation, updateData)
    },
    user.id
  );

  res.json({
    success: true,
    data: {
      ...updatedReservation,
      displayTime: formatTimeForMobile(updatedReservation.reservationTime),
      displayDate: formatDateForMobile(updatedReservation.reservationDate),
      statusColor: getStatusColor(updatedReservation.status)
    }
  });
}));

/**
 * @route PATCH /api/v1/mobile/reservations/:id/status
 * @desc Update reservation status (mobile optimized)
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const { user } = req;

  const validStatuses = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
      code: 'INVALID_STATUS'
    });
  }

  const reservation = await prisma.reservation.update({
    where: {
      id: id,
      organizationId: user.organizationId
    },
    data: {
      status,
      statusNote: note,
      version: { increment: 1 },
      updatedAt: new Date(),
      ...(status === 'SEATED' && { seatedAt: new Date() }),
      ...(status === 'COMPLETED' && { completedAt: new Date() })
    },
    include: {
      customer: true,
      table: true
    }
  });

  // Send real-time update
  socketService.emitToOrganization(
    user.organizationId,
    'reservation_status_updated',
    {
      reservationId: reservation.id,
      status: status,
      updatedBy: user.name
    }
  );

  // Send push notification to customer if available
  if (reservation.customerId) {
    const template = pushNotificationService.getNotificationTemplates().reservation;
    let notification;
    
    switch (status) {
      case 'CONFIRMED':
        notification = template.confirmed;
        break;
      case 'CANCELLED':
        notification = template.cancelled;
        break;
    }
    
    if (notification) {
      await pushNotificationService.sendToUser(reservation.customerId, {
        ...notification,
        data: { reservationId: reservation.id }
      });
    }
  }

  res.json({
    success: true,
    data: {
      ...reservation,
      statusColor: getStatusColor(reservation.status)
    }
  });
}));

/**
 * @route DELETE /api/v1/mobile/reservations/:id
 * @desc Soft delete reservation
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const reservation = await prisma.reservation.update({
    where: {
      id: id,
      organizationId: user.organizationId
    },
    data: {
      deletedAt: new Date(),
      version: { increment: 1 }
    }
  });

  // Send real-time notification
  socketService.emitToOrganization(
    user.organizationId,
    'reservation_deleted',
    {
      reservationId: reservation.id,
      deletedBy: user.name
    }
  );

  res.json({
    success: true,
    message: 'Reservation deleted successfully'
  });
}));

// Helper functions
function formatTimeForMobile(time) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateForMobile(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusColor(status) {
  const colors = {
    PENDING: '#FFA500',
    CONFIRMED: '#4CAF50',
    SEATED: '#2196F3',
    COMPLETED: '#9C27B0',
    CANCELLED: '#F44336',
    NO_SHOW: '#607D8B'
  };
  return colors[status] || '#757575';
}

function isToday(date) {
  const today = new Date();
  const reservationDate = new Date(date);
  return today.toDateString() === reservationDate.toDateString();
}

function isPast(date, time) {
  const reservationDateTime = new Date(`${date}T${time}`);
  return reservationDateTime < new Date();
}

function canModifyReservation(reservation, user = null) {
  if (reservation.status === 'COMPLETED' || reservation.status === 'CANCELLED') {
    return false;
  }
  
  if (user && user.role === 'STAFF' && reservation.userId !== user.id) {
    return false;
  }
  
  return true;
}

function canCancelReservation(reservation) {
  return !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status);
}

async function checkTableAvailability(tableId, date, time, organizationId) {
  const reservationDateTime = new Date(`${date}T${time}`);
  const bufferMinutes = 120; // 2 hours buffer
  
  const startTime = new Date(reservationDateTime.getTime() - bufferMinutes * 60000);
  const endTime = new Date(reservationDateTime.getTime() + bufferMinutes * 60000);

  const conflictingReservations = await prisma.reservation.count({
    where: {
      tableId: tableId,
      organizationId: organizationId,
      status: { in: ['CONFIRMED', 'SEATED'] },
      reservationDate: new Date(date),
      reservationTime: {
        gte: startTime.toTimeString().split(' ')[0],
        lte: endTime.toTimeString().split(' ')[0]
      },
      deletedAt: null
    }
  });

  return conflictingReservations === 0;
}

function getChangedFields(original, updates) {
  const changes = [];
  for (const [key, value] of Object.entries(updates)) {
    if (original[key] !== value) {
      changes.push({ field: key, oldValue: original[key], newValue: value });
    }
  }
  return changes;
}

module.exports = router;