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
    Alert,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
    Paper,
} from '@mui/material';
import { CurrencyFormatInput } from './CurrencyFormatInput';
import { configuracaoService } from '../services/configuracaoService';
import { comissaoRegraService } from '../services/comissaoRegraService';
import { usuarioService } from '../services/usuarioService';
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

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

        // Recalcular comissões quando o valor da TAXA mudar
        if (comissoesAdicionadas.length > 0) {
            const novasComissoes = comissoesAdicionadas.map(comissao => ({
                ...comissao,
                // AGORA recalcula baseado na Taxa Administrativa
                valorCalculado: calcularValorComissao(comissao, valorTaxaEmpresa)
            }));
            setComissoesAdicionadas(novasComissoes);
        }
    }, [valorTotal, entrada, parcelas, porcentagemAumento, valorAumentoFixo, porcentagemTaxa, valorTaxaEmpresa]);

    // Calcular valor total das comissões
    const totalComissoes = comissoesAdicionadas.reduce((total, comissao) =>
        total + comissao.valorCalculado, 0
    );

    // Verificar se comissões ultrapassam a taxa administrativa
    const excedeTaxa = totalComissoes > valorTaxaEmpresa;
    const saldoDisponivel = valorTaxaEmpresa - totalComissoes;

    // Função para calcular valor da comissão - AGORA baseada na Taxa Administrativa
    const calcularValorComissao = (comissao: ComissaoAdicionada, valorTaxa: number): number => {
        switch (comissao.tipoCalculo) {
            case 'PERCENTUAL':
                return (valorTaxa * comissao.percentual) / 100;
            case 'FIXO':
                return comissao.valorFixo || 0;
            case 'MISTO':
                return ((valorTaxa * comissao.percentual) / 100) + (comissao.valorFixo || 0);
            default:
                return 0;
        }
    };

    // Remover comissão
    const handleRemoverComissao = (id: string) => {
        setComissoesAdicionadas(comissoesAdicionadas.filter(c => c.id !== id));
    };

    // Função para adicionar comissão automaticamente
    const handleAdicionarComissaoAutomatica = (regraId: string, usuarioId: string) => {
        if (!regraId || !usuarioId) {
            setErroComissao('Selecione uma regra e um usuário');
            return;
        }

        const regra = regrasComissao.find(r => r._id === regraId);
        const usuario = usuarios.find(u => u._id === usuarioId);

        if (!regra || !usuario) {
            setErroComissao('Regra ou usuário não encontrado');
            return;
        }

        // Verificar se já existe comissão para este usuário
        const comissaoExistente = comissoesAdicionadas.find(
            c => c.usuarioId === usuarioId && c.regraId === regraId
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
            // AGORA calcula baseado na Taxa Administrativa
            valorCalculado: calcularValorComissao({
                percentual: regra.percentual,
                valorFixo: regra.valorFixo,
                tipoCalculo: regra.tipoCalculo
            } as any, valorTaxaEmpresa), // valorTaxaEmpresa em vez de valorBaseComissao
            editavel: false
        };

        setComissoesAdicionadas([...comissoesAdicionadas, novaComissao]);
        setRegraSelecionada(''); // Limpa após adicionar
        setUsuarioSelecionado(''); // Limpa após adicionar
        setErroComissao('');
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

        console.log('=== Dados sendo enviados para o backend ===');
        console.log('Comissões a enviar:', comissoesAdicionadas);
        console.log('Estrutura das comissões:', comissoesAdicionadas.map(c => ({
            regraId: c.regraId,
            usuarioId: c.usuarioId,
            usuarioNome: c.usuarioNome, 
            regraNome: c.regraNome, 
            percentual: c.percentual,
            valorCalculado: c.valorCalculado,
            tipoCalculo: c.tipoCalculo
        })));

        const dadosParaEnviar = {
            valorTotal: vTotal,
            valorEntrada: vEntrada,
            qtdParcelas: Number(parcelas),
            valorParcela: Number(valorParcela || 0),
            diaVencimento: Number(diaVencimento),
            ajustePorcentagem: Number(porcentagemAumento),
            ajusteFixo: Number(valorAumentoFixo),
            comissoes: comissoesAdicionadas.map(c => ({
                regraId: c.regraId,
                usuarioId: c.usuarioId,
                usuarioNome: c.usuarioNome,
                percentual: c.percentual,
                valorFixo: c.valorFixo,
                tipoCalculo: c.tipoCalculo,
                valorCalculado: c.valorCalculado,
                regraNome: c.regraNome,
            }))
        };

        onConfirm(dadosParaEnviar);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    maxHeight: '90vh',
                    width: '100%',
                    maxWidth: '1000px'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 'bold',
                pb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider'
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

                {/* Layout horizontal com duas colunas usando BOX */}
                <Box sx={{
                    display: 'flex',
                    gap: 3,
                    width: '100%'
                }}>

                    {/* Coluna Esquerda - Informações do Negócio */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        minWidth: 0
                    }}>
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                                Informações do Negócio
                            </Typography>
                        </Box>

                        {/* Tipo e Taxa */}
                        <Paper elevation={0} sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                        }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ width: '180px' }}> {/* Diminuído de flex:1 para width fixo */}
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tipo de Negócio</InputLabel>
                                        <Select
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value as "VENDA" | "ALUGUEL")}
                                            label="Tipo de Negócio"
                                        >
                                            <MenuItem value="VENDA">Venda</MenuItem>
                                            <MenuItem value="ALUGUEL">Aluguel / Locação</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{
                                    p: 1.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    bgcolor: 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flex: 1, // Agora ocupa o espaço restante
                                    minWidth: 0 // Evita quebra de linha
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                        Taxa Adm.:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                        {loadingTaxa ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                                color="primary"
                                                sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                {porcentagemTaxa}%
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Valores Principais */}
                        <Paper elevation={0} sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                        }}>
                            {/* Valor Total Negociado - Maior e Centralizado */}
                            <Box ref={firstInputRef} sx={{ mb: 3 }}>
                                <CurrencyFormatInput
                                    name="valorTotal"
                                    label="Valor Total Negociado *"
                                    value={valorTotal}
                                    onChange={(val) => setValorTotal(val)}
                                    required
                                    size="small"
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            height: '56px',
                                            py: 1
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1rem'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Primeira linha: Valor Entrada, Parcelas e Dia Vencimento */}
                            <Box sx={{
                                display: 'flex',
                                gap: 2,
                                alignItems: 'flex-start',
                                mb: 2
                            }}>
                                {/* Valor Entrada - Ocupa mais espaço */}
                                <Box sx={{ flex: 2 }}>
                                    <CurrencyFormatInput
                                        name="entrada"
                                        label="Valor da Entrada"
                                        value={entrada}
                                        onChange={(val) => setEntrada(val)}
                                        size="small"
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: '48px' // Altura padrão dos TextFields
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.1rem',
                                                py: 1.375 // Ajuste para altura padrão
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Qtd Parcelas - Altura igual ao Valor da Entrada */}
                                <Box sx={{ width: '100px' }}>
                                    <TextField
                                        label="Parcelas"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={parcelas}
                                        onChange={(e) => setParcelas(Math.max(1, Number(e.target.value)))}
                                        onFocus={(e) => e.target.select()}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: '48px' // Mesma altura
                                            }
                                        }}
                                        InputProps={{
                                            sx: {
                                                fontSize: '0.95rem',
                                                '& input': {
                                                    textAlign: 'center',
                                                    py: 1.375 // Mesmo padding
                                                }
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Dia Vencimento - Altura igual ao Valor da Entrada */}
                                <Box sx={{ width: '100px' }}>
                                    <TextField
                                        label="Dia"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={diaVencimento}
                                        onChange={(e) => setDiaVencimento(Math.min(31, Math.max(1, Number(e.target.value))))}
                                        onFocus={(e) => e.target.select()}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: '48px' // Mesma altura
                                            }
                                        }}
                                        InputProps={{
                                            sx: {
                                                fontSize: '0.95rem',
                                                '& input': {
                                                    textAlign: 'center',
                                                    py: 1.375 // Mesmo padding
                                                }
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Segunda linha: Valor da Parcela - Altura igual */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mb: 2
                            }}>
                                <Box sx={{ width: '200px' }}>
                                    <CurrencyFormatInput
                                        name="valorParcela"
                                        label="Valor Estimado por Parcela"
                                        value={valorParcela}
                                        size="small"
                                        onChange={(val) => setValorParcela(val)}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: '48px' // Mesma altura que os outros
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.2rem',
                                                fontWeight: '600',
                                                textAlign: 'center',
                                                py: 1.375 // Mesmo padding
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: '0.9rem',
                                                textAlign: 'center'
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={{
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1.5
                        }}>
                            {/* Cabeçalho com título e ícone */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    Adicionar Comissão
                                </Typography>

                            </Box>

                            {/* Campos mais compactos */}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                {/* Regra de Comissão */}
                                <Box sx={{ flex: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Regra de Comissão</InputLabel>
                                        <Select
                                            value={regraSelecionada}
                                            onChange={(e) => {
                                                setRegraSelecionada(e.target.value);
                                                // Limpa o usuário selecionado quando mudar a regra
                                                setUsuarioSelecionado('');
                                            }}
                                            disabled={loadingRegras}
                                            label="Regra de Comissão"
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    py: 0.75
                                                }
                                            }}
                                        >
                                            {loadingRegras ? (
                                                <MenuItem value="">
                                                    <CircularProgress size={16} />
                                                </MenuItem>
                                            ) : (
                                                regrasComissao.map(regra => (
                                                    <MenuItem key={regra._id} value={regra._id}>
                                                        {regra.nome}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                        {regraSelecionada && regrasComissao.find(r => r._id === regraSelecionada) && (
                                            <FormHelperText sx={{
                                                mt: 0.25,
                                                mb: 0,
                                                lineHeight: 1.2
                                            }}>
                                                <Typography variant="caption">
                                                    {regrasComissao.find(r => r._id === regraSelecionada)?.percentual}%
                                                    {regrasComissao.find(r => r._id === regraSelecionada)?.tipoCalculo === 'MISTO' &&
                                                        ` + R$ ${regrasComissao.find(r => r._id === regraSelecionada)?.valorFixo}`}
                                                </Typography>
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Box>

                                {/* Usuário - Só habilita após escolher regra */}
                                <Box sx={{ flex: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Usuário</InputLabel>
                                        <Select
                                            value={usuarioSelecionado}
                                            onChange={(e) => {
                                                const usuarioId = e.target.value;
                                                setUsuarioSelecionado(usuarioId);

                                                // Adiciona automaticamente quando selecionar usuário
                                                if (regraSelecionada && usuarioId) {
                                                    setTimeout(() => {
                                                        handleAdicionarComissaoAutomatica(regraSelecionada, usuarioId);
                                                    }, 100);
                                                }
                                            }}
                                            disabled={loadingUsuarios || !regraSelecionada} // Desabilitado se não tiver regra
                                            label="Usuário"
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    py: 0.75
                                                }
                                            }}
                                        >
                                            {loadingUsuarios ? (
                                                <MenuItem value="">
                                                    <CircularProgress size={16} />
                                                </MenuItem>
                                            ) : (
                                                usuarios.map(usuario => (
                                                    <MenuItem key={usuario._id} value={usuario._id}>
                                                        {usuario.nome}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                        {/* HelperText invisível apenas para layout */}
                                        <FormHelperText sx={{
                                            visibility: 'hidden',
                                            mt: 0.25,
                                            mb: 0,
                                            height: '16px'
                                        }}>
                                            &nbsp;
                                        </FormHelperText>
                                    </FormControl>
                                </Box>
                            </Box>

                            {erroComissao && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mt: 1.5,
                                        py: 0.5,
                                        '& .MuiAlert-message': {
                                            py: 0.25
                                        }
                                    }}
                                >
                                    {erroComissao}
                                </Alert>
                            )}
                        </Paper>

                    </Box>

                    {/* Coluna Direita - Comissões e Cálculos */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        minWidth: 0
                    }}>
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                                Distribuição de Comissões
                            </Typography>
                        </Box>

                        {/* Resumo Financeiro */}
                        <Paper elevation={0} sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                        }}>
                            <Alert
                                severity={excedeTaxa ? "error" : "info"}
                                sx={{ mb: 0 }}
                                icon={false}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Valor Base para Comissões:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatCurrency(valorBaseComissao)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Taxa Administrativa ({porcentagemTaxa}%):</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatCurrency(valorTaxaEmpresa)}
                                        </Typography>
                                    </Box>
                                    {comissoesAdicionadas.length > 0 && (
                                        <>
                                            <Divider sx={{ my: 0.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Total Comissões:</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {formatCurrency(totalComissoes)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">
                                                    {excedeTaxa ? 'Excedente:' : 'Saldo Disponível:'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    color={excedeTaxa ? 'error.main' : 'success.main'}
                                                >
                                                    {formatCurrency(Math.abs(saldoDisponivel))}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </Alert>
                        </Paper>

                        {/* Lista de Comissões Adicionadas */}
                        {comissoesAdicionadas.length > 0 && (
                            <Paper elevation={0} sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                flex: 1
                            }}>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                        Comissões Adicionadas ({comissoesAdicionadas.length})
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                    pr: 1
                                }}>
                                    {comissoesAdicionadas.map((comissao) => (
                                        <Box
                                            key={comissao.id}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                bgcolor: 'background.paper',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            {/* Nome e Regra na mesma linha */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {comissao.usuarioNome}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            • {comissao.regraNome}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoverComissao(comissao.id)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <RemoveCircleOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Box>

                                            <Box>

                                                <Box sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '80px 20px 1fr', // 80px para %, 20px para =, resto para valor
                                                    gap: 1,
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}>
                                                    {/* Porcentagem - 80px */}
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            width: '100%',
                                                            height: '40px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            px: 1,
                                                            bgcolor: 'background.paper'
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                            {comissao.percentual?.toFixed(2).replace('.', ',')}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                color: 'text.secondary'
                                                            }}
                                                        >
                                                            %
                                                        </Typography>
                                                    </Paper>

                                                    {/* Símbolo = */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            =
                                                        </Typography>
                                                    </Box>

                                                    {/* Valor - ocupa o resto do espaço */}
                                                    <Box>
                                                        <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            width: '100%',
                                                            height: '40px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            px: 1,
                                                            bgcolor: 'background.paper'
                                                        }}
                                                    >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold',
                                                                    color: 'text.secondary'
                                                                }}
                                                            >
                                                                R$
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                {formatCurrency(comissao.valorCalculado || 0)}
                                                            </Typography>
                                                    </Paper>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color={excedeTaxa ? "warning" : "success"}
                    onClick={handleConfirmar}
                    disabled={!valorTotal || valorTotal <= 0 || excedeTaxa}
                    sx={{
                        fontWeight: 'bold',
                        textTransform: 'none',
                        px: 4,
                        boxShadow: 2
                    }}
                >
                    {excedeTaxa ? 'Ajustar Comissões' : 'Confirmar e Gerar Financeiro'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};