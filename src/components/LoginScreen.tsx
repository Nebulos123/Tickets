import { useState } from 'react';
import type { User } from '../types';
import { Shield, Wrench, UserCog, ChevronRight } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const roleIcons = {
  supervisor: Shield,
  tecnico: Wrench,
  administrador: UserCog,
};

const roleLabels = {
  supervisor: 'Supervisor',
  tecnico: 'Técnico',
  administrador: 'Administrador',
};

const roleColors = {
  supervisor: 'from-amber-500 to-orange-600',
  tecnico: 'from-blue-500 to-indigo-600',
  administrador: 'from-purple-500 to-pink-600',
};

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const filteredUsers = selectedRole ? users.filter(u => u.role === selectedRole) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-4">
            <span className="text-4xl">🛣️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sistema de Gestión</h1>
          <p className="text-slate-400 text-lg">Tickets Técnicos — Peaje</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {!selectedRole ? (
            <>
              <h2 className="text-white text-lg font-semibold mb-4 text-center">Seleccione su rol</h2>
              <div className="grid gap-3">
                {(['supervisor', 'tecnico', 'administrador'] as const).map(role => {
                  const Icon = roleIcons[role];
                  const userCount = users.filter(u => u.role === role).length;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleColors[role]} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium text-base">{roleLabels[role]}</p>
                        <p className="text-slate-400 text-sm">{userCount} usuario{userCount !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Volver
              </button>
              <h2 className="text-white text-lg font-semibold mb-4 text-center">
                Seleccione su usuario
              </h2>
              <div className="grid gap-3">
                {filteredUsers.map(user => {
                  const Icon = roleIcons[user.role];
                  return (
                    <button
                      key={user.id}
                      onClick={() => onLogin(user)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          v1.0 — Sistema interno de gestión de peaje
        </p>
      </div>
    </div>
  );
}
