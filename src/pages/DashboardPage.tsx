// src/pages/DashboardPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Alert, CircularProgress, LinearProgress, Divider
} from '@mui/material';
import {
    House, AttachMoney, CheckCircle, Group,
    Person, AssignmentInd
} from '@mui/icons-material';

import api from '../services/api'; // Use sua instância configurada do axios
import { Imovel } from '../types/imovel';
import { Usuario } from '../types/usuario';
import { useAuth } from '../contexts/AuthContext';

// ⭐️ 1. DEFINIÇÃO DA INTERFACE (Localmente na página)
// Ela define o "formato" do objeto que vai guardar os cálculos do dashboard
interface DashboardMetrics {
    totalImoveis: number;
    valorTotalImoveis: number;
    imoveisDisponiveis: number;
    totalUsuarios: number;
    usuariosAtivos: number;
    totalClientes: number; // Métrica nova vinda do seu novo backend
    tipoCounts: Record<string, number>;
    perfilCounts: Record<string, number>;
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
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) return; // Não dispara se o token sumiu

        setLoading(true);
        try {
            const [resImoveis, resUsuarios, resClientes, resLeadsStats] = await Promise.all([
                api.get('/imoveis'),
                api.get('/usuarios'),
                api.get('/clientes'),
                api.get('/leads/stats') // Nova rota de estatísticas
            ]);

            const imoveis: Imovel[] = resImoveis.data;
            const usuarios: Usuario[] = resUsuarios.data;
            const clientes = resClientes.data;
            const statsLeads = resLeadsStats.data;

            const aggregated: DashboardMetrics = {
                totalImoveis: imoveis.length,
                valorTotalImoveis: imoveis.reduce((acc, cur) => acc + (cur.valor || 0), 0),
                imoveisDisponiveis: imoveis.filter(i => i.disponivel).length,
                totalUsuarios: usuarios.length,
                usuariosAtivos: usuarios.filter(u => u.ativo).length,
                totalClientes: clientes.length,
                // Dados vindos do novo endpoint
                totalLeads: statsLeads.total,
                novosLeads: statsLeads.novos,
                leadsEmAtendimento: statsLeads.emAtendimento,
                tipoCounts: imoveis.reduce((acc: any, cur) => {
                    acc[cur.tipo] = (acc[cur.tipo] || 0) + 1;
                    return acc;
                }, {}),
                perfilCounts: usuarios.reduce((acc: any, cur) => {
                    acc[cur.perfil] = (acc[cur.perfil] || 0) + 1;
                    return acc;
                }, {})
            };

            setMetrics(aggregated);
        } catch (err: any) {
            setError('Erro ao carregar os dados do dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // ⭐️ SÓ dispara a busca se o contexto confirmar que o usuário e o token estão prontos
        if (isAuthenticated && user) {
            fetchAllData();
        }
    }, [fetchAllData, isAuthenticated, user]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!metrics) return null;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Dashboard Executivo</Typography>

            {/* GRID DE CARTÕES */}
            <Box sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr 1fr' },
                mb: 4
            }}>
                <Paper sx={{ p: 2, borderLeft: '6px solid #1976d2' }}>
                    <Typography color="textSecondary" variant="caption">IMÓVEIS</Typography>
                    <Typography variant="h5">{metrics.totalImoveis}</Typography>
                </Paper>

                <Paper sx={{ p: 2, borderLeft: '6px solid #2e7d32' }}>
                    <Typography color="textSecondary" variant="caption">VALOR EM CARTEIRA</Typography>
                    <Typography variant="h5">
                        {metrics.valorTotalImoveis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                </Paper>

                <Paper sx={{ p: 2, borderLeft: '6px solid #ed6c02' }}>
                    <Typography color="textSecondary" variant="caption">USUÁRIOS ATIVOS</Typography>
                    <Typography variant="h5">{metrics.usuariosAtivos}</Typography>
                </Paper>

                <Paper sx={{ p: 2, borderLeft: '6px solid #9c27b0' }}>
                    <Typography color="textSecondary" variant="caption">CLIENTES CADASTRADOS</Typography>
                    <Typography variant="h5">{metrics.totalClientes}</Typography>
                </Paper>
                <Paper sx={{ p: 2, borderLeft: '6px solid #f44336', bgcolor: '#fff5f5' }}>
                    <Typography color="error" variant="caption" sx={{ fontWeight: 'bold' }}>
                        LEADS NOVOS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="h5" color="error" fontWeight="bold">
                            {metrics.novosLeads}
                        </Typography>
                        <AssignmentInd color="error" />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                        De um total de {metrics.totalLeads}
                    </Typography>
                </Paper>
            </Box>

            {/* SEÇÃO DE DETALHES */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 3, flex: 1, minWidth: '300px' }}>
                    <Typography variant="h6" gutterBottom>Distribuição de Equipe</Typography>
                    {Object.entries(metrics.perfilCounts).map(([perfil, qtd]) => (
                        <Box key={perfil} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>{perfil.replace('_', ' ')}</Typography>
                            <Typography fontWeight="bold">{qtd}</Typography>
                        </Box>
                    ))}
                </Paper>

                <Paper sx={{ p: 3, flex: 1, minWidth: '300px' }}>
                    <Typography variant="h6" gutterBottom>Performance de Leads</Typography>
                    <Typography variant="body2">
                        Novos: {metrics.novosLeads} / Atendimento: {metrics.leadsEmAtendimento} / Concluídos: {metrics.totalLeads - metrics.novosLeads - metrics.leadsEmAtendimento} / Total: {metrics.totalLeads}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        // Calcula qual % dos leads já saíram do status "NOVO"
                        value={metrics.totalLeads > 0 ? ((metrics.totalLeads - metrics.novosLeads) / metrics.totalLeads) * 100 : 0}
                        sx={{ mt: 1, height: 10, borderRadius: 5, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32' } }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Progresso de Atendimento (Leads tratados vs Total)
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3, flex: 1, minWidth: '300px' }}>
                    <Typography variant="h6" gutterBottom>Status de Inventário</Typography>
                    <Typography variant="body2">Imóveis Disponíveis: {metrics.imoveisDisponiveis}</Typography>
                    <LinearProgress
                        variant="determinate"
                        value={(metrics.imoveisDisponiveis / metrics.totalImoveis) * 100}
                        sx={{ mt: 1, height: 10, borderRadius: 5 }}
                    />
                </Paper>
            </Box>
        </Box>
    );
};