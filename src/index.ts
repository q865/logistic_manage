// src/index.ts
import 'dotenv/config';
import app, { driverService, scheduleService } from './app.js';
import bot from './bot.js';

const PORT = process.env.PORT || 3000;

// Запускаем веб-сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Бот уже запущен в bot.ts
console.log('🚀 Приложение запущено успешно!');