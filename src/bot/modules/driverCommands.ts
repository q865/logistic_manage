import { Bot, InlineKeyboard } from 'grammy';
import { DriverService } from '../../services/driverService.js';
import type { Driver } from '../../models/Driver.js';

const PAGE_LIMIT = 5;

export class DriverCommands {
  private driverService: DriverService;

  constructor(driverService: DriverService) {
    this.driverService = driverService;
  }

  /**
   * Регистрирует все команды для работы с водителями
   */
  registerCommands(bot: Bot): void {
    // Команда для просмотра списка водителей
    bot.command('drivers', this.handleDriversList.bind(this));
    
    // Обработчики для inline кнопок
    bot.callbackQuery(/^drivers_page_(\d+)$/, this.handleDriversPage.bind(this));
    bot.callbackQuery(/^driver_details_(\d+)$/, this.handleDriverDetails.bind(this));
  }

  /**
   * Обработчик команды /drivers
   */
  private async handleDriversList(ctx: any): Promise<void> {
    try {
      const { text, keyboard } = await this.createDriversListMessage(1);
      await ctx.reply(text, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка получения списка водителей:', error);
      await ctx.reply('❌ Произошла ошибка при получении списка водителей');
    }
  }

  /**
   * Обработчик пагинации списка водителей
   */
  private async handleDriversPage(ctx: any): Promise<void> {
    try {
      const page = parseInt(ctx.match[1]);
      const { text, keyboard } = await this.createDriversListMessage(page);
      
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Ошибка пагинации водителей:', error);
      await ctx.answer('❌ Произошла ошибка при загрузке страницы');
    }
  }

  /**
   * Обработчик просмотра деталей водителя
   */
  private async handleDriverDetails(ctx: any): Promise<void> {
    try {
      const driverId = parseInt(ctx.match[1]);
      const driver = await this.driverService.findDriverById(driverId);
      
      if (!driver) {
        await ctx.answer('❌ Водитель не найден');
        return;
      }

      const details = this.formatDriverDetails(driver);
      const keyboard = new InlineKeyboard()
        .text('◀️ Назад к списку', 'drivers_page_1');

      await ctx.editMessageText(details, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Ошибка получения деталей водителя:', error);
      await ctx.answer('❌ Произошла ошибка при получении данных водителя');
    }
  }

  /**
   * Создает сообщение со списком водителей
   */
  private async createDriversListMessage(page = 1): Promise<{ text: string; keyboard: InlineKeyboard }> {
    const { drivers, total } = await this.driverService.getAllDrivers({ page, limit: PAGE_LIMIT });
    const totalPages = Math.ceil(total / PAGE_LIMIT) || 1;
    
    let text = `**👥 Список водителей (Страница ${page} из ${totalPages})**\n\n`;
    
    if (total === 0) {
      text = '❌ Водителей в базе данных пока нет.';
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
  }

  /**
   * Форматирует детали водителя для отображения
   */
  private formatDriverDetails(driver: Driver): string {
    return `**👤 Водитель ID: ${driver.id}**\n` +
           `*ФИО:* ${driver.personalData.lastName} ${driver.personalData.firstName} ${driver.personalData.patronymic || ''}\n` +
           `*Дата рождения:* ${new Date(driver.personalData.birthDate).toLocaleDateString('ru-RU')}\n\n` +
           `**🚗 Автомобиль**\n` +
           `*Марка/Модель:* ${driver.vehicle.make} ${driver.vehicle.model}\n` +
           `*Гос. номер:* ${driver.vehicle.licensePlate}`;
  }
}
