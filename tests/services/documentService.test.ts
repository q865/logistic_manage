// tests/services/documentService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DriverService } from '../../src/services/driverService.js';
import { generateLeaseAgreement } from '../../src/services/documentService.js';
import type { Driver } from '../../src/models/Driver.js';
import { knexInstance as db } from '../../src/database/knex.js';
import fs from 'fs/promises';
import path from 'path';

// Используем реальный сервис, но с тестовой БД
describe('DocumentService Integration Test', () => {
  const driverService = new DriverService();

  beforeEach(async () => {
    console.log('[Test Setup] Running migrations...');
    await db.migrate.latest();
    console.log('[Test Setup] Migrations complete.');
  });

  afterEach(async () => {
    console.log('[Test Cleanup] Cleaning drivers table...');
    await db('drivers').del();
    console.log('[Test Cleanup] Table cleaned.');
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
    console.log(`[Test] Created driver with ID: ${driver.id}`);

    const docBuffer = await generateLeaseAgreement(driver.id, driverService);
    console.log('[Test] Document buffer generated.');

    // Проверяем, что файл не пустой
    expect(docBuffer.length).toBeGreaterThan(100);

    // Для более глубокой проверки можно было бы распаковать docx и проверить XML,
    // но для интеграционного теста достаточно убедиться, что ключевые, уникальные данные на месте.
    const docPath = path.resolve(process.cwd(), 'test-output.docx');
    await fs.writeFile(docPath, docBuffer); // Сохраняем для ручной проверки
    
    // Простая проверка: есть ли наши данные в "сыром" виде внутри zip-архива (docx)
    const docAsString = docBuffer.toString();
    expect(docAsString).toContain('Тестов');
    expect(docAsString).toContain('А123ТЕ777');
    expect(docAsString).toContain('9876');
    expect(docAsString).toContain('ДА-123');
  });

  it('should handle missing optional data gracefully without "undefined"', async () => {
    const minimalDriverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> = {
      personalData: { lastName: 'Минималов', firstName: 'Иван', birthDate: '1995-05-05' },
      passport: { series: '4510', number: '111222', issuedBy: 'ОВД', issueDate: '2015-01-01', departmentCode: '555-000', registrationAddress: 'г. Москва' },
      vehicle: { make: 'Лада', model: 'Гранта', licensePlate: 'В456ОР77', vin: 'VINMINIMAL', year: 2018, type: 'Седан', bodyColor: 'Белый', ptsNumber: 'PTSMIN', stsNumber: 'STSMIN', stsIssueInfo: 'ГИБДД Москва' },
    };
    const [driver] = await db('drivers').insert(minimalDriverData).returning('*');
    console.log(`[Test] Created minimal driver with ID: ${driver.id}`);

    const docBuffer = await generateLeaseAgreement(driver.id, driverService);
    console.log('[Test] Document with minimal data verified.');
    
    expect(docBuffer.length).toBeGreaterThan(100);
    const docAsString = docBuffer.toString();
    expect(docAsString).not.toContain('undefined');
  });
});