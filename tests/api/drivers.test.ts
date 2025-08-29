
// tests/api/drivers.test.ts
import request from 'supertest';
import express from 'express';
import { createDriverRouter } from '../../src/api/driverRoutes.js';
import { DriverService } from '../../src/services/driverService.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Создаем мок сервиса вручную
const mockDriverService: vi.Mocked<DriverService> = {
  createDriver: vi.fn(),
  findDriverById: vi.fn(),
  getAllDrivers: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
};

// Создаем тестовое Express-приложение и инжектим мок
const app = express();
app.use(express.json());
app.use('/api/drivers', createDriverRouter(mockDriverService));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Driver API', () => {

  describe('POST /api/drivers', () => {
    it('should create a new driver and return 201 status', async () => {
      const mockDriverPayload = {
        personalData: { lastName: 'Тестов', firstName: 'Тест', birthDate: new Date('1990-01-01') },
        passport: { series: '1234', number: '567890', issuedBy: 'Тестовым отделом', issueDate: new Date('2010-01-01'), departmentCode: '123-456' },
        vehicle: { make: 'TestMake', model: 'TestModel', licensePlate: 'A123BC78', vin: 'TESTVIN1234567890', year: 2020, type: 'Тестовый', bodyColor: 'Тестовый', ptsNumber: 'pts', stsNumber: 'sts', stsIssueInfo: 'info' },
        driverLicense: { number: '' },
        leaseAgreement: { number: '' },
      };
      const createdDriver = { id: 1, ...mockDriverPayload };
      const mockResolvedValue = { ...createdDriver, personalData: { ...createdDriver.personalData, birthDate: new Date('1990-01-01').toISOString() }, passport: { ...createdDriver.passport, issueDate: new Date('2010-01-01').toISOString() } };
      mockDriverService.createDriver.mockResolvedValue(mockResolvedValue as any);
      const response = await request(app).post('/api/drivers').send({ ...mockDriverPayload, personalData: { ...mockDriverPayload.personalData, birthDate: '1990-01-01' }, passport: { ...mockDriverPayload.passport, issueDate: '2010-01-01' } });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResolvedValue);
      expect(mockDriverService.createDriver).toHaveBeenCalledWith(mockDriverPayload);
    });
    it('should return 400 status if lastName is missing', async () => {
      const mockDriverPayload = { personalData: { firstName: 'Тест', birthDate: '1990-01-01' } };
      const response = await request(app).post('/api/drivers').send(mockDriverPayload);
      expect(response.status).toBe(400);
      expect(mockDriverService.createDriver).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/drivers', () => {
    it('should return a list of drivers', async () => {
      const mockDrivers = [{ id: 1, personalData: { lastName: 'Driver1' } }, { id: 2, personalData: { lastName: 'Driver2' } }];
      mockDriverService.getAllDrivers.mockResolvedValue(mockDrivers as any);
      const response = await request(app).get('/api/drivers');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDrivers);
      expect(mockDriverService.getAllDrivers).toHaveBeenCalled();
    });
  });

  describe('GET /api/drivers/:id', () => {
    it('should return a single driver if found', async () => {
      const mockDriver = { id: 1, personalData: { lastName: 'Driver1' } };
      mockDriverService.findDriverById.mockResolvedValue(mockDriver as any);
      const response = await request(app).get('/api/drivers/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDriver);
      expect(mockDriverService.findDriverById).toHaveBeenCalledWith(1);
    });
    it('should return 404 if driver not found', async () => {
      mockDriverService.findDriverById.mockResolvedValue(null);
      const response = await request(app).get('/api/drivers/999');
      expect(response.status).toBe(404);
      expect(mockDriverService.findDriverById).toHaveBeenCalledWith(999);
    });
  });

  describe('PUT /api/drivers/:id', () => {
    it('should update a driver and return it', async () => {
      const updateData = { personalData: { lastName: 'Updated' } };
      const updatedDriver = { id: 1, ...updateData };
      mockDriverService.updateDriver.mockResolvedValue(updatedDriver as any);
      const response = await request(app).put('/api/drivers/1').send(updateData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedDriver);
      expect(mockDriverService.updateDriver).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('DELETE /api/drivers/:id', () => {
    it('should delete a driver and return 204 status', async () => {
      mockDriverService.deleteDriver.mockResolvedValue(undefined);
      const response = await request(app).delete('/api/drivers/1');
      expect(response.status).toBe(204);
      expect(mockDriverService.deleteDriver).toHaveBeenCalledWith(1);
    });
  });

});
