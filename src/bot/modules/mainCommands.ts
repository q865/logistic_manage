import { Bot, InlineKeyboard } from 'grammy';

const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

export class MainCommands {
  /**
   * Регистрирует основные команды бота
   */
  registerCommands(bot: Bot): void {
    // Основные команды
    bot.command(['start', 'help'], this.handleStart.bind(this));
    bot.command('webapp', this.handleWebapp.bind(this));
    
    // Обработчики для inline кнопок
    bot.callbackQuery('open_webapp', this.handleWebapp.bind(this));
    bot.callbackQuery('main_menu', this.handleMainMenu.bind(this));
  }

  /**
   * Обработчик команд /start и /help
   */
  private async handleStart(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .text('👥 Список водителей', 'drivers_page_1').row()
        .text('📅 График работы', 'schedule_current').row()
        .text('🚗 Текущие рейсы', 'current_trips').row()
        .text('🚚 Управление рейсами', 'trips_menu').row()
        .text('📊 Excel файлы', 'excel_menu').row()
        .text('🌐 Веб-форма', 'open_webapp').row()
        .text('📚 База знаний', 'open_instructions');
      
      await ctx.reply(
        '👋 **Добро пожаловать в Driver Bot!**\n\n' +
        '🚚 **Система управления грузоперевозками**\n\n' +
        '**Основные возможности:**\n' +
        '• 👥 Управление водителями\n' +
        '• 📅 График работы\n' +
        '• 🚗 Управление рейсами\n' +
        '• 📦 Обработка доставок\n' +
        '• 📊 Excel файлы\n' +
        '• 🌐 Веб-интерфейс\n\n' +
        'Выберите нужный раздел:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка команды start:', error);
      await ctx.reply('❌ Произошла ошибка при запуске бота');
    }
  }

  /**
   * Обработчик команды /webapp
   */
  private async handleWebapp(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .url('🌐 Открыть веб-форму', WEBAPP_URL)
        .row()
        .text('◀️ Главное меню', 'main_menu');

      await ctx.reply(
        '🌐 **Веб-интерфейс**\n\n' +
        'Откройте веб-форму для удобной работы с системой:\n\n' +
        '**Возможности веб-интерфейса:**\n' +
        '• 📝 Создание и редактирование данных\n' +
        '• 📊 Детальная статистика\n' +
        '• 📅 Календарь и графики\n' +
        '• 📋 Управление рейсами\n' +
        '• 👥 Управление водителями\n\n' +
        'Нажмите кнопку ниже для открытия:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка команды webapp:', error);
      await ctx.reply('❌ Произошла ошибка при открытии веб-интерфейса');
    }
  }

  /**
   * Обработчик главного меню
   */
  private async handleMainMenu(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .text('👥 Список водителей', 'drivers_page_1').row()
        .text('📅 График работы', 'schedule_current').row()
        .text('🚗 Текущие рейсы', 'current_trips').row()
        .text('🚚 Управление рейсами', 'trips_menu').row()
        .text('📊 Excel файлы', 'excel_menu').row()
        .text('🌐 Веб-форма', 'open_webapp').row()
        .text('📚 База знаний', 'open_instructions');

      await ctx.editMessageText(
        '🏠 **Главное меню**\n\n' +
        'Выберите нужный раздел:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка главного меню:', error);
      await ctx.answer('❌ Произошла ошибка при открытии главного меню');
    }
  }
}
