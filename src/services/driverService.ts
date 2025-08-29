
// src/services/driverService.ts
import { knexInstance as db } from '../database/knex.js';
import type { Driver, NewDriver } from '../models/Driver.js';

// ... (mapDbRowToDriver и mapDriverToDbRow без изменений)
const mapDbRowToDriver = (row: any): Driver => {
  if (!row) return row;
  return {
    id: row.id,
    personalData: typeof row.personalData === 'string' ? JSON.parse(row.personalData) : row.personalData,
    passport: typeof row.passport === 'string' ? JSON.parse(row.passport) : row.passport,
    vehicle: typeof row.vehicle === 'string' ? JSON.parse(row.vehicle) : row.vehicle,
    driverLicense: row.driverLicense ? (typeof row.driverLicense === 'string' ? JSON.parse(row.driverLicense) : row.driverLicense) : undefined,
    leaseAgreement: row.leaseAgreement ? (typeof row.leaseAgreement === 'string' ? JSON.parse(row.leaseAgreement) : row.leaseAgreement) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};
const mapDriverToDbRow = (data: Partial<NewDriver>) => {
  const flatData: Record<string, any> = {};
  for (const key in data) {
    const typedKey = key as keyof NewDriver;
    if (data[typedKey] !== undefined) {
      flatData[typedKey] = typeof data[typedKey] === 'object' && data[typedKey] !== null 
        ? JSON.stringify(data[typedKey]) 
        : data[typedKey];
    }
  }
  return flatData;
};

interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedDrivers {
  drivers: Driver[];
  total: number;
}

export class DriverService {
  // ... (createDriver, findDriverById без изменений)
  public async createDriver(data: NewDriver): Promise<Driver> {
    const flatData = mapDriverToDbRow(data);
    const [newDriverRow] = await db('drivers').insert(flatData).returning('*');
    return mapDbRowToDriver(newDriverRow);
  }

  public async findDriverById(id: number): Promise<Driver | null> {
    const row = await db('drivers').where({ id }).first();
    return mapDbRowToDriver(row);
  }

  public async getAllDrivers({ page, limit }: PaginationParams): Promise<PaginatedDrivers> {
    const offset = (page - 1) * limit;

    // Выполняем два запроса параллельно для эффективности
    const [rows, totalResult] = await Promise.all([
      db('drivers').select('*').limit(limit).offset(offset),
      db('drivers').count('id as total').first()
    ]);
    
    const drivers = rows.map(mapDbRowToDriver);
    const total = (totalResult as { total: number }).total;

    return { drivers, total };
  }

  // ... (updateDriver, deleteDriver без изменений)
  public async updateDriver(id: number, data: Partial<NewDriver>): Promise<Driver | null> {
    const flatData = mapDriverToDbRow(data);
    const [updatedDriverRow] = await db('drivers')
      .where({ id })
      .update({ ...flatData, updated_at: new Date() })
      .returning('*');
    return mapDbRowToDriver(updatedDriverRow);
  }

  public async deleteDriver(id: number): Promise<void> {
    await db('drivers').where({ id }).del();
  }
}
