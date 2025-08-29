// src/app.ts
import express from 'express';
import cors from 'cors';
import { createDriverRouter } from './api/driverRoutes.js';
import { DriverService } from './services/driverService.js';
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
// Создаем единственный экземпляр сервиса
const driverService = new DriverService();
// Создаем роутер и передаем ему сервис
const driverRoutes = createDriverRouter(driverService);

// Подключаем роуты для водителей
app.use('/api/drivers', driverRoutes);

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

// Тестовый маршрут для проверки, что сервер жив и CORS работает
app.get('/ping', (req, res) => {
  console.log(`[${new Date().toISOString()}] Received PING request.`);
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Привет! Сервер Driver Bot работает.');
});

export default app;