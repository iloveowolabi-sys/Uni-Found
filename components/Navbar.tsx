import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell, Power, User as UserIcon, Shield, ChevronDown, LayoutDashboard, Search, PlusCircle, Settings } from 'lucide-react';
import { api } from '../services/api';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    const stored = localStorage.getItem('lastReadNotificationTimestamp');
    return stored ? parseInt(stored, 10) : 0;
  });
  
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchNotifications = async () => {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    };

    fetchNotifications();
    
    // Poll for notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const parseDate = (dateStr: string | Date) => {
    if (!dateStr) return new Date();
    // PostgreSQL (via pg -> Express JSON) sends an ISO string which is natively parsed.
    // We add a fallback just in case it returns the raw space-separated format.
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date(String(dateStr).replace(' ', 'T') + 'Z');
  };

  const unreadCount = notifications.filter(n => parseDate(n.created_at).getTime() > lastReadTimestamp).length;

  const clearNotifications = () => {
    const now = Date.now();
    setLastReadTimestamp(now);
    localStorage.setItem('lastReadNotificationTimestamp', now.toString());
    setIsNotificationsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavLink = ({ to, children, icon: Icon }: { to: string, children: React.ReactNode, icon?: any }) => (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        isActive(to)
          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </Link>
  );

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <span className="text-white text-2xl font-bold tracking-tight font-serif italic group-hover:text-blue-200 transition-colors">UniFound</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-12 flex items-baseline space-x-2">
                <NavLink to="/search" icon={Search}>Browse Items</NavLink>
                <NavLink to="/report" icon={PlusCircle}>Report Item</NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-6">
              {isAuthenticated ? (
                <>
                  {/* Notifications Dropdown */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsUserDropdownOpen(false);
                      }}
                      className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none relative"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 py-2 focus:outline-none origin-top-right transform transition-all z-50">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => {
                              const isUnread = parseDate(notif.created_at).getTime() > lastReadTimestamp;
                              const timeString = parseDate(notif.created_at).toLocaleString();
                              return (
                                <div key={notif.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${isUnread ? 'bg-blue-50/50' : ''}`}>
                                  <div className="flex justify-between items-start">
                                    <p className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notif.title}</p>
                                    {isUnread && <span className="h-2 w-2 bg-blue-600 rounded-full mt-1.5"></span>}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                                  <p className="text-xs text-blue-600 mt-2 font-medium">{timeString}</p>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-500">No recent activity</p>
                            </div>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <div className="px-4 py-2 border-t border-slate-100 text-center">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotifications();
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserDropdownOpen(!isUserDropdownOpen);
                        setIsNotificationsOpen(false);
                      }}
                      className="flex items-center space-x-3 text-white pl-4 border-l border-white/10 hover:bg-white/5 p-2 rounded-xl transition-colors focus:outline-none"
                    >
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium leading-none">{user?.name}</span>
                        <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{user?.role}</span>
                      </div>
                      <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white/20 overflow-hidden">
                         {user?.avatar ? (
                           <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                         ) : (
                           user?.role === 'ADMIN' ? <Shield size={16} /> : <UserIcon size={16} />
                         )}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none origin-top-right transform transition-all">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />
                            Dashboard
                          </Link>
                          <Link to="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                            <Settings className="h-4 w-4 mr-3 text-gray-400" />
                            Profile Settings
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link to="/admin" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                              <Shield className="h-4 w-4 mr-3 text-gray-400" />
                              Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="py-1 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              logout();
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Power className="h-4 w-4 mr-3 text-red-500" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login" className="text-white hover:text-blue-200 font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-all">Log In</Link>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/search" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Browse Items</Link>
            <Link to="/report" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Report Item</Link>
            {isAuthenticated ? (
               <>
                 <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Dashboard</Link>
                 <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Profile Settings</Link>
                 {user?.role === 'ADMIN' && (
                   <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Admin Panel</Link>
                 )}
                 <button onClick={logout} className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-slate-800">
                   <Power className="h-5 w-5 mr-2" />
                   Sign out
                 </button>
               </>
            ) : (
               <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;