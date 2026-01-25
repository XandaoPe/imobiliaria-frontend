// src/pages/LandingPage.tsx

import React, { useState } from 'react'; // ❗ Importar useState
import { Box, Typography, Button, Container, AppBar, Toolbar, Stack } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
// ❗ Importar a nova modal
import { RegistroMasterModal } from '../components/RegistroMasterModal';

// Estilização do Conteúdo Principal com a Imagem de Fundo (Simulada)
const HeroSection = styled(Box)(({ theme }) => ({
    // Para uma imagem de fundo real, você usaria: backgroundImage: 'url(caminho/para/imagem.jpg)'
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(https://picsum.photos/seed/luxoimovel/1600/900)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    textAlign: 'center',
}));

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    // ❗ Novo estado para controlar a abertura da modal de registro
    const [openRegistroModal, setOpenRegistroModal] = useState(false);

    const handleLoginClick = () => {
        // Redireciona para a página de Login
        navigate('/login');
    };

    const handleCadastroClick = () => {
        // ❗ Abre a modal de Registro Master
        setOpenRegistroModal(true);
    };

    // ❗ Função chamada ao fechar a modal ou após sucesso
    const handleCloseRegistroModal = () => {
        setOpenRegistroModal(false);
    }

    // ❗ Função chamada apenas após o sucesso do registro (POST no backend)
    const handleRegistroSuccess = () => {
        // Exibe feedback e navega para o login
        alert('Administração criada com sucesso! Utilize seu email e senha para fazer login.');
        navigate('/login');
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* 1. AppBar Fixo e Transparente */}
            <AppBar position="fixed" elevation={0} sx={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, fontWeight: 'bold' }}
                    >
                        Imobiliária 4.0 Pro
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleCadastroClick} // ❗ Abre a modal
                        sx={{
                            mr: 1,
                            border: '1px solid white',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        Criar minha Administração/Acessos
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLoginClick}
                        sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#eee' } }}
                    >
                        Login
                    </Button>
                </Toolbar>
            </AppBar>

            {/* 2. Seção Hero (Conteúdo principal com a imagem) */}
            <HeroSection>
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{ fontWeight: 700, mb: 3 }}
                    >
                        Gerencie Imóveis com Eficiência Máxima.
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ mb: 5, color: '#f0f0f0' }}
                    >
                        A plataforma completa para imobiliárias e corretores.
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={3}
                        justifyContent="center"
                    >
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            onClick={() => navigate('/home')} // Agora aponta para a Home
                            sx={{ padding: '12px 30px', fontSize: '1.1rem' }}
                        >
                            Ver Imóveis Disponíveis
                        </Button>
                        
                    </Stack>
                </Container>
            </HeroSection>

            {/* 3. Modal de Registro Master */}
            <RegistroMasterModal
                open={openRegistroModal}
                onClose={handleCloseRegistroModal}
                onSuccess={handleRegistroSuccess}
            />

        </Box>
    );
};