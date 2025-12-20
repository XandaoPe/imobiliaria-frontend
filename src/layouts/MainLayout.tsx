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

const drawerWidth = 240;

// --- Função de Som ---
const playLeadSound = (isNew: boolean) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Som Agudo (880Hz) para novos leads, Médio (440Hz) para pendentes no login
        osc.frequency.setValueAtTime(isNew ? 880 : 440, audioCtx.currentTime);
        osc.type = 'sine';

        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        // Navegadores bloqueiam som sem interação prévia
        console.log("Aguardando interação para habilitar som.");
    }
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
            const response = await axios.get('http://192.168.1.5:5000/leads/count', {
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

    useEffect(() => {
        fetchNotificationCount(false);

        const interval = setInterval(() => {
            // ECONOMIA: Se o usuário já está na página de leads, não precisa do polling do layout
            if (location.pathname !== '/leads') {
                fetchNotificationCount(true);
            }
        }, 30000);

        window.addEventListener('updateLeadsCount', () => fetchNotificationCount(false));

        return () => {
            clearInterval(interval);
            window.removeEventListener('updateLeadsCount', () => fetchNotificationCount(false));
        };
    }, [fetchNotificationCount, location.pathname]);

    const hasPermission = (requiredRoles: PerfisEnum[]) => {
        if (requiredRoles.length === 0) return true;
        if (!user) return false;
        return requiredRoles.includes(user.perfil as PerfisEnum);
    };
    console.log('user...', user)

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