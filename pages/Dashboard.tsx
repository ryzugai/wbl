
import React, { useState, useEffect } from 'react';
import { Application, Company, User, UserRole, AdConfig } from '../types';
import { Users, Building2, Clock, CheckCircle2, GraduationCap, BookOpen, Briefcase, X, ExternalLink } from 'lucide-react';
import { StorageService } from '../services/storage';

interface DashboardProps {
  applications: Application[];
  companies: Company[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ applications, companies, users }) => {
  const [adConfig, setAdConfig] = useState<AdConfig>(StorageService.getAdConfig());
  const [showAd, setShowAd] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setAdConfig(StorageService.getAdConfig());
    });
    return () => unsubscribe();
  }, []);

  // Timer untuk Karusel Iklan (Setiap 10 Saat)
  useEffect(() => {
    if (adConfig.isEnabled && adConfig.items.length > 1 && showAd) {
      const timer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adConfig.items.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [adConfig.isEnabled, adConfig.items.length, showAd]);

  const activeAd = adConfig.isEnabled && adConfig.items.length > 0 ? adConfig.items[currentAdIndex] : null;

  const pending = applications.filter(a => a.application_status === 'Menunggu').length;
  const approved = applications.filter(a => a.application_status === 'Diluluskan').length;

  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
  const totalLecturers = users.filter(u => u.role === UserRole.LECTURER).length;
  const totalIndustryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR).length;

  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-4 rounded-lg ${bgClass}`}>
        <Icon className={colorClass} size={28} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 relative">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
      
      {/* CSS Animasi Khusus */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideInUp {
          animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Mini Floating Ad Popup (Penjuru Bawah Kanan) */}
      {showAd && adConfig.isEnabled && activeAd && (
        <div className="fixed bottom-6 right-6 z-[100] hidden md:block animate-slideInUp group">
            <div className="relative w-[280px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
                
                {/* Header Kecil & Butang Tutup */}
                <div className="absolute top-2 right-2 z-50 flex gap-2">
                    <button 
                        onClick={() => setShowAd(false)}
                        className="bg-black/40 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                        title="Tutup"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Kontainer Gambar Dinamik (Ikut nisbah gambar) */}
                <div className="relative bg-slate-100 min-h-[100px]">
                    <a 
                      key={activeAd.id}
                      href={activeAd.destinationUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full transition-opacity duration-500 animate-fadeIn"
                    >
                      <img 
                        src={activeAd.imageUrl} 
                        alt="Iklan" 
                        className="w-full h-auto object-contain max-h-[400px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Imej+Tidak+Sah';
                        }}
                      />
                      
                      {/* Overlay Link */}
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                      </div>
                    </a>
                </div>

                {/* Footer Iklan & Indikator */}
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Informasi WBL</span>
                        
                        {/* Dots Karusel */}
                        {adConfig.items.length > 1 && (
                            <div className="flex gap-1">
                                {adConfig.items.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1 rounded-full transition-all ${idx === currentAdIndex ? 'w-3 bg-blue-500' : 'w-1 bg-slate-300'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* User Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Jumlah Pelajar" 
          value={totalStudents} 
          icon={GraduationCap} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
        <StatCard 
          label="Jumlah Pensyarah" 
          value={totalLecturers} 
          icon={BookOpen} 
          colorClass="text-teal-600" 
          bgClass="bg-teal-50"
        />
        <StatCard 
          label="Jumlah Staf Industri" 
          value={totalIndustryStaff} 
          icon={Briefcase} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50"
        />
      </div>

      {/* System Stats Row */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Status Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
            label="Jumlah Permohonan" 
            value={applications.length} 
            icon={Users} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50"
            />
            <StatCard 
            label="Jumlah Syarikat" 
            value={companies.length} 
            icon={Building2} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50"
            />
            <StatCard 
            label="Menunggu Kelulusan" 
            value={pending} 
            icon={Clock} 
            colorClass="text-yellow-600" 
            bgClass="bg-yellow-50"
            />
            <StatCard 
            label="Telah Diluluskan" 
            value={approved} 
            icon={CheckCircle2} 
            colorClass="text-green-600" 
            bgClass="bg-green-50"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Status Permohonan Terkini</h3>
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="font-medium text-slate-800">{app.student_name}</p>
                    <p className="text-xs text-slate-500">{app.company_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    app.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700' :
                    app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {app.application_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Tiada permohonan terkini.</p>
          )}
        </div>

        <div className="bg-blue-600 p-6 rounded-xl shadow-md text-white relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Selamat Datang ke WBL System</h3>
                <p className="text-blue-100 mb-6">Sistem pengurusan latihan industri yang efisien.</p>
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <p className="text-sm">Sila pastikan semua maklumat pelajar dan syarikat dikemaskini sebelum membuat permohonan.</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-blue-400/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </div>
  );
};
