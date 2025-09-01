import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as StatsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/deliveries';

interface Delivery {
  id?: number;
  identifier: string;
  cargoVolume: number;
  cargoWeight: number;
  cargoLength: number;
  cargoAdditionalInfo: string;
  orderNumber: number;
  orderStatus: string;
  orderDate: string;
  orderTime: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryId: number;
  companyName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CargoStatistics {
  totalVolume: number;
  totalWeight: number;
  totalDeliveries: number;
  averageVolume: number;
  averageWeight: number;
}

export function DeliveryManager() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [statistics, setStatistics] = useState<CargoStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL);
      setDeliveries(response.data);
    } catch (err) {
      console.error('Ошибка загрузки доставок:', err);
      setError('Не удалось загрузить данные о доставках');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics`);
      setStatistics(response.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([fetchDeliveries(), fetchStatistics()]);
  }, [fetchDeliveries, fetchStatistics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем формат файла
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
      return;
    }

    try {
      setFileUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('excel', file);

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Успешно загружено ${response.data.count} доставок!`);
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Ошибка загрузки файла:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки Excel файла');
    } finally {
      setFileUploading(false);
      // Очищаем input
      event.target.value = '';
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      await fetchDeliveries();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/search?customer=${encodeURIComponent(searchTerm)}`);
      setDeliveries(response.data);
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setError('Ошибка поиска доставок');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, fetchDeliveries]);

  const handleDateFilter = useCallback(async () => {
    if (!selectedDate) {
      await fetchDeliveries();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/date/${selectedDate}`);
      setDeliveries(response.data);
    } catch (err) {
      console.error('Ошибка фильтрации по дате:', err);
      setError('Ошибка фильтрации по дате');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, fetchDeliveries]);

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/export`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'deliveries.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      setError('Ошибка экспорта данных');
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить все данные о доставках? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await axios.delete(API_URL);
      setSuccess('Все данные о доставках очищены');
      await loadData();
    } catch (err) {
      console.error('Ошибка очистки данных:', err);
      setError('Ошибка очистки данных');
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentDeliveries = deliveries.filter(delivery => {
    const today = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return delivery.deliveryDate === today;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold',
        mb: 4
      }}>
        📦 Управление доставками
      </Typography>

      {/* Статистика */}
      {statistics && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)' }}>
          <CardHeader 
            title="📊 Статистика грузов" 
            avatar={<StatsIcon sx={{ color: '#1976d2' }} />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {statistics.totalDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Всего доставок
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {statistics.totalVolume}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Общий объем (куб.м)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {statistics.totalWeight}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Общий вес (кг)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {statistics.averageVolume}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Средний объем (куб.м)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Текущие рейсы */}
      {currentDeliveries.length > 0 && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' }}>
          <CardHeader 
            title="🚚 Текущие рейсы (сегодня)" 
            avatar={<ScheduleIcon sx={{ color: '#2e7d32' }} />}
          />
          <CardContent>
            <Grid container spacing={2}>
              {currentDeliveries.slice(0, 3).map((delivery, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.7)' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {delivery.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📦 {delivery.cargoVolume} куб.м / {delivery.cargoWeight} кг
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ⏰ Погрузка: {delivery.orderTime}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      🚚 Доставка: {delivery.deliveryTime}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Управление */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="🎛️ Управление данными" />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="excel-file-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="excel-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={fileUploading}
                  sx={{ 
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }
                  }}
                >
                  {fileUploading ? 'Загрузка...' : 'Загрузить Excel'}
                </Button>
              </label>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={deliveries.length === 0}
              >
                Экспорт
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearData}
                disabled={deliveries.length === 0}
              >
                Очистить
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
              >
                Обновить
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Поиск и фильтры */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="🔍 Поиск и фильтры" />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Поиск по клиенту или ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Фильтр по дате"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
              >
                Найти
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={handleDateFilter}
                disabled={!selectedDate}
              >
                Фильтр
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Список доставок */}
      <Card>
        <CardHeader 
          title={`📋 Список доставок (${filteredDeliveries.length})`}
          action={
            <Typography variant="body2" color="text.secondary">
              Показано: {filteredDeliveries.length} из {deliveries.length}
            </Typography>
          }
        />
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredDeliveries.length === 0 ? (
            <Box textAlign="center" p={3}>
              <Typography variant="body1" color="text.secondary">
                {deliveries.length === 0 
                  ? 'База данных доставок пуста. Загрузите Excel файл для начала работы.'
                  : 'По вашему запросу ничего не найдено.'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Груз</TableCell>
                    <TableCell>Время погрузки</TableCell>
                    <TableCell>Время доставки</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id || delivery.identifier} hover>
                      <TableCell>
                        <Chip 
                          label={delivery.deliveryId} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {delivery.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.identifier}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.cargoVolume} куб.м
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.cargoWeight} кг
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.orderDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.orderTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {delivery.deliveryDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.deliveryTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Просмотр деталей">
                          <IconButton size="small" color="primary">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
