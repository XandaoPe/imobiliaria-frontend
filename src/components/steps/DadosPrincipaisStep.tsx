import React, { useState, useEffect } from 'react';
import { Controller, Control, FieldErrors, useWatch } from 'react-hook-form';
import {
    TextField,
    MenuItem,
    Box,
    FormControl,
    InputLabel,
    Select,
    Switch,
    FormControlLabel,
    Typography,
    Checkbox,
    Autocomplete,
    CircularProgress
} from '@mui/material';
import { ImovelFormData } from '../../types/imovel';
import { CurrencyFormatInput } from '../CurrencyFormatInput';
import api from '../../services/api';

interface Cliente {
    _id: string;
    nome: string;
}

interface DadosPrincipaisStepProps {
    control: Control<ImovelFormData>;
    errors: FieldErrors<ImovelFormData>;
}

export const DadosPrincipaisStep: React.FC<DadosPrincipaisStepProps> = ({ control, errors }) => {
    const paraVenda = useWatch({ control, name: 'para_venda' });
    const paraAluguel = useWatch({ control, name: 'para_aluguel' });

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    useEffect(() => {
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
        fetchClientes();
    }, []);

    return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                {/* Seleção do Proprietário */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' }, mt: 1 }}>
                <Controller
                    name="proprietario"
                    control={control}
                    render={({ field }) => {
                        return (
                            <Autocomplete
                                options={clientes}
                                getOptionLabel={(option) => option.nome}
                                loading={loadingClientes}
                                value={
                                    clientes.find(cliente => cliente._id === field.value) || null
                                }
                                onChange={(_, data) => {
                                    field.onChange(data ? data._id : '');
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    return option._id === value?._id;
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Proprietário (Cliente)"
                                        required
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
                        );
                    }}
                />
                </Box>

            {/* Título */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Título do Imóvel"
                            fullWidth
                            required
                            error={!!errors.titulo}
                            helperText={errors.titulo?.message}
                            margin="normal"
                        />
                    )}
                />
            </Box>

            {/* Tipo */}
            <Box>
                <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth margin="normal" required error={!!errors.tipo}>
                            <InputLabel id="tipo-label">Tipo do Imóvel</InputLabel>
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

            {/* Cidade */}
            <Box>
                <Controller
                    name="cidade"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Cidade"
                            fullWidth
                            margin="normal"
                            value={field.value || ''}
                        />
                    )}
                />
            </Box>

            {/* Finalidade do Imóvel */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 1, mt: 1, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Finalidade do Imóvel</Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Controller
                            name="para_venda"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox checked={!!field.value} onChange={field.onChange} color="primary" />}
                                    label="Para Venda"
                                />
                            )}
                        />
                        <Controller
                            name="para_aluguel"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox checked={!!field.value} onChange={field.onChange} color="primary" />}
                                    label="Para Aluguel"
                                />
                            )}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Valor Venda */}
            <Box>
                {paraVenda && (
                    <Controller
                        name="valor_venda"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput
                                {...field}
                                label="Valor da Venda (R$)"
                                error={!!errors.valor_venda}
                                helperText={errors.valor_venda?.message}
                                required={!!paraVenda}
                            />
                        )}
                    />
                )}
            </Box>

            {/* Valor Aluguel */}
            <Box>
                {paraAluguel && (
                    <Controller
                        name="valor_aluguel"
                        control={control}
                        render={({ field }) => (
                            <CurrencyFormatInput
                                {...field}
                                label="Valor do Aluguel (R$)"
                                error={!!errors.valor_aluguel}
                                helperText={errors.valor_aluguel?.message}
                                required={!!paraAluguel}
                            />
                        )}
                    />
                )}
            </Box>

            {/* Endereço */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Controller
                    name="endereco"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Endereço Completo"
                            fullWidth
                            required
                            error={!!errors.endereco}
                            helperText={errors.endereco?.message}
                            margin="normal"
                            multiline
                            rows={2}
                        />
                    )}
                />
            </Box>

            {/* Disponibilidade */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Controller
                    name="disponivel"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={<Switch checked={!!field.value} onChange={field.onChange} color="primary" />}
                            label={field.value ? "Disponível" : "Indisponível"}
                        />
                    )}
                />
            </Box>
        </Box>
    );
};