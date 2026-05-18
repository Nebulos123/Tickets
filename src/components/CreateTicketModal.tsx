import { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { PREDEFINED_PROBLEMS, PRIORITY_CONFIG } from '../types';
import type { Priority, Ticket } from '../types';

interface CreateTicketModalProps {
  laneNumber: number;
  existingTickets: Ticket[];
  onClose: () => void;
  onCreate: (data: {
    laneNumber: number;
    description: string;
    predefinedProblem?: string;
    priority: Priority;
    observations?: string;
  }) => Ticket | null;
  onViewTicket: (ticket: Ticket) => void;
}

export default function CreateTicketModal({ laneNumber, existingTickets, onClose, onCreate, onViewTicket }: CreateTicketModalProps) {
  const [predefinedProblem, setPredefinedProblem] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [observations, setObservations] = useState('');
  const [created, setCreated] = useState<Ticket | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDescription = predefinedProblem
      ? `${predefinedProblem}${description ? ' - ' + description : ''}`
      : description;

    if (!finalDescription.trim()) return;

    const ticket = onCreate({
      laneNumber,
      description: finalDescription,
      predefinedProblem: predefinedProblem || undefined,
      priority,
      observations: observations || undefined,
    });
    if (ticket) setCreated(ticket);
  };

  if (created) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ticket Creado</h3>
          <p className="text-slate-400 mb-1">Número de ticket:</p>
          <p className="text-2xl font-mono font-bold text-blue-400 mb-4">{created.ticketNumber}</p>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-400">Vía:</span>
              <span className="text-white font-medium">{created.laneNumber}</span>
              <span className="text-slate-400">Prioridad:</span>
              <span className={`font-medium ${PRIORITY_CONFIG[created.priority].color}`}>
                {PRIORITY_CONFIG[created.priority].label}
              </span>
              <span className="text-slate-400">Estado:</span>
              <span className="text-yellow-400 font-medium">Pendiente</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            📧 Notificación enviada al equipo técnico
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-white">Nueva Solicitud</h3>
            <p className="text-slate-400 text-sm">Vía {laneNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Existing tickets warning */}
        {existingTickets.length > 0 && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-300 text-sm font-medium">
                  Esta vía tiene {existingTickets.length} ticket(s) abierto(s)
                </p>
                <div className="mt-2 space-y-1">
                  {existingTickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onViewTicket(t)}
                      className="block text-xs text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                    >
                      {t.ticketNumber} — {t.description.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Predefined problems */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Problema predeterminado
            </label>
            <select
              value={predefinedProblem}
              onChange={e => setPredefinedProblem(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">— Seleccionar problema —</option>
              {PREDEFINED_PROBLEMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción {!predefinedProblem && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describa el problema en detalle..."
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-500"
              required={!predefinedProblem}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prioridad <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all cursor-pointer
                    ${priority === key
                      ? `${config.bgColor} ${config.borderColor} ${config.color}`
                      : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                    }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Observaciones adicionales
            </label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Cualquier información adicional relevante..."
              rows={2}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-500"
            />
          </div>

          {/* Timestamp info */}
          <div className="bg-slate-700/30 rounded-xl p-3 flex items-center gap-3">
            <span className="text-slate-400 text-xs">📅 Fecha y hora: {new Date().toLocaleString('es-AR')}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
            Generar Ticket
          </button>
        </form>
      </div>
    </div>
  );
}
