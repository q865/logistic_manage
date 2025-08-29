import { useState } from 'react';
import { Container, Typography, Box, TextField, Grid, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import type { PersonalData, Passport, Vehicle } from './types.js';

const API_URL = 'http://localhost:3000/api/drivers';

const initialPersonalData = { lastName: '', firstName: '', patronymic: '', birthDate: null };
const initialPassport = { series: '', number: '', issuedBy: '', departmentCode: '', registrationAddress: '', issueDate: null };
const initialVehicle = { make: '', model: '', licensePlate: '', vin: '', year: '', type: '', chassis: '', bodyColor: '', bodyNumber: '', ptsNumber: '', stsNumber: '', stsIssueInfo: '' };

function App() {
  const [personalData, setPersonalData] = useState<PersonalData>(initialPersonalData);
  const [passport, setPassport] = useState<Passport>(initialPassport);
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Обработчики для текстовых полей
  const createChangeHandler = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setter(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Обработчики для календарей
  const createDateChangeHandler = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, fieldName: keyof T) => (newValue: Dayjs | null) => {
    setter(prev => ({ ...prev, [fieldName]: newValue }));
    if (errors[fieldName as string]) setErrors(prev => ({ ...prev, [fieldName as string]: undefined }));
  };

  const handlePersonalDataChange = createChangeHandler(setPersonalData);
  const handlePassportChange = createChangeHandler(setPassport);
  const handleVehicleChange = createChangeHandler(setVehicle);

  const resetForm = () => {
    setPersonalData(initialPersonalData);
    setPassport(initialPassport);
    setVehicle(initialVehicle);
  };

  const handleSubmit = async () => {
    setFormMessage(null);
    setErrors({});
    setIsLoading(true);
    
    const driverData = {
      personalData: { ...personalData, birthDate: personalData.birthDate?.format('YYYY-MM-DD') },
      passport: { ...passport, issueDate: passport.issueDate?.format('YYYY-MM-DD') },
      vehicle: { ...vehicle, year: parseInt(vehicle.year, 10) || 0 },
    };

    try {
      await axios.post(API_URL, driverData);
      setFormMessage({ type: 'success', text: `Водитель "${driverData.personalData.lastName}" успешно создан!` });
      resetForm();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const newErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          const fieldName = err.path.split('.').pop();
          newErrors[fieldName] = err.msg;
        });
        setErrors(newErrors);
        setFormMessage({ type: 'error', text: 'Пожалуйста, исправьте ошибки в форме.' });
      } else {
        console.error('Ошибка:', error);
        setFormMessage({ type: 'error', text: 'Произошла ошибка. Подробности в консоли.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>Карточка водителя</Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>Заполните все необходимые поля.</Typography>
        </Box>

        <Box component="form" noValidate autoComplete="off">
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>1. Личные данные</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><TextField required fullWidth name="lastName" label="Фамилия" value={personalData.lastName} onChange={handlePersonalDataChange} error={!!errors.lastName} helperText={errors.lastName} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={4}><TextField required fullWidth name="firstName" label="Имя" value={personalData.firstName} onChange={handlePersonalDataChange} error={!!errors.firstName} helperText={errors.firstName} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth name="patronymic" label="Отчество" value={personalData.patronymic} onChange={handlePersonalDataChange} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><DatePicker label="Дата рождения" value={personalData.birthDate} onChange={createDateChangeHandler(setPersonalData, 'birthDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors.birthDate, helperText: errors.birthDate, required: true } }} disabled={isLoading} /></Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>2. Паспортные данные</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><TextField required fullWidth name="series" label="Серия" value={passport.series} onChange={handlePassportChange} error={!!errors.series} helperText={errors.series} disabled={isLoading} /></Grid>
            <Grid item xs={6} sm={3}><TextField required fullWidth name="number" label="Номер" value={passport.number} onChange={handlePassportChange} error={!!errors.number} helperText={errors.number} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><DatePicker label="Дата выдачи" value={passport.issueDate} onChange={createDateChangeHandler(setPassport, 'issueDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors.issueDate, helperText: errors.issueDate, required: true } }} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="departmentCode" label="Код подразделения" value={passport.departmentCode} onChange={handlePassportChange} error={!!errors.departmentCode} helperText={errors.departmentCode} disabled={isLoading} /></Grid>
            <Grid item xs={12}><TextField required fullWidth name="issuedBy" label="Кем выдан" value={passport.issuedBy} onChange={handlePassportChange} error={!!errors.issuedBy} helperText={errors.issuedBy} disabled={isLoading} /></Grid>
            <Grid item xs={12}><TextField fullWidth name="registrationAddress" label="Адрес прописки" value={passport.registrationAddress} onChange={handlePassportChange} error={!!errors.registrationAddress} helperText={errors.registrationAddress} disabled={isLoading} /></Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>3. Данные по автомобилю</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="make" label="Марка" value={vehicle.make} onChange={handleVehicleChange} error={!!errors.make} helperText={errors.make} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="model" label="Модель" value={vehicle.model} onChange={handleVehicleChange} error={!!errors.model} helperText={errors.model} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={4}><TextField required fullWidth name="licensePlate" label="Рег. знак" value={vehicle.licensePlate} onChange={handleVehicleChange} error={!!errors.licensePlate} helperText={errors.licensePlate} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={4}><TextField required fullWidth name="year" label="Год выпуска" type="number" value={vehicle.year} onChange={handleVehicleChange} error={!!errors.year} helperText={errors.year} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={4}><TextField required fullWidth name="bodyColor" label="Цвет кузова" value={vehicle.bodyColor} onChange={handleVehicleChange} error={!!errors.bodyColor} helperText={errors.bodyColor} disabled={isLoading} /></Grid>
            <Grid item xs={12}><TextField required fullWidth name="vin" label="Идентификационный номер (VIN)" value={vehicle.vin} onChange={handleVehicleChange} error={!!errors.vin} helperText={errors.vin} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="type" label="Наименование (тип ТС)" value={vehicle.type} onChange={handleVehicleChange} error={!!errors.type} helperText={errors.type} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth name="chassis" label="Шасси (рама)" value={vehicle.chassis} onChange={handleVehicleChange} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth name="bodyNumber" label="Кузов (кабина, прицеп) №" value={vehicle.bodyNumber} onChange={handleVehicleChange} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="ptsNumber" label="ПТС, номер" value={vehicle.ptsNumber} onChange={handleVehicleChange} error={!!errors.ptsNumber} helperText={errors.ptsNumber} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="stsNumber" label="СТС, номер" value={vehicle.stsNumber} onChange={handleVehicleChange} error={!!errors.stsNumber} helperText={errors.stsNumber} disabled={isLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth name="stsIssueInfo" label="СТС, когда кем выдано" value={vehicle.stsIssueInfo} onChange={handleVehicleChange} error={!!errors.stsIssueInfo} helperText={errors.stsIssueInfo} disabled={isLoading} /></Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />
          {formMessage && <Alert severity={formMessage.type} sx={{ mb: 2 }}>{formMessage.text}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : 'Создать водителя'}
            </Button>
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
}

export default App;
