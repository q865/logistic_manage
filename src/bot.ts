
// src/bot.ts
import 'dotenv/config';
import { Bot, InlineKeyboard } from 'grammy';
import { DriverService } from './services/driverService.js';
import type { Driver } from './models/Driver.js';

const PAGE_LIMIT = 5;

// Фабрика для создания и настройки бота
export function createBot(token: string, driverService: DriverService) {
  const bot = new Bot(token);

  // --- Вспомогательные функции ---
  const formatDriverDetails = (driver: Driver): string => {
    return `**👤 Водитель ID: ${driver.id}**\n` +
           `*ФИО:* ${driver.personalData.lastName} ${driver.personalData.firstName} ${driver.personalData.patronymic || ''}\n` +
           `*Дата рождения:* ${new Date(driver.personalData.birthDate).toLocaleDateString('ru-RU')}\n\n` +
           `**🛂 Паспорт**\n` +
           `*Серия/Номер:* ${driver.passport.series} ${driver.passport.number}\n` +
           `*Кем выдан:* ${driver.passport.issuedBy}\n` +
           `*Дата выдачи:* ${new Date(driver.passport.issueDate).toLocaleDateString('ru-RU')}\n\n` +
           `**🚗 Автомобиль**\n` +
           `*Марка/Модель:* ${driver.vehicle.make} ${driver.vehicle.model}\n` +
           `*Гос. номер:* ${driver.vehicle.licensePlate}\n` +
           `*Год выпуска:* ${driver.vehicle.year}
` +           `*VIN:* ${driver.vehicle.vin}`
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

  // --- Команды ---
  bot.command(['start', 'help'], (ctx) => {
    ctx.reply(
      '👋 **Добро пожаловать в Driver Bot!**\n\n' +
      '**Доступные команды:**\n' +
      '/drivers - Показать список водителей\n' +
      '/driver <ID> - Показать детальную информацию о водителе',
      { parse_mode: 'Markdown' }
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
        .text('✏️ Редактировать (скоро)', `edit_driver_${driverId}`)
        .text('🗑️ Удалить', `delete_driver_${driverId}`);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
      await ctx.reply('Произошла ошибка при поиске водителя.');
    }
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

  bot.callbackQuery(/delete_driver_(\d+)/, async (ctx) => {
    const driverId = parseInt(ctx.match[1]!, 10);
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
    const driverId = parseInt(ctx.match[1]!, 10);
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
export async function startBot() {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('Ошибка: Не указан токен Telegram-бота.');
    process.exit(1);
  }
  const driverService = new DriverService();
  const bot = createBot(BOT_TOKEN, driverService);
  
  console.log('Запускаю Telegram-бота...');
  await bot.start();
}

// Если файл запускается напрямую
if (import.meta.url.startsWith('file://') && process.argv[1] === new URL(import.meta.url).pathname) {
  startBot();
}
