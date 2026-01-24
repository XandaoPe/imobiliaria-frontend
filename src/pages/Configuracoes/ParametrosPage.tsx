// src/pages/Configuracoes/ParametrosPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    TextField, InputAdornment, Divider, Tooltip
} from '@mui/material';
import { Save, Settings, Percent, InfoOutlined } from '@mui/icons-material';
import { configuracaoService } from '../../services/configuracaoService';

export const ParametrosPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Estado local para os inputs
    const [taxas, setTaxas] = useState({
        TAXA_ADM_ALUGUEL: 10,
        TAXA_VENDA: 6,
    });

    const loadParams = useCallback(async () => {
        try {
            setLoading(true);
            const data = await configuracaoService.getConfigs();

            const converterParaNumero = (valor: unknown): number => {
                if (typeof valor === 'number') return valor;
                if (typeof valor === 'string') return parseFloat(valor.replace(',', '.')) || 0;
                return parseFloat(String(valor).replace(',', '.')) || 0;
            };

            const novoEstado = { ...taxas };
            data.forEach(item => {
                if (item.chave in novoEstado) {
                    const valorConvertido = converterParaNumero(item.valor);
                    // @ts-ignore
                    novoEstado[item.chave] = valorConvertido;
                }
            });
            setTaxas(novoEstado);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar configurações:", err);
            setError("Não foi possível carregar as configurações do sistema.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadParams(); }, [loadParams]);

    const handleSave = async (chave: string, valor: number) => {
        setSaving(chave);
        try {
            await configuracaoService.upsertConfig({
                chave,
                valor: valor, // Já é número
                tipo: 'PERCENTUAL'
            });
        } catch (err) {
            alert("Erro ao salvar configuração.");
        } finally {
            setSaving(null);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header da Página */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Settings color="primary" fontSize="large" /> Configurações do Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Defina os parâmetros globais para cálculos financeiros e taxas administrativas.
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Container de Cards (Boxes) */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>

                {/* Card: Taxa de Administração */}
                <Paper elevation={2} sx={{ p: 3, flex: '1 1 400px', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                        <Percent fontSize="small" />
                        <Typography variant="subtitle1" fontWeight="bold">Taxa de Administração (Aluguel)</Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Percentual cobrado mensalmente do proprietário sobre o valor do aluguel.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            label="Valor da Taxa"
                            type="number"
                            value={taxas.TAXA_ADM_ALUGUEL}
                            onChange={(e) => setTaxas({ ...taxas, TAXA_ADM_ALUGUEL: Number(e.target.value) })}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                        />
                        <Button
                            variant="contained"
                            startIcon={saving === 'TAXA_ADM_ALUGUEL' ? <CircularProgress size={20} color="inherit" /> : <Save />}
                            onClick={() => handleSave('TAXA_ADM_ALUGUEL', taxas.TAXA_ADM_ALUGUEL)}
                            disabled={!!saving}
                            sx={{ height: 56, px: 4 }}
                        >
                            Salvar
                        </Button>
                    </Box>
                </Paper>

                {/* Card: Comissão de Venda */}
                <Paper elevation={2} sx={{ p: 3, flex: '1 1 400px', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                        <Percent fontSize="small" />
                        <Typography variant="subtitle1" fontWeight="bold">Comissão Padrão de Venda</Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Taxa padrão aplicada em novos fechamentos de contratos de compra e venda.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            label="Valor da Comissão"
                            type="number"
                            value={taxas.TAXA_VENDA}
                            onChange={(e) => setTaxas({ ...taxas, TAXA_VENDA: Number(e.target.value) })}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                        />
                        <Button
                            variant="contained"
                            startIcon={saving === 'TAXA_VENDA' ? <CircularProgress size={20} color="inherit" /> : <Save />}
                            onClick={() => handleSave('TAXA_VENDA', taxas.TAXA_VENDA)}
                            disabled={!!saving}
                            sx={{ height: 56, px: 4 }}
                        >
                            Salvar
                        </Button>
                    </Box>
                </Paper>

            </Box>

            {/* Nota Informativa (Estilo Observação da sua Ficha) */}
            <Box sx={{
                mt: 4, p: 2, bgcolor: '#e3f2fd', borderRadius: 1,
                borderLeft: '5px solid #2196f3', display: 'flex', alignItems: 'flex-start', gap: 2
            }}>
                <InfoOutlined color="info" />
                <Box>
                    <Typography variant="caption" fontWeight="bold" color="info.main">INFORMAÇÃO:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        As alterações feitas aqui serão aplicadas apenas em <b>novos lançamentos</b>.
                        Contratos e parcelas já gerados não serão afetados retroativamente para manter a integridade do histórico financeiro.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};