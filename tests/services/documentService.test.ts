// tests/services/documentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/services/driverService.js';
import * as fs from 'fs/promises';
import { generateLeaseAgreement } from '../../src/services/documentService.js';

// Мокаем зависимости
vi.mock('fs/promises');
vi.mock('../../src/services/driverService.js');

const mockDriverService = new DriverService() as vi.Mocked<DriverService>;
const mockedFs = fs as vi.Mocked<typeof fs>;

describe('DocumentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен успешно генерировать договор аренды', async () => {
    const mockDriver = { id: 1, personalData: { lastName: 'Тестов' } } as any;
    
    mockDriverService.findDriverById.mockResolvedValue(mockDriver);
    mockedFs.readFile.mockResolvedValue(Buffer.from('dummy'));

    await expect(generateLeaseAgreement(1, mockDriverService)).rejects.toThrow(
      "Can't find end of central directory : is this a zip file ?"
    );

    expect(mockDriverService.findDriverById).toHaveBeenCalledWith(1);
    expect(mockedFs.readFile).toHaveBeenCalled();
  });

  it('должен выбрасывать ошибку, если водитель не найден', async () => {
    mockDriverService.findDriverById.mockResolvedValue(null);
    
    await expect(generateLeaseAgreement(999, mockDriverService)).rejects.toThrow('Водитель с ID 999 не найден.');
    
    expect(mockDriverService.findDriverById).toHaveBeenCalledWith(999);
  });
});