import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, TextField, InputAdornment, Tooltip, IconButton
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel,
    GridRenderCellParams
} from '@mui/x-data-grid';
import HouseSidingIcon from '@mui/icons-material/HouseSiding';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// ⭐️ NOVO: Importações para o filtro segmentado
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Imovel, ImovelFormData } from '../types/imovel';
import { ImovelFormModal } from '../components/ImovelFormModal';


// Componente para Destaque de Texto (HighlightedText)
const HighlightedText: React.FC<{ text: string | null | undefined; highlight: string }> = ({ text, highlight }) => {

    const textToDisplay = text ?? '';

    if (!textToDisplay.trim() || !highlight.trim()) {
        return <>{textToDisplay}</>;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = textToDisplay.split(regex);

    return (
        <Typography component="span" variant="body2">
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </Typography>
    );
};
// FIM - HighlightedText

// Tipos para o filtro de status do Imóvel
type ImovelStatusFilter = 'TODOS' | 'DISPONIVEL' | 'INDISPONIVEL'; // <-- NOVO

const API_URL = 'http://localhost:5000/imoveis';

const DEBOUNCE_DELAY = 300;

export const ImoveisPage = () => {
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [imovelToEdit, setImovelToEdit] = useState<Imovel | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // ⭐️ NOVO ESTADO: Status de filtro do imóvel
    const [filterStatus, setFilterStatus] = useState<ImovelStatusFilter>('TODOS');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        descricao: false,
    });

    // ATUALIZADO: fetchImoveis agora aceita status de filtro
    const fetchImoveis = useCallback(async (search: string = '', status: ImovelStatusFilter = 'TODOS') => { // <-- ATUALIZADO
        try {
            setLoading(true);

            const params: { search?: string; status?: string } = {};
            if (search) {
                params.search = search;
            }
            // ⭐️ Envia o status para a API, exceto se for 'TODOS'
            if (status !== 'TODOS') {
                params.status = status;
            }

            const response = await axios.get(API_URL, {
                params: params // <-- ATUALIZADO
            });

            setImoveis(response.data as Imovel[]);
            setError(null);
        } catch (err: any) {
            let errorMessage = 'Falha ao carregar imóveis.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            setError(errorMessage);
            console.error("Erro ao buscar imóveis:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Efeito para debounce do campo de busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText]);

    // Dispara a busca quando o termo de busca OU o status de filtro muda
    useEffect(() => {
        fetchImoveis(debouncedSearchText, filterStatus); // <-- ATUALIZADO
    }, [fetchImoveis, debouncedSearchText, filterStatus]); // <-- ATUALIZADO

    // Efeito para manter o foco no campo de busca
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

    // ⭐️ NOVO HANDLER: Atualiza o status e dispara a busca (via useEffect)
    const handleStatusChange = (
        event: React.MouseEvent<HTMLElement>,
        newStatus: ImovelStatusFilter | null,
    ) => {
        if (newStatus !== null) {
            setFilterStatus(newStatus);
        }
    };

    const handleOpenCreate = () => {
        setImovelToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (imovel: Imovel) => {
        setImovelToEdit(imovel);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setImovelToEdit(null);
    };

    const handleDelete = async (imovelId: string, titulo: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o imóvel: "${titulo}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${imovelId}`);
            fetchImoveis(debouncedSearchText, filterStatus); // Recarrega com os filtros atuais
            alert('Imóvel excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao excluir imóvel.');
        }
    };

    // Função para formatar valor
    const formatValor = (valor: number): string => {
        return `R$ ${valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Mapeamento de tipos para exibição amigável
    const getTipoDisplay = (tipo: string): string => {
        const tipoMap: Record<string, string> = {
            'CASA': 'Casa',
            'APARTAMENTO': 'Apartamento',
            'TERRENO': 'Terreno',
            'COMERCIAL': 'Comercial'
        };
        return tipoMap[tipo] || tipo;
    };

    // Definição das colunas com tipagem explícita
    const columns: GridColDef<Imovel>[] = [
        {
            field: '_id',
            headerName: 'ID',
            width: 90,
            hideable: true
        },
        {
            field: 'titulo',
            headerName: 'Título',
            width: 250,
            renderCell: (params: GridRenderCellParams<Imovel>) => (
                <Typography
                    component="span"
                    variant="body2"
                    onClick={() => handleOpenEdit(params.row)}
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                            textDecoration: 'underline'
                        }
                    }}
                >
                    <HighlightedText
                        text={params.row.titulo}
                        highlight={debouncedSearchText}
                    />
                </Typography>
            ),
        },
        {
            field: 'tipo',
            headerName: 'Tipo',
            width: 130,
            valueGetter: (value, row) => getTipoDisplay(row.tipo)
        },
        {
            field: 'endereco',
            headerName: 'Endereço',
            width: 200,
            renderCell: (params: GridRenderCellParams<Imovel>) => (
                <HighlightedText
                    text={params.row.endereco}
                    highlight={debouncedSearchText}
                />
            ),
        },
        {
            field: 'valor',
            headerName: 'Valor (R$)',
            width: 150,
            valueGetter: (value, row) => formatValor(row.valor)
        },
        {
            field: 'disponivel',
            headerName: 'Status',
            width: 130,
            // ⭐️ O status na tela será "Disponível" ou "Indisponível"
            valueGetter: (value, row) => row.disponivel ? "Disponível" : "Indisponível",
            cellClassName: (params) => {
                // ⭐️ Classe para cor condicional
                return params.row.disponivel ? 'status-disponivel' : 'status-indisponivel';
            }
        },
        {
            field: 'descricao',
            headerName: 'Descrição',
            width: 300,
            hideable: true,
            renderCell: (params: GridRenderCellParams<Imovel>) => (
                <HighlightedText
                    text={params.row.descricao}
                    highlight={debouncedSearchText}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<Imovel>) => {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}
                    >

                        <Tooltip title="Editar Imóvel" arrow>
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEdit(params.row)}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'primary.main',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    }
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={`Excluir: ${params.row.titulo}`} arrow>
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(params.row._id, params.row.titulo)}
                                sx={{
                                    color: 'white',
                                    bgcolor: 'error.main',
                                    '&:hover': {
                                        bgcolor: 'error.dark',
                                    }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    if (loading && !debouncedSearchText && filterStatus === 'TODOS') { // Adicionado 'filterStatus'
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button
                    variant="contained"
                    onClick={() => fetchImoveis(debouncedSearchText, filterStatus)} // <-- ATUALIZADO
                >
                    Tentar Novamente
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gerenciamento de Imóveis
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<HouseSidingIcon />}
                    onClick={handleOpenCreate}
                >
                    Novo Imóvel
                </Button>
            </Box>

            {/* ⭐️ NOVO: Área de busca e filtros */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        label="Pesquisar Imóveis por Título, Endereço ou Descrição"
                        variant="outlined"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        inputRef={searchInputRef}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading && searchText ? <CircularProgress size={20} /> : <SearchIcon />}
                                </InputAdornment>
                            ),
                        }}
                        disabled={loading && !searchText}
                    />
                </Box>

                {/* ⭐️ NOVO COMPONENTE: ToggleButtonGroup para Filtro de Status */}
                <ToggleButtonGroup
                    value={filterStatus}
                    exclusive
                    onChange={handleStatusChange}
                    aria-label="Filtro de Status do Imóvel"
                    size="medium"
                    sx={{ height: 56, borderColor: 'rgba(0, 0, 0, 0.23)' }}
                >
                    <ToggleButton value="TODOS" aria-label="Todos">
                        Todos
                    </ToggleButton>
                    {/* O valor do ToggleButton deve ser o valor que o backend espera no query param */}
                    <ToggleButton value="DISPONIVEL" aria-label="Disponíveis">
                        Disponíveis
                    </ToggleButton>
                    <ToggleButton value="INDISPONIVEL" aria-label="Indisponíveis">
                        Indisponíveis
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            {/* Fim da área de busca e filtros */}

            <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={imoveis}
                    columns={columns}
                    pageSizeOptions={[10, 25, 50]}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    checkboxSelection
                    disableRowSelectionOnClick
                    getRowId={(row) => row._id}
                    loading={loading}
                    sx={{
                        '& .status-disponivel': {
                            color: 'success.main',
                            fontWeight: 'bold',
                        },
                        '& .status-indisponivel': {
                            color: 'error.main',
                            fontWeight: 'bold',
                        }
                    }}
                />
            </Paper>

            <ImovelFormModal
                open={openModal}
                onClose={handleClose}
                imovelToEdit={imovelToEdit}
                onSuccess={() => fetchImoveis(debouncedSearchText, filterStatus)} // <-- ATUALIZADO
            />
        </Box>
    );
};