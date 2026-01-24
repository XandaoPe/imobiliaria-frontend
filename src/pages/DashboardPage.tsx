// src/pages/DashboardPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Alert, CircularProgress, LinearProgress, Divider
} from '@mui/material';
import {
    TrendingUp, Handshake, AssignmentInd, HomeWork, PeopleAlt
} from '@mui/icons-material';

import api from '../services/api';
import { Imovel } from '../types/imovel';
import { Usuario } from '../types/usuario';
import { Negociacao } from '../types/negociacao';
import { useAuth } from '../contexts/AuthContext';

interface DashboardMetrics {
    totalImoveis: number;
    valorTotalImoveis: number;
    imoveisDisponiveis: number;
    totalUsuarios: number;
    usuariosAtivos: number;
    totalClientes: number;
    totalNegociacoes: number;
    valorEmNegociacao: number;
    negociacoesPorStatus: Record<string, number>;
    taxaConversao: number;
    totalLeads: number;
    novosLeads: number;
    leadsEmAtendimento: number;
}

export const DashboardPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        if (!localStorage.getItem('token')) return;

        setLoading(true);
        try {
            const [resImoveis, resUsuarios, resClientes, resLeadsStats, resNegociacoes] = await Promise.all([
                api.get('/imoveis'),
                api.get('/usuarios'),
                api.get('/clientes'),
                api.get('/leads/stats'),
                api.get('/negociacoes')
            ]);

            const imoveis: Imovel[] = resImoveis.data;
            const negociacoes: Negociacao[] = resNegociacoes.data;
            const statsLeads = resLeadsStats.data;

            const negPorStatus = negociacoes.reduce((acc: any, cur) => {
                acc[cur.status] = (acc[cur.status] || 0) + 1;
                return acc;
            }, {});

            const fechadas = negociacoes.filter(n => ['FECHADO', 'ASSINADO'].includes(n.status)).length;

            setMetrics({
                totalImoveis: imoveis.length,
                valorTotalImoveis: imoveis.reduce((acc, cur) => acc + (cur.valor_venda || 0), 0),
                imoveisDisponiveis: imoveis.filter(i => i.disponivel).length,
                totalUsuarios: resUsuarios.data.length,
                usuariosAtivos: resUsuarios.data.filter((u: Usuario) => u.ativo).length,
                totalClientes: resClientes.data.length,
                totalLeads: statsLeads.total,
                novosLeads: statsLeads.novos,
                leadsEmAtendimento: statsLeads.emAtendimento,
                totalNegociacoes: negociacoes.length,
                valorEmNegociacao: negociacoes.reduce((acc, cur) => acc + (cur.valor_negociado || 0), 0),
                negociacoesPorStatus: negPorStatus,
                taxaConversao: negociacoes.length > 0 ? (fechadas / negociacoes.length) * 100 : 0,
            });
        } catch (err) {
            setError('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) fetchAllData();
    }, [fetchAllData, isAuthenticated, user]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!metrics) return null;

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* TÍTULO E HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">📊 Dashboard CRM</Typography>
                    <Typography variant="body2" color="text.secondary">Indicadores de desempenho da empresa</Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ bgcolor: 'action.selected', px: 2, py: 0.5, borderRadius: 2 }}>
                    Usuário: {user?.nome}
                </Typography>
            </Box>

            {/* SEÇÃO 1: CARDS DE KPI (FLEXBOX) */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 24px)', lg: '1 1 0' } }
            }}>
                <Paper sx={{ p: 2.5, borderLeft: '6px solid #1976d2', boxShadow: 2 }}>
                    <Typography color="textSecondary" variant="caption" fontWeight="bold">PIPELINE ATIVO</Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                        {metrics.valorEmNegociacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                        <TrendingUp color="success" />
                        <Typography variant="caption" color="success.main">{metrics.totalNegociacoes} processos em curso</Typography>
                    </Box>
                </Paper>

                <Paper sx={{ p: 2.5, borderLeft: '6px solid #2e7d32', boxShadow: 2 }}>
                    <Typography color="textSecondary" variant="caption" fontWeight="bold">TAXA DE CONVERSÃO</Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>{metrics.taxaConversao.toFixed(1)}%</Typography>
                    <LinearProgress variant="determinate" value={metrics.taxaConversao} sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: '#e0e0e0' }} />
                </Paper>

                <Paper sx={{ p: 2.5, borderLeft: '6px solid #ed6c02', boxShadow: 2 }}>
                    <Typography color="textSecondary" variant="caption" fontWeight="bold">CARTEIRA DE CLIENTES</Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>{metrics.totalClientes}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                        <PeopleAlt color="warning" fontSize="small" />
                        <Typography variant="caption" color="text.secondary">Base de contatos ativos</Typography>
                    </Box>
                </Paper>

                <Paper sx={{ p: 2.5, borderLeft: '6px solid #f44336', bgcolor: '#fff9f9', boxShadow: 2 }}>
                    <Typography color="error" variant="caption" fontWeight="bold">ATENÇÃO: LEADS NOVOS</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h4" color="error" fontWeight="bold">{metrics.novosLeads}</Typography>
                        <AssignmentInd color="error" fontSize="large" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">Aguardando primeiro contato</Typography>
                </Paper>
            </Box>

            {/* SEÇÃO 2: DETALHES TÉCNICOS (FLEXBOX) */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3
            }}>
                {/* Funil de Vendas */}
                <Paper sx={{ p: 3, flex: 2, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Handshake color="primary" /> Estágios do Pipeline
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {['PROSPECCAO', 'VISITA', 'PROPOSTA', 'FECHADO'].map((status) => {
                            const count = metrics.negociacoesPorStatus[status] || 0;
                            const perc = (count / (metrics.totalNegociacoes || 1)) * 100;
                            return (
                                <Box key={status}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight="500">{status.replace('_', ' ')}</Typography>
                                        <Typography variant="body2" color="primary" fontWeight="bold">{count}</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={perc} sx={{ height: 10, borderRadius: 5, bgcolor: '#f0f0f0' }} />
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>

                {/* Inventário */}
                <Paper sx={{ p: 3, flex: 1, boxShadow: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HomeWork color="secondary" /> Inventário
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography variant="h2" fontWeight="bold" color="secondary">{metrics.imoveisDisponiveis}</Typography>
                            <Typography variant="subtitle2" color="text.secondary">Imóveis prontos para venda/aluguel</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Ocupação da Carteira</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(metrics.imoveisDisponiveis / (metrics.totalImoveis || 1)) * 100}
                            color="secondary"
                            sx={{ mt: 1, height: 12, borderRadius: 6 }}
                        />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                            Total de {metrics.totalImoveis} imóveis cadastrados
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};