
// src/services/driverService.ts
import { knexInstance as db } from '../database/knex.js';
import type { Driver, NewDriver } from '../models/Driver.js';

// ... (mapDbRowToDriver и mapDriverToDbRow без изменений)
const mapDbRowToDriver = (row: any): Driver | null => {
  if (!row) return null;
  
  // Парсим JSON поля
  const personalData = typeof row.personalData === 'string' ? JSON.parse(row.personalData) : (row.personalData || {});
  const passport = typeof row.passport === 'string' ? JSON.parse(row.passport) : (row.passport || {});
  const vehicle = typeof row.vehicle === 'string' ? JSON.parse(row.vehicle) : (row.vehicle || {});
  const driverLicense = row.driverLicense ? (typeof row.driverLicense === 'string' ? JSON.parse(row.driverLicense) : row.driverLicense) : {};
  
  // Обрабатываем leaseAgreement с учетом отдельного поля date
  let leaseAgreement = row.leaseAgreement ? (typeof row.leaseAgreement === 'string' ? JSON.parse(row.leaseAgreement) : row.leaseAgreement) : {};
  
  // Если есть отдельное поле lease_agreement_date, добавляем его в leaseAgreement
  if (row.lease_agreement_date) {
    leaseAgreement = {
      ...leaseAgreement,
      date: row.lease_agreement_date
    };
  }
  
  return {
    id: row.id,
    personalData,
    passport,
    vehicle,
    driverLicense,
    leaseAgreement,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};
const mapDriverToDbRow = (data: Partial<NewDriver>) => {
  const flatData: Record<string, any> = {};
  
  for (const key in data) {
    const typedKey = key as keyof NewDriver;
    if (data[typedKey] !== undefined) {
      if (typedKey === 'leaseAgreement' && data[typedKey]) {
        const leaseAgreement = data[typedKey] as any;
        // Сохраняем номер договора в JSON поле
        if (leaseAgreement.number) {
          flatData.leaseAgreement = JSON.stringify({ number: leaseAgreement.number });
        }
        // Сохраняем дату договора в отдельное поле
        if (leaseAgreement.date) {
          flatData.lease_agreement_date = leaseAgreement.date;
        }
      } else {
        flatData[typedKey] = typeof data[typedKey] === 'object' && data[typedKey] !== null 
          ? JSON.stringify(data[typedKey]) 
          : data[typedKey];
      }
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
    return mapDbRowToDriver(newDriverRow)!;
  }

  public async findDriverById(id: number): Promise<Driver | null> {
    const row = await db('drivers').where({ id }).first();
    if (!row) {
      return null;
    }
    return mapDbRowToDriver(row);
  }

  public async getAllDrivers({ page, limit }: PaginationParams): Promise<PaginatedDrivers> {
    const offset = (page - 1) * limit;

    // Выполняем два запроса параллельно для эффективности
    const [rows, totalResult] = await Promise.all([
      db('drivers').select('*').limit(limit).offset(offset),
      db('drivers').count('id as total').first()
    ]);
    
    const drivers = rows.map(mapDbRowToDriver).filter(Boolean) as Driver[];
    const total = (totalResult as { total: number }).total;

    return { drivers, total };
  }

  // ... (updateDriver, deleteDriver без изменений)
  public async updateDriver(id: number, data: Partial<NewDriver>): Promise<Driver | null> {
    // Удаляем системные поля из объекта, чтобы их нельзя было обновить вручную
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    delete (data as any).id; // Также удаляем ID, его нельзя менять

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
