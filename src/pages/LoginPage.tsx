import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    FormControl,        // Para o Select
    InputLabel,         // Para o Label do Select
    Select,             // O Dropdown
    MenuItem,           // As opções do Dropdown
    SelectChangeEvent   // Tipo para o evento de mudança do Select
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api, { API_URL } from '../services/api';
import { getFirebaseToken } from '../services/firebaseConfig';

// ⚠️ IMPORTANTE: Ajuste a URL base da sua API NestJS

// Interface para o objeto de empresa retornado pelo backend
interface EmpresaOption {
    id: string;
    nome: string; // Esperamos que o backend retorne o nome agora
}


export const LoginPage = () => {
    // Estado de Credenciais
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Estado do Fluxo de Login
    const [empresaId, setEmpresaId] = useState('');                   // ID selecionado
    const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);   // Lista de opções
    const [etapa, setEtapa] = useState<'credenciais' | 'selecao'>('credenciais'); // Controle da Etapa

    // Estado da UI
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hooks
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Se já estiver autenticado, redireciona imediatamente
    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    const salvarTokenPush = async (userId: string, tokenJWT: string) => {
        try {
            // 1. Pede permissão ao usuário
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                // 2. Busca o token único deste navegador no Firebase
                const tokenFCM = await getFirebaseToken();

                if (tokenFCM) {
                    // 3. Salva no banco de dados do seu NestJS
                    // Assumindo que você tem uma rota PATCH em usuários
                    await api.patch(`/usuarios/${userId}`,
                        { pushToken: tokenFCM },
                        { headers: { Authorization: `Bearer ${tokenJWT}` } }
                    );
                    console.log("Notificações configuradas com sucesso!");
                }
            }
        } catch (error) {
            console.error("Erro no fluxo de notificação:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Tenta obter o Token do Firebase ANTES do login final
            let pushToken = undefined;
            try {
                // Pede permissão e gera o token
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    pushToken = await getFirebaseToken();
                }
            } catch (pErr) {
                console.warn("Permissão de push negada ou erro no Firebase", pErr);
            }

            // 2. Monta o payload incluindo o pushToken se existir
            const payload = {
                email,
                senha: password,
                empresaId: etapa === 'selecao' ? empresaId : undefined,
                pushToken: pushToken // 👈 Enviamos aqui para o AuthService.login capturar
            };

            const response = await api.post('/auth/login', payload);

            // Caso precise selecionar empresa
            if (response.data.requiresSelection) {
                setEmpresas(response.data.empresas);
                setEtapa('selecao');
                if (response.data.empresas.length === 1) {
                    setEmpresaId(response.data.empresas[0].id);
                }
                setLoading(false);
                return;
            }

            // LOGIN SUCESSO
            const token = response.data.access_token;
            if (token) {
                login(token); // Atualiza o contexto de autenticação
                navigate('/home');
            }

        } catch (err: any) {
            let errorMessage = 'Falha na conexão ou erro desconhecido.';
            if (err.response) {
                errorMessage = err.response.data?.message || err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handler para mudança no dropdown de empresa
    const handleEmpresaChange = (event: SelectChangeEvent) => {
        setEmpresaId(event.target.value as string);
    };

    return (

        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'background.default'
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
                    {etapa === 'credenciais' ? 'Acesso ao Sistema' : 'Selecione a Empresa'}
                </Typography>

                <Box component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        mt: 3,
                        width: '100%',
                    }}
                    autoComplete="off"
                >

                    {/* ⭐️ Renderiza Campos de Credenciais SOMENTE na Etapa 1 */}
                    {etapa === 'credenciais' && (
                        <>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="E-mail"
                                // autoComplete="new-password"
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
                                // autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </>
                    )}

                    {/* ⭐️ Renderiza o Dropdown SOMENTE na Etapa 2 */}
                    {etapa === 'selecao' && (
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="empresa-select-label">Empresa</InputLabel>
                            <Select
                                labelId="empresa-select-label"
                                value={empresaId}
                                label="Empresa"
                                onChange={handleEmpresaChange}
                            >
                                <MenuItem value="">
                                    <em>Selecione uma empresa</em>
                                </MenuItem>
                                {empresas.map((emp) => (
                                    <MenuItem key={emp.id} value={emp.id}>
                                        {emp.nome}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

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
                        // Desabilita se estiver carregando OU se estiver na etapa de seleção e nenhuma empresa for escolhida
                        disabled={loading || (etapa === 'selecao' && !empresaId)}
                    >
                        {loading
                            ? <CircularProgress size={24} color="inherit" />
                            : etapa === 'credenciais'
                                ? 'Próximo'
                                : 'Entrar'
                        }
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};