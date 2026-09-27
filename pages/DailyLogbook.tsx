import React, { useState, useEffect, useMemo } from 'react';
import { User, Application, UserRole, WeeklyLogbook, DailyLogEntry, LogbookStatus } from '../types';
import { StorageService } from '../services/storage';
import { generateWeeklyLogbookPrint } from '../utils/logbookGenerator';
import { 
  BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, FileText, 
  Printer, Send, Save, Plus, Trash2, Edit3, UserCheck, ShieldCheck, 
  Building2, MessageSquare, Star, ArrowRight, Eye, RefreshCw, ChevronDown, ChevronUp, Search, Filter
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
  const isStudent = currentUser.role === UserRole.STUDENT;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isLecturer = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true;
  const canVerify = isTrainer || isCoordinator || isLecturer;

  // Student placement information
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
  const [activeTab, setActiveTab] = useState<'my_logbook' | 'verification_queue'>('my_logbook');

  // Active weekly log state (for student or editor)
  const [currentWeekLog, setCurrentWeekLog] = useState<WeeklyLogbook | null>(null);

  // Review modal state (for Trainer/Supervisor)
  const [reviewingLogbook, setReviewingLogbook] = useState<WeeklyLogbook | null>(null);
  const [trainerComments, setTrainerComments] = useState('');
  const [trainerRating, setTrainerRating] = useState<'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan'>('cemerlang');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);

  // Filter state for coordinator / trainer list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');

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

    // Basic validation
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
      // First ensure it is saved
      const saved = await StorageService.saveWeeklyLogbook(currentWeekLog);
      
      // Then submit
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

  // Open Review Modal (Trainer/Coordinator)
  const handleOpenReview = (logbook: WeeklyLogbook) => {
    setReviewingLogbook(logbook);
    setTrainerComments(logbook.trainerComments || '');
    setTrainerRating(logbook.trainerRating || 'cemerlang');
    setRevisionNotes('');
    setIsRevisionMode(false);
  };

  // Confirm Verification
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

  // Filtered logbooks for Verification Queue
  const queueLogbooks = useMemo(() => {
    return logbooks.filter(l => {
      // If trainer, prioritize their company or verified items
      if (isTrainer) {
        const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
        const matchesComp = !trainerComp || (l.companyName && l.companyName.trim().toLowerCase().includes(trainerComp));
        const matchesSelf = l.verifiedByTrainerId === currentUser.id;
        if (!matchesComp && !matchesSelf) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          (l.studentName && l.studentName.toLowerCase().includes(q)) ||
          (l.studentMatric && l.studentMatric.toLowerCase().includes(q)) ||
          (l.companyName && l.companyName.toLowerCase().includes(q)) ||
          (`minggu ${l.weekNumber}`.includes(q));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && l.status !== statusFilter) {
        return false;
      }

      // Student filter
      if (studentFilter !== 'all' && l.studentId !== studentFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pending first, then by week
      if (a.status === 'submitted' && b.status !== 'submitted') return -1;
      if (b.status === 'submitted' && a.status !== 'submitted') return 1;
      return b.weekNumber - a.weekNumber;
    });
  }, [logbooks, isTrainer, currentUser, searchQuery, statusFilter, studentFilter]);

  // Stats for Queue
  const queueStats = useMemo(() => {
    const total = queueLogbooks.length;
    const pending = queueLogbooks.filter(l => l.status === 'submitted').length;
    const verified = queueLogbooks.filter(l => l.status === 'verified').length;
    const revision = queueLogbooks.filter(l => l.status === 'revision').length;
    return { total, pending, verified, revision };
  }, [queueLogbooks]);

  // Unique students in queue for filter dropdown
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <BookOpen size={24} />
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {t(language, 'logbookTitle')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {t(language, 'logbookDesc')}
          </p>
        </div>

        {/* View Toggle Tabs for Trainers / Coordinators / Lecturers */}
        {canVerify && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {isStudent && (
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
            )}
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
              {queueStats.pending > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {queueStats.pending}
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
                'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
                    {currentWeekLog.status === 'verified' ? <CheckCircle2 className="text-emerald-600" size={24} /> :
                     currentWeekLog.status === 'submitted' ? <Clock className="text-blue-600" size={24} /> :
                     currentWeekLog.status === 'revision' ? <AlertCircle className="text-amber-600" size={24} /> :
                     <Edit3 className="text-slate-600" size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {currentWeekLog.status === 'verified' ? (language === 'ms' ? 'Logbook Telah Disahkan Oleh Jurulatih Industri' : 'Logbook Verified by Industry Coach') :
                       currentWeekLog.status === 'submitted' ? (language === 'ms' ? 'Logbook Telah Dihantar - Menunggu Pengesahan Jurulatih Industri' : 'Submitted - Pending Coach Verification') :
                       currentWeekLog.status === 'revision' ? (language === 'ms' ? 'Pembetulan Diperlukan Oleh Jurulatih Industri' : 'Revision Required by Industry Coach') :
                       (language === 'ms' ? 'Draf Mingguan - Sedia untuk direkod setiap hari' : 'Weekly Draft - Ready to record daily')}
                    </h4>
                    <p className="text-xs opacity-90">
                      {currentWeekLog.status === 'verified' 
                        ? `${language === 'ms' ? 'Disahkan pada' : 'Verified on'} ${currentWeekLog.verifiedAt ? new Date(currentWeekLog.verifiedAt).toLocaleDateString() : '-'} ${language === 'ms' ? 'oleh' : 'by'} ${currentWeekLog.trainerName || 'Jurulatih Industri'}`
                        : currentWeekLog.status === 'submitted' 
                        ? (language === 'ms' ? 'Dihantar pada ' + (currentWeekLog.submittedAt ? new Date(currentWeekLog.submittedAt).toLocaleDateString() : '-') : 'Submitted')
                        : currentWeekLog.status === 'revision'
                        ? (language === 'ms' ? 'Nota Jurulatih: ' + (currentWeekLog.revisionNotes || 'Sila kemaskini maklumat tugasan.') : 'Revision requested.')
                        : (language === 'ms' ? 'Isi tugasan harian anda dan klik "Hantar Pengesahan Mingguan" pada akhir minggu.' : 'Fill daily tasks and click submit at week end.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handlePrintLogbook(currentWeekLog)}
                    className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Printer size={14} className="text-blue-600" />
                    <span>{language === 'ms' ? 'Muat Turun PDF' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Week Date Configuration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar size={16} className="text-blue-600" />
                  <span>{language === 'ms' ? 'Tetapan Tempoh Minggu ' + currentWeekLog.weekNumber : 'Week ' + currentWeekLog.weekNumber + ' Date Settings'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Tarikh Mula (Isnin)' : 'Start Date (Monday)'}
                    </label>
                    <input
                      type="date"
                      value={currentWeekLog.startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentWeekLog({ ...currentWeekLog, startDate: val });
                        handleAutoFillDates(val);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Tarikh Akhir (Jumaat/Sabtu)' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={currentWeekLog.endDate}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Jumlah Jam Seminggu' : 'Total Hours'}
                    </label>
                    <input
                      type="number"
                      value={currentWeekLog.totalHours || 40}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, totalHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="40"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Log Entries List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span>{language === 'ms' ? 'Rekod Aktiviti Harian' : 'Daily Activity Records'}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({currentWeekLog.entries.length} {language === 'ms' ? 'hari' : 'days'})
                    </span>
                  </h4>

                  <button
                    onClick={handleAddDay}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{language === 'ms' ? 'Tambah Hari' : 'Add Day'}</span>
                  </button>
                </div>

                {currentWeekLog.entries.map((entry, index) => (
                  <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
                    {/* Day Card Header */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <input
                            type="text"
                            value={entry.day}
                            onChange={(e) => handleUpdateEntry(entry.id, 'day', e.target.value)}
                            className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-28"
                            placeholder="Hari"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleUpdateEntry(entry.id, 'date', e.target.value)}
                            className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Time range */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                          <Clock size={12} className="text-slate-400" />
                          <input
                            type="text"
                            value={entry.startTime}
                            onChange={(e) => handleUpdateEntry(entry.id, 'startTime', e.target.value)}
                            className="w-12 text-center outline-none"
                            placeholder="08:30"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={entry.endTime}
                            onChange={(e) => handleUpdateEntry(entry.id, 'endTime', e.target.value)}
                            className="w-12 text-center outline-none"
                            placeholder="17:30"
                          />
                        </div>

                        {currentWeekLog.entries.length > 1 && (
                          <button
                            onClick={() => handleRemoveDay(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Padam Hari Ini"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Day Card Body */}
                    <div className="p-5 space-y-4">
                      {/* Department */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {language === 'ms' ? 'Bahagian / Jabatan / Seksyen Penempatan:' : 'Department / Section:'}
                        </label>
                        <input
                          type="text"
                          value={entry.department}
                          onChange={(e) => handleUpdateEntry(entry.id, 'department', e.target.value)}
                          placeholder="cth: Jabatan Operasi & Penyelenggaraan / Bahagian IT & Analisis Data"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Daily Activities & Tasks */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                          <span>{language === 'ms' ? 'Huraian Aktiviti & Tugasan Harian (Perlu Terperinci):' : 'Daily Tasks & Activities Description:'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {language === 'ms' ? 'Format bullet point atau perenggan' : 'Bullet points or paragraph'}
                          </span>
                        </label>
                        <textarea
                          rows={3}
                          value={entry.tasks}
                          onChange={(e) => handleUpdateEntry(entry.id, 'tasks', e.target.value)}
                          placeholder={language === 'ms' 
                            ? "- Melaksanakan taklimat pagi bersama jurutera tapak mengenai jadual kerja harian.\n- Menganalisis laporan kerosakan mesin dan menyediakan semakan data.\n- Membantu penyelia menguji sistem automasi baharu." 
                            : "- Attended daily briefing with site engineer.\n- Conducted equipment testing and recorded observations."}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Learning Outcomes & Competencies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            {language === 'ms' ? 'Hasil Pembelajaran & Kemahiran Diperoleh:' : 'Learning Outcomes & Skills Acquired:'}
                          </label>
                          <textarea
                            rows={2}
                            value={entry.learningOutcomes}
                            onChange={(e) => handleUpdateEntry(entry.id, 'learningOutcomes', e.target.value)}
                            placeholder={language === 'ms' ? "cth: Memahami prosedur keselamatan industri, kemahiran mengendali perisian ERP, komunikasi teknikal" : "e.g. Learned SOP for calibration, team communication"}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            {language === 'ms' ? 'Peralatan / Perisian / Sistem Digunakan:' : 'Tools, Software or Systems Used:'}
                          </label>
                          <input
                            type="text"
                            value={entry.toolsUsed || ''}
                            onChange={(e) => handleUpdateEntry(entry.id, 'toolsUsed', e.target.value)}
                            placeholder="cth: SAP, AutoCAD, Mesin CNC, Google Workspace"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                          />

                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            {language === 'ms' ? 'Catatan Tambahan (Isu / Halangan):' : 'Remarks / Additional Notes:'}
                          </label>
                          <input
                            type="text"
                            value={entry.remarks || ''}
                            onChange={(e) => handleUpdateEntry(entry.id, 'remarks', e.target.value)}
                            placeholder={language === 'ms' ? "Tiada isu / Masalah sistem diselesaikan bersama penyelia" : "None / Solved with supervisor"}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Reflection by Student */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span>{language === 'ms' ? 'Refleksi & Ringkasan Pembelajaran Mingguan Pelajar' : 'Student Weekly Reflection & Summary'}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'ms' 
                    ? 'Tuliskan ringkasan pengalaman anda sepanjang minggu ini, termasuk cabaran yang dihadapi, cara penyelesaian, dan kemajuan kemahiran profesional anda.' 
                    : 'Summarize your key accomplishments, challenges faced, problem solving, and professional development this week.'}
                </p>
                <textarea
                  rows={4}
                  value={currentWeekLog.weeklySummary}
                  onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, weeklySummary: e.target.value })}
                  placeholder={language === 'ms' 
                    ? "Sepanjang Minggu ini, saya berjaya menyesuaikan diri dengan sistem pengurusan inventori syarikat. Cabaran utama adalah memahami kod produk baharu, namun dengan bimbingan jurulatih industri Encik..., saya berjaya menguasainya dan menyiapkan tugasan tepat pada masanya." 
                    : "During this week, I learned..."}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Industry Coach Details Block */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <UserCheck size={16} className="text-blue-600" />
                    <span>{language === 'ms' ? 'Maklumat Jurulatih Industri (Penyelia di Syarikat)' : 'Industry Coach Information'}</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {language === 'ms' ? 'Penyelia yang mengesahkan logbook mingguan' : 'Endorsing supervisor'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Nama Jurulatih Industri' : 'Industry Coach Name'}
                    </label>
                    <input
                      type="text"
                      value={currentWeekLog.trainerName || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, trainerName: e.target.value })}
                      placeholder="cth: Ir. Ahmad bin Razali"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'Jawatan Jurulatih' : 'Coach Designation'}
                    </label>
                    <input
                      type="text"
                      value={currentWeekLog.trainerPosition || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, trainerPosition: e.target.value })}
                      placeholder="cth: Pengurus Operasi / Senior Engineer"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {language === 'ms' ? 'E-mel Jurulatih' : 'Coach Email'}
                    </label>
                    <input
                      type="email"
                      value={currentWeekLog.trainerEmail || ''}
                      onChange={(e) => setCurrentWeekLog({ ...currentWeekLog, trainerEmail: e.target.value })}
                      placeholder="coach@company.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Trainer feedback (if verified or revision) */}
                {currentWeekLog.status === 'verified' && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{language === 'ms' ? 'Ulasan Rasmi Jurulatih Industri:' : 'Industry Coach Official Review:'}</span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-1 italic">
                      "{currentWeekLog.trainerComments || 'Prestasi sangat baik dan memenuhi hasil pembelajaran.'}"
                    </p>
                    {currentWeekLog.trainerRating && (
                      <div className="mt-2 text-xs font-bold text-emerald-800">
                        Penilaian Prestasi: <span className="uppercase">{currentWeekLog.trainerRating}</span>
                      </div>
                    )}
                  </div>
                )}

                {currentWeekLog.status === 'revision' && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-800 mb-1">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span>{language === 'ms' ? 'Catatan Pembetulan Oleh Jurulatih Industri:' : 'Revision Requested by Coach:'}</span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 font-medium">
                      "{currentWeekLog.revisionNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} className="text-blue-600" />
                  <span>
                    {language === 'ms' 
                      ? 'Simpanan draf boleh dilakukan pada bila-bila masa. Hantar apabila minggu telah selesai.' 
                      : 'Save drafts anytime. Submit once the week ends.'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Menyimpan...' : (language === 'ms' ? 'Simpan Draf' : 'Save Draft')}</span>
                  </button>

                  <button
                    onClick={() => handlePrintLogbook(currentWeekLog)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <Printer size={16} />
                    <span>{language === 'ms' ? 'Cetak / Muat Turun (PDF)' : 'Print / Download (PDF)'}</span>
                  </button>

                  {currentWeekLog.status !== 'verified' && (
                    <button
                      onClick={handleSubmitWeekly}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={16} />
                      <span>{language === 'ms' ? 'Hantar Pengesahan Mingguan' : 'Submit Weekly Log'}</span>
                    </button>
                  )}
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
      {/* 2. VERIFICATION QUEUE: FOR INDUSTRY TRAINERS, COORDINATORS, & LECTURERS   */}
      {/* ========================================================================= */}
      {(!isStudent || activeTab === 'verification_queue') && (
        <div className="space-y-6">
          {/* Queue Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ms' ? 'Semua Logbook' : 'All Logbooks'}
              </span>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {queueStats.total}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/30">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} />
                {language === 'ms' ? 'Menunggu Pengesahan' : 'Pending Verification'}
              </span>
              <div className="text-3xl font-black text-blue-700 mt-1">
                {queueStats.pending}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} />
                {language === 'ms' ? 'Telah Disahkan' : 'Verified'}
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {queueStats.verified}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/30">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={12} />
                {language === 'ms' ? 'Perlu Pembetulan' : 'Needs Revision'}
              </span>
              <div className="text-3xl font-black text-amber-700 mt-1">
                {queueStats.revision}
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={language === 'ms' ? 'Cari nama pelajar, no. matrik, syarikat, atau minggu...' : 'Search student, matric, company...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="all">{language === 'ms' ? 'Semua Status' : 'All Statuses'}</option>
                <option value="submitted">{language === 'ms' ? '⏳ Menunggu Pengesahan' : 'Pending'}</option>
                <option value="verified">{language === 'ms' ? '✓ Telah Disahkan' : 'Verified'}</option>
                <option value="revision">{language === 'ms' ? '⚠️ Perlu Pembetulan' : 'Needs Revision'}</option>
                <option value="draft">{language === 'ms' ? 'Draf' : 'Draft'}</option>
              </select>

              {/* Student Filter */}
              {uniqueStudents.length > 0 && (
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none max-w-xs truncate"
                >
                  <option value="all">{language === 'ms' ? 'Semua Pelajar' : 'All Students'}</option>
                  {uniqueStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Pelajar & No. Matrik</th>
                    <th className="py-3.5 px-4">Syarikat Penempatan</th>
                    <th className="py-3.5 px-4">Minggu Latihan</th>
                    <th className="py-3.5 px-4">Entri Harian</th>
                    <th className="py-3.5 px-4">Status Pengesahan</th>
                    <th className="py-3.5 px-4">Tarikh Dihantar</th>
                    <th className="py-3.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueLogbooks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <UserCheck size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                        <p>{language === 'ms' ? 'Tiada logbook mingguan sepadan dengan carian anda.' : 'No weekly logbooks matching criteria.'}</p>
                      </td>
                    </tr>
                  ) : (
                    queueLogbooks.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-sm">{log.studentName}</div>
                          <div className="text-[11px] text-slate-500">{log.studentMatric} • {log.studentProgram}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700">{log.companyName}</div>
                          <div className="text-[10px] text-slate-400">{log.companyAddress || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                            Minggu {log.weekNumber}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {log.startDate && log.endDate ? `${log.startDate} hingga ${log.endDate}` : '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700">
                            {log.entries?.length || 0} hari bekerja
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {log.totalHours || 40} jam
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            log.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            log.status === 'revision' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.status === 'verified' && '✓'}
                            {log.status === 'verified' ? 'Disahkan' :
                             log.status === 'submitted' ? 'Menunggu Pengesahan' :
                             log.status === 'revision' ? 'Perlu Pembetulan' :
                             'Draf'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReview(log)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                                log.status === 'submitted'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Eye size={14} />
                              <span>{log.status === 'submitted' ? (language === 'ms' ? 'Semak & Sahkan' : 'Review & Verify') : (language === 'ms' ? 'Semak Log' : 'Review')}</span>
                            </button>

                            <button
                              onClick={() => handlePrintLogbook(log)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl"
                              title="Cetak PDF"
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
      {/* 3. REVIEW & VERIFICATION MODAL                                            */}
      {/* ========================================================================= */}
      {reviewingLogbook && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Pengesahan Log Latihan Harian' : 'Daily Training Log Verification'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {reviewingLogbook.studentName} ({reviewingLogbook.studentMatric})
                </h3>
                <p className="text-xs text-blue-200">
                  {reviewingLogbook.companyName} • Minggu {reviewingLogbook.weekNumber} ({reviewingLogbook.startDate} hingga {reviewingLogbook.endDate})
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

              {/* Verification Form Section */}
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span>{language === 'ms' ? 'Tindakan Pengesahan Jurulatih Industri' : 'Industry Coach Verification Action'}</span>
                </h4>

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
                          { val: 'memuaskan', label: 'Memuaskan (Satisfactory)' },
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
                {!isRevisionMode ? (
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
                      <span>{isSaving ? 'Menyahkan...' : (language === 'ms' ? 'Sahkan Log Mingguan' : 'Verify Weekly Log')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRevisionMode(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      {language === 'ms' ? 'Kembali ke Pengesahan' : 'Back to Verify'}
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
