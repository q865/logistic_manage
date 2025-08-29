// tests/services/documentService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DriverService } from '../../src/services/driverService.js';
import { generateLeaseAgreement } from '../../src/services/documentService.js';
import type { Driver } from '../../src/models/Driver.js';
import { knexInstance as db } from '../../src/database/knex.js';
import JSZip from 'jszip';

describe('DocumentService Integration Test', () => {
  const driverService = new DriverService();

  beforeEach(async () => {
    await db.migrate.latest();
  });

  afterEach(async () => {
    await db('drivers').del();
  });

  it('should generate a .docx file with all driver data correctly filled', async () => {
    const fullDriverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> = {
      personalData: { lastName: 'Тестов', firstName: 'Тест', patronymic: 'Тестович', birthDate: '1990-01-15' },
      passport: { series: '1234', number: '567890', issuedBy: 'Тестовым отделом УФМС', issueDate: '2010-02-20', departmentCode: '123-456', registrationAddress: 'г. Тест, ул. Тестовая, д. 1, кв. 2' },
      vehicle: { make: 'ТестМарка', model: 'ТестМодель', licensePlate: 'А123ТЕ777', vin: 'TESTVIN1234567890', year: 2020, type: 'Легковой', chassis: 'TESTCHASSIS', bodyColor: 'Тестовый цвет', bodyNumber: 'TESTBODY', ptsNumber: 'TESTPTS123', stsNumber: 'TESTSTS456', stsIssueInfo: 'ГИБДД г. Тест, 21.02.2020' },
      driverLicense: { series: '9876', number: '543210', issueDate: '2015-03-25', expiryDate: '2025-03-24', categories: 'B, C' },
      leaseAgreement: { number: 'ДА-123', date: '2024-01-01' },
    };
    const [driver] = await db('drivers').insert(fullDriverData).returning('*');

    const docBuffer = await generateLeaseAgreement(driver.id, driverService);

    // Распаковываем docx и проверяем содержимое
    const zip = await JSZip.loadAsync(docBuffer);
    const docXml = await zip.file('word/document.xml')?.async('string');

    expect(docXml).toBeDefined();
    expect(docXml).toContain('Тестов Тест Тестович');
    expect(docXml).toContain('А123ТЕ777');
    expect(docXml).toContain('9876');
    expect(docXml).toContain('ДА-123');
  });
});