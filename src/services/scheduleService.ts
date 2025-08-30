// src/services/scheduleService.ts
import { knexInstance } from '../database/knex.js';
import type { 
  Schedule, 
  CreateScheduleRequest, 
  UpdateScheduleRequest, 
  ScheduleFilters,
  ScheduleWithDriver,
  CalendarMonth,
  CalendarWeek,
  CalendarDay
} from '../models/Schedule.js';

export class ScheduleService {
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<Schedule> {
    const [schedule] = await knexInstance('schedules')
      .insert(scheduleData)
      .returning('*');
    
    return schedule;
  }

  async updateSchedule(id: number, updateData: UpdateScheduleRequest): Promise<Schedule> {
    const [schedule] = await knexInstance('schedules')
      .where({ id })
      .update({ ...updateData, updated_at: knexInstance.fn.now() })
      .returning('*');
    
    if (!schedule) {
      throw new Error(`График с ID ${id} не найден`);
    }
    
    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    const deleted = await knexInstance('schedules')
      .where({ id })
      .del();
    
    if (!deleted) {
      throw new Error(`График с ID ${id} не найден`);
    }
  }

  async getScheduleById(id: number): Promise<ScheduleWithDriver | null> {
    const schedule = await knexInstance('schedules as s')
      .select(
        's.*',
        'd.id as driver_id',
        'd.personalData',
        'd.vehicle'
      )
      .join('drivers as d', 's.driver_id', 'd.id')
      .where('s.id', id)
      .first();
    
    if (!schedule) return null;

    return {
      ...schedule,
      driver: {
        id: schedule.driver_id,
        personalData: schedule.personalData,
        vehicle: schedule.vehicle
      }
    };
  }

  async getSchedules(filters: ScheduleFilters = {}): Promise<{ schedules: ScheduleWithDriver[], total: number }> {
    const { driver_id, date_from, date_to, status, page = 1, limit = 50 } = filters;
    
    let query = knexInstance('schedules as s')
      .select(
        's.*',
        'd.id as driver_id',
        'd.personalData',
        'd.vehicle'
      )
      .join('drivers as d', 's.driver_id', 'd.id')
      .orderBy('s.date', 'desc')
      .orderBy('s.start_time', 'asc');

    // Применяем фильтры
    if (driver_id) {
      query = query.where('s.driver_id', driver_id);
    }
    
    if (date_from) {
      query = query.where('s.date', '>=', date_from);
    }
    
    if (date_to) {
      query = query.where('s.date', '<=', date_to);
    }
    
    if (status) {
      query = query.where('s.status', status);
    }

    // Получаем общее количество
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = Number(count);

    // Применяем пагинацию
    const offset = (page - 1) * limit;
    const schedules = await query.offset(offset).limit(limit);

    return {
      schedules: schedules.map(schedule => ({
        ...schedule,
        driver: {
          id: schedule.driver_id,
          personalData: schedule.personalData,
          vehicle: schedule.vehicle
        }
      })),
      total
    };
  }

  async getCurrentSchedules(): Promise<ScheduleWithDriver[]> {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM

    return knexInstance('schedules as s')
      .select(
        's.*',
        'd.id as driver_id',
        'd.personalData',
        'd.vehicle'
      )
      .join('drivers as d', 's.driver_id', 'd.id')
      .where('s.date', today)
      .where('s.start_time', '<=', currentTime)
      .where('s.end_time', '>=', currentTime)
      .where('s.status', 'working')
      .orderBy('s.start_time', 'asc')
      .then(schedules => schedules.map(schedule => ({
        ...schedule,
        driver: {
          id: schedule.driver_id,
          personalData: schedule.personalData,
          vehicle: schedule.vehicle
        }
      })));
  }

  async getCalendarMonth(year: number, month: number): Promise<CalendarMonth> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const schedules = await knexInstance('schedules as s')
      .select(
        's.*',
        'd.id as driver_id',
        'd.personalData',
        'd.vehicle'
      )
      .join('drivers as d', 's.driver_id', 'd.id')
      .whereBetween('s.date', [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]])
      .orderBy('s.date', 'asc')
      .orderBy('s.start_time', 'asc');

    const schedulesMap = new Map<string, ScheduleWithDriver[]>();
    
    schedules.forEach(schedule => {
      const date = schedule.date;
      if (!schedulesMap.has(date)) {
        schedulesMap.set(date, []);
      }
      schedulesMap.get(date)!.push({
        ...schedule,
        driver: {
          id: schedule.driver_id,
          personalData: schedule.personalData,
          vehicle: schedule.vehicle
        }
      });
    });

    const weeks: CalendarWeek[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Получаем первый день недели (понедельник)
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const monday = new Date(firstDay);
    monday.setDate(firstDay.getDate() - mondayOffset);

    // Генерируем недели
    let currentDate = new Date(monday);
    let weekNumber = 1;

    while (currentDate.getMonth() <= month - 1 || currentDate.getDate() <= endDate.getDate()) {
      const week: CalendarDay[] = [];
      
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isToday = dateStr === today;
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        week.push({
          date: dateStr,
          schedules: schedulesMap.get(dateStr) || [],
          isToday,
          isWeekend
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push({
        weekNumber,
        days: week
      });
      
      weekNumber++;
    }

    return {
      year,
      month,
      weeks
    };
  }

  async getDriverSchedule(driverId: number, dateFrom: string, dateTo: string): Promise<Schedule[]> {
    return knexInstance('schedules')
      .where({ driver_id: driverId })
      .whereBetween('date', [dateFrom, dateTo])
      .orderBy('date', 'asc')
      .orderBy('start_time', 'asc');
  }

  async bulkCreateSchedules(schedules: CreateScheduleRequest[]): Promise<Schedule[]> {
    return knexInstance('schedules')
      .insert(schedules)
      .returning('*');
  }

  async copyWeekSchedule(
    sourceDate: string, 
    targetDate: string, 
    driverIds?: number[]
  ): Promise<Schedule[]> {
    const sourceStart = new Date(sourceDate);
    const targetStart = new Date(targetDate);
    
    // Получаем графики за неделю
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceStart.getDate() + 6);
    
    let query = knexInstance('schedules')
      .whereBetween('date', [sourceStart.toISOString().split('T')[0], sourceEnd.toISOString().split('T')[0]]);
    
    if (driverIds && driverIds.length > 0) {
      query = query.whereIn('driver_id', driverIds);
    }
    
    const sourceSchedules = await query;
    
    // Создаем новые графики
    const newSchedules: CreateScheduleRequest[] = sourceSchedules.map(schedule => {
      const scheduleDate = new Date(schedule.date);
      const daysDiff = Math.floor((targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
      const newDate = new Date(scheduleDate);
      newDate.setDate(scheduleDate.getDate() + daysDiff);
      
      return {
        driver_id: schedule.driver_id,
        date: newDate.toISOString().split('T')[0],
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        route_info: schedule.route_info,
        notes: schedule.notes
      };
    });
    
    return this.bulkCreateSchedules(newSchedules);
  }
}
