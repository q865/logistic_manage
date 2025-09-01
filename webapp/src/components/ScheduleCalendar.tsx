// webapp/src/components/ScheduleCalendar.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import type { CalendarMonth, ScheduleWithDriver, ScheduleStatus } from '../types.js';


import { SCHEDULE_STATUSES } from '../constants.js';

const API_URL = 'http://localhost:3000/api/schedules';

interface ScheduleCalendarProps {
  onScheduleChange?: () => void;
}

export function ScheduleCalendar({ onScheduleChange }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для диалога создания/редактирования
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithDriver | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | ''>('');
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState<ScheduleStatus>('working');
  const [routeInfo, setRouteInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [drivers, setDrivers] = useState<Array<{ id: number; personalData: { firstName: string; lastName: string; patronymic?: string } }>>([]);

  // Загрузка календаря
  const loadCalendar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/calendar/${currentDate.year()}/${currentDate.month() + 1}`);
      setCalendar(response.data.data);
    } catch (err) {
      setError('Не удалось загрузить календарь');
      console.error('Ошибка загрузки календаря:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка списка водителей
  const loadDrivers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/drivers');
      setDrivers(response.data.drivers || []);
    } catch (err) {
      console.error('Ошибка загрузки водителей:', err);
    }
  };

  const loadCalendarCallback = useCallback(loadCalendar, [currentDate]);

  useEffect(() => {
    loadCalendarCallback();
  }, [loadCalendarCallback]);

  useEffect(() => {
    loadDrivers();
  }, []);

  // Навигация по месяцам
  const goToPreviousMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'));
  };

  // Открытие диалога создания графика
  const handleCreateSchedule = (date: string) => {
    setSelectedDate(dayjs(date));
    setEditingSchedule(null);
    setSelectedDriver('');
    setStartTime(dayjs().hour(8).minute(0));
    setEndTime(dayjs().hour(18).minute(0));
    setStatus('working');
    setRouteInfo('');
    setNotes('');
    setDialogOpen(true);
  };

  // Открытие диалога редактирования
  const handleEditSchedule = (schedule: ScheduleWithDriver) => {
    setEditingSchedule(schedule);
    setSelectedDate(dayjs(schedule.date));
    setSelectedDriver(schedule.driver_id);
    setStartTime(dayjs(`2000-01-01T${schedule.start_time}`));
    setEndTime(dayjs(`2000-01-01T${schedule.end_time}`));
    setStatus(schedule.status);
    setRouteInfo(schedule.route_info || '');
    setNotes(schedule.notes || '');
    setDialogOpen(true);
  };

  // Сохранение графика
  const handleSaveSchedule = async () => {
    if (!selectedDate || !selectedDriver || !startTime || !endTime) {
      return;
    }

    setSubmitting(true);
    
    try {
      const scheduleData = {
        driver_id: selectedDriver,
        date: selectedDate.format('YYYY-MM-DD'),
        start_time: startTime.format('HH:mm'),
        end_time: endTime.format('HH:mm'),
        status,
        route_info: routeInfo,
        notes
      };

      let response;
      if (editingSchedule) {
        response = await axios.put(`${API_URL}/${editingSchedule.id}`, scheduleData);
        
        // Отправляем webhook для уведомления
        try {
          await axios.post('http://localhost:3000/api/webhook/schedule-updated', {
            scheduleId: editingSchedule.id,
            driverName: `Водитель ID ${selectedDriver}`,
            date: selectedDate.format('YYYY-MM-DD'),
            status
          });
        } catch (webhookError) {
          console.warn('Не удалось отправить webhook уведомления:', webhookError);
        }
      } else {
        response = await axios.post(API_URL, scheduleData);
        
        // Отправляем webhook для уведомления
        try {
          await axios.post('http://localhost:3000/api/webhook/schedule-created', {
            scheduleId: response.data.id,
            driverName: `Водитель ID ${selectedDriver}`,
            date: selectedDate.format('YYYY-MM-DD'),
            status
          });
        } catch (webhookError) {
          console.warn('Не удалось отправить webhook уведомления:', webhookError);
        }
      }

      setDialogOpen(false);
      loadCalendar();
      onScheduleChange?.();
    } catch (err) {
      console.error('Ошибка сохранения графика:', err);
      setError('Не удалось сохранить график');
    } finally {
      setSubmitting(false);
    }
  };

  // Удаление графика
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот график?')) {
      return;
    }

    try {
      // Получаем информацию о графике перед удалением для webhook
      let scheduleInfo = null;
      try {
        const scheduleResponse = await axios.get(`${API_URL}/${scheduleId}`);
        scheduleInfo = scheduleResponse.data;
      } catch (err) {
        console.warn('Не удалось получить информацию о графике для webhook:', err);
      }

      await axios.delete(`${API_URL}/${scheduleId}`);
      
      // Отправляем webhook для уведомления
      if (scheduleInfo) {
        try {
          await axios.post('http://localhost:3000/api/webhook/schedule-deleted', {
            scheduleId,
            driverName: `Водитель ID ${scheduleInfo.driver_id}`,
            date: scheduleInfo.date
          });
        } catch (webhookError) {
          console.warn('Не удалось отправить webhook уведомления:', webhookError);
        }
      }
      
      loadCalendar();
      onScheduleChange?.();
    } catch (err) {
      console.error('Ошибка удаления графика:', err);
      setError('Не удалось удалить график');
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status: ScheduleStatus) => {
    return SCHEDULE_STATUSES[status].color;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!calendar) {
    return <Typography>Календарь не загружен</Typography>;
  }

  return (
    <Box>
      {/* Заголовок календаря */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          justifyContent: 'space-between', 
          mb: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          gap: 2
        }}
      >
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          График работы водителей
        </Typography>
        <Box 
          display="flex" 
          alignItems="center"
          sx={{ 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            gap: 1
          }}
        >
          <IconButton 
            onClick={goToPreviousMonth}
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              mx: 2,
              minWidth: { xs: '120px', sm: 'auto' },
              textAlign: 'center',
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {currentDate.format('MMMM YYYY')}
          </Typography>
          <IconButton 
            onClick={goToNextMonth}
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Календарь */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Дни недели */}
        <Box display="flex">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <Box
              key={day}
              flex={1}
              p={1}
              textAlign="center"
              sx={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                borderBottom: 1,
                borderColor: 'divider',
                minHeight: { xs: 40, sm: 50 }
              }}
            >
              <Typography 
                variant="subtitle2" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: 'text.primary'
                }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Дни месяца */}
        {calendar.weeks.map((week, weekIndex) => (
          <Box display="flex" key={weekIndex}>
            {week.days.map((day, dayIndex) => (
              <Box
                key={dayIndex}
                flex={1}
                p={1}
                minHeight={{ xs: 100, sm: 120 }}
                border={1}
                borderColor="divider"
                sx={{
                  background: day.isToday 
                    ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
                    : day.isWeekend 
                    ? 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)' 
                    : 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    zIndex: 1,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }
                }}
              >
                {/* Дата */}
                <Typography
                  variant="body2"
                  sx={{
                    color: day.isToday ? 'white' : day.isWeekend ? 'error.main' : 'text.primary',
                    fontWeight: day.isToday ? 'bold' : 'normal',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mb: 1
                  }}
                >
                  {dayjs(day.date).format('D')}
                </Typography>

                {/* Графики */}
                <Box mt={1} sx={{ maxHeight: { xs: 60, sm: 80 }, overflow: 'hidden' }}>
                  {day.schedules.map((schedule) => (
                    <Tooltip
                      key={schedule.id}
                      title={`${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName} - ${schedule.start_time}-${schedule.end_time}`}
                      arrow
                    >
                      <Chip
                        label={`${schedule.driver.personalData.lastName} ${schedule.start_time}`}
                        size="small"
                        sx={{
                          mb: 0.5,
                          backgroundColor: getStatusColor(schedule.status),
                          color: 'white',
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          maxWidth: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          },
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                        onClick={() => handleEditSchedule(schedule)}
                      />
                    </Tooltip>
                  ))}
                </Box>

                {/* Кнопка добавления */}
                <IconButton
                  size="small"
                  onClick={() => handleCreateSchedule(day.date)}
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                    color: 'white',
                    width: { xs: 24, sm: 28 },
                    height: { xs: 24, sm: 28 },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <AddIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))}
      </Paper>

      {/* Легенда статусов */}
      <Box 
        sx={{ 
          mt: 3,
          p: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Статусы графиков
        </Typography>
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1}
          sx={{ 
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}
        >
          {Object.entries(SCHEDULE_STATUSES).map(([status, config]) => (
            <Chip
              key={status}
              label={config.label}
              size="small"
              sx={{
                backgroundColor: getStatusColor(status as ScheduleStatus),
                color: 'white',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
