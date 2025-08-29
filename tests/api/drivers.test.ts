
// tests/api/drivers.test.ts
import request from 'supertest';
import express from 'express';
import { createDriverRouter } from '../../src/api/driverRoutes.js';
import { DriverService } from '../../src/services/driverService.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ... (создание мока и приложения остается тем же)
const mockDriverService: vi.Mocked<DriverService> = {
  createDriver: vi.fn(),
  findDriverById: vi.fn(),
  getAllDrivers: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
};
const app = express();
app.use(express.json());
app.use('/api/drivers', createDriverRouter(mockDriverService));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Driver API', () => {
  // ... (остальные тесты без изменений)

  describe('GET /api/drivers', () => {
    it('should return a paginated list of drivers', async () => {
      const mockResponse = {
        drivers: [{ id: 1, personalData: { lastName: 'Driver1' } }],
        total: 100
      };
      // Настраиваем мок, чтобы он возвращал новую структуру
      mockDriverService.getAllDrivers.mockResolvedValue(mockResponse as any);

      // Делаем запрос с параметрами пагинации
      const response = await request(app).get('/api/drivers?page=2&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      // Проверяем, что сервис был вызван с правильными числами
      expect(mockDriverService.getAllDrivers).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  // ... (остальные тесты без изменений)
});
