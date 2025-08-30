// src/models/Schedule.ts

export type ScheduleStatus = 'working' | 'off' | 'repair' | 'reserve' | 'vacation' | 'loading';

export interface Schedule {
  id: number;
  driver_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: ScheduleStatus;
  route_info?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleRequest {
  driver_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: ScheduleStatus;
  route_info?: string;
  notes?: string;
}

export interface UpdateScheduleRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: ScheduleStatus;
  route_info?: string;
  notes?: string;
}

export interface ScheduleFilters {
  driver_id?: number;
  date_from?: string;
  date_to?: string;
  status?: ScheduleStatus;
  page?: number;
  limit?: number;
}

export interface ScheduleWithDriver extends Schedule {
  driver: {
    id: number;
    personalData: {
      lastName: string;
      firstName: string;
      patronymic?: string;
    };
    vehicle: {
      make: string;
      model: string;
      licensePlate: string;
    };
  };
}

// Статусы с русскими названиями и цветами
export const SCHEDULE_STATUSES = {
  working: {
    label: 'Работает',
    color: '#4CAF50',
    icon: '🟢',
    description: 'Водитель на рейсе'
  },
  off: {
    label: 'Выходной',
    color: '#F44336',
    icon: '🔴',
    description: 'Выходной день'
  },
  repair: {
    label: 'Ремонт',
    color: '#FF9800',
    icon: '🔧',
    description: 'Автомобиль на ремонте'
  },
  reserve: {
    label: 'Резерв',
    color: '#FFC107',
    icon: '🟡',
    description: 'Водитель в резерве'
  },
  vacation: {
    label: 'Отпуск',
    color: '#2196F3',
    icon: '🏖️',
    description: 'Водитель в отпуске'
  },
  loading: {
    label: 'Погрузка',
    color: '#9C27B0',
    icon: '⏰',
    description: 'Время погрузки/разгрузки'
  }
} as const;

// Интерфейс для календарного представления
export interface CalendarDay {
  date: string;
  schedules: ScheduleWithDriver[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}
