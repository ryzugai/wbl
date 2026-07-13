
import React, { useEffect, useState } from 'react';
import { User, UserRole, Notification } from '../types';
import { LogOut, Home, Building2, Users, FileText, Upload, FileSpreadsheet, UserCog, Book, Database, Wifi, WifiOff, Menu, X, ShieldCheck, BarChart3, Languages, Map, BookCopy, UsersRound, UserCheck, Activity, Bell, Check, Trash } from 'lucide-react';
import { getRoleLabels } from '../constants';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout, language, onLanguageChange }) => {
  const [isCloud, setIsCloud] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsCloud(StorageService.isCloudEnabled());
  }, []);

  useEffect(() => {
    const loadNotifs = () => {
      const allNotifs = StorageService.getNotifications();
      const userNotifs = allNotifs.filter(n => {
        if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
          return n.recipient_id === 'coordinator' || n.recipient_id === currentUser.id;
        }
        return n.recipient_id === currentUser.id;
      });
      setNotifications(userNotifs);
    };

    loadNotifs();
    const unsubscribe = StorageService.subscribe(loadNotifs);
    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
      await StorageService.markAllNotificationsAsRead('coordinator');
    }
    await StorageService.markAllNotificationsAsRead(currentUser.id);
  };

  const handleMarkRead = async (id: string) => {
    await StorageService.markNotificationAsRead(id);
  };

  const handleDeleteNotif = async (id: string) => {
    await StorageService.deleteNotification(id);
  };

  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const isLecturer = currentUser.role === UserRole.LECTURER;
  const isStudent = currentUser.role === UserRole.STUDENT;
  const hasSystemAccess = isCoordinator || isJKWBL;

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ view, label, icon: Icon }: { view: string, label: string, icon: any }) => (
    <button
      onClick={() => handleNavigate(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-blue-700">
            <Building2 size={24} />
            <span>WBL System</span>
        </div>
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-slate-200 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            WBL System
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
             {isCloud ? (
               <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                 <Wifi size={10} /> LIVE SYNC
               </span>
             ) : (
               <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                 <WifiOff size={10} /> OFFLINE
               </span>
             )}
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1 overflow-y-auto">
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg mb-4 border border-slate-200">
             <div className="flex items-center gap-2 text-slate-500">
                <Languages size={16} />
                <span className="text-[10px] font-bold uppercase">Language</span>
             </div>
             <div className="flex gap-1">
                <button 
                    onClick={() => onLanguageChange('ms')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${language === 'ms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                    MS
                </button>
                <button 
                    onClick={() => onLanguageChange('en')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                    EN
                </button>
             </div>
          </div>

          <NavItem view="dashboard" label={t(language, 'dashboard')} icon={Home} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t(language, 'mainMenu')}
          </div>
          
          <NavItem view="companies" label={t(language, 'companies')} icon={Building2} />
          
          <NavItem view="poster" label={t(language, 'posterTab')} icon={BookCopy} />

          {/* New Tab for Students to see their assigned Supervisor */}
          {isStudent && (
             <NavItem view="studentSupervision" label={t(language, 'menuSeliaan')} icon={UserCheck} />
          )}

          {/* New Tab for Lecturers to see their students */}
          {(isLecturer || hasSystemAccess) && (
            <NavItem view="supervised" label={t(language, 'supervisedTab')} icon={UsersRound} />
          )}

          {(hasSystemAccess || currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) && (
            <NavItem view="students" label={t(language, 'students')} icon={Users} />
          )}

          {hasSystemAccess && (
            <NavItem view="staff" label={t(language, 'staff')} icon={UserCog} />
          )}
          
          <NavItem view="applications" label={t(language, 'applications')} icon={FileText} />

          {hasSystemAccess && (
            <NavItem view="userActivities" label={language === 'ms' ? 'Aktiviti & Log Masuk' : 'Activities & Logins'} icon={Activity} />
          )}
          
          {hasSystemAccess && (
            <>
                <NavItem view="statistics" label={t(language, 'statistics')} icon={BarChart3} />
                <NavItem view="analysis" label={t(language, 'analysisTab')} icon={Map} />
            </>
          )}

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'references')}
          </div>
          <NavItem view="guidebook" label={t(language, 'guidebook')} icon={Book} />
          
          {(hasSystemAccess || isLecturer || isStudent) && (
             <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'management')}
           </div>
          )}

           {(hasSystemAccess || isLecturer || isStudent) && (
             <NavItem view="addCompany" label={t(language, 'addCompany')} icon={Upload} />
           )}

           {hasSystemAccess && (
             <>
               <NavItem view="uploadExcel" label={t(language, 'uploadExcel')} icon={FileSpreadsheet} />
               <NavItem view="systemData" label={t(language, 'systemData')} icon={Database} />
             </>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={() => handleNavigate('profile')} className="flex items-center gap-3 w-full p-2 rounded hover:bg-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 relative">
              {currentUser.name.charAt(0)}
              {isJKWBL && (
                  <div className="absolute -top-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full border border-white" title="Ahli JKWBL">
                      <ShieldCheck size={10} />
                  </div>
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                  {getRoleLabels(language)[currentUser.role]}
                  {isJKWBL && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded">JKWBL</span>}
              </div>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 text-red-600 text-sm py-2 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut size={16} />
            {t(language, 'logout')}
          </button>
          
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
             <p className="text-[9px] text-slate-400 leading-tight">
                {language === 'ms' ? 'Hak Cipta' : 'Copyright'} © {currentYear}<br/>Dr. Mohd Guzairy bin Abd Ghani
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto animate-fadeIn pb-20 md:pb-0 flex flex-col min-h-full">
          
          {/* Top Bar with Session details and Notification Dropdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                Session: 2026/2027
              </span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                {language === 'ms' 
                  ? 'Sesi Latihan WBL: 28/09/2026 - 27/09/2027' 
                  : 'WBL Training Period: 28/09/2026 - 27/09/2027'}
              </span>
            </div>

            {/* Notification Bell Icon */}
            <div className="relative self-end sm:self-auto">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all relative border border-slate-200 bg-slate-50 flex items-center justify-center"
                title={language === 'ms' ? 'Notifikasi' : 'Notifications'}
              >
                <Bell size={18} className={unreadCount > 0 ? "animate-swing origin-top" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-slideDown overflow-hidden max-h-[480px] flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <Bell size={16} className="text-blue-600" />
                        <span>{language === 'ms' ? 'Pemberitahuan' : 'Notifications'}</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} {language === 'ms' ? 'Baharu' : 'New'}
                          </span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Check size={14} />
                          <span>{language === 'ms' ? 'Semua Dibaca' : 'Mark All Read'}</span>
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell size={36} className="mx-auto mb-2 text-slate-200 stroke-1" />
                          <p className="text-xs font-medium">{language === 'ms' ? 'Tiada notifikasi baharu' : 'No new notifications'}</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-4 transition-colors relative hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-xs text-slate-800 leading-tight">
                                {language === 'ms' ? n.title_ms : n.title_en}
                              </h4>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotif(n.id);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title={language === 'ms' ? 'Padam' : 'Delete'}
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {language === 'ms' ? n.message_ms : n.message_en}
                            </p>
                            <div className="flex justify-between items-center mt-2.5">
                              <span className="text-[9px] font-medium text-slate-400">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                              {!n.is_read && (
                                <button 
                                  onClick={() => handleMarkRead(n.id)}
                                  className="text-[9px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline"
                                >
                                  <Check size={10} />
                                  <span>{language === 'ms' ? 'Tandakan Dibaca' : 'Mark Read'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1">
            {children}
          </div>
          
          <footer className="mt-12 py-6 border-t border-slate-200 text-center no-print">
            <p className="text-[10px] md:text-xs text-slate-400">
              {language === 'ms' ? 'Hak Cipta' : 'Copyright'} © {currentYear} Dr. Mohd Guzairy bin Abd Ghani. {language === 'ms' ? 'Hak Cipta Terpelihara' : 'All Rights Reserved'}.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
