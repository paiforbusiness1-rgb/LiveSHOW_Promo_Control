
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Registration, RegistrationStatus, ScanResult, AppNotification, User, UserRole } from './types';
import { db } from './services/databaseService';
import { db as firestoreDb } from './services/firebaseConfig';
import { notificationService } from './services/notificationService';
import { userService } from './services/userService';
import { analyzeAttendance } from './services/geminiService';
import Scanner from './components/Scanner';
import { StatsCard } from './components/StatsCard';
import { DiagnosticPanel } from './components/DiagnosticPanel';

// Icons
const QRIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const RobotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;
const GiftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125Z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// -----------------------
// NOTIFICATION TOAST COMPONENT
// -----------------------
function NotificationToast() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter(n => n.id !== notification.id));
      }, 4000);
    });
    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md flex items-start gap-3 animate-fade-in-down transition-all
            ${n.type === 'success' ? 'bg-green-900/90 border-green-500 text-white' :
              n.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' :
              n.type === 'warning' ? 'bg-orange-900/90 border-orange-500 text-white' :
              'bg-gray-800/90 border-gray-600 text-gray-200'}`}
        >
          <div className={`mt-1 p-1 rounded-full 
            ${n.type === 'success' ? 'bg-green-500' :
              n.type === 'error' ? 'bg-red-500' :
              n.type === 'warning' ? 'bg-orange-500' : 'bg-gray-500'}`}>
            {n.type === 'success' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            {n.type === 'error' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
            {n.type === 'warning' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            {n.type === 'info' && <BellIcon />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold leading-none mb-1">{n.title}</h4>
            <p className="text-xs opacity-90 leading-tight">{n.message}</p>
            <span className="text-[9px] opacity-60 mt-1 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// -----------------------
// LOGIN COMPONENT
// -----------------------
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }

    const result = await userService.login(username, password);
    
    if (result.success && result.user) {
      notificationService.notify('success', 'Bienvenido', `Hola ${result.user.name}!`);
      onLogin(result.user);
      
      // Redirigir STAFF automáticamente a /validate
      if (result.user.role === UserRole.STAFF) {
        setTimeout(() => {
          navigate('/validate', { replace: true });
        }, 100);
      }
    } else {
      setError(result.message || 'Credenciales incorrectas.');
      notificationService.notify('error', 'Error de Login', result.message || 'Credenciales incorrectas.');
    }
    
    setLoading(false);
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-6 w-full relative">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-4 shadow-lg shadow-brand-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">LiveSHOW Access</h1>
          <p className="text-gray-400 text-sm mt-2">Ingresa tus credenciales para acceder.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-gray-400 uppercase mb-1">Usuario</label>
            <input 
              type="text" 
              id="username"
              required
              autoComplete="username"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-400 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              id="password"
              required
              autoComplete="current-password"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold py-3 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <div className="mt-6 text-center">
           <a 
             href="https://fresh-richie.vercel.app/"
             target="_blank"
             rel="noopener noreferrer"
             className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors inline-flex items-center justify-center gap-1"
           >
             fresh-richie.vercel.app
             <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
           </a>
        </div>
      </div>

      <div className="absolute bottom-6 text-center animate-fade-in">
         <span className="text-[10px] text-gray-600">Powered by </span>
         <a 
           href="https://www.pai-b.com/"
           target="_blank"
           rel="noopener noreferrer"
           className="text-[10px] font-bold text-brand-500/50 hover:text-brand-400 transition-colors"
         >
           pai-b
         </a>
      </div>
    </div>
  );
}

// -----------------------
// DASHBOARD COMPONENT
// -----------------------
function Dashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usar suscripción en tiempo real en lugar de polling
    const unsubscribe = db.subscribeToRegistrations((data) => {
      setRegistrations(data);
      setLoading(false);
    });

    // Cleanup al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Sincronizando datos...</div>;

  const total = registrations.length;
  const validated = registrations.filter(r => r.status === RegistrationStatus.VALIDATED).length;
  const pending = registrations.filter(r => r.status === RegistrationStatus.PENDING).length;

  return (
    <div className="space-y-6 p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-500">
          Tiempo Real
        </h1>
        <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <div className="text-xs text-gray-400 font-mono">LIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <StatsCard 
          title="Aforo Total" 
          value={total} 
          icon={<ListIcon />}
          colorClass="bg-blue-900/30 text-blue-400" 
        />
        <StatsCard 
          title="Adentro" 
          value={validated} 
          icon={<CheckIcon />}
          colorClass="bg-brand-900/30 text-brand-400" 
        />
        <StatsCard 
          title="Por Ingresar" 
          value={pending} 
          icon={<XIcon />}
          colorClass="bg-orange-900/30 text-orange-400" 
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Validaciones Recientes</h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-500">Sincronizado</span>
            </div>
        </div>
        
        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
          {registrations
            .filter(r => r.status === RegistrationStatus.VALIDATED)
            .sort((a, b) => new Date(b.validationTime || 0).getTime() - new Date(a.validationTime || 0).getTime())
            .slice(0, 10)
            .map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${r.ticketType === 'PROMO' ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {r.ticketType.substring(0,1)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{r.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(r.validationTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>•</span>
                        <span className="text-brand-500/80">{r.validatedBy || 'Sistema'}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded border font-bold
                    ${r.ticketType === 'PROMO' ? 'bg-pink-900/20 text-pink-400 border-pink-900/50' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                  {r.ticketType}
                </span>
              </div>
            ))}
            {validated === 0 && <div className="text-center py-8 text-gray-600">Esperando asistentes...</div>}
        </div>
      </div>

      <div className="flex justify-center pt-2 pb-4">
        <a 
          href="https://fresh-richie.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/40 border border-gray-700/50 hover:border-brand-500/30 hover:bg-gray-800 transition-all group"
        >
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-brand-400 tracking-widest uppercase">Fresh Richie</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-gray-600 group-hover:text-brand-400">
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// -----------------------
// ADMIN PANEL COMPONENT
// -----------------------
function AdminPanel({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: UserRole.STAFF as UserRole
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await userService.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await userService.createUser(
      newUser.username,
      newUser.password,
      newUser.name,
      newUser.role
    );
    
    if (result.success) {
      setShowCreateForm(false);
      setNewUser({ username: '', password: '', name: '', role: UserRole.STAFF });
      loadUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      await userService.deleteUser(userId, currentUser.id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col w-full p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="text-gray-400 text-xs mt-1">Gestiona usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg"
        >
          {showCreateForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Ej: Juan Staff"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Usuario</label>
              <input
                type="text"
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase() })}
                placeholder="nombreusuario"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={4}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Rol</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              >
                <option value={UserRole.STAFF}>Staff</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
            >
              Crear Usuario
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Cargando usuarios...</div>
        ) : (
          <div className="space-y-2 p-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${user.role === UserRole.ADMIN ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>@{user.username}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold
                        ${user.role === UserRole.ADMIN ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50' : 'bg-gray-700 text-gray-400'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
                {user.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-600">No hay usuarios registrados.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------
// LIST VIEW COMPONENT
// -----------------------
function RegistrationList() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filter, setFilter] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    db.getAllRegistrations().then(setRegistrations);
  }, []);

  const filtered = registrations.filter(r => 
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    r.email.toLowerCase().includes(filter.toLowerCase()) ||
    r.id.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeAttendance(registrations);
    setGeminiAnalysis(result);
    setAnalyzing(false);
  };

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4 h-full flex flex-col w-full p-5">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Base de Datos</h1>
        <button 
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
        >
          <RobotIcon />
          {analyzing ? '...' : 'Gemini AI'}
        </button>
      </div>

      {/* Gemini Analysis Box */}
      {geminiAnalysis && (
        <div className="bg-gray-800/80 border border-indigo-500/30 rounded-xl p-4 mb-4 animate-fade-in relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <h3 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
            <RobotIcon /> Reporte de Asistencia
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {geminiAnalysis}
          </div>
          <button onClick={() => setGeminiAnalysis(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white">
              <XIcon />
          </button>
        </div>
      )}

      <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar asistente..." 
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="absolute left-3 top-3.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          </div>
          {filter && (
            <button 
              onClick={() => setFilter('')}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800 text-gray-200 uppercase font-medium text-xs sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-4 py-3">Asistente</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(r => (
              <React.Fragment key={r.id}>
              <tr 
                onClick={() => toggleRow(r.id)}
                className={`transition-colors group cursor-pointer border-b border-gray-800 last:border-0 
                    ${expandedId === r.id ? 'bg-gray-800 border-transparent' : 'hover:bg-gray-800/50'}`}
              >
                <td className="px-4 py-3">
                  <p className="text-white font-medium group-hover:text-brand-300 transition-colors">{r.name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{r.email}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border
                    ${r.ticketType === 'VIP' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' : 
                      r.ticketType === 'PROMO' ? 'bg-pink-900/20 text-pink-400 border-pink-900/50' : 
                      'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {r.ticketType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === RegistrationStatus.VALIDATED ? (
                      <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-brand-400 flex items-center gap-1 justify-end">
                              VALIDADO <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                          </span>
                          {expandedId !== r.id && (
                             <span className="text-[9px] text-gray-600">{r.validatedBy || 'Sistema'}</span>
                          )}
                      </div>
                  ) : r.status === RegistrationStatus.CANCELLED ? (
                      <span className="text-xs font-bold text-red-500">CANCELADO</span>
                  ) : (
                      <span className="text-xs text-gray-500">PENDIENTE</span>
                  )}
                </td>
              </tr>
              {expandedId === r.id && (
                  <tr className="bg-gray-800 animate-fade-in">
                    <td colSpan={3} className="p-0">
                       <div className="px-4 pb-4 pt-1">
                          {r.status === RegistrationStatus.VALIDATED ? (
                            <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700 grid grid-cols-2 gap-3 text-sm">
                               <div>
                                  <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Validado Por</span>
                                  <span className="text-brand-300 font-medium">{r.validatedBy || 'Sistema'}</span>
                               </div>
                               <div className="text-right">
                                  <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Hora Exacta</span>
                                  <span className="text-white font-mono">{r.validationTime ? new Date(r.validationTime).toLocaleString() : '-'}</span>
                               </div>
                               <div className="col-span-2 border-t border-gray-700 pt-2 mt-1 flex justify-between text-[10px] text-gray-500">
                                  <span>ID: {r.id}</span>
                                  <span>QR: {r.qrCodeValue}</span>
                               </div>
                            </div>
                          ) : (
                             <div className="text-center py-3 text-xs text-gray-500 italic">
                                Este registro aún no ha sido validado.
                             </div>
                          )}
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-gray-600">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
      </div>
    </div>
  );
}

// -----------------------
// VALIDATION VIEW (SCANNER)
// -----------------------
interface ValidationViewProps {
  user: User;
}

function ValidationView({ user }: ValidationViewProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async (scanResult: ScanResult) => {
    setResult(scanResult);
    setScanning(false);
  };

  const reset = () => {
    setResult(null);
    setScanning(false);
  };

  return (
    <div className="h-full flex flex-col w-full">
      {scanning && (
        <Scanner 
          onScanComplete={handleScan} 
          onClose={() => setScanning(false)} 
          operatorName={user.name}
        />
      )}

      {!result ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="w-40 h-40 bg-gray-800/50 rounded-full flex items-center justify-center mb-8 border-4 border-gray-700 shadow-[0_0_50px_-10px_rgba(20,184,166,0.2)] relative">
            <div className="absolute inset-0 rounded-full border border-brand-500/30 animate-ping"></div>
            <QRIcon />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Punto de Acceso</h2>
          <p className="text-gray-400 mb-8 text-sm max-w-[250px]">
            Operador: <span className="text-brand-400 font-bold">{user.name}</span>
            <br/>
            Listo para validar entradas y promociones.
          </p>
          
          <button 
            onClick={() => setScanning(true)}
            className="w-full max-w-xs bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-5 px-6 rounded-2xl shadow-xl shadow-brand-900/40 transform transition hover:scale-105 flex items-center justify-center gap-3 text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
            </svg>
            ESCANEAR
          </button>
        </div>
      ) : (
        // RESULT SCREEN
        <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in w-full h-full
           ${result.success ? (result.registration?.ticketType === 'PROMO' ? 'bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900' : 'bg-gray-900') : 'bg-red-950/30'}`}>
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl
            ${result.success ? 'bg-green-500 text-white shadow-green-500/40' : 'bg-red-500 text-white shadow-red-500/40'}`}>
            {result.success ? <CheckIcon /> : <XIcon />}
          </div>

          <h2 className={`text-4xl font-black uppercase italic tracking-tighter mb-2 ${result.success ? 'text-white' : 'text-red-400'}`}>
            {result.success ? 'ACCESO OK' : 'DENEGADO'}
          </h2>
          
          <p className="text-gray-300 text-lg mb-8 font-medium">{result.message}</p>

          {result.registration && (
             <div className={`relative w-full max-w-sm border rounded-2xl overflow-hidden mb-8
                ${result.registration.ticketType === 'PROMO' 
                  ? 'bg-gray-800/80 border-pink-500 shadow-[0_0_30px_-5px_rgba(236,72,153,0.5)]' 
                  : 'bg-gray-800 border-gray-700'}`}>
                
                {/* Ticket Header */}
                <div className={`py-2 px-4 text-center text-xs font-bold uppercase tracking-widest text-white
                  ${result.registration.ticketType === 'PROMO' ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 
                    result.registration.ticketType === 'VIP' ? 'bg-purple-800' : 'bg-gray-700'}`}>
                   {result.registration.ticketType} TICKET
                </div>

                <div className="p-6">
                  <div className="text-2xl text-white font-bold mb-1">{result.registration.name}</div>
                  <div className="text-sm text-gray-400 mb-6">{result.registration.email}</div>
                  
                  {/* PROMO ALERT */}
                  {result.success && result.registration.ticketType === 'PROMO' && (
                     <div className="mt-2 p-4 bg-pink-500/10 border-2 border-pink-500 border-dashed rounded-xl text-pink-300 flex flex-col items-center gap-2 animate-pulse">
                        <GiftIcon />
                        <span className="font-black text-lg uppercase">Entregar Kit Promo</span>
                        <span className="text-xs">Confirmar entrega al usuario</span>
                     </div>
                  )}
                  
                   {/* VIP ALERT */}
                   {result.success && result.registration.ticketType === 'VIP' && (
                     <div className="mt-2 p-3 bg-purple-900/30 border border-purple-500 rounded-lg text-purple-300 text-sm font-bold">
                        ✨ Acceso a Zona VIP
                     </div>
                  )}
                </div>
             </div>
          )}

          <button 
            onClick={reset}
            className="w-full max-w-xs py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-lg"
          >
            Siguiente Asistente
          </button>
        </div>
      )}
    </div>
  );
}

// -----------------------
// NAVIGATION COMPONENT
// -----------------------
function NavLink({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200
      ${active ? 'text-brand-400 -translate-y-1' : 'text-gray-500 hover:text-gray-300'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: active ? "w-7 h-7" : "w-6 h-6" })}
      <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </Link>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Init simulated events
  useEffect(() => {
    if (currentUser) {
      db.init();
      
      // Redirigir STAFF a /validate si intenta acceder a rutas no permitidas
      if (currentUser.role === UserRole.STAFF) {
        if (location.pathname === '/' || location.pathname === '/list' || location.pathname === '/admin') {
          navigate('/validate', { replace: true });
        }
      }
    }
  }, [currentUser, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex items-center justify-center md:p-6">
      {/* Main App Container - acts as the phone frame */}
      <main className="w-full md:max-w-md h-[100dvh] md:h-[850px] md:max-h-[90vh] bg-gray-900 shadow-2xl relative flex flex-col md:rounded-[2.5rem] overflow-hidden border-x md:border-8 border-gray-800 ring-1 ring-white/10">
        
        {/* Notification Toast - Absolute within the frame */}
        <NotificationToast />

        {!currentUser ? (
          <Login onLogin={setCurrentUser} />
        ) : (
          <>
            {/* Header - Static */}
            <header className="shrink-0 px-5 py-4 flex items-center justify-between bg-gray-900/95 backdrop-blur border-b border-gray-800 z-30">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 text-sm">LS</div>
                  <div>
                     <h1 className="font-bold text-lg leading-none tracking-tight text-white">LiveSHOW</h1>
                     <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Control de Acceso</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-xs text-brand-400 font-bold">{currentUser.name}</div>
                  <div className="text-[9px] text-gray-600">{currentUser.role}</div>
                  <button onClick={() => setCurrentUser(null)} className="text-[10px] text-gray-500 hover:text-white underline">Salir</button>
               </div>
            </header>

            {/* Demo Mode Banner */}
            {!firestoreDb && (
              <div className="shrink-0 bg-orange-900/30 border-b border-orange-700/50 px-5 py-2 flex items-center gap-2 z-20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-orange-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-[10px] text-orange-300 font-semibold">MODO DEMO - Firebase no configurado</span>
              </div>
            )}

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-gray-900">
              <Routes>
                {/* Dashboard solo para ADMIN */}
                {currentUser.role === UserRole.ADMIN && (
                  <Route path="/" element={<Dashboard />} />
                )}
                {/* Validación accesible para todos */}
                <Route path="/validate" element={<ValidationView user={currentUser} />} />
                {/* Lista solo para ADMIN */}
                {currentUser.role === UserRole.ADMIN && (
                  <Route path="/list" element={<RegistrationList />} />
                )}
                {/* Admin panel solo para ADMIN */}
                {currentUser.role === UserRole.ADMIN && (
                  <Route path="/admin" element={<AdminPanel currentUser={currentUser} />} />
                )}
                {/* Panel de diagnóstico solo para ADMIN */}
                {currentUser.role === UserRole.ADMIN && (
                  <Route path="/diagnostic" element={<DiagnosticPanel />} />
                )}
                {/* Redirigir STAFF desde rutas no permitidas */}
                {currentUser.role === UserRole.STAFF && (
                  <Route path="*" element={<ValidationView user={currentUser} />} />
                )}
              </Routes>
            </div>

            {/* Bottom Navigation - Static */}
            <nav className={`shrink-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex ${currentUser.role === UserRole.STAFF ? 'justify-center' : 'justify-around'} items-center z-30 pb-2 px-2 ${currentUser.role === UserRole.ADMIN ? 'h-24' : 'h-20'}`}>
              {/* Para STAFF: solo mostrar botón de escaneo centrado */}
              {currentUser.role === UserRole.STAFF ? (
                <div className="w-full flex justify-center">
                  <div className="relative -top-6">
                    <Link to="/validate" className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg border-4 border-gray-900 transition-all duration-300
                      ${location.pathname === '/validate' 
                        ? 'bg-white text-brand-600 shadow-brand-500/50 scale-110' 
                        : 'bg-brand-600 text-white shadow-brand-500/30 hover:scale-105'}`}>
                      <QRIcon />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Para ADMIN: navegación completa con scroll horizontal si es necesario */}
                  <div className="flex items-center gap-2 w-full justify-around overflow-x-auto">
                    <NavLink 
                      to="/" 
                      active={location.pathname === '/'} 
                      icon={<HomeIcon />} 
                      label="Inicio" 
                    />
                    <div className="relative -top-6">
                      <Link to="/validate" className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg border-4 border-gray-900 transition-all duration-300
                        ${location.pathname === '/validate' 
                          ? 'bg-white text-brand-600 shadow-brand-500/50 scale-110' 
                          : 'bg-brand-600 text-white shadow-brand-500/30 hover:scale-105'}`}>
                        <QRIcon />
                      </Link>
                    </div>
                    <NavLink 
                      to="/admin" 
                      active={location.pathname === '/admin'} 
                      icon={<AdminIcon />} 
                      label="Admin" 
                    />
                    <NavLink 
                      to="/diagnostic" 
                      active={location.pathname === '/diagnostic'} 
                      icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.57.393A9.065 9.065 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.065 9.065 0 006.23 2.907L5 14.5m14.8.8V21M5 14.5V21m14.8-6.5h-2.25m-13.5 0H3" /></svg>} 
                      label="Diagnóstico" 
                    />
                  </div>
                </>
              )}
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
