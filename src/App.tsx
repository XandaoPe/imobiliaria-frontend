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

// ⭐️ Importe os componentes das páginas
import { UsuariosPage } from './pages/UsuariosPage';
import { EmpresasPage } from './pages/EmpresasPage'; // ⭐️ NOVO: Importe a página de empresas

// Imports de outras páginas
import { ClientesPage } from './pages/ClientesPage';
import { ImoveisPage } from './pages/ImoveisPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';

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

            {/* ⭐️ ROTA PÚBLICA 1: LANDING PAGE (Página principal) */}
            <Route path="/" element={<LandingPage />} />
            {/* ⭐️ ROTA PÚBLICA 2: LOGIN PAGE (Movida para /login) */}
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/imoveis" element={<ImoveisPage />} />

              {/* NOVA ROTA: Empresas (Protegida pelo MainLayout e permissão de menu) */}
              <Route path="/empresas" element={<EmpresasPage />} />
              {/* ROTA DO MÓDULO DE USUÁRIOS */}
              <Route path="/usuarios" element={<UsuariosPage />} />
            </Route>

            {/* Rota para qualquer URL não mapeada (redireciona para o login/home se não for "/") */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;