// src/components/AtivarNotificacoes.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Alert,
    Snackbar,
    CircularProgress,
    Tooltip,
    Box,
    Badge,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { getFirebaseToken } from '../services/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const AtivarNotificacoes = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [hasToken, setHasToken] = useState(false);
    const [modalObrigatoriaOpen, setModalObrigatoriaOpen] = useState(false);

    // Verificar status ao carregar
    useEffect(() => {
        checkNotificationStatus();
    }, [user]);

    const checkNotificationStatus = () => {
        const permission = Notification.permission;
        setPermissionStatus(permission);

        // Verificar se o usuário tem token
        if (user?.pushToken) {
            setHasToken(true);
        }
    };

    const getIcon = () => {
        if (loading) return <CircularProgress size={24} color="inherit" />;

        if (permissionStatus === 'granted' && hasToken) {
            return <NotificationsActiveIcon sx={{ fontSize: 28 }} />;
        }

        // Ícone especial quando precisa ativar
        if (permissionStatus === 'default' || !hasToken) {
            return (
                <Box sx={{ position: 'relative' }}>
                    <NotificationsIcon sx={{ fontSize: 28 }} />
                    {/* Ponto vermelho indicando ação necessária */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'error.main',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)', opacity: 1 },
                                '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                                '100%': { transform: 'scale(1)', opacity: 1 },
                            }
                        }}
                    />
                </Box>
            );
        }

        if (permissionStatus === 'denied') {
            return <NotificationsOffIcon sx={{ fontSize: 28 }} />;
        }

        return <NotificationsIcon sx={{ fontSize: 28 }} />;
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const ativarNotificacoesComModal = async () => {
        // Abre a modal obrigatória primeiro
        setModalObrigatoriaOpen(true);

        // Depois ativa as notificações
        await ativarNotificacoes();
    };

    const ativarNotificacoes = async (forceUpdate = false) => {
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            // Solicitar permissão se necessário
            let permission = Notification.permission;

            if (permission === 'default' || forceUpdate) {
                permission = await Notification.requestPermission();
                setPermissionStatus(permission);
            }

            if (permission !== 'granted') {
                setMessage('Permissão negada. Por favor, permita notificações nas configurações do navegador.');
                setOpen(true);
                return;
            }

            // Obter novo token do Firebase
            const pushToken = await getFirebaseToken();

            if (!pushToken) {
                setMessage('Não foi possível obter o token de notificação do Firebase.');
                setOpen(true);
                return;
            }

            // Enviar token para o backend
            await api.patch(`/usuarios/${user.id}`, {
                pushToken: pushToken
            });

            setHasToken(true);
            setMessage(forceUpdate
                ? '✅ Token de notificação atualizado com sucesso!'
                : '✅ Notificações ativadas com sucesso!');
            setOpen(true);

            // Log para debug
            console.log('🔔 Token registrado:', pushToken.substring(0, 30) + '...');

        } catch (error: any) {
            console.error('Erro ao ativar notificações:', error);
            setMessage(`Erro: ${error.response?.data?.message || error.message}`);
            setOpen(true);
        } finally {
            setLoading(false);
            handleMenuClose();
        }
    };

    const testarNotificacao = async () => {
        try {
            await api.post('/notificacao/teste', {
                token: user?.pushToken,
                title: 'Teste de Notificação',
                body: 'Esta é uma notificação de teste do sistema! ✅',
                data: { type: 'teste', timestamp: new Date().toISOString() }
            });
            setMessage('📤 Notificação de teste enviada!');
            setOpen(true);
        } catch (error) {
            console.error('Erro no teste:', error);
            setMessage('Erro ao enviar notificação de teste.');
            setOpen(true);
        }
    };

    const getIconColor = () => {
        if (permissionStatus === 'granted' && hasToken) return 'success';
        if (permissionStatus === 'denied') return 'error';
        return 'inherit';
    };

    const getTooltipText = () => {
        if (permissionStatus === 'granted' && hasToken) return 'Notificações ativas';
        if (permissionStatus === 'denied') return 'Permissão negada - Clique para configurar';
        return 'Ativar notificações';
    };

    return (
        <>
            <Tooltip title={getTooltipText()} arrow>
                <Box sx={{ display: 'inline-block', position: 'relative' }}>
                    <IconButton
                        onClick={ativarNotificacoesComModal} // Alterado para abrir modal
                        disabled={loading}
                        color={getIconColor()}
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : permissionStatus === 'granted' && hasToken ? (
                            <NotificationsActiveIcon sx={{ fontSize: 28 }} />
                        ) : permissionStatus === 'denied' ? (
                            <NotificationsOffIcon sx={{ fontSize: 28 }} />
                        ) : (
                            <NotificationsIcon sx={{ fontSize: 28 }} />
                        )}
                    </IconButton>

                    {/* Badge para indicar status */}
                    {permissionStatus === 'granted' && hasToken && (
                        <Badge
                            color="success"
                            variant="dot"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                            }}
                        />
                    )}
                </Box>
            </Tooltip>

            {/* Modal Obrigatória */}
            <Dialog
                open={modalObrigatoriaOpen}
                onClose={() => setModalObrigatoriaOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <NotificationsActiveIcon color="primary" />
                        <Typography variant="h6">Ativar Notificações</Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Para receber notificações importantes como:
                    </Alert>

                    <Box sx={{ pl: 2, mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            • 📅 <strong style={{ marginLeft: 8 }}>Novas visitas agendadas</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            • 🔔 <strong style={{ marginLeft: 8 }}>Alterações de status</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            • ⏰ <strong style={{ marginLeft: 8 }}>Lembretes de compromissos</strong>
                        </Typography>
                    </Box>

                    <Box sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        textAlign: 'center'
                    }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Clique no botão abaixo para ativar:
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    await ativarNotificacoes();
                                    setModalObrigatoriaOpen(false);
                                }}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                            >
                                {loading ? 'Ativando...' : 'Ativar Notificações Agora'}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        onClick={() => setModalObrigatoriaOpen(false)}
                        variant="outlined"
                        fullWidth
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Menu de opções (para quem clica com botão direito ou quer mais opções) */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem disabled>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Notificações
                    </Typography>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => ativarNotificacoes(false)}>
                    <ListItemIcon>
                        <CheckCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Ativar Notificações"
                        secondary={permissionStatus === 'granted' ? 'Já ativado' : 'Clique para ativar'}
                    />
                </MenuItem>

                <MenuItem onClick={() => ativarNotificacoes(true)}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Forçar Atualização"
                        secondary="Renovar token de notificação"
                    />
                </MenuItem>

                <MenuItem onClick={testarNotificacao} disabled={!hasToken}>
                    <ListItemIcon>
                        <NotificationsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Testar Notificação"
                        secondary="Enviar uma notificação de teste"
                    />
                </MenuItem>

                <Divider />

                <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                        Status: {permissionStatus === 'granted' ? '✅ Ativo' : '❌ Inativo'}
                        {hasToken && ' | Token: ✅ Registrado'}
                    </Typography>
                </MenuItem>
            </Menu>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpen(false)}
                    severity={message?.includes('✅') ? 'success' : 'info'}
                    sx={{ width: '100%' }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </>
    );
};