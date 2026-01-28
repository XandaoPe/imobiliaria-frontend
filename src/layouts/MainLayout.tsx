import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
    CssBaseline, Badge, Tooltip, Modal, TextField, Button, Alert
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
import LockIcon from '@mui/icons-material/Lock';
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

// Lista de emails autorizados para acessar Empresas
const EMAILS_AUTORIZADOS_EMPRESAS = [
    'a@a.com',
    'alexandre.dellanno@hotmail.com'
];

// Senha fixa para acesso às empresas
const SENHA_EMPRESAS = '123456';

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [novosLeadsCount, setNovosLeadsCount] = useState(0);
    const [agendamentosCount, setAgendamentosCount] = useState(0); // ⭐️ ESTADO PARA AGENDA
    const [nomeEmpresa, setNomeEmpresa] = useState<string>('');
    const [agendaOpen, setAgendaOpen] = useState(false); // ⭐️ CONTROLE DA AGENDA

    // ⭐️ NOVOS ESTADOS PARA CONTROLE DA SENHA DAS EMPRESAS
    const [modalSenhaEmpresasOpen, setModalSenhaEmpresasOpen] = useState(false);
    const [senhaEmpresas, setSenhaEmpresas] = useState('');
    const [senhaErro, setSenhaErro] = useState(false);
    const [senhaAprovada, setSenhaAprovada] = useState(false);

    const lastTotalCount = useRef(0);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        // Limpa a aprovação da senha
        setSenhaAprovada(false);
        setSenhaEmpresas('');

        logout();
        navigate('/', { replace: true }); // Força o redirecionamento para a Landing Page
    };

    // --- Funções para controle do modal de senha ---
    const handleClickEmpresas = (e: React.MouseEvent) => {
        e.preventDefault();

        // Se já aprovou a senha, permite acesso direto
        if (senhaAprovada) {
            navigate('/empresas');
            return;
        }

        // Caso contrário, abre o modal para solicitar senha
        setModalSenhaEmpresasOpen(true);
    };

    const verificarSenha = () => {
        if (senhaEmpresas === SENHA_EMPRESAS) {
            setSenhaAprovada(true);
            setSenhaErro(false);
            setModalSenhaEmpresasOpen(false);
            setSenhaEmpresas('');
            navigate('/empresas');
        } else {
            setSenhaErro(true);
            setSenhaEmpresas('');
        }
    };

    const fecharModal = () => {
        setModalSenhaEmpresasOpen(false);
        setSenhaEmpresas('');
        setSenhaErro(false);
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

    const podeAcessarEmpresas = (): boolean => {
        if (!user) return false;

        // Precisa ser ADM_GERAL
        if (user.perfil !== PerfisEnum.ADM_GERAL) return false;

        // E estar com um dos emails autorizados
        return EMAILS_AUTORIZADOS_EMPRESAS.includes(user.email.toLowerCase());
    };

    const baseMenuItems = [
        {
            text: 'Empresas',
            icon: <LocationCityIcon />,
            path: '/empresas',
            requiredRoles: ADMIN_GERAL_ROLE,
            validacaoEspecial: podeAcessarEmpresas
        },
        { text: 'Home', icon: <HomeIcon />, path: '/home', requiredRoles: [] },
        { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: [] },
        { text: 'Negociações', icon: <HandshakeIcon />, path: '/negociacoes', requiredRoles: [] },
        { text: 'Leads (Interesses)', icon: <ContactPhoneIcon />, path: '/leads', requiredRoles: [] },
        { text: 'Clientes', icon: <GroupIcon />, path: '/clientes', requiredRoles: [] },
        { text: 'Imóveis', icon: <BusinessIcon />, path: '/imoveis', requiredRoles: [] },
        { text: 'Financeiro', icon: <AttachMoneyIcon />, path: '/financeiro', requiredRoles: USER_ADMIN_ROLES },
        { text: 'Usuários', icon: <AdminPanelSettingsIcon />, path: '/usuarios', requiredRoles: USER_ADMIN_ROLES },
        {
            text: 'Dados da Empresa',
            icon: <BusinessIcon />,
            path: '/configuracoes/empresa',
            requiredRoles: USER_ADMIN_ROLES,
        },
        { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes/parametros', requiredRoles: USER_ADMIN_ROLES }
    ];

    const drawer = (
        <div>
            <Toolbar sx={{ backgroundColor: 'primary.dark' }}>
                <Typography variant="h6" noWrap sx={{ color: 'white' }}>Imobiliária 4.0</Typography>
            </Toolbar>
            <Divider />
            <List>
                {baseMenuItems.map((item) => {
                    const isLeads = item.path === '/leads';

                    // ⭐️ Validação especial para Empresas
                    if (item.path === '/empresas') {
                        // Usa a validação especial apenas para Empresas
                        if (!podeAcessarEmpresas()) return null;

                        // Item Empresas com clique especial
                        return (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    onClick={handleClickEmpresas} // ⭐️ ALTERADO: usa função especial
                                    selected={location.pathname === '/empresas'}
                                >
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        secondary={senhaAprovada ? "✓ Acesso liberado" : "🔒 Acesso restrito"}
                                        secondaryTypographyProps={{
                                            fontSize: '0.7rem',
                                            color: senhaAprovada ? 'success.main' : 'warning.main'
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    } else {
                        // Para os outros itens, usa a validação normal
                        if (!hasPermission(item.requiredRoles as PerfisEnum[])) return null;

                        return (
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
                    }
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

                {/* ⭐️ MODAL PARA SENHA DAS EMPRESAS */}
                <Modal
                    open={modalSenhaEmpresasOpen}
                    onClose={fecharModal}
                    aria-labelledby="modal-senha-empresas"
                    aria-describedby="modal-senha-empresas-descricao"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2
                    }}>
                        <Typography id="modal-senha-empresas" variant="h6" component="h2" gutterBottom>
                            <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Acesso Restrito - Empresas
                        </Typography>

                        <Typography id="modal-senha-empresas-descricao" sx={{ mb: 2, color: 'text.secondary' }}>
                            Esta área requer uma senha adicional para acesso.
                        </Typography>

                        {senhaErro && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                Senha incorreta. Tente novamente.
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            type="password"
                            autoComplete='new-password'
                            label="Digite a senha de acesso"
                            value={senhaEmpresas}
                            onChange={(e) => {
                                setSenhaEmpresas(e.target.value);
                                setSenhaErro(false);
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    verificarSenha();
                                }
                            }}
                            error={senhaErro}
                            helperText={senhaErro ? "Senha incorreta" : ""}
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={fecharModal} variant="outlined">
                                Cancelar
                            </Button>
                            <Button
                                onClick={verificarSenha}
                                variant="contained"
                                color="primary"
                                disabled={!senhaEmpresas.trim()}
                            >
                                Acessar
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        ml: { sm: `${drawerWidth}px` },
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        backgroundColor: 'primary.dark',
                    }}
                >
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

                <Box
                    component="nav"
                    sx={{
                        width: { sm: drawerWidth },
                        flexShrink: { sm: 0 }
                    }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                backgroundColor: 'background.paper',
                            }
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                backgroundColor: 'background.paper'
                            }
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` },
                        bgcolor: 'background.default',
                        height: '100vh',
                        overflowY: 'auto'
                    }}
                >
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