// src/components/AtivarNotificacoes.tsx
import React, { useState } from 'react';
import { Button, Alert, Snackbar, CircularProgress } from '@mui/material';
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
            // 1. Solicita permissão
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setMessage('Permissão negada. Por favor, permita notificações.');
                setOpen(true);
                return;
            }

            // 2. Obtém token FCM
            const pushToken = await getFirebaseToken();

            if (!pushToken) {
                setMessage('Não foi possível configurar notificações.');
                setOpen(true);
                return;
            }

            // 3. Salva no backend
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
            <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={ativarNotificacoes}
                disabled={loading}
                size="small"
            >
                {loading ? <CircularProgress size={20} /> : 'Ativar Notificações'}
            </Button>

            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={() => setOpen(false)}
            >
                <Alert onClose={() => setOpen(false)} severity="info" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </>
    );
};