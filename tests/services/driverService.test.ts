
// tests/services/driverService.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { knexInstance as db } from '../../src/database/knex.js';
import { DriverService } from '../../src/services/driverService.js';
import type { NewDriver } from '../../src/models/Driver.js';

const driverService = new DriverService();

// Образец данных для тестов
const sampleDriver: NewDriver = {
  personalData: {
    lastName: 'Тестов',
    firstName: 'Сервис',
    patronymic: 'Тестович',
    birthDate: new Date('1991-01-01'),
  },
  passport: {
    series: '1111',
    number: '222222',
    issuedBy: 'Тестовым ОВД',
    issueDate: new Date('2011-01-01'),
    departmentCode: '111-222',
    registrationAddress: 'г. Тест, ул. Сервисная, 1',
  },
  vehicle: {
    make: 'ТестМарка',
    model: 'СервисМодель',
    licensePlate: 'С333ЕР777',
    vin: 'TESTSERVICEVIN001',
    year: 2021,
    type: 'Тестовый',
    bodyColor: 'Сервисный',
    ptsNumber: 'PTS_SERVICE',
    stsNumber: 'STS_SERVICE',
    stsIssueInfo: 'ГИБДД Сервис',
  },
};

describe('DriverService Integration Test', () => {
  // --- Управление БД ---
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('drivers').delete();
  });

  // --- Тесты ---
  it('should create a new driver and return it with an ID', async () => {
    const newDriver = await driverService.createDriver(sampleDriver);
    
    expect(newDriver).toBeDefined();
    expect(newDriver.id).toBeTypeOf('number');
    expect(newDriver.personalData.lastName).toBe(sampleDriver.personalData.lastName);

    // Проверяем, что запись действительно появилась в БД
    const dbDriver = await db('drivers').where({ id: newDriver.id }).first();
    expect(dbDriver).toBeDefined();
  });

  it('should find a driver by ID', async () => {
    const { id } = await driverService.createDriver(sampleDriver);
    const foundDriver = await driverService.findDriverById(id);

    expect(foundDriver).not.toBeNull();
    expect(foundDriver?.id).toBe(id);
    expect(foundDriver?.personalData.lastName).toBe(sampleDriver.personalData.lastName);
  });

  it('should return null when finding a non-existent driver', async () => {
    const foundDriver = await driverService.findDriverById(99999);
    expect(foundDriver).toBeNull();
  });

  it('should update a driver', async () => {
    const { id } = await driverService.createDriver(sampleDriver);
    const updatedData = {
      personalData: { ...sampleDriver.personalData, lastName: 'Обновленный' },
    };

    const updatedDriver = await driverService.updateDriver(id, updatedData);
    
    expect(updatedDriver).not.toBeNull();
    expect(updatedDriver?.id).toBe(id);
    expect(updatedDriver?.personalData.lastName).toBe('Обновленный');

    // Проверяем данные в БД
    const dbDriver = await db('drivers').where({ id }).first();
    const parsedPersonalData = JSON.parse(dbDriver.personalData);
    expect(parsedPersonalData.lastName).toBe('Обновленный');
  });

  it('should get all drivers with pagination', async () => {
    // Создаем 15 водителей
    for (let i = 0; i < 15; i++) {
      await driverService.createDriver({
        ...sampleDriver,
        personalData: { ...sampleDriver.personalData, firstName: `Водитель ${i + 1}` },
      });
    }

    // Запрашиваем вторую страницу по 5 водителей
    const result = await driverService.getAllDrivers({ page: 2, limit: 5 });

    expect(result.drivers.length).toBe(5);
    expect(result.total).toBe(15);
    // Проверяем, что это действительно вторая страница
    expect(result.drivers[0].personalData.firstName).toBe('Водитель 6');
  });

  it('should delete a driver', async () => {
    const { id } = await driverService.createDriver(sampleDriver);
    
    // Убедимся, что он есть
    let driver = await driverService.findDriverById(id);
    expect(driver).not.toBeNull();

    // Удаляем
    await driverService.deleteDriver(id);

    // Проверяем, что его больше нет
    driver = await driverService.findDriverById(id);
    expect(driver).toBeNull();
  });
});
