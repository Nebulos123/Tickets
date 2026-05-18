import { useState, useCallback, useEffect } from 'react';
import type { Ticket, User, TicketStatus, Priority, Comment, StatusChange } from '../types';

const STORAGE_KEY = 'peaje_tickets';
const USER_KEY = 'peaje_current_user';

// ============================================
// LISTA DE USUARIOS DEL SISTEMA
// Modificá esta lista con los nombres reales
// ============================================
const DEFAULT_USERS: User[] = [
  // SUPERVISORES DE CAJA (solo pueden ver vías y crear tickets)
  { id: 'sup1', name: 'Supervisor 1', email: 'supervisor1@peaje.com', role: 'supervisor' },
  { id: 'sup2', name: 'Supervisor 2', email: 'supervisor2@peaje.com', role: 'supervisor' },
  { id: 'sup3', name: 'Supervisor 3', email: 'supervisor3@peaje.com', role: 'supervisor' },
  { id: 'sup4', name: 'Supervisor 4', email: 'supervisor4@peaje.com', role: 'supervisor' },
  
  // TÉCNICOS (pueden ver todo, tomar tickets y cambiar estados)
  { id: 'tec1', name: 'Técnico 1', email: 'tecnico1@peaje.com', role: 'tecnico' },
  { id: 'tec2', name: 'Técnico 2', email: 'tecnico2@peaje.com', role: 'tecnico' },
  { id: 'tec3', name: 'Técnico 3', email: 'tecnico3@peaje.com', role: 'tecnico' },
  
  // ADMINISTRADORES (acceso total)
  { id: 'adm1', name: 'Administrador', email: 'admin@peaje.com', role: 'administrador' },
];

function generateTicketNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `TK-${year}${month}${day}-${random}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateSeedData(): Ticket[] {
  const now = new Date();
  const seedTickets: Ticket[] = [
    {
      id: 'seed1',
      ticketNumber: 'TK-260115-0001',
      laneNumber: 3,
      description: 'OCR fuera de servicio - No reconoce patentes desde las 06:00',
      predefinedProblem: 'OCR fuera de servicio',
      priority: 'alta',
      status: 'en_proceso',
      createdBy: 'sup1',
      createdByName: 'Supervisor 1',
      assignedTo: 'tec1',
      assignedToName: 'Técnico 1',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      observations: 'El equipo OCR parpadea intermitente',
      comments: [
        { id: 'c1', ticketId: 'seed1', userId: 'tec1', userName: 'Técnico 1', userRole: 'tecnico', content: 'Revisando el módulo de reconocimiento. Parece ser un problema de firmware.', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
      ],
      statusHistory: [
        { id: 'sh1', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 1', changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
        { id: 'sh2', fromStatus: 'pendiente', toStatus: 'en_proceso', changedBy: 'Técnico 1', changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), comment: 'Tomando el ticket' },
      ],
    },
    {
      id: 'seed2',
      ticketNumber: 'TK-260115-0002',
      laneNumber: 7,
      description: 'Barrera no funciona - Se quedó trabada en posición abierta',
      predefinedProblem: 'Barrera no funciona',
      priority: 'urgente',
      status: 'pendiente',
      createdBy: 'sup2',
      createdByName: 'Supervisor 2',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      observations: 'Urgente, vehículos pasan sin registro',
      comments: [],
      statusHistory: [
        { id: 'sh3', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 2', changedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
      ],
    },
    {
      id: 'seed3',
      ticketNumber: 'TK-260114-0003',
      laneNumber: 12,
      description: 'Cámara desconectada - Sin imagen en monitor de supervisión',
      predefinedProblem: 'Cámara desconectada',
      priority: 'media',
      status: 'esperando_repuestos',
      createdBy: 'sup1',
      createdByName: 'Supervisor 1',
      assignedTo: 'tec2',
      assignedToName: 'Técnico 2',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      observations: 'Se revisó cableado, cable BNC dañado',
      comments: [
        { id: 'c2', ticketId: 'seed3', userId: 'tec2', userName: 'Técnico 2', userRole: 'tecnico', content: 'Cable BNC roto en la conexión. Se necesita reemplazo.', createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
        { id: 'c3', ticketId: 'seed3', userId: 'tec2', userName: 'Técnico 2', userRole: 'tecnico', content: 'Pedido realizado al proveedor, ETA 2 días.', createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString() },
      ],
      statusHistory: [
        { id: 'sh4', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 1', changedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
        { id: 'sh5', fromStatus: 'pendiente', toStatus: 'en_proceso', changedBy: 'Técnico 2', changedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(), comment: 'Tomando el ticket' },
        { id: 'sh6', fromStatus: 'en_proceso', toStatus: 'esperando_repuestos', changedBy: 'Técnico 2', changedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), comment: 'Necesito cable BNC de 5m' },
      ],
    },
    {
      id: 'seed4',
      ticketNumber: 'TK-260113-0004',
      laneNumber: 22,
      description: 'HDMI desconectado - Monitor del cajero sin señal',
      predefinedProblem: 'HDMI desconectado',
      priority: 'baja',
      status: 'resuelto',
      createdBy: 'sup2',
      createdByName: 'Supervisor 2',
      assignedTo: 'tec3',
      assignedToName: 'Técnico 3',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(),
      comments: [
        { id: 'c4', ticketId: 'seed4', userId: 'tec3', userName: 'Técnico 3', userRole: 'tecnico', content: 'Cable HDMI suelto, reconectado y asegurado con brida.', createdAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString() },
      ],
      statusHistory: [
        { id: 'sh7', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 2', changedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
        { id: 'sh8', fromStatus: 'pendiente', toStatus: 'en_proceso', changedBy: 'Técnico 3', changedAt: new Date(now.getTime() - 46 * 60 * 60 * 1000).toISOString(), comment: 'Tomando el ticket' },
        { id: 'sh9', fromStatus: 'en_proceso', toStatus: 'resuelto', changedBy: 'Técnico 3', changedAt: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(), comment: 'Solucionado, cable reconectado' },
      ],
    },
    {
      id: 'seed5',
      ticketNumber: 'TK-260115-0005',
      laneNumber: 43,
      description: 'Problema eléctrico - Corte intermitente de energía en la cabina',
      predefinedProblem: 'Problema eléctrico',
      priority: 'alta',
      status: 'pendiente',
      createdBy: 'sup1',
      createdByName: 'Supervisor 1',
      createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      observations: 'La vía se apaga por completo cada 10-15 minutos',
      comments: [],
      statusHistory: [
        { id: 'sh10', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 1', changedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
      ],
    },
    {
      id: 'seed6',
      ticketNumber: 'TK-260115-0006',
      laneNumber: 50,
      description: 'Sin comunicación - La vía no transmite datos al servidor central',
      predefinedProblem: 'Sin comunicación',
      priority: 'urgente',
      status: 'en_proceso',
      createdBy: 'sup2',
      createdByName: 'Supervisor 2',
      assignedTo: 'tec1',
      assignedToName: 'Técnico 1',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      observations: 'Se perdió la conexión de red, posible corte de fibra',
      comments: [
        { id: 'c5', ticketId: 'seed6', userId: 'tec1', userName: 'Técnico 1', userRole: 'tecnico', content: 'Encontré un empalme de fibra dañado, trabajando en reparación.', createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString() },
      ],
      statusHistory: [
        { id: 'sh11', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 2', changedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
        { id: 'sh12', fromStatus: 'pendiente', toStatus: 'en_proceso', changedBy: 'Técnico 1', changedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(), comment: 'Tomando el ticket' },
      ],
    },
    {
      id: 'seed7',
      ticketNumber: 'TK-260114-0007',
      laneNumber: 46,
      description: 'Final de carrera defectuoso - No detecta posición de barrera',
      predefinedProblem: 'Final de carrera defectuoso',
      priority: 'media',
      status: 'resuelto',
      createdBy: 'sup1',
      createdByName: 'Supervisor 1',
      assignedTo: 'tec2',
      assignedToName: 'Técnico 2',
      createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      comments: [
        { id: 'c6', ticketId: 'seed7', userId: 'tec2', userName: 'Técnico 2', userRole: 'tecnico', content: 'Sensor de final de carrera reemplazado exitosamente.', createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString() },
      ],
      statusHistory: [
        { id: 'sh13', fromStatus: 'pendiente', toStatus: 'pendiente', changedBy: 'Supervisor 1', changedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(), comment: 'Ticket creado' },
        { id: 'sh14', fromStatus: 'pendiente', toStatus: 'en_proceso', changedBy: 'Técnico 2', changedAt: new Date(now.getTime() - 34 * 60 * 60 * 1000).toISOString() },
        { id: 'sh15', fromStatus: 'en_proceso', toStatus: 'resuelto', changedBy: 'Técnico 2', changedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(), comment: 'Reemplazado con repuesto del stock' },
      ],
    },
  ];
  return seedTickets;
}

const SEED_KEY = 'peaje_seeded';

function loadTickets(): Ticket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    // First time: seed sample data
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(SEED_KEY, 'true');
      const seed = generateSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: Ticket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function loadUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function useStore() {
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [currentUser, setCurrentUserState] = useState<User | null>(loadUser);

  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    saveUser(user);
  }, []);

  const createTicket = useCallback((data: {
    laneNumber: number;
    description: string;
    predefinedProblem?: string;
    priority: Priority;
    observations?: string;
  }) => {
    if (!currentUser) return null;
    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: generateId(),
      ticketNumber: generateTicketNumber(),
      laneNumber: data.laneNumber,
      description: data.description,
      predefinedProblem: data.predefinedProblem,
      priority: data.priority,
      status: 'pendiente',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
      observations: data.observations,
      comments: [],
      statusHistory: [{
        id: generateId(),
        fromStatus: 'pendiente',
        toStatus: 'pendiente',
        changedBy: currentUser.name,
        changedAt: now,
        comment: 'Ticket creado',
      }],
    };
    setTickets(prev => [ticket, ...prev]);
    return ticket;
  }, [currentUser]);

  const updateTicketStatus = useCallback((ticketId: string, newStatus: TicketStatus, comment?: string): { wasResolved: boolean; ticket: Ticket | null } => {
    if (!currentUser) return { wasResolved: false, ticket: null };
    
    let resolvedTicket: Ticket | null = null;
    let wasResolved = false;
    
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const now = new Date().toISOString();
      const change: StatusChange = {
        id: generateId(),
        fromStatus: t.status,
        toStatus: newStatus,
        changedBy: currentUser.name,
        changedAt: now,
        comment,
      };
      
      // Detectar si se está resolviendo el ticket
      if (newStatus === 'resuelto' && t.status !== 'resuelto') {
        wasResolved = true;
      }
      
      const updatedTicket = {
        ...t,
        status: newStatus,
        updatedAt: now,
        resolvedAt: newStatus === 'resuelto' ? now : t.resolvedAt,
        statusHistory: [...t.statusHistory, change],
      };
      
      if (wasResolved) {
        resolvedTicket = updatedTicket;
      }
      
      return updatedTicket;
    }));
    
    return { wasResolved, ticket: resolvedTicket };
  }, [currentUser]);

  const assignTicket = useCallback((ticketId: string, techId: string, techName: string) => {
    if (!currentUser) return;
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const now = new Date().toISOString();
      const change: StatusChange = {
        id: generateId(),
        fromStatus: t.status,
        toStatus: 'en_proceso',
        changedBy: currentUser.name,
        changedAt: now,
        comment: `Asignado a ${techName}`,
      };
      return {
        ...t,
        status: 'en_proceso',
        assignedTo: techId,
        assignedToName: techName,
        updatedAt: now,
        statusHistory: [...t.statusHistory, change],
      };
    }));
  }, [currentUser]);

  const addComment = useCallback((ticketId: string, content: string) => {
    if (!currentUser) return;
    const comment: Comment = {
      id: generateId(),
      ticketId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content,
      createdAt: new Date().toISOString(),
    };
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        comments: [...t.comments, comment],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [currentUser]);

  const getTicketsForLane = useCallback((lane: number) => {
    return tickets.filter(t => t.laneNumber === lane && t.status !== 'resuelto');
  }, [tickets]);

  const getLaneStatus = useCallback((lane: number): 'ok' | 'pendiente' | 'en_proceso' | 'urgente' => {
    const laneTickets = tickets.filter(t => t.laneNumber === lane && t.status !== 'resuelto');
    if (laneTickets.length === 0) return 'ok';
    if (laneTickets.some(t => t.priority === 'urgente')) return 'urgente';
    if (laneTickets.some(t => t.status === 'en_proceso')) return 'en_proceso';
    return 'pendiente';
  }, [tickets]);

  const getStats = useCallback(() => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pendiente').length;
    const inProcess = tickets.filter(t => t.status === 'en_proceso').length;
    const waiting = tickets.filter(t => t.status === 'esperando_repuestos').length;
    const resolved = tickets.filter(t => t.status === 'resuelto').length;
    const urgent = tickets.filter(t => t.priority === 'urgente' && t.status !== 'resuelto').length;

    const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const resolved = new Date(t.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length;
    }

    const lanesWithIssues = new Set(tickets.filter(t => t.status !== 'resuelto').map(t => t.laneNumber)).size;

    return { total, pending, inProcess, waiting, resolved, urgent, avgResolutionTime, lanesWithIssues };
  }, [tickets]);

  return {
    tickets,
    currentUser,
    users: DEFAULT_USERS,
    setCurrentUser,
    createTicket,
    updateTicketStatus,
    assignTicket,
    addComment,
    getTicketsForLane,
    getLaneStatus,
    getStats,
  };
}
