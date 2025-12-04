// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Azul principal para botões e navegação
        },
        secondary: {
            main: '#dc004e', // Cor de destaque (ex: Delete, Alerta)
        },
        background: {
            default: '#f4f6f8', // Fundo cinza claro para o Dashboard
            paper: '#FFFFFF', // Cor de Cards e superfícies
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
        },
    },
});