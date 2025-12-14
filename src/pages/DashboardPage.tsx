// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import { House, AttachMoney, CheckCircle, Cancel } from '@mui/icons-material';
import { Imovel } from '../types/imovel'; // Importa o tipo Imovel
import { useAuth } from '../contexts/AuthContext'; // ⭐️ Verifique o caminho real

// --- Componente auxiliar para exibir um Cartão de Métrica Simples ---
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactElement;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
        <Box sx={{ color: color, fontSize: 40, display: 'flex' }}>{icon}</Box>
        <Box>
            <Typography variant="subtitle2" color="textSecondary">{title}</Typography>
            <Typography variant="h5" fontWeight="bold">{value}</Typography>
        </Box>
    </Paper>
);

// --- Tipos e Constantes ---
interface DashboardMetrics {
    totalImoveis: number;
    valorTotalImoveis: number;
    disponiveis: number;
    indisponiveis: number;
    tipoCounts: Record<string, number>;
}

const API_URL = 'http://localhost:5000/imoveis';

// Função para formatar o valor como moeda
const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para obter o label amigável do tipo
const getTipoDisplay = (tipo: string): string => {
    const tipoMap: Record<string, string> = {
        'CASA': 'Casas',
        'APARTAMENTO': 'Apartamentos',
        'TERRENO': 'Terrenos',
        'COMERCIAL': 'Comerciais'
    };
    return tipoMap[tipo] || tipo;
};

// --- Componente Principal ---
// ⚠️ Exportação corrigida: Apenas um 'export const'
export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const token = user?.token || null;
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const aggregateData = (imoveis: Imovel[]): DashboardMetrics => {
        const initialMetrics: DashboardMetrics = {
            totalImoveis: 0,
            valorTotalImoveis: 0,
            disponiveis: 0,
            indisponiveis: 0,
            tipoCounts: {}
        };

        return imoveis.reduce((acc, imovel) => {
            acc.totalImoveis += 1;
            acc.valorTotalImoveis += imovel.valor || 0;

            if (imovel.disponivel) {
                acc.disponiveis += 1;
            } else {
                acc.indisponiveis += 1;
            }

            const tipo = imovel.tipo || 'OUTRO';
            acc.tipoCounts[tipo] = (acc.tipoCounts[tipo] || 0) + 1;

            return acc;
        }, initialMetrics);
    };

    const fetchImoveisData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });

            const imoveis = response.data as Imovel[];
            const aggregatedMetrics = aggregateData(imoveis);
            setMetrics(aggregatedMetrics);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Falha ao carregar dados do dashboard.';
            setError(errorMessage);
            console.error("Erro ao buscar dados do dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchImoveisData();
    }, [fetchImoveisData]);


    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!metrics) return null;

    // --- Renderização do Dashboard (Layout com Box e Flexbox para simular o Grid) ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard de Imóveis
            </Typography>

            {/* Container para as Métricas Principais (Simulando Grid de 4 colunas em telas grandes) */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 3,
                    // Responsividade: 100% (xs), 50% (sm/md), 25% (lg)
                    '& > div': {
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' },
                    }
                }}
            >
                {/* 1. Métrica Principal: Total de Imóveis */}
                <Box>
                    <MetricCard
                        title="Total de Imóveis Cadastrados"
                        value={metrics.totalImoveis}
                        icon={<House />}
                        color="#42a5f5"
                    />
                </Box>

                {/* 2. Métrica Principal: Valor Total Estimado */}
                <Box>
                    <MetricCard
                        title="Valor Total do Portfólio"
                        value={formatCurrency(metrics.valorTotalImoveis)}
                        icon={<AttachMoney />}
                        color="#66bb6a"
                    />
                </Box>

                {/* 3. Métrica de Status: Disponíveis */}
                <Box>
                    <MetricCard
                        title="Imóveis Disponíveis"
                        value={metrics.disponiveis}
                        icon={<CheckCircle />}
                        color="#26a69a"
                    />
                </Box>

                {/* 4. Métrica de Status: Indisponíveis */}
                <Box>
                    <MetricCard
                        title="Imóveis Indisponíveis"
                        value={metrics.indisponiveis}
                        icon={<Cancel />}
                        color="#ef5350"
                    />
                </Box>
            </Box>

            {/* Container para as Visualizações (Simulando Grid de 2 colunas em telas grandes) */}
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    '& > div': {
                        flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' },
                    }
                }}
            >
                {/* 5. Visualização de Distribuição por Tipo */}
                <Box>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Distribuição por Tipo de Imóvel</Typography>

                        {/* Lista de Tipos com LinearProgress (Simula um gráfico de barras horizontais) */}
                        {Object.entries(metrics.tipoCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([tipo, count]) => {
                                const percentage = (count / metrics.totalImoveis) * 100;
                                return (
                                    <Box key={tipo} sx={{ mb: 2 }}>
                                        <Typography variant="body1" fontWeight="medium">
                                            {getTipoDisplay(tipo)} ({count})
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={percentage}
                                            sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0' }}
                                        />
                                        <Typography variant="caption" color="textSecondary">
                                            {percentage.toFixed(1)}% do total
                                        </Typography>
                                    </Box>
                                );
                            })}

                    </Paper>
                </Box>

                {/* 6. Visualização de Status de Disponibilidade */}
                <Box>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Status de Disponibilidade</Typography>

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body1" fontWeight="medium" color="success.main">
                                Disponíveis ({metrics.disponiveis})
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(metrics.disponiveis / metrics.totalImoveis) * 100}
                                color="success"
                                sx={{ height: 20, borderRadius: 5, mb: 2 }}
                            />
                            <Typography variant="body1" fontWeight="medium" color="error.main">
                                Indisponíveis ({metrics.indisponiveis})
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(metrics.indisponiveis / metrics.totalImoveis) * 100}
                                color="error"
                                sx={{ height: 20, borderRadius: 5, mb: 2 }}
                            />
                        </Box>

                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};