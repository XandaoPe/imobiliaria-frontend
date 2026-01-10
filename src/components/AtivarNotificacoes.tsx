// src/components/AtivarNotificacoes.tsx
import React, { useState } from 'react';
import {
    IconButton,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getFirebaseToken } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const AtivarNotificacoes = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    const ativarNotificacoes = async () => {
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setMessage('Permissão negada. Por favor, permita notificações.');
                setOpen(true);
                return;
            }

            const pushToken = await getFirebaseToken();

            if (!pushToken) {
                setMessage('Não foi possível configurar notificações.');
                setOpen(true);
                return;
            }

            await api.patch(`/usuarios/${user.id}`, {
                pushToken: pushToken
            });

            setMessage('✅ Notificações ativadas com sucesso!');
            setOpen(true);

        } catch (error) {
            console.error('Erro:', error);
            setMessage('Erro ao ativar notificações.');
            setOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Tooltip title="Ativar Notificações Push" arrow>
                <Box sx={{ display: 'inline-block', position: 'relative' }}>
                    <IconButton
                        onClick={ativarNotificacoes}
                        disabled={loading}
                        color="inherit"
                        sx={{
                            // Estilização do ícone
                            color: '#FFD700', // Um dourado mais visível que yellow puro
                            '&:hover': {
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            // fontSize maior para destaque (padrão é 24px)
                            <NotificationsIcon sx={{ fontSize: 28 }} />
                        )}
                    </IconButton>
                </Box>
            </Tooltip>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Posicionado no canto
            >
                <Alert onClose={() => setOpen(false)} severity="info" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </>
    );
};