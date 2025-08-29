// src/services/driverService.ts
import { knexInstance as db } from '../database/knex.js';
import type { Driver } from '../models/Driver.js';

export type DriverCreationData = Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>;

// Функция для преобразования "плоского" объекта из БД в структурированный
const mapDbRowToDriver = (row: any): Driver => {
  return {
    id: row.id,
    personalData: {
      lastName: row.lastName,
      firstName: row.firstName,
      patronymic: row.patronymic,
      birthDate: row.birthDate,
    },
    passport: {
      series: row.passport_series,
      number: row.passport_number,
      issuedBy: row.passport_issuedBy,
      issueDate: row.passport_issueDate,
      departmentCode: row.passport_departmentCode,
      registrationAddress: row.passport_registrationAddress,
    },
    vehicle: {
      make: row.vehicle_make,
      model: row.vehicle_model,
      licensePlate: row.vehicle_licensePlate,
      vin: row.vehicle_vin,
      year: row.vehicle_year,
      type: row.vehicle_type,
      chassis: row.vehicle_chassis,
      bodyColor: row.vehicle_bodyColor,
      bodyNumber: row.vehicle_bodyNumber,
      ptsNumber: row.vehicle_ptsNumber,
      stsNumber: row.vehicle_stsNumber,
      stsIssueInfo: row.vehicle_stsIssueInfo,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class DriverService {
  public async createDriver(data: DriverCreationData): Promise<Driver> {
    const flatData = {
      lastName: data.personalData.lastName,
      firstName: data.personalData.firstName,
      patronymic: data.personalData.patronymic,
      birthDate: data.personalData.birthDate,
      passport_series: data.passport.series,
      passport_number: data.passport.number,
      passport_issuedBy: data.passport.issuedBy,
      passport_issueDate: data.passport.issueDate,
      passport_departmentCode: data.passport.departmentCode,
      passport_registrationAddress: data.passport.registrationAddress,
      vehicle_make: data.vehicle.make,
      vehicle_model: data.vehicle.model,
      vehicle_licensePlate: data.vehicle.licensePlate,
      vehicle_vin: data.vehicle.vin,
      vehicle_year: data.vehicle.year,
      vehicle_type: data.vehicle.type,
      vehicle_chassis: data.vehicle.chassis,
      vehicle_bodyColor: data.vehicle.bodyColor,
      vehicle_bodyNumber: data.vehicle.bodyNumber,
      vehicle_ptsNumber: data.vehicle.ptsNumber,
      vehicle_stsNumber: data.vehicle.stsNumber,
      vehicle_stsIssueInfo: data.vehicle.stsIssueInfo,
    };

    const [newDriverRow] = await db('drivers').insert(flatData).returning('*');
    
    return mapDbRowToDriver(newDriverRow);
  }
}
