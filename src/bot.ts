// src/bot.ts - Главный файл бота (упрощенная версия)
import 'dotenv/config';
import { createBot } from './bot/index.js';
import { DriverService } from './services/driverService.js';
import { ScheduleService } from './services/scheduleService.js';

// Инициализируем сервисы
const driverService = new DriverService();
const scheduleService = new ScheduleService();

// Создаем и запускаем бота
const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN не установлен в переменных окружения');
}

const bot = createBot(token, driverService, scheduleService);

// Запускаем бота
bot.start({
  onStart: () => {
    console.log('🚀 Бот запущен успешно!');
  },
});

export default bot;
