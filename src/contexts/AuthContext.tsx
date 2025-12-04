// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// 1. Interface para o Payload do Usuário (Tipagem baseada no seu NestJS)
export interface UsuarioPayload {
    userId: string;
    email: string;
    perfil: string;
    empresa: string; // Chave de Multitenancy
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
const decodeToken = (token: string): UsuarioPayload | null => {
    try {
        const payloadBase64 = token.split('.')[1];
        // Decodifica a string Base64 e faz o parse para JSON
        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);

        // Mapeia as propriedades do token para a interface UsuarioPayload
        return {
            userId: payload.sub, // 'sub' é geralmente o ID do usuário
            email: payload.email,
            perfil: payload.perfil,
            // Mapeamento flexível caso o backend use 'empresa' ou 'empresaId'
            empresa: payload.empresa || payload.empresaId,
        };
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
};

// 4. Provedor de Autenticação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UsuarioPayload | null>(null);

    useEffect(() => {
        if (token) {
            const payload = decodeToken(token);
            if (payload) {
                setUser(payload);
                // ⭐️ Configura o cabeçalho padrão do Axios para TODAS as requisições
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                // Token inválido, força logout (ex: token alterado manualmente)
                logout();
            }
        } else {
            // Limpa o cabeçalho se não houver token
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

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