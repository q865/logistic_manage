import { Bot, InlineKeyboard } from 'grammy';
import { DeliveryService } from '../../services/deliveryService.js';
import type { Delivery } from '../../models/Delivery.js';

export class DeliveryCommands {
  private deliveryService: DeliveryService;

  constructor(deliveryService: DeliveryService) {
    this.deliveryService = deliveryService;
  }

  /**
   * Регистрирует все команды для работы с доставками
   */
  registerCommands(bot: Bot): void {
    // Команды для доставок
    bot.command('deliveries', this.handleDeliveriesList.bind(this));
    bot.command('stats', this.handleDeliveryStats.bind(this));
    
    // Обработчики для inline кнопок
    bot.callbackQuery('deliveries_menu', this.handleDeliveriesMenu.bind(this));
    bot.callbackQuery('current_deliveries', this.handleCurrentDeliveries.bind(this));
    bot.callbackQuery('delivery_stats', this.handleDeliveryStats.bind(this));
  }

  /**
   * Обработчик команды /deliveries
   */
  private async handleDeliveriesList(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .text('🚚 Текущие доставки', 'current_deliveries').row()
        .text('📊 Статистика', 'delivery_stats').row()
        .text('📋 Все доставки', 'all_deliveries');

      await ctx.reply(
        '📦 **Управление доставками**\n\n' +
        'Выберите действие:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка меню доставок:', error);
      await ctx.reply('❌ Произошла ошибка при открытии меню доставок');
    }
  }

  /**
   * Обработчик команды /stats
   */
  private async handleDeliveryStats(ctx: any): Promise<void> {
    try {
      const stats = await this.deliveryService.getCargoStatistics();
      
      const text = `📊 **Статистика доставок**\n\n` +
                   `📦 **Всего доставок:** ${stats.totalDeliveries}\n` +
                   `📏 **Общий объем:** ${stats.totalVolume} куб.м\n` +
                   `⚖️ **Общий вес:** ${stats.totalWeight} кг\n\n` +
                   `📊 **Средние показатели:**\n` +
                   `📏 **Средний объем:** ${stats.averageVolume} куб.м\n` +
                   `⚖️ **Средний вес:** ${stats.averageWeight} кг`;

      // Проверяем, является ли это ответом на callback query
      if (ctx.callbackQuery) {
        const keyboard = new InlineKeyboard()
          .text('◀️ Назад', 'deliveries_menu');
        
        await ctx.editMessageText(text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await ctx.reply(text, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      if (ctx.callbackQuery) {
        await ctx.answer('❌ Произошла ошибка при получении статистики');
      } else {
        await ctx.reply('❌ Произошла ошибка при получении статистики');
      }
    }
  }

  /**
   * Обработчик меню доставок
   */
  private async handleDeliveriesMenu(ctx: any): Promise<void> {
    try {
      const keyboard = new InlineKeyboard()
        .text('🚚 Текущие доставки', 'current_deliveries').row()
        .text('📊 Статистика', 'delivery_stats').row()
        .text('📋 Все доставки', 'all_deliveries');

      await ctx.editMessageText(
        '📦 **Управление доставками**\n\n' +
        'Выберите действие:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Ошибка меню доставок:', error);
      await ctx.answer('❌ Произошла ошибка при открытии меню доставок');
    }
  }

  /**
   * Обработчик текущих доставок
   */
  private async handleCurrentDeliveries(ctx: any): Promise<void> {
    try {
      const currentDeliveries = await this.deliveryService.getCurrentDeliveries();
      
      if (currentDeliveries.length === 0) {
        const keyboard = new InlineKeyboard()
          .text('◀️ Назад', 'deliveries_menu');
        
        await ctx.editMessageText(
          '📦 **Текущие доставки**\n\n' +
          'На сегодня доставок нет.',
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
        return;
      }

      let text = `📦 **Текущие доставки (${currentDeliveries.length})**\n\n`;
      
      currentDeliveries.forEach((delivery, index) => {
        text += `**${index + 1}. Заказ №${delivery.orderNumber}**\n` +
                `👤 ${delivery.customerName}\n` +
                `📦 ${delivery.cargoVolume} куб.м / ${delivery.cargoWeight} кг\n` +
                `⏰ ${delivery.deliveryTime}\n` +
                `🏢 ${delivery.companyName}\n\n`;
      });

      const keyboard = new InlineKeyboard()
        .text('◀️ Назад', 'deliveries_menu');

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Ошибка получения текущих доставок:', error);
      await ctx.answer('❌ Произошла ошибка при получении текущих доставок');
    }
  }



  /**
   * Форматирует доставку для отображения
   */
  private formatDelivery(delivery: Delivery): string {
    return `**📦 Заказ №${delivery.orderNumber}**\n` +
           `👤 **Клиент:** ${delivery.customerName}\n` +
           `📦 **Груз:** ${delivery.cargoVolume} куб.м / ${delivery.cargoWeight} кг\n` +
           `📅 **Дата заказа:** ${delivery.orderDate} ${delivery.orderTime}\n` +
           `🚚 **Дата доставки:** ${delivery.deliveryDate} ${delivery.deliveryTime}\n` +
           `🏢 **Компания:** ${delivery.companyName}`;
  }
}
