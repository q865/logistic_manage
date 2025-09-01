
// src/components/DriverList.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  CircularProgress, 
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  TablePagination,
  Card,
  CardContent,
  CardActions,
  Chip,
  useMediaQuery,
  useTheme,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import type { Driver } from '../types.js';

const API_URL = 'http://localhost:3000/api/drivers';

interface DriverListProps {
  onEdit: (driverId: number) => void;
}

export function DriverList({ onEdit }: DriverListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для пагинации
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [totalDrivers, setTotalDrivers] = useState(0);

  // Состояние для диалога подтверждения
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<number | null>(null);

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setDrivers(response.data.drivers);
      setTotalDrivers(response.data.total);
    } catch (error) {
      console.error('Ошибка загрузки водителей:', error);
      setError('Не удалось загрузить список водителей.');
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleDeleteClick = (id: number) => {
    setDriverToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setDriverToDelete(null);
    setOpenDeleteDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (!driverToDelete) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${driverToDelete}`);
      
      // Отправляем уведомление через веб-хук
      try {
        const driver = drivers.find(d => d.id === driverToDelete);
        const driverName = driver ? `${driver.personalData.lastName} ${driver.personalData.firstName}` : `ID ${driverToDelete}`;
        
        await axios.post('http://localhost:3000/api/webhook/driver-deleted', {
          driverId: driverToDelete,
          driverName: driverName
        });
      } catch (webhookError) {
        console.warn('Не удалось отправить уведомление:', webhookError);
      }
      
      setError(null); // Очищаем предыдущие ошибки
      setDriverToDelete(null);
      fetchDrivers(); // Обновляем список
    } catch (error) {
      console.error('Ошибка удаления:', error);
      setError(`Ошибка при удалении водителя с ID ${driverToDelete}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAgreement = async (driverId: number) => {
    try {
      const response = await axios.get(`${API_URL}/${driverId}/documents/lease_agreement`, {
        responseType: 'blob'
      });
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lease_agreement_${driverId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      setError('Не удалось скачать договор.');
    }
  };

  // Обработчики для пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
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

  // Мобильный вид - карточки
  if (isMobile) {
    return (
      <>
        <Box sx={{ my: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isSmallMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isSmallMobile ? 'stretch' : 'center', 
            mb: 3,
            gap: 2
          }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                textAlign: isSmallMobile ? 'center' : 'left',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 600
              }}
            >
              Список водителей
            </Typography>
            <Button 
              variant="contained" 
              onClick={fetchDrivers}
              startIcon={<RefreshIcon />}
              sx={{ 
                minWidth: isSmallMobile ? '100%' : 'auto',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                }
              }}
            >
              Обновить
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {drivers.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    Водители не найдены
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              drivers.map((driver) => (
                <Grid item xs={12} sm={6} key={driver.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            mr: 2,
                            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h2" fontWeight={600}>
                            {driver.personalData.lastName} {driver.personalData.firstName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {driver.id}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {driver.vehicle.make} {driver.vehicle.model}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={driver.vehicle.licensePlate}
                        size="small"
                        sx={{ 
                          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Box>
                        <Tooltip title="Скачать договор">
                          <IconButton 
                            onClick={() => handleDownloadAgreement(driver.id)}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box>
                        <Tooltip title="Редактировать">
                          <IconButton 
                            color="primary" 
                            onClick={() => onEdit(driver.id)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(driver.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={totalDrivers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10]}
              labelRowsPerPage="На странице:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
            />
          </Box>
        </Box>

        <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
          <DialogTitle>{"Подтвердить удаление"}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить водителя с ID {driverToDelete}? Это действие необратимо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Отмена</Button>
            <Button onClick={handleConfirmDelete} autoFocus color="error">Удалить</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Десктопный вид - таблица
  return (
    <>
      <Box sx={{ my: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600
            }}
          >
            Список водителей
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchDrivers}
            startIcon={<RefreshIcon />}
            sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            Обновить
          </Button>
        </Box>
        
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ФИО</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Автомобиль</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Гос. номер</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      Водители не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver, index) => (
                  <TableRow 
                    key={driver.id} 
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell>
                      <Chip 
                        label={driver.id} 
                        size="small" 
                        sx={{ 
                          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body1" fontWeight={500}>
                          {driver.personalData.lastName} {driver.personalData.firstName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {driver.vehicle.make} {driver.vehicle.model}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={driver.vehicle.licensePlate}
                        size="small"
                        sx={{ 
                          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать договор">
                        <IconButton 
                          onClick={() => handleDownloadAgreement(driver.id)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редактировать">
                        <IconButton 
                          color="primary" 
                          onClick={() => onEdit(driver.id)}
                          sx={{ mx: 0.5 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(driver.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalDrivers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Водителей на странице:"
          />
        </TableContainer>
      </Box>

      <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
        <DialogTitle>{"Подтвердить удаление"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить водителя с ID {driverToDelete}? Это действие необратимо.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleConfirmDelete} autoFocus color="error">Удалить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
