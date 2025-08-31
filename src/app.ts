// src/app.ts
import express from 'express';
import cors from 'cors';
import { createDriverRouter } from './api/driverRoutes.js';
import { createScheduleRouter } from './api/scheduleRoutes.js';
import { DriverService } from './services/driverService.js';
import { ScheduleService } from './services/scheduleService.js';
import { notificationService } from './services/notificationService.js';

console.log(`[${new Date().toISOString()}] Express App Loading...`);

const app = express();

// --- НАСТРОЙКА CORS ---
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

console.log(`[${new Date().toISOString()}] CORS Middleware enabled for origin:`, corsOptions.origin);
app.use(cors(corsOptions));

// Middleware для парсинга JSON-тела запросов
app.use(express.json());

// --- ИНЪЕКЦИЯ ЗАВИСИМОСТЕЙ ---
// Создаем единственные экземпляры сервисов
const driverService = new DriverService();
const scheduleService = new ScheduleService();

// Создаем роутеры и передаем им сервисы
const driverRoutes = createDriverRouter(driverService);
const scheduleRoutes = createScheduleRouter(scheduleService);

// Подключаем роуты
app.use('/api/drivers', driverRoutes);
app.use('/api/schedules', scheduleRoutes);

// --- ВЕБ-ХУК ДЛЯ УВЕДОМЛЕНИЙ ---
app.post('/api/webhook/driver-created', async (req, res) => {
  try {
    const { driverId, driverName } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: Новый водитель создан - ID: ${driverId}, Имя: ${driverName}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyDriverCreated(driverId, driverName);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление получено и отправлено',
      driverId,
      driverName 
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.post('/api/webhook/driver-updated', async (req, res) => {
  try {
    const { driverId, driverName } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: Водитель обновлен - ID: ${driverId}, Имя: ${driverName}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyDriverUpdated(driverId, driverName);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление об обновлении получено и отправлено',
      driverId,
      driverName 
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.post('/api/webhook/driver-deleted', async (req, res) => {
  try {
    const { driverId, driverName } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: Водитель удален - ID: ${driverId}, Имя: ${driverName}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyDriverDeleted(driverId, driverName);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление об удалении получено и отправлено',
      driverId,
      driverName 
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Webhook для уведомлений о графиках
app.post('/api/webhook/schedule-created', async (req, res) => {
  try {
    const { scheduleId, driverName, date, status } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: Новый график создан - ID: ${scheduleId}, Водитель: ${driverName}, Дата: ${date}, Статус: ${status}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyScheduleCreated(scheduleId, driverName, date, status);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление о графике получено и отправлено',
      scheduleId,
      driverName,
      date,
      status
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука графика:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.post('/api/webhook/schedule-updated', async (req, res) => {
  try {
    const { scheduleId, driverName, date, status } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: График обновлен - ID: ${scheduleId}, Водитель: ${driverName}, Дата: ${date}, Статус: ${status}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyScheduleUpdated(scheduleId, driverName, date, status);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление об обновлении графика получено и отправлено',
      scheduleId,
      driverName,
      date,
      status
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука графика:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.post('/api/webhook/schedule-deleted', async (req, res) => {
  try {
    const { scheduleId, driverName, date } = req.body;
    
    console.log(`[${new Date().toISOString()}] Webhook: График удален - ID: ${scheduleId}, Водитель: ${driverName}, Дата: ${date}`);
    
    // Отправляем уведомление в Telegram
    await notificationService.notifyScheduleDeleted(scheduleId, driverName, date);
    
    res.status(200).json({ 
      success: true, 
      message: 'Уведомление об удалении графика получено и отправлено',
      scheduleId,
      driverName,
      date
    });
  } catch (error) {
    console.error('Ошибка обработки веб-хука графика:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Тестовый маршрут для проверки, что сервер жив и CORS работает
app.get('/ping', (req, res) => {
  console.log(`[${new Date().toISOString()}] Received PING request.`);
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Привет! Сервер Driver Bot работает.');
});

export default app;
export { driverService, scheduleService };