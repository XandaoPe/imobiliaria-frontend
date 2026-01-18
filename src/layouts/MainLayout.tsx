import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
    CssBaseline, Badge, Tooltip
} from '@mui/material';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
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
import HandshakeIcon from '@mui/icons-material/Handshake';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; 
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; 
import SettingsIcon from '@mui/icons-material/Settings';

import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';
import { API_URL } from '../services/api';
import { AgendaLateral } from '../components/AgendaDashboard';
import { AtivarNotificacoes } from '../components/AtivarNotificacoes';

const drawerWidth = 240;

// --- Função de Som (Lead) ---
const playLeadSound = (isNew: boolean) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isNew ? 1200 : 440, audioCtx.currentTime);
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
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [novosLeadsCount, setNovosLeadsCount] = useState(0);
    const [agendamentosCount, setAgendamentosCount] = useState(0); // ⭐️ ESTADO PARA AGENDA
    const [nomeEmpresa, setNomeEmpresa] = useState<string>('');
    const [agendaOpen, setAgendaOpen] = useState(false); // ⭐️ CONTROLE DA AGENDA

    const lastTotalCount = useRef(0);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true }); // Força o redirecionamento para a Landing Page
    };

    // --- Busca Contagem de Leads ---
    const fetchNotificationCount = useCallback(async (isPolling = false) => {
        if (!user?.token) return;
        try {
            const response = await axios.get(`${API_URL}/leads/count`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const count = response.data.count ?? 0;
            if (isPolling && count > lastTotalCount.current) playLeadSound(true);
            setNovosLeadsCount(count);
            lastTotalCount.current = count;
        } catch (error) {
            console.error("Erro ao buscar contagem de leads", error);
        }
    }, [user?.token]);

    // --- ⭐️ Busca Contagem de Agendamentos do Dia ---
    const fetchAgendamentosCount = useCallback(async () => {
        if (!user?.token) return;
        try {
            const response = await axios.get(`${API_URL}/agendamentos`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // ⭐️ Filtra APENAS os agendamentos com status PENDENTE
            // Isso garante que o Badge na Toolbar mostre apenas o que o corretor precisa agir
            const pendentes = response.data.filter((a: any) => a.status === 'PENDENTE');

            setAgendamentosCount(pendentes.length);
        } catch (error) {
            console.error("Erro ao buscar contagem de agenda", error);
        }
    }, [user?.token]);

    const fetchEmpresaData = useCallback(async () => {
        if (!user?.token) return;
        try {
            const base64Url = user.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const empresaId = payload.empresaId;
            if (!empresaId) return;

            const response = await axios.get(`${API_URL}/empresas/${empresaId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNomeEmpresa(response.data.nome);
        } catch (error) {
            console.error("Erro ao buscar dados da empresa:", error);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchEmpresaData();
        fetchNotificationCount(false);
        fetchAgendamentosCount(); // ⭐️ Busca inicial da agenda

        const interval = setInterval(() => {
            const deveTocarSom = location.pathname !== '/leads';
            fetchNotificationCount(deveTocarSom);
            fetchAgendamentosCount(); // ⭐️ Atualiza contador da agenda a cada 10s
        }, 10000);

        const updateHandler = () => {
            fetchNotificationCount(false);
            fetchAgendamentosCount();
        };
        window.addEventListener('updateLeadsCount', updateHandler);
        window.addEventListener('updateAgenda', updateHandler); // Evento para quando criar agendamento

        return () => {
            clearInterval(interval);
            window.removeEventListener('updateLeadsCount', updateHandler);
            window.removeEventListener('updateAgenda', updateHandler);
        };
    }, [fetchNotificationCount, fetchAgendamentosCount, location.pathname, fetchEmpresaData]);

    const hasPermission = (requiredRoles: PerfisEnum[]) => {
        if (requiredRoles.length === 0) return true;
        if (!user) return false;
        return requiredRoles.includes(user.perfil as PerfisEnum);
    };

    const baseMenuItems = [
        { text: 'Home', icon: <HomeIcon />, path: '/home', requiredRoles: [] },
        { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: [] },
        { text: 'Negociações', icon: <HandshakeIcon />, path: '/negociacoes', requiredRoles: [] },
        { text: 'Leads (Interesses)', icon: <ContactPhoneIcon />, path: '/leads', requiredRoles: [] },
        { text: 'Clientes', icon: <GroupIcon />, path: '/clientes', requiredRoles: [] },
        { text: 'Imóveis', icon: <BusinessIcon />, path: '/imoveis', requiredRoles: [] },
        { text: 'Empresas', icon: <LocationCityIcon />, path: '/empresas', requiredRoles: ADMIN_GERAL_ROLE },
        { text: 'Financeiro', icon: <AttachMoneyIcon />, path: '/financeiro', requiredRoles: USER_ADMIN_ROLES },
        { text: 'Usuários', icon: <AdminPanelSettingsIcon />, path: '/usuarios', requiredRoles: USER_ADMIN_ROLES },
        { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes/parametros', requiredRoles: USER_ADMIN_ROLES }
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
                <ListItem disablePadding onClick={handleLogout}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGlow: 1 }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: { xs: 1, sm: 2 }, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Typography com minWidth 0 e noWrap para não quebrar o layout */}
                        <Typography variant="h6" noWrap sx={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {/* Oculta o nome da empresa em telas muito pequenas (xs) */}
                            {nomeEmpresa && (
                                <Box component="span" sx={{
                                    fontWeight: 800,
                                    color: '#FFD700',
                                    mr: 1,
                                    display: { xs: 'none', md: 'inline-block' }
                                }}>
                                    {nomeEmpresa.toUpperCase()} —
                                </Box>
                            )}

                            {/* Texto "Bem-vindo" some no mobile para dar lugar ao nome */}
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                Bem-vindo,{" "}
                            </Box>

                            <Box component="span" sx={{
                                fontWeight: 800,
                                color: '#FFD700',
                                fontSize: { xs: '0.9em', sm: '1.1em' }
                            }}>
                                {user?.nome.split(' ')[0]} {/* Pega apenas o primeiro nome no mobile */}
                            </Box>
                            !
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, flexShrink: 0 }}>
                        <AtivarNotificacoes />
                        <Tooltip title="Agenda de Visitas">
                            <IconButton color="inherit" onClick={() => setAgendaOpen(true)}>
                                <Badge badgeContent={agendamentosCount} color="error">
                                    <CalendarMonthIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* Perfil só aparece do tablet para cima */}
                        <Typography variant="caption" sx={{ opacity: 0.8, display: { xs: 'none', md: 'block' } }}>
                            {user?.perfil}
                        </Typography>
                    </Box>
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

            {/* ⭐️ COMPONENTE DA AGENDA LATERAL */}
            <AgendaLateral
                open={agendaOpen}
                onClose={() => setAgendaOpen(false)}
            />
        </Box>
    );
};