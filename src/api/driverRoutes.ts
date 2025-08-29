import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { DriverService } from '../services/driverService.js';
import type { DriverCreationData } from '../services/driverService.js';

const router = Router();
const driverService = new DriverService();

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/drivers
router.post(
  '/',
  // Цепочка правил валидации
  body('personalData.lastName', 'Фамилия обязательна').notEmpty().isString(),
  body('personalData.firstName', 'Имя обязательно').notEmpty().isString(),
  body('personalData.birthDate', 'Некорректная дата рождения').isISO8601().toDate(),
  body('passport.series', 'Серия паспорта обязательна').notEmpty().isString(),
  body('passport.number', 'Номер паспорта обязателен').notEmpty().isString(),
  body('passport.issuedBy', 'Кем выдан паспорт - обязательно').notEmpty().isString(),
  body('passport.issueDate', 'Некорректная дата выдачи паспорта').isISO8601().toDate(),
  body('passport.departmentCode', 'Код подразделения обязателен').notEmpty().isString(),
  
  body('vehicle.make', 'Марка ТС обязательна').notEmpty().isString(),
  body('vehicle.model', 'Модель ТС обязательна').notEmpty().isString(),
  body('vehicle.licensePlate', 'Рег. знак обязателен').notEmpty().isString(),
  body('vehicle.vin', 'VIN обязателен').notEmpty().isString(),
  body('vehicle.year', 'Год выпуска должен быть числом').notEmpty().isInt(),
  body('vehicle.bodyColor', 'Цвет кузова обязателен').notEmpty().isString(),
  body('vehicle.ptsNumber', 'Номер ПТС обязателен').notEmpty().isString(),
  body('vehicle.stsNumber', 'Номер СТС обязателен').notEmpty().isString(),
  body('vehicle.stsIssueInfo', 'Информация о выдаче СТС обязательна').notEmpty().isString(),

  handleValidationErrors,

  async (req, res) => {
    try {
      const driverData: DriverCreationData = req.body;
      const newDriver = await driverService.createDriver(driverData);
      res.status(201).json(newDriver);
    } catch (error) {
      console.error('Ошибка при создании водителя:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  }
);

export default router;
