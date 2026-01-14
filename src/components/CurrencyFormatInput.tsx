import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TextField, SxProps, Theme } from '@mui/material';

interface CustomProps {
    onChange: (event: { target: { name: string; value: number } }) => void;
    name: string;
}

const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
    function NumericFormatCustom(props, ref) {
        const { onChange, ...other } = props;

        const handleValueChange: NumericFormatProps['onValueChange'] = (values) => {
            onChange({
                target: {
                    name: props.name,
                    value: values.floatValue ?? 0,
                },
            });
        };

        return (
            <NumericFormat
                {...other}
                getInputRef={ref}
                onValueChange={handleValueChange}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
            />
        );
    },
);

interface CurrencyFormatInputProps {
    name: string;
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    error?: boolean;
    helperText?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    size?: 'small' | 'medium'; // Adicionado
    sx?: SxProps<Theme>; // Adicionado para controle fino de layout
}

export const CurrencyFormatInput: React.FC<CurrencyFormatInputProps> = ({
    name,
    label,
    value,
    onChange,
    error,
    helperText,
    required = false,
    disabled = false,
    onFocus,
    size = 'small',
    sx
}) => {
    const displayValue = value === null ? '' : String(value);

    return (
        <TextField
            label={label}
            fullWidth
            required={required}
            error={error}
            helperText={helperText}
            size={size}
            margin="none" // Alterado de "normal" para "none" para comprimir o espaço
            disabled={disabled}
            onFocus={onFocus}
            sx={sx}
            InputProps={{
                inputComponent: NumericFormatCustom as any,
                inputProps: {
                    name: name,
                    value: displayValue,
                    onChange: (e: any) => {
                        const numValue = e.target.value === '' ? null : Number(e.target.value);
                        onChange(numValue);
                    },
                }
            }}
            value={displayValue}
        />
    );
};