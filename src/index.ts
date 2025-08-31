// src/index.ts
import 'dotenv/config';
import app, { driverService, scheduleService } from './app.js';
import { startBot } from './bot.js';

const PORT = process.env.PORT || 3000;

// Запускаем веб-сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Запускаем Telegram-бота, передавая ему те же экземпляры сервисов
startBot(driverService, scheduleService).catch(err => {
  console.error('Критическая ошибка при запуске бота:', err);
});