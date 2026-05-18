import { useState } from 'react';
import { X, Clock, User as UserIcon, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import type { Ticket, TicketStatus, User } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketDetailModalProps {
  ticket: Ticket;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, comment?: string) => void;
  onAssign: (ticketId: string, techId: string, techName: string) => void;
  onAddComment: (ticketId: string, content: string) => void;
}

export default function TicketDetailModal({
  ticket,
  currentUser,
  users,
  onClose,
  onUpdateStatus,
  onAssign,
  onAddComment,
}: TicketDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status);

  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const statusConfig = STATUS_CONFIG[ticket.status];
  const technicians = users.filter(u => u.role === 'tecnico');

  const resolutionTime = ticket.resolvedAt
    ? new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()
    : null;

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(ticket.id, newComment);
    setNewComment('');
  };

  const handleStatusChange = () => {
    if (selectedStatus !== ticket.status) {
      onUpdateStatus(ticket.id, selectedStatus, statusComment || undefined);
      setShowStatusChange(false);
      setStatusComment('');
    }
  };

  const canChangeStatus = currentUser.role === 'tecnico' || currentUser.role === 'administrador';
  const canAssign = currentUser.role === 'administrador' || currentUser.role === 'tecnico';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg font-mono font-bold text-blue-400">{ticket.ticketNumber}</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color} border ${priorityConfig.borderColor}`}>
                {priorityConfig.label}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Vía {ticket.laneNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Descripción</h4>
            <p className="text-white bg-slate-700/30 rounded-xl p-4">{ticket.description}</p>
            {ticket.observations && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-slate-400 mb-1">Observaciones</h4>
                <p className="text-slate-300 bg-slate-700/30 rounded-xl p-4 text-sm">{ticket.observations}</p>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Creado por</p>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-white text-sm">{ticket.createdByName}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Fecha de creación</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-white text-sm">{format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Técnico asignado</p>
              <span className="text-white text-sm">{ticket.assignedToName || 'Sin asignar'}</span>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">{resolutionTime ? 'Tiempo de resolución' : 'Tiempo transcurrido'}</p>
              <span className="text-white text-sm">
                {resolutionTime
                  ? formatDuration(resolutionTime)
                  : formatDistanceToNow(new Date(ticket.createdAt), { locale: es, addSuffix: false })}
              </span>
            </div>
          </div>

          {/* Assign technician */}
          {canAssign && ticket.status !== 'resuelto' && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Asignar técnico</h4>
              <div className="flex flex-wrap gap-2">
                {technicians.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => onAssign(ticket.id, tech.id, tech.name)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all cursor-pointer
                      ${ticket.assignedTo === tech.id
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      }`}
                  >
                    🔧 {tech.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status change */}
          {canChangeStatus && ticket.status !== 'resuelto' && (
            <div>
              {!showStatusChange ? (
                <button
                  onClick={() => setShowStatusChange(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cambiar estado →
                </button>
              ) : (
                <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Cambiar estado</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(STATUS_CONFIG) as [TicketStatus, typeof STATUS_CONFIG[TicketStatus]][]).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedStatus(key)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-all cursor-pointer
                          ${selectedStatus === key
                            ? `${config.bgColor} ${config.borderColor} ${config.color}`
                            : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                          }`}
                      >
                        {config.icon} {config.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={statusComment}
                    onChange={e => setStatusComment(e.target.value)}
                    placeholder="Comentario sobre el cambio de estado..."
                    rows={2}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleStatusChange}
                      disabled={selectedStatus === ticket.status}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Confirmar cambio
                    </button>
                    <button
                      onClick={() => { setShowStatusChange(false); setSelectedStatus(ticket.status); }}
                      className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm hover:bg-slate-500 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status History */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3">Historial de estados</h4>
            <div className="space-y-2">
              {ticket.statusHistory.map((change, i) => (
                <div key={change.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[change.toStatus].bgColor} border ${STATUS_CONFIG[change.toStatus].borderColor}`} />
                    {i < ticket.statusHistory.length - 1 && <div className="w-0.5 h-full bg-slate-700 min-h-[20px]" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {change.fromStatus !== change.toStatus && (
                        <>
                          <span className={`text-xs ${STATUS_CONFIG[change.fromStatus].color}`}>{STATUS_CONFIG[change.fromStatus].label}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </>
                      )}
                      <span className={`text-xs font-medium ${STATUS_CONFIG[change.toStatus].color}`}>{STATUS_CONFIG[change.toStatus].label}</span>
                      <span className="text-slate-500 text-xs">por {change.changedBy}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {format(new Date(change.changedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                    {change.comment && <p className="text-slate-400 text-xs mt-1">"{change.comment}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentarios ({ticket.comments.length})
            </h4>
            <div className="space-y-3 mb-3">
              {ticket.comments.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">Sin comentarios aún</p>
              )}
              {ticket.comments.map(c => (
                <div key={c.id} className="bg-slate-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{c.userName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300">
                      {c.userRole === 'supervisor' ? 'Supervisor' : c.userRole === 'tecnico' ? 'Técnico' : 'Admin'}
                    </span>
                    <span className="text-slate-500 text-xs ml-auto">
                      {format(new Date(c.createdAt), 'dd/MM HH:mm', { locale: es })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escribir un comentario..."
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
