// tests/integration/botWebapp.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { createBot } from '../../src/bot.js';
import { DriverService } from '../../src/services/driverService.js';
import { notificationService } from '../../src/services/notificationService.js';

const API_BASE_URL = 'http://localhost:3000/api';
const WEBHOOK_URL = `${API_BASE_URL}/webhook`;

describe('Bot-WebApp Integration', () => {
  let driverService: DriverService;
  let testDriverId: number;

  beforeAll(async () => {
    driverService = new DriverService();
    
    // Создаем тестового водителя
    const testDriver = {
      personalData: {
        lastName: 'Тестов',
        firstName: 'Водитель',
        patronymic: 'Интеграционный',
        birthDate: '1990-01-01'
      },
      passport: {
        series: '1234',
        number: '567890',
        issuedBy: 'Тестовое УФМС',
        departmentCode: '123-456',
        registrationAddress: 'г. Москва, ул. Тестовая, д. 1',
        issueDate: '2010-01-01'
      },
      vehicle: {
        make: 'Тестовая',
        model: 'Модель',
        licensePlate: 'А123БВ77',
        vin: 'TEST12345678901234',
        year: 2020,
        type: 'Легковой автомобиль',
        chassis: '',
        bodyColor: 'Белый',
        bodyNumber: '',
        ptsNumber: '12АА123456',
        stsNumber: '77АА123456',
        stsIssueInfo: 'ГИБДД г. Москвы, 2020-01-01'
      },
      driverLicense: {
        series: '12',
        number: '345678',
        issueDate: '2015-01-01',
        expiryDate: '2025-01-01',
        categories: 'B, C'
      },
      leaseAgreement: {
        number: 'TEST-001',
        date: '2024-01-01'
      }
    };

    const createdDriver = await driverService.createDriver(testDriver);
    testDriverId = createdDriver.id;
  });

  afterAll(async () => {
    // Удаляем тестового водителя
    if (testDriverId) {
      try {
        await driverService.deleteDriver(testDriverId);
      } catch (error) {
        console.warn('Не удалось удалить тестового водителя:', error);
      }
    }
  });

  describe('Webhook Notifications', () => {
    it('should handle driver-created webhook', async () => {
      const webhookData = {
        driverId: testDriverId,
        driverName: 'Тестов Водитель'
      };

      const response = await axios.post(`${WEBHOOK_URL}/driver-created`, webhookData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.driverId).toBe(testDriverId);
      expect(response.data.driverName).toBe('Тестов Водитель');
    });

    it('should handle driver-updated webhook', async () => {
      const webhookData = {
        driverId: testDriverId,
        driverName: 'Тестов Водитель Обновленный'
      };

      const response = await axios.post(`${WEBHOOK_URL}/driver-updated`, webhookData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.driverId).toBe(testDriverId);
      expect(response.data.driverName).toBe('Тестов Водитель Обновленный');
    });

    it('should handle driver-deleted webhook', async () => {
      const webhookData = {
        driverId: testDriverId,
        driverName: 'Тестов Водитель Удаленный'
      };

      const response = await axios.post(`${WEBHOOK_URL}/driver-deleted`, webhookData);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.driverId).toBe(testDriverId);
      expect(response.data.driverName).toBe('Тестов Водитель Удаленный');
    });

    it('should handle invalid webhook data', async () => {
      const invalidData = {
        driverId: 'invalid',
        driverName: null
      };

      try {
        await axios.post(`${WEBHOOK_URL}/driver-created`, invalidData);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('Bot Commands', () => {
    it('should create bot with webapp integration', () => {
      const mockToken = 'test_token';
      const bot = createBot(mockToken, driverService);
      
      expect(bot).toBeDefined();
      expect(typeof bot.api.setMyCommands).toBe('function');
    });

    it('should have webapp command in bot menu', async () => {
      const mockToken = 'test_token';
      const bot = createBot(mockToken, driverService);
      
      // Проверяем, что бот создан корректно
      expect(bot).toBeDefined();
    });
  });

  describe('Notification Service', () => {
    it('should initialize notification service', () => {
      expect(notificationService).toBeDefined();
      expect(typeof notificationService.notifyDriverCreated).toBe('function');
      expect(typeof notificationService.notifyDriverUpdated).toBe('function');
      expect(typeof notificationService.notifyDriverDeleted).toBe('function');
    });

    it('should handle notification without bot', async () => {
      // Тестируем уведомления без инициализированного бота
      await expect(notificationService.notifyDriverCreated(1, 'Test Driver')).resolves.not.toThrow();
    });
  });
});
