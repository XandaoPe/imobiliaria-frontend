import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, CircularProgress, Alert,
    Paper, Card, CardContent, CardMedia, Button,
    Chip, Divider, Stack
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { EmpresaFormModal } from '../../components/EmpresaFormModal';
import api from '../../services/api';
import { Empresa } from '../../types/empresa';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CreditCardIcon from '@mui/icons-material/CreditCard';

export const EmpresaConfigPage: React.FC = () => {
    const { user } = useAuth();
    const [empresaLogada, setEmpresaLogada] = useState<Empresa | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.empresa) {
            fetchEmpresaLogada();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchEmpresaLogada = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/empresas/${user?.empresa}`);
            setEmpresaLogada(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao carregar dados da empresa');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        fetchEmpresaLogada();
    };

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    // Função para obter o ícone do tipo de chave PIX
    const getPixIcon = (tipo: string) => {
        switch (tipo) {
            case 'CNPJ': return <FingerprintIcon fontSize="small" />;
            case 'EMAIL': return <EmailIcon fontSize="small" />;
            case 'TELEFONE': return <PhoneIcon fontSize="small" />;
            case 'CHAVE_ALEATORIA': return <QrCodeIcon fontSize="small" />;
            default: return <QrCodeIcon fontSize="small" />;
        }
    };

    // Função para formatar o label do tipo de chave PIX
    const getPixLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            'CNPJ': 'CNPJ',
            'EMAIL': 'E-mail',
            'TELEFONE': 'Telefone',
            'CHAVE_ALEATORIA': 'Chave Aleatória'
        };
        return labels[tipo] || tipo;
    };

    // Função para formatar o telefone
    const formatTelefone = (telefone?: string) => {
        if (!telefone) return '';
        const cleaned = telefone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Dados da Empresa
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gerencie as informações e identidade visual da sua empresa.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {empresaLogada ? (
                <Box>
                    {/* Linha superior: Informações e Imagens lado a lado */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Card de Informações Básicas */}
                        <Paper
                            elevation={2}
                            sx={{
                                flex: 1,
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <BusinessIcon sx={{
                                    mr: 2,
                                    color: 'primary.main',
                                    fontSize: 40
                                }} />
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        {empresaLogada.nome}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {empresaLogada.cnpj}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Informações de Contato
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Telefone:</strong> {empresaLogada.fone ? formatTelefone(empresaLogada.fone) : 'Não informado'}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Status:</strong>{' '}
                                    <Chip
                                        label={empresaLogada.ativa ? 'Ativa' : 'Inativa'}
                                        size="small"
                                        color={empresaLogada.ativa ? 'success' : 'error'}
                                        sx={{ ml: 1 }}
                                    />
                                </Typography>
                                {empresaLogada.isAdmGeral && (
                                    <Typography variant="body1">
                                        <strong>Tipo:</strong>{' '}
                                        <Chip
                                            label="Administração Geral"
                                            size="small"
                                            color="secondary"
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        {/* Cards de Logotipo e Assinatura lado a lado */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 3,
                            flex: 1
                        }}>
                            {/* Card de Logotipo */}
                            <Paper
                                elevation={2}
                                sx={{
                                    flex: 1,
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Logotipo
                                </Typography>
                                <Card sx={{
                                    width: '100%',
                                    maxWidth: 200,
                                    mb: 2,
                                    boxShadow: 3
                                }}>
                                    {empresaLogada.logo ? (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={empresaLogada.logo}
                                            alt="Logo da empresa"
                                            sx={{ objectFit: 'contain', p: 2 }}
                                        />
                                    ) : (
                                        <CardContent sx={{
                                            height: 140,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Sem logotipo
                                            </Typography>
                                        </CardContent>
                                    )}
                                </Card>
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    {empresaLogada.logo ? 'Logotipo atual' : 'Nenhum logotipo cadastrado'}
                                </Typography>
                            </Paper>

                            {/* Card de Assinatura */}
                            <Paper
                                elevation={2}
                                sx={{
                                    flex: 1,
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Assinatura Digital
                                </Typography>
                                <Card sx={{
                                    width: '100%',
                                    maxWidth: 200,
                                    mb: 2,
                                    boxShadow: 3
                                }}>
                                    {empresaLogada.assinatura_url ? (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={empresaLogada.assinatura_url}
                                            alt="Assinatura digital"
                                            sx={{ objectFit: 'contain', p: 2 }}
                                        />
                                    ) : (
                                        <CardContent sx={{
                                            height: 140,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Sem assinatura
                                            </Typography>
                                        </CardContent>
                                    )}
                                </Card>
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    {empresaLogada.assinatura_url ? 'Assinatura atual' : 'Nenhuma assinatura cadastrada'}
                                </Typography>
                            </Paper>
                        </Box>
                    </Box>

                    {/* Linha inferior: Dados de Pagamento */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 3,
                        mb: 4
                    }}>
                        {/* Card de Dados PIX */}
                        <Paper
                            elevation={2}
                            sx={{
                                flex: 1,
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <QrCodeIcon sx={{
                                    mr: 2,
                                    color: 'primary.main',
                                    fontSize: 40
                                }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Dados PIX
                                </Typography>
                            </Box>

                            {empresaLogada.chavePix ? (
                                <Box sx={{ flexGrow: 1 }}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Chave PIX Principal
                                            </Typography>
                                            <Box sx={{
                                                p: 2,
                                                bgcolor: 'background.default',
                                                borderRadius: 1,
                                                borderLeft: 4,
                                                borderColor: empresaLogada.chavePix.preferencial ? 'success.main' : 'primary.main'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Chip
                                                        icon={getPixIcon(empresaLogada.chavePix.tipo)}
                                                        label={getPixLabel(empresaLogada.chavePix.tipo)}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ mr: 2 }}
                                                    />
                                                    {empresaLogada.chavePix.preferencial && (
                                                        <Chip
                                                            label="Preferencial"
                                                            size="small"
                                                            color="success"
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 'medium',
                                                    wordBreak: 'break-all',
                                                    mt: 1
                                                }}>
                                                    {empresaLogada.chavePix.chave}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Cadastrada em: {new Date(empresaLogada.chavePix.dataCadastro).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {empresaLogada.chavesPixAlternativas && empresaLogada.chavesPixAlternativas.length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Chaves PIX Alternativas
                                                </Typography>
                                                <Box sx={{ pl: 2 }}>
                                                    {empresaLogada.chavesPixAlternativas.map((chave, index) => (
                                                        <Typography
                                                            key={index}
                                                            variant="body2"
                                                            sx={{
                                                                p: 1,
                                                                mb: 1,
                                                                bgcolor: 'action.hover',
                                                                borderRadius: 1,
                                                                wordBreak: 'break-all'
                                                            }}
                                                        >
                                                            {chave}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            ) : (
                                <Box sx={{
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 4
                                }}>
                                    <QrCodeIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                        Nenhuma chave PIX cadastrada
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Edite os dados da empresa para adicionar
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Card de Dados Bancários */}
                        <Paper
                            elevation={2}
                            sx={{
                                flex: 1,
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <AccountBalanceIcon sx={{
                                    mr: 2,
                                    color: 'primary.main',
                                    fontSize: 40
                                }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Dados Bancários
                                </Typography>
                            </Box>

                            {empresaLogada.banco && empresaLogada.agencia && empresaLogada.conta ? (
                                <Box sx={{ flexGrow: 1 }}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Banco
                                            </Typography>
                                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                                {empresaLogada.banco}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Agência
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                    {empresaLogada.agencia}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Conta
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                    {empresaLogada.conta}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {empresaLogada.tipoConta && (
                                            <Box>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Tipo de Conta
                                                </Typography>
                                                <Chip
                                                    icon={<CreditCardIcon fontSize="small" />}
                                                    label={empresaLogada.tipoConta}
                                                    color="secondary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Instruções:</strong> Utilize estes dados para realizar transferências bancárias diretas.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : (
                                <Box sx={{
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 4
                                }}>
                                    <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                        Dados bancários não cadastrados
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Edite os dados da empresa para adicionar
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* Botão de Edição */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: 4,
                        pt: 4,
                        borderTop: 1,
                        borderColor: 'divider'
                    }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                            Clique no botão abaixo para editar os dados da empresa, incluindo informações de pagamento e identidade visual.
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleOpenModal}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1rem',
                                boxShadow: 3
                            }}
                        >
                            Editar Dados da Empresa
                        </Button>
                    </Box>

                    {/* Modal de Edição */}
                    <EmpresaFormModal
                        open={modalOpen}
                        onClose={handleCloseModal}
                        empresaToEdit={empresaLogada}
                        onSuccess={handleSuccess}
                    />
                </Box>
            ) : (
                <Alert severity="warning" sx={{ mt: 4 }}>
                    Não foi possível carregar os dados da empresa. Verifique sua conexão e tente novamente.
                </Alert>
            )}
        </Container>
    );
};