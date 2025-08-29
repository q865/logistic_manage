// src/services/notificationService.ts
import { Bot } from 'grammy';

export class NotificationService {
  private bot: Bot | null = null;
  private adminChatIds: string[] = [];

  constructor() {
    // Получаем список ID чатов администраторов из переменных окружения
    const adminIds = process.env.ADMIN_CHAT_IDS;
    if (adminIds) {
      this.adminChatIds = adminIds.split(',').map(id => id.trim());
    }
  }

  setBot(bot: Bot) {
    this.bot = bot;
  }

  async notifyDriverCreated(driverId: number, driverName: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }

    const message = `🚗 **Новый водитель добавлен!**\n\n` +
                   `*ID:* ${driverId}\n` +
                   `*ФИО:* ${driverName}\n` +
                   `*Дата:* ${new Date().toLocaleString('ru-RU')}\n\n` +
                   `Используйте команду /driver ${driverId} для просмотра деталей`;

    try {
      // Отправляем уведомление всем администраторам
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
      console.log(`[${new Date().toISOString()}] Уведомление о новом водителе отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }

  async notifyDriverUpdated(driverId: number, driverName: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }

    const message = `✏️ **Данные водителя обновлены!**\n\n` +
                   `*ID:* ${driverId}\n` +
                   `*ФИО:* ${driverName}\n` +
                   `*Дата:* ${new Date().toLocaleString('ru-RU')}\n\n` +
                   `Используйте команду /driver ${driverId} для просмотра деталей`;

    try {
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
      console.log(`[${new Date().toISOString()}] Уведомление об обновлении водителя отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }

  async notifyDriverDeleted(driverId: number, driverName: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }

    const message = `🗑️ **Водитель удален!**\n\n` +
                   `*ID:* ${driverId}\n` +
                   `*ФИО:* ${driverName}\n` +
                   `*Дата:* ${new Date().toLocaleString('ru-RU')}`;

    try {
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      
      console.log(`[${new Date().toISOString()}] Уведомление об удалении водителя отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }
}

// Экспортируем единственный экземпляр
export const notificationService = new NotificationService();
