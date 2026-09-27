import React, { useState, useEffect, useMemo } from 'react';
import { User, Application, UserRole, WeeklyLogbook, DailyLogEntry, LogbookStatus } from '../types';
import { StorageService } from '../services/storage';
import { generateWeeklyLogbookPrint } from '../utils/logbookGenerator';
import { 
  BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, FileText, 
  Printer, Send, Save, Plus, Trash2, Edit3, UserCheck, ShieldCheck, 
  Building2, MessageSquare, Star, ArrowRight, Eye, RefreshCw, ChevronDown, ChevronUp, Search, Filter,
  Zap, Bell, Check, Award, Info, ExternalLink, User as UserIcon
} from 'lucide-react';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface DailyLogbookProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  language: Language;
}

const DEFAULT_DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];

export const DailyLogbook: React.FC<DailyLogbookProps> = ({
  currentUser,
  applications,
  users,
  language
}) => {
  // Roles
  const isStudent = currentUser.role === UserRole.STUDENT;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isSupervisor = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true || (currentUser as any).is_admin === true;
  const canVerify = isTrainer || isCoordinator || isSupervisor;

  // Student placement information (for student workspace)
  const studentPlacementApp = useMemo(() => {
    if (!isStudent) return null;
    return applications.find(a => 
      (a.student_id === currentUser.matric_no || a.created_by === currentUser.username) &&
      (a.application_status === 'Diluluskan' || a.student_preferred)
    ) || applications.find(a => 
      a.student_id === currentUser.matric_no || a.created_by === currentUser.username
    );
  }, [applications, currentUser, isStudent]);

  // Logbook data state
  const [logbooks, setLogbooks] = useState<WeeklyLogbook[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_logbook' | 'verification_queue'>(
    isStudent ? 'my_logbook' : 'verification_queue'
  );

  // Active weekly log state (for student editor)
  const [currentWeekLog, setCurrentWeekLog] = useState<WeeklyLogbook | null>(null);

  // Review modal state (for detailed inspection by Trainer, Supervisor, Coordinator)
  const [reviewingLogbook, setReviewingLogbook] = useState<WeeklyLogbook | null>(null);
  const [trainerComments, setTrainerComments] = useState('');
  const [trainerRating, setTrainerRating] = useState<'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan'>('cemerlang');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);

  // Supervisor Review note state inside review modal
  const [supervisorCommentsInput, setSupervisorCommentsInput] = useState('');

  // 1-Click Direct Verify Modal for Industry Trainer
  const [directVerifyTarget, setDirectVerifyTarget] = useState<WeeklyLogbook | null>(null);
  const [directRating, setDirectRating] = useState<'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan'>('cemerlang');
  const [directComments, setDirectComments] = useState(
    'Disahkan aktiviti latihan harian dan kemahiran industri pelajar telah disemak, menepati sukatan latihan dan memuaskan.'
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  
  // Scope filter: 'my_scope' (Pelajar Seliaan / Syarikat Saya) vs 'all' (Semua Pelajar)
  const [scopeFilter, setScopeFilter] = useState<'my_scope' | 'all'>(
    (isSupervisor || isTrainer) ? 'my_scope' : 'all'
  );

  // Trainer Verification Filter (Specifically for Penyelaras to audit verification status)
  const [trainerVerifyFilter, setTrainerVerifyFilter] = useState<'all' | 'unverified' | 'verified' | 'revision' | 'draft'>('all');

  // Reload logbooks
  const loadLogbooks = () => {
    const all = StorageService.getWeeklyLogbooks();
    setLogbooks(all);
  };

  useEffect(() => {
    loadLogbooks();
    const unsub = StorageService.subscribe(loadLogbooks);
    return () => unsub();
  }, []);

  // When logbooks or selectedWeekNumber changes, initialize or load currentWeekLog for student
  useEffect(() => {
    if (!isStudent) {
      if (!isTrainer && activeTab === 'my_logbook') {
        setActiveTab('verification_queue');
      }
      return;
    }

    const myLogs = StorageService.getStudentLogbooks(currentUser.id);
    const existing = myLogs.find(l => l.weekNumber === selectedWeekNumber);

    if (existing) {
      setCurrentWeekLog(existing);
    } else {
      // Create empty draft template for selectedWeek
      const companyName = studentPlacementApp?.company_name || currentUser.company_affiliation || 'Syarikat Penempatan WBL';
      const companyAddress = studentPlacementApp ? `${studentPlacementApp.company_district || ''}, ${studentPlacementApp.company_state || ''}` : '';
      
      const newTemplate: WeeklyLogbook = {
        id: '',
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentMatric: currentUser.matric_no || '',
        studentProgram: currentUser.program || 'BACHELOR OF TECHNOPRENEURSHIP WITH HONOURS',
        companyName: companyName,
        companyAddress: companyAddress,
        weekNumber: selectedWeekNumber,
        startDate: '',
        endDate: '',
        totalHours: 40,
        entries: DEFAULT_DAYS.map((day, idx) => ({
          id: `entry_${Date.now()}_${idx}`,
          day,
          date: '',
          startTime: '08:30',
          endTime: '17:30',
          department: '',
          tasks: '',
          learningOutcomes: '',
          toolsUsed: '',
          remarks: ''
        })),
        weeklySummary: '',
        status: 'draft',
        trainerName: currentUser.industry_trainer_name || '',
        trainerPosition: currentUser.industry_trainer_position || '',
        trainerEmail: currentUser.industry_trainer_email || '',
        trainerPhone: currentUser.industry_trainer_phone || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentWeekLog(newTemplate);
    }
  }, [isStudent, selectedWeekNumber, logbooks, currentUser, studentPlacementApp]);

  // Student Weeks available
  const studentWeeks = useMemo(() => {
    if (!isStudent) return [];
    const myLogs = logbooks.filter(l => l.studentId === currentUser.id);
    const loggedWeekNums = myLogs.map(l => l.weekNumber);
    const maxWeek = Math.max(1, ...loggedWeekNums, selectedWeekNumber);
    const weeks: number[] = [];
    for (let i = 1; i <= Math.max(maxWeek, 12); i++) {
      weeks.push(i);
    }
    return weeks;
  }, [isStudent, logbooks, currentUser.id, selectedWeekNumber]);

  // Helper to get week log status
  const getWeekStatus = (weekNum: number): LogbookStatus | 'empty' => {
    const l = logbooks.find(item => item.studentId === currentUser.id && item.weekNumber === weekNum);
    return l ? l.status : 'empty';
  };

  // Auto-fill dates based on start date
  const handleAutoFillDates = (startDateVal: string) => {
    if (!currentWeekLog || !startDateVal) return;
    const base = new Date(startDateVal);
    if (isNaN(base.getTime())) return;

    const newEntries = currentWeekLog.entries.map((entry, idx) => {
      const d = new Date(base);
      d.setDate(base.getDate() + idx);
      return {
        ...entry,
        date: d.toISOString().split('T')[0]
      };
    });

    const endD = new Date(base);
    endD.setDate(base.getDate() + Math.max(0, newEntries.length - 1));

    setCurrentWeekLog({
      ...currentWeekLog,
      startDate: startDateVal,
      endDate: endD.toISOString().split('T')[0],
      entries: newEntries
    });
  };

  // Add extra day
  const handleAddDay = () => {
    if (!currentWeekLog) return;
    const dayIndex = currentWeekLog.entries.length;
    const dayNames = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
    const nextDay = dayNames[dayIndex % 7] || `Hari ${dayIndex + 1}`;

    const newEntry: DailyLogEntry = {
      id: `entry_${Date.now()}_${Math.random()}`,
      day: nextDay,
      date: '',
      startTime: '08:30',
      endTime: '17:30',
      department: currentWeekLog.entries[0]?.department || '',
      tasks: '',
      learningOutcomes: '',
      toolsUsed: '',
      remarks: ''
    };

    setCurrentWeekLog({
      ...currentWeekLog,
      entries: [...currentWeekLog.entries, newEntry]
    });
  };

  // Remove day
  const handleRemoveDay = (entryId: string) => {
    if (!currentWeekLog) return;
    if (currentWeekLog.entries.length <= 1) {
      toast.error(language === 'ms' ? 'Sekurang-kurangnya 1 hari rekod diperlukan.' : 'At least 1 day record is required.');
      return;
    }
    setCurrentWeekLog({
      ...currentWeekLog,
      entries: currentWeekLog.entries.filter(e => e.id !== entryId)
    });
  };

  // Update specific day entry
  const handleUpdateEntry = (entryId: string, field: keyof DailyLogEntry, value: string) => {
    if (!currentWeekLog) return;
    const updated = currentWeekLog.entries.map(e => {
      if (e.id === entryId) {
        return { ...e, [field]: value };
      }
      return e;
    });
    setCurrentWeekLog({
      ...currentWeekLog,
      entries: updated
    });
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!currentWeekLog) return;
    setIsSaving(true);
    try {
      const saved = await StorageService.saveWeeklyLogbook({
        ...currentWeekLog,
        status: currentWeekLog.status === 'verified' ? 'verified' : (currentWeekLog.status === 'revision' ? 'revision' : 'draft')
      });
      setCurrentWeekLog(saved);
      loadLogbooks();
      toast.success(language === 'ms' 
        ? `Draf Minggu ${saved.weekNumber} berjaya disimpan.` 
        : `Week ${saved.weekNumber} draft saved successfully.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan draf');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Weekly Logbook
  const handleSubmitWeekly = async () => {
    if (!currentWeekLog) return;

    if (!currentWeekLog.startDate || !currentWeekLog.endDate) {
      toast.error(language === 'ms' 
        ? 'Sila masukkan tarikh mula dan tarikh akhir minggu latihan.' 
        : 'Please specify the training start and end dates.');
      return;
    }

    const filledEntries = currentWeekLog.entries.filter(e => e.tasks && e.tasks.trim().length > 0);
    if (filledEntries.length === 0) {
      toast.error(language === 'ms' 
        ? 'Sila lengkapkan sekurang-kurangnya satu rekod aktiviti harian sebelum menghantar.' 
        : 'Please complete at least one daily activity record before submitting.');
      return;
    }

    if (!confirm(language === 'ms' 
      ? `Hantar Logbook Minggu ${currentWeekLog.weekNumber} kepada Jurulatih Industri untuk pengesahan? Selepas dihantar, logbook akan menunggu pengesahan jurulatih.` 
      : `Submit Week ${currentWeekLog.weekNumber} logbook to Industry Coach for verification?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await StorageService.saveWeeklyLogbook(currentWeekLog);
      
      const submitted = await StorageService.submitWeeklyLogbook(saved.id, {
        name: currentWeekLog.trainerName,
        email: currentWeekLog.trainerEmail,
        position: currentWeekLog.trainerPosition,
        company: currentWeekLog.companyName
      });

      setCurrentWeekLog(submitted);
      loadLogbooks();
      toast.success(language === 'ms' 
        ? `Logbook Minggu ${submitted.weekNumber} berjaya dihantar untuk pengesahan Jurulatih Industri!` 
        : `Week ${submitted.weekNumber} logbook successfully submitted for verification!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar logbook');
    } finally {
      setIsSaving(false);
    }
  };

  // Print/Download Weekly Logbook
  const handlePrintLogbook = (logToPrint?: WeeklyLogbook) => {
    const target = logToPrint || currentWeekLog;
    if (!target) return;
    generateWeeklyLogbookPrint(target, currentUser, language);
  };

  // Open Full Review Modal (Trainer / Supervisor / Coordinator)
  const handleOpenReview = (logbook: WeeklyLogbook) => {
    setReviewingLogbook(logbook);
    setTrainerComments(logbook.trainerComments || '');
    setTrainerRating(logbook.trainerRating || 'cemerlang');
    setRevisionNotes('');
    setIsRevisionMode(false);
    setSupervisorCommentsInput(logbook.supervisorComments || '');
  };

  // Open 1-Click Direct Verify Modal for Industry Trainer
  const handleOpenDirectVerify = (logbook: WeeklyLogbook) => {
    setDirectVerifyTarget(logbook);
    setDirectRating('cemerlang');
    setDirectComments('Disahkan aktiviti latihan harian dan kemahiran industri pelajar telah disemak, menepati sukatan latihan dan memuaskan.');
  };

  // Confirm 1-Click Direct Verification
  const handleConfirmDirectVerify = async () => {
    if (!directVerifyTarget) return;
    setIsSaving(true);
    try {
      const verified = await StorageService.directVerifyWeeklyLogbook(directVerifyTarget.id, {
        trainerId: currentUser.id,
        trainerName: currentUser.name,
        trainerPosition: currentUser.company_position || currentUser.company_affiliation || 'Jurulatih Industri (Industry Coach)',
        trainerCompany: currentUser.company_affiliation || directVerifyTarget.companyName,
        trainerEmail: currentUser.email,
        trainerPhone: currentUser.phone,
        trainerRating: directRating,
        trainerComments: directComments
      });

      loadLogbooks();
      setDirectVerifyTarget(null);
      if (reviewingLogbook?.id === directVerifyTarget.id) {
        setReviewingLogbook(verified);
      }
      toast.success(language === 'ms' 
        ? `⚡ Logbook Minggu ${verified.weekNumber} bagi ${verified.studentName} berjaya DISAHKAN DIRECT!` 
        : `⚡ Week ${verified.weekNumber} logbook for ${verified.studentName} directly verified!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat pengesahan direct');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Standard Verification inside detailed review modal
  const handleConfirmVerification = async () => {
    if (!reviewingLogbook) return;
    if (!trainerComments.trim()) {
      toast.error(language === 'ms' ? 'Sila berikan sedikit ulasan atau komen pengesahan.' : 'Please provide comments or feedback.');
      return;
    }

    setIsSaving(true);
    try {
      const verified = await StorageService.verifyWeeklyLogbook(reviewingLogbook.id, {
        trainerName: currentUser.name,
        trainerPosition: currentUser.company_position || currentUser.company_affiliation || 'Jurulatih Industri (Industry Coach)',
        trainerCompany: currentUser.company_affiliation || reviewingLogbook.companyName,
        trainerComments: trainerComments.trim(),
        trainerRating: trainerRating,
        verifiedByTrainerId: currentUser.id,
        trainerEmail: currentUser.email,
        trainerPhone: currentUser.phone
      });

      loadLogbooks();
      setReviewingLogbook(null);
      toast.success(language === 'ms' 
        ? `Logbook Minggu ${verified.weekNumber} bagi ${verified.studentName} telah berjaya disahkan!` 
        : `Week ${verified.weekNumber} logbook for ${verified.studentName} verified successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengesahkan logbook');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Revision Request
  const handleConfirmRevision = async () => {
    if (!reviewingLogbook) return;
    if (!revisionNotes.trim()) {
      toast.error(language === 'ms' ? 'Sila nyatakan bahagian yang perlu dibetulkan oleh pelajar.' : 'Please specify the revision notes.');
      return;
    }

    setIsSaving(true);
    try {
      const revised = await StorageService.requestRevisionWeeklyLogbook(
        reviewingLogbook.id,
        revisionNotes.trim(),
        currentUser.name
      );

      loadLogbooks();
      setReviewingLogbook(null);
      toast.success(language === 'ms' 
        ? `Permintaan pembetulan telah dihantar kepada pelajar ${revised.studentName}.` 
        : `Revision request sent to ${revised.studentName}.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar permintaan pembetulan');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Supervisor Review & Comments (Penyelia Universiti)
  const handleSaveSupervisorReview = async () => {
    if (!reviewingLogbook) return;
    if (!supervisorCommentsInput.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan ulasan atau catatan pemantauan.' : 'Please enter supervisor comments.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await StorageService.addSupervisorReview(reviewingLogbook.id, {
        supervisorId: currentUser.id,
        supervisorName: currentUser.name,
        supervisorStaffId: currentUser.staff_id,
        supervisorComments: supervisorCommentsInput.trim()
      });
      loadLogbooks();
      setReviewingLogbook(updated);
      toast.success(language === 'ms' ? 'Ulasan pemantauan penyelia universiti berjaya disimpan!' : 'Supervisor review comments saved!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan ulasan');
    } finally {
      setIsSaving(false);
    }
  };

  // Send Reminder to Industry Trainer (Penyelaras / Supervisor)
  const handleSendReminder = async (log: WeeklyLogbook) => {
    try {
      await StorageService.sendTrainerVerificationReminder(log.id, currentUser.name);
      toast.success(language === 'ms' 
        ? `Peringatan pengesahan telah dihantar kepada jurulatih industri (${log.trainerName || 'Jurulatih Penempatan'})!` 
        : `Verification reminder sent to industry coach!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar peringatan');
    }
  };

  // Filtered logbooks for Verification & Monitoring Queue
  const queueLogbooks = useMemo(() => {
    return logbooks.filter(l => {
      // 1. Role Scope Filter
      if (scopeFilter === 'my_scope') {
        if (isSupervisor) {
          // Match supervised students
          const studentUser = users.find(u => u.id === l.studentId || u.matric_no === l.studentMatric);
          const isMyById = studentUser?.faculty_supervisor_id === currentUser.id;
          const isMyByName = studentUser?.faculty_supervisor_name && studentUser.faculty_supervisor_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isMyInApps = applications.some(a => 
            (a.student_id === l.studentMatric || a.created_by === studentUser?.username) &&
            (a.faculty_supervisor_id === currentUser.id || (a.faculty_supervisor_name && a.faculty_supervisor_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()))
          );
          if (!isMyById && !isMyByName && !isMyInApps) return false;
        } else if (isTrainer) {
          const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
          const matchesComp = !trainerComp || (l.companyName && l.companyName.trim().toLowerCase().includes(trainerComp));
          const matchesSelf = l.verifiedByTrainerId === currentUser.id || (l.trainerName && l.trainerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
          if (!matchesComp && !matchesSelf) return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          (l.studentName && l.studentName.toLowerCase().includes(q)) ||
          (l.studentMatric && l.studentMatric.toLowerCase().includes(q)) ||
          (l.companyName && l.companyName.toLowerCase().includes(q)) ||
          (l.trainerName && l.trainerName.toLowerCase().includes(q)) ||
          (`minggu ${l.weekNumber}`.includes(q));
        if (!matchesSearch) return false;
      }

      // 3. Trainer Verification Status Filter (Crucial for Penyelaras: semak status pengesahan jurulatih industri)
      if (trainerVerifyFilter === 'unverified') {
        // Submitted but not verified by trainer
        if (l.status !== 'submitted') return false;
      } else if (trainerVerifyFilter === 'verified') {
        // Verified by trainer
        if (l.status !== 'verified') return false;
      } else if (trainerVerifyFilter === 'revision') {
        if (l.status !== 'revision') return false;
      } else if (trainerVerifyFilter === 'draft') {
        if (l.status !== 'draft') return false;
      }

      // 4. Student filter
      if (studentFilter !== 'all' && l.studentId !== studentFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pending unverified first, then by week
      if (a.status === 'submitted' && b.status !== 'submitted') return -1;
      if (b.status === 'submitted' && a.status !== 'submitted') return 1;
      return b.weekNumber - a.weekNumber;
    });
  }, [logbooks, scopeFilter, isSupervisor, isTrainer, currentUser, users, applications, searchQuery, trainerVerifyFilter, studentFilter]);

  // Overall Statistics for Queue
  const queueStats = useMemo(() => {
    const total = logbooks.length;
    const unverifiedByTrainer = logbooks.filter(l => l.status === 'submitted').length;
    const verifiedByTrainer = logbooks.filter(l => l.status === 'verified').length;
    const revision = logbooks.filter(l => l.status === 'revision').length;
    const draft = logbooks.filter(l => l.status === 'draft').length;
    const verifiedPct = total > 0 ? Math.round((verifiedByTrainer / total) * 100) : 0;
    return { total, unverifiedByTrainer, verifiedByTrainer, revision, draft, verifiedPct };
  }, [logbooks]);

  // Unique students in logbooks for filter dropdown
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, string>();
    logbooks.forEach(l => {
      if (l.studentId && l.studentName) {
        map.set(l.studentId, `${l.studentName} (${l.studentMatric || '-'})`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [logbooks]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <BookOpen size={24} />
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {isCoordinator ? (language === 'ms' ? 'Pemantauan Buku Log Pelajar (Penyelaras WBL)' : 'Logbook Cohort Oversight') :
               isSupervisor ? (language === 'ms' ? 'Buku Log Pelajar Seliaan (Penyelia Universiti)' : 'Supervised Students Logbook') :
               isTrainer ? (language === 'ms' ? 'Pengesahan Log Latihan Harian (Jurulatih Industri)' : 'Daily Training Log Verification') :
               t(language, 'logbookTitle')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            {isCoordinator ? (language === 'ms' 
              ? 'Memantau setiap buku log harian pelajar merentas seluruh kohort, menyemak status pengesahan jurulatih industri, dan memastikan pematuhan silibus WBL.'
              : 'Monitor every student daily logbook across the cohort, check industry trainer verification status, and ensure WBL syllabus compliance.') :
             isSupervisor ? (language === 'ms'
              ? 'Akses dan semak buku log aktiviti harian pelajar seliaan anda, semak status pengesahan jurulatih industri, dan tinggalkan catatan pemantauan penyelia.'
              : 'Access and review supervised students daily logbooks, check industry coach endorsement, and leave supervisory feedback.') :
             isTrainer ? (language === 'ms'
              ? 'Akses buku log pelajar industri di syarikat anda dan buat pengesahan secara terus (Direct Verify 1-Klik) bagi aktiviti serta pembelajaran mingguan.'
              : 'Access student logbooks and directly verify daily activities and weekly reflections with 1-click endorsement.') :
             t(language, 'logbookDesc')}
          </p>
        </div>

        {/* View Toggle Tabs for Student vs Queue */}
        {canVerify && isStudent && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('my_logbook')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'my_logbook' 
                  ? 'bg-white text-blue-700 shadow-sm font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ms' ? 'Logbook Saya' : 'My Logbook'}
            </button>
            <button
              onClick={() => setActiveTab('verification_queue')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'verification_queue' 
                  ? 'bg-blue-600 text-white shadow-sm font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck size={14} />
              <span>{language === 'ms' ? 'Semakan & Pengesahan' : 'Review & Verification'}</span>
              {queueStats.unverifiedByTrainer > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {queueStats.unverifiedByTrainer}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDENT VIEW: DAILY LOGBOOK WORKSPACE                                  */}
      {/* ========================================================================= */}
      {isStudent && activeTab === 'my_logbook' && (
        <div className="space-y-6">
          {/* Placement Notice Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Penempatan Industri WBL' : 'WBL Industry Placement'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {studentPlacementApp?.company_name || currentUser.company_affiliation || (language === 'ms' ? 'Belum Ada Syarikat Penempatan Rasmi' : 'No Official Placement')}
                </h3>
                <p className="text-xs text-blue-200 mt-1 flex flex-wrap items-center gap-3">
                  <span><strong>{currentUser.name}</strong> ({currentUser.matric_no})</span>
                  <span>•</span>
                  <span>{currentUser.program || 'FPTT WBL'}</span>
                  {studentPlacementApp?.company_state && (
                    <>
                      <span>•</span>
                      <span>{studentPlacementApp.company_district}, {studentPlacementApp.company_state}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintLogbook()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Printer size={16} />
                  <span>{language === 'ms' ? 'Cetak Log Mingguan' : 'Print Weekly Log'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Week Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                {language === 'ms' ? 'Pilih Minggu Latihan:' : 'Select Training Week:'}
              </span>
              <span className="text-xs text-slate-400">
                {language === 'ms' ? 'Format mingguan bagi tujuan simpanan & muat turun' : 'Weekly format for storage & downloads'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {studentWeeks.map((weekNum) => {
                const status = getWeekStatus(weekNum);
                const isSelected = selectedWeekNumber === weekNum;
                return (
                  <button
                    key={weekNum}
                    onClick={() => setSelectedWeekNumber(weekNum)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center min-w-[90px] border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{language === 'ms' ? 'Minggu' : 'Week'} {weekNum}</span>
                    <span className={`text-[9px] mt-1 font-semibold px-2 py-0.5 rounded-full ${
                      status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'submitted' ? (isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-700') :
                      status === 'revision' ? 'bg-amber-100 text-amber-800' :
                      status === 'draft' ? (isSelected ? 'bg-blue-700 text-blue-200' : 'bg-slate-200 text-slate-600') :
                      (isSelected ? 'bg-blue-700 text-blue-200' : 'text-slate-400')
                    }`}>
                      {status === 'verified' ? '✓ Disahkan' :
                       status === 'submitted' ? 'Dihantar' :
                       status === 'revision' ? 'Pembetulan' :
                       status === 'draft' ? 'Draf' : 'Kosong'}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  const nextWeek = Math.max(...studentWeeks, 0) + 1;
                  setSelectedWeekNumber(nextWeek);
                }}
                className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1"
                title={language === 'ms' ? 'Tambah Minggu Seterusnya' : 'Add Next Week'}
              >
                <Plus size={14} />
                <span>{language === 'ms' ? '+ Minggu' : '+ Week'}</span>
              </button>
            </div>
          </div>

          {/* Active Week Form & Daily Activities */}
          {currentWeekLog && (
            <div className="space-y-6">
              {/* Status Header Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                currentWeekLog.status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                currentWeekLog.status === 'submitted' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                currentWeekLog.status === 'revision' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-white shadow-sm">
                    {currentWeekLog.status === 'verified' ? <CheckCircle2 className="text-emerald-600" size={20} /> :
                     currentWeekLog.status === 'submitted' ? <Clock className="text-blue-600" size={20} /> :
                     currentWeekLog.status === 'revision' ? <AlertCircle className="text-amber-600" size={20} /> :
                     <FileText className="text-slate-500" size={20} />}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm">
                      {currentWeekLog.status === 'verified' ? (language === 'ms' ? 'Status: DISAHKAN OLEH JURULATIH INDUSTRI' : 'Status: VERIFIED BY INDUSTRY COACH') :
                       currentWeekLog.status === 'submitted' ? (language === 'ms' ? 'Status: MENUNGGU PENGESAHAN JURULATIH INDUSTRI' : 'Status: PENDING TRAINER VERIFICATION') :
                       currentWeekLog.status === 'revision' ? (language === 'ms' ? 'Status: PERLU PEMBETULAN OLEH PELAJAR' : 'Status: REVISION REQUESTED') :
                       (language === 'ms' ? 'Status: DRAF (BELUM DIHANTAR)' : 'Status: DRAFT (NOT SUBMITTED)')}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {currentWeekLog.status === 'verified' && currentWeekLog.verifiedAt
                        ? `${language === 'ms' ? 'Disahkan pada' : 'Verified at'} ${new Date(currentWeekLog.verifiedAt).toLocaleDateString()} ${language === 'ms' ? 'oleh' : 'by'} ${currentWeekLog.trainerName || 'Jurulatih Industri'}`
                        : currentWeekLog.status === 'submitted'
                        ? (language === 'ms' ? 'Logbook telah dihantar. Jurulatih industri boleh menyemak dan mengesahkan secara terus.' : 'Submitted. Industry coach can verify directly.')
                        : (language === 'ms' ? 'Isi aktiviti harian dari Isnin hingga Jumaat dan hantar pada hujung minggu.' : 'Complete daily tasks and submit at end of week.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintLogbook()}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer size={14} className="text-blue-600" />
                    <span>{language === 'ms' ? 'Cetak / Muat Turun' : 'Print / Download'}</span>
                  </button>
                </div>
              </div>

              {/* Revision Instructions Banner (if revision requested) */}
              {currentWeekLog.status === 'revision' && currentWeekLog.revisionNotes && (
                <div className="bg-amber-100/80 border-l-4 border-amber-600 p-4 rounded-xl text-amber-900 text-xs">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-700" />
                    <span>{language === 'ms' ? 'Catatan Pembetulan daripada Jurulatih Industri:' : 'Revision Notes from Industry Coach:'}</span>
                  </div>
                  <p className="italic bg-white/70 p-2.5 rounded-lg border border-amber-200">{currentWeekLog.revisionNotes}</p>
                </div>
              )}

              {/* Endorsement Details Banner (if verified) */}
              {currentWeekLog.status === 'verified' && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      {language === 'ms' ? 'Maklumat Pengesahan Jurulatih Industri:' : 'Industry Coach Verification Endorsement:'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black uppercase">
                      Gred: {currentWeekLog.trainerRating?.toUpperCase() || 'CEMERLANG'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">{language === 'ms' ? 'Jurulatih Industri:' : 'Coach Name:'} </span>
                      <strong className="text-slate-800">{currentWeekLog.trainerName || '-'}</strong>
                      {currentWeekLog.trainerPosition && <div className="text-[11px] text-slate-500">{currentWeekLog.trainerPosition}</div>}
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">{language === 'ms' ? 'Syarikat / Organisasi:' : 'Company:'} </span>
                      <strong className="text-slate-800">{currentWeekLog.companyName}</strong>
                    </div>
                  </div>

                  {currentWeekLog.trainerComments && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-600">{language === 'ms' ? 'Ulasan Jurulatih:' : 'Coach Feedback:'} </span>
                      <span className="italic">"{currentWeekLog.trainerComments}"</span>
                    </div>
                  )}

                  {currentWeekLog.supervisorComments && (
                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs text-blue-900">
                      <span className="font-bold text-blue-700">{language === 'ms' ? 'Catatan Penyelia Universiti:' : 'Faculty Supervisor Notes:'} </span>
                      <span className="italic">"{currentWeekLog.supervisorComments}"</span>
                      {currentWeekLog.supervisorName && (
                        <div className="text-[10px] text-blue-600 mt-1">Oleh: {currentWeekLog.supervisorName}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Week Metadata Form Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>{language === 'ms' ? 'Maklumat Minggu Latihan' : 'Training Week Details'}</span>
                  <span className="text-xs font-normal text-slate-400">Minggu {currentWeekLog.weekNumber}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Tarikh Mula (Isnin):' : 'Start Date (Mon):'}
                    </label>
                    <input
                      type="date"
                      value={currentWeekLog.startDate || ''}
                      onChange={(e) => handleAutoFillDates(e.target.value)}
                      disabled={currentWeekLog.status === 'verified'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Tarikh Akhir (Jumaat):' : 'End Date (Fri):'}
                    </label>
                    <input
                      type="date"
                      value={currentWeekLog.endDate || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, endDate: e.target.value })}
                      disabled={currentWeekLog.status === 'verified'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Nama Jurulatih Industri:' : 'Industry Coach Name:'}
                    </label>
                    <input
                      type="text"
                      placeholder="cth: En. Azman bin Khalid"
                      value={currentWeekLog.trainerName || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, trainerName: e.target.value })}
                      disabled={currentWeekLog.status === 'verified'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Jawatan Jurulatih:' : 'Coach Position:'}
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Pengurus IT / Jurutera Kanan"
                      value={currentWeekLog.trainerPosition || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, trainerPosition: e.target.value })}
                      disabled={currentWeekLog.status === 'verified'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Log Entries Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    <span>{language === 'ms' ? 'Rekod Aktiviti Harian' : 'Daily Activity Records'}</span>
                  </h4>

                  {currentWeekLog.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={handleAddDay}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>{language === 'ms' ? 'Tambah Hari' : 'Add Day'}</span>
                    </button>
                  )}
                </div>

                {currentWeekLog.entries.map((entry, index) => (
                  <div key={entry.id || index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={entry.day}
                          onChange={(e) => handleUpdateEntry(entry.id, 'day', e.target.value)}
                          disabled={currentWeekLog.status === 'verified'}
                          className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-28 disabled:text-slate-800"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Tarikh:</label>
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleUpdateEntry(entry.id, 'date', e.target.value)}
                            disabled={currentWeekLog.status === 'verified'}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none disabled:bg-slate-50"
                          />
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Masa:</label>
                          <input
                            type="text"
                            value={entry.startTime}
                            onChange={(e) => handleUpdateEntry(entry.id, 'startTime', e.target.value)}
                            disabled={currentWeekLog.status === 'verified'}
                            className="w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-center text-xs outline-none disabled:bg-slate-50"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={entry.endTime}
                            onChange={(e) => handleUpdateEntry(entry.id, 'endTime', e.target.value)}
                            disabled={currentWeekLog.status === 'verified'}
                            className="w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-center text-xs outline-none disabled:bg-slate-50"
                          />
                        </div>

                        {currentWeekLog.status !== 'verified' && currentWeekLog.entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDay(entry.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Padam Hari"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {language === 'ms' ? 'Bahagian / Jabatan / Seksyen:' : 'Department / Section:'}
                        </label>
                        <input
                          type="text"
                          placeholder="cth: IT Support & Infrastructure"
                          value={entry.department}
                          onChange={(e) => handleUpdateEntry(entry.id, 'department', e.target.value)}
                          disabled={currentWeekLog.status === 'verified'}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {language === 'ms' ? 'Alatan / Mesin / Perisian Digunakan (Pilihan):' : 'Tools / Software Used (Optional):'}
                        </label>
                        <input
                          type="text"
                          placeholder="cth: Visual Studio Code, AWS Cloud, Docker, Git"
                          value={entry.toolsUsed || ''}
                          onChange={(e) => handleUpdateEntry(entry.id, 'toolsUsed', e.target.value)}
                          disabled={currentWeekLog.status === 'verified'}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {language === 'ms' ? 'Ringkasan Tugasan & Aktiviti Yang Dijalankan:' : 'Summary of Daily Tasks & Activities:'}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={language === 'ms' ? 'Huraikan aktiviti dan tugasan yang dilaksanakan pada hari ini...' : 'Describe tasks performed today...'}
                        value={entry.tasks}
                        onChange={(e) => handleUpdateEntry(entry.id, 'tasks', e.target.value)}
                        disabled={currentWeekLog.status === 'verified'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {language === 'ms' ? 'Hasil Pembelajaran & Kemahiran Yang Diperoleh:' : 'Learning Outcomes & Skills Acquired:'}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={language === 'ms' ? 'Kemahiran teknikal atau insaniah yang dipelajari...' : 'Technical or soft skills learned...'}
                        value={entry.learningOutcomes}
                        onChange={(e) => handleUpdateEntry(entry.id, 'learningOutcomes', e.target.value)}
                        disabled={currentWeekLog.status === 'verified'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Reflection Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span>{language === 'ms' ? 'Refleksi Mingguan Pelajar (Weekly Summary)' : 'Student Weekly Reflection'}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'ms' 
                    ? 'Ringkaskan pencapaian utama minggu ini, cabaran yang dihadapi serta cara penyelesaiannya.' 
                    : 'Summarize key weekly achievements, challenges faced, and how you solved them.'}
                </p>
                <textarea
                  rows={4}
                  placeholder={language === 'ms' 
                    ? 'Pada minggu ini saya telah berjaya menguasai aliran kerja penempatan dan menyelesaikan tugasan bersama pasukan...' 
                    : 'This week I successfully completed my assignments and collaborated with the team...'}
                  value={currentWeekLog.weeklySummary}
                  onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, weeklySummary: e.target.value })}
                  disabled={currentWeekLog.status === 'verified'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>

              {/* Student Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info size={14} />
                  <span>
                    {currentWeekLog.status === 'verified'
                      ? (language === 'ms' ? 'Logbook telah disahkan dan dikunci daripada sebarang perubahan.' : 'Logbook is verified and locked.')
                      : (language === 'ms' ? 'Simpan draf semasa atau hantar terus untuk pengesahan jurulatih industri.' : 'Save draft or submit for trainer verification.')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentWeekLog.status !== 'verified' && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{isSaving ? 'Menyimpan...' : (language === 'ms' ? 'Simpan Draf' : 'Save Draft')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitWeekly}
                        disabled={isSaving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        <span>{language === 'ms' ? 'Hantar Pengesahan Mingguan' : 'Submit Weekly Log'}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePrintLogbook()}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Printer size={14} />
                    <span>{language === 'ms' ? 'Cetak PDF' : 'Print PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Weekly History Overview Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>{language === 'ms' ? 'Sejarah Penghantaran Log Mingguan' : 'Weekly Log Submission History'}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Minggu</th>
                    <th className="py-3 px-3">Tempoh Tarikh</th>
                    <th className="py-3 px-3">Jumlah Entri</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Jurulatih Industri</th>
                    <th className="py-3 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logbooks.filter(l => l.studentId === currentUser.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {language === 'ms' ? 'Tiada logbook disimpan buat masa ini.' : 'No logbooks saved yet.'}
                      </td>
                    </tr>
                  ) : (
                    logbooks.filter(l => l.studentId === currentUser.id)
                      .sort((a, b) => a.weekNumber - b.weekNumber)
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800">
                            Minggu {log.weekNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {log.startDate && log.endDate ? `${log.startDate} - ${log.endDate}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {log.entries?.length || 0} hari
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              log.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                              log.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                              log.status === 'revision' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {log.status === 'verified' ? '✓ Disahkan' :
                               log.status === 'submitted' ? 'Menunggu Pengesahan' :
                               log.status === 'revision' ? 'Perlu Pembetulan' :
                               'Draf'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {log.trainerName || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedWeekNumber(log.weekNumber)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                              >
                                {language === 'ms' ? 'Buka' : 'Open'}
                              </button>
                              <button
                                onClick={() => handlePrintLogbook(log)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Cetak / PDF"
                              >
                                <Printer size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VERIFICATION & MONITORING QUEUE: FOR TRAINER, SUPERVISOR, COORDINATOR  */}
      {/* ========================================================================= */}
      {(!isStudent || activeTab === 'verification_queue') && (
        <div className="space-y-6">
          {/* Attention Banner for Coordinator: If unverified logbooks exist */}
          {isCoordinator && queueStats.unverifiedByTrainer > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 animate-pulse">
                  <AlertCircle size={20} />
                </span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    {language === 'ms' 
                      ? `Perhatian Penyelaras: ${queueStats.unverifiedByTrainer} Buku Log Pelajar Belum Disahkan oleh Jurulatih Industri` 
                      : `Coordinator Notice: ${queueStats.unverifiedByTrainer} Logbooks Pending Industry Trainer Verification`}
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {language === 'ms'
                      ? 'Terdapat rekod aktiviti harian yang telah dihantar oleh pelajar tetapi masih menunggu tindakan pengesahan daripada pihak jurulatih industri.'
                      : 'Students have submitted daily logs waiting for industry coach endorsement.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrainerVerifyFilter('unverified')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition-all"
              >
                {language === 'ms' ? 'Tapis Belum Disahkan' : 'Filter Pending'}
              </button>
            </div>
          )}

          {/* Queue Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ms' ? 'Jumlah Semua Logbook' : 'Total Logbooks'}
              </span>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {queueStats.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {queueStats.draft} draf pelajar
              </div>
            </div>

            {/* Sudah Disahkan Jurulatih */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={14} />
                {language === 'ms' ? 'Disahkan Jurulatih' : 'Trainer Verified'}
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {queueStats.verifiedByTrainer}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                {queueStats.verifiedPct}% kadar pengesahan
              </div>
            </div>

            {/* Belum Disahkan Jurulatih */}
            <div className={`p-5 rounded-2xl border shadow-sm ${
              queueStats.unverifiedByTrainer > 0 
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100' 
                : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} />
                {language === 'ms' ? 'Belum Disahkan Jurulatih' : 'Pending Trainer'}
              </span>
              <div className="text-3xl font-black text-amber-800 mt-1">
                {queueStats.unverifiedByTrainer}
              </div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">
                {isTrainer ? (language === 'ms' ? 'Menunggu tindakan anda' : 'Awaiting your action') : (language === 'ms' ? 'Menunggu jurulatih industri' : 'Awaiting coach action')}
              </div>
            </div>

            {/* Perlu Pembetulan */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/30">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={14} />
                {language === 'ms' ? 'Perlu Pembetulan' : 'Needs Revision'}
              </span>
              <div className="text-3xl font-black text-rose-700 mt-1">
                {queueStats.revision}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                {language === 'ms' ? 'Dalam semakan pelajar' : 'In student review'}
              </div>
            </div>
          </div>

          {/* Scope & Role Filtering Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Search query input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={language === 'ms' 
                    ? 'Cari nama pelajar, no. matrik, syarikat penempatan, atau nama jurulatih...' 
                    : 'Search student, matric, company, or trainer...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Scope Switcher for Supervisor & Trainer */}
              {(isSupervisor || isTrainer) && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                  <button
                    onClick={() => setScopeFilter('my_scope')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      scopeFilter === 'my_scope'
                        ? 'bg-blue-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isSupervisor 
                      ? (language === 'ms' ? 'Pelajar Seliaan Saya' : 'My Supervised Students')
                      : (language === 'ms' ? 'Pelajar Syarikat Saya' : 'My Company Interns')}
                  </button>
                  <button
                    onClick={() => setScopeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      scopeFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ms' ? 'Semua Pelajar WBL' : 'All WBL Students'}
                  </button>
                </div>
              )}

              {/* Student Filter Dropdown */}
              {uniqueStudents.length > 0 && (
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none max-w-xs truncate shrink-0"
                >
                  <option value="all">{language === 'ms' ? 'Semua Pelajar' : 'All Students'}</option>
                  {uniqueStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Status Filter Pills (Crucial for Penyelaras: Semak status pengesahan jurulatih) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter size={12} />
                {language === 'ms' ? 'Status Pengesahan Jurulatih:' : 'Trainer Status:'}
              </span>

              <button
                onClick={() => setTrainerVerifyFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                  trainerVerifyFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {language === 'ms' ? 'Semua' : 'All'} ({logbooks.length})
              </button>

              <button
                onClick={() => setTrainerVerifyFilter('unverified')}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                  trainerVerifyFilter === 'unverified'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                <Clock size={12} />
                <span>{language === 'ms' ? '⏳ Belum Disahkan oleh Jurulatih' : '⏳ Pending Trainer'}</span>
                <span className="bg-white/30 px-1.5 py-0.2 rounded-full text-[10px]">
                  {queueStats.unverifiedByTrainer}
                </span>
              </button>

              <button
                onClick={() => setTrainerVerifyFilter('verified')}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                  trainerVerifyFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>{language === 'ms' ? '✓ Sudah Disahkan oleh Jurulatih' : '✓ Trainer Verified'}</span>
                <span className="bg-white/30 px-1.5 py-0.2 rounded-full text-[10px]">
                  {queueStats.verifiedByTrainer}
                </span>
              </button>

              <button
                onClick={() => setTrainerVerifyFilter('revision')}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                  trainerVerifyFilter === 'revision'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
              >
                <AlertCircle size={12} />
                <span>{language === 'ms' ? 'Perlu Pembetulan' : 'Needs Revision'}</span>
                <span className="bg-white/30 px-1.5 py-0.2 rounded-full text-[10px]">
                  {queueStats.revision}
                </span>
              </button>

              <button
                onClick={() => setTrainerVerifyFilter('draft')}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                  trainerVerifyFilter === 'draft'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {language === 'ms' ? 'Draf' : 'Draft'} ({queueStats.draft})
              </button>
            </div>
          </div>

          {/* Submissions & Verification Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Pelajar & No. Matrik</th>
                    <th className="py-3.5 px-4">Syarikat Penempatan</th>
                    <th className="py-3.5 px-4">Minggu Latihan</th>
                    <th className="py-3.5 px-4">Aktiviti Harian</th>
                    <th className="py-3.5 px-4">Status Pengesahan Jurulatih Industri</th>
                    <th className="py-3.5 px-4">Penyelia Universiti</th>
                    <th className="py-3.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueLogbooks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <BookOpen size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-medium">
                          {language === 'ms' 
                            ? 'Tiada rekod buku log sepadan dengan kriteria tapisan semasa.' 
                            : 'No logbook records matching current filter.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    queueLogbooks.map((log) => {
                      const isVerified = log.status === 'verified';
                      const isUnverified = log.status === 'submitted';
                      const studentUser = users.find(u => u.id === log.studentId || u.matric_no === log.studentMatric);
                      const supervisorName = log.supervisorName || studentUser?.faculty_supervisor_name || '-';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-sm">{log.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{log.studentMatric}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{log.studentProgram}</div>
                          </td>

                          {/* Company */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">{log.companyName}</div>
                            <div className="text-[10px] text-slate-400">{log.companyAddress || '-'}</div>
                          </td>

                          {/* Week */}
                          <td className="py-3.5 px-4">
                            <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                              Minggu {log.weekNumber}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 font-medium">
                              {log.startDate && log.endDate ? `${log.startDate} hingga ${log.endDate}` : '-'}
                            </div>
                          </td>

                          {/* Entries & Hours */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-700">
                              {log.entries?.length || 0} hari kerja
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {log.totalHours || 40} jam latihan
                            </div>
                          </td>

                          {/* STATUS PENGESAHAN JURULATIH INDUSTRI (Explicit audit check for Penyelaras) */}
                          <td className="py-3.5 px-4">
                            {isVerified ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>{language === 'ms' ? 'Sudah Disahkan' : 'Verified'}</span>
                                </span>
                                <div className="text-[11px] font-bold text-slate-700">
                                  {log.trainerName || 'Jurulatih Industri'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {log.verifiedAt ? new Date(log.verifiedAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} • 
                                  <span className="font-bold text-emerald-700 uppercase ml-1">{log.trainerRating || 'Cemerlang'}</span>
                                </div>
                              </div>
                            ) : isUnverified ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                  <Clock size={12} className="text-amber-600" />
                                  <span>{language === 'ms' ? 'Belum Disahkan Jurulatih' : 'Pending Trainer'}</span>
                                </span>
                                <div className="text-[10px] text-amber-800 font-medium">
                                  Menunggu: <strong>{log.trainerName || 'Jurulatih Industri'}</strong>
                                </div>
                                {isCoordinator && (
                                  <button
                                    onClick={() => handleSendReminder(log)}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-0.5"
                                    title="Hantar notifikasi peringatan kepada jurulatih"
                                  >
                                    <Bell size={10} />
                                    <span>{language === 'ms' ? 'Hantar Peringatan' : 'Send Reminder'}</span>
                                  </button>
                                )}
                              </div>
                            ) : log.status === 'revision' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                  <AlertCircle size={12} className="text-rose-600" />
                                  <span>{language === 'ms' ? 'Perlu Pembetulan' : 'Needs Revision'}</span>
                                </span>
                                <div className="text-[10px] text-rose-700 italic truncate max-w-[180px]">
                                  {log.revisionNotes || '-'}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                <span>{language === 'ms' ? 'Draf Pelajar' : 'Draft'}</span>
                              </span>
                            )}
                          </td>

                          {/* Supervisor Info */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-700">{supervisorName}</div>
                            {log.supervisorReviewedAt ? (
                              <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                                <Check size={10} />
                                <span>{language === 'ms' ? 'Disemak Penyelia' : 'Supervisor Reviewed'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {language === 'ms' ? 'Belum disemak' : 'Not reviewed'}
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Fast 1-Click Direct Verify for Industry Trainer (or Coordinator) */}
                              {(isTrainer || isCoordinator) && !isVerified && (
                                <button
                                  onClick={() => handleOpenDirectVerify(log)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-1 shadow-sm"
                                  title={language === 'ms' ? 'Sahkan Direct (1-Klik)' : 'Direct Verify (1-Click)'}
                                >
                                  <Zap size={13} className="text-amber-300" />
                                  <span>{language === 'ms' ? 'Sahkan Direct' : 'Direct Verify'}</span>
                                </button>
                              )}

                              {/* Standard Review & Inspection Modal Button */}
                              <button
                                onClick={() => handleOpenReview(log)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                                  !isVerified && isTrainer
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                }`}
                              >
                                <Eye size={13} />
                                <span>
                                  {isCoordinator ? (language === 'ms' ? 'Semak Log' : 'Audit Log') :
                                   isSupervisor ? (language === 'ms' ? 'Semak & Ulas' : 'Review & Note') :
                                   isTrainer ? (language === 'ms' ? 'Semak Penuh' : 'Full Review') :
                                   (language === 'ms' ? 'Lihat' : 'View')}
                                </span>
                              </button>

                              {/* Print / Download PDF */}
                              <button
                                onClick={() => handlePrintLogbook(log)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl"
                                title="Cetak / Muat Turun PDF"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FAST 1-CLICK DIRECT VERIFICATION MODAL FOR INDUSTRY TRAINER             */}
      {/* ========================================================================= */}
      {directVerifyTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-emerald-200 flex items-center gap-1 w-max">
                  <Zap size={12} className="text-amber-300" />
                  <span>{language === 'ms' ? 'Pengesahan Terus (Direct Verify)' : 'Direct 1-Click Verification'}</span>
                </span>
                <h3 className="text-xl font-black mt-1">
                  {directVerifyTarget.studentName}
                </h3>
                <p className="text-xs text-emerald-200">
                  {directVerifyTarget.studentMatric} • Minggu {directVerifyTarget.weekNumber} ({directVerifyTarget.companyName})
                </p>
              </div>

              <button
                onClick={() => setDirectVerifyTarget(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
                <div className="text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-0.5">Pengesah (Jurulatih Industri):</div>
                  <div><strong>{currentUser.name}</strong> ({currentUser.company_position || currentUser.company_affiliation || 'Jurulatih Industri'})</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{directVerifyTarget.companyName}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ms' ? 'Penilaian Prestasi Pelajar:' : 'Performance Rating:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'cemerlang', label: '⭐ Cemerlang (Excellent)' },
                      { val: 'baik', label: '👍 Baik (Good)' },
                      { val: 'memuaskan', label: '👌 Memuaskan' },
                      { val: 'perlu_bimbingan', label: 'Bimbingan' },
                    ].map((rate) => (
                      <button
                        key={rate.val}
                        type="button"
                        onClick={() => setDirectRating(rate.val as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          directRating === rate.val 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {rate.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ms' ? 'Komen / Catatan Pengesahan Jurulatih:' : 'Trainer Comments:'}
                  </label>
                  <textarea
                    rows={2}
                    value={directComments}
                    onChange={(e) => setDirectComments(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {language === 'ms' 
                  ? 'Pengesahan ini akan mengesahkan secara serta-merta semua entri aktiviti harian bagi minggu tersebut dan memaklumkan kepada pelajar serta penyelaras WBL.' 
                  : 'This directly validates daily activities and notifies the student and coordinator.'}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setDirectVerifyTarget(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t(language, 'cancel')}
              </button>

              <button
                type="button"
                onClick={handleConfirmDirectVerify}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Zap size={16} className="text-amber-300" />
                <span>{isSaving ? 'Mengesahkan...' : (language === 'ms' ? '⚡ Sahkan Direct Sekarang' : '⚡ Direct Verify Now')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DETAILED REVIEW & VERIFICATION MODAL                                    */}
      {/* ========================================================================= */}
      {reviewingLogbook && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Buku Log Latihan Harian WBL (FPTT UTeM)' : 'Daily Training Log Verification'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {reviewingLogbook.studentName} ({reviewingLogbook.studentMatric})
                </h3>
                <p className="text-xs text-blue-200">
                  {reviewingLogbook.companyName} • Minggu {reviewingLogbook.weekNumber} ({reviewingLogbook.startDate || '-'} hingga {reviewingLogbook.endDate || '-'})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintLogbook(reviewingLogbook)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setReviewingLogbook(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Log Entries */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {/* Daily Entries Review Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span>{language === 'ms' ? 'Entri Aktiviti Harian Pelajar' : 'Student Daily Activities'}</span>
                </h4>

                <div className="space-y-4">
                  {reviewingLogbook.entries?.map((entry, idx) => (
                    <div key={entry.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2">
                        <div className="font-bold text-sm text-blue-800">
                          {entry.day} ({entry.date || '-'})
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          <span>{entry.startTime} - {entry.endTime}</span>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-bold text-slate-600">{language === 'ms' ? 'Bahagian/Unit:' : 'Department:'} </span>
                        <span className="text-slate-800">{entry.department || '-'}</span>
                      </div>

                      <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-600 mb-1">{language === 'ms' ? 'Tugasan & Aktiviti:' : 'Tasks & Activities:'}</div>
                        <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {entry.tasks || (language === 'ms' ? 'Tiada aktiviti dicatat' : 'No tasks recorded')}
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-bold text-slate-600">{language === 'ms' ? 'Hasil Pembelajaran:' : 'Learning Outcomes:'} </span>
                        <span className="italic text-slate-700">{entry.learningOutcomes || '-'}</span>
                      </div>

                      {entry.toolsUsed && (
                        <div className="text-xs text-slate-500">
                          <strong>{language === 'ms' ? 'Alatan/Sistem:' : 'Tools:'}</strong> {entry.toolsUsed}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Reflection */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span>{language === 'ms' ? 'Refleksi Mingguan Pelajar' : 'Student Weekly Reflection'}</span>
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {reviewingLogbook.weeklySummary || (language === 'ms' ? 'Tiada refleksi mingguan dimasukkan.' : 'No reflection entered.')}
                </div>
              </div>

              {/* Status Pengesahan Jurulatih Industri Card */}
              {reviewingLogbook.status === 'verified' ? (
                <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      {language === 'ms' ? 'Telah Disahkan oleh Jurulatih Industri' : 'Verified by Industry Coach'}
                    </span>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black uppercase">
                      Gred: {reviewingLogbook.trainerRating?.toUpperCase() || 'CEMERLANG'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-slate-500">{language === 'ms' ? 'Nama Jurulatih:' : 'Coach Name:'} </span>
                      <strong className="text-slate-800">{reviewingLogbook.trainerName}</strong>
                      <div className="text-[11px] text-slate-500">{reviewingLogbook.trainerPosition || '-'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">{language === 'ms' ? 'Tarikh Pengesahan:' : 'Verified At:'} </span>
                      <strong className="text-slate-800">
                        {reviewingLogbook.verifiedAt ? new Date(reviewingLogbook.verifiedAt).toLocaleString('ms-MY') : '-'}
                      </strong>
                    </div>
                  </div>

                  {reviewingLogbook.trainerComments && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-700">
                      <span className="font-bold text-emerald-800">{language === 'ms' ? 'Ulasan Jurulatih Industri:' : 'Industry Coach Comments:'} </span>
                      <span className="italic">"{reviewingLogbook.trainerComments}"</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Verification Action Form for Industry Trainer */
                (isTrainer || isCoordinator) && (
                  <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span>{language === 'ms' ? 'Tindakan Pengesahan Jurulatih Industri' : 'Industry Coach Verification Action'}</span>
                      </h4>

                      {/* Direct Verification Shortcut */}
                      <button
                        type="button"
                        onClick={() => handleOpenDirectVerify(reviewingLogbook)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Zap size={14} className="text-amber-300" />
                        <span>{language === 'ms' ? '⚡ Sahkan Direct (Cemerlang)' : '⚡ Direct Verify (Excellent)'}</span>
                      </button>
                    </div>

                    {!isRevisionMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {language === 'ms' ? 'Penilaian Prestasi Mingguan Pelajar:' : 'Weekly Performance Rating:'}
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { val: 'cemerlang', label: 'Cemerlang (Excellent)' },
                              { val: 'baik', label: 'Baik (Good)' },
                              { val: 'memuaskan', label: 'Memuaskan' },
                              { val: 'perlu_bimbingan', label: 'Perlu Bimbingan' },
                            ].map((rate) => (
                              <button
                                key={rate.val}
                                type="button"
                                onClick={() => setTrainerRating(rate.val as any)}
                                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                  trainerRating === rate.val 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {rate.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {language === 'ms' ? 'Ulasan & Komen Jurulatih Industri:' : 'Industry Coach Feedback & Comments:'}
                          </label>
                          <textarea
                            rows={3}
                            value={trainerComments}
                            onChange={(e) => setTrainerComments(e.target.value)}
                            placeholder={language === 'ms' 
                              ? "Pelajar menunjukkan inisiatif yang sangat baik, menyelesaikan tugasan tepat pada waktu, dan mematuhi piawaian keselamatan industri." 
                              : "Student demonstrated good initiative..."}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          {language === 'ms' ? 'Sebab & Arahan Pembetulan Kepada Pelajar:' : 'Revision Instructions to Student:'}
                        </label>
                        <textarea
                          rows={3}
                          value={revisionNotes}
                          onChange={(e) => setRevisionNotes(e.target.value)}
                          placeholder={language === 'ms' 
                            ? "cth: Sila huraikan dengan lebih terperinci aktiviti pada hari Rabu dan masukkan bahagian jabatan yang betul." 
                            : "Please describe Wednesday's tasks in more detail..."}
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Supervisory Review Section for Faculty Supervisor & Coordinator */}
              {(isSupervisor || isCoordinator) && (
                <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                      <UserIcon size={16} className="text-indigo-600" />
                      <span>{language === 'ms' ? 'Catatan & Pemantauan Penyelia Universiti' : 'Faculty Supervisor Monitoring Review'}</span>
                    </h4>
                    {reviewingLogbook.supervisorReviewedAt && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Disemak: {new Date(reviewingLogbook.supervisorReviewedAt).toLocaleDateString('ms-MY')}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'ms' ? 'Ulasan / Catatan Penyelia Universiti:' : 'Supervisor Feedback / Notes:'}
                    </label>
                    <textarea
                      rows={2}
                      value={supervisorCommentsInput}
                      onChange={(e) => setSupervisorCommentsInput(e.target.value)}
                      placeholder={language === 'ms'
                        ? 'Catatan pemantauan akademik, bimbingan, atau nasihat kepada pelajar berkaitan tugasan industri...'
                        : 'Academic supervision notes, guidance, or feedback...'}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveSupervisorReview}
                      disabled={isSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'Menyimpan...' : (language === 'ms' ? 'Simpan Catatan Penyelia' : 'Save Supervisor Notes')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewingLogbook(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t(language, 'cancel')}
              </button>

              <div className="flex items-center gap-2">
                {/* Actions for trainer verification if not yet verified */}
                {(isTrainer || isCoordinator) && reviewingLogbook.status !== 'verified' && (
                  !isRevisionMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRevisionMode(true)}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <AlertCircle size={14} />
                        <span>{language === 'ms' ? 'Minta Pembetulan' : 'Request Revision'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmVerification}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        <span>{isSaving ? 'Mengesahkan...' : (language === 'ms' ? 'Sahkan Log Mingguan' : 'Verify Weekly Log')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRevisionMode(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        {language === 'ms' ? 'Kembali' : 'Back'}
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmRevision}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>{isSaving ? 'Menghantar...' : (language === 'ms' ? 'Hantar Pembetulan' : 'Send Revision Request')}</span>
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
