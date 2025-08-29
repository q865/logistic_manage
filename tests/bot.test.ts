// tests/bot.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bot } from 'grammy';
import { DriverService } from '../src/services/driverService.js';
import { Update } from '@grammyjs/types';

// Мокаем сервис
vi.mock('../src/services/driverService.js');

// --- Переменные ---
let bot: Bot;
let mockedDriverService: vi.Mocked<DriverService>;

// --- Инициализация бота (будет вызываться перед тестами) ---
async function initializeBot() {
  // Динамически импортируем бота, чтобы он зарегистрировал свои обработчики
  const botModule = await import('../src/bot.js');
  bot = (botModule as any).bot; // Получаем реальный инстанс бота
}

// --- Фабрика для создания фейковых апдейтов ---
function createMockUpdate(text: string): Update {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      date: Date.now(),
      chat: { id: 1, type: 'private' },
      text,
    },
  };
}

// --- Тесты ---
describe('Telegram Bot Integration Test', () => {

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Создаем свежий мок сервиса
    mockedDriverService = new DriverService() as vi.Mocked<DriverService>;
    (DriverService as vi.Mock).mockImplementation(() => mockedDriverService);

    // Инициализируем бота с его реальными обработчиками
    await initializeBot();
  });

  it('should reply to /start', async () => {
    const mockApi = { reply: vi.fn() };
    bot.api.config.use(() => ({ ok: true, result: true } as any));
    bot.api.reply = mockApi.reply;

    await bot.handleUpdate(createMockUpdate('/start'));

    expect(mockApi.reply).toHaveBeenCalledWith(expect.stringContaining('Добро пожаловать'));
  });

  it('should handle /drivers', async () => {
    mockedDriverService.getAllDrivers.mockResolvedValue({ drivers: [], total: 0 });
    const mockApi = { reply: vi.fn() };
    bot.api.config.use(() => ({ ok: true, result: true } as any));
    bot.api.reply = mockApi.reply;

    await bot.handleUpdate(createMockUpdate('/drivers'));

    expect(mockedDriverService.getAllDrivers).toHaveBeenCalled();
    expect(mockApi.reply).toHaveBeenCalledWith(expect.stringContaining('Водителей в базе данных пока нет.'), expect.any(Object));
  });

  // ... можно добавить больше тестов для других команд и кнопок ...

});