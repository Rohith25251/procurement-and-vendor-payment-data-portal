import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, LogOut, User, CheckCheck, ExternalLink, Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
    setShowNotifications(false);
  };

  const handleGoToProfile = () => {
    setShowProfileMenu(false);
    if (user?.role === 'manager') {
      navigate('/manager/profile');
    } else {
      navigate('/vendor/profile');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Procure<span className="text-primary-600">Hub</span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              B2B Enterprise Portal
            </span>
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-smooth"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  <p className="text-xs text-slate-500">{unreadCount} unread status updates</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications available</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.read ? 'bg-primary-50/40' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary-600' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{n.title}</h5>
                          <span className="text-[10px] text-slate-400">{n.timestamp.split(' ')[0]}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-smooth"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-primary-600/20"
              />
            ) : (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shrink-0 ring-2 ${
                user?.role === 'manager' ? 'bg-primary-600 ring-primary-600/20' : 'bg-emerald-600 ring-emerald-600/20'
              }`}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                user?.role === 'manager' ? 'text-primary-600' : 'text-emerald-600'
              }`}>
                {user?.role}
              </span>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={handleGoToProfile}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors mb-1"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Account & Security Settings
              </button>

              <button
                onClick={logout}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
