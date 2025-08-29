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
  const data: Record<string, any> = {};

  // Тупо и надежно прописываем каждое поле
  if (driver.personalData) {
    data.lastname = driver.personalData.lastName;
    data.firstname = driver.personalData.firstName;
    data.patronymic = driver.personalData.patronymic || '';
    data.birthdate = driver.personalData.birthDate ? format(new Date(driver.personalData.birthDate), 'dd.MM.yyyy') : '';
  }
  if (driver.passport) {
    data.passport_series = driver.passport.series;
    data.passport_number = driver.passport.number;
    data.passport_issuedby = driver.passport.issuedBy;
    data.passport_issuedate = driver.passport.issueDate ? format(new Date(driver.passport.issueDate), 'dd.MM.yyyy') : '';
    data.passport_departmentcode = driver.passport.departmentCode;
    data.passport_registrationaddress = driver.passport.registrationAddress;
  }
  if (driver.vehicle) {
    data.vehicle_make = driver.vehicle.make;
    data.vehicle_model = driver.vehicle.model;
    data.vehicle_licenseplate = driver.vehicle.licensePlate;
    data.vehicle_vin = driver.vehicle.vin;
    data.vehicle_year = driver.vehicle.year;
    data.vehicle_type = driver.vehicle.type;
    data.vehicle_chassis = driver.vehicle.chassis;
    data.vehicle_bodycolor = driver.vehicle.bodyColor;
    data.vehicle_bodynumber = driver.vehicle.bodyNumber;
    data.vehicle_ptsnumber = driver.vehicle.ptsNumber;
    data.vehicle_stsnumber = driver.vehicle.stsNumber;
    data.vehicle_stsissueinfo = driver.vehicle.stsIssueInfo;
  }
  if (driver.driverLicense) {
    data.driverlicense_series = driver.driverLicense.series;
    data.driverlicense_number = driver.driverLicense.number;
    data.driverlicense_issuedate = driver.driverLicense.issueDate ? format(new Date(driver.driverLicense.issueDate), 'dd.MM.yyyy') : '';
    data.driverlicense_expirydate = driver.driverLicense.expiryDate ? format(new Date(driver.driverLicense.expiryDate), 'dd.MM.yyyy') : '';
    data.driverlicense_categories = driver.driverLicense.categories;
  }
  if (driver.leaseAgreement) {
    data.leaseagreement_number = driver.leaseAgreement.number;
    data.leaseagreement_date = driver.leaseAgreement.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  }

  data.driver_id = driver.id;
  data.current_date = format(new Date(), 'dd.MM.yyyy');
  data.fullname = `${data.lastname || ''} ${data.firstname || ''} ${data.patronymic || ''}`.trim();

  return data;
}

export async function generateLeaseAgreement(driverId: number, driverService: DriverService): Promise<Buffer> {
  const driver = await driverService.findDriverById(driverId);
  if (!driver) throw new Error(`Водитель с ID ${driverId} не найден.`);

  const templatePath = path.join(TEMPLATES_DIR, 'lease_agreement_template.docx');
  const content = await fs.readFile(templatePath);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  
  doc.render(flattenDriverData(driver));

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}