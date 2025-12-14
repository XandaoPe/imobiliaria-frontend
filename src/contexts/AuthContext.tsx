import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// 1. Interface para o Payload do Usuário (Tipagem baseada no seu NestJS)
export interface UsuarioPayload {
    userId: string; // ID do Usuário (Mapeado de 'sub' do JWT)
    nome: string;
    email: string;
    perfil: string;
    empresa: string; // Chave de Multitenancy (Mapeado de 'empresaId' do JWT)
}

// 2. Interface para o Contexto
interface AuthContextType {
    user: UsuarioPayload | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Função Auxiliar para Decodificar o Token JWT (Lado do Cliente)
// Esta função é o padrão para decodificar Base64 URL-Safe + UTF-8
const decodeToken = (token: string) => {
    try {
        // 1. Extrai a segunda parte (Payload)
        const base64Url = token.split('.')[1];

        // 2. Converte Base64 URL-safe para Base64 padrão
        // (Troca '-' por '+' e '_' por '/')
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // 3. Decodifica Base64 e garante o tratamento de UTF-8 (Acentos)
        const jsonPayload = decodeURIComponent(
            // a. atob decodifica Base64, resultando em uma string binária (raw)
            atob(base64)
                .split('')
                .map(function (c) {
                    // b. Mapeia cada caractere binário (byte) para sua representação hexadecimal (%XX)
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        // 4. Converte a string JSON (agora com acentos corretos) para objeto
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
    }
};

// 4. Provedor de Autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UsuarioPayload | null>(null);

    useEffect(() => {
        if (token) {
            const payloadDecoded = decodeToken(token); // Nome alterado para evitar confusão

            console.log('Decoded Payload:', payloadDecoded);

            // ⭐️ CORREÇÃO DO MAPEAMENTO AQUI
            if (payloadDecoded && payloadDecoded.sub) {

                // Mapeia as chaves do JWT (sub, empresaId) para a interface local (userId, empresa)
                const mappedPayload: UsuarioPayload = {
                    // Mapeamento essencial para resolver o 'undefined'
                    userId: payloadDecoded.sub,

                    // Outras propriedades
                    nome: payloadDecoded.nome || '',
                    email: payloadDecoded.email || '',
                    perfil: payloadDecoded.perfil || '',
                    empresa: payloadDecoded.empresaId || '', // Mapeia empresaId para 'empresa'
                };

                setUser(mappedPayload);

                // ⭐️ Configura o cabeçalho padrão do Axios para TODAS as requisições
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                // Token inválido ou sem ID (sub), força logout
                logout();
            }
        } else {
            // Limpa o cabeçalho se não houver token
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]); // Dependência de token é importante

    // Função chamada após a autenticação bem-sucedida (da LoginPage)
    const login = (jwtToken: string) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // O useEffect cuidará de remover o header do Axios
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 5. Hook Customizado para usar o Contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};