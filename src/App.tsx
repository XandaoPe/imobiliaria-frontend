// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Imports da Estrutura
import { appTheme } from './theme/theme'; // ⭐️ Importar o tema criado
import { AuthProvider, useAuth } from './contexts/AuthContext'; // ⭐️ O contexto de autenticação
import { MainLayout } from './layouts/MainLayout'; // ⭐️ O layout principal
import { LoginPage } from './pages/LoginPage'; // ⭐️ A página de login
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
    <ThemeProvider theme={appTheme}> {/* ⭐️ Aplica o tema MUI */}
      <CssBaseline /> {/* Reset CSS do MUI */}
      <BrowserRouter>
        <AuthProvider> {/* ⭐️ Provedor de autenticação */}
          <Routes>
            {/* 1. Rota de Login (Não protegida) */}
            <Route path="/" element={<LoginPage />} />

            {/* 2. Rotas Protegidas (Usam o MainLayout) */}
            {/* O elemento ProtectedRoute renderiza MainLayout com as rotas filhas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<h1>Dash Page Placeholder</h1>} />
              {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
              {/* Adicione rotas placeholder aqui */}
              <Route path="/clientes" element={<h1>Clientes Page Placeholder</h1>} />
              <Route path="/imoveis" element={<h1>Imóveis Page Placeholder</h1>} />
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