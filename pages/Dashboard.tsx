import React, { useState, useEffect, useMemo } from 'react';
import { Application, Company, User, UserRole, AdConfig } from '../types';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  GraduationCap, 
  BookOpen, 
  Briefcase, 
  X, 
  ExternalLink, 
  Calendar, 
  Timer, 
  Info, 
  FileCheck2, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Check, 
  Send, 
  AlertCircle, 
  ChevronRight, 
  FileSpreadsheet
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';
import { generatePlacementConfirmationLetter } from '../utils/letterGenerator';
import { MalaysiaStudentMap } from '../components/MalaysiaStudentMap';
import { WBL_COURSE_SEQUENCE, UTEM_WEEKLY_ASSESSMENTS } from '../constants/utemWblRubrics';
import { DEFAULT_PLACED_STUDENTS, StudentPlacementPoint } from '../constants/wblPlacementData';
import { toast } from 'react-hot-toast';

interface DashboardProps {
  applications: Application[];
  companies: Company[];
  users: User[];
  currentUser?: User;
  language: Language;
  onNavigate?: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  applications, 
  companies, 
  users, 
  currentUser, 
  language, 
  onNavigate 
}) => {
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

  // Modular Course Milestones & Countdown (5-week modules & PSM2)
  const [selectedModularCourseCode, setSelectedModularCourseCode] = useState<string>('BTMU 2103(i)');

  // Determine active modular course dynamically based on current date
  const activeModularItem = useMemo(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    const found = WBL_COURSE_SEQUENCE.find(c => nowStr >= c.startDate && nowStr <= c.endDate);
    return found || WBL_COURSE_SEQUENCE[0]; // Default to Modul 1
  }, []);

  const selectedModularItem = useMemo(() => {
    return WBL_COURSE_SEQUENCE.find(c => c.courseCode === selectedModularCourseCode) || activeModularItem;
  }, [selectedModularCourseCode, activeModularItem]);

  // Weekly assessments for the selected modular course (5 weeks)
  const selectedCourseWeeklyAssessments = useMemo(() => {
    const list = UTEM_WEEKLY_ASSESSMENTS[selectedModularItem.courseCode] || [];
    return list;
  }, [selectedModularItem.courseCode]);

  // Dynamic countdown to the selected modular course milestone end date
  useEffect(() => {
    const targetDate = new Date(`${selectedModularItem.endDate}T23:59:59`).getTime();

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
  }, [selectedModularItem]);

  const studentPlacementApp = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) return null;
    return applications.find(a => 
      (a.student_id === currentUser.matric_no || a.created_by === currentUser.username) &&
      a.application_status === 'Diluluskan'
    ) || null;
  }, [currentUser, applications]);

  const studentPlacementCompany = useMemo(() => {
    if (!studentPlacementApp) return undefined;
    return companies.find(c => 
      c.company_name.toLowerCase().trim() === studentPlacementApp.company_name.toLowerCase().trim()
    );
  }, [studentPlacementApp, companies]);

  // Overall modular timeline progress (28 Sep 2026 to 12 Feb 2027)
  const timelineProgress = useMemo(() => {
    const now = new Date();
    const start = new Date('2026-09-28T00:00:00'); 
    const end = new Date('2027-02-12T23:59:59');   
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const current = now.getTime() - start.getTime();
    return Math.round((current / total) * 100);
  }, []);

  const activeAd = adConfig.isEnabled && adConfig.items.length > 0 ? adConfig.items[currentAdIndex] : null;

  // Real Cohort Metrics (Strictly 5 registered students undergoing WBL)
  const actualCohortStudents = 5;
  const approvedPlacedStudents = 5;
  const totalLecturers = Math.max(1, users.filter(u => u.role === UserRole.LECTURER).length);
  const totalIndustryStaff = Math.max(2, users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR).length);

  // 5 Real Placed Students Data with Live Logbook State
  const cohortStudentsList = useMemo<StudentPlacementPoint[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let liveLogs: any[] = [];
    try {
      liveLogs = StorageService.getWeeklyLogbooks();
    } catch {
      liveLogs = [];
    }

    return DEFAULT_PLACED_STUDENTS.map(defaultStudent => {
      // Find matching live application
      const matchedApp = applications.find(a => 
        (a.student_id && a.student_id.toLowerCase().trim() === defaultStudent.matricNo.toLowerCase().trim()) ||
        (a.student_name && a.student_name.toLowerCase().trim() === defaultStudent.name.toLowerCase().trim())
      );

      // Find matching user profile
      const studentUser = users.find(u => 
        (u.matric_no && u.matric_no.toLowerCase().trim() === defaultStudent.matricNo.toLowerCase().trim()) ||
        (u.name && u.name.toLowerCase().trim() === defaultStudent.name.toLowerCase().trim())
      );

      // Check live logbooks
      const userLogs = liveLogs.filter(l => 
        l.studentId === defaultStudent.studentId || 
        l.studentMatric === defaultStudent.matricNo
      );

      let hasFilledToday = defaultStudent.hasFilledTodayLog;
      let logSummary = defaultStudent.todayLogSummary;
      let logStatus = defaultStudent.todayLogStatus;

      if (userLogs.length > 0) {
        const allEntries = userLogs.flatMap((l: any) => l.entries || []);
        const todayEntry = allEntries.find((e: any) => e.date === todayStr);
        if (todayEntry) {
          hasFilledToday = true;
          logSummary = todayEntry.tasks;
          logStatus = 'verified';
        }
      }

      return {
        ...defaultStudent,
        companyName: matchedApp?.company_name || defaultStudent.companyName,
        industryTrainerName: studentUser?.industry_trainer_name || defaultStudent.industryTrainerName,
        facultySupervisorName: matchedApp?.faculty_supervisor_name || studentUser?.faculty_supervisor_name || defaultStudent.facultySupervisorName,
        hasFilledTodayLog: hasFilledToday,
        todayLogStatus: logStatus,
        todayLogSummary: logSummary,
        avatarUrl: studentUser?.profile_image && studentUser.profile_image !== 'idb_stored'
          ? studentUser.profile_image
          : defaultStudent.avatarUrl
      };
    });
  }, [applications, users]);

  const filledLogTodayCount = cohortStudentsList.filter(s => s.hasFilledTodayLog).length;
  const pendingLogTodayCount = actualCohortStudents - filledLogTodayCount;

  // Send Reminder Handler
  const handleSendReminder = (student: StudentPlacementPoint) => {
    toast.success(
      language === 'ms' 
        ? `Peringatan pengisian buku log harian telah dihantar kepada ${student.name}.`
        : `Daily logbook reminder sent to ${student.name}.`,
      { icon: '📩' }
    );
  };

  // Modular 5-week sequence milestones
  const modularMilestones = useMemo(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    return WBL_COURSE_SEQUENCE.map((c) => {
      const isPast = nowStr > c.endDate;
      const isActive = nowStr >= c.startDate && nowStr <= c.endDate;
      return {
        ...c,
        isPast,
        isActive
      };
    });
  }, []);

  const StatCard = ({ label, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5">
      <div className={`p-3 rounded-xl ${bgClass} shrink-0`}>
        <Icon className={colorClass} size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider truncate">{label}</p>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{value}</h3>
        {subtext && <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 text-blue-800 border border-blue-200">
              PORTAL PEMANTAUAN WBL UTeM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              KOHORT 2026/2027 (5 PELAJAR)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{t(language, 'dashboard')}</h2>
          <p className="text-xs text-slate-500">
            Pemantauan berpusat penempatan industri, log latihan harian, dan milestone kursus secara modular 5 minggu.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <Calendar size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Sesi WBL: 2026/2027 (Bermula 28 Sep 2026)</span>
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
                            target.onerror = null;
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

      {/* STUDENT PLACEMENT SUCCESS & CONFIRMATION LETTER BANNER */}
      {studentPlacementApp && currentUser && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-2xl p-5 text-white shadow-lg border border-emerald-500/30 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span>Status Penempatan Rasmi : Berjaya Ditempatkan</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                {studentPlacementApp.company_name}
              </h3>
              <p className="text-xs text-emerald-100 flex flex-wrap items-center gap-2">
                <span>📍 {studentPlacementApp.company_district ? `${studentPlacementApp.company_district}, ` : ''}{studentPlacementApp.company_state || 'Melaka'}</span>
                <span>•</span>
                <span>📅 Tarikh Melapor Diri di Syarikat: <strong className="text-white underline">28 September 2026</strong></span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => generatePlacementConfirmationLetter(studentPlacementApp, studentPlacementCompany, currentUser, '28 September 2026')}
                className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Jana & Cetak Surat Pengesahan Penempatan (Melapor Diri 28 September 2026)"
              >
                <FileCheck2 size={16} className="text-emerald-700" />
                <span>Jana Surat Confirmation (Melapor Diri 28 Sep 2026)</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 text-[11px] text-emerald-100 flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="font-semibold text-white">Perkara yang perlu dibawa semasa melapor diri (28 Sep 2026):</span>
            <span>✓ Surat Confirmation Penempatan</span>
            <span>✓ Salinan Surat Tawaran</span>
            <span>✓ Kad Matrik UTeM</span>
            <span>✓ Daily Logbook</span>
            <span>✓ Resume & Foto Passport</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GARIS MASA KURSUS MODULAR 5 MINGGU & HITUNG DETIK MILESTONE             */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                <Layers size={11} className="text-blue-600" />
                <span>KURIKULUM MODULAR WBL (5 MINGGU SETIAP MODUL)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                4 Kursus Modular @ 5 Minggu + PSM II (20 Minggu)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Garis Masa Milestone Kursus Secara Modular &amp; Hitung Detik
            </h3>
            <p className="text-xs text-slate-500">
              Pelaksanaan WBL 2026/2027 bermula 28 September 2026. Pilih mana-mana modul untuk melihat pecahan 5 minggu dan baki tempoh hitung detik.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Modul 1 Aktif (Operasi)</span>
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              {new Date().toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* OVERALL MODULAR PROGRESS BAR */}
        <div className="relative pt-3 pb-1 px-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
            <span>28 September 2026 (Mula WBL)</span>
            <span className="text-indigo-600 font-black">Kemajuan Keseluruhan Semester: {timelineProgress}%</span>
            <span>12 Februari 2027 (Tamat WBL)</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-1000 ease-out rounded-full" 
              style={{ width: `${Math.max(timelineProgress, 4)}%` }}
            />
          </div>

          <div 
            className="absolute top-9 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
            style={{ left: `${Math.max(timelineProgress, 4)}%` }}
          >
            <div className="relative -translate-x-1/2">
              <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white shadow-md animate-pulse-custom" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded whitespace-nowrap shadow-xs">
                Hari Ini
              </div>
            </div>
          </div>
        </div>

        {/* 5 MODULAR COURSE MILESTONE TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {modularMilestones.map((m, idx) => {
            const isSelected = selectedModularCourseCode === m.courseCode;
            const isCurrentActive = m.isActive;

            return (
              <button
                key={m.courseCode}
                type="button"
                onClick={() => setSelectedModularCourseCode(m.courseCode)}
                className={`p-3.5 rounded-2xl text-left transition-all border relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-blue-900 to-indigo-950 text-white border-blue-500 shadow-md ring-2 ring-blue-300'
                    : isCurrentActive
                    ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-300 text-slate-900 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : isCurrentActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {m.badge.split('(')[0].trim() || `Modul ${idx + 1}`}
                    </span>
                    <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {m.durationWeeks} Mggu
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono font-black block ${isSelected ? 'text-blue-200' : 'text-blue-600'}`}>
                    {m.courseCode}
                  </span>

                  <h4 className={`text-xs font-black line-clamp-2 mt-0.5 leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {m.shortName}
                  </h4>

                  <div className={`mt-2 text-[10px] space-y-0.5 ${isSelected ? 'text-indigo-200/90' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="shrink-0" />
                      <span>{new Date(m.startDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - {new Date(m.endDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="text-[9px]">
                      ⚖️ Nisbah: {m.evaluatorRatio}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/30 flex items-center justify-between text-[9px] font-bold">
                  {m.isPast ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Check size={11} /> Selesai
                    </span>
                  ) : isCurrentActive ? (
                    <span className={`flex items-center gap-1 font-black ${isSelected ? 'text-amber-300' : 'text-blue-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      Sedang Berjalan
                    </span>
                  ) : (
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                      Akan Datang
                    </span>
                  )}
                  <span className={isSelected ? 'text-white underline' : 'text-blue-600'}>
                    Pilih &raquo;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 5-WEEK MODULAR ROADMAP BREAKDOWN (FOR THE SELECTED MODULE) */}
        {selectedCourseWeeklyAssessments.length > 0 && (
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={13} className="text-blue-600" />
                <span>Struktur 5 Minggu Kursus: {selectedModularItem.courseCode} ({selectedModularItem.shortName})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                5 Minggu Modular Intensif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {selectedCourseWeeklyAssessments.map((w, idx) => {
                const nowStr = new Date().toISOString().split('T')[0];
                const sDate = w.startDate || selectedModularItem.startDate;
                const eDate = w.endDate || selectedModularItem.endDate;
                const isCurrentWeek = nowStr >= sDate && nowStr <= eDate;
                const isCompletedWeek = nowStr > eDate;

                return (
                  <div 
                    key={w.week} 
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      isCurrentWeek 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                        : isCompletedWeek
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                          isCurrentWeek 
                            ? 'bg-white text-blue-700' 
                            : isCompletedWeek 
                            ? 'bg-emerald-200 text-emerald-900' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          M{w.week} (Mggu {idx + 1})
                        </span>
                        {isCurrentWeek && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                        )}
                      </div>
                      <p className={`text-[10px] font-mono ${isCurrentWeek ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(sDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - {new Date(eDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                      </p>
                      <h5 className={`text-[11px] font-black line-clamp-2 mt-1 leading-tight ${isCurrentWeek ? 'text-white' : 'text-slate-900'}`}>
                        {w.taskTitle.split(':')[1]?.trim() || w.taskTitle}
                      </h5>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-200/40 text-[9px] font-bold">
                      {isCurrentWeek ? (
                        <span className="text-amber-300">★ Minggu Semasa</span>
                      ) : isCompletedWeek ? (
                        <span className="text-emerald-700">✓ Selesai</span>
                      ) : (
                        <span className="text-slate-400">Akan Datang</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HITUNG DETIK MILESTONE KURSUS SECARA MODULAR 5 MINGGU */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-900/60 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                  <Timer size={12} />
                  <span>HITUNG DETIK MILESTONE KURSUS MODULAR 5 MINGGU</span>
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {selectedModularItem.courseCode}
                </span>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-md">
                  {selectedModularItem.badge}
                </span>
              </div>

              <h4 className="text-xl font-black text-white tracking-tight">
                {selectedModularItem.order}. {selectedModularItem.courseName}
              </h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
                Tarikh Akhir Modul &amp; Penilaian Rubrik Mingguan: <strong className="text-white underline">{new Date(selectedModularItem.endDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (Tempoh: {selectedModularItem.durationWeeks} Minggu).
              </p>
            </div>

            {/* COUNTDOWN DIGITS */}
            <div className="flex items-center gap-2.5 shrink-0">
              {[
                { label: t(language, 'days'), value: timeLeft.days },
                { label: t(language, 'hours'), value: timeLeft.hours },
                { label: t(language, 'mins'), value: timeLeft.minutes },
                { label: t(language, 'secs'), value: timeLeft.seconds }
              ].map((unit, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner flex items-center justify-center text-lg sm:text-2xl font-black text-amber-300 tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-black text-indigo-200 uppercase mt-1 tracking-wider">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-indigo-200">
              <Sparkles size={13} className="text-amber-400" />
              <span>Nisbah Penilaian Rasmi UTeM: <strong>{selectedModularItem.evaluatorRatio}</strong> (Jurulatih Industri: {selectedModularItem.jiWeightPercent}%, Pensyarah Fakulti: {selectedModularItem.tpfWeightPercent}%)</span>
            </div>

            <div className="flex items-center gap-2">
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('dailyLogbook')}
                    className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <BookOpen size={13} />
                    <span>Buka Buku Log Pelajar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('weeklyAssessment')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>Penilaian Rubrik Mingguan</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RINGKASAN STATISTIK KOHORT WBL (5 ORANG PELAJAR SEBENAR)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          label={language === 'ms' ? 'Pelajar WBL (Kohort Rasmi)' : 'WBL Students (Cohort)'} 
          value={`${actualCohortStudents} Orang Pelajar`} 
          subtext={language === 'ms' ? 'Rekod Sebenar: 5 Orang Pelajar Berdaftar' : 'Actual Registered: 5 Students'}
          icon={GraduationCap} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Penempatan Industri Rasmi' : 'Official Placements'} 
          value={`${approvedPlacedStudents} / 5 Pelajar (100%)`} 
          subtext={language === 'ms' ? 'Semua Pelajar Telah Ditempatkan' : 'All Students Placed in Companies'}
          icon={CheckCircle2} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Status Pengisian Buku Log' : 'Daily Logbook Submission'} 
          value={`${filledLogTodayCount} / 5 Pelajar (${Math.round((filledLogTodayCount/actualCohortStudents)*100)}%)`} 
          subtext={language === 'ms' ? `${pendingLogTodayCount} Pelajar Belum Mengisi Hari Ini` : `${pendingLogTodayCount} Pending Today`}
          icon={Clock} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label={t(language, 'companies')} 
          value={`${companies.length || 5} Syarikat Rakan`} 
          subtext="CTRM, PETRONAS, Infineon, Intel, Inari"
          icon={Building2} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Pensyarah Penyelia Fakulti' : 'Faculty Supervisors'} 
          value={`${totalLecturers} Pensyarah`} 
          subtext={language === 'ms' ? 'Penyeliaan Akademik UTeM' : 'UTeM Academic Supervision'}
          icon={BookOpen} 
          colorClass="text-teal-600" 
          bgClass="bg-teal-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Jurulatih Industri (Trainer)' : 'Industry Trainers'} 
          value={`${totalIndustryStaff} Jurulatih`} 
          subtext={language === 'ms' ? 'Bimbingan Lapangan Industri' : 'Industry Technical Coaches'}
          icon={Briefcase} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50" 
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. PETA PENEMPATAN MALAYSIA DENGAN GAMBAR TERAPUNG & LOG HARIAN           */}
      {/* ========================================================================= */}
      <MalaysiaStudentMap
        applications={applications}
        companies={companies}
        users={users}
        currentUser={currentUser}
        language={language}
        onNavigate={onNavigate}
      />

      {/* ========================================================================= */}
      {/* 4. ROSTER PEMANTAUAN BUKU LOG HARIAN (5 ORANG PELAJAR KOHORT SEBENAR)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock size={11} className="text-amber-600" />
                <span>PEMANTAUAN BUKU LOG HARIAN</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                5 Pelajar Berdaftar (Kohort WBL 2026/2027)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Status Pengisian Buku Log Harian (5 Orang Pelajar Kohort)
            </h3>
            <p className="text-xs text-slate-500">
              Semakan rekod log latihan harian semasa untuk setiap pelajar industri. Klik pada mana-mana pelajar untuk membuka buku log penuh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>{filledLogTodayCount} Telah Isi Hari Ini</span>
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-600" />
              <span>{pendingLogTodayCount} Belum Hantar</span>
            </span>
          </div>
        </div>

        {/* 5 STUDENTS ROSTER CARDS */}
        <div className="grid grid-cols-1 gap-3">
          {cohortStudentsList.map((student) => {
            const isFilled = student.hasFilledTodayLog;

            return (
              <div
                key={student.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isFilled
                    ? 'bg-white hover:bg-emerald-50/20 border-slate-200'
                    : 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200 ring-1 ring-amber-200'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-xs"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80';
                      }}
                    />
                    <span 
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white ${
                        isFilled ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    >
                      {isFilled ? '✓' : '!'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {student.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                        {student.matricNo}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1.5">
                      <Building2 size={12} className="text-slate-400" />
                      <span>{student.companyName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-[11px]">📍 {student.district ? `${student.district}, ` : ''}{student.state}</span>
                    </p>

                    <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                      <span>Jurulatih: <strong className="text-slate-700">{student.industryTrainerName}</strong></span>
                      <span>Penyelia Fakulti: <strong className="text-slate-700">{student.facultySupervisorName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Logbook Status & Task Details */}
                <div className="flex-1 md:max-w-md bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Status Log Latihan Harian
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isFilled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                    }`}>
                      {isFilled ? '✓ Telah Mengisi Hari Ini' : '⚠️ Belum Mengisi Hari Ini'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                    {student.todayLogSummary || 'Tiada rekod catatan aktiviti.'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/40">
                    <span>Masa Latihan: <strong className="text-slate-700">{student.todayLogHours || (isFilled ? 8 : 0)} Jam</strong></span>
                    <span>Terkumpul: <strong className="text-slate-700">{student.totalLogbookHours} Jam ({student.totalWeeksLogged} Mggu)</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center gap-2 shrink-0">
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('dailyLogbook')}
                      className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <BookOpen size={12} />
                      <span>Buka Logbook</span>
                    </button>
                  )}

                  {!isFilled && (
                    <button
                      type="button"
                      onClick={() => handleSendReminder(student)}
                      className="w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Peringatan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT STATUS & SYSTEM PHILOSOPHY                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm text-slate-800">{t(language, 'recentStatus')}</h3>
            <span className="text-[10px] font-bold text-slate-400">5 Permohonan Rasmi Terkini</span>
          </div>
          {applications.length > 0 ? (
            <div className="space-y-2.5">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-black text-slate-800 leading-none">{app.student_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <span>{app.company_name}</span>
                      <span>•</span>
                      <span>📍 {app.company_district ? `${app.company_district}, ` : ''}{app.company_state || 'Melaka'}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${
                    app.application_status === 'Diluluskan' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-800'
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

        <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                  <GraduationCap size={12} />
                  <span>FPTT UTeM WBL 2026/2027</span>
                </div>
                <h3 className="font-black text-lg text-white">Struktur Latihan Industri Berasaskan Kerja</h3>
                <p className="text-blue-100 text-xs leading-relaxed">
                  Pengurusan latihan industri secara modular 5 minggu dengan bimbingan dwipenyeliaan (Jurulatih Industri 60% : Pensyarah Fakulti 40%).
                </p>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 mt-2">
                    <p className="text-[11px] leading-relaxed italic text-white/95">"Memacu Kecemerlangan Teknousahawanan melalui Pembelajaran Berasaskan Kerja (Work-Based Learning)."</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
