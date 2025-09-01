// src/components/DriverForm.tsx
import { useState } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Grid, 
  Button, 
  Alert, 
  CircularProgress,
  Paper,
  Card,
  CardContent,
  CardHeader,
  useMediaQuery,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import axios from 'axios';
import type { PersonalData, Passport, Vehicle, DriverLicense, LeaseAgreement } from '../types.js';
import { 
  Person as PersonIcon, 
  CreditCard as PassportIcon, 
  DirectionsCar as CarIcon,
  DriveEta as LicenseIcon,
  Description as DocumentIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

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

const steps = [
  { label: 'Личные данные', icon: <PersonIcon /> },
  { label: 'Паспорт', icon: <PassportIcon /> },
  { label: 'Автомобиль', icon: <CarIcon /> },
  { label: 'Водительские права', icon: <LicenseIcon /> },
  { label: 'Договор аренды', icon: <DocumentIcon /> }
];

export function DriverForm({ onDriverCreated }: DriverFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
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
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
      const response = await axios.post(API_URL, driverData);
      const newDriverId = response.data.id;
      
      // Отправляем уведомление через веб-хук
      try {
        await axios.post('http://localhost:3000/api/webhook/driver-created', {
          driverId: newDriverId,
          driverName: `${driverData.personalData.lastName} ${driverData.personalData.firstName}`
        });
      } catch (webhookError) {
        console.warn('Не удалось отправить уведомление:', webhookError);
      }
      
      setFormMessage({ type: 'success', text: `Водитель "${driverData.personalData.lastName}" успешно создан!` });
      resetForm();
      onDriverCreated();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const newErrors: Record<string, string> = {};
        if (error.response.data.errors) {
          error.response.data.errors.forEach((err: { path: string; msg: string }) => { 
            newErrors[err.path] = err.msg; 
          });
        }
        setErrors(newErrors);
        setFormMessage({ type: 'error', text: 'Пожалуйста, исправьте ошибки в форме.' });
      } else {
        setFormMessage({ type: 'error', text: 'Произошла ошибка при создании водителя.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldPath: string) => {
    return errors[fieldPath] || '';
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Личные данные" 
              avatar={<PersonIcon sx={{ color: 'primary.main' }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                '& .MuiCardHeader-title': { fontWeight: 600 }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Фамилия"
                    name="lastName"
                    value={personalData.lastName}
                    onChange={handlePersonalDataChange}
                    error={!!getFieldError('personalData.lastName')}
                    helperText={getFieldError('personalData.lastName')}
                    required
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Имя"
                    name="firstName"
                    value={personalData.firstName}
                    onChange={handlePersonalDataChange}
                    error={!!getFieldError('personalData.firstName')}
                    helperText={getFieldError('personalData.firstName')}
                    required
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Отчество"
                    name="patronymic"
                    value={personalData.patronymic}
                    onChange={handlePersonalDataChange}
                    error={!!getFieldError('personalData.patronymic')}
                    helperText={getFieldError('personalData.patronymic')}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <DatePicker
                    label="Дата рождения"
                    value={personalData.birthDate}
                    onChange={createDateChangeHandler(setPersonalData, 'birthDate')}
                    sx={{ width: '100%' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Паспортные данные" 
              avatar={<PassportIcon sx={{ color: 'primary.main' }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                '& .MuiCardHeader-title': { fontWeight: 600 }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Серия"
                    name="series"
                    value={passport.series}
                    onChange={handlePassportChange}
                    error={!!getFieldError('passport.series')}
                    helperText={getFieldError('passport.series')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Номер"
                    name="number"
                    value={passport.number}
                    onChange={handlePassportChange}
                    error={!!getFieldError('passport.number')}
                    helperText={getFieldError('passport.number')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Кем выдан"
                    name="issuedBy"
                    value={passport.issuedBy}
                    onChange={handlePassportChange}
                    error={!!getFieldError('passport.issuedBy')}
                    helperText={getFieldError('passport.issuedBy')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Код подразделения"
                    name="departmentCode"
                    value={passport.departmentCode}
                    onChange={handlePassportChange}
                    error={!!getFieldError('passport.departmentCode')}
                    helperText={getFieldError('passport.departmentCode')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Дата выдачи"
                    value={passport.issueDate}
                    onChange={createDateChangeHandler(setPassport, 'issueDate')}
                    sx={{ width: '100%' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Адрес регистрации"
                    name="registrationAddress"
                    value={passport.registrationAddress}
                    onChange={handlePassportChange}
                    error={!!getFieldError('passport.registrationAddress')}
                    helperText={getFieldError('passport.registrationAddress')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Данные автомобиля" 
              avatar={<CarIcon sx={{ color: 'primary.main' }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                '& .MuiCardHeader-title': { fontWeight: 600 }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Марка"
                    name="make"
                    value={vehicle.make}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.make')}
                    helperText={getFieldError('vehicle.make')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Модель"
                    name="model"
                    value={vehicle.model}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.model')}
                    helperText={getFieldError('vehicle.model')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Гос. номер"
                    name="licensePlate"
                    value={vehicle.licensePlate}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.licensePlate')}
                    helperText={getFieldError('vehicle.licensePlate')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="VIN"
                    name="vin"
                    value={vehicle.vin}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.vin')}
                    helperText={getFieldError('vehicle.vin')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Год выпуска"
                    name="year"
                    type="number"
                    value={vehicle.year}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.year')}
                    helperText={getFieldError('vehicle.year')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Тип ТС"
                    name="type"
                    value={vehicle.type}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.type')}
                    helperText={getFieldError('vehicle.type')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Цвет кузова"
                    name="bodyColor"
                    value={vehicle.bodyColor}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.bodyColor')}
                    helperText={getFieldError('vehicle.bodyColor')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Номер ПТС"
                    name="ptsNumber"
                    value={vehicle.ptsNumber}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.ptsNumber')}
                    helperText={getFieldError('vehicle.ptsNumber')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Номер СТС"
                    name="stsNumber"
                    value={vehicle.stsNumber}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.stsNumber')}
                    helperText={getFieldError('vehicle.stsNumber')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Кем и когда выдано СТС"
                    name="stsIssueInfo"
                    value={vehicle.stsIssueInfo}
                    onChange={handleVehicleChange}
                    error={!!getFieldError('vehicle.stsIssueInfo')}
                    helperText={getFieldError('vehicle.stsIssueInfo')}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Водительские права" 
              avatar={<LicenseIcon sx={{ color: 'primary.main' }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                '& .MuiCardHeader-title': { fontWeight: 600 }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Серия"
                    name="series"
                    value={driverLicense.series}
                    onChange={handleDriverLicenseChange}
                    error={!!getFieldError('driverLicense.series')}
                    helperText={getFieldError('driverLicense.series')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Номер"
                    name="number"
                    value={driverLicense.number}
                    onChange={handleDriverLicenseChange}
                    error={!!getFieldError('driverLicense.number')}
                    helperText={getFieldError('driverLicense.number')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Дата выдачи"
                    value={driverLicense.issueDate}
                    onChange={createDateChangeHandler(setDriverLicense, 'issueDate')}
                    sx={{ width: '100%' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Дата окончания срока"
                    value={driverLicense.expiryDate}
                    onChange={createDateChangeHandler(setDriverLicense, 'expiryDate')}
                    sx={{ width: '100%' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Категории"
                    name="categories"
                    value={driverLicense.categories}
                    onChange={handleDriverLicenseChange}
                    error={!!getFieldError('driverLicense.categories')}
                    helperText={getFieldError('driverLicense.categories')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Договор аренды" 
              avatar={<DocumentIcon sx={{ color: 'primary.main' }} />}
              sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
                '& .MuiCardHeader-title': { fontWeight: 600 }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Номер договора"
                    name="number"
                    value={leaseAgreement.number}
                    onChange={handleLeaseAgreementChange}
                    error={!!getFieldError('leaseAgreement.number')}
                    helperText={getFieldError('leaseAgreement.number')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Дата договора"
                    value={leaseAgreement.date}
                    onChange={createDateChangeHandler(setLeaseAgreement, 'date')}
                    sx={{ width: '100%' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            textAlign: 'center',
            mb: 4,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600
          }}
        >
          Создание нового водителя
        </Typography>

        {formMessage && (
          <Alert 
            severity={formMessage.type} 
            sx={{ mb: 3 }}
            onClose={() => setFormMessage(null)}
          >
            {formMessage.text}
          </Alert>
        )}

        {isMobile ? (
          // Мобильный вид - степпер
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  icon={step.icon}
                  sx={{ 
                    '& .MuiStepLabel-label': { fontWeight: 600 },
                    '& .MuiStepLabel-iconContainer': { color: 'primary.main' }
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                      disabled={isLoading}
                      sx={{ mr: 1 }}
                    >
                      {index === steps.length - 1 ? 'Создать водителя' : 'Далее'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Назад
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        ) : (
          // Десктопный вид - все секции сразу
          <>
            {renderStepContent(0)}
            {renderStepContent(1)}
            {renderStepContent(2)}
            {renderStepContent(3)}
            {renderStepContent(4)}
          </>
        )}

        {!isMobile && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={resetForm}
              startIcon={<ClearIcon />}
              size="large"
              sx={{ 
                minWidth: 150,
                borderColor: 'error.main',
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  backgroundColor: 'error.light',
                  color: 'error.dark'
                }
              }}
            >
              Очистить
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              size="large"
              sx={{ 
                minWidth: 200,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                }
              }}
            >
              {isLoading ? 'Создание...' : 'Создать водителя'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}