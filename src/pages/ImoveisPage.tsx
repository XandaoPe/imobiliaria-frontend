import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, TextField, InputAdornment, Tooltip, IconButton, Menu, MenuItem,
    Checkbox
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
// ⭐️ NOVO: Importação para o ícone de filtro
import FilterListIcon from '@mui/icons-material/FilterList';

// Removemos a importação de ToggleButton e ToggleButtonGroup

import { Imovel, ImovelFormData } from '../types/imovel';
import { ImovelFormModal } from '../components/ImovelFormModal';
import api, { API_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ImovelImageTooltip } from '../components/ImovelImageTooltip';


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
type ImovelStatusFilter = 'TODOS' | 'DISPONIVEL' | 'INDISPONIVEL';


const DEBOUNCE_DELAY = 300;

export const ImoveisPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);
    const [imovelToEdit, setImovelToEdit] = useState<Imovel | null>(null);

    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    // Estado para o Menu de Filtro
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // <-- NOVO

    const [filterStatus, setFilterStatus] = useState<ImovelStatusFilter>('TODOS');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
        _id: false,
        descricao: false,
    });

    // Função para obter o label amigável do status (usado no botão)
    const getStatusLabel = (status: ImovelStatusFilter): string => {
        switch (status) {
            case 'TODOS': return 'Todos os Status';
            case 'DISPONIVEL': return 'Disponíveis';
            case 'INDISPONIVEL': return 'Indisponíveis';
            default: return 'Filtro de Status';
        }
    }


    const fetchImoveis = useCallback(async (search: string = '', status: ImovelStatusFilter = 'TODOS') => {
        try {
            setLoading(true);

            const params: { search?: string; status?: string } = {};
            if (search) {
                params.search = search;
            }
            // Envia o status para a API, exceto se for 'TODOS'
            if (status !== 'TODOS') {
                params.status = status;
            }

            const response = await api.get('/imoveis', { params });

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

    useEffect(() => {
        // ⭐️ SÓ dispara a busca se o contexto confirmar que o usuário está pronto
        if (isAuthenticated && user) {
            fetchImoveis(debouncedSearchText, filterStatus);
        }
    }, [fetchImoveis, debouncedSearchText, filterStatus, isAuthenticated, user]);

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
        fetchImoveis(debouncedSearchText, filterStatus);
    }, [fetchImoveis, debouncedSearchText, filterStatus]);

    // Efeito para manter o foco no campo de busca
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    });

    // Handlers para o Menu de Filtro
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => { // <-- NOVO
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => { // <-- NOVO
        setAnchorEl(null);
    };

    const handleStatusChange = (status: ImovelStatusFilter) => { // <-- ATUALIZADO
        setFilterStatus(status);
        handleMenuClose();
    };

    const handleOpenCreate = () => {
        setImovelToEdit(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (imovel: Imovel) => {
        console.log('🔍 Imóvel para editar completo:', imovel);
        console.log('🔍 Proprietário do imóvel:', imovel.proprietario);
        console.log('🔍 Tipo do proprietário:', typeof imovel.proprietario);

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
            await api.delete(`/imoveis/${imovelId}`);
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

    // Adicione estas colunas à definição existente:
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
                <ImovelImageTooltip
                    images={params.row.fotos} // Certifique-se que o campo no seu tipo Imovel chama-se 'imagens'
                    titulo={params.row.titulo}
                >
                    <Typography
                        component="span"
                        variant="body2"
                        onClick={() => handleOpenEdit(params.row)}
                        sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontWeight: '500', // Um pouco de destaque para o título
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
                </ImovelImageTooltip>
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
        // ⭐️ MANTENHA OS CAMPOS ORIGINAIS
        {
            field: 'aluguel',
            headerName: 'Aluguel (R$)',
            width: 150,
            valueGetter: (value, row) => formatValor(row.valor_aluguel || 0)
        },
        {
            field: 'valor',
            headerName: 'Valor (R$)',
            width: 150,
            valueGetter: (value, row) => formatValor(row.valor_venda || 0)
        },
        // ⭐️ NOVAS COLUNAS: Checkboxes
        {
            field: 'para_venda',
            headerName: 'Venda',
            width: 100,
            renderCell: (params: GridRenderCellParams<Imovel>) => (
                <Checkbox
                    checked={params.row.para_venda || false}
                    disabled
                    color="success"
                />
            ),
        },
        {
            field: 'para_aluguel',
            headerName: 'Aluguel',
            width: 100,
            renderCell: (params: GridRenderCellParams<Imovel>) => (
                <Checkbox
                    checked={params.row.para_aluguel || false}
                    disabled
                    color="primary"
                />
            ),
        },
        {
            field: 'disponivel',
            headerName: 'Status',
            width: 130,
            valueGetter: (value, row) => row.disponivel ? "Disponível" : "Indisponível",
            cellClassName: (params) => {
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

    if (loading && !debouncedSearchText && filterStatus === 'TODOS') {
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
                    onClick={() => fetchImoveis(debouncedSearchText, filterStatus)}
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

            {/* ⭐️ ÁREA DE BUSCA E FILTROS ATUALIZADA */}
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

                {/* ⭐️ NOVO: Botão e Menu para Filtro de Status (Escondido) */}
                <Tooltip title={`Status Atual: ${getStatusLabel(filterStatus)}`} arrow>
                    <Button
                        variant="outlined"
                        onClick={handleMenuOpen}
                        startIcon={<FilterListIcon />}
                        sx={{ height: 56, flexShrink: 0 }} // Para ter a mesma altura do TextField
                    >
                        {getStatusLabel(filterStatus)}
                    </Button>
                </Tooltip>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    // Posiciona o menu abaixo do botão
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem
                        onClick={() => handleStatusChange('TODOS')}
                        selected={filterStatus === 'TODOS'}
                    >
                        Todos os Status
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleStatusChange('DISPONIVEL')}
                        selected={filterStatus === 'DISPONIVEL'}
                    >
                        Disponíveis
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleStatusChange('INDISPONIVEL')}
                        selected={filterStatus === 'INDISPONIVEL'}
                    >
                        Indisponíveis
                    </MenuItem>
                </Menu>
                {/* Fim do Botão e Menu de Filtro */}

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
                onSuccess={() => fetchImoveis(debouncedSearchText, filterStatus)}
            />
        </Box>
    );
};