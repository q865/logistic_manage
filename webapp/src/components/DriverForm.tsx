// src/components/DriverForm.tsx
import { useState } from 'react';
import { Typography, Box, TextField, Grid, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import axios from 'axios';
import type { PersonalData, Passport, Vehicle, DriverLicense, LeaseAgreement } from '../types.js';

const API_URL = 'http://localhost:3000/api/drivers';

// Обновленные начальные состояния
const initialPersonalData: PersonalData = { lastName: '', firstName: '', patronymic: '', birthDate: null };
const initialPassport: Passport = { series: '', number: '', issuedBy: '', departmentCode: '', registrationAddress: '', issueDate: null };
const initialVehicle: Vehicle = { make: '', model: '', licensePlate: '', vin: '', year: '', type: '', chassis: '', bodyColor: '', bodyNumber: '', ptsNumber: '', stsNumber: '', stsIssueInfo: '' };
const initialDriverLicense: DriverLicense = { series: '', number: '', issueDate: null, expiryDate: null, categories: '' };
const initialLeaseAgreement: LeaseAgreement = { number: '', date: null };

interface DriverFormProps {
  onDriverCreated: () => void;
}

export function DriverForm({ onDriverCreated }: DriverFormProps) {
  const [personalData, setPersonalData] = useState(initialPersonalData);
  const [passport, setPassport] = useState(initialPassport);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [driverLicense, setDriverLicense] = useState(initialDriverLicense);
  const [leaseAgreement, setLeaseAgreement] = useState(initialLeaseAgreement);

  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const createChangeHandler = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setter(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };
  const createDateChangeHandler = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, fieldName: keyof T) => (newValue: Dayjs | null) => {
    setter(prev => ({ ...prev, [fieldName]: newValue }));
  };

  const handlePersonalDataChange = createChangeHandler(setPersonalData);
  const handlePassportChange = createChangeHandler(setPassport);
  const handleVehicleChange = createChangeHandler(setVehicle);
  const handleDriverLicenseChange = createChangeHandler(setDriverLicense);
  const handleLeaseAgreementChange = createChangeHandler(setLeaseAgreement);

  const resetForm = () => {
    setPersonalData(initialPersonalData);
    setPassport(initialPassport);
    setVehicle(initialVehicle);
    setDriverLicense(initialDriverLicense);
    setLeaseAgreement(initialLeaseAgreement);
    setErrors({});
  };

  const handleSubmit = async () => {
    setFormMessage(null);
    setErrors({});
    setIsLoading(true);
    
    const driverData = {
      personalData: { ...personalData, birthDate: personalData.birthDate?.format('YYYY-MM-DD') },
      passport: { ...passport, issueDate: passport.issueDate?.format('YYYY-MM-DD') },
      vehicle: { ...vehicle, year: parseInt(vehicle.year, 10) || 0 },
      driverLicense: { 
        ...driverLicense, 
        issueDate: driverLicense.issueDate?.format('YYYY-MM-DD'),
        expiryDate: driverLicense.expiryDate?.format('YYYY-MM-DD'),
      },
      leaseAgreement: {
        ...leaseAgreement,
        date: leaseAgreement.date?.format('YYYY-MM-DD'),
      },
    };

    try {
      await axios.post(API_URL, driverData);
      setFormMessage({ type: 'success', text: `Водитель "${driverData.personalData.lastName}" успешно создан!` });
      resetForm();
      onDriverCreated();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const newErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => { newErrors[err.path] = err.msg; });
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
    <>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>Карточка водителя</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>Заполните все необходимые поля.</Typography>
      </Box>

      <Box component="form" noValidate autoComplete="off">
        {/* --- Личные данные --- */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>1. Личные данные</Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={4}><TextField required fullWidth name="lastName" label="Фамилия" value={personalData.lastName} onChange={handlePersonalDataChange} error={!!errors['personalData.lastName']} helperText={errors['personalData.lastName']} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={4}><TextField required fullWidth name="firstName" label="Имя" value={personalData.firstName} onChange={handlePersonalDataChange} error={!!errors['personalData.firstName']} helperText={errors['personalData.firstName']} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={4}><TextField fullWidth name="patronymic" label="Отчество" value={personalData.patronymic} onChange={handlePersonalDataChange} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={6}><DatePicker label="Дата рождения" value={personalData.birthDate} onChange={createDateChangeHandler(setPersonalData, 'birthDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors['personalData.birthDate'], helperText: errors['personalData.birthDate'], required: true } }} disabled={isLoading} /></Grid>
        </Grid>

        {/* --- Документы --- */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>2. Документы</Typography>
        <Divider sx={{ mb: 2 }}><Typography variant="subtitle2">Паспорт</Typography></Divider>
        <Grid container spacing={2}>
          <Grid xs={6} sm={3}><TextField required fullWidth name="series" label="Серия паспорта" value={passport.series} onChange={handlePassportChange} error={!!errors['passport.series']} helperText={errors['passport.series']} disabled={isLoading} /></Grid>
          <Grid xs={6} sm={3}><TextField required fullWidth name="number" label="Номер паспорта" value={passport.number} onChange={handlePassportChange} error={!!errors['passport.number']} helperText={errors['passport.number']} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={6}><DatePicker label="Дата выдачи паспорта" value={passport.issueDate} onChange={createDateChangeHandler(setPassport, 'issueDate')} sx={{ width: '100%' }} slotProps={{ textField: { error: !!errors['passport.issueDate'], helperText: errors['passport.issueDate'], required: true } }} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={6}><TextField required fullWidth name="departmentCode" label="Код подразделения" value={passport.departmentCode} onChange={handlePassportChange} error={!!errors['passport.departmentCode']} helperText={errors['passport.departmentCode']} disabled={isLoading} /></Grid>
          <Grid xs={12} sm={6}><TextField required fullWidth name="issuedBy" label="Кем выдан" value={passport.issuedBy} onChange={handlePassportChange} error={!!errors['passport.issuedBy']} helperText={errors['passport.issuedBy']} disabled={isLoading} /></Grid>
          <Grid xs={12}><TextField fullWidth name="registrationAddress" label="Адрес прописки" value={passport.registrationAddress} onChange={handlePassportChange} error={!!errors['passport.registrationAddress']} helperText={errors['passport.registrationAddress']} disabled={isLoading} /></Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }}><Typography variant="subtitle2">Водительское удостоверение</Typography></Divider>
        <Grid container spacing={2}>
            <Grid xs={6} sm={3}><TextField fullWidth name="series" label="Серия ВУ" value={driverLicense.series} onChange={handleDriverLicenseChange} disabled={isLoading} /></Grid>
            <Grid xs={6} sm={3}><TextField fullWidth name="number" label="Номер ВУ" value={driverLicense.number} onChange={handleDriverLicenseChange} error={!!errors['driverLicense.number']} helperText={errors['driverLicense.number']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField fullWidth name="categories" label="Категории ВУ" value={driverLicense.categories} onChange={handleDriverLicenseChange} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><DatePicker label="Дата выдачи ВУ" value={driverLicense.issueDate} onChange={createDateChangeHandler(setDriverLicense, 'issueDate')} sx={{ width: '100%' }} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><DatePicker label="Срок действия ВУ" value={driverLicense.expiryDate} onChange={createDateChangeHandler(setDriverLicense, 'expiryDate')} sx={{ width: '100%' }} disabled={isLoading} /></Grid>
        </Grid>

        <Divider sx={{ my: 2 }}><Typography variant="subtitle2">Договор аренды</Typography></Divider>
        <Grid container spacing={2}>
            <Grid xs={12} sm={6}><TextField fullWidth name="number" label="Номер договора" value={leaseAgreement.number} onChange={handleLeaseAgreementChange} error={!!errors['leaseAgreement.number']} helperText={errors['leaseAgreement.number']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><DatePicker label="Дата договора" value={leaseAgreement.date} onChange={createDateChangeHandler(setLeaseAgreement, 'date')} sx={{ width: '100%' }} disabled={isLoading} /></Grid>
        </Grid>

        {/* --- Данные по автомобилю --- */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>3. Данные по автомобилю</Typography>
        <Grid container spacing={2}>
            <Grid xs={12} sm={6}><TextField required fullWidth name="make" label="Марка" value={vehicle.make} onChange={handleVehicleChange} error={!!errors['vehicle.make']} helperText={errors['vehicle.make']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField required fullWidth name="model" label="Модель" value={vehicle.model} onChange={handleVehicleChange} error={!!errors['vehicle.model']} helperText={errors['vehicle.model']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={4}><TextField required fullWidth name="licensePlate" label="Рег. знак" value={vehicle.licensePlate} onChange={handleVehicleChange} error={!!errors['vehicle.licensePlate']} helperText={errors['vehicle.licensePlate']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={4}><TextField required fullWidth name="year" label="Год выпуска" type="number" value={vehicle.year} onChange={handleVehicleChange} error={!!errors['vehicle.year']} helperText={errors['vehicle.year']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={4}><TextField required fullWidth name="bodyColor" label="Цвет кузова" value={vehicle.bodyColor} onChange={handleVehicleChange} error={!!errors['vehicle.bodyColor']} helperText={errors['vehicle.bodyColor']} disabled={isLoading} /></Grid>
            <Grid xs={12}><TextField required fullWidth name="vin" label="Идентификационный номер (VIN)" value={vehicle.vin} onChange={handleVehicleChange} error={!!errors['vehicle.vin']} helperText={errors['vehicle.vin']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField required fullWidth name="type" label="Наименование (тип ТС)" value={vehicle.type} onChange={handleVehicleChange} error={!!errors['vehicle.type']} helperText={errors['vehicle.type']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField fullWidth name="chassis" label="Шасси (рама)" value={vehicle.chassis} onChange={handleVehicleChange} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField fullWidth name="bodyNumber" label="Кузов (кабина, прицеп) №" value={vehicle.bodyNumber} onChange={handleVehicleChange} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField required fullWidth name="ptsNumber" label="ПТС, номер" value={vehicle.ptsNumber} onChange={handleVehicleChange} error={!!errors['vehicle.ptsNumber']} helperText={errors['vehicle.ptsNumber']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField required fullWidth name="stsNumber" label="СТС, номер" value={vehicle.stsNumber} onChange={handleVehicleChange} error={!!errors['vehicle.stsNumber']} helperText={errors['vehicle.stsNumber']} disabled={isLoading} /></Grid>
            <Grid xs={12} sm={6}><TextField required fullWidth name="stsIssueInfo" label="СТС, когда кем выдано" value={vehicle.stsIssueInfo} onChange={handleVehicleChange} error={!!errors['vehicle.stsIssueInfo']} helperText={errors['vehicle.stsIssueInfo']} disabled={isLoading} /></Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />
        {formMessage && <Alert severity={formMessage.type} sx={{ mb: 2 }}>{formMessage.text}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Создать водителя'}
          </Button>
        </Box>
      </Box>
    </>
  );
}