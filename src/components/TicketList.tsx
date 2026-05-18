import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import type { Ticket, TicketStatus, Priority } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export default function TicketList({ tickets, onSelectTicket }: TicketListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'todas'>('todas');
  const [laneFilter, setLaneFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'lane'>('date');
  const [showFilters, setShowFilters] = useState(false);

  const priorityOrder: Record<Priority, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.ticketNumber.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.createdByName.toLowerCase().includes(s) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(s))
      );
    }

    if (statusFilter !== 'todos') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'todas') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    if (laneFilter) {
      result = result.filter(t => t.laneNumber === parseInt(laneFilter));
    }

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'priority') {
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'lane') {
      result.sort((a, b) => a.laneNumber - b.laneNumber);
    }

    return result;
  }, [tickets, search, statusFilter, priorityFilter, laneFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: tickets.length };
    tickets.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  return (
    <div className="p-4 md:p-6">
      {/* Search & Filters Header */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ticket, descripción, usuario..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer
              ${showFilters ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'pendiente', 'en_proceso', 'esperando_repuestos', 'resuelto'] as const).map(status => {
            const config = status === 'todos' ? null : STATUS_CONFIG[status];
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all cursor-pointer
                  ${isActive
                    ? config ? `${config.bgColor} ${config.color} border ${config.borderColor}` : 'bg-slate-600 text-white border border-slate-500'
                    : 'bg-slate-700/30 text-slate-400 border border-transparent hover:bg-slate-700/50'
                  }`}
              >
                {config ? config.icon : '📋'} {config ? config.label : 'Todos'}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-600'}`}>
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="bg-slate-700/30 rounded-xl p-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prioridad</label>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as Priority | 'todas')}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="todas">Todas</option>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vía</label>
              <input
                type="number"
                value={laneFilter}
                onChange={e => setLaneFilter(e.target.value)}
                placeholder="Ej: 5"
                min={1}
                max={46}
                className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'priority' | 'lane')}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="date">Fecha</option>
                <option value="priority">Prioridad</option>
                <option value="lane">Vía</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setStatusFilter('todos'); setPriorityFilter('todas'); setLaneFilter(''); setSearch(''); setSortBy('date'); }}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tickets */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-slate-400 text-lg">No se encontraron tickets</p>
          <p className="text-slate-500 text-sm mt-1">Ajuste los filtros o cree un nuevo ticket</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map(ticket => {
            const pConfig = PRIORITY_CONFIG[ticket.priority];
            const sConfig = STATUS_CONFIG[ticket.status];
            return (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="w-full text-left bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Lane badge */}
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border
                    ${ticket.status === 'resuelto' ? 'bg-green-500/10 border-green-500/30' : 
                      ticket.priority === 'urgente' ? 'bg-red-500/10 border-red-500/30' : 
                      'bg-blue-500/10 border-blue-500/30'}`}
                  >
                    <span className="text-lg font-bold text-white">{ticket.laneNumber}</span>
                    <span className="text-[8px] text-slate-400">VÍA</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-mono font-medium text-blue-400">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${sConfig.bgColor} ${sConfig.color}`}>
                        {sConfig.icon} {sConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${pConfig.bgColor} ${pConfig.color}`}>
                        {pConfig.label}
                      </span>
                    </div>
                    <p className="text-white text-sm truncate">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>👤 {ticket.createdByName}</span>
                      {ticket.assignedToName && <span>🔧 {ticket.assignedToName}</span>}
                      <span>🕐 {formatDistanceToNow(new Date(ticket.createdAt), { locale: es, addSuffix: true })}</span>
                      {ticket.comments.length > 0 && <span>💬 {ticket.comments.length}</span>}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-slate-500 text-xs">{format(new Date(ticket.createdAt), 'dd/MM/yy', { locale: es })}</p>
                    <p className="text-slate-500 text-xs">{format(new Date(ticket.createdAt), 'HH:mm', { locale: es })}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
