import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DriverService } from '../services/driverService.js';
import { generateLeaseAgreement } from '../services/documentService.js';
import type { NewDriver } from '../models/Driver.js';

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Фабрика для создания роутера с инъекцией зависимости
export const createDriverRouter = (driverService: DriverService): Router => {
  const router = Router();

  // GET /api/drivers/:id/documents/lease_agreement
  router.get(
    '/:id/documents/lease_agreement',
    param('id', 'ID должен быть числом').isInt(),
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const driverId = parseInt(req.params.id, 10);
        const docBuffer = await generateLeaseAgreement(driverId, driverService);

        res.setHeader('Content-Disposition', `attachment; filename="lease_agreement_${driverId}.docx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(docBuffer);
      } catch (error: any) {
        console.error('Ошибка при генерации документа:', error);
        if (error.message.includes('не найден')) {
          return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Внутренняя ошибка сервера при генерации документа' });
      }
    }
  );

  // POST /api/drivers
  router.post(
    '/',
    // Валидация...
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
    body('vehicle.type', 'Тип ТС обязателен').notEmpty().isString(),
    body('vehicle.bodyColor', 'Цвет кузова обязателен').notEmpty().isString(),
    body('vehicle.ptsNumber', 'Номер ПТС обязателен').notEmpty().isString(),
    body('vehicle.stsNumber', 'Номер СТС обязателен').notEmpty().isString(),
    body('vehicle.stsIssueInfo', 'Информация о выдаче СТС обязательна').notEmpty().isString(),
    body('driverLicense.number').optional({ checkFalsy: true }).isString(),
    body('leaseAgreement.number').optional({ checkFalsy: true }).isString(),
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const driverData: NewDriver = req.body;
        const newDriver = await driverService.createDriver(driverData);
        res.status(201).json(newDriver);
      } catch (error) {
        console.error('Ошибка при создании водителя:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  );

  // GET /api/drivers
  router.get('/', async (req: Request, res: Response) => {
    try {
      const drivers = await driverService.getAllDrivers();
      res.status(200).json(drivers);
    } catch (error) {
      console.error('Ошибка при получении водителей:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  });

  // GET /api/drivers/:id
  router.get(
    '/:id',
    param('id', 'ID должен быть числом').isInt(),
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const driverId = parseInt(req.params.id, 10);
        const driver = await driverService.findDriverById(driverId);
        if (driver) {
          res.status(200).json(driver);
        } else {
          res.status(404).json({ message: 'Водитель не найден' });
        }
      } catch (error) {
        console.error('Ошибка при поиске водителя:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  );

  // PUT /api/drivers/:id
  router.put(
    '/:id',
    param('id', 'ID должен быть числом').isInt(),
    // Тут можно добавить валидацию для тела запроса, но пока опустим для простоты
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const driverId = parseInt(req.params.id, 10);
        const updatedDriver = await driverService.updateDriver(driverId, req.body);
        if (updatedDriver) {
          res.status(200).json(updatedDriver);
        } else {
          res.status(404).json({ message: 'Водитель не найден' });
        }
      } catch (error) {
        console.error('Ошибка при обновлении водителя:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  );

  // DELETE /api/drivers/:id
  router.delete(
    '/:id',
    param('id', 'ID должен быть числом').isInt(),
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const driverId = parseInt(req.params.id, 10);
        await driverService.deleteDriver(driverId);
        res.status(204).send();
      } catch (error) {
        console.error('Ошибка при удалении водителя:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  );

  return router;
};