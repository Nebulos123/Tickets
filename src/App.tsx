import { useState, useCallback, useEffect } from 'react';
import { useStore } from './store/useStore';
import LoginScreen from './components/LoginScreen';
import LaneGrid from './components/LaneGrid';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailModal from './components/TicketDetailModal';
import TicketList from './components/TicketList';
import Dashboard from './components/Dashboard';
import Notifications, { Notification } from './components/Notifications';
import type { Ticket } from './types';
import {
  LayoutDashboard,
  Map,
  ListTodo,
  LogOut,
  Menu,
  X,
  Shield,
  Wrench,
  UserCog,
} from 'lucide-react';

type View = 'dashboard' | 'lanes' | 'tickets';

const roleIcons = {
  supervisor: Shield,
  tecnico: Wrench,
  administrador: UserCog,
};

const roleLabels = {
  supervisor: 'Supervisor de Caja',
  tecnico: 'Técnico',
  administrador: 'Administrador',
};

const roleGradients = {
  supervisor: 'from-amber-500 to-orange-600',
  tecnico: 'from-blue-500 to-indigo-600',
  administrador: 'from-purple-500 to-pink-600',
};

// Storage keys para persistir vías resueltas pendientes
const RESOLVED_LANES_KEY = 'peaje_resolved_lanes_pending';
const NOTIFICATIONS_KEY = 'peaje_notifications';

function loadResolvedLanes(): number[] {
  try {
    const data = localStorage.getItem(RESOLVED_LANES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveResolvedLanes(lanes: number[]) {
  localStorage.setItem(RESOLVED_LANES_KEY, JSON.stringify(lanes));
}

function loadNotifications(): Notification[] {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// Función para reproducir sonido de notificación
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Crear un sonido agradable de "ding" con dos tonos
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playTone(880, now, 0.15); // La (A5)
    playTone(1318.5, now + 0.1, 0.2); // Mi (E6)
    playTone(1760, now + 0.2, 0.3); // La (A6)
  } catch {
    // Si falla el audio, simplemente no reproducimos nada
    console.log('Audio no disponible');
  }
}

export default function App() {
  const store = useStore();
  const [currentView, setCurrentView] = useState<View>('lanes');
  const [selectedLane, setSelectedLane] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estado para vías resueltas pendientes de confirmación (supervisores)
  const [resolvedLanesPendingAck, setResolvedLanesPendingAck] = useState<number[]>(loadResolvedLanes);
  
  // Estado para notificaciones
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);

  // Persistir cambios
  useEffect(() => {
    saveResolvedLanes(resolvedLanesPendingAck);
  }, [resolvedLanesPendingAck]);
  
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Determinar qué vistas puede ver cada rol
  const isSupervisor = store.currentUser?.role === 'supervisor';
  const isTecnico = store.currentUser?.role === 'tecnico';
  const isAdmin = store.currentUser?.role === 'administrador';

  const canViewDashboard = isTecnico || isAdmin;
  const canViewTickets = isTecnico || isAdmin;
  const canViewLanes = true;

  // Redirigir supervisores si intentan ver vistas no permitidas
  useEffect(() => {
    if (isSupervisor && (currentView === 'dashboard' || currentView === 'tickets')) {
      setCurrentView('lanes');
    }
  }, [isSupervisor, currentView]);

  // Cuando cambia el usuario, resetear la vista según el rol
  useEffect(() => {
    if (store.currentUser) {
      if (store.currentUser.role === 'supervisor') {
        setCurrentView('lanes');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [store.currentUser?.id]);

  const handleSelectLane = useCallback((lane: number) => {
    // Si es un supervisor y la vía está en "pendiente de confirmación", confirmar
    if (isSupervisor && resolvedLanesPendingAck.includes(lane)) {
      // Quitar de la lista de pendientes
      setResolvedLanesPendingAck(prev => prev.filter(l => l !== lane));
      // Quitar notificación relacionada
      setNotifications(prev => prev.filter(n => n.laneNumber !== lane));
      // Mostrar el modal de crear ticket (por si quiere ver detalles o crear uno nuevo)
    }
    setSelectedLane(lane);
  }, [isSupervisor, resolvedLanesPendingAck]);

  const handleSelectTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleCloseCreateTicket = useCallback(() => {
    setSelectedLane(null);
  }, []);

  const handleCloseTicketDetail = useCallback(() => {
    setSelectedTicket(null);
  }, []);
  
  // Handler especial para actualizar estado con notificación
  const handleUpdateTicketStatus = useCallback((ticketId: string, status: Parameters<typeof store.updateTicketStatus>[1], comment?: string) => {
    const result = store.updateTicketStatus(ticketId, status, comment);
    
    // Si se resolvió un ticket, agregar notificación y marcar vía
    if (result.wasResolved && result.ticket) {
      const ticket = result.ticket;
      
      // Agregar vía a la lista de pendientes de confirmación
      setResolvedLanesPendingAck(prev => {
        if (!prev.includes(ticket.laneNumber)) {
          return [...prev, ticket.laneNumber];
        }
        return prev;
      });
      
      // Crear notificación
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        type: 'resolved',
        laneNumber: ticket.laneNumber,
        ticketNumber: ticket.ticketNumber,
        message: ticket.description.slice(0, 60) + (ticket.description.length > 60 ? '...' : ''),
        createdAt: Date.now(),
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Reproducir sonido de notificación
      playNotificationSound();
    }
  }, [store]);
  
  // Handlers para notificaciones
  const handleDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const handleClickNotification = useCallback((notification: Notification) => {
    // Ir al mapa de vías y marcar la vía como vista
    setCurrentView('lanes');
    
    // Quitar de pendientes
    setResolvedLanesPendingAck(prev => prev.filter(l => l !== notification.laneNumber));
    
    // Quitar notificación
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // Abrir modal de la vía
    setSelectedLane(notification.laneNumber);
  }, []);

  // Keep ticket detail in sync when store updates
  const currentTicketData = selectedTicket
    ? store.tickets.find(t => t.id === selectedTicket.id) || selectedTicket
    : null;

  if (!store.currentUser) {
    return <LoginScreen users={store.users} onLogin={store.setCurrentUser} />;
  }

  const RoleIcon = roleIcons[store.currentUser.role];
  const stats = store.getStats();

  // Construir menú de navegación según el rol
  const navItems = [];
  
  if (canViewDashboard) {
    navItems.push({ id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard });
  }
  
  if (canViewLanes) {
    navItems.push({ id: 'lanes' as View, label: 'Mapa de Vías', icon: Map });
  }
  
  if (canViewTickets) {
    navItems.push({ id: 'tickets' as View, label: 'Tickets', icon: ListTodo });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top navbar */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo + mobile menu */}
          <div className="flex items-center gap-3">
            {navItems.length > 1 && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base">
                🛣️
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-white leading-tight">Sistema de Gestión</h1>
                <p className="text-[10px] text-slate-400 leading-tight">Tickets Técnicos — Peaje</p>
              </div>
            </div>
          </div>

          {/* Desktop nav - solo si hay más de 1 opción */}
          {navItems.length > 1 && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                      ${isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'tickets' && stats.pending > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {stats.pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Título central para supervisores */}
          {isSupervisor && (
            <div className="hidden md:block text-center">
              <h2 className="text-sm font-semibold text-white">Mapa de Vías del Peaje</h2>
              <p className="text-[10px] text-slate-400">Seleccione una vía para reportar incidencia</p>
            </div>
          )}

          {/* User */}
          <div className="flex items-center gap-3">
            {/* Indicador de vías resueltas para supervisores */}
            {isSupervisor && resolvedLanesPendingAck.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 animate-pulse">
                <span className="text-emerald-400 text-xs font-medium">
                  ✅ {resolvedLanesPendingAck.length} vía{resolvedLanesPendingAck.length > 1 ? 's' : ''} resuelta{resolvedLanesPendingAck.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGradients[store.currentUser.role]} flex items-center justify-center`}>
                <RoleIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white leading-tight">{store.currentUser.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{roleLabels[store.currentUser.role]}</p>
              </div>
            </div>
            <button
              onClick={() => store.setCurrentUser(null)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile menu - solo si hay más de 1 opción */}
        {mobileMenuOpen && navItems.length > 1 && (
          <div className="md:hidden border-t border-slate-700 px-4 py-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer
                    ${isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.id === 'tickets' && stats.pending > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {stats.pending}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700 mt-2 pt-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGradients[store.currentUser.role]} flex items-center justify-center`}>
                <RoleIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{store.currentUser.name}</p>
                <p className="text-xs text-slate-400">{roleLabels[store.currentUser.role]}</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Quick stats bar - solo para técnicos y admins */}
        {(isTecnico || isAdmin) && (
          <div className="bg-slate-800/40 border-b border-slate-700/30 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              {stats.pending} pendientes
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {stats.inProcess} en proceso
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              {stats.waiting} esperando repuestos
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              {stats.urgent} urgentes
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap ml-auto">
              <Map className="w-3 h-3" />
              {stats.lanesWithIssues}/46 vías afectadas
            </div>
          </div>
        )}

        {/* Barra de estado simplificada para supervisores */}
        {isSupervisor && (
          <div className="bg-slate-800/40 border-b border-slate-700/30 px-4 py-2 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sin incidencias
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Pendiente
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              En proceso
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Urgente
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ¡Resuelta!
            </div>
          </div>
        )}

        {currentView === 'dashboard' && canViewDashboard && (
          <Dashboard tickets={store.tickets} stats={stats} onSelectTicket={handleSelectTicket} />
        )}
        {currentView === 'lanes' && (
          <LaneGrid
            tickets={store.tickets}
            getLaneStatus={store.getLaneStatus}
            onSelectLane={handleSelectLane}
            getTicketsForLane={store.getTicketsForLane}
            resolvedLanesPendingAck={resolvedLanesPendingAck}
          />
        )}
        {currentView === 'tickets' && canViewTickets && (
          <TicketList tickets={store.tickets} onSelectTicket={handleSelectTicket} />
        )}
      </main>

      {/* Create ticket modal */}
      {selectedLane !== null && (
        <CreateTicketModal
          laneNumber={selectedLane}
          existingTickets={store.getTicketsForLane(selectedLane)}
          onClose={handleCloseCreateTicket}
          onCreate={store.createTicket}
          onViewTicket={(ticket) => {
            setSelectedLane(null);
            setSelectedTicket(ticket);
          }}
        />
      )}

      {/* Ticket detail modal */}
      {currentTicketData && (
        <TicketDetailModal
          ticket={currentTicketData}
          currentUser={store.currentUser}
          users={store.users}
          onClose={handleCloseTicketDetail}
          onUpdateStatus={handleUpdateTicketStatus}
          onAssign={store.assignTicket}
          onAddComment={store.addComment}
        />
      )}
      
      {/* Notificaciones para supervisores */}
      {isSupervisor && (
        <Notifications
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onClickNotification={handleClickNotification}
        />
      )}
    </div>
  );
}
