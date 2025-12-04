// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// ⚠️ IMPORTANTE: Ajuste a URL base da sua API NestJS
// Se estiver rodando localmente (padrão)
const API_URL = 'http://localhost:5000/auth/login';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Se já estiver autenticado, redireciona imediatamente
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Tentando logar com:', { email, password, empresaId });
        console.log('Logar e', e);

        try {
            // 1. Faz a requisição POST para o endpoint de login do NestJS
            const response = await axios.post(API_URL, {
                // ⭐️ Chaves enviadas pelo frontend
                email: email, // Deve ser 'email'
                senha: password, // ⭐️ Ajuste: Deve ser 'senha' (se seu DTO usa 'senha')
                empresaId: empresaId
            });

            // 2. Assumindo que sua API retorna o token no campo 'access_token'
            const token = response.data.access_token;

            if (token) {
                // 3. Salva o token no contexto e localStorage (chama o login do AuthContext)
                login(token);
                // 4. Redireciona para o Dashboard
                navigate('/dashboard');
            }
        } catch (err: any) {
            // Trata erros de requisição ou credenciais
            let errorMessage = 'Falha na conexão ou erro desconhecido.';

            if (err.response) {
                // Erros HTTP (400, 401, etc.)
                errorMessage = err.response.data?.message || err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'background.default' // Usa a cor de fundo definida no tema
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: 350,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <LockOutlinedIcon color="primary" sx={{ m: 1 }} />
                <Typography component="h1" variant="h5">
                    Acesso ao Sistema
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="E-mail"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Senha"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {/* ⭐️ NOVO CAMPO: Temporário para o ID da Empresa */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="ID da Empresa (TESTE)"
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value)}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};