// src/layouts/MainLayout.tsx
import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, CssBaseline } from '@mui/material';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext'; // Vamos criar este contexto

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Clientes', icon: <GroupIcon />, path: '/clientes' },
    { text: 'Imóveis', icon: <BusinessIcon />, path: '/imoveis' },
    // Adicione Agendamentos, Contratos e Relatórios aqui
];

export const MainLayout = () => {
    const { logout, user } = useAuth(); // Assume que useAuth já está criado
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <div>
            <Toolbar sx={{ backgroundColor: 'primary.main' }}>
                <Typography variant="h6" noWrap component="div" sx={{ color: 'white' }}>
                    Imobiliária 4.0
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={RouterLink} to={item.path}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
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
        <Box sx={{ display: 'flex' }}>
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
                        Bem-vindo, {user?.perfil || 'Usuário'}!
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar (Drawer) */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Drawer para Mobile */}
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

                {/* Drawer para Desktop */}
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

            {/* Conteúdo Principal (Onde as páginas serão renderizadas) */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: 'background.default', // Usa o fundo do tema
                    minHeight: '100vh',
                }}
            >
                <Toolbar /> {/* Espaçador para o AppBar fixo */}
                <Outlet /> {/* Aqui a rota filha (DashboardPage, ClientePage) será renderizada */}
            </Box>
        </Box>
    );
};