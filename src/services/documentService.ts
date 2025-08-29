// src/services/documentService.ts

import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { DriverService } from './driverService.js'; // Импортируем только тип
import type { Driver } from '../models/Driver.js';

// Путь к папке с шаблонами
const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');

/**
 * Преобразует данные водителя в плоский объект для шаблонизатора.
 * @param driver - Объект водителя из БД.
 * @returns Плоский объект с данными.
 */
function flattenDriverData(driver: Driver): Record<string, any> {
  const flatData: Record<string, any> = {};

  // ... (остальная логика без изменений)
  for (const [key, value] of Object.entries(driver)) {
    if (typeof value !== 'object' && value !== null) {
      flatData[key.toLowerCase()] = value;
    }
  }
  if (driver.personalData) {
    for (const [key, value] of Object.entries(driver.personalData)) {
      flatData[key.toLowerCase()] = value;
    }
  }
  if (driver.passport) {
    for (const [key, value] of Object.entries(driver.passport)) {
      flatData[`passport_${key.toLowerCase()}`] = value;
    }
  }
  if (driver.vehicle) {
    for (const [key, value] of Object.entries(driver.vehicle)) {
      flatData[`vehicle_${key.toLowerCase()}`] = value;
    }
  }
  if (driver.driverLicense) {
    for (const [key, value] of Object.entries(driver.driverLicense)) {
      flatData[`driver_license_${key.toLowerCase()}`] = value;
    }
  }
  if (driver.leaseAgreement) {
    for (const [key, value] of Object.entries(driver.leaseAgreement)) {
      flatData[`lease_agreement_${key.toLowerCase()}`] = value;
    }
  }
  if (driver.personalData?.birthDate) {
      flatData['birthdate_formatted'] = new Date(driver.personalData.birthDate).toLocaleDateString('ru-RU');
  }

  return flatData;
}


/**
 * Генерирует договор аренды для указанного водителя.
 * @param driverId - ID водителя.
 * @param driverService - Экземпляр сервиса для работы с водителями.
 * @returns Buffer с сгенерированным DOCX файлом.
 */
export async function generateLeaseAgreement(driverId: number, driverService: DriverService): Promise<Buffer> {
  const driver = await driverService.findDriverById(driverId);
  if (!driver) {
    throw new Error(`Водитель с ID ${driverId} не найден.`);
  }

  const templatePath = path.join(TEMPLATES_DIR, 'lease_agreement_template.docx');
  const content = await fs.readFile(templatePath);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const dataForTemplate = flattenDriverData(driver);
  
  console.log('Данные для шаблона:', dataForTemplate);

  doc.setData(dataForTemplate);

  try {
    doc.render();
  } catch (error: any) {
    console.error("Ошибка при рендеринге шаблона:", error.message);
    if (error.properties && error.properties.errors) {
      error.properties.errors.forEach((err: any) => {
        console.error("- ", err.stack);
      });
    }
    throw error;
  }

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
}