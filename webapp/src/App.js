import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const API_URL = 'http://localhost:3000/api/drivers';
const initialPersonalData = { lastName: '', firstName: '', patronymic: '', birthDate: null };
const initialContractData = { driverLicenseNumber: '', leaseAgreementNumber: '' };
const initialPassport = { series: '', number: '', issuedBy: '', departmentCode: '', registrationAddress: '', issueDate: null };
const initialVehicle = { make: '', model: '', licensePlate: '', vin: '', year: '', type: '', chassis: '', bodyColor: '', bodyNumber: '', ptsNumber: '', stsNumber: '', stsIssueInfo: '' };
function App() {
    const [personalData, setPersonalData] = useState(initialPersonalData);
    const [contractData, setContractData] = useState(initialContractData);
    const [passport, setPassport] = useState(initialPassport);
    const [vehicle, setVehicle] = useState(initialVehicle);
    const [formMessage, setFormMessage] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    // Обработчики для текстовых полей
    const createChangeHandler = (setter) => (event) => {
        const { name, value } = event.target;
        setter(prev => ({ ...prev, [name]: value }));
        if (errors[name])
            setErrors(prev => ({ ...prev, [name]: undefined }));
    };
    // Обработчики для календарей
    const createDateChangeHandler = (setter, fieldName) => (newValue) => {
        setter(prev => ({ ...prev, [fieldName]: newValue }));
        if (errors[fieldName])
            setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    };
    const handlePersonalDataChange = createChangeHandler(setPersonalData);
    const handleContractDataChange = createChangeHandler(setContractData);
    const handlePassportChange = createChangeHandler(setPassport);
    const handleVehicleChange = createChangeHandler(setVehicle);
    const resetForm = () => {
        setPersonalData(initialPersonalData);
        setContractData(initialContractData);
        setPassport(initialPassport);
        setVehicle(initialVehicle);
    };
    const handleSubmit = async () => {
        setFormMessage(null);
        setErrors({});
        setIsLoading(true);
        const driverData = {
            ...contractData,
            personalData: { ...personalData, birthDate: personalData.birthDate?.format('YYYY-MM-DD') },
            passport: { ...passport, issueDate: passport.issueDate?.format('YYYY-MM-DD') },
            vehicle: { ...vehicle, year: parseInt(vehicle.year, 10) || 0 },
        };
        try {
            await axios.post(API_URL, driverData);
            setFormMessage({ type: 'success', text: `Водитель "${driverData.personalData.lastName}" успешно создан!` });
            resetForm();
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                const newErrors = {};
                error.response.data.errors.forEach((err) => {
                    const fieldName = err.path.split('.').pop();
                    newErrors[fieldName] = err.msg;
                });
                setErrors(newErrors);
                setFormMessage({ type: 'error', text: 'Пожалуйста, исправьте ошибки в форме.' });
            }
            else {
                console.error('Ошибка:', error);
                setFormMessage({ type: 'error', text: 'Произошла ошибка. Подробности в консоли.' });
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDayjs, children: _jsxs(Container, { maxWidth: "md", children: [_jsxs(Box, { sx: { my: 4 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F" }), _jsx(Typography, { variant: "subtitle1", color: "text.secondary", gutterBottom: true, children: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0432\u0441\u0435 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0435 \u043F\u043E\u043B\u044F." })] }), _jsxs(Box, { component: "form", noValidate: true, autoComplete: "off", children: [_jsx(Typography, { variant: "h6", gutterBottom: true, sx: { mt: 4 }, children: "1. \u041B\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "lastName", label: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F", value: personalData.lastName, onChange: handlePersonalDataChange, error: !!errors.lastName, helperText: errors.lastName, disabled: isLoading }) }), _jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "firstName", label: "\u0418\u043C\u044F", value: personalData.firstName, onChange: handlePersonalDataChange, error: !!errors.firstName, helperText: errors.firstName, disabled: isLoading }) }), _jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { fullWidth: true, name: "patronymic", label: "\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E", value: personalData.patronymic, onChange: handlePersonalDataChange, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(DatePicker, { label: "\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F", value: personalData.birthDate, onChange: createDateChangeHandler(setPersonalData, 'birthDate'), sx: { width: '100%' }, slotProps: { textField: { error: !!errors.birthDate, helperText: errors.birthDate, required: true } }, disabled: isLoading }) })] }), _jsx(Typography, { variant: "h6", gutterBottom: true, sx: { mt: 4 }, children: "2. \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "driverLicenseNumber", label: "\u041D\u043E\u043C\u0435\u0440 \u0412\u0423", value: contractData.driverLicenseNumber, onChange: handleContractDataChange, error: !!errors.driverLicenseNumber, helperText: errors.driverLicenseNumber, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "leaseAgreementNumber", label: "\u041D\u043E\u043C\u0435\u0440 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0430\u0440\u0435\u043D\u0434\u044B", value: contractData.leaseAgreementNumber, onChange: handleContractDataChange, error: !!errors.leaseAgreementNumber, helperText: errors.leaseAgreementNumber, disabled: isLoading }) }), _jsx(Grid, { sm: 3, xs: 6, children: _jsx(TextField, { required: true, fullWidth: true, name: "series", label: "\u0421\u0435\u0440\u0438\u044F \u043F\u0430\u0441\u043F\u043E\u0440\u0442\u0430", value: passport.series, onChange: handlePassportChange, error: !!errors.series, helperText: errors.series, disabled: isLoading }) }), _jsx(Grid, { sm: 3, xs: 6, children: _jsx(TextField, { required: true, fullWidth: true, name: "number", label: "\u041D\u043E\u043C\u0435\u0440 \u043F\u0430\u0441\u043F\u043E\u0440\u0442\u0430", value: passport.number, onChange: handlePassportChange, error: !!errors.number, helperText: errors.number, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(DatePicker, { label: "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u043F\u0430\u0441\u043F\u043E\u0440\u0442\u0430", value: passport.issueDate, onChange: createDateChangeHandler(setPassport, 'issueDate'), sx: { width: '100%' }, slotProps: { textField: { error: !!errors.issueDate, helperText: errors.issueDate, required: true } }, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "departmentCode", label: "\u041A\u043E\u0434 \u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F", value: passport.departmentCode, onChange: handlePassportChange, error: !!errors.departmentCode, helperText: errors.departmentCode, disabled: isLoading }) }), _jsx(Grid, { xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "issuedBy", label: "\u041A\u0435\u043C \u0432\u044B\u0434\u0430\u043D", value: passport.issuedBy, onChange: handlePassportChange, error: !!errors.issuedBy, helperText: errors.issuedBy, disabled: isLoading }) }), _jsx(Grid, { xs: 12, children: _jsx(TextField, { fullWidth: true, name: "registrationAddress", label: "\u0410\u0434\u0440\u0435\u0441 \u043F\u0440\u043E\u043F\u0438\u0441\u043A\u0438", value: passport.registrationAddress, onChange: handlePassportChange, error: !!errors.registrationAddress, helperText: errors.registrationAddress, disabled: isLoading }) })] }), _jsx(Typography, { variant: "h6", gutterBottom: true, sx: { mt: 4 }, children: "3. \u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044E" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "make", label: "\u041C\u0430\u0440\u043A\u0430", value: vehicle.make, onChange: handleVehicleChange, error: !!errors.make, helperText: errors.make, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "model", label: "\u041C\u043E\u0434\u0435\u043B\u044C", value: vehicle.model, onChange: handleVehicleChange, error: !!errors.model, helperText: errors.model, disabled: isLoading }) }), _jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "licensePlate", label: "\u0420\u0435\u0433. \u0437\u043D\u0430\u043A", value: vehicle.licensePlate, onChange: handleVehicleChange, error: !!errors.licensePlate, helperText: errors.licensePlate, disabled: isLoading }) }), _jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "year", label: "\u0413\u043E\u0434 \u0432\u044B\u043F\u0443\u0441\u043A\u0430", type: "number", value: vehicle.year, onChange: handleVehicleChange, error: !!errors.year, helperText: errors.year, disabled: isLoading }) }), _jsx(Grid, { sm: 4, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "bodyColor", label: "\u0426\u0432\u0435\u0442 \u043A\u0443\u0437\u043E\u0432\u0430", value: vehicle.bodyColor, onChange: handleVehicleChange, error: !!errors.bodyColor, helperText: errors.bodyColor, disabled: isLoading }) }), _jsx(Grid, { xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "vin", label: "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 (VIN)", value: vehicle.vin, onChange: handleVehicleChange, error: !!errors.vin, helperText: errors.vin, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "type", label: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 (\u0442\u0438\u043F \u0422\u0421)", value: vehicle.type, onChange: handleVehicleChange, error: !!errors.type, helperText: errors.type, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { fullWidth: true, name: "chassis", label: "\u0428\u0430\u0441\u0441\u0438 (\u0440\u0430\u043C\u0430)", value: vehicle.chassis, onChange: handleVehicleChange, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { fullWidth: true, name: "bodyNumber", label: "\u041A\u0443\u0437\u043E\u0432 (\u043A\u0430\u0431\u0438\u043D\u0430, \u043F\u0440\u0438\u0446\u0435\u043F) \u2116", value: vehicle.bodyNumber, onChange: handleVehicleChange, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "ptsNumber", label: "\u041F\u0422\u0421, \u043D\u043E\u043C\u0435\u0440", value: vehicle.ptsNumber, onChange: handleVehicleChange, error: !!errors.ptsNumber, helperText: errors.ptsNumber, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "stsNumber", label: "\u0421\u0422\u0421, \u043D\u043E\u043C\u0435\u0440", value: vehicle.stsNumber, onChange: handleVehicleChange, error: !!errors.stsNumber, helperText: errors.stsNumber, disabled: isLoading }) }), _jsx(Grid, { sm: 6, xs: 12, children: _jsx(TextField, { required: true, fullWidth: true, name: "stsIssueInfo", label: "\u0421\u0422\u0421, \u043A\u043E\u0433\u0434\u0430 \u043A\u0435\u043C \u0432\u044B\u0434\u0430\u043D\u043E", value: vehicle.stsIssueInfo, onChange: handleVehicleChange, error: !!errors.stsIssueInfo, helperText: errors.stsIssueInfo, disabled: isLoading }) })] }), _jsx(Divider, { sx: { my: 4 } }), formMessage && _jsx(Alert, { severity: formMessage.type, sx: { mb: 2 }, children: formMessage.text }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Button, { variant: "contained", size: "large", onClick: handleSubmit, disabled: isLoading, children: isLoading ? _jsx(CircularProgress, { size: 24 }) : 'Создать водителя' }) })] })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map