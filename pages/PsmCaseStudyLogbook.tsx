import React, { useState, useEffect, useMemo } from 'react';
import { User, Application, UserRole, PsmCaseStudyWeeklyLog, PsmLogbookStatus } from '../types';
import { StorageService } from '../services/storage';
import { 
  BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, FileText, 
  Printer, Send, Save, UserCheck, ShieldCheck, 
  Building2, MessageSquare, Star, ArrowRight, Eye, RefreshCw, ChevronDown, ChevronUp, Search, Filter,
  Sparkles, Award, ExternalLink, HelpCircle, User as UserIcon, Check, Layers, BarChart3, Download,
  CheckCircle, ArrowUpRight
} from 'lucide-react';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface PsmCaseStudyLogbookProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  language: Language;
  onNavigate?: (view: string) => void;
}

// 5 PSM 2 Milestones across 20 Weeks (Starting 28 Sept 2026)
export const PSM2_MILESTONES = [
  {
    phase: 'Milestone 1 (M1 - M4)',
    title: 'Pengenalan & Definisi Masalah Industri',
    titleEn: 'Introduction & Industrial Problem Formulation',
    weeks: [1, 2, 3, 4],
    description: 'Pemerhatian lapangan, temu bual awal, pengenalpastian punca masalah dan skop kajian teknousahawanan di syarikat WBL.'
  },
  {
    phase: 'Milestone 2 (M5 - M8)',
    title: 'Kajian Literatur & Kerangka Konseptual Lapangan',
    titleEn: 'Literature Review & Conceptual Framework',
    weeks: [5, 6, 7, 8],
    description: 'Sintesis teori akademik berkaitan operasi, analitik, dan perbandingan amalan terbaik industri (benchmarking).'
  },
  {
    phase: 'Milestone 3 (M9 - M13)',
    title: 'Metodologi Kajian & Analisis Data Lapangan',
    titleEn: 'Research Methodology & Field Data Analysis',
    weeks: [9, 10, 11, 12, 13],
    description: 'Pengumpulan data primer/sekunder, instrumen kajian, analisis kuantitatif/kualitatif dan pengesahan dapatan.'
  },
  {
    phase: 'Milestone 4 (M14 - M17)',
    title: 'Reka Bentuk Solusi Teknousahawanan & Validasi',
    titleEn: 'Technopreneur Solution Engineering & Validation',
    weeks: [14, 15, 16, 17],
    description: 'Pembangunan prototaip / model sistem perniagaan, uji cuba keberkesanan dan analisis impak kos serta kecekapan.'
  },
  {
    phase: 'Milestone 5 (M18 - M20)',
    title: 'Penulisan Laporan Akhir, Pembentangan & Serahan',
    titleEn: 'Final Thesis Writing, Presentation & Submission',
    weeks: [18, 19, 20],
    description: 'Penyelarasan laporan akhir PSM 2, sesi viva pembentangan teknousahawanan dan serahan dokumentasi rasmi.'
  }
];

export const getMilestoneForWeek = (weekNum: number) => {
  const found = PSM2_MILESTONES.find(m => m.weeks.includes(weekNum));
  return found || PSM2_MILESTONES[0];
};

export const PsmCaseStudyLogbook: React.FC<PsmCaseStudyLogbookProps> = ({
  currentUser,
  applications,
  users,
  language,
  onNavigate
}) => {
  // Roles
  const isStudent = currentUser.role === UserRole.STUDENT;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isSupervisor = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true || (currentUser as any).is_admin === true;

  // Active Tab
  // Students default to 'my_log'
  // Supervisors / Trainers / Coordinators default to 'monitoring' or 'review_queue'
  const [activeTab, setActiveTab] = useState<'my_log' | 'review_queue' | 'monitoring'>(
    isStudent ? 'my_log' : (isCoordinator ? 'monitoring' : 'review_queue')
  );

  // Global PSM logs from Storage
  const [psmLogs, setPsmLogs] = useState<PsmCaseStudyWeeklyLog[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Selected student for supervisor / trainer / coordinator inspection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Filters for coordinator & reviewer
  const [filterIntake, setFilterIntake] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active form data for student log entry
  const [formData, setFormData] = useState<Partial<PsmCaseStudyWeeklyLog>>({
    weekNumber: 1,
    caseTitle: '',
    milestonePhase: 'Milestone 1 (M1 - M4)',
    problemStatement: '',
    methodologyActions: '',
    keyFindings: '',
    technopreneurSolution: '',
    consultationHours: 2,
    evidenceUrl: '',
    studentReflection: '',
    startDate: '2026-09-28',
    endDate: '2026-10-02'
  });

  // Review modal state
  const [inspectingLog, setInspectingLog] = useState<PsmCaseStudyWeeklyLog | null>(null);
  const [printLog, setPrintLog] = useState<PsmCaseStudyWeeklyLog | null>(null);

  // Review inputs
  const [reviewComments, setReviewComments] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<'cemerlang' | 'baik' | 'memuaskan' | 'perlu_bimbingan'>('cemerlang');
  const [reviewStatus, setReviewStatus] = useState<'verified' | 'revision'>('verified');

  // Load all logs
  const loadLogs = () => {
    const data = StorageService.getPsmCaseStudyLogs();
    setPsmLogs(data);
  };

  useEffect(() => {
    loadLogs();
    const unsub = StorageService.subscribe(loadLogs);
    return () => unsub();
  }, []);

  // Student placement details
  const myPlacementApp = useMemo(() => {
    if (!isStudent) return null;
    return applications.find(a => 
      (a.student_id === currentUser.matric_no || a.created_by === currentUser.username) &&
      (a.application_status === 'Diluluskan' || a.student_preferred)
    ) || applications.find(a => 
      a.student_id === currentUser.matric_no || a.created_by === currentUser.username
    );
  }, [applications, currentUser, isStudent]);

  // List of active students in the system
  const allStudents = useMemo(() => {
    return users.filter(u => u.role === UserRole.STUDENT && u.is_active !== false);
  }, [users]);

  // For Supervisor: find supervised students
  const supervisedStudents = useMemo(() => {
    if (!isSupervisor) return [];
    return allStudents.filter(s => {
      // Check if student's assigned supervisor matches currentUser
      const matchesApp = applications.some(a => 
        (a.student_id === s.matric_no || a.created_by === s.username) &&
        (a.faculty_supervisor_name === currentUser.name || a.faculty_supervisor_id === currentUser.id)
      );
      return matchesApp || s.company_affiliation === currentUser.name;
    });
  }, [allStudents, applications, currentUser, isSupervisor]);

  // For Trainer: find students in the same company
  const companyStudents = useMemo(() => {
    if (!isTrainer) return [];
    const trainerComp = currentUser.company_affiliation?.toLowerCase().trim() || '';
    if (!trainerComp) return allStudents;
    return allStudents.filter(s => {
      const studentComp = s.company_affiliation?.toLowerCase().trim() || '';
      const appMatch = applications.some(a => 
        (a.student_id === s.matric_no || a.created_by === s.username) &&
        a.company_name?.toLowerCase().trim().includes(trainerComp)
      );
      return studentComp.includes(trainerComp) || appMatch;
    });
  }, [allStudents, applications, currentUser, isTrainer]);

  // Initialize selectedStudentId on load for reviewers
  useEffect(() => {
    if (!selectedStudentId) {
      if (isSupervisor && supervisedStudents.length > 0) {
        setSelectedStudentId(supervisedStudents[0].id);
      } else if (isTrainer && companyStudents.length > 0) {
        setSelectedStudentId(companyStudents[0].id);
      } else if (allStudents.length > 0) {
        setSelectedStudentId(allStudents[0].id);
      }
    }
  }, [selectedStudentId, isSupervisor, supervisedStudents, isTrainer, companyStudents, allStudents]);

  // When selected student or week changes (in student view or inspector)
  useEffect(() => {
    if (isStudent) {
      const existing = psmLogs.find(l => l.studentId === currentUser.id && l.weekNumber === selectedWeek);
      const milestone = getMilestoneForWeek(selectedWeek);
      
      // Calculate start and end date for that week (20 weeks starting Monday 28 Sept 2026)
      const baseStart = new Date('2026-09-28T00:00:00');
      const startOfWeek = new Date(baseStart.getTime() + (selectedWeek - 1) * 7 * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfWeek.getTime() + 4 * 24 * 60 * 60 * 1000); // Friday

      const sDateStr = startOfWeek.toISOString().split('T')[0];
      const eDateStr = endOfWeek.toISOString().split('T')[0];

      if (existing) {
        setFormData(existing);
      } else {
        setFormData({
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentMatric: currentUser.matric_no || '',
          studentProgram: currentUser.program || 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
          intake: currentUser.intake || 'Ambilan 1',
          companyName: myPlacementApp?.company_name || currentUser.company_affiliation || 'Syarikat Rakan WBL',
          weekNumber: selectedWeek,
          startDate: sDateStr,
          endDate: eDateStr,
          caseTitle: '',
          milestonePhase: `${milestone.phase}: ${milestone.title}`,
          problemStatement: '',
          methodologyActions: '',
          keyFindings: '',
          technopreneurSolution: '',
          consultationHours: 2,
          evidenceUrl: '',
          studentReflection: '',
          status: 'draft'
        });
      }
    }
  }, [isStudent, selectedWeek, currentUser, psmLogs, myPlacementApp]);

  // Find current student's existing log for selected week
  const currentStudentActiveLog = useMemo(() => {
    const targetStudentId = isStudent ? currentUser.id : selectedStudentId;
    return psmLogs.find(l => l.studentId === targetStudentId && l.weekNumber === selectedWeek);
  }, [psmLogs, isStudent, currentUser, selectedStudentId, selectedWeek]);

  // Save student draft
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const milestone = getMilestoneForWeek(selectedWeek);
      const payload: Partial<PsmCaseStudyWeeklyLog> & { studentId: string; weekNumber: number } = {
        ...formData,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentMatric: currentUser.matric_no || '',
        studentProgram: currentUser.program || 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
        intake: currentUser.intake || 'Ambilan 1',
        companyName: myPlacementApp?.company_name || currentUser.company_affiliation || 'Syarikat Rakan WBL',
        weekNumber: selectedWeek,
        milestonePhase: formData.milestonePhase || `${milestone.phase}: ${milestone.title}`,
        status: (formData.status === 'revision' ? 'revision' : 'draft') as PsmLogbookStatus
      };

      const saved = await StorageService.savePsmCaseStudyLog(payload);
      setFormData(saved);
      toast.success(language === 'ms' ? `Draf Case Study Minggu ${selectedWeek} disimpan!` : `Draft Case Study Week ${selectedWeek} saved!`);
    } catch (err: any) {
      toast.error(err.message || 'Ralat menyimpan draf');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit student logbook
  const handleSubmitLogbook = async () => {
    if (!formData.caseTitle?.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan Tajuk / Tema Kajian Kes!' : 'Please enter Case Study Title!');
      return;
    }
    if (!formData.problemStatement?.trim()) {
      toast.error(language === 'ms' ? 'Sila nyatakan Isu / Masalah Lapangan Industri!' : 'Please describe the Industrial Problem Statement!');
      return;
    }
    if (!formData.keyFindings?.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan Dapatan Utama / Data Kajian!' : 'Please input Key Findings / Data!');
      return;
    }
    if (!formData.technopreneurSolution?.trim()) {
      toast.error(language === 'ms' ? 'Sila cadangkan Solusi Teknousahawanan & Impak Industri!' : 'Please provide Technopreneur Solution & Industry Impact!');
      return;
    }

    try {
      setIsSaving(true);
      // 1. Save content first
      const milestone = getMilestoneForWeek(selectedWeek);
      const saved = await StorageService.savePsmCaseStudyLog({
        ...formData,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentMatric: currentUser.matric_no || '',
        studentProgram: currentUser.program || 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
        intake: currentUser.intake || 'Ambilan 1',
        companyName: myPlacementApp?.company_name || currentUser.company_affiliation || 'Syarikat Rakan WBL',
        weekNumber: selectedWeek,
        milestonePhase: formData.milestonePhase || `${milestone.phase}: ${milestone.title}`,
      });

      // 2. Submit to notify supervisor and trainer
      const submitted = await StorageService.submitPsmCaseStudyLog(saved.id);
      setFormData(submitted);
      toast.success(language === 'ms' 
        ? `Buku Log Case Study PSM 2 Minggu ${selectedWeek} berjaya dihantar untuk semakan Penyelia & Jurulatih!` 
        : `Week ${selectedWeek} PSM 2 Case Study submitted for Supervisor & Coach review!`);
    } catch (err: any) {
      toast.error(err.message || 'Ralat menghantar buku log');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Review by Trainer or Supervisor
  const handleSubmitReview = async () => {
    if (!inspectingLog) return;
    if (!reviewComments.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan ulasan semakan!' : 'Please enter review comments!');
      return;
    }

    try {
      setIsSaving(true);
      if (isTrainer) {
        await StorageService.reviewPsmCaseStudyByTrainer(inspectingLog.id, {
          trainerId: currentUser.id,
          trainerName: currentUser.name,
          trainerCompany: currentUser.company_affiliation || inspectingLog.companyName,
          trainerPosition: (currentUser as any).position || 'Jurulatih Industri WBL',
          trainerComments: reviewComments,
          trainerStatus: reviewStatus,
          trainerRating: reviewRating
        });
        toast.success(language === 'ms' 
          ? (reviewStatus === 'verified' ? 'Pengesahan Jurulatih Industri berjaya direkodkan!' : 'Permintaan pembetulan dihantar kepada pelajar!')
          : (reviewStatus === 'verified' ? 'Industry Coach verification recorded!' : 'Revision request sent to student!'));
      } else if (isSupervisor || isCoordinator) {
        await StorageService.reviewPsmCaseStudyBySupervisor(inspectingLog.id, {
          supervisorId: currentUser.id,
          supervisorName: currentUser.name,
          supervisorStaffId: (currentUser as any).staff_id || 'STF-UTEM-WBL',
          supervisorComments: reviewComments,
          supervisorStatus: reviewStatus,
          supervisorRating: reviewRating
        });
        toast.success(language === 'ms' 
          ? (reviewStatus === 'verified' ? 'Bimbingan akademik Penyelia Fakulti berjaya disahkan!' : 'Catatan pembetulan dihantar kepada pelajar!')
          : (reviewStatus === 'verified' ? 'Supervisor academic review verified!' : 'Revision notes sent to student!'));
      }

      setInspectingLog(null);
      setReviewComments('');
    } catch (e: any) {
      toast.error(e.message || 'Ralat menyimpan semakan');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Logs for Coordinator Monitoring Table
  const filteredMonitoringLogs = useMemo(() => {
    return psmLogs.filter(log => {
      // Intake filter
      if (filterIntake !== 'all' && log.intake !== filterIntake) {
        return false;
      }
      // Week filter
      if (filterWeek !== 'all' && log.weekNumber !== Number(filterWeek)) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'completed' && log.status !== 'completed') return false;
        if (filterStatus === 'pending_trainer' && log.trainerStatus !== 'pending' && log.status !== 'submitted') return false;
        if (filterStatus === 'pending_supervisor' && (log.supervisorStatus !== 'pending' || log.status === 'draft')) return false;
        if (filterStatus === 'revision' && log.status !== 'revision') return false;
        if (filterStatus === 'draft' && log.status !== 'draft') return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = log.studentName?.toLowerCase() || '';
        const mMatric = log.studentMatric?.toLowerCase() || '';
        const mCompany = log.companyName?.toLowerCase() || '';
        const mTitle = log.caseTitle?.toLowerCase() || '';
        const mSup = log.supervisorName?.toLowerCase() || '';
        return mName.includes(q) || mMatric.includes(q) || mCompany.includes(q) || mTitle.includes(q) || mSup.includes(q);
      }
      return true;
    });
  }, [psmLogs, filterIntake, filterWeek, filterStatus, searchQuery]);

  // Overall Statistics for Coordinator
  const stats = useMemo(() => {
    // Total student count in target intake or all
    const targetStudents = filterIntake === 'all' 
      ? allStudents 
      : allStudents.filter(s => s.intake === filterIntake);
    
    const totalExpectedLogs = targetStudents.length * 20; // 20 weeks each
    const intakeLogs = filterIntake === 'all' 
      ? psmLogs 
      : psmLogs.filter(l => l.intake === filterIntake);

    const submittedCount = intakeLogs.filter(l => l.status !== 'draft').length;
    const completedCount = intakeLogs.filter(l => l.status === 'completed').length;
    const verifiedByTrainerCount = intakeLogs.filter(l => l.trainerStatus === 'verified').length;
    const verifiedBySupervisorCount = intakeLogs.filter(l => l.supervisorStatus === 'verified').length;
    const revisionCount = intakeLogs.filter(l => l.status === 'revision').length;

    const completionRate = totalExpectedLogs > 0 ? Math.round((submittedCount / totalExpectedLogs) * 100) : 0;
    const trainerVerifiedRate = submittedCount > 0 ? Math.round((verifiedByTrainerCount / submittedCount) * 100) : 0;
    const supervisorVerifiedRate = submittedCount > 0 ? Math.round((verifiedBySupervisorCount / submittedCount) * 100) : 0;

    return {
      studentCount: targetStudents.length,
      totalEntries: intakeLogs.length,
      submittedCount,
      completedCount,
      verifiedByTrainerCount,
      verifiedBySupervisorCount,
      revisionCount,
      completionRate,
      trainerVerifiedRate,
      supervisorVerifiedRate
    };
  }, [allStudents, psmLogs, filterIntake]);

  // Status Badge Helper
  const renderStatusBadge = (status: PsmLogbookStatus, trainerSt?: string, supSt?: string) => {
    if (status === 'completed' || (trainerSt === 'verified' && supSt === 'verified')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>{language === 'ms' ? 'Selesai (Kedua-dua Semakan)' : 'Completed (Both Verified)'}</span>
        </span>
      );
    }
    if (status === 'revision') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
          <AlertCircle size={12} className="text-amber-600" />
          <span>{language === 'ms' ? 'Perlu Pembetulan' : 'Needs Revision'}</span>
        </span>
      );
    }
    if (status === 'reviewed_by_trainer' || trainerSt === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
          <Check size={12} className="text-blue-600" />
          <span>{language === 'ms' ? 'Disahkan Jurulatih • Tunggu Penyelia' : 'Trainer Verified • Pending Supervisor'}</span>
        </span>
      );
    }
    if (status === 'reviewed_by_supervisor' || supSt === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
          <Check size={12} className="text-purple-600" />
          <span>{language === 'ms' ? 'Disahkan Penyelia • Tunggu Jurulatih' : 'Supervisor Verified • Pending Trainer'}</span>
        </span>
      );
    }
    if (status === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
          <Clock size={12} className="text-sky-600" />
          <span>{language === 'ms' ? 'Dihantar • Menunggu Semakan' : 'Submitted • Pending Review'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <FileText size={12} />
        <span>{language === 'ms' ? 'Draf' : 'Draft'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP HEADER BANNER: BUKU LOG CASE STUDY PSM 2 (20 MINGGU)                  */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs">
                <Sparkles size={12} className="text-slate-900" />
                <span>PROJEK SARJANA MUDA II (PSM 2) • BTMU 4084 / BMMT 4994</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/20">
                20 Minggu Latihan Industri &amp; Kajian Kes Lapangan
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Bermula 28 September 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'ms' ? 'Buku Log Mingguan Case Study PSM 2' : 'Weekly PSM 2 Case Study Logbook'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-3xl leading-relaxed">
              {language === 'ms'
                ? 'Platform pengisian refleksi mingguan dan pemetaan masalah industri oleh pelajar. Disemak dan dinilai secara dwi-pengesahan oleh Penyelia Fakulti (Bimbingan Akademik) dan Jurulatih Industri (Validasi Praktikal Lapangan), serta dipantau oleh Penyelaras WBL.'
                : 'Weekly case study recording platform for WBL students. Dual-endorsed by Faculty Supervisors (Academic Mentoring) and Industry Coaches (Practical Validation), monitored by WBL Coordinators.'}
            </p>
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 shrink-0">
            {isCoordinator && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
                <span className="text-[10px] font-bold uppercase text-blue-200 block">Status Pemantauan Kohort</span>
                <span className="text-lg font-black text-white">{stats.totalEntries} Rekod</span>
                <span className="text-[10px] text-emerald-300 font-bold ml-2">({stats.completionRate}% Pengisian)</span>
              </div>
            )}
            {isStudent && (
              <button
                onClick={() => {
                  if (currentStudentActiveLog) {
                    setPrintLog(currentStudentActiveLog);
                  } else {
                    toast.error(language === 'ms' ? 'Sila simpan logbook minggu ini terlebih dahulu.' : 'Please save this week log first.');
                  }
                }}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 text-white shadow-xs"
              >
                <Printer size={15} />
                <span>{language === 'ms' ? 'Cetak Format Rasmi PSM 2' : 'Print Official PSM 2 Format'}</span>
              </button>
            )}
          </div>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/10">
            {/* Tab 1: Logbook Pengisian Pelajar */}
            {(isStudent || isCoordinator || isSupervisor || isTrainer) && (
              <button
                type="button"
                onClick={() => setActiveTab('my_log')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'my_log'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen size={14} />
                <span>{isStudent ? (language === 'ms' ? 'Log Mingguan Saya' : 'My Weekly Log') : (language === 'ms' ? 'Borang & Paparan Pengisian' : 'Log Entry Form')}</span>
              </button>
            )}

            {/* Tab 2: Semakan & Pengesahan (Penyelia / Jurulatih) */}
            {(isSupervisor || isTrainer || isCoordinator) && (
              <button
                type="button"
                onClick={() => setActiveTab('review_queue')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'review_queue'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck size={14} />
                <span>
                  {isSupervisor 
                    ? (language === 'ms' ? 'Semakan Penyelia Fakulti' : 'Supervisor Reviews')
                    : isTrainer 
                    ? (language === 'ms' ? 'Pengesahan Jurulatih Industri' : 'Trainer Verifications')
                    : (language === 'ms' ? 'Pusat Semakan Pentaksir' : 'Reviewer Queue')}
                </span>
                {stats.revisionCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {stats.revisionCount}
                  </span>
                )}
              </button>
            )}

            {/* Tab 3: Pemantauan Penyelaras (Coordinator Oversight Hub) */}
            {(isCoordinator || isSupervisor) && (
              <button
                type="button"
                onClick={() => setActiveTab('monitoring')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  activeTab === 'monitoring'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 size={14} />
                <span>{language === 'ms' ? 'Papan Pemantauan Penyelaras' : 'Coordinator Monitoring'}</span>
              </button>
            )}
          </div>

          {/* Quick link back to Daily Logbook or Dashboard */}
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dailyLogbook')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Clock size={13} />
                <span>{language === 'ms' ? 'Buka Log Harian (Operasi)' : 'Open Daily Logbook'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 20-WEEK ROADMAP & MILESTONE TIMELINE BAR                               */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-blue-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {language === 'ms' ? 'Garis Masa 20 Minggu Kajian Kes PSM 2 (28 Sept 2026 - 12 Feb 2027)' : '20-Week PSM 2 Case Study Timeline'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ms' 
                ? 'Pilih minggu untuk mengisi kajian kes, melihat semakan penyelia fakulti dan jurulatih industri.' 
                : 'Select week to fill or inspect case study review and dual-verification.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-500">
              {language === 'ms' ? 'Minggu Dipilih:' : 'Selected Week:'}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-black">
              {language === 'ms' ? 'Minggu' : 'Week'} {selectedWeek} / 20
            </span>
          </div>
        </div>

        {/* 5 Milestone Phase Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {PSM2_MILESTONES.map((m, idx) => {
            const isMilestoneActive = m.weeks.includes(selectedWeek);
            return (
              <div 
                key={m.phase}
                className={`p-2.5 rounded-2xl border transition-all text-left ${
                  isMilestoneActive 
                    ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300' 
                    : 'bg-slate-50 border-slate-200/70 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span className={isMilestoneActive ? 'text-blue-700' : 'text-slate-500'}>
                    Fasa {idx + 1}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    isMilestoneActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    M{m.weeks[0]} - M{m.weeks[m.weeks.length - 1]}
                  </span>
                </div>
                <h4 className={`text-xs font-bold line-clamp-1 mt-1 ${isMilestoneActive ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                  {m.title}
                </h4>
              </div>
            );
          })}
        </div>

        {/* 20 Week Interactive Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((weekNum) => {
            const isSelected = selectedWeek === weekNum;
            const targetStudentId = isStudent ? currentUser.id : selectedStudentId;
            const logForWeek = psmLogs.find(l => l.studentId === targetStudentId && l.weekNumber === weekNum);
            const status = logForWeek ? logForWeek.status : 'empty';

            return (
              <button
                key={weekNum}
                type="button"
                onClick={() => setSelectedWeek(weekNum)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center min-w-[76px] border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono">M{weekNum}</span>
                <span className={`text-[9px] mt-1 font-semibold px-1.5 py-0.2 rounded-full ${
                  status === 'completed' ? (isSelected ? 'bg-emerald-300 text-slate-950 font-black' : 'bg-emerald-100 text-emerald-800') :
                  status === 'reviewed_by_trainer' ? (isSelected ? 'bg-blue-300 text-slate-950 font-black' : 'bg-blue-100 text-blue-700') :
                  status === 'reviewed_by_supervisor' ? (isSelected ? 'bg-purple-300 text-slate-950 font-black' : 'bg-purple-100 text-purple-700') :
                  status === 'submitted' ? (isSelected ? 'bg-sky-300 text-slate-950 font-black' : 'bg-sky-100 text-sky-800') :
                  status === 'revision' ? (isSelected ? 'bg-amber-300 text-slate-950 font-black' : 'bg-amber-100 text-amber-800') :
                  status === 'draft' ? (isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600') :
                  (isSelected ? 'bg-blue-700 text-blue-200' : 'text-slate-300')
                }`}>
                  {status === 'completed' ? '✓ Selesai' :
                   status === 'reviewed_by_trainer' ? 'Jurulatih' :
                   status === 'reviewed_by_supervisor' ? 'Penyelia' :
                   status === 'submitted' ? 'Dihantar' :
                   status === 'revision' ? 'Baiki' :
                   status === 'draft' ? 'Draf' : 'Kosong'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY LOG / STUDENT LOGBOOK ENTRY & WORKSPACE                         */}
      {/* ========================================================================= */}
      {activeTab === 'my_log' && (
        <div className="space-y-6">
          {/* If reviewer (supervisor/trainer/coordinator) is viewing Tab 1, show student selector */}
          {!isStudent && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-blue-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {language === 'ms' ? 'Pilih Pelajar Untuk Dipaparkan:' : 'Select Student to View:'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {(isSupervisor ? supervisedStudents : isTrainer ? companyStudents : allStudents).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.matric_no || 'Tiada Matrik'}) - {s.company_affiliation || 'Syarikat WBL'} [{s.intake || 'Ambilan 1'}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Student Case Study Form & Submission Details */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header / Status Banner of selected week */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
                    Minggu {selectedWeek} / 20
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {formData.startDate} hingga {formData.endDate}
                  </span>
                  {renderStatusBadge(
                    (currentStudentActiveLog?.status || formData.status || 'draft') as PsmLogbookStatus,
                    currentStudentActiveLog?.trainerStatus,
                    currentStudentActiveLog?.supervisorStatus
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {formData.milestonePhase || `Milestone ${getMilestoneForWeek(selectedWeek).phase}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {getMilestoneForWeek(selectedWeek).description}
                </p>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2">
                {currentStudentActiveLog && (
                  <button
                    type="button"
                    onClick={() => setPrintLog(currentStudentActiveLog)}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer size={14} className="text-slate-600" />
                    <span>{language === 'ms' ? 'Cetak Format UTeM' : 'Print UTeM Format'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Revision Alert Banner if Revision was requested */}
            {currentStudentActiveLog?.status === 'revision' && (
              <div className="m-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs text-amber-800 uppercase tracking-wider">
                  <AlertCircle size={15} className="text-amber-600" />
                  <span>{language === 'ms' ? 'Perhatian: Pembetulan Diperlukan Oleh Penilai' : 'Attention: Revision Requested'}</span>
                </div>
                <p className="text-xs font-semibold">
                  {currentStudentActiveLog.revisionNotes || 'Sila kemas kini butiran dapatan kajian mengikut cadangan penyelia fakulti / jurulatih industri.'}
                </p>
              </div>
            )}

            {/* DUAL ENDORSEMENT STAMPS (JURULATIH INDUSTRI & PENYELIA FAKULTI) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
              {/* Box 1: Semakan & Cop Jurulatih Industri */}
              <div className={`p-4 rounded-2xl border transition-all ${
                currentStudentActiveLog?.trainerStatus === 'verified'
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : currentStudentActiveLog?.trainerStatus === 'revision'
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-600" />
                    <span>Jurulatih Industri (Industry Coach)</span>
                  </span>
                  {currentStudentActiveLog?.trainerStatus === 'verified' ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle size={10} /> Disahkan
                    </span>
                  ) : currentStudentActiveLog?.trainerStatus === 'revision' ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Perlu Baiki
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                      Menunggu Semakan
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">
                    {currentStudentActiveLog?.trainerName || (isStudent ? 'Akan disemak oleh Jurulatih Syarikat' : 'Belum disahkan')}
                  </div>
                  {currentStudentActiveLog?.trainerCompany && (
                    <div className="text-[11px] text-slate-500">
                      {currentStudentActiveLog.trainerPosition || 'Jurulatih Industri'} • {currentStudentActiveLog.trainerCompany}
                    </div>
                  )}
                  {currentStudentActiveLog?.trainerComments && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic text-[11px]">
                      "{currentStudentActiveLog.trainerComments}"
                    </div>
                  )}
                  {currentStudentActiveLog?.trainerReviewedAt && (
                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                      Tarikh Pengesahan: {new Date(currentStudentActiveLog.trainerReviewedAt).toLocaleDateString('ms-MY')}
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Semakan & Cop Penyelia Fakulti UTeM */}
              <div className={`p-4 rounded-2xl border transition-all ${
                currentStudentActiveLog?.supervisorStatus === 'verified'
                  ? 'bg-purple-50/60 border-purple-300'
                  : currentStudentActiveLog?.supervisorStatus === 'revision'
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-purple-600" />
                    <span>Penyelia Fakulti (Faculty Supervisor)</span>
                  </span>
                  {currentStudentActiveLog?.supervisorStatus === 'verified' ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                      <CheckCircle size={10} /> Disahkan
                    </span>
                  ) : currentStudentActiveLog?.supervisorStatus === 'revision' ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Perlu Baiki
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                      Menunggu Bimbingan
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">
                    {currentStudentActiveLog?.supervisorName || (isStudent ? 'Akan disemak oleh Penyelia Fakulti' : 'Belum disahkan')}
                  </div>
                  {currentStudentActiveLog?.supervisorStaffId && (
                    <div className="text-[11px] text-slate-500">
                      Pensyarah Pembimbing PSM 2 • {currentStudentActiveLog.supervisorStaffId}
                    </div>
                  )}
                  {currentStudentActiveLog?.supervisorComments && (
                    <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic text-[11px]">
                      "{currentStudentActiveLog.supervisorComments}"
                    </div>
                  )}
                  {currentStudentActiveLog?.supervisorReviewedAt && (
                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                      Tarikh Bimbingan: {new Date(currentStudentActiveLog.supervisorReviewedAt).toLocaleDateString('ms-MY')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORM FIELDS FOR CASE STUDY CONTENT */}
            <div className="p-6 space-y-5">
              {/* Field 1: Tajuk / Tema Kajian Kes Minggu Ini */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  1. Tajuk / Tema Kajian Kes Minggu Ini <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                  value={formData.caseTitle || ''}
                  onChange={(e) => setFormData({ ...formData, caseTitle: e.target.value })}
                  placeholder="Contoh: Analisis Masa Henti Mesin &amp; Pemetaan Aliran Kerja Sistem Pemprosesan Kitaran Industri"
                  className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Field 2 & 3: Isu / Masalah Lapangan Industri & Kaedah / Tindakan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    2. Isu / Masalah Lapangan Industri yang Dikaji <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                    value={formData.problemStatement || ''}
                    onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                    placeholder="Nyatakan masalah sebenar di tempat kerja, ketidakcekapan proses, kekangan masa, kos atau jurang teknologi..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    3. Kaedah / Tindakan Lapangan / Temubual / Pemerhatian <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                    value={formData.methodologyActions || ''}
                    onChange={(e) => setFormData({ ...formData, methodologyActions: e.target.value })}
                    placeholder="Huraikan langkah yang diambil minggu ini: sesi pemerhatian shif operasi, temubual bersama pengurus teknikal, audit dokumen..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Field 4 & 5: Dapatan Utama / Data & Solusi Teknousahawanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    4. Dapatan Utama / Data / Bukti Kajian Kes Minggu Ini <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                    value={formData.keyFindings || ''}
                    onChange={(e) => setFormData({ ...formData, keyFindings: e.target.value })}
                    placeholder="Data metrik, peratusan kelewatan, bukti log operasi, jadual perbandingan atau output analisa yang diperoleh..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    5. Cadangan Solusi Teknousahawanan &amp; Impak Industri <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                    value={formData.technopreneurSolution || ''}
                    onChange={(e) => setFormData({ ...formData, technopreneurSolution: e.target.value })}
                    placeholder="Cadangan penambahbaikan berunsurkan teknousahawanan, pengautomatan, prototaip atau model perniagaan inovatif..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Field 6, 7 & 8: Jam Bimbingan, Link Lampiran, Refleksi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    6. Jam Bimbingan (Industri / Fakulti)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.5}
                      max={40}
                      step={0.5}
                      disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                      value={formData.consultationHours || 2}
                      onChange={(e) => setFormData({ ...formData, consultationHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                    <span className="text-xs text-slate-500 font-bold shrink-0">Jam</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    7. Pautan Lampiran Dokumen / Google Drive (Bukti Lapangan)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                      value={formData.evidenceUrl || ''}
                      onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                      placeholder="https://drive.google.com/... atau pautan data"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                    />
                    {formData.evidenceUrl && (
                      <a
                        href={formData.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink size={13} />
                        <span>Buka</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Field 8: Refleksi & Perancangan Minggu Seterusnya */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  8. Refleksi Kendiri Pelajar &amp; Perancangan Minggu Seterusnya
                </label>
                <textarea
                  rows={2}
                  disabled={!isStudent && currentStudentActiveLog?.status !== 'draft'}
                  value={formData.studentReflection || ''}
                  onChange={(e) => setFormData({ ...formData, studentReflection: e.target.value })}
                  placeholder="Refleksi pembelajaran kendiri serta sasaran tindakan untuk minggu seterusnya..."
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* FORM FOOTER ACTIONS */}
            {isStudent && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {currentStudentActiveLog?.status === 'completed'
                    ? '✓ Entri minggu ini telah lengkap disemak dan disahkan oleh Penyelia Fakulti & Jurulatih Industri.'
                    : currentStudentActiveLog?.status === 'submitted'
                    ? 'Logbook telah dihantar dan sedang menunggu semakan daripada pihak penilai.'
                    : 'Simpan sebagai draf semasa bekerja dan klik Hantar untuk Semakan bila selesai.'}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isSaving || currentStudentActiveLog?.status === 'completed'}
                    onClick={handleSaveDraft}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black border border-slate-300 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={14} />
                    <span>{language === 'ms' ? 'Simpan Draf' : 'Save Draft'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving || currentStudentActiveLog?.status === 'completed'}
                    onClick={handleSubmitLogbook}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    <span>{language === 'ms' ? 'Hantar untuk Semakan (Jurulatih & Penyelia)' : 'Submit for Dual Review'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REVIEW QUEUE (SEMAKAN PENYELIA FAKULTI & JURULATIH INDUSTRI)        */}
      {/* ========================================================================= */}
      {activeTab === 'review_queue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isSupervisor 
                    ? (language === 'ms' ? 'Senarai Tugasan Semakan & Bimbingan Akademik (Penyelia Fakulti)' : 'Supervisor Academic Review Queue')
                    : isTrainer 
                    ? (language === 'ms' ? 'Senarai Pengesahan Praktikal Lapangan (Jurulatih Industri)' : 'Industry Coach Verification Queue')
                    : (language === 'ms' ? 'Senarai Semakan Penilai' : 'Evaluation Queue')}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ms' 
                    ? 'Semak dapatan kajian kes mingguan pelajar seliaan anda, berikan maklum balas dan sahkan gred penilaian.' 
                    : 'Review weekly field case studies of students, provide feedback and verify submission.'}
                </p>
              </div>
            </div>

            {/* List of submissions waiting for review */}
            <div className="divide-y divide-slate-100">
              {psmLogs
                .filter(l => {
                  if (isSupervisor) {
                    // Check if student belongs to supervisor
                    const isMyStudent = supervisedStudents.some(s => s.id === l.studentId);
                    return isMyStudent || l.reviewedBySupervisorId === currentUser.id;
                  }
                  if (isTrainer) {
                    const isMyStudent = companyStudents.some(s => s.id === l.studentId);
                    return isMyStudent || l.reviewedByTrainerId === currentUser.id;
                  }
                  return true;
                })
                .map((log) => {
                  const isVerifiedByMe = isTrainer 
                    ? log.trainerStatus === 'verified' 
                    : log.supervisorStatus === 'verified';
                  const isPendingMe = isTrainer 
                    ? log.trainerStatus !== 'verified' 
                    : log.supervisorStatus !== 'verified';

                  return (
                    <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                            Minggu {log.weekNumber}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {log.studentName} ({log.studentMatric})
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600">
                            {log.intake || 'Ambilan 1'}
                          </span>
                          {renderStatusBadge(log.status, log.trainerStatus, log.supervisorStatus)}
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {log.caseTitle || 'Tanpa Tajuk'}
                        </h4>

                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{log.companyName}</span>
                          <span>•</span>
                          <span>{log.milestonePhase}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingLog(log);
                            setReviewComments(
                              isTrainer ? (log.trainerComments || '') : (log.supervisorComments || '')
                            );
                            setReviewRating(
                              (isTrainer ? log.trainerRating : log.supervisorRating) || 'cemerlang'
                            );
                            setReviewStatus('verified');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-xs ${
                            isPendingMe
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye size={14} />
                          <span>{isPendingMe ? (language === 'ms' ? 'Semak Sekarang' : 'Review Now') : (language === 'ms' ? 'Lihat Semakan' : 'View Review')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COORDINATOR OVERSIGHT MONITORING HUB (PAPAN PEMANTAUAN PENYELARAS) */}
      {/* ========================================================================= */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Jumlah Pelajar Terlibat
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.studentCount}
              </div>
              <span className="text-[10px] text-blue-600 font-bold">
                {filterIntake === 'all' ? 'Semua Ambilan (1, 2, 3)' : filterIntake}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Kadar Pengisian Entri
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {stats.completionRate}%
              </div>
              <span className="text-[10px] text-slate-500 font-bold">
                {stats.submittedCount} dihantar daripada 20 mggu
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Disahkan Jurulatih Industri
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {stats.verifiedByTrainerCount}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">
                {stats.trainerVerifiedRate}% kadar pengesahan
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Disahkan Penyelia Fakulti
              </span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {stats.verifiedBySupervisorCount}
              </div>
              <span className="text-[10px] text-purple-600 font-bold">
                {stats.supervisorVerifiedRate}% kadar bimbingan
              </span>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Ambilan Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Ambilan:</span>
                <select
                  value={filterIntake}
                  onChange={(e) => setFilterIntake(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">Semua Ambilan</option>
                  <option value="Ambilan 1">Ambilan 1</option>
                  <option value="Ambilan 2">Ambilan 2</option>
                  <option value="Ambilan 3">Ambilan 3</option>
                </select>
              </div>

              {/* Week Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Minggu:</span>
                <select
                  value={filterWeek}
                  onChange={(e) => setFilterWeek(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">Semua Minggu (1-20)</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w.toString()}>Minggu {w}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai (Kedua-dua Semakan)</option>
                  <option value="pending_trainer">Menunggu Jurulatih</option>
                  <option value="pending_supervisor">Menunggu Penyelia Fakulti</option>
                  <option value="revision">Perlu Pembetulan</option>
                  <option value="draft">Draf</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pelajar, matrik, syarikat..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* ROSTER COMPARISON & MONITORING TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Rekod Pengisian &amp; Semakan Mingguan Pelajar ({filteredMonitoringLogs.length} Rekod Ditemui)
                </h4>
                <p className="text-xs text-slate-500">
                  Pantau perkembangan penulisan case study mengikut garis masa 20 minggu PSM 2.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Minggu</th>
                    <th className="py-3 px-4">Pelajar &amp; Ambilan</th>
                    <th className="py-3 px-4">Syarikat Rakan WBL</th>
                    <th className="py-3 px-4">Tajuk Kajian Kes</th>
                    <th className="py-3 px-4">Semakan Jurulatih</th>
                    <th className="py-3 px-4">Bimbingan Penyelia</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMonitoringLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tiada rekod buku log case study memenuhi kriteria penapis yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredMonitoringLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          M{log.weekNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.studentName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{log.studentMatric}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200 text-[9px]">
                              {log.intake || 'Ambilan 1'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate" title={log.companyName}>
                          {log.companyName}
                        </td>
                        <td className="py-3 px-4 text-slate-900 max-w-[220px]">
                          <div className="line-clamp-1 font-semibold" title={log.caseTitle}>
                            {log.caseTitle || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {log.milestonePhase}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {log.trainerStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle size={12} className="text-emerald-600" />
                              <span>{log.trainerName?.slice(0, 15) || 'Disahkan'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Belum</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.supervisorStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 text-purple-700 font-bold text-[11px]">
                              <CheckCircle size={12} className="text-purple-600" />
                              <span>{log.supervisorName?.slice(0, 15) || 'Disahkan'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Belum</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(log.status, log.trainerStatus, log.supervisorStatus)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingLog(log);
                                setReviewComments(
                                  isTrainer ? (log.trainerComments || '') : (log.supervisorComments || '')
                                );
                                setReviewRating(
                                  (isTrainer ? log.trainerRating : log.supervisorRating) || 'cemerlang'
                                );
                                setReviewStatus('verified');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1"
                              title="Semak Entri Lengkap"
                            >
                              <Eye size={13} />
                              <span>Periksa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrintLog(log)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Cetak Format Rasmi"
                            >
                              <Printer size={13} />
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
      {/* MODAL: INSPECT / REVIEW MODAL FOR SUPERVISOR, TRAINER & COORDINATOR       */}
      {/* ========================================================================= */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                  Minggu {inspectingLog.weekNumber} / 20 • PSM 2
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Semakan Case Study: {inspectingLog.studentName} ({inspectingLog.studentMatric})
                </h3>
                <p className="text-xs text-blue-200">
                  {inspectingLog.companyName} • {inspectingLog.intake || 'Ambilan 1'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Milestone & Phase */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-blue-800">Fasa Kajian:</span>
                <p className="font-bold text-slate-900 mt-0.5">{inspectingLog.milestonePhase}</p>
                <div className="text-[11px] text-slate-600 mt-1">
                  Tempoh: {inspectingLog.startDate} hingga {inspectingLog.endDate} ({inspectingLog.consultationHours || 2} Jam Bimbingan)
                </div>
              </div>

              {/* Case Title */}
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">Tajuk / Tema Kajian Kes:</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{inspectingLog.caseTitle}</h4>
              </div>

              {/* Problem Statement & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Isu / Masalah Lapangan Industri:</span>
                  <p className="text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{inspectingLog.problemStatement}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Kaedah / Tindakan Lapangan:</span>
                  <p className="text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{inspectingLog.methodologyActions}</p>
                </div>
              </div>

              {/* Key Findings & Technopreneur Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Dapatan Utama / Data Bukti:</span>
                  <p className="text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{inspectingLog.keyFindings}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Cadangan Solusi Teknousahawanan:</span>
                  <p className="text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{inspectingLog.technopreneurSolution}</p>
                </div>
              </div>

              {/* Links & Reflections */}
              {inspectingLog.evidenceUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Lampiran Bukti Lapangan:</span>
                    <a href={inspectingLog.evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold truncate max-w-md block">
                      {inspectingLog.evidenceUrl}
                    </a>
                  </div>
                  <a
                    href={inspectingLog.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Buka Fail
                  </a>
                </div>
              )}

              {/* REVIEW INPUT SECTION FOR SUPERVISOR / TRAINER / COORDINATOR */}
              {(isSupervisor || isTrainer || isCoordinator) && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {isTrainer 
                        ? 'Pengesahan Praktikal Lapangan (Jurulatih Industri)' 
                        : 'Bimbingan & Pengesahan Akademik (Penyelia Fakulti UTeM)'}
                    </h4>
                  </div>

                  {/* Decision: Verified vs Revision */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="reviewDecision"
                        checked={reviewStatus === 'verified'}
                        onChange={() => setReviewStatus('verified')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-emerald-700 font-black">✓ Sahkan Entri Case Study</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="reviewDecision"
                        checked={reviewStatus === 'revision'}
                        onChange={() => setReviewStatus('revision')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-amber-700 font-black">⚠ Mohon Pembetulan Pelajar</span>
                    </label>
                  </div>

                  {/* Rating Radio */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Kualiti / Tahap Penilaian:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'cemerlang', label: 'Cemerlang' },
                        { id: 'baik', label: 'Baik' },
                        { id: 'memuaskan', label: 'Memuaskan' },
                        { id: 'perlu_bimbingan', label: 'Perlu Bimbingan' }
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setReviewRating(r.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            reviewRating === r.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">
                      {isTrainer ? 'Ulasan Pengesahan Jurulatih Industri:' : 'Ulasan Bimbingan Akademik Penyelia:'}
                    </span>
                    <textarea
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder={
                        isTrainer 
                          ? 'Sahkan ketepatan pemerhatian di kilang/pejabat dan impak penyelesaian kepada syarikat...'
                          : 'Berikan panduan akademik, penambahbaikan metodologi dan pematuhan format PSM 2...'
                      }
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintLog(inspectingLog)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Cetak</span>
                </button>

                {(isSupervisor || isTrainer || isCoordinator) && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSubmitReview}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{reviewStatus === 'verified' ? 'Sahkan Semakan' : 'Hantar Nota Pembetulan'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT / OFFICIAL UTEM FORMAT PREVIEW FOR PSM 2                     */}
      {/* ========================================================================= */}
      {printLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Pratonton Cetakan Format Rasmi UTeM • Buku Log Case Study PSM 2
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Printer size={13} /> Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLog(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans printable-area text-xs bg-white">
              {/* UTEM HEADER */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  UNIVERSITI TEKNIKAL MALAYSIA MELAKA (UTeM)
                </h2>
                <h3 className="text-xs font-extrabold uppercase text-slate-700">
                  FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)
                </h3>
                <h4 className="text-[11px] font-bold text-blue-900 uppercase">
                  PROGRAM WORK-BASED LEARNING (WBL) 2026/2027
                </h4>
                <div className="inline-block mt-2 px-3 py-1 border border-slate-900 rounded-lg text-xs font-black uppercase bg-slate-50">
                  BUKU LOG MINGGUAN KAJIAN KES (CASE STUDY) PROJEK SARJANA MUDA II (BTMU 4084 / BMMT 4994)
                </div>
              </div>

              {/* STUDENT & PLACEMENT INFO TABLE */}
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-100 w-1/4">Nama Pelajar:</td>
                    <td className="p-2 font-black w-1/4">{printLog.studentName}</td>
                    <td className="p-2 font-bold bg-slate-100 w-1/4">No. Matrik:</td>
                    <td className="p-2 font-black w-1/4">{printLog.studentMatric}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-100">Syarikat Rakan WBL:</td>
                    <td className="p-2 font-semibold">{printLog.companyName}</td>
                    <td className="p-2 font-bold bg-slate-100">Sesi Ambilan:</td>
                    <td className="p-2 font-bold">{printLog.intake || 'Ambilan 1'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-100">Minggu Kajian Kes:</td>
                    <td className="p-2 font-black text-blue-900">Minggu {printLog.weekNumber} / 20 Minggu</td>
                    <td className="p-2 font-bold bg-slate-100">Tarikh Tempoh:</td>
                    <td className="p-2">{printLog.startDate} hingga {printLog.endDate}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-slate-100">Fasa Milestone:</td>
                    <td colSpan={3} className="p-2 font-extrabold text-slate-800">{printLog.milestonePhase}</td>
                  </tr>
                </tbody>
              </table>

              {/* CASE STUDY CONTENT SECTIONS */}
              <div className="space-y-4">
                <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                  <div className="font-black text-slate-900 uppercase text-[11px]">
                    1. Tajuk / Tema Kajian Kes Minggu Ini:
                  </div>
                  <div className="text-xs font-bold text-slate-800">{printLog.caseTitle}</div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                  <div className="font-black text-slate-900 uppercase text-[11px]">
                    2. Isu / Masalah Lapangan Industri yang Dikaji:
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{printLog.problemStatement}</div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                  <div className="font-black text-slate-900 uppercase text-[11px]">
                    3. Kaedah / Tindakan Lapangan / Temubual / Pemerhatian:
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{printLog.methodologyActions}</div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                  <div className="font-black text-slate-900 uppercase text-[11px]">
                    4. Dapatan Utama / Data / Bukti Kajian Kes:
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{printLog.keyFindings}</div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                  <div className="font-black text-slate-900 uppercase text-[11px]">
                    5. Cadangan Solusi Teknousahawanan &amp; Impak Industri:
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{printLog.technopreneurSolution}</div>
                </div>

                {printLog.studentReflection && (
                  <div className="border border-slate-300 rounded-xl p-3.5 space-y-1">
                    <div className="font-black text-slate-900 uppercase text-[11px]">
                      6. Refleksi Pelajar &amp; Perancangan Minggu Seterusnya:
                    </div>
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{printLog.studentReflection}</div>
                  </div>
                )}
              </div>

              {/* DUAL ENDORSEMENT SECTION SIGNATURE BLOCKS */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-900">
                {/* Jurulatih Industri Stamp */}
                <div className="border border-slate-300 rounded-xl p-4 space-y-2">
                  <div className="font-black text-[11px] text-blue-900 uppercase border-b border-slate-200 pb-1">
                    Pengesahan Jurulatih Industri (Industry Coach)
                  </div>
                  <div><strong>Nama:</strong> {printLog.trainerName || '...................................................'}</div>
                  <div><strong>Jawatan / Syarikat:</strong> {printLog.trainerPosition || '-'} • {printLog.trainerCompany || printLog.companyName}</div>
                  <div><strong>Ulasan:</strong> {printLog.trainerComments || 'Disahkan menepati keperluan operasi industri.'}</div>
                  <div><strong>Penilaian:</strong> {printLog.trainerRating ? printLog.trainerRating.toUpperCase() : 'CEMERLANG'}</div>
                  <div className="pt-6 border-b border-slate-400 w-3/4"></div>
                  <div className="text-[10px] text-slate-500">Tandatangan &amp; Cop Rasmi Syarikat</div>
                </div>

                {/* Penyelia Fakulti Stamp */}
                <div className="border border-slate-300 rounded-xl p-4 space-y-2">
                  <div className="font-black text-[11px] text-purple-900 uppercase border-b border-slate-200 pb-1">
                    Bimbingan Penyelia Fakulti UTeM (Faculty Supervisor)
                  </div>
                  <div><strong>Nama:</strong> {printLog.supervisorName || '...................................................'}</div>
                  <div><strong>No. Staf / Fakulti:</strong> {printLog.supervisorStaffId || 'FPTT UTeM'}</div>
                  <div><strong>Ulasan Akademik:</strong> {printLog.supervisorComments || 'Bimbingan metodologi dan penulisan disahkan.'}</div>
                  <div><strong>Penilaian:</strong> {printLog.supervisorRating ? printLog.supervisorRating.toUpperCase() : 'CEMERLANG'}</div>
                  <div className="pt-6 border-b border-slate-400 w-3/4"></div>
                  <div className="text-[10px] text-slate-500">Tandatangan &amp; Cop Rasmi Pensyarah</div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                Penyelaras WBL FPTT UTeM © {new Date().getFullYear()} • Sistem Pengurusan Bersepadu WBL &amp; PSM II
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
