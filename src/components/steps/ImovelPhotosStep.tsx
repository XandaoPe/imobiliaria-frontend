import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton,
    Card, CardContent, Alert, LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext'; // ⭐️ Verifique o caminho real para o seu AuthContext

// URL base do backend (ajuste conforme a sua)
const BASE_URL = 'http://localhost:5000';
const PHOTO_BASE_URL = `${BASE_URL}/uploads/imoveis`;

interface ImovelPhotosStepProps {
    imovelId?: string;
    currentPhotos: string[];
    onPhotosUpdate: (newPhotos: string[]) => void;
}

// Tipo para pré-visualização de upload
interface UploadPreview {
    url: string; // URL criada com URL.createObjectURL
    name: string; // Nome original do arquivo
    isUploading: boolean;
}

const ImovelPhotosStep: React.FC<ImovelPhotosStepProps> = ({ imovelId, currentPhotos, onPhotosUpdate }) => {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([]);

    const api = axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        },
    });

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !imovelId) return;

        const filesArray = Array.from(files);

        // 1. Cria as pré-visualizações (URL de Blob)
        const previews: UploadPreview[] = filesArray.map(file => ({
            url: URL.createObjectURL(file),
            name: file.name,
            isUploading: true,
        }));

        // Define os estados
        setFilesToUpload(filesArray);
        setUploadPreviews(previews);
        setUploading(true);
        setError(null);
        setProgress(0);

        const successfulUploadUrls: string[] = [];

        try {
            for (let i = 0; i < filesArray.length; i++) {
                const file = filesArray[i];
                const singleFormData = new FormData();
                singleFormData.append('file', file);

                setUploadPreviews(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, isUploading: true } : p
                ));

                await api.post(
                    `/imoveis/${imovelId}/upload-foto`,
                    singleFormData,
                    {
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total!
                            );
                            setProgress(Math.round(((i) + (percentCompleted / 100)) * (100 / filesArray.length)));
                        },
                    }
                );

                successfulUploadUrls.push(previews[i].url);
            }

            // 2. Atualiza a lista de fotos do imóvel
            const response = await api.get(`/imoveis/${imovelId}`);
            const updatedImovelPhotos = response.data.fotos || [];
            onPhotosUpdate(updatedImovelPhotos);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao fazer upload da(s) foto(s).';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);

        } finally {
            // 3. Limpa e revoga as URLs temporárias
            setUploading(false);
            setProgress(0);
            event.target.value = '';
            setFilesToUpload([]);
            setUploadPreviews([]);

            successfulUploadUrls.forEach(url => URL.revokeObjectURL(url));
        }
    };


    const handleDelete = async (filename: string) => {
        if (!imovelId) return;

        const isConfirmed = window.confirm(`Tem certeza que deseja remover a foto "${filename}"?`);
        if (!isConfirmed) return;

        try {
            await api.delete(`/imoveis/${imovelId}/foto/${filename}`);

            const newPhotos = currentPhotos.filter(p => p !== filename);
            onPhotosUpdate(newPhotos);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Erro ao remover a foto.';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        }
    };

    if (!imovelId) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                ⚠️ O imóvel precisa ser **salvo no banco de dados (Concluir)** antes que as fotos possam ser adicionadas.
            </Alert>
        );
    }

    // Combina as fotos existentes com as fotos em pré-visualização (se houver)
    const combinedPhotos = [
        // Fotos já salvas
        ...currentPhotos.map(filename => ({
            url: `${PHOTO_BASE_URL}/${filename}`,
            name: filename.substring(filename.lastIndexOf('-') + 1),
            isUploading: false,
            key: filename
        })),
        // Fotos em upload (pré-visualização)
        ...uploadPreviews.map(p => ({
            url: p.url,
            name: p.name,
            isUploading: p.isUploading,
            key: p.name,
        }))
    ];

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Gerenciamento de Fotos</Typography>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                >
                    Selecionar {combinedPhotos.length > 0 ? 'Mais' : ''} Fotos
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                    />
                </Button>
                {uploading && (
                    <Box sx={{ width: '100%', ml: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            Fazendo upload de {filesToUpload.length} arquivo(s)...
                        </Typography>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {combinedPhotos.length === 0 ? (
                <Alert severity="warning">Nenhuma foto adicionada ainda.</Alert>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                        },
                    }}
                >
                    {combinedPhotos.map((photo) => (
                        <Box key={photo.key}>
                            <Card sx={{ position: 'relative' }}>
                                {/* ⭐️ CORREÇÃO: Usando a tag <img> nativa para renderizar a Blob URL */}
                                <Box sx={{ height: 140, overflow: 'hidden' }}>
                                    <img
                                        src={photo.url}
                                        alt={`Foto ${photo.name}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            filter: photo.isUploading ? 'brightness(0.5)' : 'none'
                                        }}
                                    />
                                </Box>

                                {photo.isUploading ? (
                                    <Box
                                        sx={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center'
                                        }}
                                    >
                                        <LinearProgress color="secondary" sx={{ width: 100, mb: 1 }} />
                                        <Typography variant="caption" color="white">
                                            Enviando...
                                        </Typography>
                                    </Box>
                                ) : (
                                    <IconButton
                                        aria-label="excluir foto"
                                        onClick={() => handleDelete(photo.key)}
                                        disabled={uploading}
                                        sx={{
                                            position: 'absolute',
                                            top: 5, right: 5, zIndex: 1,
                                            color: 'white',
                                            backgroundColor: 'rgba(211, 47, 47, 0.8)',
                                            '&:hover': { backgroundColor: 'rgb(211, 47, 47)' },
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}

                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                    <Typography variant="caption" noWrap>
                                        {photo.name}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export { ImovelPhotosStep };