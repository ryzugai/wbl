
import React, { useState, useEffect, useMemo } from 'react';
import { Application, Company, User, UserRole, AdConfig } from '../types';
import { Users, Building2, Clock, CheckCircle2, GraduationCap, BookOpen, Briefcase, X, ExternalLink, Calendar, Flag, MapPin, ClipboardCheck, Award, Timer } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setAdConfig(StorageService.getAdConfig());
    });
    return () => unsubscribe();
  }, []);

  // Timer untuk Karusel Iklan
  useEffect(() => {
    if (adConfig.isEnabled && adConfig.items.length > 1 && showAd) {
      const timer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adConfig.items.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [adConfig.isEnabled, adConfig.items.length, showAd]);

  // Logik Countdown ke 5 Oktober 2026
  useEffect(() => {
    const targetDate = new Date('2026-10-05T00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Logik Pengiraan Garis Masa
  const timelineProgress = useMemo(() => {
    const now = new Date();
    const start = new Date('2026-06-01'); // Mula fasa persediaan
    const end = new Date('2027-10-01');   // Tamat WBL
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const current = now.getTime() - start.getTime();
    return Math.round((current / total) * 100);
  }, []);

  const activeAd = adConfig.isEnabled && adConfig.items.length > 0 ? adConfig.items[currentAdIndex] : null;

  const pending = applications.filter(a => a.application_status === 'Menunggu').length;
  const approved = applications.filter(a => a.application_status === 'Diluluskan').length;

  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
  const totalLecturers = users.filter(u => u.role === UserRole.LECTURER).length;
  const totalIndustryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR).length;

  const milestones = [
    { date: 'Jun 2026', label: 'Persediaan', icon: ClipboardCheck, desc: 'Taklimat' },
    { date: '5 Okt 2026', label: 'Mula WBL', icon: Flag, desc: 'Lapor Diri' },
    { date: 'Mac 2027', label: 'Pantau', icon: MapPin, desc: 'Lawatan' },
    { date: 'Ogos 2027', label: 'Penilaian', icon: CheckCircle2, desc: 'Prestasi' },
    { date: '1 Okt 2027', label: 'Tamat', icon: Award, desc: 'Penyerahan' },
  ];

  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-transform hover:-translate-y-1">
      <div className={`p-3 rounded-lg ${bgClass}`}>
        <Icon className={colorClass} size={22} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <h3 className="text-xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-600">Sesi: 2026/2027</span>
        </div>
      </div>
      
      {/* CSS Animasi Khusus */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .animate-slideInUp { animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-custom { animation: pulse-blue 2s infinite; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />

      {/* Mini Floating Ad Popup */}
      {showAd && adConfig.isEnabled && activeAd && (
        <div className="fixed bottom-6 right-6 z-[100] hidden md:block animate-slideInUp group">
            <div className="relative w-[280px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)]">
                <div className="absolute top-2 right-2 z-50 flex gap-2">
                    <button onClick={() => setShowAd(false)} className="bg-black/40 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-sm transition-colors"><X size={14} /></button>
                </div>
                <div className="relative bg-slate-100 min-h-[100px]">
                    <a key={activeAd.id} href={activeAd.destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full transition-opacity duration-500 animate-fadeIn">
                      <img src={activeAd.imageUrl} alt="Iklan" className="w-full h-auto object-contain max-h-[400px]" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Imej+Tidak+Sah'; }} />
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
                        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                      </div>
                    </a>
                </div>
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Informasi WBL</span>
                        {adConfig.items.length > 1 && (
                            <div className="flex gap-1">
                                {adConfig.items.map((_, idx) => (
                                    <div key={idx} className={`h-1 rounded-full transition-all ${idx === currentAdIndex ? 'w-3 bg-blue-500' : 'w-1 bg-slate-300'}`} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* INFOGRAFIK GARIS MASA (TIMELINE) & COUNTDOWN */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-base font-bold text-slate-800 leading-none">Garis Masa WBL 2026/2027</h3>
                <p className="text-[11px] text-slate-500 mt-1">Perjalanan program mengikut fasa.</p>
            </div>
            <div className="text-right">
                <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Status Semasa</span>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
        </div>

        <div className="relative pt-6 pb-12 px-2">
            {/* Track Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out" 
                    style={{ width: `${timelineProgress}%` }}
                />
            </div>

            {/* Today Indicator */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
                style={{ left: `${timelineProgress}%` }}
            >
                <div className="relative -translate-x-1/2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-[3px] border-white shadow-md animate-pulse-custom" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                        HARI INI
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rotate-45" />
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div className="relative flex justify-between">
                {milestones.map((m, idx) => {
                    const milestoneDateString = m.date === 'Jun 2026' ? '2026-06-01' : 
                                               m.date === '5 Okt 2026' ? '2026-10-05' : 
                                               m.date === 'Mac 2027' ? '2027-03-01' : 
                                               m.date === 'Ogos 2027' ? '2027-08-01' : 
                                               '2027-10-01';
                    const milestoneDate = new Date(milestoneDateString);
                    const isPast = new Date() >= milestoneDate;
                    const Icon = m.icon;

                    return (
                        <div key={idx} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 border-white shadow-sm transition-all relative z-10 ${
                                isPast ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 border-slate-50'
                            }`}>
                                <Icon size={14} />
                            </div>
                            <div className="mt-2 text-center w-16">
                                <p className={`text-[8px] font-bold uppercase tracking-tighter ${isPast ? 'text-blue-600' : 'text-slate-400'}`}>{m.label}</p>
                                <p className="text-[9px] font-black text-slate-800 leading-none">{m.date}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Countdown Section - More Compact */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-2 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow shadow-blue-200">
                        <Timer size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-none">Berbaki ke 5 Okt 2026</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Lapor Diri Industri.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {[
                        { label: 'Hari', value: timeLeft.days },
                        { label: 'Jam', value: timeLeft.hours },
                        { label: 'Min', value: timeLeft.minutes },
                        { label: 'Saat', value: timeLeft.seconds }
                    ].map((unit, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-sm font-black text-blue-600 tabular-nums">
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{unit.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* User Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pelajar" value={totalStudents} icon={GraduationCap} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatCard label="Pensyarah" value={totalLecturers} icon={BookOpen} colorClass="text-teal-600" bgClass="bg-teal-50" />
        <StatCard label="Industri" value={totalIndustryStaff} icon={Briefcase} colorClass="text-orange-600" bgClass="bg-orange-50" />
      </div>

      {/* System Stats Row */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-3">Ringkasan Permohonan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Permohonan" value={applications.length} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50" />
            <StatCard label="Syarikat" value={companies.length} icon={Building2} colorClass="text-purple-600" bgClass="bg-purple-50" />
            <StatCard label="Menunggu" value={pending} icon={Clock} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
            <StatCard label="Lulus" value={approved} icon={CheckCircle2} colorClass="text-green-600" bgClass="bg-green-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-base mb-3 text-slate-800">Status Terkini</h3>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-none">{app.student_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{app.company_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
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
            <p className="text-slate-500 text-xs italic">Tiada permohonan terkini.</p>
          )}
        </div>

        <div className="bg-blue-600 p-5 rounded-xl shadow-md text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
                <h3 className="font-bold text-base mb-1">WBL System 2026/2027</h3>
                <p className="text-blue-100 text-xs mb-3">Pengurusan latihan industri yang efisien dan sistematik.</p>
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <p className="text-[11px] leading-relaxed italic text-white/90">"Memacu Kecemerlangan Teknousahawanan melalui Pembelajaran Berasaskan Kerja."</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </div>
  );
};
