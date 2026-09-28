/**
 * Componentes de Autenticación
 */

import { useState, useEffect } from 'react';
import type { AuthState, Asesor } from '../../domain/models/types';
import { getAsesores, isConfigured } from '../../data/api/client';

interface LoginScreenProps {
  onLogin: (auth: AuthState) => void;
  onAdminAccess?: () => void;
}

export function LoginScreen({ onLogin, onAdminAccess }: LoginScreenProps) {
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<Asesor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAsesores();
  }, []);

  const cargarAsesores = async () => {
    setLoading(true);
    const res = await getAsesores();
    if (res.asesores) setAsesores(res.asesores);
    else setError(res.error || 'Error al cargar asesores');
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asesorSeleccionado) {
      setError('Seleccione su nombre');
      return;
    }
    onLogin({
      id: String(asesorSeleccionado.id),
      nombre: asesorSeleccionado.nombre,
      email: asesorSeleccionado.correo,
      rol: 'asesor',
      sucursal: asesorSeleccionado.sucursal
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-changan-blue shadow-xl mb-4">
            <i className="fas fa-truck-fast text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-changan-blue">CEDIS Changan</h1>
          <p className="text-gray-500 mt-1">Sistema de Captura de Pedidos — Panamá</p>
        </div>

        <div className="glass-card rounded-2xl p-8 fade-in">
          <h2 className="text-xl font-bold text-changan-blue mb-6 flex items-center gap-2">
            <i className="fas fa-sign-in-alt text-changan-accent"></i>
            Iniciar Sesión
          </h2>

          {!isConfigured() && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-xl text-sm text-yellow-800 flex items-center gap-2">
              <i className="fas fa-flask"></i>
              <span><strong>Modo Demo:</strong> Usando datos de prueba.</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-changan-accent text-3xl mb-3"></i>
              <p className="text-gray-500">Cargando asesores...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <i className="fas fa-user text-gray-400 mr-1"></i> Seleccione su nombre
                </label>
                <select
                  value={asesorSeleccionado?.id || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    setAsesorSeleccionado(asesores.find(a => a.id === id) || null);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-changan-accent/30 focus:border-changan-accent outline-none"
                >
                  <option value="">— Seleccionar asesor —</option>
                  {asesores.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} — {a.sucursal}</option>
                  ))}
                </select>
              </div>

              {asesorSeleccionado && (
                <div className="bg-changan-light rounded-xl p-4 fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-changan-accent rounded-full flex items-center justify-center text-white font-bold">
                      {asesorSeleccionado.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-changan-blue">{asesorSeleccionado.nombre}</p>
                      <p className="text-xs text-gray-600">{asesorSeleccionado.cargo}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Sucursal:</span>
                      <p className="font-medium text-changan-blue">{asesorSeleccionado.sucursal}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Depto:</span>
                      <p className="font-medium">{asesorSeleccionado.departamento}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!asesorSeleccionado}
                className="btn-primary w-full text-white py-3 rounded-xl font-medium disabled:opacity-60"
              >
                <i className="fas fa-arrow-right mr-2"></i>Ingresar al Sistema
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <p className="text-xs text-gray-400">v2.0 — CEDIS Changan Panamá</p>
          {onAdminAccess && (
            <>
              <span className="text-gray-300">|</span>
              <button
                onClick={onAdminAccess}
                className="text-xs text-gray-500 hover:text-red-600 hover:underline flex items-center gap-1"
              >
                <i className="fas fa-user-shield"></i> Acceso Administrador
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== ADMIN LOGIN ==========

interface AdminLoginProps {
  onLogin: (auth: AuthState) => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'changan2525') {
        onLogin({
          id: 'admin',
          nombre: 'Administrador',
          email: 'admin@changanpanama.com',
          rol: 'admin',
          sucursal: 'Administración Central'
        });
      } else {
        setError('Credenciales incorrectas');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-900 to-changan-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-xl mb-4">
            <i className="fas fa-user-shield text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-gray-400 mt-1">CEDIS Changan Panamá</p>
        </div>

        <div className="glass-card rounded-2xl p-8 fade-in">
          <h2 className="text-xl font-bold text-changan-blue mb-6 flex items-center gap-2">
            <i className="fas fa-lock text-red-600"></i>
            Acceso de Administrador
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <i className="fas fa-user text-gray-400 mr-1"></i> Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <i className="fas fa-key text-gray-400 mr-1"></i> Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium disabled:opacity-60"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Verificando...</>
              ) : (
                <><i className="fas fa-sign-in-alt mr-2"></i>Acceder al Panel</>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 mx-auto"
          >
            <i className="fas fa-arrow-left"></i>
            Volver al login de asesores
          </button>
        </div>
      </div>
    </div>
  );
}
