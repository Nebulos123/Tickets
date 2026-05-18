import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'resolved' | 'info' | 'warning';
  laneNumber: number;
  ticketNumber: string;
  message: string;
  createdAt: number;
}

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onClickNotification: (notification: Notification) => void;
}

export default function Notifications({ notifications, onDismiss, onClickNotification }: NotificationsProps) {
  // Auto-dismiss después de 30 segundos (pero siguen parpadeando las vías)
  useEffect(() => {
    const timers = notifications.map(n => {
      return setTimeout(() => {
        onDismiss(n.id);
      }, 30000);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-2xl shadow-green-500/30 p-4 
            animate-slide-in cursor-pointer hover:from-green-500 hover:to-emerald-500 transition-all
            border border-green-400/30"
          onClick={() => onClickNotification(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  ✅ Vía {notification.laneNumber} Resuelta
                </h4>
                <button
                  onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-green-100 text-sm mt-1">
                {notification.message}
              </p>
              <p className="text-green-200/70 text-xs mt-2 font-mono">
                {notification.ticketNumber}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20 text-center">
            <span className="text-xs text-green-100">
              👆 Click para ver detalles y confirmar
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
