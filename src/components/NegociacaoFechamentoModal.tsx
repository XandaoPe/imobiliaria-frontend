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
    useTheme,
    Chip,
    Alert,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    FormHelperText
} from '@mui/material';
import { CurrencyFormatInput } from './CurrencyFormatInput';
import { configuracaoService } from '../services/configuracaoService';
import { comissaoRegraService } from '../services/comissaoRegraService';
import { usuarioService } from '../services/usuarioService';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

interface Props {
    open: boolean;
    valorSugerido: number;
    tipoNegocio: "VENDA" | "ALUGUEL" | "LOCACAO";
    empresaId: any;
    onClose: () => void;
    onConfirm: (dados: any) => void;
}

interface ComissaoRegra {
    _id: string;
    nome: string;
    tipoNegocio: "VENDA" | "ALUGUEL" | "AMBOS";
    percentual: number;
    valorFixo?: number;
    tipoCalculo: "PERCENTUAL" | "FIXO" | "MISTO";
    prioridade: number;
    cargo: string[];
    nivel: string[];
    ativo: boolean; 
}

interface Usuario {
    _id: string;
    nome: string;
    email: string;
    perfil: string;
    nivel?: string;
    ativo: boolean; 
    ativoFinanceiro: boolean; 
}
interface ComissaoAdicionada {
    id: string;
    regraId: string;
    regraNome: string;
    usuarioId: string;
    usuarioNome: string;
    percentual: number;
    valorFixo?: number;
    tipoCalculo: "PERCENTUAL" | "FIXO" | "MISTO";
    valorCalculado: number;
    editavel: boolean;
}

export const NegociacaoFechamentoModal: React.FC<Props> = ({
    open,
    valorSugerido,
    tipoNegocio: tipoInicial,
    empresaId,
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

    // Estados para comissões
    const [regrasComissao, setRegrasComissao] = useState<ComissaoRegra[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [comissoesAdicionadas, setComissoesAdicionadas] = useState<ComissaoAdicionada[]>([]);
    const [regraSelecionada, setRegraSelecionada] = useState<string>('');
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>('');
    const [loadingTaxa, setLoadingTaxa] = useState(false);
    const [loadingRegras, setLoadingRegras] = useState(false);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [erroComissao, setErroComissao] = useState<string>('');

    const firstInputRef = useRef<HTMLDivElement>(null);

    // Calcular valor base para comissão (valor total - entrada)
    const valorBaseComissao = (valorTotal || 0) - (entrada || 0);

    // Calcular valor da taxa administrativa
    const valorTaxaEmpresa = valorBaseComissao * (porcentagemTaxa / 100);

    // Carregar regras de comissão
    useEffect(() => {
        const carregarRegrasComissao = async () => {
            if (open && empresaId) {
                setLoadingRegras(true);
                try {
                    const regras = await comissaoRegraService.listarRegras(empresaId);
                    setRegrasComissao(regras.filter((r: ComissaoRegra) =>
                        r.ativo && (r.tipoNegocio === tipo || r.tipoNegocio === 'AMBOS')
                    ));
                } catch (error) {
                    console.error('Erro ao carregar regras de comissão:', error);
                } finally {
                    setLoadingRegras(false);
                }
            }
        };
        carregarRegrasComissao();
    }, [open, empresaId, tipo]);

    // Carregar usuários (corretores, gerentes, etc)
    useEffect(() => {
        const carregarUsuarios = async () => {
            if (open && empresaId) {
                setLoadingUsuarios(true);
                try {
                    const usuariosData = await usuarioService.buscarUsuariosAtivos(empresaId);
                    setUsuarios(usuariosData.filter((u: Usuario) =>
                        u.ativo && u.ativoFinanceiro && u.perfil !== 'SUPORTE'
                    ));
                } catch (error) {
                    console.error('Erro ao carregar usuários:', error);
                } finally {
                    setLoadingUsuarios(false);
                }
            }
        };
        carregarUsuarios();
    }, [open, empresaId]);

    useEffect(() => {
        const buscarTaxa = async () => {
            if (open) {
                setLoadingTaxa(true);
                try {
                    const configs: any = await configuracaoService.getConfigs();
                    const chaveBusca = tipo === 'ALUGUEL' ? 'TAXA_ADM_ALUGUEL' : 'TAXA_VENDA';
                    const config = Array.isArray(configs)
                        ? configs.find(c => c.chave === chaveBusca)
                        : null;

                    const valorPadrao = 10; // 10% fixo

                    if (config && config.valor !== undefined && config.valor !== null) {
                        const valorNumerico = Number(config.valor) || valorPadrao;
                        setPorcentagemTaxa(valorNumerico);
                    } else {
                        setPorcentagemTaxa(valorPadrao);
                    }
                } catch (err: any) {
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
            setComissoesAdicionadas([]);
            setRegraSelecionada('');
            setUsuarioSelecionado('');
            setErroComissao('');

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

        // Recalcular comissões quando o valor base mudar
        if (comissoesAdicionadas.length > 0) {
            const novasComissoes = comissoesAdicionadas.map(comissao => ({
                ...comissao,
                valorCalculado: calcularValorComissao(comissao, valorBaseComissao)
            }));
            setComissoesAdicionadas(novasComissoes);
        }
    }, [valorTotal, entrada, parcelas, porcentagemAumento, valorAumentoFixo, porcentagemTaxa]);

    // Calcular valor total das comissões
    const totalComissoes = comissoesAdicionadas.reduce((total, comissao) =>
        total + comissao.valorCalculado, 0
    );

    // Verificar se comissões ultrapassam a taxa administrativa
    const excedeTaxa = totalComissoes > valorTaxaEmpresa;
    const saldoDisponivel = valorTaxaEmpresa - totalComissoes;

    // Função para calcular valor da comissão
    const calcularValorComissao = (comissao: ComissaoAdicionada, valorBase: number): number => {
        switch (comissao.tipoCalculo) {
            case 'PERCENTUAL':
                return (valorBase * comissao.percentual) / 100;
            case 'FIXO':
                return comissao.valorFixo || 0;
            case 'MISTO':
                return ((valorBase * comissao.percentual) / 100) + (comissao.valorFixo || 0);
            default:
                return 0;
        }
    };

    // Adicionar nova comissão
    const handleAdicionarComissao = () => {
        if (!regraSelecionada || !usuarioSelecionado) {
            setErroComissao('Selecione uma regra e um usuário');
            return;
        }

        const regra = regrasComissao.find(r => r._id === regraSelecionada);
        const usuario = usuarios.find(u => u._id === usuarioSelecionado);

        if (!regra || !usuario) {
            setErroComissao('Regra ou usuário não encontrado');
            return;
        }

        // Verificar se já existe comissão para este usuário
        const comissaoExistente = comissoesAdicionadas.find(
            c => c.usuarioId === usuarioSelecionado && c.regraId === regraSelecionada
        );

        if (comissaoExistente) {
            setErroComissao('Este usuário já tem esta regra de comissão');
            return;
        }

        const novaComissao: ComissaoAdicionada = {
            id: Date.now().toString(),
            regraId: regra._id,
            regraNome: regra.nome,
            usuarioId: usuario._id,
            usuarioNome: usuario.nome,
            percentual: regra.percentual,
            valorFixo: regra.valorFixo,
            tipoCalculo: regra.tipoCalculo,
            valorCalculado: calcularValorComissao({
                percentual: regra.percentual,
                valorFixo: regra.valorFixo,
                tipoCalculo: regra.tipoCalculo
            } as any, valorBaseComissao),
            editavel: false
        };

        setComissoesAdicionadas([...comissoesAdicionadas, novaComissao]);
        setRegraSelecionada('');
        setUsuarioSelecionado('');
        setErroComissao('');
    };

    // Remover comissão
    const handleRemoverComissao = (id: string) => {
        setComissoesAdicionadas(comissoesAdicionadas.filter(c => c.id !== id));
    };

    // Atualizar valor da comissão manualmente
    const handleAtualizarComissao = (id: string, novoValor: number) => {
        if (novoValor < 0) return;

        const novasComissoes = comissoesAdicionadas.map(comissao => {
            if (comissao.id === id) {
                return {
                    ...comissao,
                    valorCalculado: novoValor,
                    editavel: true
                };
            }
            return comissao;
        });
        setComissoesAdicionadas(novasComissoes);
    };

    // Atualizar percentual da comissão
    const handleAtualizarPercentual = (id: string, novoPercentual: number) => {
        if (novoPercentual < 0 || novoPercentual > 100) return;

        const comissao = comissoesAdicionadas.find(c => c.id === id);
        if (!comissao) return;

        const novoValor = (valorBaseComissao * novoPercentual) / 100;

        const novasComissoes = comissoesAdicionadas.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    percentual: novoPercentual,
                    valorCalculado: novoValor,
                    editavel: true
                };
            }
            return c;
        });
        setComissoesAdicionadas(novasComissoes);
    };

    const handleConfirmar = () => {
        if (!valorTotal || valorTotal <= 0) return;

        if (excedeTaxa) {
            setErroComissao(`As comissões (R$ ${totalComissoes.toFixed(2)}) excedem a taxa administrativa (R$ ${valorTaxaEmpresa.toFixed(2)})`);
            return;
        }

        const vTotal = Number(valorTotal);
        const vEntrada = Number(entrada || 0);
        const liquidoParaBase = vTotal - vEntrada;
        const valorTaxaEmpresaCalculada = liquidoParaBase * (Number(porcentagemTaxa) / 100);
        const valorLiquidoRepasse = liquidoParaBase - valorTaxaEmpresaCalculada;

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
            valorRetencaoEmpresa: valorTaxaEmpresaCalculada,
            valorBaseParaRepasse: valorLiquidoRepasse,
            comissoes: comissoesAdicionadas.map(c => ({
                regraId: c.regraId,
                usuarioId: c.usuarioId,
                percentual: c.percentual,
                valorFixo: c.valorFixo,
                tipoCalculo: c.tipoCalculo,
                valorCalculado: c.valorCalculado,
                editavel: c.editavel
            }))
        };

        onConfirm(dadosParaEnviar);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 'bold',
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                Finalizar Negociação
                <Button
                    onClick={onClose}
                    sx={{
                        minWidth: 'auto',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        color: 'text.secondary',
                        '&:hover': {
                            bgcolor: 'action.hover',
                            color: 'text.primary'
                        }
                    }}
                >
                    ✕
                </Button>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Seção Tipo e Taxa */}
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

                    {/* Seção Valores */}
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

                    {/* Seção Comissões */}
                    <Divider>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '600' }}>
                            COMISSÕES
                        </Typography>
                    </Divider>

                    {/* Informações sobre taxa administrativa */}
                    <Alert
                        severity={excedeTaxa ? "error" : "info"}
                        sx={{ mb: 1 }}
                    >
                        <Typography variant="body2">
                            Taxa administrativa: <strong>R$ {valorTaxaEmpresa.toFixed(2)}</strong> ({porcentagemTaxa}% sobre R$ {valorBaseComissao.toFixed(2)})
                            {comissoesAdicionadas.length > 0 && (
                                <>
                                    <br />
                                    Total comissões: <strong>R$ {totalComissoes.toFixed(2)}</strong>
                                    <br />
                                    Saldo disponível: <strong>R$ {saldoDisponivel.toFixed(2)}</strong>
                                </>
                            )}
                        </Typography>
                    </Alert>

                    {/* Seletor para adicionar comissões */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                        <FormControl size="small" sx={{ flex: 1 }}>
                            <InputLabel>Regra de Comissão</InputLabel>
                            <Select
                                value={regraSelecionada}
                                onChange={(e) => setRegraSelecionada(e.target.value)}
                                disabled={loadingRegras}
                                label="Regra de Comissão"
                            >
                                {loadingRegras ? (
                                    <MenuItem value="">
                                        <CircularProgress size={16} />
                                    </MenuItem>
                                ) : (
                                    regrasComissao.map(regra => (
                                        <MenuItem key={regra._id} value={regra._id}>
                                            {regra.nome} ({regra.percentual}% {regra.tipoCalculo === 'MISTO' && `+ R$ ${regra.valorFixo}`})
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ flex: 1 }}>
                            <InputLabel>Usuário</InputLabel>
                            <Select
                                value={usuarioSelecionado}
                                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                                disabled={loadingUsuarios}
                                label="Usuário"
                            >
                                {loadingUsuarios ? (
                                    <MenuItem value="">
                                        <CircularProgress size={16} />
                                    </MenuItem>
                                ) : (
                                    usuarios.map(usuario => (
                                        <MenuItem key={usuario._id} value={usuario._id}>
                                            {usuario.nome} ({usuario.perfil})
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <IconButton
                            color="primary"
                            onClick={handleAdicionarComissao}
                            disabled={!regraSelecionada || !usuarioSelecionado}
                            size="small"
                        >
                            <AddCircleOutlineIcon />
                        </IconButton>
                    </Box>

                    {/* Mensagem de erro */}
                    {erroComissao && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {erroComissao}
                        </Alert>
                    )}

                    {/* Lista de comissões adicionadas */}
                    {comissoesAdicionadas.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Comissões Adicionadas ({comissoesAdicionadas.length})
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {comissoesAdicionadas.map((comissao) => (
                                    <Box
                                        key={comissao.id}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: 'background.paper'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {comissao.regraNome}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {comissao.usuarioNome}
                                                </Typography>
                                            </Box>

                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoverComissao(comissao.id)}
                                            >
                                                <RemoveCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                            <TextField
                                                label="%"
                                                type="number"
                                                size="small"
                                                sx={{ width: 80 }}
                                                value={comissao.percentual}
                                                onChange={(e) => handleAtualizarPercentual(comissao.id, Number(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <Typography variant="caption">%</Typography>
                                                }}
                                            />

                                            <Typography variant="body2">
                                                =
                                            </Typography>

                                            <TextField
                                                label="Valor"
                                                type="number"
                                                size="small"
                                                sx={{ flex: 1 }}
                                                value={comissao.valorCalculado}
                                                onChange={(e) => handleAtualizarComissao(comissao.id, Number(e.target.value))}
                                                InputProps={{
                                                    startAdornment: <Typography variant="caption">R$</Typography>
                                                }}
                                            />

                                            {comissao.valorFixo && comissao.valorFixo > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    + R$ {comissao.valorFixo} fixo
                                                </Typography>
                                            )}
                                        </Box>

                                        {comissao.editavel && (
                                            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                                                Valor editado manualmente
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {/* Resumo das comissões */}
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: excedeTaxa ? 'error.light' : 'success.light',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: excedeTaxa ? 'error.main' : 'success.main'
                            }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Resumo das Comissões
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">
                                        Total de Comissões:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        R$ {totalComissoes.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">
                                        Taxa Administrativa:
                                    </Typography>
                                    <Typography variant="body2">
                                        R$ {valorTaxaEmpresa.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {excedeTaxa ? 'Excedente:' : 'Saldo:'}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color={excedeTaxa ? 'error.main' : 'success.main'}>
                                        {excedeTaxa ? '+' : ''}R$ {Math.abs(saldoDisponivel).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
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
                    color={excedeTaxa ? "warning" : "success"}
                    onClick={handleConfirmar}
                    disabled={!valorTotal || valorTotal <= 0 || excedeTaxa}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                >
                    {excedeTaxa ? 'Ajustar Comissões' : 'Confirmar e Gerar Financeiro'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};