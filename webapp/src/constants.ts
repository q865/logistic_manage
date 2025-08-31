// webapp/src/constants.ts

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
