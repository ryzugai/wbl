
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { LogOut, Home, Building2, Users, FileText, UserCircle, Upload, FileSpreadsheet, UserCog, Book, Database, Wifi, WifiOff } from 'lucide-react';
import { ROLE_LABELS } from '../constants';
import { StorageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout }) => {
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    setIsCloud(StorageService.isCloudEnabled());
  }, []);

  const NavItem = ({ view, label, icon: Icon }: { view: string, label: string, icon: any }) => (
    <button
      onClick={() => onNavigate(view)}
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
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
          <NavItem view="dashboard" label="Dashboard" icon={Home} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          
          <NavItem view="companies" label="Senarai Syarikat" icon={Building2} />
          
          {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) && (
            <NavItem view="students" label="Senarai Pelajar" icon={Users} />
          )}

          {currentUser.role === UserRole.COORDINATOR && (
            <NavItem view="staff" label="Senarai Staf" icon={UserCog} />
          )}
          
          <NavItem view="applications" label="Permohonan" icon={FileText} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             Rujukan
          </div>
          <NavItem view="guidebook" label="Buku Panduan" icon={Book} />
          
          {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER) && (
             <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             Pengurusan
           </div>
          )}

           {(currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.LECTURER) && (
             <NavItem view="addCompany" label="Tambah Syarikat" icon={Upload} />
           )}

           {currentUser.role === UserRole.COORDINATOR && (
             <>
               <NavItem view="uploadExcel" label="Upload Excel" icon={FileSpreadsheet} />
               <NavItem view="systemData" label="Sistem & Data" icon={Database} />
             </>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={() => onNavigate('profile')} className="flex items-center gap-3 w-full p-2 rounded hover:bg-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate">{ROLE_LABELS[currentUser.role]}</div>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 text-red-600 text-sm py-2 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut size={16} />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
};
