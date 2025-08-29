// src/app.ts
import express from 'express';
import driverRoutes from './api/driverRoutes.js';

const app = express();

// Middleware для парсинга JSON-тела запросов
app.use(express.json());

// Подключаем роуты для водителей
app.use('/api/drivers', driverRoutes);

app.get('/', (req, res) => {
  res.send('Привет! Сервер Driver Bot работает.');
});

export default app;
