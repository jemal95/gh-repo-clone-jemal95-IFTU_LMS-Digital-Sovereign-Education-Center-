import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { dbService } from '../services/dbService';
import { AppNotification } from '../types';
import { auth } from '../firebase';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const unsubscribe = dbService.subscribeToNotifications(auth.currentUser.uid, (fetched) => {
        setNotifications(fetched);
      });
      return () => unsubscribe();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 bg-white border-2 border-black rounded-full">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border-4 border-black rounded-2xl shadow-xl z-50">
          <div className="p-4 border-b-4 border-black font-black uppercase">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-xs font-black text-gray-500">No notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b-2 border-black ${n.isRead ? 'opacity-50' : ''}`}>
                  <p className="font-black text-sm">{n.title}</p>
                  <p className="text-xs">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
