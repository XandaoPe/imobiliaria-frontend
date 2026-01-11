import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Autocomplete, MenuItem, CircularProgress,
    Box, Typography, Divider, createFilterOptions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { Cliente } from '../types/cliente';
import { Imovel } from '../types/imovel';
import { StatusNegociacao } from '../types/negociacao';

// Importação dos modais de cadastro rápido
import { ClienteFormModal } from './ClienteFormModal';
import { ImovelFormModal } from './ImovelFormModal'; // AGORA ATIVO

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
}

const filter = createFilterOptions<any>();

export const NegociacaoFormModal: React.FC<NegociacaoFormModalProps> = ({ open, onClose, onSuccess }) => {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
    const [tipo, setTipo] = useState<'VENDA' | 'ALUGUEL'>('VENDA');
    const [status, setStatus] = useState<StatusNegociacao>('PROSPECCAO');
    const [observacaoInicial, setObservacaoInicial] = useState('');

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Estados para abrir os modais de cadastro rápido
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
        if (open) fetchData();
    }, [open]);

    const handleClose = () => {
        setSelectedCliente(null);
        setSelectedImovel(null);
        setObservacaoInicial('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedCliente || !selectedImovel) return;
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
                    descricao: `Início do interesse: ${observacaoInicial || 'Sem observações.'}`,
                    data: new Date().toISOString()
                }]
            });
            onSuccess();
            handleClose();
        } catch (error: any) {
            alert("Erro ao criar negociação");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>🤝 Nova Negociação</DialogTitle>
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
                                    return `${option.nome} (${option.cpf})`;
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);
                                    const { inputValue } = params;
                                    const isExisting = options.some((option) => inputValue === option.nome);
                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push({ inputValue, nome: `Adicionar "${inputValue}"` });
                                    }
                                    return filtered;
                                }}
                                value={selectedCliente as ClienteOptionType | null}
                                onChange={(_, newValue: any) => {
                                    if (newValue?.inputValue) setOpenClienteForm(true);
                                    else setSelectedCliente(newValue as Cliente);
                                }}
                                renderInput={(params) => <TextField {...params} label="Cliente (Lead)" required />}
                                renderOption={(props, option: ClienteOptionType) => (
                                    <li {...props}>
                                        {option.inputValue && <AddIcon color="primary" sx={{ mr: 1 }} />}
                                        {option.nome}
                                    </li>
                                )}
                            />

                                {/* AUTOCOMPLETE IMÓVEL */}
                                <Autocomplete
                                    options={imoveis as ImovelOptionType[]}
                                    // 1. Melhora o rótulo do campo após selecionado
                                    getOptionLabel={(option) => {
                                        if (typeof option === 'string') return option;
                                        if (option.inputValue) return option.inputValue;

                                        // Exibe: "Título do Imóvel - Rua Exemplo, 123 (Cidade)"
                                        return `${option.titulo} - ${option.endereco}${option.cidade ? ` (${option.cidade})` : ''}`;
                                    }}
                                    filterOptions={(options, params) => {
                                        const filtered = filter(options, params);
                                        const { inputValue } = params;
                                        const isExisting = options.some((option) => inputValue === option.titulo);
                                        if (inputValue !== '' && !isExisting) {
                                            filtered.push({ inputValue, titulo: `Adicionar "${inputValue}"` });
                                        }
                                        return filtered;
                                    }}
                                    value={selectedImovel as ImovelOptionType | null}
                                    onChange={(_, newValue: any) => {
                                        if (newValue?.inputValue) setOpenImovelForm(true);
                                        else setSelectedImovel(newValue as Imovel);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Imóvel"
                                            required
                                            placeholder="Busque por título, endereço ou cidade..."
                                        />
                                    )}
                                    // 2. Personaliza a aparência de cada item na lista (Dropdown)
                                    renderOption={(props, option: ImovelOptionType) => (
                                        <li {...props} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                {option.inputValue ? (
                                                    <AddIcon color="secondary" sx={{ mr: 1 }} />
                                                ) : null}
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
                                <TextField select fullWidth label="Interesse" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                                    <MenuItem value="VENDA">Venda</MenuItem>
                                    <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                                </TextField>

                                <TextField select fullWidth label="Fase Inicial" value={status} onChange={(e) => setStatus(e.target.value as any)}>
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
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting || !selectedCliente?._id || !selectedImovel?._id}>
                        {submitting ? <CircularProgress size={24} /> : "Criar Negociação"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE CLIENTE */}
            <ClienteFormModal
                open={openClienteForm}
                onClose={() => setOpenClienteForm(false)}
                onSuccess={(novoCliente) => {
                    setOpenClienteForm(false);
                    fetchData();
                    if (novoCliente) setSelectedCliente(novoCliente);
                }}
            />

            {/* MODAL DE IMÓVEL - AGORA CONFIGURADO */}
            <ImovelFormModal
                open={openImovelForm}
                onClose={() => setOpenImovelForm(false)}
                onSuccess={(novoImovel) => {
                    setOpenImovelForm(false);
                    fetchData(); // Atualiza a lista de imóveis
                    if (novoImovel) setSelectedImovel(novoImovel); // Seleciona o imóvel recém-criado
                }}
            />
        </>
    );
};