/**
 * App Principal - Router y Autenticación
 */

import { useState } from 'react';
import type { AuthState } from './domain/models/types';
import { LoginScreen, AdminLogin } from './presentation/components/Auth';
import { DashboardAsesor } from './presentation/components/DashboardAsesor';
import AdminDashboard from './presentation/components/AdminDashboard';

type AppView = 'login' | 'adminLogin' | 'dashboardAsesor' | 'dashboardAdmin';

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [auth, setAuth] = useState<AuthState | null>(null);

  const handleLogin = (authData: AuthState) => {
    setAuth(authData);
    setView(authData.rol === 'admin' ? 'dashboardAdmin' : 'dashboardAsesor');
  };

  const handleLogout = () => {
    setAuth(null);
    setView('login');
  };

  return (
    <>
      {view === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onAdminAccess={() => setView('adminLogin')}
        />
      )}

      {view === 'adminLogin' && (
        <AdminLogin
          onLogin={handleLogin}
          onBack={() => setView('login')}
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
