// src/api/scheduleRoutes.ts
import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ScheduleService } from '../services/scheduleService.js';
import type { ScheduleStatus } from '../models/Schedule.js';

export function createScheduleRouter(scheduleService: ScheduleService) {
  const router = Router();

  // Валидация для создания графика
  const createScheduleValidation = [
    body('driver_id').isInt({ min: 1 }).withMessage('ID водителя должен быть положительным числом'),
    body('date').isISO8601().withMessage('Дата должна быть в формате YYYY-MM-DD'),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время начала должно быть в формате HH:MM'),
    body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время окончания должно быть в формате HH:MM'),
    body('status').isIn(['working', 'off', 'repair', 'reserve', 'vacation', 'loading']).withMessage('Неверный статус'),
    body('route_info').optional().isString().isLength({ max: 500 }).withMessage('Информация о маршруте не более 500 символов'),
    body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Заметки не более 1000 символов')
  ];

  // Валидация для обновления графика
  const updateScheduleValidation = [
    param('id').isInt({ min: 1 }).withMessage('ID графика должен быть положительным числом'),
    body('date').optional().isISO8601().withMessage('Дата должна быть в формате YYYY-MM-DD'),
    body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время начала должно быть в формате HH:MM'),
    body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время окончания должно быть в формате HH:MM'),
    body('status').optional().isIn(['working', 'off', 'repair', 'reserve', 'vacation', 'loading']).withMessage('Неверный статус'),
    body('route_info').optional().isString().isLength({ max: 500 }).withMessage('Информация о маршруте не более 500 символов'),
    body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Заметки не более 1000 символов')
  ];

  // Валидация для фильтров
  const scheduleFiltersValidation = [
    query('driver_id').optional().isInt({ min: 1 }).withMessage('ID водителя должен быть положительным числом'),
    query('date_from').optional().isISO8601().withMessage('Дата начала должна быть в формате YYYY-MM-DD'),
    query('date_to').optional().isISO8601().withMessage('Дата окончания должна быть в формате YYYY-MM-DD'),
    query('status').optional().isIn(['working', 'off', 'repair', 'reserve', 'vacation', 'loading']).withMessage('Неверный статус'),
    query('page').optional().isInt({ min: 1 }).withMessage('Номер страницы должен быть положительным числом'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Лимит должен быть от 1 до 100')
  ];

  // Создание графика
  router.post('/', createScheduleValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedule = await scheduleService.createSchedule(req.body);
      res.status(201).json({ 
        success: true, 
        data: schedule 
      });
    } catch (error: any) {
      console.error('Ошибка создания графика:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Получение графика по ID
  router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID графика должен быть положительным числом')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedule = await scheduleService.getScheduleById(parseInt(req.params.id));
      
      if (!schedule) {
        return res.status(404).json({ 
          success: false, 
          error: 'График не найден' 
        });
      }

      res.json({ 
        success: true, 
        data: schedule 
      });
    } catch (error: any) {
      console.error('Ошибка получения графика:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Получение списка графиков с фильтрами
  router.get('/', scheduleFiltersValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const filters = {
        driver_id: req.query.driver_id ? parseInt(req.query.driver_id as string) : undefined,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        status: req.query.status as ScheduleStatus,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const result = await scheduleService.getSchedules(filters);
      
      res.json({ 
        success: true, 
        data: result.schedules,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit)
        }
      });
    } catch (error: any) {
      console.error('Ошибка получения графиков:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Обновление графика
  router.put('/:id', updateScheduleValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedule = await scheduleService.updateSchedule(parseInt(req.params.id), req.body);
      res.json({ 
        success: true, 
        data: schedule 
      });
    } catch (error: any) {
      if (error.message.includes('не найден')) {
        return res.status(404).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      console.error('Ошибка обновления графика:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Удаление графика
  router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID графика должен быть положительным числом')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      await scheduleService.deleteSchedule(parseInt(req.params.id));
      res.json({ 
        success: true, 
        message: 'График успешно удален' 
      });
    } catch (error: any) {
      if (error.message.includes('не найден')) {
        return res.status(404).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      console.error('Ошибка удаления графика:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Получение текущих графиков (сейчас работающие водители)
  router.get('/current/active', async (req, res) => {
    try {
      const schedules = await scheduleService.getCurrentSchedules();
      res.json({ 
        success: true, 
        data: schedules 
      });
    } catch (error: any) {
      console.error('Ошибка получения текущих графиков:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Получение календаря на месяц
  router.get('/calendar/:year/:month', [
    param('year').isInt({ min: 2020, max: 2030 }).withMessage('Год должен быть от 2020 до 2030'),
    param('month').isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const calendar = await scheduleService.getCalendarMonth(
        parseInt(req.params.year), 
        parseInt(req.params.month)
      );
      
      res.json({ 
        success: true, 
        data: calendar 
      });
    } catch (error: any) {
      console.error('Ошибка получения календаря:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Получение графика водителя
  router.get('/driver/:driverId', [
    param('driverId').isInt({ min: 1 }).withMessage('ID водителя должен быть положительным числом'),
    query('date_from').isISO8601().withMessage('Дата начала должна быть в формате YYYY-MM-DD'),
    query('date_to').isISO8601().withMessage('Дата окончания должна быть в формате YYYY-MM-DD')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedules = await scheduleService.getDriverSchedule(
        parseInt(req.params.driverId),
        req.query.date_from as string,
        req.query.date_to as string
      );
      
      res.json({ 
        success: true, 
        data: schedules 
      });
    } catch (error: any) {
      console.error('Ошибка получения графика водителя:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Массовое создание графиков
  router.post('/bulk', [
    body('schedules').isArray({ min: 1 }).withMessage('Должен быть массив графиков'),
    body('schedules.*.driver_id').isInt({ min: 1 }).withMessage('ID водителя должен быть положительным числом'),
    body('schedules.*.date').isISO8601().withMessage('Дата должна быть в формате YYYY-MM-DD'),
    body('schedules.*.start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время начала должно быть в формате HH:MM'),
    body('schedules.*.end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Время окончания должно быть в формате HH:MM'),
    body('schedules.*.status').isIn(['working', 'off', 'repair', 'reserve', 'vacation', 'loading']).withMessage('Неверный статус')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedules = await scheduleService.bulkCreateSchedules(req.body.schedules);
      res.status(201).json({ 
        success: true, 
        data: schedules 
      });
    } catch (error: any) {
      console.error('Ошибка массового создания графиков:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  // Копирование недельного графика
  router.post('/copy-week', [
    body('source_date').isISO8601().withMessage('Дата источника должна быть в формате YYYY-MM-DD'),
    body('target_date').isISO8601().withMessage('Целевая дата должна быть в формате YYYY-MM-DD'),
    body('driver_ids').optional().isArray().withMessage('ID водителей должны быть массивом'),
    body('driver_ids.*').optional().isInt({ min: 1 }).withMessage('ID водителя должен быть положительным числом')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const schedules = await scheduleService.copyWeekSchedule(
        req.body.source_date,
        req.body.target_date,
        req.body.driver_ids
      );
      
      res.status(201).json({ 
        success: true, 
        data: schedules 
      });
    } catch (error: any) {
      console.error('Ошибка копирования недельного графика:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      });
    }
  });

  return router;
}
