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
    Divider
} from '@mui/material';
import { CurrencyFormatInput } from './CurrencyFormatInput';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (dados: any) => void;
    valorSugerido: number;
}

export const NegociacaoFechamentoModal: React.FC<Props> = ({ open, onClose, onConfirm, valorSugerido }) => {
    // Estados principais
    const [valorTotal, setValorTotal] = useState<number | null>(valorSugerido);
    const [entrada, setEntrada] = useState<number | null>(0);
    const [parcelas, setParcelas] = useState<number>(1);
    const [valorParcela, setValorParcela] = useState<number | null>(0);
    const [diaVencimento, setDiaVencimento] = useState<number>(new Date().getDate());

    // Estados de ajuste (Front-end apenas)
    const [porcentagemAumento, setPorcentagemAumento] = useState<number>(0);
    const [valorAumentoFixo, setValorAumentoFixo] = useState<number>(0);

    const firstInputRef = useRef<HTMLDivElement>(null);

    // Sincroniza ao abrir
    useEffect(() => {
        if (open) {
            setValorTotal(valorSugerido || 0);
            setEntrada(0);
            setParcelas(1);
            setPorcentagemAumento(0);
            setValorAumentoFixo(0);
            setDiaVencimento(new Date().getDate()); // Sugere o dia atual

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

    // Cálculo automático com os ajustes
    useEffect(() => {
        const vTotal = valorTotal ?? 0;
        const vEntrada = entrada ?? 0;
        const liquido = vTotal - vEntrada;
        const qtd = parcelas > 0 ? parcelas : 1;

        const valorBase = liquido / qtd;
        const comPorcentagem = valorBase * (1 + porcentagemAumento / 100);
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
            ajusteFixo: valorAumentoFixo
        };

        onConfirm(dadosParaEnviar);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Finalizar Negociação</DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Defina as condições e ajustes financeiros para as parcelas.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box ref={firstInputRef}>
                        <CurrencyFormatInput
                            name="valorTotal"
                            label="Valor Total Negociado"
                            value={valorTotal}
                            onChange={(val) => setValorTotal(val)}
                            required
                            size="small"
                            onFocus={(e: any) => e.target.select()}
                        />
                    </Box>

                    <CurrencyFormatInput
                        name="entrada"
                        label="Valor da Entrada"
                        value={entrada}
                        onChange={(val) => setEntrada(val)}
                        size="small"
                        onFocus={(e: any) => e.target.select()}
                    />

                    {/* Layout em linha para Parcelas e Dia do Vencimento */}
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
                            onChange={(e) => {
                                let val = Number(e.target.value);
                                if (val > 31) val = 31;
                                if (val < 1) val = 1;
                                setDiaVencimento(val);
                            }}
                            onFocus={(e) => e.target.select()}
                            helperText="Ex: Todo dia 10"
                        />
                    </Box>

                    <Divider sx={{ my: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                            AJUSTES DE CORREÇÃO
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
                        <Box sx={{ flex: 1 }}>
                            <CurrencyFormatInput
                                name="valorAumentoFixo"
                                label="Valor Aumento"
                                value={valorAumentoFixo}
                                size="small"
                                onChange={(val) => setValorAumentoFixo(val || 0)}
                                onFocus={(e: any) => e.target.select()}
                            />
                        </Box>
                    </Box>

                    <Box sx={{
                        mt: 0.5,
                        p: 1.5,
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
                            onFocus={(e: any) => e.target.select()}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Considera aumentos. Vencimentos mensais no dia {diaVencimento}.
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