import { Router } from 'express';
import { TripService } from '../services/tripService.js';
import type { Trip, TripStatus } from '../models/Trip.js';

const router = Router();
const tripService = new TripService();

/**
 * @route POST /api/trips
 * @desc Создать новый рейс
 * @access Public (временно, потом добавить аутентификацию)
 */
router.post('/', async (req, res) => {
  try {
    const { driver_id, delivery_id, route_info, status, notes } = req.body;

    // Валидация обязательных полей
    if (!driver_id || !route_info) {
      return res.status(400).json({
        success: false,
        error: 'driver_id и route_info обязательны'
      });
    }

    // Проверяем статус
    const validStatuses = ['review', 'with_driver', 'rework', 'lost', 'verified'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`
      });
    }

    const tripData = {
      driver_id: parseInt(driver_id),
      delivery_id: delivery_id ? parseInt(delivery_id) : null,
      route_info,
      status: (status as TripStatus) || 'review',
      notes: notes || null
    };

    const newTrip = await tripService.createTrip(tripData);

    res.status(201).json({
      success: true,
      data: newTrip,
      message: 'Рейс успешно создан'
    });

  } catch (error: any) {
    console.error('Ошибка создания рейса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trips
 * @desc Получить список всех рейсов
 * @access Public (временно)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, driver_id } = req.query;
    
    let trips = await tripService.getAllTrips();
    
    // Фильтрация по статусу
    if (status) {
      trips = trips.filter(trip => trip.status === status);
    }
    
    // Фильтрация по водителю
    if (driver_id) {
      trips = trips.filter(trip => trip.driver_id === parseInt(driver_id as string));
    }
    
    // Пагинация
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTrips = trips.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedTrips,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: trips.length,
        totalPages: Math.ceil(trips.length / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Ошибка получения рейсов:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trips/:id
 * @desc Получить рейс по ID
 * @access Public (временно)
 */
router.get('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный ID рейса'
      });
    }

    const trip = await tripService.getTripById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Рейс не найден'
      });
    }

    res.json({
      success: true,
      data: trip
    });

  } catch (error: any) {
    console.error('Ошибка получения рейса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route GET /api/trips/driver/:driverId
 * @desc Получить все рейсы конкретного водителя
 * @access Public (временно)
 */
router.get('/driver/:driverId', async (req, res) => {
  try {
    const driverId = parseInt(req.params.driverId);
    
    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный ID водителя'
      });
    }

    const trips = await tripService.getTripsByDriver(driverId);
    
    res.json({
      success: true,
      data: trips,
      count: trips.length
    });

  } catch (error: any) {
    console.error('Ошибка получения рейсов водителя:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/trips/:id/status
 * @desc Сменить статус рейса
 * @access Public (временно)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный ID рейса'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус обязателен'
      });
    }

    const validStatuses = ['review', 'with_driver', 'rework', 'lost', 'verified'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`
      });
    }

    const updatedTrip = await tripService.updateTripStatus(tripId, status as TripStatus);
    
    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        error: 'Рейс не найден'
      });
    }

    res.json({
      success: true,
      data: updatedTrip,
      message: 'Статус рейса успешно обновлен'
    });

  } catch (error: any) {
    console.error('Ошибка обновления статуса рейса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/trips/:id
 * @desc Обновить рейс
 * @access Public (временно)
 */
router.put('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const { driver_id, delivery_id, route_info, status, notes } = req.body;
    
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный ID рейса'
      });
    }

    const updateData: Partial<Trip> = {};
    
    if (driver_id !== undefined) updateData.driver_id = parseInt(driver_id);
    if (delivery_id !== undefined) updateData.delivery_id = delivery_id ? parseInt(delivery_id) : null;
    if (route_info !== undefined) updateData.route_info = route_info;
    if (status !== undefined) updateData.status = status as TripStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updatedTrip = await tripService.updateTrip(tripId, updateData);
    
    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        error: 'Рейс не найден'
      });
    }

    res.json({
      success: true,
      data: updatedTrip,
      message: 'Рейс успешно обновлен'
    });

  } catch (error: any) {
    console.error('Ошибка обновления рейса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/trips/:id
 * @desc Удалить рейс
 * @access Public (временно)
 */
router.delete('/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный ID рейса'
      });
    }

    const deleted = await tripService.deleteTrip(tripId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Рейс не найден'
      });
    }

    res.json({
      success: true,
      message: 'Рейс успешно удален'
    });

  } catch (error: any) {
    console.error('Ошибка удаления рейса:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error.message
    });
  }
});

export default router;
