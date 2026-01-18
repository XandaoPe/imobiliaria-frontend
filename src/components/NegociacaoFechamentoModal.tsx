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
    MenuItem
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
    // Estados principais
    const [valorTotal, setValorTotal] = useState<number | null>(valorSugerido);
    const [entrada, setEntrada] = useState<number | null>(0);
    const [parcelas, setParcelas] = useState<number>(1);
    const [valorParcela, setValorParcela] = useState<number | null>(0);
    const [diaVencimento, setDiaVencimento] = useState<number>(new Date().getDate());

    // Estados de ajuste - AGORA INDEPENDENTES
    const [porcentagemTaxa, setPorcentagemTaxa] = useState<number>(0);
    const [porcentagemAumento, setPorcentagemAumento] = useState<number>(0);
    const [valorAumentoFixo, setValorAumentoFixo] = useState<number>(0);

    const firstInputRef = useRef<HTMLDivElement>(null);
    const [loadingTaxa, setLoadingTaxa] = useState(false);

    // Estado para o Select de tipo
    const [tipo, setTipo] = useState<"VENDA" | "ALUGUEL">(
        tipoInicial === "LOCACAO" ? "ALUGUEL" : (tipoInicial as "VENDA" | "ALUGUEL")
    );

    // 1. Busca de Taxa e Reset de Campos ao abrir ou mudar o Tipo
    useEffect(() => {
        const buscarTaxa = async () => {
            if (open) {
                setLoadingTaxa(true);
                try {
                    const configs = await configuracaoService.getConfigs();
                    const chaveBusca = tipo === 'ALUGUEL' ? 'TAXA_ADM_ALUGUEL' : 'TAXA_VENDA';
                    const config = configs.find(c => c.chave === chaveBusca);

                    if (config) {
                        const valorDb = config.valor;
                        // Preenche os campos individualmente apenas no carregamento inicial
                        setPorcentagemTaxa(valorDb);
                    }
                } catch (err) {
                    console.error("Erro ao buscar taxas", err);
                } finally {
                    setLoadingTaxa(false);
                }
            }
        };

        buscarTaxa();

        if (open) {
            setValorTotal(valorSugerido || 0);
            setEntrada(0);
            setParcelas(1);
            setValorAumentoFixo(0);
            setDiaVencimento(new Date().getDate());

            // Auto-focus no primeiro campo
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
    }, [open, valorSugerido, tipo]);

    // 2. Cálculo automático das parcelas (Usa porcentagemAumento, ignora porcentagemTaxa)
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

        const dadosParaEnviar = {
            valorTotal: Number(valorTotal),
            valorEntrada: Number(entrada || 0),
            qtdParcelas: Number(parcelas),
            valorParcela: Number(valorParcela || 0),
            diaVencimento: Number(diaVencimento),
            ajustePorcentagem: porcentagemAumento,
            ajusteFixo: valorAumentoFixo,
            tipoNegocio: tipo,
            taxaReferencia: porcentagemTaxa // Enviado separadamente se necessário
        };

        onConfirm(dadosParaEnviar);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Finalizar Negociação</DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>

                        {/* Seleção do Tipo de Negócio */}
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
                        <TextField
                            label="Taxa"
                            type="number"
                            size="small"
                            sx={{ flex: 1 }}
                            value={porcentagemTaxa}
                            onChange={(e) => setPorcentagemTaxa(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            InputProps={{
                                endAdornment: <Typography variant="body2" color="text.secondary">%</Typography>,
                                startAdornment: loadingTaxa ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null
                            }}
                        />
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

                        {/* Campo Aumento: Este é o que efetivamente calcula a parcela */}
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
                        bgcolor: '#f0f7ff',
                        borderRadius: 1,
                        border: '1px solid #cce3ff'
                    }}>
                        <CurrencyFormatInput
                            name="valorParcela"
                            label="Valor Final da Parcela (Editável)"
                            value={valorParcela}
                            size="small"
                            onChange={(val) => setValorParcela(val)}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Cálculo baseado no Valor Total, Entrada e % de Aumento.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
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