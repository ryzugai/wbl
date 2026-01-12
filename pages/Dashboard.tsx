
import React, { useState, useEffect, useMemo } from 'react';
import { Application, Company, User, UserRole, AdConfig } from '../types';
import { Users, Building2, Clock, CheckCircle2, GraduationCap, BookOpen, Briefcase, X, ExternalLink, Calendar, Flag, MapPin, ClipboardCheck, Award, Timer, Info } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';

interface DashboardProps {
  applications: Application[];
  companies: Company[];
  users: User[];
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ applications, companies, users, language }) => {
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

  useEffect(() => {
    if (adConfig.isEnabled && adConfig.items.length > 1 && showAd) {
      const timer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adConfig.items.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [adConfig.isEnabled, adConfig.items.length, showAd]);

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

  const timelineProgress = useMemo(() => {
    const now = new Date();
    const start = new Date('2026-06-01'); 
    const end = new Date('2027-10-01');   
    
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
    { date: 'Jun 2026', label: language === 'ms' ? 'Persediaan' : 'Preparation', icon: ClipboardCheck },
    { date: '5 Okt 2026', label: language === 'ms' ? 'Mula WBL' : 'WBL Start', icon: Flag },
    { date: 'Mac 2027', label: language === 'ms' ? 'Pantau' : 'Monitoring', icon: MapPin },
    { date: 'Ogos 2027', label: language === 'ms' ? 'Penilaian' : 'Evaluation', icon: CheckCircle2 },
    { date: '1 Okt 2027', label: language === 'ms' ? 'Tamat' : 'Finish', icon: Award },
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
        <h2 className="text-2xl font-bold text-slate-800">{t(language, 'dashboard')}</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-600">{t(language, 'wblSession')}: 2026/2027</span>
        </div>
      </div>
      
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

      {/* POP-UP POSTER / IKLAN INDUSTRI */}
      {showAd && adConfig.isEnabled && activeAd && (
        <div className="fixed bottom-6 right-6 z-[100] hidden md:block animate-slideInUp group">
            <div className="relative w-[300px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
                <div className="absolute top-2 right-2 z-50 flex gap-2">
                    <button onClick={() => setShowAd(false)} className="bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"><X size={14} /></button>
                </div>
                <div className="relative bg-slate-50 min-h-[150px] flex items-center justify-center overflow-hidden">
                    <a key={activeAd.id} href={activeAd.destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full transition-opacity duration-500 animate-fadeIn">
                      <img 
                        src={activeAd.imageUrl} 
                        alt="Iklan Poster" 
                        className="w-full h-auto object-contain max-h-[450px]" 
                        onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = 'https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png';
                            target.className = "w-full h-auto p-8 opacity-20 grayscale";
                        }} 
                      />
                    </a>
                </div>
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            <Info size={12} />
                            <span>INFO WBL TERKINI</span>
                        </div>
                        {adConfig.items.length > 1 && (
                            <div className="flex gap-1.5">
                                {adConfig.items.map((_, idx) => (
                                    <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentAdIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-200'}`} />
                                ))}
                            </div>
                        )}
                    </div>
                    {activeAd.destinationUrl && (
                        <a href={activeAd.destinationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors uppercase tracking-tight">
                           Lihat Tawaran Penuh <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* TIMELINE */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-base font-bold text-slate-800 leading-none">{t(language, 'timelineTitle')} 2026/2027</h3>
                <p className="text-[11px] text-slate-500 mt-1">{t(language, 'timelineDesc')}</p>
            </div>
            <div className="text-right">
                <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{language === 'ms' ? 'Status Semasa' : 'Current Status'}</span>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date().toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
        </div>

        <div className="relative pt-6 pb-12 px-2">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out" 
                    style={{ width: `${timelineProgress}%` }}
                />
            </div>

            <div 
                className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
                style={{ left: `${timelineProgress}%` }}
            >
                <div className="relative -translate-x-1/2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-[3px] border-white shadow-md animate-pulse-custom" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                        {t(language, 'today')}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rotate-45" />
                    </div>
                </div>
            </div>

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

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-2 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow shadow-blue-200">
                        <Timer size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{t(language, 'countdownTitle')} 5 Okt 2026</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{t(language, 'laporDiri')}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {[
                        { label: t(language, 'days'), value: timeLeft.days },
                        { label: t(language, 'hours'), value: timeLeft.hours },
                        { label: t(language, 'mins'), value: timeLeft.minutes },
                        { label: t(language, 'secs'), value: timeLeft.seconds }
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

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t(language, 'students')} value={totalStudents} icon={GraduationCap} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatCard label={language === 'ms' ? 'Pensyarah' : 'Lecturers'} value={totalLecturers} icon={BookOpen} colorClass="text-teal-600" bgClass="bg-teal-50" />
        <StatCard label={language === 'ms' ? 'Industri' : 'Industry'} value={totalIndustryStaff} icon={Briefcase} colorClass="text-orange-600" bgClass="bg-orange-50" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t(language, 'applications')} value={applications.length} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50" />
          <StatCard label={t(language, 'companies')} value={companies.length} icon={Building2} colorClass="text-purple-600" bgClass="bg-purple-50" />
          <StatCard label={language === 'ms' ? 'Menunggu' : 'Pending'} value={pending} icon={Clock} colorClass="text-yellow-600" bgClass="bg-yellow-50" />
          <StatCard label={language === 'ms' ? 'Lulus' : 'Approved'} value={approved} icon={CheckCircle2} colorClass="text-green-600" bgClass="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-base mb-3 text-slate-800">{t(language, 'recentStatus')}</h3>
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
            <p className="text-slate-500 text-xs italic">{language === 'ms' ? 'Tiada permohonan terkini.' : 'No recent applications.'}</p>
          )}
        </div>

        <div className="bg-blue-600 p-5 rounded-xl shadow-md text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
                <h3 className="font-bold text-base mb-1">WBL System 2026/2027</h3>
                <p className="text-blue-100 text-xs mb-3">{language === 'ms' ? 'Pengurusan latihan industri yang efisien.' : 'Efficient industrial training management.'}</p>
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <p className="text-[11px] leading-relaxed italic text-white/90">"Memacu Kecemerlangan Teknousahawanan melalui Pembelajaran Berasaskan Kerja."</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
};
