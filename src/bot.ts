
// src/bot.ts
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { DriverService } from './services/driverService.js';
import { ScheduleService } from './services/scheduleService.js';
import { generateLeaseAgreement } from './services/documentService.js';
import { notificationService } from './services/notificationService.js';
import type { Driver } from './models/Driver.js';

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

  // --- Установка команд в меню ---
  bot.api.setMyCommands([
    { command: 'start', description: '🚀 Запуск бота и справка' },
    { command: 'drivers', description: '👥 Список водителей' },
    { command: 'schedule', description: '📅 График работы' },
    { command: 'current', description: '🚗 Текущие рейсы' },
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
      .text('🌐 Веб-форма', 'open_webapp').row()
      .text('📚 База знаний', 'open_instructions');
    
    ctx.reply(
      '👋 **Добро пожаловать в Driver Bot!**\n\n' +
      'Это ваш оперативный помощник для управления водителями и графиками работы.\n\n' +
      '**Доступные команды:**\n' +
      '/drivers - Показать список водителей\n' +
      '/schedule - Показать график работы\n' +
      '/current - Текущие рейсы\n' +
      '/webapp - Открыть веб-форму для управления\n' +
      '/driver <ID> - Показать карточку водителя\n' +
      '/instructions - Открыть базу знаний',
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

  // Callback для открытия календаря
  bot.callbackQuery('open_schedule_webapp', (ctx) => {
    const keyboard = new InlineKeyboard()
      .url('📅 Открыть календарь', `${WEBAPP_URL}#/schedule`)
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
