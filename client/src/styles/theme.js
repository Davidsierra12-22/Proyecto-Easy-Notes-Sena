import { createTheme } from '@mui/material/styles'

const palette = {
  primary: {
    main: '#1e88e5',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1'
  },
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  error: {
    main: '#dc2626',
    light: '#fca5a5',
    dark: '#991b1b'
  },
  success: {
    main: '#16a34a',
    light: '#86efac',
    dark: '#15803d'
  },
  warning: {
    main: '#d97706',
    light: '#fcd34d',
    dark: '#b45309'
  },
  info: {
    main: '#0284c7',
    light: '#38bdf8',
    dark: '#075985'
  }
}

const theme = createTheme({
  palette,
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    button: {
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 6
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          fontWeight: 600
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate'
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 700
        }
      }
    }
  }
})

export default theme