import React, { useState, useEffect, useCallback } from 'react';
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

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    // Função para buscar leads e contar os novos
    const fetchNotificationCount = useCallback(async () => {
        if (!user?.token) return;
        try {
            // O backend já filtra por empresa baseado no token do usuário
            const response = await axios.get('http://localhost:5000/leads', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const novos = response.data.filter((lead: any) => lead.status === 'NOVO');
            setNovosLeadsCount(novos.length);
        } catch (error) {
            console.error("Erro ao buscar notificações de leads", error);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchNotificationCount();

        // 1. Polling: Verifica a cada 60 segundos
        const interval = setInterval(fetchNotificationCount, 60000);

        // 2. Event Listener: Escuta atualizações manuais vindas da LeadsPage
        window.addEventListener('updateLeadsCount', fetchNotificationCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener('updateLeadsCount', fetchNotificationCount);
        };
    }, [fetchNotificationCount]);

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
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
                    <Typography variant="h6" noWrap>
                        Bem-vindo, {user?.perfil} - {user?.nome}!
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