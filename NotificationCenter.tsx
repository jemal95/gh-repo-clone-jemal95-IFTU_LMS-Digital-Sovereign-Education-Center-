import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { dbService } from '../services/dbService';
import { auth } from '../firebase';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  userId: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = dbService.subscribeToNotifications(userId, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    await dbService.markNotificationRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'grade': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'assignment': return <AlertCircle className="text-blue-500" size={16} />;
      default: return <Info className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
      >
        <Bell size={24} className="text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[8000]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-white border-8 border-black rounded-[2rem] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] z-[8001] overflow-hidden"
            >
              <div className="p-6 border-b-4 border-black bg-gray-50 flex justify-between items-center">
                <h3 className="font-black uppercase italic text-xl">Notifications.</h3>
                <button onClick={() => setIsOpen(false)}><X size={20} /></button>
              </div>
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 font-black text-gray-400 italic">No notifications yet.</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 rounded-xl border-4 border-black transition-all ${notif.isRead ? 'bg-gray-50 opacity-60' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1">
                          <p className="font-black text-sm leading-tight mb-1">{notif.title}</p>
                          <p className="text-xs font-bold text-gray-600 mb-2">{notif.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                            {!notif.isRead && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
