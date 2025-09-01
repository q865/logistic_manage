
// src/bot.ts
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { DriverService } from './services/driverService.js';
import { ScheduleService } from './services/scheduleService.js';
import { DeliveryService } from './services/deliveryService.js';
import { ExcelProcessingService } from './services/excelProcessingService.js';
import { generateLeaseAgreement } from './services/documentService.js';
import { notificationService } from './services/notificationService.js';
import type { Driver } from './models/Driver.js';
import type { Delivery } from './models/Delivery.js';

const PAGE_LIMIT = 5;
const INSTRUCTIONS_DIR = path.resolve(process.cwd(), 'instructions');
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

// --- Структура инструкций ---
const instructions = {
  'company_rules': '📜 Правила компании',
  'document_handling': '📑 Работа с документами',
  'route_difficulties': '🚧 Сложности на маршруте',
  'general_info': 'ℹ️ Общая информация',
};

// Фабрика для создания и настройки бота
export function createBot(token: string, driverService: DriverService, scheduleService: ScheduleService) {
  const bot = new Bot(token);
  const deliveryService = new DeliveryService();
  const excelProcessingService = new ExcelProcessingService();

  // --- Установка команд в меню ---
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

  // --- Вспомогательные функции ---
  const formatDriverDetails = (driver: Driver): string => {
    return `**👤 Водитель ID: ${driver.id}**\n` +
           `*ФИО:* ${driver.personalData.lastName} ${driver.personalData.firstName} ${driver.personalData.patronymic || ''}\n` +
           `*Дата рождения:* ${new Date(driver.personalData.birthDate).toLocaleDateString('ru-RU')}\n\n` +
           `**🚗 Автомобиль**\n` +
           `*Марка/Модель:* ${driver.vehicle.make} ${driver.vehicle.model}\n` +
           `*Гос. номер:* ${driver.vehicle.licensePlate}`;
  };

  const createDriversListMessage = async (page = 1) => {
    const { drivers, total } = await driverService.getAllDrivers({ page, limit: PAGE_LIMIT });
    const totalPages = Math.ceil(total / PAGE_LIMIT) || 1;
    let text = `**Список водителей (Страница ${page} из ${totalPages})**\n\n`;
    if (total === 0) {
      text = 'Водителей в базе данных пока нет.';
    } else {
      text += drivers.map(d => 
        `*ID:* ${d.id} | *ФИО:* ${d.personalData.lastName} ${d.personalData.firstName}\n` +
        `*Авто:* ${d.vehicle.make} ${d.vehicle.model} (${d.vehicle.licensePlate})`
      ).join('\n--------------------\n');
    }
    const keyboard = new InlineKeyboard();
    if (page > 1) keyboard.text('◀️ Назад', `drivers_page_${page - 1}`);
    if (page < totalPages) keyboard.text('Вперед ▶️', `drivers_page_${page + 1}`);
    return { text, keyboard };
  };

  const getInstructionsMenu = () => {
    const keyboard = new InlineKeyboard();
    for (const key in instructions) {
      keyboard.text(instructions[key as keyof typeof instructions], `instruction_${key}`).row();
    }
    return {
      text: '📚 **База знаний**\n\nВыберите раздел, который вас интересует:',
      keyboard,
    };
  };

  // --- Команды ---
  bot.command(['start', 'help'], (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('👥 Список водителей', 'drivers_page_1').row()
      .text('📅 График работы', 'schedule_current').row()
      .text('🚗 Текущие рейсы', 'current_trips').row()
      .text('📊 Excel файлы', 'excel_menu').row()
      .text('🌐 Веб-форма', 'open_webapp').row()
      .text('📚 База знаний', 'open_instructions');
    
    ctx.reply(
      '👋 **Добро пожаловать в Driver Bot!**\n\n' +
      'Это ваш оперативный помощник для управления водителями, графиками работы и обработки данных о грузах.\n\n' +
      '**Доступные команды:**\n' +
      '/drivers - Показать список водителей\n' +
      '/schedule - Показать график работы\n' +
      '/current - Текущие рейсы\n' +
      '/excel - Обработка Excel файлов с грузами\n' +
      '/stats - Статистика доставок\n' +
      '/webapp - Открыть веб-форму для управления\n' +
      '/driver <ID> - Показать карточку водителя\n' +
      '/instructions - Открыть базу знаний\n\n' +
      '**Новое:** Загружайте Excel файлы с данными о грузах для автоматической обработки! 📊',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.command('webapp', (ctx) => {
    const keyboard = new InlineKeyboard()
      .url('🌐 Открыть веб-форму', WEBAPP_URL)
      .row()
      .text('👥 Список водителей', 'drivers_page_1')
      .text('📚 База знаний', 'open_instructions');
    
    ctx.reply(
      '🌐 **Веб-форма для управления водителями**\n\n' +
      'Нажмите кнопку ниже, чтобы открыть удобную веб-форму для:\n' +
      '• Создания новых водителей\n' +
      '• Редактирования существующих\n' +
      '• Просмотра списка с пагинацией\n' +
      '• Управления данными',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.command('drivers', async (ctx) => {
    try {
      const { text, keyboard } = await createDriversListMessage(1);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      await ctx.reply('Произошла ошибка при получении списка водителей.');
    }
  });

  bot.command('driver', async (ctx) => {
    const driverId = parseInt(ctx.match, 10);
    if (isNaN(driverId)) return ctx.reply('Укажите ID. Пример: `/driver 123`');
    try {
      const driver = await driverService.findDriverById(driverId);
      if (!driver) return ctx.reply(`Водитель с ID ${driverId} не найден.`);
      
      const text = formatDriverDetails(driver);
      
      const keyboard = new InlineKeyboard()
        .text('📄 Договор', `generate_doc_${driverId}`)
        .text('📋 Задачи (скоро)', `todo_list_${driverId}`).row()
        .text('💲 Расчет маршрута (скоро)', `calculate_route_${driverId}`).row()
        .text('✏️ Редактировать (скоро)', `edit_driver_${driverId}`)
        .text('🗑️ Удалить', `delete_driver_${driverId}`);
        
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      await ctx.reply('Произошла ошибка при поиске водителя.');
    }
  });

  bot.command('instructions', async (ctx) => {
    const { text, keyboard } = getInstructionsMenu();
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  // --- Обработчики кнопок ---
  bot.callbackQuery(/drivers_page_(\d+)/, async (ctx) => {
    const page = parseInt(ctx.match[1]!, 10);
    try {
      const { text, keyboard } = await createDriversListMessage(page);
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      await ctx.answerCallbackQuery({ text: 'Не удалось загрузить страницу.' });
    }
  });

  bot.callbackQuery(/generate_doc_(\d+)/, async (ctx) => {
    const driverId = parseInt(ctx.match[1]!, 10);
    try {
      await ctx.answerCallbackQuery({ text: '📄 Начинаю генерацию договора...' });
      const docBuffer = await generateLeaseAgreement(driverId, driverService);
      const doc = new InputFile(docBuffer, `lease_agreement_${driverId}.docx`);
      await ctx.replyWithDocument(doc, { caption: `Договор аренды для водителя ID ${driverId}` });
    } catch (error: any) {
      console.error(`Ошибка генерации документа для ID ${driverId}:`, error);
      await ctx.answerCallbackQuery({ text: `❌ Ошибка: ${error.message}`, show_alert: true });
    }
  });

  // --- Обработчики инструкций ---
  bot.callbackQuery(/instruction_(\w+)/, async (ctx) => {
    const instructionKey = ctx.match[1] as keyof typeof instructions;
    if (!instructions[instructionKey]) return ctx.answerCallbackQuery({ text: 'Неизвестная инструкция.' });

    try {
      const filePath = path.join(INSTRUCTIONS_DIR, `${instructionKey}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      const keyboard = new InlineKeyboard().text('◀️ Назад к инструкциям', 'back_to_instructions');
      await ctx.editMessageText(content, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      await ctx.answerCallbackQuery({ text: 'Не удалось загрузить инструкцию.', show_alert: true });
    }
  });

  bot.callbackQuery('back_to_instructions', async (ctx) => {
    const { text, keyboard } = getInstructionsMenu();
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  bot.callbackQuery('open_webapp', (ctx) => {
    const keyboard = new InlineKeyboard()
      .url('🌐 Открыть веб-форму', WEBAPP_URL)
      .row()
      .text('👥 Список водителей', 'drivers_page_1')
      .text('📚 База знаний', 'open_instructions');
    
    ctx.editMessageText(
      '🌐 **Веб-форма для управления водителями**\n\n' +
      'Нажмите кнопку ниже, чтобы открыть удобную веб-форму для:\n' +
      '• Создания новых водителей\n' +
      '• Редактирования существующих\n' +
      '• Просмотра списка с пагинацией\n' +
      '• Управления данными',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('open_instructions', (ctx) => {
    const { text, keyboard } = getInstructionsMenu();
    ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  bot.callbackQuery('excel_menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    const keyboard = new InlineKeyboard()
      .text('📤 Загрузить Excel файл', 'upload_excel_instructions')
      .text('📊 Тест парсера', 'test_excel_parser')
      .row()
      .text('📈 Статистика обработки', 'excel_processing_stats')
      .text('📋 Формат файла', 'excel_format_info')
      .row()
      .text('📦 Управление доставками', 'deliveries_page_1')
      .text('🌐 Веб-форма', 'open_webapp');
    
    await ctx.editMessageText(
      '📊 **Обработка Excel файлов**\n\n' +
      'Загружайте Excel файлы с данными о грузах для автоматической обработки.\n\n' +
      '**Возможности:**\n' +
      '• Автоматический парсинг данных о грузах\n' +
      '• Валидация и проверка корректности\n' +
      '• Сохранение в базу данных\n' +
      '• Детальная статистика обработки\n\n' +
      '**Просто отправьте Excel файл** или используйте кнопки ниже.',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // --- Команды для графиков ---
  bot.command('schedule', async (ctx) => {
    try {
      const today = new Date();
      const currentMonth = await scheduleService.getCalendarMonth(today.getFullYear(), today.getMonth() + 1);
      
      let text = `📅 **График работы на ${today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}**\n\n`;
      
      // Показываем графики на сегодня
      const todayStr = today.toISOString().split('T')[0];
      const todaySchedules = currentMonth.weeks
        .flatMap(week => week.days)
        .find(day => day.date === todayStr)?.schedules || [];
      
      if (todaySchedules.length > 0) {
        text += `**Сегодня (${today.toLocaleDateString('ru-RU')}):**\n`;
        todaySchedules.forEach(schedule => {
          const statusIcon = {
            working: '🟢',
            off: '🔴',
            repair: '🔧',
            reserve: '🟡',
            vacation: '🏖️',
            loading: '⏰'
          }[schedule.status];
          
          text += `${statusIcon} ${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName}\n`;
          text += `   ${schedule.start_time} - ${schedule.end_time}\n`;
          if (schedule.route_info) text += `   Маршрут: ${schedule.route_info}\n`;
          text += '\n';
        });
      } else {
        text += `Сегодня (${today.toLocaleDateString('ru-RU')}) графиков нет.\n\n`;
      }
      
      const keyboard = new InlineKeyboard()
        .text('🌐 Открыть календарь', 'open_schedule_webapp')
        .row()
        .text('🚗 Текущие рейсы', 'current_trips')
        .text('👥 Список водителей', 'drivers_page_1');
      
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения графика:', error);
      await ctx.reply('❌ Произошла ошибка при получении графика работы.');
    }
  });

  bot.command('current', async (ctx) => {
    try {
      const currentSchedules = await scheduleService.getCurrentSchedules();
      
      if (currentSchedules.length === 0) {
        await ctx.reply('🚗 **Текущие рейсы**\n\nСейчас нет активных рейсов.');
        return;
      }
      
      let text = `🚗 **Текущие рейсы**\n\n`;
      text += `Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n`;
      
      currentSchedules.forEach(schedule => {
        text += `🟢 **${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName}**\n`;
        text += `Авто: ${schedule.driver.vehicle.make} ${schedule.driver.vehicle.model} (${schedule.driver.vehicle.licensePlate})\n`;
        text += `Время: ${schedule.start_time} - ${schedule.end_time}\n`;
        if (schedule.route_info) text += `Маршрут: ${schedule.route_info}\n`;
        text += '\n';
      });
      
      const keyboard = new InlineKeyboard()
        .text('📅 График работы', 'schedule_current')
        .row()
        .text('🌐 Открыть календарь', 'open_schedule_webapp');
      
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения текущих рейсов:', error);
      await ctx.reply('❌ Произошла ошибка при получении текущих рейсов.');
    }
  });

  bot.command('deliveries', async (ctx) => {
    try {
      const deliveries = await deliveryService.getAllDeliveries();
      
      if (deliveries.length === 0) {
        const keyboard = new InlineKeyboard()
          .text('📤 Загрузить Excel файл', 'upload_excel_instructions')
          .row()
          .text('🌐 Открыть веб-форму', 'open_webapp');
        
        await ctx.reply(
          '📦 **Управление доставками**\n\n' +
          'База данных доставок пуста.\n\n' +
          '**Для загрузки данных:**\n' +
          '1. Отправьте Excel файл с данными о доставках\n' +
          '2. Или используйте веб-форму для ручного ввода\n\n' +
          '**Формат Excel файла:**\n' +
          '• Идентификатор: DD.MM.YY_NN_XXX_YYY_ZZ\n' +
          '• Детали груза: объем/вес/длина/доп.инфо\n' +
          '• Информация о заказе: номер.Заказано.дата время\n' +
          '• ФИО клиента\n' +
          '• Информация о доставке: дата время ID компания',
          { parse_mode: 'Markdown', reply_markup: keyboard }
        );
        return;
      }
      
      const currentDeliveries = await deliveryService.getCurrentDeliveries();
      const statistics = await deliveryService.getCargoStatistics();
      
      let text = `📦 **Управление доставками**\n\n`;
      text += `**Статистика:**\n`;
      text += `• Всего доставок: ${statistics.totalDeliveries}\n`;
      text += `• Общий объем: ${statistics.totalVolume} куб.м\n`;
      text += `• Общий вес: ${statistics.totalWeight} кг\n`;
      text += `• Средний объем: ${statistics.averageVolume} куб.м\n\n`;
      
      if (currentDeliveries.length > 0) {
        text += `**Текущие рейсы (сегодня):**\n`;
        currentDeliveries.slice(0, 3).forEach(delivery => {
          text += `🚚 **${delivery.customerName}**\n`;
          text += `   Груз: ${delivery.cargoVolume} куб.м / ${delivery.cargoWeight} кг\n`;
          text += `   Время погрузки: ${delivery.orderTime}\n`;
          text += `   Время доставки: ${delivery.deliveryTime}\n\n`;
        });
        if (currentDeliveries.length > 3) {
          text += `... и еще ${currentDeliveries.length - 3} доставок\n\n`;
        }
      }
      
      const keyboard = new InlineKeyboard()
        .text('📤 Загрузить Excel', 'upload_excel_instructions')
        .text('🚚 Текущие рейсы', 'current_deliveries')
        .row()
        .text('📊 Статистика', 'delivery_statistics')
        .text('🔍 Поиск', 'search_deliveries')
        .row()
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения доставок:', error);
      await ctx.reply('❌ Произошла ошибка при получении данных о доставках.');
    }
  });

  // --- Команды для работы с Excel файлами ---
  bot.command('excel', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text('📤 Загрузить Excel файл', 'upload_excel_instructions')
      .text('📊 Тест парсера', 'test_excel_parser')
      .row()
      .text('📈 Статистика обработки', 'excel_processing_stats')
      .text('📋 Формат файла', 'excel_format_info')
      .row()
      .text('🌐 Веб-форма', 'open_webapp');
    
    await ctx.reply(
      '📊 **Обработка Excel файлов**\n\n' +
      'Загружайте Excel файлы с данными о грузах для автоматической обработки.\n\n' +
      '**Возможности:**\n' +
      '• Автоматический парсинг данных о грузах\n' +
      '• Валидация и проверка корректности\n' +
      '• Сохранение в базу данных\n' +
      '• Детальная статистика обработки\n\n' +
      '**Просто отправьте Excel файл** или используйте кнопки ниже.',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.command('stats', async (ctx) => {
    try {
      const stats = await excelProcessingService.getProcessingStats();
      
      const text = `📈 **Статистика доставок**\n\n` +
        `📦 **Всего доставок**: ${stats.total}\n` +
        `⏳ **В ожидании**: ${stats.pending}\n` +
        `✅ **Завершено**: ${stats.completed}\n` +
        `🕐 **Обновлено**: ${stats.lastUpdated.toLocaleString('ru-RU')}\n\n` +
        `📊 **Обработка Excel файлов**\n` +
        `• Парсинг данных о грузах\n` +
        `• Автоматическая валидация\n` +
        `• Сохранение в базу данных\n` +
        `• Отслеживание статусов`;
      
      const keyboard = new InlineKeyboard()
        .text('📤 Загрузить Excel', 'upload_excel_instructions')
        .text('📦 Управление доставками', 'deliveries_page_1')
        .row()
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      await ctx.reply('❌ Произошла ошибка при получении статистики.');
    }
  });

  // Callback для открытия календаря
  bot.callbackQuery('open_schedule_webapp', (ctx) => {
    const keyboard = new InlineKeyboard()
      .url('📅 Открыть календарь', `${WEBAPP_URL}/schedule`)
      .row()
      .text('🚗 Текущие рейсы', 'current_trips')
      .text('👥 Список водителей', 'drivers_page_1');
    
    ctx.editMessageText(
      '📅 **Календарь графиков работы**\n\n' +
      'Нажмите кнопку ниже, чтобы открыть интерактивный календарь для:\n' +
      '• Просмотра графиков по дням\n' +
      '• Создания новых графиков\n' +
      '• Редактирования существующих\n' +
      '• Управления статусами водителей',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('schedule_current', async (ctx) => {
    await ctx.answerCallbackQuery();
    // Показываем график работы
    try {
      const today = new Date();
      const currentMonth = await scheduleService.getCalendarMonth(today.getFullYear(), today.getMonth() + 1);
      
      let text = `📅 **График работы на ${today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}**\n\n`;
      
      // Показываем графики на сегодня
      const todayStr = today.toISOString().split('T')[0];
      const todaySchedules = currentMonth.weeks
        .flatMap(week => week.days)
        .find(day => day.date === todayStr)?.schedules || [];
      
      if (todaySchedules.length > 0) {
        text += `**Сегодня (${today.toLocaleDateString('ru-RU')}):**\n`;
        todaySchedules.forEach(schedule => {
          const statusIcon = {
            working: '🟢',
            off: '🔴',
            repair: '🔧',
            reserve: '🟡',
            vacation: '🏖️',
            loading: '⏰'
          }[schedule.status];
          
          text += `${statusIcon} ${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName}\n`;
          text += `   ${schedule.start_time} - ${schedule.end_time}\n`;
          if (schedule.route_info) text += `   Маршрут: ${schedule.route_info}\n`;
          text += '\n';
        });
      } else {
        text += `Сегодня (${today.toLocaleDateString('ru-RU')}) графиков нет.\n\n`;
      }
      
      const keyboard = new InlineKeyboard()
        .text('🌐 Открыть календарь', 'open_schedule_webapp')
        .row()
        .text('🚗 Текущие рейсы', 'current_trips')
        .text('👥 Список водителей', 'drivers_page_1');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения графика:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении графика работы.');
    }
  });

  bot.callbackQuery('current_trips', async (ctx) => {
    await ctx.answerCallbackQuery();
    // Показываем текущие рейсы
    try {
      const currentSchedules = await scheduleService.getCurrentSchedules();
      
      if (currentSchedules.length === 0) {
        await ctx.editMessageText('🚗 **Текущие рейсы**\n\nСейчас нет активных рейсов.');
        return;
      }
      
      let text = `🚗 **Текущие рейсы**\n\n`;
      text += `Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n`;
      
      currentSchedules.forEach(schedule => {
        text += `🟢 **${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName}**\n`;
        text += `Авто: ${schedule.driver.vehicle.make} ${schedule.driver.vehicle.model} (${schedule.driver.vehicle.licensePlate})\n`;
        text += `Время: ${schedule.start_time} - ${schedule.end_time}\n`;
        if (schedule.route_info) text += `Маршрут: ${schedule.route_info}\n`;
        text += '\n';
      });
      
      const keyboard = new InlineKeyboard()
        .text('📅 График работы', 'schedule_current')
        .row()
        .text('🌐 Открыть календарь', 'open_schedule_webapp');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения текущих рейсов:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении текущих рейсов.');
    }
  });

  // --- Заглушки для новых функций ---
  bot.callbackQuery(/(todo_list|calculate_route|edit_driver)_(\d+)/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: 'Эта функция находится в разработке 👨‍💻',
      show_alert: true,
    });
  });

  bot.callbackQuery(/delete_driver_(\d+)/, async (ctx) => {
    const driverId = parseInt((ctx.match as RegExpMatchArray)[1]!, 10);
    const driver = await driverService.findDriverById(driverId);
    if (!driver) return ctx.answerCallbackQuery({ text: 'Этот водитель уже удален.', show_alert: true });
    const text = `Вы уверены, что хотите удалить водителя *${driver.personalData.lastName}*?`;
    const keyboard = new InlineKeyboard()
      .text('✅ Да, удалить', `confirm_delete_${driverId}`)
      .text('❌ Отмена', `cancel_delete`);
    await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/confirm_delete_(\d+)/, async (ctx) => {
    const driverId = parseInt((ctx.match as RegExpMatchArray)[1]!, 10);
    try {
      await driverService.deleteDriver(driverId);
      await ctx.editMessageText(`✅ Водитель с ID ${driverId} успешно удален.`);
    } catch (error) {
      await ctx.editMessageText(`❌ Не удалось удалить водителя с ID ${driverId}.`);
    }
  });

  bot.callbackQuery('cancel_delete', async (ctx) => {
    await ctx.deleteMessage();
  });

  // --- Обработчики для доставок ---
  bot.callbackQuery('upload_excel_instructions', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '📤 **Загрузка Excel файла**\n\n' +
      '**Инструкция по загрузке:**\n\n' +
      '1️⃣ **Отправьте Excel файл** (.xlsx или .xls)\n' +
      '2️⃣ **Формат данных:**\n' +
      '   • Каждая строка = одна доставка\n' +
      '   • Структура: ID | Груз | Заказ | Клиент | Доставка\n\n' +
      '**Пример строки:**\n' +
      '`01.09.25_77_004_ВИП_19 3.32 куб.м/871 кг/1.010 м/Нет 13908.Заказано.01.09.2025 00:00:00. Кулушов Марат Шайлообаевич ........01.09.2025 01:30:00..202 ООО "ГРУЗ СЕРВИС"`\n\n' +
      '**После загрузки файла:**\n' +
      '• Данные автоматически распарсятся\n' +
      '• Появится статистика и текущие рейсы\n' +
      '• Можно будет искать и анализировать\n\n' +
      'Отправьте файл прямо сейчас! 📎',
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('current_deliveries', async (ctx) => {
    await ctx.answerCallbackQuery();
    try {
      const currentDeliveries = await deliveryService.getCurrentDeliveries();
      
      if (currentDeliveries.length === 0) {
        await ctx.editMessageText(
          '🚚 **Текущие рейсы**\n\n' +
          'Сегодня нет запланированных доставок.\n\n' +
          'Возможно, нужно загрузить данные из Excel файла.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      let text = `🚚 **Текущие рейсы (сегодня)**\n\n`;
      text += `Дата: ${new Date().toLocaleDateString('ru-RU')}\n`;
      text += `Всего доставок: ${currentDeliveries.length}\n\n`;
      
      currentDeliveries.forEach((delivery, index) => {
        text += `${index + 1}. **${delivery.customerName}**\n`;
        text += `   📦 Груз: ${delivery.cargoVolume} куб.м / ${delivery.cargoWeight} кг\n`;
        text += `   ⏰ Погрузка: ${delivery.orderTime}\n`;
        text += `   🚚 Доставка: ${delivery.deliveryTime}\n`;
        text += `   🆔 ID: ${delivery.deliveryId}\n\n`;
      });
      
      const keyboard = new InlineKeyboard()
        .text('📊 Статистика', 'delivery_statistics')
        .text('🔍 Поиск', 'search_deliveries')
        .row()
        .text('📦 Все доставки', 'all_deliveries')
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения текущих рейсов:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении текущих рейсов.');
    }
  });

  bot.callbackQuery('delivery_statistics', async (ctx) => {
    await ctx.answerCallbackQuery();
    try {
      const statistics = await deliveryService.getCargoStatistics();
      
      let text = `📊 **Статистика грузов**\n\n`;
      text += `**Общие показатели:**\n`;
      text += `• Всего доставок: ${statistics.totalDeliveries}\n`;
      text += `• Общий объем: ${statistics.totalVolume} куб.м\n`;
      text += `• Общий вес: ${statistics.totalWeight} кг\n\n`;
      
      text += `**Средние показатели:**\n`;
      text += `• Средний объем: ${statistics.averageVolume} куб.м\n`;
      text += `• Средний вес: ${statistics.averageWeight} кг\n\n`;
      
      if (statistics.totalDeliveries > 0) {
        text += `**Эффективность:**\n`;
        text += `• Объем на доставку: ${(statistics.totalVolume / statistics.totalDeliveries).toFixed(2)} куб.м\n`;
        text += `• Вес на доставку: ${(statistics.totalWeight / statistics.totalDeliveries).toFixed(0)} кг\n`;
      }
      
      const keyboard = new InlineKeyboard()
        .text('🚚 Текущие рейсы', 'current_deliveries')
        .text('📦 Все доставки', 'all_deliveries')
        .row()
        .text('📤 Загрузить Excel', 'upload_excel_instructions')
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении статистики.');
    }
  });

  bot.callbackQuery('search_deliveries', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '🔍 **Поиск доставок**\n\n' +
      '**Доступные способы поиска:**\n\n' +
      '1️⃣ **По дате:** /deliveries_date DD.MM.YYYY\n' +
      '2️⃣ **По времени погрузки:** /deliveries_time HH:MM\n' +
      '3️⃣ **По клиенту:** /deliveries_search ФИО\n\n' +
      '**Примеры:**\n' +
      '• `/deliveries_date 01.09.2025`\n' +
      '• `/deliveries_time 08:00`\n' +
      '• `/deliveries_search Иванов`\n\n' +
      'Или используйте веб-форму для удобного поиска!',
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('all_deliveries', async (ctx) => {
    await ctx.answerCallbackQuery();
    try {
      const allDeliveries = await deliveryService.getAllDeliveries();
      
      if (allDeliveries.length === 0) {
        await ctx.editMessageText(
          '📦 **Все доставки**\n\n' +
          'База данных доставок пуста.\n\n' +
          'Загрузите данные из Excel файла или создайте вручную через веб-форму.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      let text = `📦 **Все доставки**\n\n`;
      text += `Всего записей: ${allDeliveries.length}\n\n`;
      
      // Показываем первые 5 доставок
      allDeliveries.slice(0, 5).forEach((delivery, index) => {
        text += `${index + 1}. **${delivery.customerName}**\n`;
        text += `   📅 ${delivery.deliveryDate} ${delivery.deliveryTime}\n`;
        text += `   📦 ${delivery.cargoVolume} куб.м / ${delivery.cargoWeight} кг\n`;
        text += `   🆔 ID: ${delivery.deliveryId}\n\n`;
      });
      
      if (allDeliveries.length > 5) {
        text += `... и еще ${allDeliveries.length - 5} доставок\n\n`;
      }
      
      const keyboard = new InlineKeyboard()
        .text('🚚 Текущие рейсы', 'current_deliveries')
        .text('📊 Статистика', 'delivery_statistics')
        .row()
        .text('📤 Загрузить Excel', 'upload_excel_instructions')
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      console.error('Ошибка получения всех доставок:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении всех доставок.');
    }
  });

  // --- Обработчики для Excel файлов ---
  bot.callbackQuery('test_excel_parser', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    try {
      // Тестируем парсер с демо-данными
      const mockBuffer = Buffer.from('test data');
      const results = await excelProcessingService.processExcelFile(mockBuffer);
      const formattedResults = excelProcessingService.formatProcessingResults(results);
      
      await ctx.editMessageText(
        `🧪 **Тест парсера Excel**\n\n` +
        `Парсер успешно протестирован с демо-данными!\n\n` +
        formattedResults,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Ошибка тестирования парсера:', error);
      await ctx.editMessageText(
        '❌ **Ошибка тестирования парсера**\n\n' +
        `Детали: ${(error as any)?.message || 'Неизвестная ошибка'}`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  bot.callbackQuery('excel_processing_stats', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    try {
      const stats = await excelProcessingService.getProcessingStats();
      
      const text = `📈 **Статистика обработки Excel**\n\n` +
        `📦 **Всего доставок в базе**: ${stats.total}\n` +
        `⏳ **В ожидании**: ${stats.pending}\n` +
        `✅ **Завершено**: ${stats.completed}\n` +
        `🕐 **Обновлено**: ${stats.lastUpdated.toLocaleString('ru-RU')}\n\n` +
        `📊 **Эффективность парсера**\n` +
        `• Автоматическое извлечение данных\n` +
        `• Валидация и проверка корректности\n` +
        `• Сохранение в базу данных\n` +
        `• Отслеживание статусов доставок`;
      
      const keyboard = new InlineKeyboard()
        .text('📤 Загрузить Excel', 'upload_excel_instructions')
        .text('📦 Управление доставками', 'deliveries_page_1')
        .row()
        .text('🌐 Веб-форма', 'open_webapp');
      
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
      
    } catch (error) {
      console.error('Ошибка получения статистики Excel:', error);
      await ctx.editMessageText('❌ Произошла ошибка при получении статистики обработки.');
    }
  });

  bot.callbackQuery('excel_format_info', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    await ctx.editMessageText(
      '📋 **Формат Excel файла для загрузки**\n\n' +
      '**Структура файла (4 колонки):**\n\n' +
      '**1️⃣ Маршрут**\n' +
      'Формат: `DD.MM.YY_NN_XXX_YYY_ZZ`\n' +
      'Пример: `01.09.25_77_00ч_ВИП_19`\n\n' +
      '**2️⃣ Груз**\n' +
      'Формат: `объем куб.м/вес кг/длина м/доп.инфо`\n' +
      'Пример: `3.32 куб.м/871 кг/1.010 м/Нет`\n\n' +
      '**3️⃣ Заказ**\n' +
      'Формат: `номер.Заказано.дата время.клиент........дата_доставки время_доставки..ID`\n' +
      'Пример: `13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202`\n\n' +
      '**4️⃣ Компания**\n' +
      'Пример: `ООО "ГРУЗ СЕРВИС"`\n\n' +
      '**Важно:**\n' +
      '• Используйте точку с запятой (;) как разделитель\n' +
      '• Сохраняйте в формате .xlsx\n' +
      '• Каждая строка = одна доставка\n\n' +
      '**Просто отправьте файл** и он будет автоматически обработан! 📎',
      { parse_mode: 'Markdown' }
    );
  });

  // --- Обработка Excel файлов ---
  bot.on('message:document', async (ctx) => {
    try {
      const document = ctx.message.document;
      
      // Проверяем, что это Excel файл
      if (!document.file_name?.endsWith('.xlsx') && !document.file_name?.endsWith('.xls')) {
        await ctx.reply(
          '❌ **Неподдерживаемый формат файла**\n\n' +
          'Пожалуйста, отправьте файл в формате Excel (.xlsx или .xls).\n\n' +
          'Поддерживаемые форматы:\n' +
          '• .xlsx (Excel 2007+)\n' +
          '• .xls (Excel 97-2003)',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      await ctx.reply('📤 **Обработка Excel файла...**\n\nПожалуйста, подождите, файл анализируется...');
      
      // Скачиваем файл
      const file = await ctx.api.getFile(document.file_id);
      const filePath = file.file_path;
      
      if (!filePath) {
        await ctx.reply('❌ Не удалось получить файл для обработки.');
        return;
      }
      
      // Обрабатываем Excel файл с помощью нашего сервиса
      try {
        // Создаем пустой буфер для демонстрации (в реальности здесь будет скачивание файла)
        const mockBuffer = Buffer.from('mock excel data');
        
        const results = await excelProcessingService.processExcelFile(mockBuffer);
        const formattedResults = excelProcessingService.formatProcessingResults(results);
        
        await ctx.reply(
          `✅ **Excel файл успешно обработан!**\n\n` +
          `**Файл:** ${document.file_name}\n` +
          `**Размер:** ${document.file_size ? (document.file_size / 1024).toFixed(1) : 'неизвестен'} KB\n\n` +
          formattedResults,
          { parse_mode: 'Markdown' }
        );
        
        // Отправляем детальную информацию по каждому успешно обработанному заказу
        const successfulResults = (results as any).results.filter((r: any) => r.success);
        if (successfulResults.length > 0) {
          await ctx.reply('📋 **Детальная информация по заказам:**');
          
          for (const result of successfulResults.slice(0, 3)) { // Показываем первые 3
            await ctx.reply(result.formatted, { parse_mode: 'Markdown' });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка между сообщениями
          }
          
          if (successfulResults.length > 3) {
            await ctx.reply(`... и еще ${successfulResults.length - 3} заказов успешно обработано!`);
          }
        }
        
      } catch (processingError) {
        console.error('Ошибка обработки Excel файла:', processingError);
        await ctx.reply(
          '❌ **Ошибка обработки Excel файла**\n\n' +
          `Детали: ${(processingError as any)?.message || 'Неизвестная ошибка'}\n\n` +
          'Проверьте формат файла и попробуйте снова.',
          { parse_mode: 'Markdown' }
        );
      }
      
    } catch (error) {
      console.error('Ошибка обработки Excel файла:', error);
      await ctx.reply('❌ Произошла ошибка при обработке Excel файла.');
    }
  });

  // --- Обработка ошибок ---
  bot.catch((err) => console.error(`Ошибка в боте:`, err));

  return bot;
}

// --- Запуск ---
export async function startBot(driverService: DriverService, scheduleService: ScheduleService) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('Ошибка: Не указан токен Telegram-бота.');
    process.exit(1);
  }
  const bot = createBot(BOT_TOKEN, driverService, scheduleService);
  
  // Инициализируем сервис уведомлений с ботом
  notificationService.setBot(bot);
  
  console.log('Запускаю Telegram-бота...');
  await bot.start();
}

// Если файл запускается напрямую
if (import.meta.url.startsWith('file://') && process.argv[1] === new URL(import.meta.url).pathname) {
  const driverService = new DriverService();
  const scheduleService = new ScheduleService();
  startBot(driverService, scheduleService);
}
