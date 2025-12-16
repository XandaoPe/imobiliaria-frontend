// src/layouts/MainLayout.tsx

import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, CssBaseline } from '@mui/material';
import { Outlet, Link as RouterLink } from 'react-router-dom';

// ⭐️ Ícones de Navegação
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group'; // Clientes
import BusinessIcon from '@mui/icons-material/Business'; // Imóveis
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Ícone para Usuários
import LocationCityIcon from '@mui/icons-material/LocationCity'; // ⭐️ NOVO: Ícone para Empresas
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

// ⭐️ Importações de Autenticação e Tipagem
import { useAuth } from '../contexts/AuthContext';
import { PerfisEnum } from '../types/usuario';

const drawerWidth = 240;

// ⭐️ Perfis que têm acesso aos módulos
const ADMIN_GERAL_ROLE = [PerfisEnum.ADM_GERAL]; // ⭐️ NOVO: Apenas ADM_GERAL
const USER_ADMIN_ROLES = [PerfisEnum.ADM_GERAL, PerfisEnum.GERENTE];

// ⭐️ Definição dos Itens de Menu (Com visibilidade condicional)
const baseMenuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/home', requiredRoles: [] as PerfisEnum[] },
    { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: [] as PerfisEnum[] },
    { text: 'Clientes', icon: <GroupIcon />, path: '/clientes', requiredRoles: [] as PerfisEnum[] },
    { text: 'Imóveis', icon: <BusinessIcon />, path: '/imoveis', requiredRoles: [] as PerfisEnum[] },
    // ⭐️ ITEM ADICIONADO: Empresas (Apenas ADM_GERAL)
    { text: 'Empresas', icon: <LocationCityIcon />, path: '/empresas', requiredRoles: ADMIN_GERAL_ROLE },
    // Item Usuários (ADM_GERAL e GERENTE)
    { text: 'Usuários', icon: <AdminPanelSettingsIcon />, path: '/usuarios', requiredRoles: USER_ADMIN_ROLES },
    // Adicione Agendamentos, Contratos e Relatórios aqui
];

export const MainLayout = () => {
    const { logout, user } = useAuth();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Função de verificação de permissão
    const hasPermission = (requiredRoles: PerfisEnum[]) => {
        // Se não houver roles requeridas, o item é visível (ex: Home, Dashboard).
        if (requiredRoles.length === 0) return true;

        // Se o usuário não estiver carregado, esconde
        if (!user) return false;

        // Verifica se o perfil do usuário logado está na lista de perfis requeridos
        return requiredRoles.includes(user.perfil as PerfisEnum);
    };

    // Conteúdo do Drawer (Aplicando a lógica condicional)
    const drawer = (
        <div>
            <Toolbar sx={{ backgroundColor: 'primary.main' }}>
                <Typography variant="h6" noWrap component="div" sx={{ color: 'white' }}>
                    Imobiliária 4.0
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {/* Mapeia os itens e aplica o filtro de permissão */}
                {baseMenuItems.map((item) => (
                    hasPermission(item.requiredRoles) && (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={RouterLink}
                                to={item.path}
                                onClick={handleDrawerToggle}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    )
                ))}
            </List>
            <Divider />
            <List>
                {/* Item Sair */}
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

            {/* AppBar (Topo) */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Bem-vindo, {user?.perfil || "Usuário"} - {user?.nome || 'Usuário'}!
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar (Drawer) */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Drawer para Mobile e Desktop (com o conteúdo 'drawer' definido acima) */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Conteúdo Principal */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: 'background.default',
                    height: '100vh',
                    overflowY: 'auto',
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};