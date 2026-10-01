import React, { useState, useMemo } from 'react';
import { Application, Company, User, UserRole, WeeklyLogbook, DailyLogEntry } from '../types';
import { 
  MALAYSIA_STATE_PATHS, 
  DEFAULT_PLACED_STUDENTS, 
  StudentPlacementPoint, 
  getStudentCoordinatesByState 
} from '../constants/wblPlacementData';
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  GraduationCap, 
  Calendar, 
  Search, 
  Filter, 
  Compass, 
  ChevronRight, 
  X, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  MessageSquare, 
  UserCheck, 
  Eye, 
  Layers, 
  Send 
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface MalaysiaStudentMapProps {
  applications: Application[];
  companies: Company[];
  users: User[];
  currentUser?: User;
  language: Language;
  onNavigate?: (view: string) => void;
}

export const MalaysiaStudentMap: React.FC<MalaysiaStudentMapProps> = ({
  applications,
  companies,
  users,
  currentUser,
  language,
  onNavigate
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentPlacementPoint | null>(null);
  const [hoveredStudent, setHoveredStudent] = useState<StudentPlacementPoint | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'pending'>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapZoomZone, setMapZoomZone] = useState<'all' | 'west' | 'east'>('all');

  // Load live weekly logbooks to get real-time daily log entries
  const allWeeklyLogbooks = useMemo(() => {
    try {
      return StorageService.getWeeklyLogbooks();
    } catch {
      return [];
    }
  }, []);

  // Compute merged students list from applications/users OR default fallback placed students
  // Guaranteed to represent strictly the 5 actual registered students cohort
  const studentPlacementPoints = useMemo<StudentPlacementPoint[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Deduplicate applications by unique student matric / username
    const studentAppMap = new Map<string, Application>();
    applications.forEach(app => {
      const studentKey = (app.student_id || app.created_by || app.student_name).toLowerCase().trim();
      const existing = studentAppMap.get(studentKey);
      if (!existing) {
        studentAppMap.set(studentKey, app);
      } else if (app.application_status === 'Diluluskan' && existing.application_status !== 'Diluluskan') {
        studentAppMap.set(studentKey, app);
      }
    });

    // Start with the 5 official real student records
    return DEFAULT_PLACED_STUDENTS.map((defaultPoint) => {
      // Check if student has an actual application in storage
      const app = Array.from(studentAppMap.values()).find(a => 
        (a.student_id && a.student_id.toLowerCase().trim() === defaultPoint.matricNo.toLowerCase().trim()) ||
        (a.student_name && a.student_name.toLowerCase().trim() === defaultPoint.name.toLowerCase().trim()) ||
        (a.created_by && defaultPoint.matricNo.toLowerCase().includes(a.created_by.toLowerCase()))
      );

      const studentUser = users.find(u => 
        (u.matric_no && u.matric_no.toLowerCase().trim() === defaultPoint.matricNo.toLowerCase().trim()) ||
        (u.name && u.name.toLowerCase().trim() === defaultPoint.name.toLowerCase().trim())
      );

      const comp = app ? companies.find(c => 
        c.company_name.toLowerCase().trim() === app.company_name.toLowerCase().trim()
      ) : undefined;

      // Check live weekly logbook entries
      const liveLogs = allWeeklyLogbooks.filter(l => 
        l.studentId === defaultPoint.studentId || 
        l.studentMatric === defaultPoint.matricNo ||
        (studentUser && l.studentId === studentUser.id)
      );

      let hasTodayLog = defaultPoint.hasFilledTodayLog;
      let todayLogDate = defaultPoint.todayLogDate;
      let todayLogStatus = defaultPoint.todayLogStatus;
      let todayLogSummary = defaultPoint.todayLogSummary;
      let todayDept = defaultPoint.todayDepartment;
      let todayTools = defaultPoint.todayTools;
      let todayLogHours = defaultPoint.todayLogHours;

      if (liveLogs.length > 0) {
        const allEntries: DailyLogEntry[] = liveLogs.flatMap(l => l.entries || []);
        const todayEntry = allEntries.find(e => e.date === todayStr);
        const latestEntry = allEntries.length > 0 ? allEntries[allEntries.length - 1] : null;

        if (todayEntry) {
          hasTodayLog = true;
          todayLogDate = todayEntry.date;
          todayLogStatus = 'verified';
          todayLogSummary = todayEntry.tasks;
          todayDept = todayEntry.department;
          todayTools = todayEntry.toolsUsed;
          todayLogHours = 8;
        } else if (latestEntry) {
          todayLogSummary = `Entri harian terkini (${latestEntry.date}): ${latestEntry.tasks.slice(0, 100)}`;
        }
      }

      return {
        ...defaultPoint,
        companyName: app?.company_name || defaultPoint.companyName,
        companyAddress: comp?.company_address || defaultPoint.companyAddress,
        state: app?.company_state || comp?.company_state || defaultPoint.state,
        district: app?.company_district || comp?.company_district || defaultPoint.district,
        industryTrainerName: studentUser?.industry_trainer_name || defaultPoint.industryTrainerName,
        facultySupervisorName: app?.faculty_supervisor_name || studentUser?.faculty_supervisor_name || defaultPoint.facultySupervisorName,
        hasFilledTodayLog: hasTodayLog,
        todayLogDate: todayLogDate,
        todayLogStatus: todayLogStatus,
        todayLogSummary: todayLogSummary,
        todayDepartment: todayDept,
        todayTools: todayTools,
        todayLogHours: todayLogHours,
        avatarUrl: studentUser?.profile_image && studentUser.profile_image !== 'idb_stored' 
          ? studentUser.profile_image 
          : defaultPoint.avatarUrl
      };
    });
  }, [applications, companies, users, allWeeklyLogbooks]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return studentPlacementPoints.filter(student => {
      // Status filter
      if (statusFilter === 'filled' && !student.hasFilledTodayLog) return false;
      if (statusFilter === 'pending' && student.hasFilledTodayLog) return false;

      // State filter
      if (selectedStateFilter !== 'all' && !student.state.toLowerCase().includes(selectedStateFilter.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchMatric = student.matricNo.toLowerCase().includes(q);
        const matchCompany = student.companyName.toLowerCase().includes(q);
        const matchState = student.state.toLowerCase().includes(q);
        if (!matchName && !matchMatric && !matchCompany && !matchState) return false;
      }

      return true;
    });
  }, [studentPlacementPoints, statusFilter, selectedStateFilter, searchQuery]);

  // Statistics KPIs
  const totalCount = studentPlacementPoints.length;
  const filledCount = studentPlacementPoints.filter(s => s.hasFilledTodayLog).length;
  const pendingCount = totalCount - filledCount;
  const completionPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  // State grouping counts for interactive map
  const stateCounts = useMemo(() => {
    const counts: Record<string, { total: number; filled: number; pending: number }> = {};
    studentPlacementPoints.forEach(s => {
      const st = s.state.toLowerCase().trim();
      if (!counts[st]) counts[st] = { total: 0, filled: 0, pending: 0 };
      counts[st].total++;
      if (s.hasFilledTodayLog) counts[st].filled++;
      else counts[st].pending++;
    });
    return counts;
  }, [studentPlacementPoints]);

  // Zoom viewBox computation
  const currentViewBox = useMemo(() => {
    if (mapZoomZone === 'west') return '50 0 380 460';
    if (mapZoomZone === 'east') return '460 50 510 400';
    return '0 0 1000 480';
  }, [mapZoomZone]);

  const handleSendLogReminder = (student: StudentPlacementPoint) => {
    toast.success(
      language === 'ms' 
        ? `Peringatan buku log harian telah dihantar kepada ${student.name}.`
        : `Daily logbook reminder sent to ${student.name}.`,
      { icon: '📩' }
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6 relative overflow-hidden">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs flex items-center gap-1.5">
              <MapPin size={11} className="text-white" />
              <span>PETA PENEMPATAN WBL MALAYSIA</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Status Log Harian Aktif</span>
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Taburan Penempatan Pelajar & Pemantauan Log Harian</span>
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'ms' 
              ? 'Visual interaktif penempatan industri pelajar WBL di seluruh Malaysia beserta penunjuk status pengisian buku log secara harian.'
              : 'Interactive visualization of WBL student industry placements across Malaysia with daily logbook completion tracking.'}
          </p>
        </div>

        {/* SUMMARY STATS & PROGRESS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              {completionPercentage}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kadar Log Hari Ini</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {filledCount}/{totalCount} Pelajar
                </span>
              </div>
              <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 transition-all duration-700 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setMapZoomZone('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${mapZoomZone === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setMapZoomZone('west')}
              className={`px-3 py-1.5 rounded-lg transition-all ${mapZoomZone === 'west' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Semenanjung
            </button>
            <button
              type="button"
              onClick={() => setMapZoomZone('east')}
              className={`px-3 py-1.5 rounded-lg transition-all ${mapZoomZone === 'east' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Sabah & Sarawak
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Semua Penempatan</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('filled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'filled'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={14} className={statusFilter === 'filled' ? 'text-white' : 'text-emerald-600'} />
            <span>Telah Isi Log Harian</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'filled' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
              {filledCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock size={14} className={statusFilter === 'pending' ? 'text-white' : 'text-amber-600'} />
            <span>Belum Isi Log Harian</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {pendingCount}
            </span>
          </button>
        </div>

        {/* State dropdown & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white text-xs font-bold text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua Negeri ({totalCount})</option>
              <option value="melaka">Melaka</option>
              <option value="kuala lumpur">Kuala Lumpur</option>
              <option value="selangor">Selangor</option>
              <option value="johor">Johor</option>
              <option value="pinang">Pulau Pinang</option>
              <option value="sarawak">Sarawak</option>
              <option value="sabah">Sabah</option>
            </select>
            <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pelajar / syarikat..."
              className="w-full pl-8 pr-3 py-2 bg-white text-xs text-slate-700 rounded-xl border border-slate-200 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAP STYLES & FLOATING AVATAR ANIMATIONS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes pulseGlowGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        @keyframes pulseGlowAmber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
        }
        .animate-float-pin {
          animation: floatSlow 3.2s ease-in-out infinite;
        }
        .pulse-ring-green {
          animation: pulseGlowGreen 2.2s infinite;
        }
        .pulse-ring-amber {
          animation: pulseGlowAmber 2.2s infinite;
        }
      `}} />

      {/* INTERACTIVE MAP CONTAINER */}
      <div className="relative bg-gradient-to-b from-sky-50/70 via-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/90 overflow-hidden shadow-inner p-2 sm:p-4">
        {/* MAP WATERMARK / LABELS */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs">
          <Compass size={16} className="text-blue-600 animate-spin-slow" />
          <div>
            <p className="text-[10px] font-black text-slate-800 leading-none">MALAYSIA WBL GEOMAP</p>
            <p className="text-[9px] text-slate-500 font-medium">Semenanjung, Sabah & Sarawak</p>
          </div>
        </div>

        {/* MAP LEGEND */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-2xs flex items-center justify-center text-[7px] text-white font-black">✓</span>
            <span className="font-bold text-slate-700">Telah Mengisi Log Harian ({filledCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-2xs flex items-center justify-center text-[7px] text-white font-black">!</span>
            <span className="font-bold text-slate-700">Belum Mengisi Log Harian ({pendingCount})</span>
          </div>
        </div>

        {/* SVG MAP & FLOATING STUDENT PINS */}
        <div className="relative w-full aspect-[2/1] min-h-[360px] max-h-[580px] overflow-hidden">
          <svg
            viewBox={currentViewBox}
            className="w-full h-full transition-all duration-700 ease-out select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Soft Grid Lines for Cartographic Aesthetics */}
            <defs>
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
              <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.1" />
              </radialGradient>
              <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
              </filter>
            </defs>

            <rect width="1000" height="480" fill="url(#oceanGlow)" />
            <rect width="1000" height="480" fill="url(#gridPattern)" />

            {/* Ocean labels */}
            <text x="370" y="80" fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="4" opacity="0.6">
              LAUT CHINA SELATAN
            </text>
            <text x="120" y="440" fill="#94a3b8" fontSize="10" fontWeight="700" letterSpacing="3" opacity="0.6">
              SELAT MELAKA
            </text>

            {/* MALAYSIAN STATE POLYGONS */}
            <g id="statesGroup">
              {MALAYSIA_STATE_PATHS.map((state) => {
                const isHovered = hoveredState === state.name.toLowerCase();
                const isSelectedState = selectedStateFilter.toLowerCase() === state.name.toLowerCase() ||
                  (selectedStateFilter === 'pinang' && state.id === 'pulau_pinang') ||
                  (selectedStateFilter === 'kuala lumpur' && state.id === 'kuala_lumpur');
                
                const countInfo = stateCounts[state.name.toLowerCase()] || 
                  (state.id === 'pulau_pinang' ? stateCounts['pulau pinang'] : undefined);
                
                const hasStudentsInState = !!countInfo && countInfo.total > 0;

                return (
                  <path
                    key={state.id}
                    d={state.pathData}
                    onClick={() => {
                      setSelectedStateFilter(selectedStateFilter === state.name.toLowerCase() ? 'all' : state.name.toLowerCase());
                    }}
                    onMouseEnter={() => setHoveredState(state.name.toLowerCase())}
                    onMouseLeave={() => setHoveredState(null)}
                    className="transition-all duration-300 cursor-pointer"
                    fill={
                      isSelectedState 
                        ? '#3b82f6' 
                        : isHovered 
                        ? '#60a5fa' 
                        : hasStudentsInState 
                        ? '#dbeafe' 
                        : '#e2e8f0'
                    }
                    stroke={isSelectedState ? '#1d4ed8' : isHovered ? '#2563eb' : '#94a3b8'}
                    strokeWidth={isSelectedState ? '2.5' : isHovered ? '2' : '1.2'}
                    strokeLinejoin="round"
                    filter="url(#shadowGlow)"
                  >
                    <title>{`${state.name} (${countInfo ? `${countInfo.total} Pelajar WBL: ${countInfo.filled} Siap, ${countInfo.pending} Belum` : 'Tiada Penempatan'})`}</title>
                  </path>
                );
              })}
            </g>

            {/* STATE LABELS */}
            {MALAYSIA_STATE_PATHS.map(state => (
              <text
                key={`lbl_${state.id}`}
                x={state.centerCoordinates.x}
                y={state.centerCoordinates.y}
                fill={hoveredState === state.name.toLowerCase() ? '#1e3a8a' : '#475569'}
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
                className="pointer-events-none select-none drop-shadow-xs uppercase tracking-tighter opacity-80"
              >
                {state.name}
              </text>
            ))}

            {/* RADAR ANCHOR POINTS ON MAP */}
            {filteredStudents.map(student => {
              const isFilled = student.hasFilledTodayLog;
              const isSelected = selectedStudent?.id === student.id;

              return (
                <g key={`anchor_${student.id}`} className="transition-all">
                  <circle
                    cx={student.mapCoordinates.x}
                    cy={student.mapCoordinates.y}
                    r={isSelected ? '9' : '6'}
                    fill={isFilled ? '#10b981' : '#f59e0b'}
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={student.mapCoordinates.x}
                    cy={student.mapCoordinates.y}
                    r={isSelected ? '4' : '3'}
                    fill={isFilled ? '#059669' : '#d97706'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Stem connecting map anchor to floating avatar card */}
                  <line
                    x1={student.mapCoordinates.x}
                    y1={student.mapCoordinates.y}
                    x2={student.mapCoordinates.x}
                    y2={student.mapCoordinates.y - 18}
                    stroke={isFilled ? '#059669' : '#d97706'}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    strokeOpacity="0.8"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML OVERLAY FOR FLOATING STUDENT PICTURES (FLOATING AVATARS) */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredStudents.map((student, sIdx) => {
              const isFilled = student.hasFilledTodayLog;
              const isSelected = selectedStudent?.id === student.id;
              const isHovered = hoveredStudent?.id === student.id;

              // Normalized coordinate percentages relative to 1000 x 480
              const leftPercent = (student.mapCoordinates.x / 1000) * 100;
              const topPercent = (student.mapCoordinates.y / 480) * 100;

              return (
                <div
                  key={student.id}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    animationDelay: `${(sIdx % 5) * 0.4}s`
                  }}
                  className="absolute pointer-events-auto -translate-x-1/2 -translate-y-full pb-3 animate-float-pin group cursor-pointer z-20"
                  onClick={() => setSelectedStudent(student)}
                  onMouseEnter={() => setHoveredStudent(student)}
                  onMouseLeave={() => setHoveredStudent(null)}
                >
                  {/* FLOATING CARD WRAPPER */}
                  <div className={`relative flex flex-col items-center transition-all duration-300 transform group-hover:scale-125 group-hover:z-50 ${
                    isSelected ? 'scale-125 z-40' : ''
                  }`}>
                    {/* AVATAR CIRCLE WITH LOGBOOK STATUS RING */}
                    <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-white shadow-lg transition-transform duration-300 ${
                      isFilled 
                        ? 'ring-[3px] ring-emerald-500 pulse-ring-green shadow-emerald-200/80' 
                        : 'ring-[3px] ring-amber-500 pulse-ring-amber shadow-amber-200/80'
                    }`}>
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0284c7&color=ffffff&bold=true`;
                        }}
                      />

                      {/* MICRO LOGBOOK BADGE: CHECKMARK vs PENDING CLOCK */}
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-md border-2 border-white ${
                        isFilled ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}>
                        {isFilled ? '✓' : '!'}
                      </span>
                    </div>

                    {/* FLOATING COMPANY PILL */}
                    <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-black whitespace-nowrap shadow-md backdrop-blur-xs flex items-center gap-1 border border-white/20 max-w-[110px] truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFilled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="truncate">{student.companyName.split(' ')[0]}</span>
                    </div>

                    {/* HOVER TOOLTIP PREVIEW */}
                    {(isHovered || isSelected) && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md pointer-events-none z-50 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <img
                            src={student.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-white/30"
                          />
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-xs font-black truncate">{student.name}</h4>
                            <p className="text-[10px] text-slate-300 font-mono">{student.matricNo}</p>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px]">
                          <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                            <Building2 size={11} className="shrink-0" />
                            <span className="truncate">{student.companyName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin size={11} className="shrink-0 text-red-400" />
                            <span>{student.district ? `${student.district}, ` : ''}{student.state}</span>
                          </div>
                          <div className={`mt-1.5 p-1.5 rounded-lg flex items-center gap-1.5 text-[9px] font-black ${
                            isFilled ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          }`}>
                            {isFilled ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            <span>{isFilled ? 'Buku Log Harian: Telah Diisi Hari Ini ✓' : 'Buku Log Harian: Belum Diisi Hari Ini ⚠️'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUICK ROSTER STRIP: ALL PLACED STUDENTS CARDS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Senarai Pelajar Ditempatkan</h4>
            <span className="text-xs text-slate-400 font-semibold">({filteredStudents.length} pelajar dipaparkan)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Klik kad pelajar untuk lihat maklumat terperinci</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {filteredStudents.map(student => {
            const isFilled = student.hasFilledTodayLog;
            const isSelected = selectedStudent?.id === student.id;

            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-black border border-white ${
                      isFilled ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}>
                      {isFilled ? '✓' : '!'}
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <h5 className="text-xs font-black text-slate-900 truncate" title={student.name}>
                      {student.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-mono">{student.matricNo}</p>
                    <p className="text-[10px] text-blue-600 font-semibold truncate mt-0.5 flex items-center gap-1">
                      <Building2 size={10} className="shrink-0" />
                      <span className="truncate">{student.companyName}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin size={10} className="text-slate-400" />
                    <span>{student.state}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 ${
                    isFilled 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isFilled ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    <span>{isFilled ? 'Log Siap' : 'Tertunggak'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED STUDENT MODAL WHEN CLICKED */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideInUp">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-t-3xl">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative">
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-xl"
                  />
                  <span className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-md flex items-center gap-1 ${
                    selectedStudent.hasFilledTodayLog ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}>
                    {selectedStudent.hasFilledTodayLog ? '✓ Log Diisi' : '⚠️ Belum Isi'}
                  </span>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/10">
                      {selectedStudent.matricNo}
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-md">
                      {selectedStudent.state}
                    </span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1">
                    <GraduationCap size={14} className="text-indigo-400" />
                    <span>{selectedStudent.program}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Placement Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Building2 size={14} className="text-blue-600" />
                  <span>Maklumat Penempatan Industri</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Syarikat Rakan WBL</span>
                    <p className="font-bold text-slate-900">{selectedStudent.companyName}</p>
                    <p className="text-[11px] text-slate-500">{selectedStudent.companyAddress}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Sektor Industri</span>
                    <p className="font-semibold text-slate-700">{selectedStudent.industry}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Jurulatih Industri (Trainer)</span>
                    <p className="font-bold text-slate-800">{selectedStudent.industryTrainerName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Penyelia Fakulti UTeM</span>
                    <p className="font-bold text-slate-800">{selectedStudent.facultySupervisorName}</p>
                  </div>
                </div>
              </div>

              {/* Status Buku Log Harian */}
              <div className={`rounded-2xl p-4 border space-y-3 ${
                selectedStudent.hasFilledTodayLog 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedStudent.hasFilledTodayLog ? (
                      <CheckCircle2 size={16} className="text-emerald-700" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-700" />
                    )}
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Status Buku Log Harian Pelajar
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedStudent.hasFilledTodayLog ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {selectedStudent.hasFilledTodayLog ? 'Telah Diisi Hari Ini' : 'Belum Mengisi Hari Ini'}
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-700">
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <span>📅 Tarikh: <strong>{selectedStudent.todayLogDate}</strong></span>
                    <span>⏱️ Jam Latihan Terkumpul: <strong>{selectedStudent.totalLogbookHours} Jam</strong></span>
                    <span>🏢 Bahagian: <strong>{selectedStudent.todayDepartment || 'Operasi Teknikal'}</strong></span>
                  </div>

                  {selectedStudent.todayLogSummary && (
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ringkasan Aktiviti / Tugasan:</span>
                      <p className="text-slate-800">{selectedStudent.todayLogSummary}</p>
                    </div>
                  )}

                  {selectedStudent.todayTools && (
                    <p className="text-[10px] text-slate-500">
                      🛠️ Alatan & Sistem: <span className="font-semibold text-slate-700">{selectedStudent.todayTools}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                {!selectedStudent.hasFilledTodayLog && (
                  <button
                    type="button"
                    onClick={() => handleSendLogReminder(selectedStudent)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Send size={13} />
                    <span>Hantar Peringatan Log Harian</span>
                  </button>
                )}

                {onNavigate && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        onNavigate('dailyLogbook');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <BookOpen size={13} />
                      <span>Buka Buku Log Lengkap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        onNavigate('wblMessaging');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>Buka Mesej WBL</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
