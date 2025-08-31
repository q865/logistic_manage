
// src/components/DriverEditForm.tsx
import { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import type { Driver, PersonalData, Passport, Vehicle, DriverLicense, LeaseAgreement } from '../types.js';

const API_URL = 'http://localhost:3000/api/drivers';

interface DriverEditFormProps {
  driverId: number;
  onUpdateSuccess: () => void;
  onCancel: () => void;
}

export function DriverEditForm({ driverId, onUpdateSuccess, onCancel }: DriverEditFormProps) {
  // Состояния для данных, UI и загрузки
  const [formData, setFormData] = useState<Partial<Driver>>({});
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchDriver = async () => {
      setIsFetching(true);
      try {
        const response = await axios.get<Driver>(`${API_URL}/${driverId}`);
        const driverData = response.data;
        console.log('Загруженные данные водителя:', driverData);
        console.log('Данные автомобиля:', driverData.vehicle);
        
        // Преобразуем строки дат в объекты Dayjs для DatePicker
        if (driverData.personalData?.birthDate) {
          driverData.personalData.birthDate = dayjs(driverData.personalData.birthDate);
        }
        if (driverData.passport?.issueDate) {
          driverData.passport.issueDate = dayjs(driverData.passport.issueDate);
        }
        setFormData(driverData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setFormMessage({ type: 'error', text: 'Не удалось загрузить данные водителя.' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchDriver();
  }, [driverId]);

  // Универсальные обработчики
  const createChangeHandler = <T extends keyof Driver>(section: T) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [name]: value }
    }));
  };
  const createDateChangeHandler = <T extends keyof Driver>(section: T, fieldName: keyof (Driver[T])) => (newValue: Dayjs | null) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [fieldName]: newValue }
    }));
  };

  const handleSubmit = async () => {
    setFormMessage(null);
    setErrors({});
    setIsLoading(true);

    // Готовим данные к отправке
    const updatePayload = {
      ...formData,
      personalData: { ...formData.personalData, birthDate: formData.personalData?.birthDate?.format('YYYY-MM-DD') },
      passport: { ...formData.passport, issueDate: formData.passport?.issueDate?.format('YYYY-MM-DD') },
      leaseAgreement: { ...formData.leaseAgreement, date: formData.leaseAgreement?.date ? dayjs(formData.leaseAgreement.date).format('YYYY-MM-DD') : null },
      vehicle: { ...formData.vehicle, year: parseInt(formData.vehicle?.year, 10) || 0 },
    };
    
    try {
      await axios.put(`${API_URL}/${driverId}`, updatePayload);
      
      // Отправляем уведомление через веб-хук
      try {
        await axios.post('http://localhost:3000/api/webhook/driver-updated', {
          driverId: driverId,
          driverName: `${formData.personalData?.lastName} ${formData.personalData?.firstName}`
        });
      } catch (webhookError) {
        console.warn('Не удалось отправить уведомление:', webhookError);
      }
      
      setFormMessage({ type: 'success', text: 'Данные водителя успешно обновлены!' });
      setTimeout(onUpdateSuccess, 1500); // Возвращаемся к списку через 1.5с
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const newErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => { newErrors[err.path] = err.msg; });
        setErrors(newErrors);
        setFormMessage({ type: 'error', text: 'Пожалуйста, исправьте ошибки в форме.' });
      } else {
        setFormMessage({ type: 'error', text: 'Произошла ошибка при обновлении.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <CircularProgress />;
  }

  return (
    <>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>Редактирование водителя ID: {driverId}</Typography>
      </Box>

      <Box component="form" noValidate autoComplete="off">
        {/* --- Личные данные --- */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>1. Личные данные</Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1 1 calc(33.333% - 16px)" minWidth={200}><TextField required fullWidth name="lastName" label="Фамилия" value={formData.personalData?.lastName || ''} onChange={createChangeHandler('personalData')} error={!!errors['personalData.lastName']} helperText={errors['personalData.lastName']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(33.333% - 16px)" minWidth={200}><TextField required fullWidth name="firstName" label="Имя" value={formData.personalData?.firstName || ''} onChange={createChangeHandler('personalData')} error={!!errors['personalData.firstName']} helperText={errors['personalData.firstName']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(33.333% - 16px)" minWidth={200}><TextField fullWidth name="patronymic" label="Отчество" value={formData.personalData?.patronymic || ''} onChange={createChangeHandler('personalData')} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(50% - 16px)" minWidth={200}><DatePicker label="Дата рождения" value={formData.personalData?.birthDate || null} onChange={createDateChangeHandler('personalData', 'birthDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors['personalData.birthDate'], helperText: errors['personalData.birthDate'], required: true } }} disabled={isLoading} /></Box>
        </Box>

        {/* --- Документы и т.д. (аналогично форме создания) --- */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>2. Документы</Typography>



        <Box display="flex" flexWrap="wrap" gap={2}>
        

          <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField fullWidth name="number" label="Номер ВУ" value={formData.driverLicense?.number || ''} onChange={createChangeHandler('driverLicense')} error={!!errors['driverLicense.number']} helperText={errors['driverLicense.number']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField fullWidth name="number" label="Номер договора аренды" value={formData.leaseAgreement?.number || ''} onChange={createChangeHandler('leaseAgreement')} error={!!errors['leaseAgreement.number']} helperText={errors['leaseAgreement.number']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(25% - 16px)" minWidth={150}><TextField required fullWidth name="series" label="Серия паспорта" value={formData.passport?.series || ''} onChange={createChangeHandler('passport')} error={!!errors['passport.series']} helperText={errors['passport.series']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(25% - 16px)" minWidth={150}><TextField required fullWidth name="number" label="Номер паспорта" value={formData.passport?.number || ''} onChange={createChangeHandler('passport')} error={!!errors['passport.number']} helperText={errors['passport.number']} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(50% - 16px)" minWidth={200}><DatePicker label="Дата выдачи паспорта" value={formData.passport?.issueDate || null} onChange={createDateChangeHandler('passport', 'issueDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors['passport.issueDate'], helperText: errors['passport.issueDate'], required: true } }} disabled={isLoading} /></Box>
          <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="departmentCode" label="Код подразделения" value={formData.passport?.departmentCode || ''} onChange={createChangeHandler('passport')} error={!!errors['passport.departmentCode']} helperText={errors['passport.departmentCode']} disabled={isLoading} /></Box>
          <Box flex="1 1 100%"><TextField required fullWidth name="issuedBy" label="Кем выдан" value={formData.passport?.issuedBy || ''} onChange={createChangeHandler('passport')} error={!!errors['passport.issuedBy']} helperText={errors['passport.issuedBy']} disabled={isLoading} /></Box>
          <Box flex="1 1 100%"><TextField fullWidth name="registrationAddress" label="Адрес прописки" value={formData.passport?.registrationAddress || ''} onChange={createChangeHandler('passport')} error={!!errors['passport.registrationAddress']} helperText={errors['passport.registrationAddress']} disabled={isLoading} /></Box>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>3. Данные по автомобилю</Typography>
        {/* Отладочная информация */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Отладка: formData.vehicle = {JSON.stringify(formData.vehicle, null, 2)}
          </Typography>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="make" label="Марка" value={formData.vehicle?.make || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.make']} helperText={errors['vehicle.make']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="model" label="Модель" value={formData.vehicle?.model || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.model']} helperText={errors['vehicle.model']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(33.333% - 16px)" minWidth={150}><TextField required fullWidth name="licensePlate" label="Рег. знак" value={formData.vehicle?.licensePlate || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.licensePlate']} helperText={errors['vehicle.licensePlate']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(33.333% - 16px)" minWidth={150}><TextField required fullWidth name="year" label="Год выпуска" type="number" value={formData.vehicle?.year || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.year']} helperText={errors['vehicle.year']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(33.333% - 16px)" minWidth={150}><TextField required fullWidth name="bodyColor" label="Цвет кузова" value={formData.vehicle?.bodyColor || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.bodyColor']} helperText={errors['vehicle.bodyColor']} disabled={isLoading} /></Box>
            <Box flex="1 1 100%"><TextField required fullWidth name="vin" label="Идентификационный номер (VIN)" value={formData.vehicle?.vin || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.vin']} helperText={errors['vehicle.vin']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="type" label="Наименование (тип ТС)" value={formData.vehicle?.type || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.type']} helperText={errors['vehicle.type']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField fullWidth name="chassis" label="Шасси (рама)" value={formData.vehicle?.chassis || ''} onChange={createChangeHandler('vehicle')} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField fullWidth name="bodyNumber" label="Кузов (кабина, прицеп) №" value={formData.vehicle?.bodyNumber || ''} onChange={createChangeHandler('vehicle')} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="ptsNumber" label="ПТС, номер" value={formData.vehicle?.ptsNumber || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.ptsNumber']} helperText={errors['vehicle.ptsNumber']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="stsNumber" label="СТС, номер" value={formData.vehicle?.stsNumber || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.stsNumber']} helperText={errors['vehicle.stsNumber']} disabled={isLoading} /></Box>
            <Box flex="1 1 calc(50% - 16px)" minWidth={200}><TextField required fullWidth name="stsIssueInfo" label="СТС, когда кем выдано" value={formData.vehicle?.stsIssueInfo || ''} onChange={createChangeHandler('vehicle')} error={!!errors['vehicle.stsIssueInfo']} helperText={errors['vehicle.stsIssueInfo']} disabled={isLoading} /></Box>
        </Box>

        <Divider sx={{ my: 4 }} />
        {formMessage && <Alert severity={formMessage.type} sx={{ mb: 2 }}>{formMessage.text}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" size="large" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
          <Button variant="contained" size="large" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Сохранить изменения'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
