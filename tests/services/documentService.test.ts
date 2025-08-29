// tests/services/documentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/services/driverService.js';
import * as fs from 'fs/promises';
import { generateLeaseAgreement } from '../../src/services/documentService.js';
import type { Driver } from '../../src/models/Driver.js';

// Мокаем зависимости
vi.mock('fs/promises');

const mockDriverService: vi.Mocked<DriverService> = {
  createDriver: vi.fn(),
  findDriverById: vi.fn(),
  getAllDrivers: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
};

const mockedFs = fs as vi.Mocked<typeof fs>;

// Мокаем Docxtemplater, чтобы не проверять реальную генерацию docx
const mockDoc = {
  setData: vi.fn(),
  render: vi.fn(),
  getZip: vi.fn().mockReturnThis(),
  generate: vi.fn().mockReturnValue(Buffer.from('mock docx content')),
};
vi.mock('docxtemplater', () => ({
  default: vi.fn(() => mockDoc),
}));
vi.mock('pizzip', () => ({
  default: vi.fn(),
}));


describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен выбрасывать ошибку, если водитель не найден', async () => {
    mockDriverService.findDriverById.mockResolvedValue(null);
    await expect(generateLeaseAgreement(999, mockDriverService)).rejects.toThrow('Водитель с ID 999 не найден.');
  });

  it('должен корректно преобразовывать данные водителя и вызывать шаблонизатор', async () => {
    const mockDriver: Driver = {
      id: 1,
      personalData: {
        firstName: 'Иван',
        lastName: 'Иванов',
        patronymic: 'Иванович',
        birthDate: '1990-01-20',
      },
      passport: {
        series: '1234',
        number: '567890',
        issuedBy: 'ОВД',
        issueDate: '2010-02-20',
        departmentCode: '123-456',
        registrationAddress: 'г. Москва',
      },
      vehicle: {
        make: 'Lada',
        model: 'Granta',
        licensePlate: 'A123BC777',
        vin: 'TESTVIN',
        year: 2020,
        type: 'Седан',
        chassis: '123',
        bodyColor: 'Белый',
        bodyNumber: '456',
        ptsNumber: '789',
        stsNumber: '101',
        stsIssueInfo: 'ГИБДД',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDriverService.findDriverById.mockResolvedValue(mockDriver);
    mockedFs.readFile.mockResolvedValue(Buffer.from('dummy template'));

    await generateLeaseAgreement(1, mockDriverService);

    // Проверяем, что setData был вызван с правильными, "плоскими" данными
    expect(mockDoc.setData).toHaveBeenCalledOnce();
    const calledWithData = mockDoc.setData.mock.calls[0][0];

    // Проверяем ключевые поля
    expect(calledWithData).toHaveProperty('lastname', 'Иванов');
    expect(calledWithData).toHaveProperty('firstname', 'Иван');
    expect(calledWithData).toHaveProperty('patronymic', 'Иванович');
    expect(calledWithData).toHaveProperty('fullname', 'Иванов Иван Иванович');
    expect(calledWithData).toHaveProperty('series', '1234');
    expect(calledWithData).toHaveProperty('licenseplate', 'A123BC777');
    expect(calledWithData).toHaveProperty('birthdate_formatted', '20.01.1990');
    expect(calledWithData).toHaveProperty('issuedate_formatted', '20.02.2010');

    // Проверяем, что остальные шаги были выполнены
    expect(mockDoc.render).toHaveBeenCalledOnce();
    expect(mockDoc.getZip().generate).toHaveBeenCalledOnce();
  });
});