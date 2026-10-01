import React, { useState, useMemo } from 'react';
import { Application, Company, User, UserRole, WeeklyLogbook, DailyLogEntry } from '../types';
import { StorageService } from '../services/storage';
import { Language } from '../translations';
import { 
  MapPin, CheckCircle2, Clock, Users, Building2, BookOpen, 
  Search, Filter, ChevronRight, X, Sparkles, ExternalLink, 
  Compass, Eye, CheckCheck, AlertCircle, Award, Calendar, 
  Layers, Map as MapIcon, GraduationCap, Flame
} from 'lucide-react';

interface MalaysiaPlacementMapProps {
  applications: Application[];
  companies: Company[];
  users: User[];
  currentUser?: User;
  language?: Language;
  onNavigate?: (view: string) => void;
}

// Coordinate mapping for Malaysian States on SVG ViewBox 0 0 1000 480
// West Malaysia: x: 60 - 410, y: 40 - 430
// East Malaysia: x: 480 - 940, y: 70 - 400
export const STATE_COORDINATES: Record<string, { x: number; y: number; name: string; region: 'peninsular' | 'borneo' }> = {
  'Perlis': { x: 95, y: 55, name: 'Perlis', region: 'peninsular' },
  'Kedah': { x: 115, y: 92, name: 'Kedah', region: 'peninsular' },
  'Pulau Pinang': { x: 82, y: 120, name: 'Pulau Pinang', region: 'peninsular' },
  'Penang': { x: 82, y: 120, name: 'Pulau Pinang', region: 'peninsular' },
  'Perak': { x: 130, y: 168, name: 'Perak', region: 'peninsular' },
  'Kelantan': { x: 215, y: 108, name: 'Kelantan', region: 'peninsular' },
  'Terengganu': { x: 275, y: 145, name: 'Terengganu', region: 'peninsular' },
  'Pahang': { x: 240, y: 230, name: 'Pahang', region: 'peninsular' },
  'Selangor': { x: 140, y: 260, name: 'Selangor', region: 'peninsular' },
  'Kuala Lumpur': { x: 168, y: 256, name: 'WP Kuala Lumpur', region: 'peninsular' },
  'WP Kuala Lumpur': { x: 168, y: 256, name: 'WP Kuala Lumpur', region: 'peninsular' },
  'Putrajaya': { x: 166, y: 278, name: 'WP Putrajaya', region: 'peninsular' },
  'WP Putrajaya': { x: 166, y: 278, name: 'WP Putrajaya', region: 'peninsular' },
  'Negeri Sembilan': { x: 195, y: 295, name: 'Negeri Sembilan', region: 'peninsular' },
  'Melaka': { x: 205, y: 342, name: 'Melaka', region: 'peninsular' },
  'Malacca': { x: 205, y: 342, name: 'Melaka', region: 'peninsular' },
  'Johor': { x: 265, y: 365, name: 'Johor', region: 'peninsular' },
  'Sarawak': { x: 580, y: 310, name: 'Sarawak', region: 'borneo' },
  'Sabah': { x: 825, y: 175, name: 'Sabah', region: 'borneo' },
  'Labuan': { x: 755, y: 195, name: 'WP Labuan', region: 'borneo' },
  'WP Labuan': { x: 755, y: 195, name: 'WP Labuan', region: 'borneo' }
};

export interface PlacedStudentMarker {
  id: string;
  name: string;
  matricNo: string;
  program?: string;
  profileImage?: string;
  companyName: string;
  companyAddress?: string;
  companyDistrict?: string;
  companyState: string;
  x: number;
  y: number;
  applicationId: string;
  // Daily Logbook statistics
  hasDailyLog: boolean;
  dailyLogEntriesCount: number;
  latestEntryDate?: string;
  latestEntryDay?: string;
  latestEntryTask?: string;
  totalLogbookHours: number;
  logbookStatus?: string;
  supervisorName?: string;
  trainerName?: string;
}

export const MalaysiaPlacementMap: React.FC<MalaysiaPlacementMapProps> = ({
  applications,
  companies,
  users,
  currentUser,
  language = 'ms',
  onNavigate
}) => {
  const [selectedStudent, setSelectedStudent] = useState<PlacedStudentMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'logged' | 'pending'>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [regionView, setRegionView] = useState<'all' | 'peninsular' | 'borneo'>('all');

  // Load logbooks
  const logbooks = useMemo(() => {
    try {
      return StorageService.getWeeklyLogbooks();
    } catch {
      return [];
    }
  }, []);

  // Compute placed students data with coordinates and daily logbook tracking
  const placedStudents = useMemo(() => {
    // 1. Filter approved / placed applications
    const placedApps = applications.filter(a => 
      a.application_status === 'Diluluskan' || a.student_preferred
    );

    // Group by student matric / id to avoid duplicate markers for the same student
    const studentAppMap = new Map<string, Application>();
    placedApps.forEach(app => {
      const key = app.student_id || app.created_by;
      if (!studentAppMap.has(key)) {
        studentAppMap.set(key, app);
      } else {
        const existing = studentAppMap.get(key)!;
        if (app.application_status === 'Diluluskan' && existing.application_status !== 'Diluluskan') {
          studentAppMap.set(key, app);
        }
      }
    });

    const studentsList: PlacedStudentMarker[] = [];
    const stateCounts: Record<string, number> = {};

    studentAppMap.forEach((app, key) => {
      const user = users.find(u => 
        u.matric_no === app.student_id || 
        u.username === app.created_by || 
        (u.name && app.student_name && u.name.toLowerCase().trim() === app.student_name.toLowerCase().trim())
      );

      const comp = companies.find(c => 
        c.company_name && app.company_name && 
        c.company_name.toLowerCase().trim() === app.company_name.toLowerCase().trim()
      );

      // Determine state
      let cleanState = app.company_state || comp?.company_state || 'Melaka';
      // Normalize state string
      const matchedKey = Object.keys(STATE_COORDINATES).find(k => 
        cleanState.toLowerCase().includes(k.toLowerCase()) || 
        k.toLowerCase().includes(cleanState.toLowerCase())
      ) || 'Melaka';

      const baseCoords = STATE_COORDINATES[matchedKey] || STATE_COORDINATES['Melaka'];
      stateCounts[matchedKey] = (stateCounts[matchedKey] || 0) + 1;
      const countInState = stateCounts[matchedKey];

      // Calculate gentle offsets if multiple students in the same state
      const angle = (countInState - 1) * 1.25;
      const radius = countInState === 1 ? 0 : 22 + (countInState * 4);
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * (radius * 0.75);

      // Analyze Daily Logbook Status for this student
      const studentLogs = logbooks.filter(l => 
        (l.studentMatric && (l.studentMatric === app.student_id || l.studentMatric === user?.matric_no)) ||
        (l.studentId && (l.studentId === app.student_id || l.studentId === user?.id)) ||
        (l.studentName && app.student_name && l.studentName.toLowerCase().trim() === app.student_name.toLowerCase().trim())
      );

      let allEntries: DailyLogEntry[] = [];
      studentLogs.forEach(l => {
        if (Array.isArray(l.entries)) {
          allEntries = allEntries.concat(l.entries);
        }
      });

      // Check if student has recorded daily entries
      const hasDailyLog = allEntries.length > 0;
      const latestEntry = allEntries[allEntries.length - 1];
      const totalHours = studentLogs.reduce((sum, l) => sum + (l.totalHours || (l.entries?.length ? l.entries.length * 8 : 0)), 0);

      studentsList.push({
        id: user?.id || app.id,
        name: user?.name || app.student_name || 'Pelajar WBL',
        matricNo: user?.matric_no || app.student_id || 'B032110000',
        program: user?.program || app.student_program || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)',
        profileImage: user?.profile_image && user.profile_image !== 'idb_stored' ? user.profile_image : undefined,
        companyName: app.company_name,
        companyAddress: comp?.company_address || app.company_district ? `${app.company_district}, ${matchedKey}` : matchedKey,
        companyDistrict: app.company_district || comp?.company_district,
        companyState: matchedKey,
        x: Math.round(baseCoords.x + offsetX),
        y: Math.round(baseCoords.y + offsetY),
        applicationId: app.id,
        hasDailyLog,
        dailyLogEntriesCount: allEntries.length,
        latestEntryDate: latestEntry?.date,
        latestEntryDay: latestEntry?.day,
        latestEntryTask: latestEntry?.tasks,
        totalLogbookHours: totalHours,
        logbookStatus: studentLogs[studentLogs.length - 1]?.status || (hasDailyLog ? 'verified' : 'draft'),
        supervisorName: app.faculty_supervisor_name || user?.faculty_supervisor_name,
        trainerName: comp?.company_contact_person || user?.industry_trainer_name
      });
    });

    return studentsList;
  }, [applications, companies, users, logbooks]);

  // Statistics
  const totalPlaced = placedStudents.length;
  const totalDailyLogged = placedStudents.filter(s => s.hasDailyLog).length;
  const totalPendingLog = totalPlaced - totalDailyLogged;
  const dailyLogPercentage = totalPlaced > 0 ? Math.round((totalDailyLogged / totalPlaced) * 100) : 0;

  // Filtered markers based on user selections
  const filteredStudents = useMemo(() => {
    return placedStudents.filter(student => {
      // Region filter
      if (regionView === 'peninsular') {
        const stateInfo = STATE_COORDINATES[student.companyState];
        if (stateInfo && stateInfo.region !== 'peninsular') return false;
      } else if (regionView === 'borneo') {
        const stateInfo = STATE_COORDINATES[student.companyState];
        if (stateInfo && stateInfo.region !== 'borneo') return false;
      }

      // State filter
      if (selectedStateFilter !== 'all' && student.companyState !== selectedStateFilter) {
        return false;
      }

      // Log status filter
      if (logFilter === 'logged' && !student.hasDailyLog) return false;
      if (logFilter === 'pending' && student.hasDailyLog) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchMatric = student.matricNo.toLowerCase().includes(q);
        const matchComp = student.companyName.toLowerCase().includes(q);
        const matchState = student.companyState.toLowerCase().includes(q);
        if (!matchName && !matchMatric && !matchComp && !matchState) return false;
      }

      return true;
    });
  }, [placedStudents, regionView, selectedStateFilter, logFilter, searchQuery]);

  // Group count by state for map badge tags
  const stateSummary = useMemo(() => {
    const summary: Record<string, { total: number; logged: number; pending: number }> = {};
    placedStudents.forEach(s => {
      if (!summary[s.companyState]) {
        summary[s.companyState] = { total: 0, logged: 0, pending: 0 };
      }
      summary[s.companyState].total += 1;
      if (s.hasDailyLog) {
        summary[s.companyState].logged += 1;
      } else {
        summary[s.companyState].pending += 1;
      }
    });
    return summary;
  }, [placedStudents]);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold tracking-wider uppercase">
            <Compass size={14} className="animate-spin-slow" />
            <span>Peta Taburan Industri & Pemantauan Logbook Harian</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Peta Penempatan Pelatih WBL Malaysia</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
              Sesi 2026/2027
            </span>
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {language === 'ms'
              ? 'Pantau lokasi penempatan industri pelajar di seluruh Semenanjung, Sabah & Sarawak serta status pengisian buku log secara harian secara visual interaktif.'
              : 'Monitor industrial training placement locations across Peninsular Malaysia, Sabah & Sarawak and daily logbook submission statuses in real time.'}
          </p>
        </div>

        {/* Quick summary stat badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
              <MapPin size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Ditempatkan</div>
              <div className="text-base font-black text-white">{totalPlaced} <span className="text-[11px] font-normal text-slate-400">pelajar</span></div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/40 flex items-center gap-3 shadow-inner ring-1 ring-emerald-500/30">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              <CheckCheck size={16} />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Logbook Harian</span>
              </div>
              <div className="text-base font-black text-emerald-300">
                {totalDailyLogged} <span className="text-[10px] font-bold text-emerald-400/80">({dailyLogPercentage}%)</span>
              </div>
            </div>
          </div>

          {totalPendingLog > 0 && (
            <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/30 flex items-center gap-3 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-[10px] text-amber-400 uppercase font-bold">Belum Catat Hari Ini</div>
                <div className="text-base font-black text-amber-300">{totalPendingLog} <span className="text-[11px] font-normal text-slate-400">pelajar</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
        {/* Region and Log Status tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Region selector */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-700/60 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setRegionView('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                regionView === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Malaysia
            </button>
            <button
              type="button"
              onClick={() => setRegionView('peninsular')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                regionView === 'peninsular' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semenanjung
            </button>
            <button
              type="button"
              onClick={() => setRegionView('borneo')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                regionView === 'borneo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sabah & Sarawak
            </button>
          </div>

          {/* Daily logbook filter pills */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-700/60 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setLogFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                logFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({totalPlaced})
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('logged')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                logFilter === 'logged' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <CheckCheck size={13} />
              <span>Telah Mengisi Harian ({totalDailyLogged})</span>
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                logFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              <Clock size={13} />
              <span>Belum Catat ({totalPendingLog})</span>
            </button>
          </div>
        </div>

        {/* Search and state dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'ms' ? 'Cari pelatih, syarikat...' : 'Search student...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 md:w-56"
            />
          </div>

          <select
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Semua Negeri ({Object.keys(stateSummary).length})</option>
            {Object.keys(stateSummary).map((st) => (
              <option key={st} value={st}>
                {st} ({stateSummary[st]?.total || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAP CONTAINER (Interactive SVG with Floating Student Avatars) */}
      <div className="relative w-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-inner p-2 md:p-4">
        {/* Watermark Compass & Coordinates */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-slate-600 text-[11px] font-mono pointer-events-none select-none">
          <Compass size={18} className="text-slate-500" />
          <span>MALAYSIA (WBL GEOGRAPHICAL MONITORING) • 4° 12' N, 101° 58' E</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-lg">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[9px]">Petunjuk Status Logbook:</div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/40 animate-pulse flex items-center justify-center text-[9px] text-slate-950 font-bold">✓</span>
            <span className="text-slate-300">Telah Mengisi Buku Log Harian</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-400/40" />
            <span className="text-slate-400">Belum Mengisi Hari Ini</span>
          </div>
        </div>

        {/* SVG MAP OF MALAYSIA */}
        <div className="relative w-full aspect-[2.1/1] min-h-[360px] md:min-h-[460px] overflow-hidden flex items-center justify-center">
          <svg
            viewBox="0 0 1000 480"
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
          >
            <defs>
              {/* Radial glow for placed points */}
              <radialGradient id="greenPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
              </radialGradient>
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
              </pattern>
            </defs>

            {/* Maritime subtle grid */}
            <rect width="1000" height="480" fill="url(#gridPattern)" />

            {/* Ocean dividers & labels */}
            <text x="360" y="240" fill="#334155" fontSize="13" fontWeight="bold" letterSpacing="6" opacity="0.6">
              LAUT CHINA SELATAN
            </text>
            <text x="180" y="440" fill="#1e293b" fontSize="11" fontWeight="bold" letterSpacing="4">
              SELAT MELAKA
            </text>

            {/* ==================== SEMENANJUNG MALAYSIA (PENINSULAR) ==================== */}
            <g id="semenanjung-group">
              {/* Outer boundary / Peninsular Landmass */}
              <path
                d="M 90,45 
                   L 135,45 L 175,65 L 220,70 L 250,95 L 305,130 L 325,175 L 315,225 L 310,270 L 320,320 L 300,375 L 285,405 L 255,410 L 210,380 L 195,355 L 175,325 L 140,295 L 115,245 L 105,190 L 80,140 L 75,100 L 85,60 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-colors hover:fill-slate-800"
              />

              {/* State divider curves inside Peninsular */}
              {/* Perlis & Kedah */}
              <path d="M 85,75 Q 110,75 130,80" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Pulau Pinang Island */}
              <circle cx="78" cy="120" r="7" fill="#2563eb" opacity="0.7" stroke="#60a5fa" strokeWidth="1" />
              {/* Perak & Kelantan/Pahang */}
              <path d="M 125,80 Q 145,130 160,200 L 140,270" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
              {/* Kelantan & Terengganu */}
              <path d="M 230,75 Q 240,110 250,150" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Terengganu & Pahang */}
              <path d="M 250,150 Q 285,185 315,200" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Selangor & Negeri Sembilan */}
              <path d="M 140,270 L 190,285" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Negeri Sembilan & Melaka */}
              <path d="M 175,325 L 215,328" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Melaka & Johor */}
              <path d="M 215,355 L 235,355" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
              {/* Pahang & Johor */}
              <path d="M 235,355 Q 260,335 305,340" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />

              {/* State labels micro-typography */}
              <text x="95" y="70" fill="#64748b" fontSize="8" fontWeight="bold" opacity="0.7">PERLIS</text>
              <text x="100" y="105" fill="#64748b" fontSize="8" fontWeight="bold" opacity="0.7">KEDAH</text>
              <text x="50" y="123" fill="#38bdf8" fontSize="8" fontWeight="bold">P.PINANG</text>
              <text x="115" y="155" fill="#64748b" fontSize="9" fontWeight="bold" opacity="0.7">PERAK</text>
              <text x="195" y="115" fill="#64748b" fontSize="9" fontWeight="bold" opacity="0.7">KELANTAN</text>
              <text x="255" y="145" fill="#64748b" fontSize="8" fontWeight="bold" opacity="0.7">TERENGGANU</text>
              <text x="230" y="215" fill="#64748b" fontSize="10" fontWeight="bold" opacity="0.7">PAHANG</text>
              <text x="122" y="250" fill="#64748b" fontSize="8" fontWeight="bold" opacity="0.7">SELANGOR</text>
              <text x="148" y="260" fill="#fbbf24" fontSize="8" fontWeight="bold">KL</text>
              <text x="165" y="295" fill="#64748b" fontSize="8" fontWeight="bold" opacity="0.7">N.SEMBILAN</text>
              <text x="175" y="342" fill="#34d399" fontSize="9" fontWeight="black">MELAKA (UTeM)</text>
              <text x="245" y="375" fill="#64748b" fontSize="10" fontWeight="bold" opacity="0.7">JOHOR</text>
            </g>

            {/* ==================== MALAYSIA TIMUR (SARAWAK, SABAH & LABUAN) ==================== */}
            <g id="borneo-group">
              {/* Sarawak Landmass */}
              <path
                d="M 505,370 
                   Q 515,340 535,320 
                   L 560,310 L 610,290 L 650,260 L 710,230 L 740,200 L 760,195
                   L 760,225 L 730,265 L 700,310 L 650,335 L 590,365 L 545,385 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-colors hover:fill-slate-800"
              />

              {/* Sabah Landmass */}
              <path
                d="M 760,195 
                   L 775,170 L 795,145 L 815,115 L 840,110 L 860,135 L 900,165 
                   L 930,195 L 900,245 L 870,260 L 840,250 L 810,235 L 780,215 Z"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-colors hover:fill-slate-800"
              />

              {/* Labuan Island */}
              <circle cx="752" cy="190" r="5" fill="#f59e0b" opacity="0.8" stroke="#fbbf24" strokeWidth="1" />
              <text x="735" y="180" fill="#fbbf24" fontSize="8" fontWeight="bold">LABUAN</text>

              {/* Boundary between Sarawak & Sabah */}
              <path d="M 760,195 L 780,215" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />

              {/* East Malaysia State labels */}
              <text x="600" y="325" fill="#64748b" fontSize="12" fontWeight="bold" opacity="0.7">SARAWAK</text>
              <text x="825" y="195" fill="#64748b" fontSize="12" fontWeight="bold" opacity="0.7">SABAH</text>
            </g>

            {/* Geographical Regional Anchor Pulses */}
            {Object.entries(STATE_COORDINATES).map(([stName, coords]) => {
              const summary = stateSummary[stName];
              if (!summary || summary.total === 0) return null;

              const isHighlighted = hoveredState === stName || selectedStateFilter === stName;

              return (
                <g key={stName} className="cursor-pointer" onClick={() => setSelectedStateFilter(stName)}>
                  {/* Subtle target aura */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isHighlighted ? 28 : 18}
                    fill={summary.logged > 0 ? "url(#greenPulse)" : "url(#blueGlow)"}
                    className="transition-all duration-300"
                  />
                  {/* Anchor state badge tag */}
                  <g transform={`translate(${coords.x}, ${coords.y + 24})`}>
                    <rect
                      x="-24"
                      y="-8"
                      width="48"
                      height="15"
                      rx="7.5"
                      fill="#0f172a"
                      stroke={summary.logged > 0 ? "#10b981" : "#3b82f6"}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2.5"
                      fill="#e2e8f0"
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      {summary.total} {summary.total === 1 ? 'Pelatih' : 'Pelatih'}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* ==================== FLOATING STUDENT AVATAR PINS (HTML OVERLAY) ==================== */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredStudents.map((student, idx) => {
              const isSelected = selectedStudent?.id === student.id;
              const hasLoggedDaily = student.hasDailyLog;

              return (
                <div
                  key={student.id}
                  style={{
                    left: `${(student.x / 1000) * 100}%`,
                    top: `${(student.y / 480) * 100}%`,
                    animationDelay: `${(idx % 5) * 0.25}s`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 ${
                    isSelected ? 'z-40 scale-125' : 'z-20 hover:z-30 hover:scale-115'
                  }`}
                >
                  {/* Floating Pin Wrapper with smooth CSS animation */}
                  <div className="relative group cursor-pointer" onClick={() => setSelectedStudent(student)}>
                    {/* Stem anchor pointing to exact state point */}
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1.5 h-3 bg-gradient-to-b from-slate-700 to-transparent" />

                    {/* Glowing Ping Ring for daily logbook completed */}
                    {hasLoggedDaily ? (
                      <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    ) : (
                      <span className="absolute -inset-0.5 rounded-full bg-amber-400 opacity-30" />
                    )}

                    {/* Circular Avatar Pin */}
                    <div className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-xl border-2 transition-transform ${
                      hasLoggedDaily 
                        ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-emerald-500/30' 
                        : 'border-amber-400 ring-2 ring-amber-500/30 shadow-amber-500/20'
                    } bg-slate-900 flex items-center justify-center`}>
                      {student.profileImage ? (
                        <img
                          src={student.profileImage}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-xs ${
                          hasLoggedDaily ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Small Status Indicator Badge on Avatar */}
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-slate-900 flex items-center justify-center text-[8px] font-black ${
                        hasLoggedDaily ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {hasLoggedDaily ? '✓' : '!'}
                      </div>
                    </div>

                    {/* Floating Pill Tag with Student Name & Company */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700 text-[9px] font-bold text-slate-200 shadow-md flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="truncate max-w-[85px]">{student.name.split(' ')[0]}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-blue-400 truncate max-w-[70px]">{student.companyState}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== SELECTED STUDENT DETAILS MODAL / CARD ==================== */}
      {selectedStudent && (
        <div className="bg-slate-850 rounded-2xl p-5 border border-slate-700/80 shadow-2xl relative animate-fadeIn">
          <button
            type="button"
            onClick={() => setSelectedStudent(null)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Student Avatar & Basic Info (4 cols) */}
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-lg ${
                  selectedStudent.hasDailyLog ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-amber-400'
                } bg-slate-800 flex items-center justify-center`}>
                  {selectedStudent.profileImage ? (
                    <img src={selectedStudent.profileImage} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-white">{selectedStudent.name.charAt(0)}</span>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase shadow ${
                  selectedStudent.hasDailyLog ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {selectedStudent.hasDailyLog ? 'Aktif' : 'Menunggu'}
                </div>
              </div>

              <div className="space-y-0.5">
                <h4 className="font-black text-base text-white">{selectedStudent.name}</h4>
                <div className="font-mono text-xs font-bold text-blue-400">{selectedStudent.matricNo}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{selectedStudent.program}</div>
              </div>
            </div>

            {/* Placement Info & Location (4 cols) */}
            <div className="md:col-span-4 space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 size={12} className="text-blue-400" />
                <span>Syarikat Penempatan Industri:</span>
              </div>
              <div className="font-bold text-sm text-white">{selectedStudent.companyName}</div>
              <div className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin size={12} className="text-emerald-400 shrink-0" />
                <span>{selectedStudent.companyAddress}</span>
              </div>
              {selectedStudent.trainerName && (
                <div className="text-[11px] text-slate-400 pt-0.5">
                  Jurulatih Industri: <strong className="text-slate-200">{selectedStudent.trainerName}</strong>
                </div>
              )}
            </div>

            {/* Daily Logbook Status (4 cols) */}
            <div className={`md:col-span-4 p-3.5 rounded-xl border space-y-2 ${
              selectedStudent.hasDailyLog 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100' 
                : 'bg-amber-950/20 border-amber-500/30 text-amber-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCheck size={14} className={selectedStudent.hasDailyLog ? 'text-emerald-400' : 'text-amber-400'} />
                  <span>Status Buku Log Harian</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedStudent.hasDailyLog ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {selectedStudent.hasDailyLog ? 'Telah Mengisi Hari Ini' : 'Belum Ada Catatan'}
                </span>
              </div>

              {selectedStudent.hasDailyLog ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Catatan Harian Terkumpul:</span>
                    <strong className="text-emerald-300">{selectedStudent.dailyLogEntriesCount} Entri ({selectedStudent.totalLogbookHours} Jam)</strong>
                  </div>
                  {selectedStudent.latestEntryDate && (
                    <div className="text-[11px] text-slate-300">
                      Tarikh Terkini: <strong>{selectedStudent.latestEntryDay || ''} ({selectedStudent.latestEntryDate})</strong>
                    </div>
                  )}
                  {selectedStudent.latestEntryTask && (
                    <div className="text-[10px] bg-slate-900/80 p-2 rounded-lg text-slate-300 italic border border-emerald-500/20 line-clamp-2">
                      "{selectedStudent.latestEntryTask}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-amber-200/80 leading-relaxed">
                  Pelajar ini belum mengemukakan entri buku log harian bagi minggu semasa. Peringatan mesra boleh dihantar melalui modul mesej WBL.
                </div>
              )}

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('dailyLogbook')}
                  className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Buka Modul Buku Log</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SENARAI PEMANTAUAN BUKU LOG HARIAN PELAJAR ==================== */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-400" />
              <span>Senarai Pelajar Mengisi Buku Log Secara Harian ({filteredStudents.length})</span>
            </h4>
            <p className="text-xs text-slate-400">
              Semak rekod pengisian aktiviti harian mengikut tempat latihan industri masing-masing.
            </p>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Menunjukkan: <strong>{filteredStudents.length}</strong> daripada {totalPlaced} pelatih</span>
          </div>
        </div>

        {/* Grid of Student Log Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 space-y-1">
              <AlertCircle size={28} className="mx-auto text-slate-600" />
              <p className="text-xs font-bold">Tiada pelajar yang sepadan dengan kriteria carian/penapis semasa.</p>
              <p className="text-[10px] text-slate-500">Sila ubah pilihan negeri atau tetapan penapis logbook di atas.</p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedStudent?.id === student.id;
              const hasLogged = student.hasDailyLog;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    isSelected 
                      ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500' 
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-xl overflow-hidden border ${
                        hasLogged ? 'border-emerald-400' : 'border-amber-400'
                      } bg-slate-800 flex items-center justify-center shadow`}>
                        {student.profileImage ? (
                          <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-slate-200">{student.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-900 ${
                        hasLogged ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-black text-white truncate">{student.name}</h5>
                        <span className="font-mono text-[9px] text-slate-400 shrink-0">{student.matricNo}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300 truncate">{student.companyName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} className="text-blue-400 shrink-0" />
                        <span className="truncate">{student.companyState}</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Logbook Indicator Bar */}
                  <div className={`p-2 rounded-xl text-[10px] flex items-center justify-between border ${
                    hasLogged 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate">
                      {hasLogged ? <CheckCheck size={12} className="text-emerald-400 shrink-0" /> : <Clock size={12} className="text-amber-400 shrink-0" />}
                      <span className="font-bold truncate">
                        {hasLogged ? `Log Harian: ${student.dailyLogEntriesCount} Entri (${student.totalLogbookHours}j)` : 'Belum Mengisi Hari Ini'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 hover:text-white font-bold text-[9px] shrink-0"
                    >
                      Peta
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
