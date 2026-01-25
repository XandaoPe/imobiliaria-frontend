import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, CircularProgress, Alert,
    Paper, Card, CardContent, CardMedia, Button
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { EmpresaFormModal } from '../../components/EmpresaFormModal';
import api from '../../services/api';
import { Empresa } from '../../types/empresa';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';

export const EmpresaPage: React.FC = () => {
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
                        {/* Card de Informações */}
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
                                    <strong>Telefone:</strong> {empresaLogada.fone || 'Não informado'}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    <strong>Status:</strong>{' '}
                                    <Box component="span" sx={{
                                        color: empresaLogada.ativa ? 'success.main' : 'error.main',
                                        fontWeight: 'bold'
                                    }}>
                                        {empresaLogada.ativa ? 'Ativa' : 'Inativa'}
                                    </Box>
                                </Typography>
                                {empresaLogada.isAdmGeral && (
                                    <Typography variant="body1">
                                        <strong>Tipo:</strong>{' '}
                                        <Box component="span" sx={{
                                            color: 'secondary.main',
                                            fontWeight: 'bold'
                                        }}>
                                            Administração Geral
                                        </Box>
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

                    {/* Botão de Edição */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: 4
                    }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                            Clique no botão abaixo para editar os dados e identidade visual da sua empresa.
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
                                fontSize: '1rem'
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