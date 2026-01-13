import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Autocomplete, MenuItem, CircularProgress,
    Box, Typography, Divider, createFilterOptions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom'; // Importado para o redirecionamento
import api from '../services/api';
import { Cliente } from '../types/cliente';
import { Imovel } from '../types/imovel';
import { StatusNegociacao } from '../types/negociacao';

// Importação dos modais de cadastro rápido
import { ClienteFormModal } from './ClienteFormModal';
import { ImovelFormModal } from './ImovelFormModal';

interface ClienteOptionType extends Partial<Cliente> {
    inputValue?: string;
}

interface ImovelOptionType extends Partial<Imovel> {
    inputValue?: string;
}

interface NegociacaoFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        cliente?: Cliente | null;
        imovel?: Imovel | null;
    } | null;
}

const filter = createFilterOptions<any>();

export const NegociacaoFormModal: React.FC<NegociacaoFormModalProps> = ({ open, onClose, onSuccess, initialData }) => {
    const navigate = useNavigate(); // Hook de navegação instanciado

    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
    const [tipo, setTipo] = useState<'VENDA' | 'ALUGUEL'>('VENDA');
    const [status, setStatus] = useState<StatusNegociacao>('PROSPECCAO');
    const [observacaoInicial, setObservacaoInicial] = useState('');

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [openClienteForm, setOpenClienteForm] = useState(false);
    const [openImovelForm, setOpenImovelForm] = useState(false);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [resClientes, resImoveis] = await Promise.all([
                api.get('/clientes?status=ATIVO'),
                api.get('/imoveis?disponivel=true')
            ]);
            setClientes(resClientes.data);
            setImoveis(resImoveis.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
            // Preenche dados iniciais vindo do Lead, se existirem
            if (initialData) {
                if (initialData.cliente) setSelectedCliente(initialData.cliente);
                if (initialData.imovel) setSelectedImovel(initialData.imovel);
            }
        } else {
            // Limpa o formulário ao fechar (Reset manual)
            setSelectedCliente(null);
            setSelectedImovel(null);
            setObservacaoInicial('');
        }
    }, [open, initialData]);

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async () => {
        // Validação básica: ID é obrigatório
        if (!selectedCliente?._id || !selectedImovel?._id) {
            alert("Por favor, selecione um cliente e um imóvel válidos.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/negociacoes', {
                cliente: selectedCliente._id,
                imovel: selectedImovel._id,
                tipo,
                status,
                valor_acordado: 0,
                observacoes_gerais: observacaoInicial,
                historico: [{
                    descricao: `Início da negociação: ${observacaoInicial || 'Sem observações adicionais.'}`,
                    data: new Date().toISOString()
                }]
            });

            // Executa o callback de sucesso original
            onSuccess();

            // Fecha o modal atual
            handleClose();

            // REDIRECIONAMENTO: Direciona o usuário para a NegociacaoPage
            navigate('/negociacoes');

        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Erro ao criar negociação");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🤝 Nova Negociação
                </DialogTitle>
                <DialogContent dividers>
                    {loadingData ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress size={40} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                            {/* AUTOCOMPLETE CLIENTE */}
                            <Autocomplete
                                options={clientes as ClienteOptionType[]}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    if (option.inputValue) return option.inputValue;
                                    return option.nome ? `${option.nome} (${option.cpf || 'Sem CPF'})` : '';
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);
                                    const { inputValue } = params;
                                    const isExisting = options.some((option) => inputValue === option.nome);

                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push({
                                            inputValue,
                                            nome: `Adicionar "${inputValue}"`
                                        });
                                    }
                                    return filtered;
                                }}
                                value={selectedCliente}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                onChange={(_, newValue: any) => {
                                    if (newValue?.inputValue) {
                                        setOpenClienteForm(true);
                                    } else {
                                        setSelectedCliente(newValue as Cliente);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Cliente (Lead)" required fullWidth />
                                )}
                                renderOption={(props, option: ClienteOptionType) => (
                                    <li {...props} key={option._id || option.inputValue}>
                                        {option.inputValue ? <AddIcon color="primary" sx={{ mr: 1 }} /> : null}
                                        {option.nome}
                                    </li>
                                )}
                            />

                            {/* AUTOCOMPLETE IMÓVEL */}
                            <Autocomplete
                                options={imoveis as ImovelOptionType[]}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    if (option.inputValue) return option.inputValue;
                                    return option.titulo ? `${option.titulo} - ${option.endereco}` : '';
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);
                                    const { inputValue } = params;
                                    const isExisting = options.some((option) => inputValue === option.titulo);

                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push({
                                            inputValue,
                                            titulo: `Adicionar "${inputValue}"`
                                        });
                                    }
                                    return filtered;
                                }}
                                value={selectedImovel}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                onChange={(_, newValue: any) => {
                                    if (newValue?.inputValue) {
                                        setOpenImovelForm(true);
                                    } else {
                                        setSelectedImovel(newValue as Imovel);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Imóvel"
                                        required
                                        placeholder="Busque por título ou endereço..."
                                    />
                                )}
                                renderOption={(props, option: ImovelOptionType) => (
                                    <li {...props} key={option._id || option.inputValue} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                            {option.inputValue ? <AddIcon color="secondary" sx={{ mr: 1 }} /> : null}
                                            <Typography variant="body1" sx={{ fontWeight: option.inputValue ? 'bold' : 'medium' }}>
                                                {option.titulo}
                                            </Typography>
                                        </Box>
                                        {!option.inputValue && (
                                            <Typography variant="caption" color="text.secondary">
                                                {option.endereco} • <strong>{option.cidade}</strong>
                                            </Typography>
                                        )}
                                    </li>
                                )}
                            />

                            <Divider />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Interesse"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value as any)}
                                >
                                    <MenuItem value="VENDA">Venda</MenuItem>
                                    <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    fullWidth
                                    label="Fase Inicial"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                >
                                    <MenuItem value="PROSPECCAO">Prospecção</MenuItem>
                                    <MenuItem value="VISITA">Visita Agendada</MenuItem>
                                    <MenuItem value="PROPOSTA">Proposta</MenuItem>
                                </TextField>
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Notas iniciais"
                                value={observacaoInicial}
                                onChange={(e) => setObservacaoInicial(e.target.value)}
                                placeholder="Descreva o interesse inicial do cliente..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting || !selectedCliente?._id || !selectedImovel?._id}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : "Criar Negociação"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modais de Cadastro Rápido */}
            <ClienteFormModal
                open={openClienteForm}
                onClose={() => setOpenClienteForm(false)}
                onSuccess={(novoCliente) => {
                    setOpenClienteForm(false);
                    fetchData();
                    if (novoCliente) setSelectedCliente(novoCliente);
                }}
            />

            <ImovelFormModal
                open={openImovelForm}
                onClose={() => setOpenImovelForm(false)}
                onSuccess={(novoImovel) => {
                    setOpenImovelForm(false);
                    fetchData();
                    if (novoImovel) setSelectedImovel(novoImovel);
                }}
            />
        </>
    );
};