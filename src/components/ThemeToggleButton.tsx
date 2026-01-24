// src/components/ThemeToggleButton.tsx
import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

export const ThemeToggleButton: React.FC = () => {
    const { isDarkMode, toggleTheme } = useThemeContext();

    return (
        <Tooltip title={isDarkMode ? "Modo Claro" : "Modo Escuro"}>
            <IconButton
                onClick={toggleTheme}
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    left: 20,
                    zIndex: 9999,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: 'primary.dark',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: 3,
                }}
                size="medium"
            >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
        </Tooltip>
    );
};

// Versão alternativa com texto
export const ThemeToggleButtonWithText: React.FC = () => {
    const { isDarkMode, toggleTheme } = useThemeContext();

    return (
        <Box
            onClick={toggleTheme}
            sx={{
                position: 'fixed',
                bottom: 20,
                left: 20,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'primary.main',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                boxShadow: 3,
                '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
            }}
        >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isDarkMode ? 'Claro' : 'Escuro'}
            </span>
        </Box>
    );
};