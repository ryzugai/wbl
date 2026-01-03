
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Building2, Users, FileText, Upload, FileSpreadsheet, UserCog, Book, Database, Wifi, WifiOff, Menu, X, ShieldCheck, BarChart3, Languages, Map, BookCopy, UsersRound } from 'lucide-react';
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
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsCloud(StorageService.isCloudEnabled());
  }, []);

  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const isLecturer = currentUser.role === UserRole.LECTURER;
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

          {/* New Tab for Lecturers */}
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
            <>
                <NavItem view="statistics" label={t(language, 'statistics')} icon={BarChart3} />
                <NavItem view="analysis" label={t(language, 'analysisTab')} icon={Map} />
            </>
          )}

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'references')}
          </div>
          <NavItem view="guidebook" label={t(language, 'guidebook')} icon={Book} />
          
          {(hasSystemAccess || currentUser.role === UserRole.LECTURER) && (
             <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'management')}
           </div>
          )}

           {(hasSystemAccess || currentUser.role === UserRole.LECTURER) && (
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
