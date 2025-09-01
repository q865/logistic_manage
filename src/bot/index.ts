import 'dotenv/config';
import { Bot } from 'grammy';
import { DriverService } from '../services/driverService.js';
import { ScheduleService } from '../services/scheduleService.js';
import { DeliveryService } from '../services/deliveryService.js';
import { TripService } from '../services/tripService.js';
import { ExcelProcessingService } from '../services/excelProcessingService.js';
import { MainCommands } from './modules/mainCommands.js';
import { DriverCommands } from './modules/driverCommands.js';
import { DeliveryCommands } from './modules/deliveryCommands.js';
import { ExcelCommands } from './modules/excelCommands.js';

/**
 * Фабрика для создания и настройки бота
 */
export function createBot(
  token: string, 
  driverService: DriverService, 
  scheduleService: ScheduleService
): Bot {
  const bot = new Bot(token);
  
  // Инициализируем сервисы
  const deliveryService = new DeliveryService();
  const tripService = new TripService();
  const excelProcessingService = new ExcelProcessingService();

  // Инициализируем модули команд
  const mainCommands = new MainCommands();
  const driverCommands = new DriverCommands(driverService);
  const deliveryCommands = new DeliveryCommands(deliveryService);
  const excelCommands = new ExcelCommands(deliveryService, excelProcessingService);

  // Регистрируем команды в меню бота
  bot.api.setMyCommands([
    { command: 'start', description: '🚀 Запуск бота и справка' },
    { command: 'drivers', description: '👥 Список водителей' },
    { command: 'schedule', description: '📅 График работы' },
    { command: 'current', description: '🚗 Текущие рейсы' },
    { command: 'deliveries', description: '📦 Управление доставками' },
    { command: 'excel', description: '📊 Обработка Excel файлов' },
    { command: 'stats', description: '📈 Статистика доставок' },
    { command: 'webapp', description: '🌐 Открыть веб-форму' },
    { command: 'instructions', description: '📚 База знаний' },
  ]);

  // Регистрируем все модули команд
  mainCommands.registerCommands(bot);
  driverCommands.registerCommands(bot);
  deliveryCommands.registerCommands(bot);
  excelCommands.registerCommands(bot);

  // Обработчик ошибок
  bot.catch((err) => {
    console.error('Ошибка бота:', err);
  });

  return bot;
}
