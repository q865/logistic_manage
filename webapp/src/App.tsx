
// src/App.tsx
import { useState } from 'react';
import { Container, Box, Tabs, Tab } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { DriverForm } from './components/DriverForm.js';
import { DriverList } from './components/DriverList.js';
import { DriverEditForm } from './components/DriverEditForm.js';

type View = 'list' | 'create' | 'edit';

function App() {
  const [view, setView] = useState<View>('list');
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [driverListKey, setDriverListKey] = useState(0); // Для обновления списка

  const handleShowCreateForm = () => setView('create');
  const handleShowList = () => {
    setView('list');
    setEditingDriverId(null);
    // Обновляем список на случай, если были изменения
    setDriverListKey(prev => prev + 1);
  };

  const handleEdit = (driverId: number) => {
    setEditingDriverId(driverId);
    setView('edit');
  };

  const handleDriverCreated = () => {
    handleShowList();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={view} onChange={(e, newValue) => setView(newValue)}>
            <Tab label="Список водителей" value="list" />
            <Tab label="Создать водителя" value="create" />
            {view === 'edit' && <Tab label={`Редактирование ID: ${editingDriverId}`} value="edit" />}
          </Tabs>
        </Box>

        {view === 'list' && <DriverList key={driverListKey} onEdit={handleEdit} />}
        {view === 'create' && <DriverForm onDriverCreated={handleDriverCreated} />}
        {view === 'edit' && editingDriverId && (
          <DriverEditForm 
            driverId={editingDriverId} 
            onUpdateSuccess={handleShowList} 
            onCancel={handleShowList} 
          />
        )}
        
      </Container>
    </LocalizationProvider>
  );
}

export default App;
