import { Bot, InlineKeyboard } from 'grammy';
import { DeliveryService } from '../../services/deliveryService.js';
import { ExcelProcessingService } from '../../services/excelProcessingService.js';

export class ExcelCommands {
  private deliveryService: DeliveryService;
  private excelProcessingService: ExcelProcessingService;

  constructor(deliveryService: DeliveryService, excelProcessingService: ExcelProcessingService) {
    this.deliveryService = deliveryService;
    this.excelProcessingService = excelProcessingService;
  }

  /**
   * Регистрирует все команды для работы с Excel файлами
   */
  registerCommands(bot: Bot): void {
    // Команды для Excel
    bot.command('excel', this.handleExcelMenu.bind(this));
    
    // Обработчики для inline кнопок
    bot.callbackQuery('excel_menu', this.handleExcelMenu.bind(this));
    bot.callbackQuery('excel_upload', this.handleExcelUpload.bind(this));
    bot.callbackQuery('excel_stats', this.handleExcelStats.bind(this));
    
    // Обработчик загрузки файлов
    bot.on('message:document', this.handleDocumentUpload.bind(this));
  }

  /**
   * Обработчик команды /excel
   */
  private async handleExcelMenu(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .text('📤 Загрузить Excel файл', 'excel_upload').row()
        .text('📊 Статистика обработки', 'excel_stats').row()
        .text('📋 Инструкции по формату', 'excel_instructions');

      await ctx.reply(
        '📊 **Обработка Excel файлов**\n\n' +
        'Выберите действие:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка меню Excel:', error);
      await ctx.reply('❌ Произошла ошибка при открытии меню Excel');
    }
  }

  /**
   * Обработчик загрузки Excel файла
   */
  private async handleExcelUpload(ctx: any): Promise<void> {
    try {
      const text = '📤 **Загрузка Excel файла**\n\n' +
                   '1️⃣ **Отправьте Excel файл** (.xlsx или .xls)\n\n' +
                   '📋 **Поддерживаемые форматы:**\n' +
                   '• .xlsx (Excel 2007+)\n' +
                   '• .xls (Excel 97-2003)\n\n' +
                   '⚠️ **Важно:**\n' +
                   '• Файл должен содержать данные о доставках\n' +
                   '• Первая строка - заголовки\n' +
                   '• Максимальный размер: 10 МБ';

      const keyboard = new InlineKeyboard()
        .text('◀️ Назад', 'excel_menu');

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Ошибка загрузки Excel:', error);
      await ctx.answer('❌ Произошла ошибка при открытии загрузки');
    }
  }

  /**
   * Обработчик статистики Excel
   */
  private async handleExcelStats(ctx: any): Promise<void> {
    try {
      const stats = await this.excelProcessingService.getProcessingStats();
      
      const text = `📊 **Статистика обработки Excel**\n\n` +
                   `📦 **Всего доставок:** ${stats.total}\n` +
                   `⏳ **В обработке:** ${stats.pending}\n` +
                   `✅ **Завершено:** ${stats.completed}\n` +
                   `🕐 **Последнее обновление:** ${stats.lastUpdated.toLocaleString('ru-RU')}`;

      const keyboard = new InlineKeyboard()
        .text('◀️ Назад', 'excel_menu');

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Ошибка получения статистики Excel:', error);
      await ctx.answer('❌ Произошла ошибка при получении статистики');
    }
  }

  /**
   * Обработчик загрузки документа
   */
  private async handleDocumentUpload(ctx: any): Promise<void> {
    try {
      const document = ctx.message?.document;
      
      if (!document) {
        await ctx.reply('❌ Файл не найден');
        return;
      }

      // Проверяем формат файла
      if (!document.file_name?.endsWith('.xlsx') && !document.file_name?.endsWith('.xls')) {
        await ctx.reply(
          '❌ **Неверный формат файла**\n\n' +
          'Пожалуйста, отправьте файл в формате Excel (.xlsx или .xls).\n\n' +
          '**Поддерживаемые форматы:**\n' +
          '• .xlsx (Excel 2007+)\n' +
          '• .xls (Excel 97-2003)',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Проверяем размер файла (максимум 10 МБ)
      if (document.file_size && document.file_size > 10 * 1024 * 1024) {
        await ctx.reply(
          '❌ **Файл слишком большой**\n\n' +
          'Максимальный размер файла: 10 МБ\n' +
          'Размер вашего файла: ' + Math.round(document.file_size / 1024 / 1024 * 100) / 100 + ' МБ',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await ctx.reply('⏳ **Обрабатываю файл...**\n\nПожалуйста, подождите...', { parse_mode: 'Markdown' });

      try {
        // Получаем файл
        const file = await ctx.getFile();
        const fileBuffer = await file.download();

        // Обрабатываем Excel файл
        const deliveries = await this.deliveryService.loadFromExcel(fileBuffer);

        if (deliveries.length === 0) {
          await ctx.reply(
            '⚠️ **Файл обработан, но данные не найдены**\n\n' +
            'Возможные причины:\n' +
            '• Неверный формат данных\n' +
            '• Пустой файл\n' +
            '• Неправильная структура таблицы',
            { parse_mode: 'Markdown' }
          );
          return;
        }

        const keyboard = new InlineKeyboard()
          .text('📊 Статистика', 'excel_stats')
          .text('📋 Все доставки', 'all_deliveries');

        await ctx.reply(
          `✅ **Файл успешно обработан!**\n\n` +
          `📦 **Загружено доставок:** ${deliveries.length}\n` +
          `📅 **Дата обработки:** ${new Date().toLocaleString('ru-RU')}\n\n` +
          `Файл: \`${document.file_name}\``,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );

      } catch (processingError) {
        console.error('Ошибка обработки Excel файла:', processingError);
        await ctx.reply(
          '❌ **Ошибка обработки файла**\n\n' +
          'Возможные причины:\n' +
          '• Поврежденный файл\n' +
          '• Неподдерживаемый формат\n' +
          '• Ошибка в структуре данных\n\n' +
          'Попробуйте проверить файл и загрузить снова.',
          { parse_mode: 'Markdown' }
        );
      }

    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
      await ctx.reply('❌ Произошла ошибка при загрузке файла');
    }
  }
}
