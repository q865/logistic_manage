// src/app.ts
import express from 'express';
import cors from 'cors';
import { createDriverRouter } from './api/driverRoutes.js';
import { DriverService } from './services/driverService.js';

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

// Тестовый маршрут для проверки, что сервер жив и CORS работает
app.get('/ping', (req, res) => {
  console.log(`[${new Date().toISOString()}] Received PING request.`);
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Привет! Сервер Driver Bot работает.');
});

export default app;