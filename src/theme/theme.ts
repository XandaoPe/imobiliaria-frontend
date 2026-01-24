// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Azul principal para botões e navegação
            dark: '#054a39', // Verde paralelop para fundos escuros
        },
        secondary: {
            main: '#dc004e', // Cor de destaque (ex: Delete, Alerta)
        },
        background: {
            // default: '#c6e0d0', // Fundo cinza claro para o Dashboard
            default: '#d8e7e5', // Fundo cinza claro para o Dashboard
            // paper: '#FFFFFF', // Cor de Cards e superfícies brancos
            paper: '#eef7f2', // Cor de Cards e superfícies brancos
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