import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
    CssBaseline, Badge
} from '@mui/material';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import axios from 'axios';

// Ícones
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';

import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';
import { API_URL } from '../services/api';

const drawerWidth = 240;

// --- Função de Som ---
const playLeadSound = (isNew: boolean) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Se o navegador suspendeu o áudio, tenta retomar
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isNew ? 1200 : 440, audioCtx.currentTime);
    // Subi para 1200Hz (mais "alerta")

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
};

interface MainLayoutProps {
    children?: React.ReactNode;
}

const ADMIN_GERAL_ROLE = [PerfisEnum.ADM_GERAL];
const USER_ADMIN_ROLES = [PerfisEnum.ADM_GERAL, PerfisEnum.GERENTE];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [novosLeadsCount, setNovosLeadsCount] = useState(0);
    const [nomeEmpresa, setNomeEmpresa] = useState<string>('');

    // Refs para controlar disparos de som
    const lastTotalCount = useRef(0);
    const hasPlayedInitial = useRef(false);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const fetchNotificationCount = useCallback(async (isPolling = false) => {
        if (!user?.token) return;
        try {
            const response = await axios.get(`${API_URL}/leads/count`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const count = response.data.count ?? 0;

            if (isPolling && count > lastTotalCount.current) {
                playLeadSound(true);
            }

            setNovosLeadsCount(count);
            lastTotalCount.current = count;
        } catch (error) {
            console.error("Erro ao buscar contagem de leads", error);
        }
    }, [user?.token]);

    const fetchEmpresaData = useCallback(async () => {
        if (!user?.token) return;

        try {
            // 1. Extraindo o empresaId manualmente do Token (Payload é a parte do meio)
            const base64Url = user.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));

            const empresaId = payload.empresaId; // Aqui está o seu ID do log: 6940...

            if (!empresaId) {
                console.warn("EmpresaId não encontrado no token.");
                return;
            }

            // 2. Buscando o nome da empresa usando o ID extraído
            const response = await axios.get(`${API_URL}/empresas/${empresaId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setNomeEmpresa(response.data.nome);
        } catch (error) {
            console.error("Erro ao extrair/buscar dados da empresa:", error);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchEmpresaData();
        fetchNotificationCount(false); // Busca inicial

        const interval = setInterval(() => {
            // REMOVIDO o "if location.pathname" para garantir que o badge atualize e o som toque sempre
            // mas passamos true apenas se não estivermos na tela de leads para evitar som repetitivo
            const deveTocarSom = location.pathname !== '/leads';
            fetchNotificationCount(deveTocarSom);
        }, 2000); // Reduzido para 2 segundos para ser mais responsivo

        // Evento customizado para quando você limpa leads na tela de leads, o layout atualizar o badge
        const updateHandler = () => fetchNotificationCount(false);
        window.addEventListener('updateLeadsCount', updateHandler);

        return () => {
            clearInterval(interval);
            window.removeEventListener('updateLeadsCount', updateHandler);
        };
    }, [fetchNotificationCount, location.pathname, fetchEmpresaData]);

    const hasPermission = (requiredRoles: PerfisEnum[]) => {
        if (requiredRoles.length === 0) return true;
        if (!user) return false;
        return requiredRoles.includes(user.perfil as PerfisEnum);
    };

    const baseMenuItems = [
        { text: 'Home', icon: <HomeIcon />, path: '/home', requiredRoles: [] },
        { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: [] },
        { text: 'Leads (Interesses)', icon: <ContactPhoneIcon />, path: '/leads', requiredRoles: [] },
        { text: 'Clientes', icon: <GroupIcon />, path: '/clientes', requiredRoles: [] },
        { text: 'Imóveis', icon: <BusinessIcon />, path: '/imoveis', requiredRoles: [] },
        { text: 'Empresas', icon: <LocationCityIcon />, path: '/empresas', requiredRoles: ADMIN_GERAL_ROLE },
        { text: 'Usuários', icon: <AdminPanelSettingsIcon />, path: '/usuarios', requiredRoles: USER_ADMIN_ROLES },
    ];

    const drawer = (
        <div>
            <Toolbar sx={{ backgroundColor: 'primary.main' }}>
                <Typography variant="h6" noWrap sx={{ color: 'white' }}>Imobiliária 4.0</Typography>
            </Toolbar>
            <Divider />
            <List>
                {baseMenuItems.map((item) => {
                    const isLeads = item.path === '/leads';
                    return hasPermission(item.requiredRoles as PerfisEnum[]) && (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                selected={location.pathname === item.path}
                            >
                                <ListItemIcon>
                                    {isLeads ? (
                                        <Badge badgeContent={novosLeadsCount} color="error" overlap="circular">
                                            {item.icon}
                                        </Badge>
                                    ) : item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        fontWeight: (isLeads && novosLeadsCount > 0) ? 'bold' : 'normal',
                                        color: (isLeads && novosLeadsCount > 0) ? 'error.main' : 'inherit'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding onClick={logout}>
                    <ListItemButton>
                        <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                        <ListItemText primary="Sair" />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                            <MenuIcon />
                        </IconButton>

                        <Typography variant="h6" noWrap>
                            {nomeEmpresa && (
                                <Box component="span" sx={{ fontWeight: 800, color: '#FFD700', mr: 1 }}>
                                    {nomeEmpresa.toUpperCase()} —
                                </Box>
                            )}
                            {" "}Bem-vindo, {user?.nome}!
                        </Typography>
                    </Box>

                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {user?.perfil}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, bgcolor: 'background.default', height: '100vh', overflowY: 'auto' }}>
                <Toolbar />
                {children ? children : <Outlet />}
            </Box>
        </Box>
    );
};