
// src/App.tsx
import { useState } from 'react';
import { 
  Container, 
  Box, 
  Tabs, 
  Tab, 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  AppBar,
  Toolbar,
  Typography as MuiTypography,
  useMediaQuery
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  DirectionsCar as CarIcon, 
  Schedule as ScheduleIcon, 
  PersonAdd as PersonAddIcon,
  List as ListIcon,
  LocalShipping as DeliveryIcon
} from '@mui/icons-material';

import { DriverForm } from './components/DriverForm.js';
import { DriverList } from './components/DriverList.js';
import { DriverEditForm } from './components/DriverEditForm.js';
import { ScheduleCalendar } from './components/ScheduleCalendar.js';
import { DeliveryManager } from './components/DeliveryManager.js';

type View = 'list' | 'create' | 'edit' | 'schedule' | 'deliveries';

// Создаем современную тему
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2027',
      secondary: '#637381',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 64,
          '&.Mui-selected': {
            color: '#1976d2',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
  },
});

function App() {
  const [view, setView] = useState<View>('list');
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [driverListKey, setDriverListKey] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleShowList = () => {
    setView('list');
    setEditingDriverId(null);
    setDriverListKey(prev => prev + 1);
  };

  const handleEdit = (driverId: number) => {
    setEditingDriverId(driverId);
    setView('edit');
  };

  const handleDriverCreated = () => {
    handleShowList();
  };

  const getTabIcon = (viewType: View) => {
    switch (viewType) {
      case 'list': return <ListIcon />;
      case 'create': return <PersonAddIcon />;
      case 'schedule': return <ScheduleIcon />;
      case 'edit': return <CarIcon />;
      case 'deliveries': return <DeliveryIcon />;
      default: return <ListIcon />;
    }
  };

  const getTabLabel = (viewType: View) => {
    switch (viewType) {
      case 'list': return 'Список водителей';
      case 'create': return 'Создать водителя';
      case 'schedule': return 'График работы';
      case 'edit': return `Редактирование ID: ${editingDriverId}`;
      case 'deliveries': return 'Доставки';
      default: return '';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* Современный AppBar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            mb: 3
          }}
        >
          <Toolbar>
            <CarIcon sx={{ mr: 2 }} />
            <MuiTypography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Driver Management System
            </MuiTypography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Улучшенные табы с иконками */}
          <Box 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 2,
              p: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Tabs 
              value={view} 
              onChange={(e, newValue) => setView(newValue)}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': { opacity: 0.3 },
                },
              }}
            >
              <Tab 
                label={getTabLabel('list')} 
                value="list" 
                icon={getTabIcon('list')}
                iconPosition="start"
              />
              <Tab 
                label={getTabLabel('create')} 
                value="create" 
                icon={getTabIcon('create')}
                iconPosition="start"
              />
              <Tab 
                label={getTabLabel('schedule')} 
                value="schedule" 
                icon={getTabIcon('schedule')}
                iconPosition="start"
              />
              <Tab 
                label={getTabLabel('deliveries')} 
                value="deliveries" 
                icon={getTabIcon('deliveries')}
                iconPosition="start"
              />
              {view === 'edit' && (
                <Tab 
                  label={getTabLabel('edit')} 
                  value="edit" 
                  icon={getTabIcon('edit')}
                  iconPosition="start"
                />
              )}
            </Tabs>
          </Box>

          {/* Основной контент с улучшенной анимацией */}
          <Box
            sx={{
              minHeight: '60vh',
              animation: 'fadeIn 0.3s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {view === 'list' && <DriverList key={driverListKey} onEdit={handleEdit} />}
            {view === 'create' && <DriverForm onDriverCreated={handleDriverCreated} />}
            {view === 'schedule' && <ScheduleCalendar onScheduleChange={handleShowList} />}
            {view === 'deliveries' && <DeliveryManager />}
            {view === 'edit' && editingDriverId && (
              <DriverEditForm 
                driverId={editingDriverId} 
                onUpdateSuccess={handleShowList} 
                onCancel={handleShowList} 
              />
            )}
          </Box>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
