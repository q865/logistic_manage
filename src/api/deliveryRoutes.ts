import { Router } from 'express';
import type { Request } from 'express';
import multer from 'multer';
import { DeliveryService } from '../services/deliveryService.js';

const router = Router();
const deliveryService = new DeliveryService();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('File filter - MIME type:', file.mimetype);
    console.log('File filter - Original name:', file.originalname);
    
    // Временно принимаем все файлы для тестирования
    cb(null, true);
  }
});

/**
 * POST /api/deliveries/upload
 * Загружает Excel файл с данными о доставках
 */
router.post('/upload', upload.single('excel'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    const deliveries = await deliveryService.loadFromExcel(req.file.buffer);
    
    res.json({
      message: `Успешно загружено ${deliveries.length} доставок`,
      count: deliveries.length,
      deliveries: deliveries.slice(0, 5) // Показываем первые 5 для примера
    });
  } catch (error) {
    console.error('Ошибка загрузки Excel файла:', error);
    res.status(500).json({ 
      error: 'Ошибка обработки Excel файла',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * GET /api/deliveries
 * Получает все доставки
 */
router.get('/', async (req, res) => {
  try {
    const deliveries = await deliveryService.getAllDeliveries();
    res.json(deliveries);
  } catch (error) {
    console.error('Ошибка получения доставок:', error);
    res.status(500).json({ error: 'Ошибка получения доставок' });
  }
});

/**
 * GET /api/deliveries/current
 * Получает текущие рейсы (доставки на сегодня)
 */
router.get('/current', async (req, res) => {
  try {
    const currentDeliveries = await deliveryService.getCurrentDeliveries();
    res.json(currentDeliveries);
  } catch (error) {
    console.error('Ошибка получения текущих рейсов:', error);
    res.status(500).json({ error: 'Ошибка получения текущих рейсов' });
  }
});

/**
 * GET /api/deliveries/date/:date
 * Получает доставки по дате (формат: DD.MM.YYYY)
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const deliveries = await deliveryService.getDeliveriesByDate(date);
    res.json(deliveries);
  } catch (error) {
    console.error('Ошибка получения доставок по дате:', error);
    res.status(500).json({ error: 'Ошибка получения доставок по дате' });
  }
});

/**
 * GET /api/deliveries/loading-time/:time
 * Получает доставки по времени погрузки (формат: HH:MM)
 */
router.get('/loading-time/:time', async (req, res) => {
  try {
    const { time } = req.params;
    const deliveries = await deliveryService.getDeliveriesByLoadingTime(time);
    res.json(deliveries);
  } catch (error) {
    console.error('Ошибка получения доставок по времени погрузки:', error);
    res.status(500).json({ error: 'Ошибка получения доставок по времени погрузки' });
  }
});

/**
 * GET /api/deliveries/schedule/:date
 * Получает расписание доставок на определенную дату
 */
router.get('/schedule/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const schedule = await deliveryService.getDeliverySchedule(date);
    res.json(schedule);
  } catch (error) {
    console.error('Ошибка получения расписания:', error);
    res.status(500).json({ error: 'Ошибка получения расписания' });
  }
});

/**
 * GET /api/deliveries/statistics
 * Получает статистику по грузам
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await deliveryService.getCargoStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

/**
 * GET /api/deliveries/search
 * Поиск доставок по имени клиента
 */
router.get('/search', async (req, res) => {
  try {
    const { customer } = req.query;
    if (!customer || typeof customer !== 'string') {
      return res.status(400).json({ error: 'Параметр customer обязателен' });
    }
    
    const deliveries = await deliveryService.searchDeliveriesByCustomer(customer);
    res.json(deliveries);
  } catch (error) {
    console.error('Ошибка поиска доставок:', error);
    res.status(500).json({ error: 'Ошибка поиска доставок' });
  }
});

/**
 * DELETE /api/deliveries
 * Очищает все данные о доставках
 */
router.delete('/', async (req, res) => {
  try {
    await deliveryService.clearDeliveries();
    res.json({ message: 'Все данные о доставках очищены' });
  } catch (error) {
    console.error('Ошибка очистки данных:', error);
    res.status(500).json({ error: 'Ошибка очистки данных' });
  }
});

/**
 * GET /api/deliveries/export
 * Экспортирует данные в JSON
 */
router.get('/export', async (req, res) => {
  try {
    const jsonData = await deliveryService.exportToJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="deliveries.json"');
    res.send(jsonData);
  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    res.status(500).json({ error: 'Ошибка экспорта данных' });
  }
});

export default router;
