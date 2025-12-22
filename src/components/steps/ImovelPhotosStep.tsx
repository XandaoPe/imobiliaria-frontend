import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton,
    Card, CardContent, Alert, LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext'; // ⭐️ Verifique o caminho real para o seu AuthContext
import { API_URL } from '../../services/api';

// URL base do backend (ajuste conforme a sua)
const BASE_URL = API_URL;
// const PHOTO_BASE_URL = `${BASE_URL}/uploads/imoveis`;

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
    const { user } = useAuth();
    const token = user?.token || null;
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
            // ⭐️ VERIFICAÇÃO EXTRA: Se não houver imovelId, nem tenta
            if (!files || files.length === 0 || !imovelId || imovelId === "undefined") {
                setError("ID do imóvel inválido para upload.");
                return;
            }

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

                // ⭐️ IMPORTANTE: Use a instância global da sua API ou passe o token explicitamente
                // para evitar que o axios.create() use um token vazio
                await axios.post(
                    `${API_URL}/imoveis/${imovelId}/upload-foto`,
                    singleFormData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        },
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
            console.error("Erro detalhado no upload:", err.response?.data); // Isso vai te mostrar o erro real no F12 do navegador
            setError(err.response?.data?.message || 'Erro ao fazer upload.');

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


    const handleDelete = async (photoUrl: string) => {
        const isConfirmed = window.confirm(`Deseja remover esta foto?`);
        if (!isConfirmed) return;

        try {
            // Usamos encodeURIComponent porque a URL tem caracteres especiais (/, :, .)
            await api.delete(`/imoveis/${imovelId}/foto/${encodeURIComponent(photoUrl)}`);

            const newPhotos = currentPhotos.filter(p => p !== photoUrl);
            onPhotosUpdate(newPhotos);
        } catch (err) {
            setError('Erro ao remover a foto.');
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
        // Fotos já salvas (vêm do backend como URLs completas)
        ...currentPhotos.map(url => {
            // Tenta extrair um nome amigável da URL para exibição
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];

            return {
                url: url, // ⭐️ Agora usamos a URL pura que vem do banco
                name: fileName,
                isUploading: false,
                key: url
            };
        }),
        // Fotos em upload (pré-visualização via Blob)
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