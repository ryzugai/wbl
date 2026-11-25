import React, { useState, useEffect, useMemo } from 'react';
import { Application, Company, User, UserRole, AdConfig, WeeklyLogbook, DailyLogEntry, PsmCaseStudyWeeklyLog } from '../types';
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
  FileSpreadsheet,
  Search,
  Bell,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';
import { generatePlacementConfirmationLetter } from '../utils/letterGenerator';
import { MalaysiaStudentMap } from '../components/MalaysiaStudentMap';
import { WBL_COURSE_SEQUENCE, UTEM_WEEKLY_ASSESSMENTS } from '../constants/utemWblRubrics';
import { StudentPlacementPoint, getStudentCoordinatesByState, DEFAULT_PLACED_STUDENTS } from '../constants/wblPlacementData';
import {
  getCurrentWblSemesterWeek,
  computeStudentLogReminders,
  computeStaffVerificationReminders,
  normalizeMatric,
  normalizeText
} from '../utils/wblRemindersAndEnrollment';
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
  const [rosterFilter, setRosterFilter] = useState<'all' | 'filled' | 'pending'>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  const [liveLogs, setLiveLogs] = useState<WeeklyLogbook[]>(() => {
    try {
      return StorageService.getWeeklyLogbooks();
    } catch {
      return [];
    }
  });

  const [livePsmLogs, setLivePsmLogs] = useState<PsmCaseStudyWeeklyLog[]>(() => {
    try {
      return StorageService.getPsmCaseStudyLogs();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setAdConfig(StorageService.getAdConfig());
      try {
        setLiveLogs(StorageService.getWeeklyLogbooks());
        setLivePsmLogs(StorageService.getPsmCaseStudyLogs());
      } catch {}
    });
    return () => unsubscribe();
  }, []);

  const currentWblWeek = useMemo(() => getCurrentWblSemesterWeek(), []);

  // Student-specific reminders (unfilled Buku Log Harian & Log Case Study PSM 2)
  const studentLogReminders = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) return null;
    return computeStudentLogReminders(currentUser, liveLogs, livePsmLogs, currentWblWeek);
  }, [currentUser, liveLogs, livePsmLogs, currentWblWeek]);

  // Staff verification reminders:
  // - Buku Log Harian -> Industry Trainer (JI) AND Faculty Supervisor (Penyelia Fakulti)
  // - Log Case Study PSM 2 -> ONLY Faculty Supervisor (Penyelia Fakulti)
  const staffVerificationReminders = useMemo(() => {
    return computeStaffVerificationReminders(currentUser, users, applications, liveLogs, livePsmLogs);
  }, [currentUser, users, applications, liveLogs, livePsmLogs]);

  useEffect(() => {
    if (adConfig.isEnabled && adConfig.items.length > 1 && showAd) {
      const timer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adConfig.items.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [adConfig.isEnabled, adConfig.items.length, showAd]);

  // Modular Course Milestones & Countdown (5-week modules & PSM2)
  // Determine active modular course dynamically based on current date (e.g. BTMT 3273(i) Digital Entrepreneurship for Nov 2026)
  const activeModularItem = useMemo(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    const found = WBL_COURSE_SEQUENCE.find(c => nowStr >= c.startDate && nowStr <= c.endDate);
    return found || WBL_COURSE_SEQUENCE.find(c => c.courseCode.includes('3273')) || WBL_COURSE_SEQUENCE[1];
  }, []);

  const [selectedModularCourseCode, setSelectedModularCourseCode] = useState<string>(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    const found = WBL_COURSE_SEQUENCE.find(c => nowStr >= c.startDate && nowStr <= c.endDate);
    return found ? found.courseCode : 'BTMT 3273(i)';
  });

  const selectedModularItem = useMemo(() => {
    const item = WBL_COURSE_SEQUENCE.find(c => c.courseCode === selectedModularCourseCode) || activeModularItem;
    const nowStr = new Date().toISOString().split('T')[0];
    return {
      ...item,
      isPast: nowStr > item.endDate,
      isActive: nowStr >= item.startDate && nowStr <= item.endDate
    };
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

  // Derive real active students from users and applications without fabricating any dummy records
  const cohortStudentsList = useMemo<StudentPlacementPoint[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const normMatric = (m?: string) => (m || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const normName = (n?: string) => (n || '').replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

    // Map applications by student clean matric and clean name
    const approvedAppMap = new Map<string, Application>();
    const anyAppMap = new Map<string, Application>();

    applications.forEach(app => {
      const mKey = normMatric(app.student_id);
      const nKey = normName(app.student_name);
      const uKey = (app.created_by || '').toLowerCase().trim();

      [mKey, nKey, uKey].filter(Boolean).forEach(k => {
        if (!anyAppMap.has(k)) anyAppMap.set(k, app);
        if (app.application_status === 'Diluluskan') {
          approvedAppMap.set(k, app);
        }
      });
    });

    // Extract active student users from users list
    const activeStudentUsers = users.filter(u => 
      u.role === UserRole.STUDENT && 
      u.is_active !== false
    );

    // Map of unique students
    const uniqueStudentsMap = new Map<string, { user?: User; app?: Application; name: string; matricNo: string }>();

    // 1. Add all active registered student users with deduplication
    activeStudentUsers.forEach(u => {
      const mKey = normMatric(u.matric_no);
      const nKey = normName(u.name);
      const uKey = (u.username || '').toLowerCase().trim();
      const primaryKey = mKey || nKey || uKey;
      if (!primaryKey) return;

      let existingKey = '';
      if (mKey && uniqueStudentsMap.has(mKey)) existingKey = mKey;
      else if (nKey && uniqueStudentsMap.has(nKey)) existingKey = nKey;
      else {
        for (const [k, v] of uniqueStudentsMap.entries()) {
          if (mKey && normMatric(v.user?.matric_no) === mKey) { existingKey = k; break; }
          if (nKey && normName(v.user?.name) === nKey) { existingKey = k; break; }
          if (uKey && v.user?.username && v.user.username.toLowerCase().trim() === uKey) { existingKey = k; break; }
        }
      }

      const matchedApp = 
        (mKey ? approvedAppMap.get(mKey) || anyAppMap.get(mKey) : undefined) ||
        (nKey ? approvedAppMap.get(nKey) || anyAppMap.get(nKey) : undefined) ||
        (uKey ? approvedAppMap.get(uKey) || anyAppMap.get(uKey) : undefined);

      if (existingKey) {
        const item = uniqueStudentsMap.get(existingKey)!;
        item.user = {
          ...item.user,
          ...u,
          name: item.user?.name || u.name,
          matric_no: item.user?.matric_no || u.matric_no,
          faculty_supervisor_name: u.faculty_supervisor_name || item.user?.faculty_supervisor_name,
          faculty_supervisor_id: u.faculty_supervisor_id || item.user?.faculty_supervisor_id,
          company_affiliation: u.company_affiliation || item.user?.company_affiliation,
          profile_image: (u.profile_image && u.profile_image !== 'idb_stored') ? u.profile_image : item.user?.profile_image,
        };
        if (!item.app && matchedApp) item.app = matchedApp;
      } else {
        uniqueStudentsMap.set(primaryKey, {
          user: u,
          app: matchedApp,
          name: u.name,
          matricNo: u.matric_no || u.username || ''
        });
      }
    });

    // 2. Incorporate any students with applications not already in the map
    applications.forEach(app => {
      const mKey = normMatric(app.student_id);
      const nKey = normName(app.student_name);
      if (!mKey && !nKey) return;

      let matchedKey = '';
      for (const [k, v] of uniqueStudentsMap.entries()) {
        if (mKey && normMatric(v.user?.matric_no || v.matricNo) === mKey) { matchedKey = k; break; }
        if (nKey && normName(v.user?.name || v.name) === nKey) { matchedKey = k; break; }
        if (app.created_by && v.user?.username && v.user.username.toLowerCase().trim() === app.created_by.toLowerCase().trim()) {
          matchedKey = k;
          break;
        }
      }

      if (matchedKey) {
        const item = uniqueStudentsMap.get(matchedKey)!;
        if (!item.app || (app.application_status === 'Diluluskan' && item.app.application_status !== 'Diluluskan')) {
          item.app = app;
        }
      } else if (app.student_name) {
        uniqueStudentsMap.set(mKey || nKey, {
          app,
          name: app.student_name,
          matricNo: app.student_id || app.created_by || ''
        });
      }
    });

    // 3. Incorporate genuine active cohort students from DEFAULT_PLACED_STUDENTS
    DEFAULT_PLACED_STUDENTS.forEach(defS => {
      const mKey = normMatric(defS.matricNo);
      const nKey = normName(defS.name);
      if (!mKey && !nKey) return;

      let matchedKey = '';
      for (const [k, v] of uniqueStudentsMap.entries()) {
        if (mKey && normMatric(v.user?.matric_no || v.matricNo) === mKey) { matchedKey = k; break; }
        if (nKey && normName(v.user?.name || v.name) === nKey) { matchedKey = k; break; }
      }

      if (!matchedKey) {
        uniqueStudentsMap.set(mKey || nKey, {
          name: defS.name,
          matricNo: defS.matricNo
        });
      }
    });

    const realStudents = Array.from(uniqueStudentsMap.values());
    if (realStudents.length === 0) {
      return DEFAULT_PLACED_STUDENTS;
    }

    return realStudents.map((item, index) => {
      const u = item.user;
      const app = item.app;

      const cleanM = normMatric(u?.matric_no || app?.student_id || item.matricNo);
      const cleanN = normName(u?.name || app?.student_name || item.name);

      const defMatch = DEFAULT_PLACED_STUDENTS.find(d => 
        (cleanM && cleanM !== 'pelajarwbl' && normMatric(d.matricNo) === cleanM) || 
        (cleanN && cleanN !== 'pelajar wbl' && normName(d.name) === cleanN)
      );

      const studentName = (u?.name || app?.student_name || defMatch?.name || item.name || '').trim();
      const studentMatric = (u?.matric_no || app?.student_id || defMatch?.matricNo || item.matricNo || 'Pelajar WBL').trim();
      const studentProgram = u?.program || u?.academic_level || app?.student_program || defMatch?.program || 'Sarjana Muda Teknousahawanan (WBL)';

      const comp = app ? companies.find(c => 
        c.company_name.toLowerCase().trim() === app.company_name.toLowerCase().trim()
      ) : undefined;

      const companyName = app?.company_name || u?.company_affiliation || defMatch?.companyName || 'Belum Ditetapkan';
      const state = app?.company_state || comp?.company_state || defMatch?.state || (u as any)?.state || 'Melaka';
      const district = app?.company_district || comp?.company_district || defMatch?.district || (u as any)?.district || '';
      const companyAddress = comp?.company_address || (app as any)?.company_address || defMatch?.companyAddress || '';
      const trainerName = u?.industry_trainer_name || (app as any)?.industry_trainer_name || defMatch?.industryTrainerName || 'Jurulatih Industri';
      const supervisorName = u?.faculty_supervisor_name || app?.faculty_supervisor_name || defMatch?.facultySupervisorName || 'Belum Dilantik';

      // Check real weekly logbooks
      const userLogs = liveLogs.filter(l => {
        const lM = normMatric(l.studentMatric);
        const lN = normName(l.studentName);
        const matchMatric = cleanM && cleanM !== 'pelajarwbl' && cleanM.length > 2 && lM === cleanM;
        const matchName = cleanN && cleanN !== 'pelajar wbl' && cleanN.length > 2 && lN === cleanN;
        const matchId = u && u.id && l.studentId && l.studentId === u.id;
        return matchMatric || matchName || matchId;
      });

      const allEntries: DailyLogEntry[] = userLogs.flatMap((l: WeeklyLogbook) => l.entries || []);
      const entriesWithTasks = allEntries.filter((e: DailyLogEntry) => e.tasks && e.tasks.trim().length > 0);
      const todayEntry = allEntries.find((e: DailyLogEntry) => e.date === todayStr && e.tasks && e.tasks.trim().length > 0);
      const latestEntry = entriesWithTasks.length > 0 ? entriesWithTasks[entriesWithTasks.length - 1] : null;
      const matchingLog = userLogs.find((l: WeeklyLogbook) => (l.entries || []).some((e: DailyLogEntry) => e.tasks && e.tasks.trim().length > 0));

      const hasFilledTodayLog = !!todayEntry || entriesWithTasks.length > 0 || !!(defMatch && defMatch.hasFilledTodayLog);
      const todayLogDate = todayEntry 
        ? todayEntry.date 
        : (latestEntry ? latestEntry.date : (defMatch?.todayLogDate || ''));
      const todayLogStatus: 'verified' | 'submitted' | 'pending' = matchingLog
        ? (matchingLog.status === 'verified' ? 'verified' : matchingLog.status === 'submitted' ? 'submitted' : 'pending')
        : (defMatch?.todayLogStatus || 'pending');
      const todayLogSummary = todayEntry ? todayEntry.tasks : (latestEntry ? `Entri harian terkini (${latestEntry.date}): ${latestEntry.tasks.slice(0, 100)}` : (defMatch?.todayLogSummary || 'Belum mengemukakan entri logbook.'));
      const todayLogHours = todayEntry ? 8 : (latestEntry ? 8 : (defMatch?.todayLogHours || 0));
      const todayDept = todayEntry ? todayEntry.department : (latestEntry ? latestEntry.department : (defMatch?.todayDepartment || ''));
      const todayTools = todayEntry ? todayEntry.toolsUsed : (latestEntry ? latestEntry.toolsUsed : (defMatch?.todayTools || ''));
      const totalLogbookHours = entriesWithTasks.length > 0 ? entriesWithTasks.length * 8 : (defMatch?.totalLogbookHours || 0);
      const totalWeeksLogged = userLogs.length > 0 ? new Set(userLogs.map(l => l.weekNumber)).size : (defMatch?.totalWeeksLogged || 0);

      const mapCoordinates = defMatch?.mapCoordinates || getStudentCoordinatesByState(state, district, index);

      const avatarUrl = (u?.profile_image && u.profile_image !== 'idb_stored') 
        ? u.profile_image 
        : (defMatch?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=0284c7&color=fff&bold=true`);

      return {
        id: u?.id || app?.id || defMatch?.id || `student_${index}`,
        studentId: u?.id || app?.student_id || defMatch?.studentId || `student_${index}`,
        name: studentName,
        matricNo: studentMatric,
        program: studentProgram,
        email: u?.email || app?.student_email || defMatch?.email || '',
        phone: u?.phone || defMatch?.phone || '',
        avatarUrl,
        companyName,
        companyAddress,
        state,
        district,
        industry: comp?.company_industry || defMatch?.industry || 'Industri WBL',
        industryTrainerName: trainerName,
        facultySupervisorName: supervisorName,
        mapCoordinates,
        hasFilledTodayLog,
        todayLogDate,
        todayLogStatus,
        todayLogSummary,
        todayLogHours,
        todayDepartment: todayDept,
        todayTools: todayTools,
        totalLogbookHours,
        totalWeeksLogged
      };
    });
  }, [applications, companies, users, liveLogs]);

  // Pelajar Dibahagikan Mengikut Kategori Secara Perbandingan (Telah Isi vs Belum Isi)
  const filledStudents = useMemo(() => {
    return cohortStudentsList.filter(s => {
      if (!s.hasFilledTodayLog) return false;
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.matricNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cohortStudentsList, rosterSearch]);

  const pendingStudents = useMemo(() => {
    return cohortStudentsList.filter(s => {
      if (s.hasFilledTodayLog) return false;
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.matricNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cohortStudentsList, rosterSearch]);

  const formatLogDate = (dateStr?: string) => {
    if (!dateStr) return language === 'ms' ? 'Tiada Tarikh' : 'No Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Real Cohort Metrics derived strictly from real active students
  const actualCohortStudents = cohortStudentsList.length;
  const approvedPlacedStudents = cohortStudentsList.filter(s => s.companyName && s.companyName !== 'Belum Ditetapkan').length;
  const totalLecturers = Math.max(1, users.filter(u => u.role === UserRole.LECTURER).length);
  const totalIndustryStaff = Math.max(1, users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR).length);
  const filledLogTodayCount = cohortStudentsList.filter(s => s.hasFilledTodayLog).length;
  const pendingLogTodayCount = Math.max(0, actualCohortStudents - filledLogTodayCount);

  // Cohort PSM 2 Case Study Log completion tally (for Dashboard reminder comparison)
  const cohortCaseStudyStats = useMemo(() => {
    let filledCount = 0;
    const pendingList: StudentPlacementPoint[] = [];

    cohortStudentsList.forEach((student) => {
      const sM = normalizeMatric(student.matricNo);
      const sN = normalizeText(student.name);
      const hasPsm = livePsmLogs.some((log) => {
        const match =
          log.studentId === student.studentId ||
          (Boolean(sM) && normalizeMatric(log.studentMatric) === sM) ||
          (Boolean(sN) && normalizeText(log.studentName) === sN);
        return match && (log.status !== 'draft' || Boolean(log.caseTitle?.trim()));
      });
      if (hasPsm) {
        filledCount += 1;
      } else {
        pendingList.push(student);
      }
    });

    return {
      filledCount,
      pendingCount: pendingList.length,
      pendingList
    };
  }, [cohortStudentsList, livePsmLogs]);

  // Send Reminder Handler (with real in-app notification)
  const handleSendReminder = async (student: StudentPlacementPoint, type: 'daily' | 'case_study' = 'daily') => {
    try {
      const targetUser = users.find(
        (u) =>
          u.id === student.studentId ||
          (student.matricNo && normalizeMatric(u.matric_no) === normalizeMatric(student.matricNo))
      );
      await StorageService.createNotification({
        recipient_id: targetUser?.id || student.studentId,
        recipient_role: UserRole.STUDENT,
        sender_name: currentUser?.name || 'Penyelaras WBL',
        title_ms:
          type === 'case_study'
            ? `Peringatan: Sila Isi Buku Log Case Study PSM 2 (Minggu ${currentWblWeek})`
            : `Peringatan: Sila Isi Buku Log Harian (Minggu ${currentWblWeek})`,
        title_en:
          type === 'case_study'
            ? `Reminder: Complete PSM 2 Case Study Log (Week ${currentWblWeek})`
            : `Reminder: Complete Daily Logbook (Week ${currentWblWeek})`,
        message_ms:
          type === 'case_study'
            ? `Peringatan daripada ${currentUser?.name || 'Penyelaras WBL'}: Anda masih belum mengisi Buku Log Case Study PSM 2. Sila lengkapkan dan hantar untuk pengesahan Penyelia Fakulti.`
            : `Peringatan daripada ${currentUser?.name || 'Penyelaras WBL'}: Anda masih belum mengisi Buku Log Harian. Sila kemaskini dan hantar untuk pengesahan Jurulatih Industri & Penyelia Fakulti.`,
        message_en:
          type === 'case_study'
            ? `Reminder: Please fill and submit your PSM 2 Case Study Log for Faculty Supervisor verification.`
            : `Reminder: Please fill and submit your Daily Logbook for verification.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch {}

    toast.success(
      language === 'ms'
        ? type === 'case_study'
          ? `Peringatan pengisian Log Case Study PSM 2 telah dihantar kepada ${student.name}.`
          : `Peringatan pengisian buku log harian telah dihantar kepada ${student.name}.`
        : `Reminder sent to ${student.name}.`,
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
              KOHORT WBL 2026/2027 ({actualCohortStudents} PELAJAR AKTIF)
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
      {/* 0. PUSAT PERINGATAN PANTAS MENGIKUT PERANAN (PELAJAR / JI / PENYELIA)     */}
      {/* ========================================================================= */}

      {/* A. PERINGATAN PELAJAR: BELUM MENGISI BUKU LOG & LOG CASE STUDY */}
      {studentLogReminders && (studentLogReminders.needsDailyReminder || studentLogReminders.needsCaseStudyReminder) && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/70 to-rose-50/60 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-amber-950">
                  {language === 'ms'
                    ? `Peringatan Pengisian Buku Log Pelajar (Minggu ${studentLogReminders.currentWeek})`
                    : `Student Logbook Completion Reminder (Week ${studentLogReminders.currentWeek})`}
                </h3>
                <p className="text-xs text-amber-800">
                  Sila pastikan kedua-dua Buku Log Harian dan Buku Log Case Study PSM 2 diisi serta dihantar setiap minggu.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase tracking-wider">
              Tindakan Segera Pelajar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentLogReminders.needsDailyReminder && (
              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>Buku Log Harian Belum Lengkap</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                      {!studentLogReminders.hasFilledCurrentDailyLog
                        ? `Minggu ${studentLogReminders.currentWeek} Belum Diisi`
                        : `${studentLogReminders.missingDailyWeeks.length + studentLogReminders.draftOrRevisionDailyWeeks.length} Minggu Tertunggak`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {!studentLogReminders.hasFilledCurrentDailyLog
                      ? `Anda belum merekodkan aktiviti Buku Log Harian bagi Minggu ${studentLogReminders.currentWeek}.`
                      : 'Terdapat minggu Buku Log Harian yang masih belum diisi atau masih berstatus draf/pembetulan.'}
                    {studentLogReminders.missingDailyWeeks.length > 0 && (
                      <span className="block mt-1 font-semibold text-amber-800">
                        Minggu belum diisi: M{studentLogReminders.missingDailyWeeks.slice(0, 6).join(', M')}
                        {studentLogReminders.missingDailyWeeks.length > 6 ? '...' : ''}
                      </span>
                    )}
                  </p>
                </div>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('dailyLogbook')}
                    className="w-full py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <BookOpen size={14} />
                    <span>Isi Buku Log Harian Sekarang</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {studentLogReminders.needsCaseStudyReminder && (
              <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-rose-600 shrink-0" />
                      <span>Buku Log Case Study PSM 2 Belum Lengkap</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black">
                      {!studentLogReminders.hasFilledCurrentCaseStudy
                        ? `Minggu ${studentLogReminders.currentWeek} Belum Diisi`
                        : `${studentLogReminders.missingCaseStudyWeeks.length + studentLogReminders.draftOrRevisionCaseStudyWeeks.length} Minggu Tertunggak`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {!studentLogReminders.hasFilledCurrentCaseStudy
                      ? `Anda belum mengisi entri mingguan Buku Log Case Study PSM 2 bagi Minggu ${studentLogReminders.currentWeek} untuk pengesahan Penyelia Fakulti.`
                      : 'Terdapat minggu Buku Log Case Study PSM 2 yang masih belum dihantar kepada Penyelia Fakulti.'}
                    {studentLogReminders.missingCaseStudyWeeks.length > 0 && (
                      <span className="block mt-1 font-semibold text-rose-800">
                        Minggu belum diisi: M{studentLogReminders.missingCaseStudyWeeks.slice(0, 6).join(', M')}
                        {studentLogReminders.missingCaseStudyWeeks.length > 6 ? '...' : ''}
                      </span>
                    )}
                  </p>
                </div>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('psmCaseStudy')}
                    className="w-full py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Isi Log Case Study PSM 2 Sekarang</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. PERINGATAN PENGESAHAN BUKU LOG KEPADA JURULATIH INDUSTRI (JI) — BUKU LOG SAHAJA (BUKAN CASE STUDY) */}
      {staffVerificationReminders.isTrainer && staffVerificationReminders.pendingDailyLogsForTrainer.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-2 border-blue-300 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-blue-950">
                    Peringatan Pengesahan Buku Log Pelajar (Jurulatih Industri)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                    {staffVerificationReminders.pendingDailyLogsForTrainer.length} Buku Log Menunggu Pengesahan
                  </span>
                </div>
                <p className="text-xs text-blue-900/80 mt-0.5">
                  Terdapat Buku Log Harian pelajar industri anda yang telah dihantar dan memerlukan pengesahan daripada anda selaku Jurulatih Industri.
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dailyLogbook')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <BookOpen size={14} />
                <span>Sahkan Buku Log Sekarang</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {staffVerificationReminders.pendingDailyLogsForTrainer.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl p-3 border border-blue-200 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{log.studentName}</div>
                  <div className="text-[11px] text-slate-500">
                    Minggu {log.weekNumber} • {log.studentMatric || '-'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                  Belum Sah
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C. PERINGATAN PENGESAHAN BUKU LOG & LOG CASE STUDY KEPADA PENYELIA FAKULTI (CASE STUDY KHUSUS PENYELIA FAKULTI SAHAJA) */}
      {staffVerificationReminders.isFacultySupervisor &&
        (staffVerificationReminders.pendingDailyLogsForFaculty.length > 0 ||
          staffVerificationReminders.pendingCaseStudyLogsForFaculty.length > 0) && (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50/70 to-blue-50 border-2 border-indigo-300 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <ShieldCheck size={19} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-indigo-950">
                    Peringatan Pengesahan Buku Log &amp; Log Case Study (Penyelia Fakulti)
                  </h3>
                  <p className="text-xs text-indigo-800">
                    Terdapat rekod Buku Log Harian dan/atau Buku Log Case Study PSM 2 pelajar seliaan anda yang menunggu semakan &amp; pengesahan Penyelia Fakulti.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffVerificationReminders.pendingDailyLogsForFaculty.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-2xs flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                        <BookOpen size={15} className="text-blue-600 shrink-0" />
                        <span>Pengesahan Buku Log Harian Pelajar Seliaan</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                        {staffVerificationReminders.pendingDailyLogsForFaculty.length} Menunggu
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {staffVerificationReminders.pendingDailyLogsForFaculty.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-slate-800 truncate">
                            {log.studentName} (Minggu {log.weekNumber})
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 shrink-0">Perlu Semak</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('dailyLogbook')}
                      className="w-full py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <BookOpen size={14} />
                      <span>Semak &amp; Sahkan Buku Log</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}

              {staffVerificationReminders.pendingCaseStudyLogsForFaculty.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-2xs flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                        <Sparkles size={15} className="text-purple-600 shrink-0" />
                        <span>Pengesahan Log Case Study PSM 2 (Penyelia Fakulti)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                        {staffVerificationReminders.pendingCaseStudyLogsForFaculty.length} Menunggu
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {staffVerificationReminders.pendingCaseStudyLogsForFaculty.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 text-[11px] flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-slate-800 truncate">
                            {log.studentName} — Minggu {log.weekNumber}
                          </span>
                          <span className="text-[10px] font-bold text-purple-700 shrink-0">Perlu Sah</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('psmCaseStudy')}
                      className="w-full py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Sahkan Log Case Study PSM 2</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}
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
            <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeModularItem.badge.split('(')[0].trim() || 'Modul Semasa'} Aktif ({activeModularItem.shortName})</span>
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
                  {isCurrentActive ? (
                    <span className={`flex items-center gap-1 font-black ${isSelected ? 'text-amber-300' : 'text-blue-700'}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Sedang Berjalan (Aktif)
                    </span>
                  ) : m.isPast ? (
                    <span className={`flex items-center gap-1 font-black ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`} title="Modul telah lepas tetapi penilaian masih boleh diteruskan sehingga Minggu 20 (12 Feb 2027)">
                      <Check size={11} className="text-emerald-500" />
                      <span>Modul Lepas (Penilaian Dibuka)</span>
                    </span>
                  ) : (
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                      Akan Datang
                    </span>
                  )}
                  <span className={isSelected ? 'text-white underline font-black' : 'text-blue-600'}>
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
                {selectedModularItem.isActive && (
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-900/60 border border-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Modul Aktif Semasa</span>
                  </span>
                )}
                {selectedModularItem.isPast && (
                  <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    🔓 Penilaian Masih Dibuka Sehingga Minggu 20 (12 Feb 2027)
                  </span>
                )}
              </div>

              <h4 className="text-xl font-black text-white tracking-tight">
                {selectedModularItem.order}. {selectedModularItem.courseName}
              </h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
                {selectedModularItem.isPast ? (
                  <>
                    Tempoh rasmi 5 minggu kursus ini telah selesai ({new Date(selectedModularItem.startDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - {new Date(selectedModularItem.endDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}). <strong className="text-amber-300 font-bold">Penilaian &amp; semakan markah tetap DIBENARKAN sepenuhnya sehingga Minggu 20 (12 Februari 2027).</strong>
                  </>
                ) : (
                  <>
                    Tarikh Akhir Modul &amp; Penilaian Rubrik Mingguan: <strong className="text-white underline">{new Date(selectedModularItem.endDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (Tempoh: {selectedModularItem.durationWeeks} Minggu).
                  </>
                )}
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
                    <span>Buka Log Harian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('psmCaseStudy')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles size={13} className="text-slate-950" />
                    <span>Buku Log Case Study PSM 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('selectedWeeklyCourseCode', selectedModularItem.courseCode);
                      onNavigate('weeklyAssessment');
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>Penilaian Rubrik ({selectedModularItem.shortName})</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RINGKASAN STATISTIK KOHORT WBL (PELAJAR SEBENAR AKTIF)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          label={language === 'ms' ? 'Pelajar WBL (Kohort Aktif)' : 'Active WBL Students'} 
          value={`${actualCohortStudents} Orang Pelajar`} 
          subtext={language === 'ms' ? `Rekod Rasmi: ${actualCohortStudents} Pelajar Aktif` : `Official: ${actualCohortStudents} Active Students`}
          icon={GraduationCap} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Penempatan Industri Rasmi' : 'Official Placements'} 
          value={`${approvedPlacedStudents} / ${actualCohortStudents} Pelajar (${Math.round((approvedPlacedStudents / Math.max(1, actualCohortStudents)) * 100)}%)`} 
          subtext={approvedPlacedStudents === actualCohortStudents ? '100% Selesai Ditempatkan' : `${approvedPlacedStudents} Pelajar Mempunyai Penempatan`}
          icon={CheckCircle2} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <StatCard 
          label={language === 'ms' ? 'Status Pengisian Buku Log' : 'Daily Logbook Submission'} 
          value={`${filledLogTodayCount} Orang Telah Merekod`} 
          subtext={language === 'ms' ? `Rekod Sebenar: ${filledLogTodayCount} Pelajar Telah Mengisi (${pendingLogTodayCount} Belum Mengisi daripada ${actualCohortStudents} Pelajar Kohort)` : `${filledLogTodayCount} Recorded Logbooks (${pendingLogTodayCount} Pending of ${actualCohortStudents})`}
          icon={Clock} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label={t(language, 'companies')} 
          value={`${companies.length} Syarikat Rakan`} 
          subtext={language === 'ms' ? 'Rakan Industri Berdaftar' : 'Registered Partner Companies'}
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
      {/* 4. ROSTER PEMANTAUAN BUKU LOG HARIAN PELAJAR AKTIF (PERBANDINGAN KATEGORI) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Clock size={11} className="text-blue-600" />
                <span>PEMANTAUAN BUKU LOG HARIAN</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {actualCohortStudents} Pelajar Aktif (Kohort WBL 2026/2027)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Status Pengisian Buku Log Harian Pelajar
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan langsung antara pelajar yang <strong className="text-emerald-700 font-bold">Telah Mengisi ({filledStudents.length})</strong> dan yang <strong className="text-amber-700 font-bold">Belum Mengisi ({pendingStudents.length})</strong> bagi kohort semasa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRosterFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rosterFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Perbandingan ({actualCohortStudents})
            </button>
            <button
              type="button"
              onClick={() => setRosterFilter('filled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rosterFilter === 'filled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Telah Isi ({filledStudents.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRosterFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rosterFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertCircle size={13} />
              <span>Belum Isi ({pendingStudents.length})</span>
            </button>
            <div className="relative min-w-[190px]">
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Cari nama / no. matrik..."
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('psmCaseStudy')}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>Buku Log Case Study PSM 2 &raquo;</span>
              </button>
            )}
          </div>
        </div>

        {/* COMPARATIVE TALLY BAR */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Buku Log Telah Isi: <strong>{filledStudents.length} Pelajar</strong> ({actualCohortStudents > 0 ? Math.round((filledStudents.length / actualCohortStudents) * 100) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Buku Log Belum Isi: <strong>{pendingStudents.length} Pelajar</strong> ({actualCohortStudents > 0 ? Math.round((pendingStudents.length / actualCohortStudents) * 100) : 0}%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Log Case Study PSM 2 Belum Isi: <strong>{cohortCaseStudyStats.pendingCount} Pelajar</strong></span>
            </span>
          </div>

          {/* Comparative Progress Track */}
          <div className="w-full sm:w-56 h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${actualCohortStudents > 0 ? (filledStudents.length / actualCohortStudents) * 100 : 0}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Telah Mengisi: ${filledStudents.length}`}
            />
            <div 
              style={{ width: `${actualCohortStudents > 0 ? (pendingStudents.length / actualCohortStudents) * 100 : 0}%` }} 
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Belum Mengisi: ${pendingStudents.length}`}
            />
          </div>
        </div>

        {/* PERINGATAN RINGKAS PELAJAR BELUM MENGISI LOG CASE STUDY PSM 2 */}
        {cohortCaseStudyStats.pendingCount > 0 && currentUser?.role !== UserRole.TRAINER && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-rose-950">
                  Peringatan Pengisian Log Case Study PSM 2: {cohortCaseStudyStats.pendingCount} Pelajar Belum Mengisi
                </div>
                <p className="text-[11px] text-rose-800">
                  {cohortCaseStudyStats.filledCount} daripada {actualCohortStudents} pelajar telah mengisi Log Case Study PSM 2. Pengesahan Log Case Study adalah di bawah tanggungjawab Penyelia Fakulti.
                </p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('psmCaseStudy')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Pantau Log Case Study</span>
              </button>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* PAPARAN KATEGORI SECARA PERBANDINGAN                                  */}
        {/* ===================================================================== */}
        <div className={`grid gap-5 ${rosterFilter === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* KOLUM 1: KATEGORI TELAH MENGISI BUKU LOG */}
          {(rosterFilter === 'all' || rosterFilter === 'filled') && (
            <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-200/90 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Kategori: Telah Isi ({filledStudents.length})</span>
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Status Selesai
                </span>
              </div>

              {filledStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic bg-white/60 rounded-xl border border-dashed border-emerald-200">
                  {rosterSearch.trim() ? 'Tiada pelajar sepadan dengan carian.' : 'Tiada pelajar dalam kategori ini.'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {filledStudents.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white rounded-xl p-3 border border-emerald-200/70 hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      {/* Gambar Saiz Sama (Tidak Besar) & Nama Sahaja & Tarikh Pengisian */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-full object-cover border-2 border-emerald-100 shadow-2xs"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=059669&color=fff&bold=true`;
                            }}
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[7px] font-black text-white">
                            ✓
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-sm font-bold text-slate-800 truncate leading-snug">
                              {student.name}
                            </h5>
                            {student.matricNo && student.matricNo !== 'Pelajar WBL' && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {student.matricNo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-700 font-medium mt-0.5 flex items-center gap-1.5">
                            <Calendar size={12} className="text-emerald-600 shrink-0" />
                            <span>Tarikh Pengisian: <strong className="font-bold text-emerald-800">{formatLogDate(student.todayLogDate)}</strong></span>
                          </p>
                        </div>
                      </div>

                      {/* Tindakan Pintas Buka Logbook */}
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('dailyLogbook')}
                          title="Buka Buku Log"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen size={12} />
                          <span className="hidden sm:inline">Buku Log</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KOLUM 2: KATEGORI BELUM MENGISI BUKU LOG */}
          {(rosterFilter === 'all' || rosterFilter === 'pending') && (
            <div className="bg-amber-50/30 rounded-2xl p-4 border border-amber-200/90 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span>Kategori: Belum Isi ({pendingStudents.length})</span>
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Perlu Tindakan
                </span>
              </div>

              {pendingStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-700 font-semibold bg-emerald-50/60 rounded-xl border border-dashed border-emerald-200">
                  🎉 Tahniah! Semua pelajar telah mengemukakan entri buku log harian.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {pendingStudents.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white rounded-xl p-3 border border-amber-200/70 hover:border-amber-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      {/* Gambar Saiz Sama (Tidak Besar) & Nama Sahaja & Tarikh Pengisian */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-full object-cover border-2 border-amber-100 shadow-2xs"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=d97706&color=fff&bold=true`;
                            }}
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[7px] font-black text-white">
                            !
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-sm font-bold text-slate-800 truncate leading-snug">
                              {student.name}
                            </h5>
                            {student.matricNo && student.matricNo !== 'Pelajar WBL' && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {student.matricNo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-700 font-medium mt-0.5 flex items-center gap-1.5">
                            <Clock size={12} className="text-amber-600 shrink-0" />
                            <span>Tarikh Pengisian: <strong className="font-bold text-amber-800">Belum Mengisi</strong></span>
                          </p>
                        </div>
                      </div>

                      {/* Tindakan Pintas Peringatan */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(student)}
                        title="Hantar Peringatan"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={12} />
                        <span className="hidden sm:inline">Peringatan</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
