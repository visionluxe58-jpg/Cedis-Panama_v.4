/**
 * App Principal - Router y Autenticación
 */

import { useState } from 'react';
import type { AuthState } from './domain/models/types';
import { LoginScreen, AdminLogin } from './presentation/components/Auth';
import { DashboardAsesor } from './presentation/components/DashboardAsesor';
import AdminDashboard from './presentation/components/AdminDashboard';

type AppView = 'login' | 'adminLogin' | 'dashboardAsesor' | 'dashboardAdmin';

const STORAGE_AUTH_KEY = 'cedis_auth_session';
const STORAGE_VIEW_KEY = 'cedis_app_view';

export default function App() {
  // Inicialización persistente de la sesión de autenticación
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.id && parsed.rol) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error recuperando sesión guardada:', e);
    }
    return null;
  });

  // Inicialización persistente de la vista activa según la sesión
  const [view, setView] = useState<AppView>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.rol === 'admin') return 'dashboardAdmin';
        if (parsed && parsed.rol === 'asesor') return 'dashboardAsesor';
      }
      const savedView = localStorage.getItem(STORAGE_VIEW_KEY) as AppView;
      if (savedView && (savedView === 'adminLogin' || savedView === 'login')) {
        return savedView;
      }
    } catch (e) {
      console.warn('Error recuperando vista activa:', e);
    }
    return 'login';
  });

  const handleLogin = (authData: AuthState) => {
    setAuth(authData);
    const targetView: AppView = authData.rol === 'admin' ? 'dashboardAdmin' : 'dashboardAsesor';
    setView(targetView);
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authData));
      localStorage.setItem(STORAGE_VIEW_KEY, targetView);
    } catch (e) {
      console.warn('Error guardando sesión:', e);
    }
  };

  const handleLogout = () => {
    setAuth(null);
    setView('login');
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      localStorage.removeItem(STORAGE_VIEW_KEY);
      localStorage.removeItem('cedis_admin_active_tab');
    } catch (e) {
      console.warn('Error cerrando sesión:', e);
    }
  };

  return (
    <>
      {view === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onAdminAccess={() => {
            setView('adminLogin');
            try { localStorage.setItem(STORAGE_VIEW_KEY, 'adminLogin'); } catch {}
          }}
        />
      )}

      {view === 'adminLogin' && (
        <AdminLogin
          onLogin={handleLogin}
          onBack={() => {
            setView('login');
            try { localStorage.setItem(STORAGE_VIEW_KEY, 'login'); } catch {}
          }}
        />
      )}

      {view === 'dashboardAsesor' && auth && (
        <DashboardAsesor
          auth={auth}
          onLogout={handleLogout}
        />
      )}

      {view === 'dashboardAdmin' && auth && (
        <AdminDashboard
          auth={auth}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
