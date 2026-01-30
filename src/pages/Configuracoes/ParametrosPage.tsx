import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    TextField, InputAdornment, Divider, Tooltip, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, MenuItem, Select, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions,
    useTheme
} from '@mui/material';
import {
    Save, Settings, Percent, InfoOutlined,
    Add, Edit, Delete, CheckCircle, Cancel
} from '@mui/icons-material';
import { configuracaoService } from '../../services/configuracaoService';
import api from '../../services/api';
// Tipos para regras de comissão
interface RegraComissao {
    _id?: string;
    id?: string;
    nome: string;
    tipoNegocio: 'VENDA' | 'ALUGUEL' | 'AMBOS';
    cargo: string[]; // ['CORRETOR', 'GERENTE', 'ADM_GERAL', 'OUTRO']
    nivel: string[]; // ['JUNIOR', 'PLENO', 'SENIOR', 'ESPECIAL']
    percentual: number;
    valorFixo?: number;
    tipoCalculo: 'PERCENTUAL' | 'FIXO' | 'MISTO';
    prioridade: number;
    ativo: boolean;
    dataInicio?: string;
    dataFim?: string;
    observacao?: string;
}

export const ParametrosPage = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para taxas administrativas
    const [taxas, setTaxas] = useState({
        TAXA_ADM_ALUGUEL: 10,
        TAXA_VENDA: 6,
    });

    // Estados para regras de comissão
    const [regrasComissao, setRegrasComissao] = useState<RegraComissao[]>([]);
    const [openRegraModal, setOpenRegraModal] = useState(false);
    const [regraEditando, setRegraEditando] = useState<RegraComissao | null>(null);
    const [novaRegra, setNovaRegra] = useState<RegraComissao>({
        nome: '',
        tipoNegocio: 'VENDA',
        cargo: ['CORRETOR'],
        nivel: ['JUNIOR'],
        percentual: 30,
        tipoCalculo: 'PERCENTUAL',
        prioridade: 1,
        ativo: true,
    });

    // Carregar configurações
    const loadParams = useCallback(async () => {
        try {
            setLoading(true);

            // Carregar taxas administrativas
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

            // Carregar regras de comissão
            await loadRegrasComissao();

            setError(null);
        } catch (err) {
            console.error("Erro ao carregar configurações:", err);
            setError("Não foi possível carregar as configurações do sistema.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Carregar regras de comissão
    const loadRegrasComissao = async () => {
        try {
            const response = await api.get('/comissao-regras');
            setRegrasComissao(response.data);
        } catch (err) {
            console.error("Erro ao carregar regras de comissão:", err);
            // Se o endpoint não existir ainda, usar dados mock
            setRegrasComissao([
                {
                    id: '1',
                    nome: 'Corretor Júnior - Venda',
                    tipoNegocio: 'VENDA',
                    cargo: ['CORRETOR'],
                    nivel: ['JUNIOR'],
                    percentual: 30,
                    tipoCalculo: 'PERCENTUAL',
                    prioridade: 1,
                    ativo: true,
                },
                {
                    id: '2',
                    nome: 'Corretor Pleno - Venda',
                    tipoNegocio: 'VENDA',
                    cargo: ['CORRETOR'],
                    nivel: ['PLENO'],
                    percentual: 35,
                    tipoCalculo: 'PERCENTUAL',
                    prioridade: 2,
                    ativo: true,
                },
                {
                    id: '3',
                    nome: 'Corretor Sênior - Venda',
                    tipoNegocio: 'VENDA',
                    cargo: ['CORRETOR'],
                    nivel: ['SENIOR'],
                    percentual: 40,
                    tipoCalculo: 'PERCENTUAL',
                    prioridade: 3,
                    ativo: true,
                },
                {
                    id: '4',
                    nome: 'Aluguel - Primeiro Mês',
                    tipoNegocio: 'ALUGUEL',
                    cargo: ['CORRETOR'],
                    nivel: [],
                    percentual: 100,
                    tipoCalculo: 'PERCENTUAL',
                    prioridade: 1,
                    ativo: true,
                },
                {
                    id: '5',
                    nome: 'Gerente - Comissão Equipe',
                    tipoNegocio: 'AMBOS',
                    cargo: ['GERENTE'],
                    nivel: [],
                    percentual: 10,
                    tipoCalculo: 'PERCENTUAL',
                    prioridade: 4,
                    ativo: true,
                },
            ]);
        }
    };

    useEffect(() => {
        loadParams();
    }, [loadParams]);

    // Salvar taxa administrativa
    const handleSaveTaxa = async (chave: string, valor: number) => {
        setSaving(chave);
        try {
            await configuracaoService.upsertConfig({
                chave,
                valor: valor,
                tipo: 'PERCENTUAL'
            });
            setSuccess(`Taxa ${chave === 'TAXA_ADM_ALUGUEL' ? 'de Administração' : 'de Venda'} atualizada!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            alert("Erro ao salvar configuração.");
        } finally {
            setSaving(null);
        }
    };

    // Modal de Regra de Comissão
    const handleOpenRegraModal = (regra?: RegraComissao) => {
        if (regra) {
            setRegraEditando(regra);
            setNovaRegra(regra);
        } else {
            setRegraEditando(null);
            setNovaRegra({
                nome: '',
                tipoNegocio: 'VENDA',
                cargo: ['CORRETOR'],
                nivel: ['JUNIOR'],
                percentual: 30,
                tipoCalculo: 'PERCENTUAL',
                prioridade: 1,
                ativo: true,
            });
        }
        setOpenRegraModal(true);
    };

    const handleCloseRegraModal = () => {
        setOpenRegraModal(false);
        setRegraEditando(null);
    };

    // Salvar regra de comissão
    const handleSaveRegra = async () => {
        try {
            setSaving('REGRA');

            if (regraEditando?._id || regraEditando?.id) {
                // Atualizar regra existente
                const id = regraEditando._id || regraEditando.id;
                await api.put(`/comissao-regras/${id}`, novaRegra);
            } else {
                // Criar nova regra
                await api.post('/comissao-regras', novaRegra);
            }

            await loadRegrasComissao();
            setSuccess(regraEditando ? 'Regra atualizada!' : 'Regra criada!');
            setTimeout(() => setSuccess(null), 3000);
            handleCloseRegraModal();
        } catch (err: any) {
            console.error('Erro ao salvar regra:', err);
            alert(err.response?.data?.message || 'Erro ao salvar regra');
        } finally {
            setSaving(null);
        }
    };

    // Excluir regra
    const handleDeleteRegra = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta regra?')) return;

        try {
            await api.delete(`/comissao-regras/${id}`);
            await loadRegrasComissao();
            setSuccess('Regra excluída!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir regra');
        }
    };

    // Alternar status da regra
    const handleToggleRegraStatus = async (regra: RegraComissao) => {
        try {
            const id = regra._id || regra.id;
            await api.put(`/comissao-regras/${id}/status`, { ativo: !regra.ativo });
            await loadRegrasComissao();
            setSuccess(`Regra ${!regra.ativo ? 'ativada' : 'desativada'}!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao alterar status');
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
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
                        Defina os parâmetros globais para cálculos financeiros, taxas e comissões.
                    </Typography>
                </Box>
            </Box>

            {/* Mensagens de sucesso/erro */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            {/* Container Principal */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                {/* Coluna Esquerda: Taxas Administrativas */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'primary.main' }}>
                            <Percent fontSize="small" />
                            <Typography variant="h6" fontWeight="bold">Taxas Administrativas</Typography>
                        </Box>

                        {/* Taxa de Administração - Aluguel */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Taxa de Administração (Aluguel)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    startIcon={saving === 'TAXA_ADM_ALUGUEL' ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                    onClick={() => handleSaveTaxa('TAXA_ADM_ALUGUEL', taxas.TAXA_ADM_ALUGUEL)}
                                    disabled={!!saving}
                                    size="small"
                                >
                                    Salvar
                                </Button>
                            </Box>
                        </Box>

                        {/* Taxa de Venda */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Comissão Padrão de Venda
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Taxa padrão aplicada em novos fechamentos de contratos de compra e venda.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    label="Valor da Taxa"
                                    type="number"
                                    value={taxas.TAXA_VENDA}
                                    onChange={(e) => setTaxas({ ...taxas, TAXA_VENDA: Number(e.target.value) })}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    startIcon={saving === 'TAXA_VENDA' ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                    onClick={() => handleSaveTaxa('TAXA_VENDA', taxas.TAXA_VENDA)}
                                    disabled={!!saving}
                                    size="small"
                                >
                                    Salvar
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Coluna Direita: Regras de Comissão */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                                <Percent fontSize="small" />
                                <Typography variant="h6" fontWeight="bold">Regras de Comissão</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenRegraModal()}
                                size="small"
                            >
                                Nova Regra
                            </Button>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Configure as regras de cálculo de comissões para corretores, gerentes e administradores.
                        </Typography>

                        {/* Lista de Regras */}
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nome</TableCell>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell align="right">%</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                        <TableCell align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {regrasComissao.map((regra) => (
                                        <TableRow key={regra._id || regra.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {regra.nome}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {regra.cargo.join(', ')} • {regra.nivel.length > 0 ? regra.nivel.join(', ') : 'Todos'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={regra.tipoNegocio}
                                                    size="small"
                                                    color={
                                                        regra.tipoNegocio === 'VENDA' ? 'success' :
                                                            regra.tipoNegocio === 'ALUGUEL' ? 'warning' : 'default'
                                                    }
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {regra.percentual}%
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title={regra.ativo ? "Regra ATIVADA - clique para Desativar regra" : "Regra DESATIVADA - clique para Ativar regra"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleRegraStatus(regra)}
                                                        color={regra.ativo ? 'success' : 'error'}
                                                    >
                                                        {regra.ativo ? (
                                                            <CheckCircle fontSize="small" />
                                                        ) : (
                                                            <Cancel fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenRegraModal(regra)}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Excluir">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteRegra(regra._id || regra.id!)}
                                                            color="error"
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            </Box>

            {/* Nota Informativa */}
            <Box sx={{
                mt: 4, p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'info.dark' : 'info.light',
                borderRadius: 1,
                borderLeft: `5px solid ${theme.palette.info.main}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2
            }}>
                <InfoOutlined sx={{ color: 'info.main' }} />
                <Box>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: 'info.main' }}>
                        INFORMAÇÃO:
                    </Typography>
                    <Typography variant="body2" sx={{
                        mt: 0.5,
                        color: theme.palette.mode === 'dark' ? 'text.primary' : 'inherit'
                    }}>
                        As alterações feitas aqui serão aplicadas apenas em <b>novos lançamentos</b>.
                        Contratos e parcelas já gerados não serão afetados retroativamente para manter a integridade do histórico financeiro.
                    </Typography>
                </Box>
            </Box>

            {/* Modal para Criar/Editar Regra de Comissão */}
            <Dialog
                open={openRegraModal}
                onClose={handleCloseRegraModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {regraEditando ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Nome da Regra"
                            value={novaRegra.nome}
                            onChange={(e) => setNovaRegra({ ...novaRegra, nome: e.target.value })}
                            fullWidth
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Tipo de Negócio</InputLabel>
                            <Select
                                value={novaRegra.tipoNegocio}
                                label="Tipo de Negócio"
                                onChange={(e) => setNovaRegra({ ...novaRegra, tipoNegocio: e.target.value as any })}
                            >
                                <MenuItem value="VENDA">Venda</MenuItem>
                                <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                                <MenuItem value="AMBOS">Ambos</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Cargo</InputLabel>
                            <Select
                                multiple
                                value={novaRegra.cargo}
                                label="Cargo"
                                onChange={(e) => setNovaRegra({ ...novaRegra, cargo: e.target.value as string[] })}
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {['CORRETOR', 'GERENTE', 'ADM_GERAL', 'OUTRO'].map((cargo) => (
                                    <MenuItem key={cargo} value={cargo}>
                                        {cargo}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Nível</InputLabel>
                            <Select
                                multiple
                                value={novaRegra.nivel}
                                label="Nível"
                                onChange={(e) => setNovaRegra({ ...novaRegra, nivel: e.target.value as string[] })}
                                renderValue={(selected) => selected.length > 0 ? selected.join(', ') : 'Todos'}
                            >
                                {['JUNIOR', 'PLENO', 'SENIOR', 'ESPECIAL'].map((nivel) => (
                                    <MenuItem key={nivel} value={nivel}>
                                        {nivel}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Percentual (%)"
                                type="number"
                                value={novaRegra.percentual}
                                onChange={(e) => setNovaRegra({ ...novaRegra, percentual: Number(e.target.value) })}
                                fullWidth
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField
                                label="Prioridade"
                                type="number"
                                value={novaRegra.prioridade}
                                onChange={(e) => setNovaRegra({ ...novaRegra, prioridade: Number(e.target.value) })}
                                sx={{ width: 120 }}
                                helperText="Maior = mais prioritário"
                            />
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Tipo de Cálculo</InputLabel>
                            <Select
                                value={novaRegra.tipoCalculo}
                                label="Tipo de Cálculo"
                                onChange={(e) => setNovaRegra({ ...novaRegra, tipoCalculo: e.target.value as any })}
                            >
                                <MenuItem value="PERCENTUAL">Percentual</MenuItem>
                                <MenuItem value="FIXO">Valor Fixo</MenuItem>
                                <MenuItem value="MISTO">Misto (Percentual + Fixo)</MenuItem>
                            </Select>
                        </FormControl>

                        {novaRegra.tipoCalculo === 'FIXO' || novaRegra.tipoCalculo === 'MISTO' ? (
                            <TextField
                                label="Valor Fixo (R$)"
                                type="number"
                                value={novaRegra.valorFixo || 0}
                                onChange={(e) => setNovaRegra({ ...novaRegra, valorFixo: Number(e.target.value) })}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        ) : null}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRegraModal}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveRegra}
                        disabled={!novaRegra.nome || saving === 'REGRA'}
                        startIcon={saving === 'REGRA' ? <CircularProgress size={20} /> : <Save />}
                    >
                        {saving === 'REGRA' ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};