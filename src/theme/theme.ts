// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

// TEMA CLARO (original atualizado)
export const appThemeLight = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2', // Azul principal
            dark: '#054a39', // Verde paralelop
            light: '#4dabf5', // Azul claro
        },
        secondary: {
            main: '#dc004e', // Rosa/Vermelho
            light: '#ff5c8d',
            dark: '#9a0036',
        },
        background: {
            default: '#d8e7e5', // Verde água muito claro
            paper: '#eef7f2', // Verde água claro para cards
        },
        text: {
            primary: '#1a3c34', // Verde escuro para texto
            secondary: '#4a6359', // Verde médio
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

// TEMA ESCURO
export const appThemeDark = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#4dabf5', // Azul mais claro para melhor contraste no escuro
            dark: '#054a39', // Mantém o verde paralelop
            light: '#80c8ff', // Azul muito claro
        },
        secondary: {
            main: '#ff5c8d', // Rosa mais claro
            light: '#ff8eb3',
            dark: '#c51162',
        },
        background: {
            default: '#0d1f1a', // Verde muito escuro
            paper: '#1a3c34', // Verde escuro para cards
        },
        text: {
            primary: '#e0f2e9', // Verde muito claro
            secondary: '#a8c5ba', // Verde médio claro
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: 'none', // Remove gradientes no modo escuro
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});

// Exportação para compatibilidade com código existente
export const appTheme = appThemeLight;