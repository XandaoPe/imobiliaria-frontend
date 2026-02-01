import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, Alert,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { financeiroService } from '../../services/financeiroService';
import { CurrencyFormatInput } from '../CurrencyFormatInput';

interface FinanceiroEdicaoModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transacaoId: string | null;
}

interface TransacaoCompleta {
    _id: string;
    dataVencimento: string;
    tipo: 'RECEITA' | 'DESPESA';
    descricao: string;
    valor: number;
    status: string;
    categoria: string;
    parcelaNumero?: number;
    negociacaoCodigo?: string;
    dataPagamento?: string;
    valorPago?: number;
    observacoes?: string;
    cliente?: {
        _id: string;
        nome: string;
    };
    imovel?: {
        _id: string;
        codigo: string;
        titulo?: string;
    };
    comissoesDistribuidas?: boolean;
    negociacao?: string;
}

// Função de formatação de moeda
const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const FinanceiroEdicaoModal: React.FC<FinanceiroEdicaoModalProps> = ({
    open,
    onClose,
    onSuccess,
    transacaoId
}) => {
    const [loading, setLoading] = useState(false);
    const [loadingDados, setLoadingDados] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<TransacaoCompleta>>({
        descricao: '',
        valor: 0,
        dataVencimento: '',
        tipo: 'RECEITA',
        categoria: 'OUTROS',
        status: 'PENDENTE',
        observacoes: ''
        // NOTA: Não inclua dataPagamento aqui se status inicial for PENDENTE
    });

    const [temNegociacao, setTemNegociacao] = useState(false);
    const [valorFormatado, setValorFormatado] = useState<string>('R$ 0,00');
    const [valorPagoFormatado, setValorPagoFormatado] = useState<string>('R$ 0,00');

    // Carregar dados quando o modal abrir
    useEffect(() => {
        if (open && transacaoId) {
            carregarDadosTransacao();
        }
    }, [open, transacaoId]);

    const carregarDadosTransacao = async () => {
        if (!transacaoId) return;

        try {
            setLoadingDados(true);
            setError(null);

            const response = await financeiroService.buscarPorId(transacaoId);
            const transacao = response.data;

            setFormData({
                descricao: transacao.descricao,
                valor: transacao.valor,
                dataVencimento: transacao.dataVencimento,
                tipo: transacao.tipo,
                categoria: transacao.categoria,
                status: transacao.status,
                dataPagamento: transacao.dataPagamento || '',
                valorPago: transacao.valorPago || transacao.valor,
                observacoes: transacao.observacoes || '',
                parcelaNumero: transacao.parcelaNumero
            });

            // Atualizar valores formatados
            setValorFormatado(formatCurrency(transacao.valor));
            setValorPagoFormatado(formatCurrency(transacao.valorPago || transacao.valor));

            // Verificar se tem negociação vinculada
            setTemNegociacao(!!transacao.negociacao || !!transacao.negociacaoCodigo);

        } catch (err) {
            console.error('Erro ao carregar dados da transação:', err);
            setError('Não foi possível carregar os dados da transação.');
        } finally {
            setLoadingDados(false);
        }
    };

    // Atualizar valor formatado quando o valor mudar
    useEffect(() => {
        if (formData.valor !== undefined) {
            setValorFormatado(formatCurrency(formData.valor));
        }
    }, [formData.valor]);

    // Atualizar valorPago formatado quando o valorPago mudar
    useEffect(() => {
        if (formData.valorPago !== undefined) {
            setValorPagoFormatado(formatCurrency(formData.valorPago));
        }
    }, [formData.valorPago]);

    const handleInputChange = (field: keyof TransacaoCompleta, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleValorChange = (value: string) => {
        // Converter string formatada para número
        const valorNumerico = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));

        if (!isNaN(valorNumerico)) {
            handleInputChange('valor', valorNumerico);
            setValorFormatado(formatCurrency(valorNumerico));
        }
    };

    const handleValorPagoChange = (value: string) => {
        // Converter string formatada para número
        const valorNumerico = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));

        if (!isNaN(valorNumerico)) {
            handleInputChange('valorPago', valorNumerico);
            setValorPagoFormatado(formatCurrency(valorNumerico));
        }
    };

    const handleStatusChange = (status: string) => {
        const updatedData = { ...formData, status };

        // Se mudar para PAGO e não tiver dataPagamento, adicionar data atual
        if (status === 'PAGO' && !updatedData.dataPagamento) {
            updatedData.dataPagamento = new Date().toISOString().split('T')[0];
            // Se não tiver valorPago, usar o valor original
            if (!updatedData.valorPago && updatedData.valor) {
                updatedData.valorPago = updatedData.valor;
            }
        }

        // Se mudar para PENDENTE, remover dataPagamento e valorPago (não apenas undefined, mas deletar)
        if (status === 'PENDENTE') {
            delete updatedData.dataPagamento;
            delete updatedData.valorPago;
        }

        setFormData(updatedData);
    };

    const handleSubmit = async () => {
        if (!transacaoId) return;

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Preparar dados para envio
            const dadosEnvio: any = { ...formData };

            // Remover campos que não devem ser enviados ou são read-only
            delete dadosEnvio._id;
            delete dadosEnvio.negociacaoCodigo;
            delete dadosEnvio.cliente;
            delete dadosEnvio.imovel;
            delete dadosEnvio.comissoesDistribuidas;

            // Se status for PENDENTE, remover dataPagamento e valorPago completamente
            if (dadosEnvio.status === 'PENDENTE') {
                delete dadosEnvio.dataPagamento;
                delete dadosEnvio.valorPago;
            }
            // Se status for PAGO e dataPagamento for vazio, usar data atual
            else if (dadosEnvio.status === 'PAGO' && (!dadosEnvio.dataPagamento || dadosEnvio.dataPagamento === '')) {
                dadosEnvio.dataPagamento = new Date().toISOString().split('T')[0];
            }
            // Se status for PAGO mas tem dataPagamento vazia, também deletar
            else if (dadosEnvio.status !== 'PAGO' && (!dadosEnvio.dataPagamento || dadosEnvio.dataPagamento === '')) {
                delete dadosEnvio.dataPagamento;
            }

            // Se tem negociação vinculada, remover campos bloqueados
            if (temNegociacao) {
                delete dadosEnvio.tipo;
                delete dadosEnvio.categoria;
                delete dadosEnvio.cliente;
                delete dadosEnvio.imovel;
            }

            await financeiroService.atualizar(transacaoId, dadosEnvio);

            setSuccess('Lançamento atualizado com sucesso!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error('Erro ao atualizar transação:', err);
            setError(err.response?.data?.message || 'Erro ao atualizar o lançamento.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelarLancamento = async () => {
        if (!transacaoId || !window.confirm('Tem certeza que deseja cancelar este lançamento? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await financeiroService.cancelar(transacaoId);

            if (response.data.status === 'CANCELADO') {
                setSuccess('Lançamento cancelado com sucesso!');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                setError('Não foi possível cancelar o lançamento.');
            }
        } catch (err: any) {
            console.error('Erro ao cancelar transação:', err);
            setError(err.response?.data?.message || 'Erro ao cancelar o lançamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
            }}>
                <Typography variant="h6" fontWeight="bold">
                    Editar Lançamento Financeiro
                    {temNegociacao && (
                        <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                            (Vinculado a uma negociação)
                        </Typography>
                    )}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                {loadingDados ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        {/* Linha 1: Descrição e Valor */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Descrição"
                                    value={formData.descricao || ''}
                                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                                    fullWidth
                                    required
                                    disabled={loading}
                                />

                                {/* Campo de Valor com formatação de moeda */}
                                <Box sx={{ width: 200 }}>
                                    <CurrencyFormatInput
                                        name="valor"
                                        label="Valor"
                                        value={formData.valor || 0}
                                        onChange={(valorNumerico) => handleInputChange('valor', valorNumerico)}
                                        required
                                        // disabled={loading || (temNegociacao && formData.categoria === 'COMISSAO')}
                                    />
                                </Box>
                            </Box>

                        {/* Linha 2: Data Vencimento e Status */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Data de Vencimento"
                                type="date"
                                value={formData.dataVencimento || ''}
                                onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 200 }}
                                required
                                disabled={loading}
                            />

                            <FormControl sx={{ width: 200 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status || 'PENDENTE'}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    label="Status"
                                    disabled={loading}
                                >
                                    <MenuItem value="PENDENTE">Pendente</MenuItem>
                                    <MenuItem value="PAGO">Pago/Recebido</MenuItem>
                                    <MenuItem value="CANCELADO">Cancelado</MenuItem>
                                    <MenuItem value="ATRASADO">Atrasado</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Linha 3: Tipo e Categoria */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl sx={{ flex: 1 }}>
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={formData.tipo || 'RECEITA'}
                                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                                    label="Tipo"
                                    disabled={loading || temNegociacao}
                                >
                                    <MenuItem value="RECEITA">Receita</MenuItem>
                                    <MenuItem value="DESPESA">Despesa</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl sx={{ flex: 1 }}>
                                <InputLabel>Categoria</InputLabel>
                                <Select
                                    value={formData.categoria || 'OUTROS'}
                                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                                    label="Categoria"
                                    disabled={loading || temNegociacao}
                                >
                                    <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                                    <MenuItem value="VENDA">Venda</MenuItem>
                                    <MenuItem value="COMISSAO">Comissão</MenuItem>
                                    <MenuItem value="REPASSE">Repasse</MenuItem>
                                    <MenuItem value="MANUTENCAO">Manutenção</MenuItem>
                                    <MenuItem value="OPERACIONAL">Operacional</MenuItem>
                                    <MenuItem value="OUTROS">Outros</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Se status for PAGO, mostrar dataPagamento e valorPago */}
                            {formData.status === 'PAGO' && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Data de Pagamento/Recebimento"
                                        type="date"
                                        value={formData.dataPagamento || ''}
                                        onChange={(e) => handleInputChange('dataPagamento', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ width: 200 }}
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="Valor Pago/Recebido"
                                        type="number"
                                        value={formData.valorPago || formData.valor || 0}
                                        onChange={(e) => handleInputChange('valorPago', parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                            inputProps: {
                                                min: 0,
                                                step: 0.01,
                                                style: { textAlign: 'right' }
                                            }
                                        }}
                                        sx={{ width: 200 }}
                                        disabled={loading}
                                    />
                                </Box>
                            )}

                        {/* Observações */}
                        <TextField
                            label="Observações"
                            value={formData.observacoes || ''}
                            onChange={(e) => handleInputChange('observacoes', e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            disabled={loading}
                        />

                        {/* Informações sobre restrições */}
                        {temNegociacao && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Este lançamento está vinculado a uma negociação.
                                Alguns campos não podem ser alterados para manter a integridade financeira.
                            </Alert>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Box>
                        {formData.status !== 'CANCELADO' && (
                            <Button
                                onClick={handleCancelarLancamento}
                                color="error"
                                variant="outlined"
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancelar Lançamento
                            </Button>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            sx={{ textTransform: 'none' }}
                        >
                            Fechar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={loading || loadingDados}
                            sx={{ textTransform: 'none' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                        </Button>
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
};