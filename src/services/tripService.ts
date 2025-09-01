import { knexInstance as db } from '../database/knex.js';
import type { Trip, TripStatus } from '../models/Trip.js';

export class TripService {
  private tableName = 'trips';

  async createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const [newTrip] = await db(this.tableName).insert(trip).returning('*');
    return newTrip;
  }

  async getAllTrips(): Promise<Trip[]> {
    return db(this.tableName).select('*');
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    return db(this.tableName).where({ id }).first();
  }

  async getTripsByDriver(driverId: number): Promise<Trip[]> {
    return db(this.tableName).where({ driver_id: driverId }).orderBy('created_at', 'desc');
  }

  async updateTrip(id: number, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip | undefined> {
    const [updatedTrip] = await db(this.tableName).where({ id }).update({ ...updates, updated_at: db.fn.now() }).returning('*');
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<boolean> {
    const deletedCount = await db(this.tableName).where({ id }).del();
    return deletedCount > 0;
  }

  async updateTripStatus(id: number, status: TripStatus): Promise<Trip | undefined> {
    return this.updateTrip(id, { status });
  }
}
