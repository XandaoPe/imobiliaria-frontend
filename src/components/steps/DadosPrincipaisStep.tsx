import React, { useState, useEffect } from 'react';
import { Controller, Control, FieldErrors, useWatch } from 'react-hook-form';
import {
    TextField, MenuItem, Box, FormControl, InputLabel,
    Select, Switch, FormControlLabel, Typography,
    Checkbox, Autocomplete, CircularProgress, createFilterOptions,
    useTheme
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { ImovelFormData } from '../../types/imovel';
import { CurrencyFormatInput } from '../CurrencyFormatInput';
import api from '../../services/api';
import { Usuario } from '../../types/usuario';

interface Cliente {
    _id: string;
    nome: string;
    isNew?: boolean; // Flag para identificar a opção de adicionar
}

interface DadosPrincipaisStepProps {
    control: Control<ImovelFormData>;
    errors: FieldErrors<ImovelFormData>;
    onAddCliente: () => void;
}

const filter = createFilterOptions<Cliente>();

export const DadosPrincipaisStep: React.FC<DadosPrincipaisStepProps> = ({ control, errors, onAddCliente }) => {
    const theme = useTheme();
    const paraVenda = useWatch({ control, name: 'para_venda' });
    const paraAluguel = useWatch({ control, name: 'para_aluguel' });

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [corretores, setCorretores] = useState<Usuario[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [loadingCorretores, setLoadingCorretores] = useState(false);

    const fetchClientes = async () => {
        setLoadingClientes(true);
        try {
            const response = await api.get('/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
        } finally {
            setLoadingClientes(false);
        }
    };

    // src/components/imovel/steps/DadosPrincipaisStep.tsx

    const fetchCorretores = async () => {
        setLoadingCorretores(true);
        try {
            // ⭐️ Adicione query param para buscar todos os usuários
            const response = await api.get('/imoveis/usuarios/disponiveis', {
                params: { todos: true } // ⭐️ Busca todos os usuários
            });

            console.log('📊 Resposta bruta dos usuários:', response.data);

            const normalizedUsuarios = response.data.map((usuario: any) => ({
                ...usuario,
                id: usuario._id || usuario.id,
                _id: usuario._id || usuario.id
            }));

            console.log('📊 Usuários normalizados:', normalizedUsuarios);
            setCorretores(normalizedUsuarios);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setLoadingCorretores(false);
        }
    };

    useEffect(() => {
        fetchClientes();
        fetchCorretores();
    }, []);

    // Monitora quando a modal de cliente fecha para atualizar a lista local
    // (Isso garante que o novo cliente apareça na lista de opções do Autocomplete)
    useEffect(() => {
        const interval = setInterval(fetchClientes, 5000); // Poll básico ou use um evento global
        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>

            {/* Proprietário com funcionalidade de "+ ADICIONAR" */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' }, mt: 1 }}>
                <Controller
                    name="proprietario"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={clientes}
                            loading={loadingClientes}
                            getOptionLabel={(option) => option.nome || ""}
                            filterOptions={(options, params) => {
                                const filtered = filter(options, params);
                                const { inputValue } = params;

                                // Sempre oferece a opção de adicionar se não houver busca exata ou se a lista estiver vazia
                                filtered.push({
                                    _id: 'add-new-trigger',
                                    nome: inputValue ? `+ ADICIONAR "${inputValue}"` : '+ ADICIONAR NOVO CLIENTE',
                                    isNew: true
                                });

                                return filtered;
                            }}
                            value={clientes.find(c => c._id === field.value) || null}
                            onChange={(_, data) => {
                                if (data?.isNew) {
                                    onAddCliente();
                                } else {
                                    field.onChange(data ? data._id : '');
                                }
                            }}
                            isOptionEqualToValue={(option, value) => option._id === value?._id}
                            renderOption={(props, option) => (
                                <li {...props} style={{
                                    borderTop: option.isNew ? `1px solid ${theme.palette.divider}` : 'none',
                                    color: option.isNew ? theme.palette.primary.main : theme.palette.text.primary,
                                    fontWeight: option.isNew ? 'bold' : 'normal',
                                    backgroundColor: theme.palette.background.paper
                                }}>
                                    {option.isNew && <AddCircleOutlineIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />}
                                    {option.nome}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Proprietário (Cliente)"
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'background.paper'
                                        }
                                    }}
                                    error={!!errors.proprietario}
                                    helperText={errors.proprietario?.message}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loadingClientes ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    )}
                />
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' }, mt: 2 }}>
                <Controller
                    name="corretor"
                    control={control}
                    defaultValue={null}
                    render={({ field }) => {
                        console.log('🔍 Controller corretor - field:', field);

                        // ⭐️ Função auxiliar para encontrar pelo id ou _id
                        const findCorretor = (value: string | null | undefined) => {
                            if (!value) return null;
                            return corretores.find(c => c.id === value || c._id === value) || null;
                        };

                        const autocompleteValue = findCorretor(field.value);

                        return (
                            <Autocomplete
                                options={corretores}
                                loading={loadingCorretores}
                                getOptionLabel={(option) =>
                                    option && option.nome ? `${option.nome} (${option.perfil}) - ${option.email || ''}` : ''
                                }
                                value={autocompleteValue}
                                onChange={(_, data) => {
                                    console.log('🎯 Corretor selecionado:', data);

                                    // ⭐️ Pega o id (que agora sempre existe)
                                    const newValue = data ? data.id : null;
                                    console.log('🎯 Novo valor a ser definido:', newValue);

                                    field.onChange(newValue);

                                    setTimeout(() => {
                                        console.log('🎯 Valor APÓS o onChange:', field.value);
                                    }, 0);
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    // ⭐️ Compara por id
                                    return option?.id === value?.id;
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Corretor Responsável (Opcional)"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'background.paper'
                                            }
                                        }}
                                        error={!!errors.corretor}
                                        helperText={errors.corretor?.message}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loadingCorretores ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <li key={key} {...otherProps} style={{
                                            backgroundColor: theme.palette.background.paper,
                                            borderBottom: `1px solid ${theme.palette.divider}`
                                        }}>
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {option.nome}
                                                    <Typography component="span" variant="caption" sx={{
                                                        ml: 1,
                                                        color: option.perfil === 'CORRETOR' ? 'primary.main' :
                                                            option.perfil === 'GERENTE' ? 'warning.main' :
                                                                option.perfil === 'ADM_GERAL' ? 'error.main' : 'text.secondary'
                                                    }}>
                                                        ({option.perfil})
                                                    </Typography>
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {option.email}
                                                </Typography>
                                            </Box>
                                        </li>
                                    );
                                }}
                            />
                        );
                    }}
                />
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Título do Imóvel" fullWidth required sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper'
                            }
                        }} error={!!errors.titulo} helperText={errors.titulo?.message} margin="normal" />
                    )}
                />
            </Box>

            <Box>
                <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth margin="normal" required error={!!errors.tipo}>
                            <InputLabel id="tipo-label" sx={{ color: 'text.secondary' }}>Tipo do Imóvel</InputLabel>
                            <Select {...field} labelId="tipo-label" label="Tipo do Imóvel">
                                <MenuItem value="CASA">Casa</MenuItem>
                                <MenuItem value="APARTAMENTO">Apartamento</MenuItem>
                                <MenuItem value="TERRENO">Terreno</MenuItem>
                                <MenuItem value="COMERCIAL">Comercial</MenuItem>
                            </Select>
                            {errors.tipo && <Typography color="error" variant="caption">{errors.tipo.message}</Typography>}
                        </FormControl>
                    )}
                />
            </Box>

            <Box>
                <Controller
                    name="cidade"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Cidade/UF" fullWidth sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper'
                            }
                        }} margin="normal" value={field.value || ''} />
                    )}
                />
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Box sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2,
                    mb: 1,
                    mt: 1,
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
                }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
                        Finalidade do Imóvel
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Controller
                            name="para_venda"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} color="primary" />}
                                    label={
                                        <Typography sx={{ color: 'text.primary' }}>
                                            Para Venda
                                        </Typography>
                                    }
                                />
                            )}
                        />
                        <Controller
                            name="para_aluguel"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel control={<Checkbox checked={!!field.value} onChange={field.onChange} color="primary" />} label="Para Aluguel" />
                            )}
                        />
                    </Box>
                </Box>
            </Box>

            <Box>
                {paraVenda && (
                    <Controller
                        name="valor_venda"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput {...field} label="Valor da Venda (R$)" error={!!errors.valor_venda} helperText={errors.valor_venda?.message} required={!!paraVenda} />
                        )}
                    />
                )}
            </Box>

            <Box>
                {paraAluguel && (
                    <Controller
                        name="valor_aluguel"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput {...field} label="Valor do Aluguel (R$)" error={!!errors.valor_aluguel} helperText={errors.valor_aluguel?.message} required={!!paraAluguel} />
                        )}
                    />
                )}
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="endereco"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Endereço Completo" fullWidth required sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper'
                            }
                        }} error={!!errors.endereco} helperText={errors.endereco?.message} margin="normal" multiline rows={2} />
                    )}
                />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Controller
                    name="disponivel"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} color="primary" />} label={field.value ? "Disponível" : "Indisponível"} />
                    )}
                />
            </Box>
        </Box>
    );
};