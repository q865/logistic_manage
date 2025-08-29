
// src/services/documentService.ts
import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { DriverService } from './driverService.js';
import type { Driver } from '../models/Driver.js';
import { format } from 'date-fns';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');

function flattenDriverData(driver: Driver): Record<string, any> {
  const flatData: Record<string, any> = {};

  // Рекурсивная функция для "уплощения" объекта
  const flatten = (obj: Record<string, any>, prefix = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        flatten(obj[key], `${prefix}${key}_`);
      } else {
        flatData[`${prefix}${key}`.toLowerCase()] = obj[key];
      }
    }
  };

  flatten(driver);

  // Добавляем кастомные, отформатированные поля
  flatData['current_date'] = format(new Date(), 'dd.MM.yyyy');
  if (driver.personalData?.birthDate) {
    flatData['personaldata_birthdate'] = format(new Date(driver.personalData.birthDate), 'dd.MM.yyyy');
  }
  if (driver.passport?.issueDate) {
    flatData['passport_issuedate'] = format(new Date(driver.passport.issueDate), 'dd.MM.yyyy');
  }
  if (driver.driverLicense?.issueDate) {
    flatData['driverlicense_issuedate'] = format(new Date(driver.driverLicense.issueDate), 'dd.MM.yyyy');
  }
  if (driver.driverLicense?.expiryDate) {
    flatData['driverlicense_expirydate'] = format(new Date(driver.driverLicense.expiryDate), 'dd.MM.yyyy');
  }
  if (driver.leaseAgreement?.date) {
    flatData['leaseagreement_date'] = format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy');
  }

  return flatData;
}

export async function generateLeaseAgreement(driverId: number, driverService: DriverService): Promise<Buffer> {
  console.log(`[DocGen] Запрос на генерацию договора для водителя ID: ${driverId}`);
  const driver = await driverService.findDriverById(driverId);
  if (!driver) {
    throw new Error(`Водитель с ID ${driverId} не найден.`);
  }
  console.log(`[DocGen] Данные водителя ${driver.personalData.lastName} получены.`);

  const templatePath = path.join(TEMPLATES_DIR, 'lease_agreement_template.docx');
  const content = await fs.readFile(templatePath);
  console.log(`[DocGen] Шаблон '${templatePath}' успешно загружен.`);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const dataForTemplate = flattenDriverData(driver);
  console.log('[DocGen] Контекст для шаблона создан:', dataForTemplate);
  
  doc.render(dataForTemplate);
  console.log('[DocGen] Шаблон успешно отрендерен.');

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  console.log(`[DocGen] Договор для водителя ID: ${driverId} успешно сгенерирован.`);
  return buf;
}
