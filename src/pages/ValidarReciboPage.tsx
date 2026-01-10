import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Divider, Container } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../services/api';

export const ValidarReciboPage = () => {
    const { id } = useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [dados, setDados] = useState<any>(null);

    useEffect(() => {
        const validar = async () => {
            try {
                // Chamada para o endpoint público que criamos no NestJS
                const response = await api.get(`/financeiro/validar/${id}`);
                setDados(response.data);
                setStatus('success');
            } catch (error) {
                setStatus('error');
            }
        };
        validar();
    }, [id]);

    if (status === 'loading') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4, textAlign: 'center' }}>

                    {status === 'success' ? (
                        <Box>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                                Recibo Autêntico
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                Este documento foi gerado e validado pelo sistema oficial.
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">CLIENTE / PAGADOR</Typography>
                                    <Typography variant="body1" fontWeight="medium">{dados.cliente}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">VALOR</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                                        {dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">DATA DO PAGAMENTO</Typography>
                                    <Typography variant="body1">{new Date(dados.data).toLocaleDateString('pt-BR')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">EMISSOR</Typography>
                                    <Typography variant="body1">{dados.emissor}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" color="error.main" gutterBottom>
                                Documento Inválido
                            </Typography>
                            <Typography variant="body1">
                                Não encontramos um registro correspondente a este código.
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
                    Sistema de Gestão Imobiliária v1.0
                </Typography>
            </Box>
        </Container>
    );
};