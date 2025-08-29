
// src/components/DriverList.tsx
import { useState, useEffect } from 'react';
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
  TablePagination // Импортируем компонент пагинации
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import type { Driver } from '../types.js';

const API_URL = 'http://localhost:3000/api/drivers';

interface DriverListProps {
  onEdit: (driverId: number) => void;
}

export function DriverList({ onEdit }: DriverListProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для пагинации
  const [page, setPage] = useState(0); // MUI пагинация 0-индексированная
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDrivers, setTotalDrivers] = useState(0);

  // Состояние для диалога подтверждения
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<number | null>(null);

  const fetchDrivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL, {
        params: {
          page: page + 1, // Бэкенд ожидает 1-индексированную страницу
          limit: rowsPerPage,
        },
      });
      setDrivers(response.data.drivers);
      setTotalDrivers(response.data.total);
    } catch (err) {
      setError('Не удалось загрузить список водителей.');
    } finally {
      setIsLoading(false);
    }
  };

  // Перезагружаем данные при изменении страницы или количества строк
  useEffect(() => {
    fetchDrivers();
  }, [page, rowsPerPage]);

  const handleDeleteClick = (id: number) => {
    setDriverToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setDriverToDelete(null);
    setOpenDeleteDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (driverToDelete === null) return;
    const id = driverToDelete;
    
    // Находим водителя для получения имени перед удалением
    const driverToDeleteData = drivers.find(d => d.id === id);
    const driverName = driverToDeleteData ? 
      `${driverToDeleteData.personalData.lastName} ${driverToDeleteData.personalData.firstName}` : 
      `ID ${id}`;
    
    handleCloseDialog();
    try {
      await axios.delete(`${API_URL}/${id}`);
      
      // Отправляем уведомление через веб-хук
      try {
        await axios.post('http://localhost:3000/api/webhook/driver-deleted', {
          driverId: id,
          driverName: driverName
        });
      } catch (webhookError) {
        console.warn('Не удалось отправить уведомление:', webhookError);
      }
      
      // После успешного удаления перезагружаем текущую страницу
      fetchDrivers(); 
    } catch (err) {
      setError(`Ошибка при удалении водителя с ID ${id}.`);
    }
  };

  const handleDownloadAgreement = async (driverId: number, driverLastName: string) => {
    // ... (логика скачивания без изменений)
  };

  // Обработчики для пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Сбрасываем на первую страницу
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>Список водителей</Typography>
          <Button variant="contained" onClick={fetchDrivers}>Обновить</Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>ФИО</TableCell>
                <TableCell>Автомобиль</TableCell>
                <TableCell>Гос. номер</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.length === 0 && !isLoading ? (
                <TableRow><TableCell colSpan={5} align="center">Водители не найдены.</TableCell></TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>{driver.id}</TableCell>
                    <TableCell>{`${driver.personalData.lastName} ${driver.personalData.firstName}`}</TableCell>
                    <TableCell>{`${driver.vehicle.make} ${driver.vehicle.model}`}</TableCell>
                    <TableCell>{driver.vehicle.licensePlate}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Скачать договор">
                        <IconButton onClick={() => handleDownloadAgreement(driver.id, driver.personalData.lastName)}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редактировать">
                        <IconButton color="primary" onClick={() => onEdit(driver.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton color="error" onClick={() => handleDeleteClick(driver.id)}>
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
