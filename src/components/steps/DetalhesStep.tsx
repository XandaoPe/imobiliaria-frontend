// src/components/steps/DetalhesStep.tsx
import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
    TextField,
    Box,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { ImovelFormData } from '../../types/imovel';

interface DetalhesStepProps {
    control: Control<ImovelFormData>;
    errors: FieldErrors<ImovelFormData>;
}

export const DetalhesStep: React.FC<DetalhesStepProps> = ({ control, errors }) => {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            {/* Descrição */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 4' } }}>
                <Controller
                    name="descricao"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Descrição"
                            fullWidth
                            multiline
                            rows={3}
                            error={!!errors.descricao}
                            helperText={errors.descricao?.message}
                            margin="normal"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                        />
                    )}
                />
            </Box>

            {/* Detalhes */}
            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 4' } }}>
                <Controller
                    name="detalhes"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Detalhes (características extras)"
                            fullWidth
                            multiline
                            rows={2}
                            error={!!errors.detalhes}
                            helperText={errors.detalhes?.message}
                            margin="normal"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                        />
                    )}
                />
            </Box>

            {/* Quartos */}
            <Box>
                <Controller
                    name="quartos"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Quartos"
                            fullWidth
                            type="number"
                            error={!!errors.quartos}
                            helperText={errors.quartos?.message}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1
                                }
                            }}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </Box>

            {/* Banheiros */}
            <Box>
                <Controller
                    name="banheiros"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Banheiros"
                            fullWidth
                            type="number"
                            error={!!errors.banheiros}
                            helperText={errors.banheiros?.message}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1
                                }
                            }}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </Box>
            {/* Área Terreno */}
            <Box>
                <Controller
                    name="area_terreno"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Terreno(m²)"
                            fullWidth
                            type="number"
                            error={!!errors.area_terreno}
                            helperText={errors.area_terreno?.message}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1
                                }
                            }}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </Box>

            {/* Área Construida */}
            <Box>
                <Controller
                    name="area_construida"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Construção(m²)"
                            fullWidth
                            type="number"
                            error={!!errors.area_construida}
                            helperText={errors.area_construida?.message}
                            InputProps={{
                                inputProps: {
                                    min: 0,
                                    step: 1
                                }
                            }}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </Box>

            {/* Garagem */}
            <Box>
                <Controller
                    name="garagem"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    color="primary"
                                />
                            }
                            label="Possui Garagem"
                        />
                    )}
                />
            </Box>
        </Box>
    );
};