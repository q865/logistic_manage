// webapp/src/components/ScheduleCalendar.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
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

  useEffect(() => {
    loadCalendar();
  }, [currentDate]);

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

  // Получение иконки статуса
  const getStatusIcon = (status: ScheduleStatus) => {
    return SCHEDULE_STATUSES[status].icon;
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          График работы водителей
        </Typography>
        <Box display="flex" alignItems="center">
          <IconButton onClick={goToPreviousMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {currentDate.format('MMMM YYYY')}
          </Typography>
          <IconButton onClick={goToNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Календарь */}
      <Paper elevation={2}>
        {/* Дни недели */}
        <Box display="flex">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <Box
              key={day}
              flex={1}
              p={1}
              textAlign="center"
              bgcolor="grey.100"
              borderBottom={1}
              borderColor="divider"
            >
              <Typography variant="subtitle2" fontWeight="bold">
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
                minHeight={120}
                border={1}
                borderColor="divider"
                bgcolor={day.isToday ? 'primary.light' : day.isWeekend ? 'grey.50' : 'white'}
                position="relative"
              >
                {/* Дата */}
                <Typography
                  variant="body2"
                  color={day.isToday ? 'white' : day.isWeekend ? 'error.main' : 'text.primary'}
                  fontWeight={day.isToday ? 'bold' : 'normal'}
                >
                  {dayjs(day.date).format('D')}
                </Typography>

                {/* Графики */}
                <Box mt={1}>
                  {day.schedules.map((schedule, index) => (
                    <Tooltip
                      key={schedule.id}
                      title={`${schedule.driver.personalData.lastName} ${schedule.driver.personalData.firstName} - ${schedule.start_time}-${schedule.end_time}`}
                    >
                      <Chip
                        label={`${schedule.driver.personalData.lastName} ${schedule.start_time}`}
                        size="small"
                        sx={{
                          mb: 0.5,
                          backgroundColor: getStatusColor(schedule.status),
                          color: 'white',
                          fontSize: '0.7rem',
                          maxWidth: '100%',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
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
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    opacity: 0.7,
                    '&:hover': { opacity: 1 }
                  }}
                  onClick={() => handleCreateSchedule(day.date)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))}
      </Paper>

      {/* Диалог создания/редактирования графика */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSchedule ? 'Редактировать график' : 'Создать график'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <DatePicker
              label="Дата"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              sx={{ width: '100%' }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Водитель</InputLabel>
              <Select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                label="Водитель"
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.personalData.lastName} {driver.personalData.firstName} {driver.personalData.patronymic || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <TimePicker
                label="Время начала"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                sx={{ flex: 1 }}
              />
              <TimePicker
                label="Время окончания"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                label="Статус"
              >
                {Object.entries(SCHEDULE_STATUSES).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    {value.icon} {value.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Информация о маршруте"
              value={routeInfo}
              onChange={(e) => setRouteInfo(e.target.value)}
              multiline
              rows={2}
            />

            <TextField
              label="Заметки"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingSchedule && (
            <Button
              color="error"
              onClick={() => handleDeleteSchedule(editingSchedule.id)}
              disabled={submitting}
            >
              Удалить
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveSchedule}
            variant="contained"
            disabled={submitting || !selectedDate || !selectedDriver || !startTime || !endTime}
          >
            {submitting ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
