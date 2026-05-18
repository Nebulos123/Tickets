import { LANE_NUMBERS } from '../types';
import type { Ticket } from '../types';

interface LaneGridProps {
  tickets: Ticket[];
  getLaneStatus: (lane: number) => 'ok' | 'pendiente' | 'en_proceso' | 'urgente';
  onSelectLane: (lane: number) => void;
  getTicketsForLane: (lane: number) => Ticket[];
  // Vías que acaban de ser resueltas y necesitan confirmación del supervisor
  resolvedLanesPendingAck: number[];
}

const statusStyles = {
  ok: {
    bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    glow: '',
    dot: 'bg-emerald-400',
  },
  pendiente: {
    bg: 'bg-amber-500/20 hover:bg-amber-500/30',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/10 shadow-lg',
    dot: 'bg-amber-400 animate-pulse',
  },
  en_proceso: {
    bg: 'bg-blue-500/20 hover:bg-blue-500/30',
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/10 shadow-lg',
    dot: 'bg-blue-400 animate-pulse',
  },
  urgente: {
    bg: 'bg-red-500/20 hover:bg-red-500/30',
    border: 'border-red-500/50',
    text: 'text-red-300',
    glow: 'shadow-red-500/20 shadow-xl',
    dot: 'bg-red-400 animate-pulse',
  },
};

const statusLabels = {
  ok: 'Sin incidencias',
  pendiente: 'Ticket pendiente',
  en_proceso: 'En proceso',
  urgente: 'Urgente',
  resuelto: '¡Recién resuelta!',
};

export default function LaneGrid({ getLaneStatus, onSelectLane, getTicketsForLane, resolvedLanesPendingAck }: LaneGridProps) {
  // Usamos las vías específicas del peaje
  const lanes = LANE_NUMBERS;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Mapa de Vías del Peaje</h2>
        <p className="text-slate-400 text-sm">Seleccione una vía para ver detalles o crear un ticket</p>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                key === 'resuelto' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : statusStyles[key as keyof typeof statusStyles]?.dot || 'bg-slate-400'
              }`} />
              <span className="text-slate-400 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 md:gap-3">
        {lanes.map(lane => {
          const status = getLaneStatus(lane);
          const style = statusStyles[status];
          const laneTickets = getTicketsForLane(lane);
          const ticketCount = laneTickets.length;
          
          // ¿Esta vía tiene una resolución pendiente de confirmar?
          const isPendingAck = resolvedLanesPendingAck.includes(lane);

          return (
            <button
              key={lane}
              onClick={() => onSelectLane(lane)}
              className={`relative aspect-square rounded-xl border 
                ${isPendingAck 
                  ? 'animate-resolved-pulse border-emerald-400' 
                  : `${style.bg} ${style.border} ${style.glow}`
                } 
                flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                hover:scale-105 active:scale-95 group`}
              title={isPendingAck ? `✅ Vía ${lane} - ¡RESUELTA! Click para confirmar` : `Vía ${lane} - ${statusLabels[status]}`}
            >
              {/* Indicador de resuelto */}
              {isPendingAck && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 z-10">
                  <span className="text-sm">✅</span>
                </div>
              )}
              
              <span className={`text-lg md:text-xl font-bold ${isPendingAck ? 'text-emerald-300' : style.text}`}>
                {lane}
              </span>
              <span className={`text-[10px] ${isPendingAck ? 'text-emerald-400 font-medium' : 'text-slate-500 group-hover:text-slate-400'}`}>
                {isPendingAck ? '¡OK!' : 'Vía'}
              </span>
              
              {/* Badge de tickets (solo si no está en estado resuelto pendiente) */}
              {ticketCount > 0 && !isPendingAck && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {ticketCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
