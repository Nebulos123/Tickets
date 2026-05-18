import { useMemo } from 'react';
import { AlertTriangle, Clock, CheckCircle, Wrench, BarChart3, TrendingUp, Zap, MapPin } from 'lucide-react';
import type { Ticket } from '../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import { format, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  tickets: Ticket[];
  stats: {
    total: number;
    pending: number;
    inProcess: number;
    waiting: number;
    resolved: number;
    urgent: number;
    avgResolutionTime: number;
    lanesWithIssues: number;
  };
  onSelectTicket: (ticket: Ticket) => void;
}

export default function Dashboard({ tickets, stats, onSelectTicket }: DashboardProps) {
  const formatDuration = (ms: number) => {
    if (ms === 0) return '—';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const recentTickets = useMemo(() => {
    return tickets
      .filter(t => t.status !== 'resuelto')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tickets]);

  const urgentTickets = useMemo(() => {
    return tickets.filter(t => t.priority === 'urgente' && t.status !== 'resuelto');
  }, [tickets]);

  const ticketsLast7Days = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return tickets.filter(t => isAfter(new Date(t.createdAt), sevenDaysAgo)).length;
  }, [tickets]);

  const resolvedLast7Days = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return tickets.filter(t => t.resolvedAt && isAfter(new Date(t.resolvedAt), sevenDaysAgo)).length;
  }, [tickets]);

  // Problem type distribution
  const problemDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    tickets.forEach(t => {
      const key = t.predefinedProblem || 'Otros';
      dist[key] = (dist[key] || 0) + 1;
    });
    return Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [tickets]);

  // Lanes with most issues
  const topLanes = useMemo(() => {
    const lanes: Record<number, number> = {};
    tickets.filter(t => t.status !== 'resuelto').forEach(t => {
      lanes[t.laneNumber] = (lanes[t.laneNumber] || 0) + 1;
    });
    return Object.entries(lanes)
      .map(([lane, count]) => ({ lane: parseInt(lane), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tickets]);

  const maxProblemCount = problemDistribution.length > 0 ? problemDistribution[0][1] : 1;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-slate-400 text-xs">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.inProcess}</p>
              <p className="text-slate-400 text-xs">En proceso</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              <p className="text-slate-400 text-xs">Resueltos</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
              <p className="text-slate-400 text-xs">Urgentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Total tickets</span>
          </div>
          <p className="text-xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Últimos 7 días</span>
          </div>
          <p className="text-xl font-bold text-white">{ticketsLast7Days}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Resueltos (7d)</span>
          </div>
          <p className="text-xl font-bold text-white">{resolvedLast7Days}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Tiempo promedio</span>
          </div>
          <p className="text-xl font-bold text-white">{formatDuration(stats.avgResolutionTime)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Urgent Tickets */}
        {urgentTickets.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 md:col-span-2">
            <h3 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Tickets Urgentes ({urgentTickets.length})
            </h3>
            <div className="space-y-2">
              {urgentTickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectTicket(t)}
                  className="w-full text-left flex items-center gap-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg p-3 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-sm font-bold text-red-300">
                    {t.laneNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.description}</p>
                    <p className="text-red-400/70 text-xs">{t.ticketNumber} · {t.createdByName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${STATUS_CONFIG[t.status].bgColor} ${STATUS_CONFIG[t.status].color}`}>
                    {STATUS_CONFIG[t.status].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent tickets */}
        <div className="bg-slate-700/20 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Tickets Recientes
          </h3>
          {recentTickets.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No hay tickets abiertos</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map(t => {
                const pConfig = PRIORITY_CONFIG[t.priority];
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className="w-full text-left flex items-center gap-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg p-3 transition-all cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white border ${
                      t.priority === 'urgente' ? 'bg-red-500/20 border-red-500/30' : 'bg-slate-600/50 border-slate-600'
                    }`}>
                      {t.laneNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">{t.ticketNumber}</span>
                        <span className={`text-xs ${pConfig.color}`}>● {pConfig.label}</span>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{format(new Date(t.createdAt), 'HH:mm', { locale: es })}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Problem Distribution */}
        <div className="bg-slate-700/20 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Tipos de Problemas
          </h3>
          {problemDistribution.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {problemDistribution.map(([problem, count]) => (
                <div key={problem}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-xs truncate pr-2">{problem}</span>
                    <span className="text-slate-400 text-xs font-mono">{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(count / maxProblemCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top lanes */}
        <div className="bg-slate-700/20 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Vías con más incidencias activas
          </h3>
          {topLanes.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Todas las vías operativas</p>
          ) : (
            <div className="space-y-2">
              {topLanes.map(({ lane, count }, i) => (
                <div key={lane} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600 text-slate-300'}
                  `}>
                    {i + 1}
                  </span>
                  <span className="text-white text-sm font-medium">Vía {lane}</span>
                  <div className="flex-1" />
                  <span className="text-slate-400 text-sm">{count} ticket{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting for parts */}
        <div className="bg-slate-700/20 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            📦 Esperando Repuestos ({stats.waiting})
          </h3>
          {stats.waiting === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin tickets esperando repuestos</p>
          ) : (
            <div className="space-y-2">
              {tickets.filter(t => t.status === 'esperando_repuestos').map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectTicket(t)}
                  className="w-full text-left flex items-center gap-3 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 rounded-lg p-3 transition-all cursor-pointer"
                >
                  <span className="text-purple-300 font-bold text-sm">V{t.laneNumber}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{t.description}</p>
                    <p className="text-purple-400/70 text-xs">{t.ticketNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
