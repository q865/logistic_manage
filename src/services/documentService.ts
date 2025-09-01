


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
    
    // Добавляем поля точно как в поврежденном шаблоне
    data['vehicle bodyColor'] = driver.vehicle.bodyColor;
    data['vehicle bodyNumber'] = driver.vehicle.bodyNumber;
    data['vehicle chassis'] = driver.vehicle.chassis;
    data['vehicle_licensePlate'] = driver.vehicle.licensePlate;
    data['vehicle_make'] = driver.vehicle.make;
    data['vehicle_model'] = driver.vehicle.model;
    data['vehicle ptsNumber'] = driver.vehicle.ptsNumber;
    data['vehicle stsNumber'] = driver.vehicle.stsNumber;
    data['vehicle_type'] = driver.vehicle.type;
    data['vehicle_vin'] = driver.vehicle.vin;
    data['vehicle_year'] = driver.vehicle.year;
    
    // Добавляем поля для поврежденных плейсхолдеров
    data['personalData_firstName'] = driver.personalData?.firstName;
    data['personalData_lastName'] = driver.personalData?.lastName;
    data['personalData_patronymic'] = driver.personalData?.patronymic;
    data['passport_series'] = driver.passport?.series;
    data['passport_number'] = driver.passport?.number;
    data['passport_issuedBy'] = driver.passport?.issuedBy;
    data['passport_issueDate'] = driver.passport?.issueDate ? format(new Date(driver.passport.issueDate), 'dd.MM.yyyy') : '';
    data['passport_departmentCode'] = driver.passport?.departmentCode;
    data['lease_agreement_number'] = driver.leaseAgreement?.number;
    data['lease_agreement_date'] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
    
    // Добавляем поля для поврежденных плейсхолдеров с пробелами
    data['personalData firstname'] = driver.personalData?.firstName;
    data['personalData lastname'] = driver.personalData?.lastName;
    data['personalData patronymic'] = driver.personalData?.patronymic;
    
    // Добавляем поля для поврежденных плейсхолдеров с XML-тегами
    data['personalData_firstName'] = driver.personalData?.firstName;
    data['personalData_lastName'] = driver.personalData?.lastName;
    data['personalData_patronymic'] = driver.personalData?.patronymic;
    
    // Добавляем недостающие поля для шаблона
    data['марка, модель ТС'] = `${driver.vehicle?.make} ${driver.vehicle?.model}`;
    data['марка модель ТС'] = `${driver.vehicle?.make} ${driver.vehicle?.model}`;
    data['марка_модель_ТС'] = `${driver.vehicle?.make} ${driver.vehicle?.model}`;
    
    // Добавляем поля для VIN
    data['VIN'] = driver.vehicle?.vin;
    data['vin'] = driver.vehicle?.vin;
    data['идентификационный номер'] = driver.vehicle?.vin;
    
    // Добавляем поля для номера паспорта
    data['номер паспорта'] = driver.passport?.number;
    data['паспорт номер'] = driver.passport?.number;
    data['паспорт_номер'] = driver.passport?.number;
    
    // Добавляем поля для ФИО в конце
    data['ФИО_водителя'] = `${driver.personalData?.lastName} ${driver.personalData?.firstName} ${driver.personalData?.patronymic}`;
    data['ФИО водителя'] = `${driver.personalData?.lastName} ${driver.personalData?.firstName} ${driver.personalData?.patronymic}`;
    data['ФИО'] = `${driver.personalData?.lastName} ${driver.personalData?.firstName} ${driver.personalData?.patronymic}`;
  }
  if (driver.driverLicense) {
    data.driverlicense_series = driver.driverLicense.series || '';
    data.driverlicense_number = driver.driverLicense.number;
    data.driverlicense_issuedate = driver.driverLicense.issueDate ? format(new Date(driver.driverLicense.issueDate), 'dd.MM.yyyy') : '';
    data.driverlicense_expirydate = driver.driverLicense.expiryDate ? format(new Date(driver.driverLicense.expiryDate), 'dd.MM.yyyy') : '';
    data.driverlicense_categories = driver.driverLicense.categories || '';
    
    // Добавляем поля для шаблона
    data.driverLicense_series = driver.driverLicense.series || '';
    data.driverLicense_number = driver.driverLicense.number;
    data.driverLicense_issueDate = driver.driverLicense.issueDate ? format(new Date(driver.driverLicense.issueDate), 'dd.MM.yyyy') : '';
    data.driverLicense_expiryDate = driver.driverLicense.expiryDate ? format(new Date(driver.driverLicense.expiryDate), 'dd.MM.yyyy') : '';
    data.driverLicense_categories = driver.driverLicense.categories || '';
  }
  if (driver.leaseAgreement) {
    data.leaseagreement_number = driver.leaseAgreement.number;
    data.leaseagreement_date = driver.leaseAgreement.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
    
    // Добавляем поля для шаблона
    data.leaseAgreement_number = driver.leaseAgreement.number;
    data.leaseAgreement_date = driver.leaseAgreement.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  }

  data.driver_id = driver.id;
  data.current_date = format(new Date(), 'dd.MM.yyyy');
  data.fullname = `${data.lastname || ''} ${data.firstname || ''} ${data.patronymic || ''}`.trim();
  
  
  // НОВАЯ ПЕРЕМЕННАЯ: Фамилия с инициалами (например, "Панин С.А.")
  const firstNameInitial = data.firstname ? data.firstname.charAt(0) + '.' : '';
  const patronymicInitial = data.patronymic ? data.patronymic.charAt(0) + '.' : '';
  data['lastname_with_initials'] = `${data.lastname || ''} ${firstNameInitial}${patronymicInitial}`.trim();
  data['ФИО_с_инициалами'] = data['lastname_with_initials'];
  data['ФИО с инициалами'] = data['lastname_with_initials'];
  data['фамилия_инициалы'] = data['lastname_with_initials'];
  data['фамилия инициалы'] = data['lastname_with_initials'];


  // КРИТИЧЕСКИ ВАЖНО: Добавляем поля для дат с пробелами в конце (как в шаблоне)
  data['lease_agreement_date '] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  data['passport_issueDate'] = driver.passport?.issueDate ? format(new Date(driver.passport.issueDate), 'dd.MM.yyyy') : '';
  
  // Добавляем все возможные варианты дат
  data['lease_agreement_date'] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  data['lease_agreement_date '] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  data['lease_agreement_date  '] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  
  // Добавляем даты в разных форматах
  data['lease_agreement_date_dd_mm_yyyy'] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd.MM.yyyy') : '';
  data['lease_agreement_date_yyyy_mm_dd'] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'yyyy-MM-dd') : '';
  data['lease_agreement_date_full'] = driver.leaseAgreement?.date ? format(new Date(driver.leaseAgreement.date), 'dd MMMM yyyy') : '';
  
  // Добавляем даты паспорта в разных форматах
  data['passport_issueDate_dd_mm_yyyy'] = driver.passport?.issueDate ? format(new Date(driver.passport.issueDate), 'dd.MM.yyyy') : '';
  data['passport_issueDate_yyyy_mm_dd'] = driver.passport?.issueDate ? format(new Date(driver.passport.issueDate), 'yyyy-MM-dd') : '';
  data['passport_issueDate_full'] = driver.passport?.issueDate ? format(new Date(driver.passport.issueDate), 'dd MMMM yyyy') : '';
  
  // Добавляем текущую дату в разных форматах
  const now = new Date();
  data['current_date'] = format(now, 'dd.MM.yyyy');
  data['current_date_yyyy_mm_dd'] = format(now, 'yyyy-MM-dd');
  data['current_date_full'] = format(now, 'dd MMMM yyyy');
  data['today'] = format(now, 'dd.MM.yyyy');
  data['сегодня'] = format(now, 'dd.MM.yyyy');
  data['дата_сегодня'] = format(now, 'dd.MM.yyyy');

  // КРИТИЧЕСКИ ВАЖНО: Добавляем поврежденные плейсхолдеры с XML-тегами
  data['personalData_patronymic'] = driver.personalData?.patronymic || '';
  data['personalData_firstname'] = driver.personalData?.firstName || '';
  data['vehicle_make'] = driver.vehicle?.make || '';
  data['personalData_lastName'] = driver.personalData?.lastName || '';
  
  // Добавляем плейсхолдеры с пробелами в конце
  data['passport_number '] = driver.passport?.number || '';
  data['vehicle_vin '] = driver.vehicle?.vin || '';
  
  // Добавляем поврежденный плейсхолдер для марки и модели
  data['vehicle_make) $(vehicle_model'] = `${driver.vehicle?.make} ${driver.vehicle?.model}`;
  
  // КРИТИЧЕСКИ ВАЖНО: Добавляем поля для подписи арендодателя (с маленькой буквы)
  data['personalData_firstname'] = driver.personalData?.firstName || '';
  data['personalData_lastname'] = driver.personalData?.lastName || '';
  data['personalData_patronymic'] = driver.personalData?.patronymic || '';
  
  // Добавляем все возможные варианты для подписи
  data['personalData_firstName'] = driver.personalData?.firstName || '';
  data['personalData_lastName'] = driver.personalData?.lastName || '';
  data['personalData_patronymic'] = driver.personalData?.patronymic || '';
  
  // Добавляем поля для подписи с пробелами
  data['personalData firstname'] = driver.personalData?.firstName || '';
  data['personalData lastname'] = driver.personalData?.lastName || '';
  data['personalData patronymic'] = driver.personalData?.patronymic || '';
  
  // Добавляем поля для подписи с подчеркиваниями
  data['personalData_firstname'] = driver.personalData?.firstName || '';
  data['personalData_lastname'] = driver.personalData?.lastName || '';
  data['personalData_patronymic'] = driver.personalData?.patronymic || '';
  
  // Добавляем поля для подписи с тире
  data['personalData-firstname'] = driver.personalData?.firstName || '';
  data['personalData-lastname'] = driver.personalData?.lastName || '';
  data['personalData-patronymic'] = driver.personalData?.patronymic || '';
  
  // Добавляем поля для подписи с точками
  data['personalData.firstname'] = driver.personalData?.firstName || '';
  data['personalData.lastname'] = driver.personalData?.lastName || '';
  data['personalData.patronymic'] = driver.personalData?.patronymic || '';

  return data;
}

export async function generateLeaseAgreement(driverId: number, driverService: DriverService): Promise<Buffer> {
  const driver = await driverService.findDriverById(driverId);
  if (!driver) throw new Error(`Водитель с ID ${driverId} не найден.`);
  
  console.log('Driver data fetched for document generation:', driver); // Added debug
  const flattenedData = flattenDriverData(driver);
  console.log('Flattened data for document generation:', flattenedData); // Added debug

  const templatePath = path.join(TEMPLATES_DIR, 'lease_agreement_template.docx');
  const content = await fs.readFile(templatePath);

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render(flattenedData); // Changed to use flattenedData variable

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}