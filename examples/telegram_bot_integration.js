/**
 * Пример интеграции ExcelParser с Telegram ботом
 * Демонстрирует, как использовать парсер для обработки Excel файлов
 */

import { Telegraf } from 'telegraf';
import ExcelParser from '../src/parsers/excelParser.js';

// Инициализация бота (замените на свой токен)
const bot = new Telegraf('YOUR_BOT_TOKEN_HERE');

// Обработчик команды /start
bot.start((ctx) => {
  ctx.reply(
    '🚚 Добро пожаловать в бот для обработки грузов!\n\n' +
    'Отправьте Excel файл с данными о грузах для автоматической обработки.'
  );
});

// Обработчик команды /help
bot.help((ctx) => {
  ctx.reply(
    '📋 **Доступные команды:**\n\n' +
    '/start - Начать работу с ботом\n' +
    '/help - Показать справку\n' +
    '/test - Протестировать парсер\n\n' +
    '📁 **Отправьте Excel файл** для автоматической обработки данных о грузах.'
  );
});

// Обработчик команды /test
bot.command('test', (ctx) => {
  // Тестовые данные для демонстрации
  const testRow = [
    "01.09.25_77_00ч_ВИП_19",
    "3.32 куб.м/871 кг/1.010 м/Нет",
    "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202",
    'ООО "ГРУЗ СЕРВИС"'
  ];
  
  const parsedData = ExcelParser.parseRow(testRow);
  
  if (ExcelParser.validate(parsedData)) {
    const formatted = ExcelParser.format(parsedData);
    ctx.reply(formatted, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('❌ Ошибка в тестовых данных');
  }
});

// Обработчик загрузки документов
bot.on('document', async (ctx) => {
  const document = ctx.message.document;
  
  // Проверяем, что это Excel файл
  if (document.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    ctx.reply('📊 Получен Excel файл. Обрабатываю...');
    
    try {
      // Здесь должна быть логика загрузки и парсинга Excel файла
      // Для демонстрации используем тестовые данные
      await processExcelFile(ctx, document);
      
    } catch (error) {
      console.error('Ошибка обработки файла:', error);
      ctx.reply('❌ Произошла ошибка при обработке файла');
    }
  } else {
    ctx.reply('❌ Пожалуйста, отправьте Excel файл (.xlsx)');
  }
});

// Функция обработки Excel файла
async function processExcelFile(ctx, document) {
  // В реальном приложении здесь будет:
  // 1. Скачивание файла по file_id
  // 2. Парсинг Excel с помощью библиотеки (например, xlsx)
  // 3. Обработка каждой строки через ExcelParser
  
  // Для демонстрации используем тестовые данные
  const mockExcelData = [
    [
      "01.09.25_77_00ч_ВИП_19",
      "3.32 куб.м/871 кг/1.010 м/Нет",
      "13908.Заказано.01\\.09\\.2025 00:00:00.Кулушов Марат Шайлообаевич........01\\.09\\.2025 01:30:00..202",
      'ООО "ГРУЗ СЕРВИС"'
    ],
    [
      "02.09.25_78_12ч_СТАНДАРТ_25",
      "2.15 куб.м/450 кг/0.850 м/Да",
      "13909.Заказано.02\\.09\\.2025 12:00:00.Иванов Иван Иванович........02\\.09\\.2025 14:30:00..203",
      'ООО "ГРУЗ СЕРВИС"'
    ]
  ];
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (const row of mockExcelData) {
    const parsedData = ExcelParser.parseRow(row);
    
    if (ExcelParser.validate(parsedData)) {
      const formatted = ExcelParser.format(parsedData);
      await ctx.reply(formatted, { parse_mode: 'Markdown' });
      processedCount++;
    } else {
      await ctx.reply(`❌ Ошибка в строке: ${row.join(' | ')}`);
      errorCount++;
    }
    
    // Небольшая задержка между сообщениями
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Итоговый отчет
  await ctx.reply(
    `📊 **Обработка завершена!**\n\n` +
    `✅ Успешно обработано: ${processedCount}\n` +
    `❌ Ошибок: ${errorCount}\n\n` +
    `Все данные успешно распарсены и готовы к использованию.`
  );
}

// Обработчик текстовых сообщений
bot.on('text', (ctx) => {
  ctx.reply(
    '📁 Отправьте Excel файл с данными о грузах для обработки.\n\n' +
    'Или используйте команду /test для демонстрации работы парсера.'
  );
});

// Обработчик ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка бота:', err);
  ctx.reply('❌ Произошла внутренняя ошибка бота');
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log('🚀 Бот запущен!');
    console.log('📱 Используйте @BotFather для получения токена');
    console.log('🔗 Ссылка на бота будет доступна после настройки');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;
