export type Priority = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketStatus = 'pendiente' | 'en_proceso' | 'esperando_repuestos' | 'resuelto';
export type UserRole = 'supervisor' | 'tecnico' | 'administrador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface StatusChange {
  id: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  changedBy: string;
  changedAt: string;
  comment?: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  laneNumber: number;
  description: string;
  predefinedProblem?: string;
  priority: Priority;
  status: TicketStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  observations?: string;
  comments: Comment[];
  statusHistory: StatusChange[];
}

// ============================================
// LISTA DE PROBLEMAS PREDETERMINADOS
// Modificá esta lista según tus necesidades
// ============================================
export const PREDEFINED_PROBLEMS = [
  'OCR fuera de servicio',
  'Barrera no funciona',
  'Cámara desconectada',
  'Problema eléctrico',
  'HDMI desconectado',
  'Final de carrera defectuoso',
  'Sin comunicación',
  'Lector de tarjetas dañado',
  'Monitor sin imagen',
  'Impresora sin papel',
  'Impresora sin tinta',
  'Semáforo apagado',
  'Sensor de vehículo fallido',
  'Teclado no funciona',
  'Mouse no funciona',
  'PC no enciende',
  'Sistema congelado',
  'Telepase sin lectura',
  'Cabina sin luz',
  'Aire acondicionado no funciona',
] as const;

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  baja: { label: 'Baja', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', dotColor: 'bg-green-500' },
  media: { label: 'Media', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', dotColor: 'bg-yellow-500' },
  alta: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', dotColor: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', dotColor: 'bg-red-500' },
};

export const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', icon: '⏳' },
  en_proceso: { label: 'En Proceso', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', icon: '🔧' },
  esperando_repuestos: { label: 'Esperando Repuestos', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', icon: '📦' },
  resuelto: { label: 'Resuelto', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300', icon: '✅' },
};

// Vías del peaje: 1-40, 43, 44, 46, 47, 50, 51
export const LANE_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  43, 44, 46, 47, 50, 51
] as const;

export const TOTAL_LANES = LANE_NUMBERS.length; // 46 vías en total
