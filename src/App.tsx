// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Imports da Estrutura
import { appTheme } from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';

// ⭐️ Importe o componente da página de Usuários
import { UsuariosPage } from './pages/UsuariosPage';

// Imports de outras páginas
import { ClientesPage } from './pages/ClientesPage';
import { ImoveisPage } from './pages/ImoveisPage';
// import { DashboardPage } from './pages/DashboardPage'; // ⭐️ Crie esta página simples

// -----------------------------------------------------------
// Componente de Rota Protegida (Redireciona se não estiver autenticado)
// -----------------------------------------------------------
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redireciona para o login se não houver token
    return <Navigate to="/" replace />;
  }

  // Se autenticado, renderiza o MainLayout, que por sua vez renderiza a rota filha via <Outlet />
  return <MainLayout />;
};

// -----------------------------------------------------------
// Componente Principal
// -----------------------------------------------------------
const App = () => {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* 1. Rota de Login (Não protegida) */}
            <Route path="/" element={<LoginPage />} />

            {/* 2. Rotas Protegidas (Usam o MainLayout) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<h1>Dash Page Placeholder</h1>} />

              {/* ⭐️ Rota Clientes REAL */}
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/imoveis" element={<ImoveisPage />} />

              {/* ⭐️ ROTA DO MÓDULO DE USUÁRIOS */}
              <Route path="/usuarios" element={<UsuariosPage />} />

            </Route>

            {/* Rota para qualquer URL não mapeada */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;