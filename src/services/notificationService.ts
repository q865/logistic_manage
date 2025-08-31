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

  async notifyScheduleCreated(scheduleId: number, driverName: string, date: string, status: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }
    const statusIcons: Record<string, string> = {
      working: '🟢',
      off: '🔴',
      repair: '🔧',
      reserve: '🟡',
      vacation: '🏖️',
      loading: '⏰'
    };
    const statusIcon = statusIcons[status] || '📅';
    
    const message = `📅 **Новый график создан!**\n\n` +
                   `*ID:* ${scheduleId}\n` +
                   `*Водитель:* ${driverName}\n` +
                   `*Дата:* ${new Date(date).toLocaleDateString('ru-RU')}\n` +
                   `*Статус:* ${statusIcon} ${status}\n` +
                   `*Время создания:* ${new Date().toLocaleString('ru-RU')}`;
    try {
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      console.log(`[${new Date().toISOString()}] Уведомление о новом графике отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }

  async notifyScheduleUpdated(scheduleId: number, driverName: string, date: string, status: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }
    const statusIcons: Record<string, string> = {
      working: '🟢',
      off: '🔴',
      repair: '🔧',
      reserve: '🟡',
      vacation: '🏖️',
      loading: '⏰'
    };
    const statusIcon = statusIcons[status] || '📅';
    
    const message = `✏️ **График обновлен!**\n\n` +
                   `*ID:* ${scheduleId}\n` +
                   `*Водитель:* ${driverName}\n` +
                   `*Дата:* ${new Date(date).toLocaleDateString('ru-RU')}\n` +
                   `*Статус:* ${statusIcon} ${status}\n` +
                   `*Время обновления:* ${new Date().toLocaleString('ru-RU')}`;
    try {
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      console.log(`[${new Date().toISOString()}] Уведомление об обновлении графика отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }

  async notifyScheduleDeleted(scheduleId: number, driverName: string, date: string) {
    if (!this.bot) {
      console.warn('Бот не инициализирован для отправки уведомлений');
      return;
    }
    const message = `🗑️ **График удален!**\n\n` +
                   `*ID:* ${scheduleId}\n` +
                   `*Водитель:* ${driverName}\n` +
                   `*Дата:* ${new Date(date).toLocaleDateString('ru-RU')}\n` +
                   `*Время удаления:* ${new Date().toLocaleString('ru-RU')}`;
    try {
      for (const chatId of this.adminChatIds) {
        await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
      console.log(`[${new Date().toISOString()}] Уведомление об удалении графика отправлено в ${this.adminChatIds.length} чат(ов)`);
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  }
}

// Экспортируем единственный экземпляр
export const notificationService = new NotificationService();
