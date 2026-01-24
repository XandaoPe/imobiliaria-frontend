import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Divider,
    CircularProgress,
    MenuItem,
    useTheme
} from '@mui/material';
import { CurrencyFormatInput } from './CurrencyFormatInput';
import { configuracaoService } from '../services/configuracaoService';

interface Props {
    open: boolean;
    valorSugerido: number;
    tipoNegocio: "VENDA" | "ALUGUEL" | "LOCACAO";
    onClose: () => void;
    onConfirm: (dados: any) => void;
}

export const NegociacaoFechamentoModal: React.FC<Props> = ({
    open,
    valorSugerido,
    tipoNegocio: tipoInicial,
    onClose,
    onConfirm
}) => {
    const theme = useTheme();
    const [valorTotal, setValorTotal] = useState<number | null>(valorSugerido);
    const [entrada, setEntrada] = useState<number | null>(0);
    const [parcelas, setParcelas] = useState<number>(1);
    const [valorParcela, setValorParcela] = useState<number | null>(0);
    const [diaVencimento, setDiaVencimento] = useState<number>(new Date().getDate());
    const [porcentagemTaxa, setPorcentagemTaxa] = useState<number>(0);
    const [porcentagemAumento, setPorcentagemAumento] = useState<number>(0);
    const [valorAumentoFixo, setValorAumentoFixo] = useState<number>(0);
    const [tipo, setTipo] = useState<"VENDA" | "ALUGUEL">(
        tipoInicial === "LOCACAO" ? "ALUGUEL" : (tipoInicial as "VENDA" | "ALUGUEL")
    );

    const firstInputRef = useRef<HTMLDivElement>(null);
    const [loadingTaxa, setLoadingTaxa] = useState(false);

    useEffect(() => {
        const buscarTaxa = async () => {
            if (open) {
                setLoadingTaxa(true);
                try {
                    const configs:any = await configuracaoService.getConfigs();
                    const chaveBusca = tipo === 'ALUGUEL' ? 'TAXA_ADM_ALUGUEL' : 'TAXA_VENDA';
                    const config = Array.isArray(configs)
                        ? configs.find(c => c.chave === chaveBusca)
                        : null;

                    // FIXAÇÃO EM 10% QUANDO NÃO HOUVER INFORMAÇÃO
                    const valorPadrao = 10; // 10% fixo

                    if (config && config.valor !== undefined && config.valor !== null) {
                        const valorNumerico = Number(config.valor) || valorPadrao;
                        setPorcentagemTaxa(valorNumerico);
                    } else {
                        setPorcentagemTaxa(valorPadrao);
                    }
                } catch (err: any) {
                    // 5% também em caso de erro
                    setPorcentagemTaxa(5);
                } finally {
                    setLoadingTaxa(false);
                }
            }
        };

        buscarTaxa();
    }, [open, tipo]);

    useEffect(() => {
        if (open) {
            setValorTotal(valorSugerido || 0);
            setEntrada(0);
            setParcelas(1);
            setValorAumentoFixo(0);
            setDiaVencimento(new Date().getDate());

            setTimeout(() => {
                if (firstInputRef.current) {
                    const input = firstInputRef.current.querySelector('input');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }
            }, 150);
        }
    }, [open, valorSugerido]);

    useEffect(() => {
        const vTotal = valorTotal ?? 0;
        const vEntrada = entrada ?? 0;
        const liquido = vTotal - vEntrada;
        const qtd = parcelas > 0 ? parcelas : 1;

        const valorBase = liquido / qtd;
        const comPorcentagem = valorBase * (1 + (porcentagemAumento / 100));
        const valorFinal = comPorcentagem + valorAumentoFixo;

        setValorParcela(valorFinal);
    }, [valorTotal, entrada, parcelas, porcentagemAumento, valorAumentoFixo]);

    const handleConfirmar = () => {
        if (!valorTotal || valorTotal <= 0) return;

        const vTotal = Number(valorTotal);
        const vEntrada = Number(entrada || 0);
        const liquidoParaBase = vTotal - vEntrada;
        const valorTaxaEmpresa = liquidoParaBase * (Number(porcentagemTaxa) / 100);
        const valorLiquidoRepasse = liquidoParaBase - valorTaxaEmpresa;

        const dadosParaEnviar = {
            valorTotal: vTotal,
            valorEntrada: vEntrada,
            qtdParcelas: Number(parcelas),
            valorParcela: Number(valorParcela || 0),
            diaVencimento: Number(diaVencimento),
            ajustePorcentagem: Number(porcentagemAumento),
            ajusteFixo: Number(valorAumentoFixo),
            tipoNegocio: tipo,
            porcentagemTaxaEmpresa: Number(porcentagemTaxa),
            valorRetencaoEmpresa: valorTaxaEmpresa,
            valorBaseParaRepasse: valorLiquidoRepasse
        };

        onConfirm(dadosParaEnviar);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Finalizar Negociação</DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <TextField
                            select
                            sx={{ flex: 2 }}
                            size="small"
                            label="Tipo de Negócio"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value as "VENDA" | "ALUGUEL")}
                        >
                            <MenuItem value="VENDA">Venda</MenuItem>
                            <MenuItem value="ALUGUEL">Aluguel / Locação</MenuItem>
                        </TextField>
                        
                        <Box
                            sx={{
                                flex: 1,
                                p: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                minHeight: 40
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Taxa
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {loadingTaxa ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <Typography variant="body2" fontWeight="bold">
                                        {porcentagemTaxa}%
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                    </Box>

                    <Box ref={firstInputRef}>
                        <CurrencyFormatInput
                            name="valorTotal"
                            label="Valor Total Negociado"
                            value={valorTotal}
                            onChange={(val) => setValorTotal(val)}
                            required
                            size="small"
                        />
                    </Box>

                    <CurrencyFormatInput
                        name="entrada"
                        label="Valor da Entrada"
                        value={entrada}
                        onChange={(val) => setEntrada(val)}
                        size="small"
                    />

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                            label="Qtd Parcelas"
                            type="number"
                            sx={{ flex: 1 }}
                            size="small"
                            value={parcelas}
                            onChange={(e) => setParcelas(Math.max(1, Number(e.target.value)))}
                            onFocus={(e) => e.target.select()}
                        />

                        <TextField
                            label="Dia Vencimento"
                            type="number"
                            sx={{ flex: 1 }}
                            size="small"
                            value={diaVencimento}
                            onChange={(e) => setDiaVencimento(Math.min(31, Math.max(1, Number(e.target.value))))}
                            onFocus={(e) => e.target.select()}
                            helperText="Ex: Todo dia 10"
                        />
                    </Box>

                    <Divider>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '600' }}>
                            AJUSTES E TAXAS
                        </Typography>
                    </Divider>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <TextField
                            label="% Aumento"
                            type="number"
                            size="small"
                            sx={{ flex: 1 }}
                            value={porcentagemAumento}
                            onChange={(e) => setPorcentagemAumento(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            InputProps={{
                                endAdornment: <Typography variant="body2" color="text.secondary">%</Typography>
                            }}
                        />
                        <TextField
                            label="Aumento em R$"
                            type="number"
                            size="small"
                            sx={{ flex: 1 }}
                            value={valorAumentoFixo}
                            onChange={(e) => setValorAumentoFixo(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            InputProps={{
                                endAdornment: <Typography variant="body2" color="text.secondary"></Typography>
                            }}
                        />
                    </Box>

                    <Box sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? theme.palette.primary.dark + '20'
                            : '#f0f7ff',
                        borderRadius: 1,
                        border: (theme) => `1px solid ${theme.palette.mode === 'dark'
                            ? theme.palette.primary.dark
                            : '#cce3ff'}`
                    }}>
                        <CurrencyFormatInput
                            name="valorParcela"
                            label="Valor Final da Parcela (Editável)"
                            value={valorParcela}
                            size="small"
                            onChange={(val) => setValorParcela(val)}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{
                            display: 'block',
                            mt: 1,
                            opacity: (theme) => theme.palette.mode === 'dark' ? 0.8 : 1
                        }}>
                            Cálculo baseado no Valor Total, Entrada e % de Aumento.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : '#f8f9fa'
            }}>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleConfirmar}
                    disabled={!valorTotal || valorTotal <= 0}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                >
                    Confirmar e Gerar Financeiro
                </Button>
            </DialogActions>
        </Dialog>
    );
};