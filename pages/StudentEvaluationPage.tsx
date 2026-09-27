import React, { useState, useEffect, useMemo } from 'react';
import { User, Application, UserRole, StudentEvaluation, CourseLecturerAssignment, EvaluationStatus } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_WBL_COURSES, calculateUTeMGrade } from '../constants';
import { generateEvaluationPrint } from '../utils/evaluationGenerator';
import { 
  Award, CheckCircle2, Clock, AlertCircle, FileText, Printer, Send, Save, Plus, 
  Trash2, Edit3, UserCheck, ShieldCheck, Building2, Star, Search, Filter, 
  GraduationCap, BookOpen, Settings, UserCog, Check, Info, ChevronRight, HelpCircle
} from 'lucide-react';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface StudentEvaluationPageProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  language: Language;
  initialTab?: 'evaluations' | 'settings' | 'rubrics';
  onNavigate?: (view: string) => void;
}

export const StudentEvaluationPage: React.FC<StudentEvaluationPageProps> = ({
  currentUser,
  applications,
  users,
  language,
  initialTab = 'evaluations',
  onNavigate
}) => {
  // Roles
  const isStudent = currentUser.role === UserRole.STUDENT;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isLecturer = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true || (currentUser as any).is_admin === true;

  // Active Tab: 'evaluations' | 'settings' | 'rubrics'
  const [activeTab, setActiveTab] = useState<'evaluations' | 'settings' | 'rubrics'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data state
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<CourseLecturerAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  // 1. Evaluation Form Modal (for Trainer to create/edit evaluation)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Partial<StudentEvaluation> | null>(null);

  // 2. Review & Verification Modal (for Course Lecturer to review & verify)
  const [reviewingEvaluation, setReviewingEvaluation] = useState<StudentEvaluation | null>(null);
  const [lecturerCommentsInput, setLecturerCommentsInput] = useState('');
  const [revisionNotesInput, setRevisionNotesInput] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);

  // 3. Course Lecturer Assignment Edit Modal (for Coordinator)
  const [editingAssignment, setEditingAssignment] = useState<Partial<CourseLecturerAssignment> | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Reload data
  const loadData = () => {
    setEvaluations(StorageService.getEvaluations());
    setCourseAssignments(StorageService.getCourseAssignments());
  };

  useEffect(() => {
    loadData();
    const unsub = StorageService.subscribe(loadData);
    return () => unsub();
  }, []);

  // Registered lecturers list for coordinator dropdown
  const facultyLecturers = useMemo(() => {
    return users.filter(u => 
      u.role === UserRole.LECTURER || 
      u.role === UserRole.COORDINATOR || 
      u.is_jkwbl || 
      u.role === UserRole.SUPERVISOR
    );
  }, [users]);

  // Students available for evaluation (for Industry Trainer)
  const myCompanyStudents = useMemo(() => {
    if (isTrainer) {
      const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
      // Match approved placement applications for this company
      const matchingApps = applications.filter(a => 
        (a.application_status === 'Diluluskan' || a.student_preferred) &&
        (!trainerComp || (a.company_name && a.company_name.toLowerCase().includes(trainerComp)))
      );
      return matchingApps;
    }
    // For coordinator/lecturer: show all active placement applications
    return applications.filter(a => a.application_status === 'Diluluskan' || a.student_preferred);
  }, [applications, currentUser, isTrainer]);

  // Filtered evaluations list
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      // Role scope
      if (isStudent) {
        if (e.studentId !== currentUser.id && e.studentMatric !== currentUser.matric_no) {
          return false;
        }
      } else if (isTrainer) {
        const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
        const matchesComp = !trainerComp || (e.companyName && e.companyName.toLowerCase().includes(trainerComp));
        const matchesSelf = e.trainerId === currentUser.id;
        if (!matchesComp && !matchesSelf) return false;
      } else if (isLecturer && !isCoordinator) {
        // Lecturer sees evaluations for courses they teach or assigned to them
        const isMyLec = e.lecturerId === currentUser.id || (e.lecturerName && e.lecturerName.toLowerCase() === currentUser.name.toLowerCase());
        const myCourses = courseAssignments.filter(ca => ca.lecturerId === currentUser.id).map(ca => ca.courseCode);
        const isMyCourse = myCourses.includes(e.courseCode);
        if (!isMyLec && !isMyCourse) return false;
      }

      // Course Filter
      if (selectedCourseFilter !== 'all' && e.courseCode !== selectedCourseFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && e.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (e.studentName && e.studentName.toLowerCase().includes(q)) ||
          (e.studentMatric && e.studentMatric.toLowerCase().includes(q)) ||
          (e.courseCode && e.courseCode.toLowerCase().includes(q)) ||
          (e.courseName && e.courseName.toLowerCase().includes(q)) ||
          (e.companyName && e.companyName.toLowerCase().includes(q)) ||
          (e.trainerName && e.trainerName.toLowerCase().includes(q)) ||
          (e.lecturerName && e.lecturerName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Pending lecturer verification first, then by updated date
      if (a.status === 'submitted_by_trainer' && b.status !== 'submitted_by_trainer') return -1;
      if (b.status === 'submitted_by_trainer' && a.status !== 'submitted_by_trainer') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [evaluations, isStudent, isTrainer, isLecturer, isCoordinator, currentUser, courseAssignments, selectedCourseFilter, statusFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = filteredEvaluations.length;
    const pendingVerification = filteredEvaluations.filter(e => e.status === 'submitted_by_trainer').length;
    const verified = filteredEvaluations.filter(e => e.status === 'verified_by_lecturer').length;
    const draft = filteredEvaluations.filter(e => e.status === 'draft').length;
    const revision = filteredEvaluations.filter(e => e.status === 'revision_requested').length;
    return { total, pendingVerification, verified, draft, revision };
  }, [filteredEvaluations]);

  // Handle open Evaluation Form (new or edit)
  const handleOpenForm = (existing?: StudentEvaluation) => {
    if (existing) {
      setEditingEvaluation(existing);
    } else {
      // Default template
      const defaultCourse = courseAssignments[0] || {
        courseCode: 'BTMT 3283(i)',
        courseName: 'Analitik Perniagaan',
        lecturerId: facultyLecturers[0]?.id || '',
        lecturerName: facultyLecturers[0]?.name || 'Pensyarah Kursus FPTT'
      };

      const firstApp = myCompanyStudents[0];
      const studentUser = firstApp ? users.find(u => u.matric_no === firstApp.student_id || u.username === firstApp.created_by) : null;

      const template: Partial<StudentEvaluation> = {
        studentId: studentUser?.id || firstApp?.student_id || '',
        studentName: firstApp?.student_name || '',
        studentMatric: firstApp?.student_id || '',
        studentProgram: firstApp?.student_program || 'SARJANA MUDA TEKNOUSAHAWANAN DENGAN KEPUJIAN (BTEC)',
        companyName: currentUser.company_affiliation || firstApp?.company_name || 'Syarikat Penempatan Industri',
        companyAddress: firstApp?.company_district ? `${firstApp.company_district}, ${firstApp.company_state}` : '',
        courseCode: defaultCourse.courseCode,
        courseName: defaultCourse.courseName,
        lecturerId: defaultCourse.lecturerId,
        lecturerName: defaultCourse.lecturerName,
        trainerId: currentUser.id,
        trainerName: currentUser.name,
        trainerPosition: currentUser.company_position || currentUser.company_affiliation || 'Jurulatih Industri',
        trainerCompany: currentUser.company_affiliation || firstApp?.company_name || '',
        trainerEmail: currentUser.email,
        trainerPhone: currentUser.phone,
        scores: {
          taskKnowledge: 8,
          workQuality: 8,
          problemSolving: 8,
          toolCompetency: 8,
          punctuality: 9,
          communication: 8,
          workEthics: 9,
          adaptability: 8,
          logbookQuality: 8,
          reflectionQuality: 8
        },
        trainerComments: '',
        trainerRecommendation: 'Memenuhi keperluan kompetensi industri WBL.',
        status: 'draft'
      };
      setEditingEvaluation(template);
    }
    setIsFormModalOpen(true);
  };

  // Score recalculation
  const updateScoreField = (field: keyof StudentEvaluation['scores'], value: number) => {
    if (!editingEvaluation) return;
    const clamped = Math.max(0, Math.min(10, value));
    const newScores = {
      ...(editingEvaluation.scores || {
        taskKnowledge: 8, workQuality: 8, problemSolving: 8, toolCompetency: 8,
        punctuality: 8, communication: 8, workEthics: 8, adaptability: 8,
        logbookQuality: 8, reflectionQuality: 8
      }),
      [field]: clamped
    };

    const techSub = (newScores.taskKnowledge || 0) + (newScores.workQuality || 0) + (newScores.problemSolving || 0) + (newScores.toolCompetency || 0);
    const softSub = (newScores.punctuality || 0) + (newScores.communication || 0) + (newScores.workEthics || 0) + (newScores.adaptability || 0);
    const logSub = (newScores.logbookQuality || 0) + (newScores.reflectionQuality || 0);
    const total = techSub + softSub + logSub;
    const grade = calculateUTeMGrade(total).grade;

    setEditingEvaluation({
      ...editingEvaluation,
      scores: newScores,
      technicalSubtotal: techSub,
      softSkillsSubtotal: softSub,
      logbookSubtotal: logSub,
      totalScore: total,
      grade
    });
  };

  // Student selection in form
  const handleSelectStudent = (matric: string) => {
    const app = myCompanyStudents.find(a => a.student_id === matric);
    if (!app || !editingEvaluation) return;
    const u = users.find(user => user.matric_no === matric || user.username === app.created_by);
    setEditingEvaluation({
      ...editingEvaluation,
      studentId: u?.id || matric,
      studentName: app.student_name,
      studentMatric: app.student_id,
      studentProgram: app.student_program || editingEvaluation.studentProgram,
      companyName: app.company_name || editingEvaluation.companyName,
      companyAddress: app.company_district ? `${app.company_district}, ${app.company_state}` : editingEvaluation.companyAddress
    });
  };

  // Course selection in form (auto-populates Course Lecturer)
  const handleSelectCourse = (code: string) => {
    const assignment = courseAssignments.find(ca => ca.courseCode === code);
    if (!editingEvaluation) return;
    setEditingEvaluation({
      ...editingEvaluation,
      courseCode: code,
      courseName: assignment?.courseName || code,
      lecturerId: assignment?.lecturerId || '',
      lecturerName: assignment?.lecturerName || 'Pensyarah Kursus FPTT',
      lecturerStaffId: assignment?.lecturerStaffId,
      lecturerEmail: assignment?.lecturerEmail
    });
  };

  // Save Form (Draft or Submit)
  const handleSaveEvaluation = async (submitNow: boolean = false) => {
    if (!editingEvaluation) return;

    if (!editingEvaluation.studentName || !editingEvaluation.courseCode) {
      toast.error(language === 'ms' ? 'Sila pilih pelajar dan kursus.' : 'Please select student and course.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await StorageService.saveEvaluation({
        ...editingEvaluation,
        studentId: editingEvaluation.studentId || editingEvaluation.studentMatric || 'student',
        courseCode: editingEvaluation.courseCode,
        status: submitNow ? 'submitted_by_trainer' : (editingEvaluation.status === 'revision_requested' ? 'revision_requested' : 'draft'),
        submittedAt: submitNow ? new Date().toISOString() : editingEvaluation.submittedAt
      });

      if (submitNow) {
        await StorageService.submitEvaluationToLecturer(saved.id);
        toast.success(language === 'ms' 
          ? `Borang penilaian ${saved.courseCode} bagi ${saved.studentName} berjaya dihantar kepada Pensyarah Kursus!` 
          : `Evaluation successfully submitted to Course Lecturer!`);
      } else {
        toast.success(language === 'ms' ? 'Draf penilaian berjaya disimpan.' : 'Draft evaluation saved.');
      }

      loadData();
      setIsFormModalOpen(false);
      setEditingEvaluation(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan penilaian');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Lecturer Review Modal
  const handleOpenReviewModal = (evaluation: StudentEvaluation) => {
    setReviewingEvaluation(evaluation);
    setLecturerCommentsInput(evaluation.lecturerComments || '');
    setRevisionNotesInput(evaluation.revisionNotes || '');
    setIsRevisionMode(false);
  };

  // Confirm Lecturer Verification
  const handleConfirmLecturerVerification = async () => {
    if (!reviewingEvaluation) return;
    setIsSaving(true);
    try {
      const verified = await StorageService.verifyEvaluationByLecturer(reviewingEvaluation.id, {
        lecturerComments: lecturerCommentsInput.trim() || 'Markah dan pencapaian industri disahkan memenuhi sukatan kursus WBL.',
        verifiedByLecturerName: currentUser.name
      });

      loadData();
      setReviewingEvaluation(null);
      toast.success(language === 'ms' 
        ? `Penilaian bagi ${verified.studentName} (${verified.courseCode}) telah berjaya DISAHKAN!` 
        : `Evaluation for ${verified.studentName} verified successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengesahkan penilaian');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Lecturer Revision Request
  const handleConfirmRevisionRequest = async () => {
    if (!reviewingEvaluation) return;
    if (!revisionNotesInput.trim()) {
      toast.error(language === 'ms' ? 'Sila nyatakan bahagian yang perlu disemak semula.' : 'Please enter revision notes.');
      return;
    }
    setIsSaving(true);
    try {
      await StorageService.requestRevisionEvaluation(
        reviewingEvaluation.id,
        revisionNotesInput.trim(),
        currentUser.name
      );
      loadData();
      setReviewingEvaluation(null);
      toast.success(language === 'ms' ? 'Permintaan semakan semula dihantar kepada Jurulatih Industri.' : 'Revision request sent to trainer.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar semakan');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Course Assignment (Coordinator)
  const handleSaveCourseAssignment = async () => {
    if (!editingAssignment || !editingAssignment.courseCode || !editingAssignment.lecturerId) {
      toast.error(language === 'ms' ? 'Sila pilih kursus dan pensyarah.' : 'Please select course and lecturer.');
      return;
    }

    const lecturer = facultyLecturers.find(l => l.id === editingAssignment.lecturerId);
    if (!lecturer) return;

    setIsSaving(true);
    try {
      await StorageService.saveCourseAssignment({
        ...editingAssignment,
        courseCode: editingAssignment.courseCode,
        lecturerId: lecturer.id,
        lecturerName: lecturer.name,
        lecturerStaffId: (lecturer as any).staff_id,
        lecturerEmail: lecturer.email
      });

      loadData();
      setIsAssignModalOpen(false);
      setEditingAssignment(null);
      toast.success(language === 'ms' ? 'Tetapan pensyarah kursus berjaya dikemaskini!' : 'Course lecturer settings updated!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tetapan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <Award size={24} />
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {t(language, 'evaluationTitle')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            {language === 'ms' 
              ? 'Modul pentaksiran prestasi industri pelajar WBL: Penilaian dibuat oleh Jurulatih Industri dan disahkan secara rasmi oleh Pensyarah Kursus UTeM.' 
              : 'WBL Student Industrial Performance Evaluation: Evaluated by Industry Coach and verified by Course Lecturer.'}
          </p>
        </div>

        {/* Role Quick Status Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-700">
            <UserCheck size={14} className="text-blue-600" />
            <span>
              {isCoordinator ? (language === 'ms' ? 'Peranan: Penyelaras WBL' : 'Role: Coordinator') :
               isTrainer ? (language === 'ms' ? 'Peranan: Jurulatih Industri (Penilai)' : 'Role: Industry Coach (Evaluator)') :
               isLecturer ? (language === 'ms' ? 'Peranan: Pensyarah Kursus (Pengesah)' : 'Role: Course Lecturer (Verifier)') :
               (language === 'ms' ? 'Peranan: Pelajar' : 'Role: Student')}
            </span>
          </div>

          {/* New Evaluation Button for Industry Trainer */}
          {(isTrainer || isCoordinator) && (
            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{language === 'ms' ? '+ Nilai Pelajar' : '+ Evaluate Student'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('evaluations');
            if (onNavigate) onNavigate('studentEvaluation');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'evaluations'
              ? 'bg-blue-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award size={14} />
          <span>{language === 'ms' ? 'Senarai Penilaian Pelajar' : 'Student Evaluations'}</span>
          {stats.pendingVerification > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {stats.pendingVerification}
            </span>
          )}
        </button>

        {/* Coordinator Course Lecturer Settings Tab */}
        {(isCoordinator || isLecturer) && (
          <button
            onClick={() => {
              setActiveTab('settings');
              if (onNavigate) onNavigate('evaluationSettings');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings size={14} />
            <span>{t(language, 'courseLecturerSettings')}</span>
            <span className="ml-1 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {courseAssignments.length}
            </span>
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab('rubrics');
            if (onNavigate) onNavigate('evaluationRubrics');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'rubrics'
              ? 'bg-blue-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={14} />
          <span>{language === 'ms' ? 'Rubrik & Skala Gred UTeM' : 'Rubrics & Grading Scale'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SENARAI PENILAIAN PELAJAR (EVALUATION QUEUE & LIST)                */}
      {/* ========================================================================= */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          {/* Attention Banner if there are evaluations pending lecturer verification */}
          {(isLecturer || isCoordinator) && stats.pendingVerification > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 animate-pulse">
                  <Clock size={20} />
                </span>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    {language === 'ms' 
                      ? `${stats.pendingVerification} Borang Penilaian Menunggu Pengesahan Pensyarah Kursus` 
                      : `${stats.pendingVerification} Evaluations Pending Course Lecturer Verification`}
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {language === 'ms'
                      ? 'Jurulatih industri telah mengisi dan menyerahkan markah rubrik. Pensyarah kursus perlu menyemak dan membuat pengesahan rasmi.'
                      : 'Industry trainers have submitted evaluation rubrics waiting for official verification.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('submitted_by_trainer')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
              >
                {language === 'ms' ? 'Tapis Menunggu Pengesahan' : 'Filter Pending'}
              </button>
            </div>
          )}

          {/* Quick Statistic Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ms' ? 'Jumlah Penilaian' : 'Total Evaluations'}
              </span>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {stats.total}
              </div>
            </div>

            {/* Sudah Disahkan Pensyarah */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/30">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13} />
                {language === 'ms' ? 'Disahkan Pensyarah' : 'Verified by Lecturer'}
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {stats.verified}
              </div>
            </div>

            {/* Menunggu Pengesahan */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/30">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Clock size={13} />
                {language === 'ms' ? 'Menunggu Pengesahan' : 'Pending Verification'}
              </span>
              <div className="text-3xl font-black text-amber-800 mt-1">
                {stats.pendingVerification}
              </div>
            </div>

            {/* Draf Penilaian */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ms' ? 'Draf / Semakan' : 'Draft / Revision'}
              </span>
              <div className="text-3xl font-black text-slate-700 mt-1">
                {stats.draft + stats.revision}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={language === 'ms' ? 'Cari nama pelajar, no. matrik, kursus, syarikat, atau jurulatih...' : 'Search student, course, company...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Course Filter */}
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="all">{language === 'ms' ? 'Semua Kursus WBL' : 'All Courses'}</option>
                {courseAssignments.map(ca => (
                  <option key={ca.id} value={ca.courseCode}>{ca.courseCode} - {ca.courseName}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="all">{language === 'ms' ? 'Semua Status' : 'All Statuses'}</option>
                <option value="submitted_by_trainer">{language === 'ms' ? '⏳ Menunggu Pengesahan Pensyarah' : 'Pending Verification'}</option>
                <option value="verified_by_lecturer">{language === 'ms' ? '✓ Telah Disahkan Pensyarah' : 'Verified'}</option>
                <option value="revision_requested">{language === 'ms' ? '⚠️ Perlu Pembetulan' : 'Revision Requested'}</option>
                <option value="draft">{language === 'ms' ? 'Draf Penilaian' : 'Draft'}</option>
              </select>
            </div>
          </div>

          {/* Evaluations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Pelajar & Program</th>
                    <th className="py-3.5 px-4">Syarikat Penempatan</th>
                    <th className="py-3.5 px-4">Kursus WBL</th>
                    <th className="py-3.5 px-4">Jurulatih & Markah</th>
                    <th className="py-3.5 px-4">Pensyarah Kursus & Status</th>
                    <th className="py-3.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Award size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-medium">
                          {language === 'ms' ? 'Tiada rekod penilaian pelajar ditemui.' : 'No evaluation records found.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((evalItem) => {
                      const isVerified = evalItem.status === 'verified_by_lecturer';
                      const isSubmitted = evalItem.status === 'submitted_by_trainer';
                      const isDraft = evalItem.status === 'draft';
                      const isRevision = evalItem.status === 'revision_requested';

                      return (
                        <tr key={evalItem.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Student */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-sm">{evalItem.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{evalItem.studentMatric}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{evalItem.studentProgram}</div>
                          </td>

                          {/* Company */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">{evalItem.companyName}</div>
                            <div className="text-[10px] text-slate-400">{evalItem.companyAddress || '-'}</div>
                          </td>

                          {/* Course */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                              {evalItem.courseCode}
                            </span>
                            <div className="text-[11px] text-slate-700 mt-1 font-semibold">{evalItem.courseName}</div>
                          </td>

                          {/* Trainer & Score */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{evalItem.trainerName}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-black text-sm text-blue-800">
                                {evalItem.totalScore} / 100
                              </span>
                              <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                                GRED {evalItem.grade}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Teknikal: {evalItem.technicalSubtotal}/40 • Insaniah: {evalItem.softSkillsSubtotal}/40
                            </div>
                          </td>

                          {/* Lecturer & Status */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-slate-700">
                              {evalItem.lecturerName || 'Pensyarah Kursus FPTT'}
                            </div>

                            <div className="mt-1">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 size={11} className="text-emerald-600" />
                                  <span>{language === 'ms' ? 'Disahkan Pensyarah' : 'Verified'}</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                                  <Clock size={11} className="text-amber-600" />
                                  <span>{language === 'ms' ? 'Menunggu Pengesahan' : 'Pending Verification'}</span>
                                </span>
                              ) : isRevision ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                  <AlertCircle size={11} className="text-rose-600" />
                                  <span>{language === 'ms' ? 'Perlu Pembetulan' : 'Revision Requested'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  <span>{language === 'ms' ? 'Draf' : 'Draft'}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Lecturer Verification Action */}
                              {(isLecturer || isCoordinator) && isSubmitted && (
                                <button
                                  onClick={() => handleOpenReviewModal(evalItem)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-1 shadow-sm"
                                  title="Semak dan sahkan penilaian"
                                >
                                  <ShieldCheck size={13} />
                                  <span>{language === 'ms' ? 'Sahkan' : 'Verify'}</span>
                                </button>
                              )}

                              {/* Edit Action for Trainer if draft or revision */}
                              {(isTrainer || isCoordinator) && (isDraft || isRevision) && (
                                <button
                                  onClick={() => handleOpenForm(evalItem)}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                                >
                                  <Edit3 size={13} />
                                  <span>{language === 'ms' ? 'Kemaskini' : 'Edit'}</span>
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                onClick={() => handleOpenReviewModal(evalItem)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                                title="Lihat Terperinci"
                              >
                                <FileText size={15} />
                              </button>

                              {/* PDF Print */}
                              <button
                                onClick={() => generateEvaluationPrint(evalItem, language)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl"
                                title="Cetak / Muat Turun Borang Rasmi PDF"
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
      {/* TAB 2: TETAPAN PENSYARAH KURSUS (COURSE LECTURER ASSIGNMENT SETTINGS)      */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (isCoordinator || isLecturer) && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <UserCog size={20} className="text-blue-600" />
                  <span>{language === 'ms' ? 'Tetapan Penetapan Pensyarah Kursus WBL' : 'WBL Course Lecturer Assignment Settings'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'ms' 
                    ? 'Penyelaras boleh menetapkan pensyarah fakulti yang bertanggungjawab bagi setiap kursus WBL untuk tujuan pengesahan penilaian industri.' 
                    : 'Coordinator can assign course lecturers responsible for verifying industrial evaluations for each WBL course.'}
                </p>
              </div>

              {isCoordinator && (
                <button
                  onClick={() => {
                    setEditingAssignment({
                      courseCode: '',
                      courseName: '',
                      lecturerId: facultyLecturers[0]?.id || '',
                      semester: 'Semester 7'
                    });
                    setIsAssignModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>{language === 'ms' ? '+ Tambah Kursus Baharu' : '+ Add New Course'}</span>
                </button>
              )}
            </div>

            {/* Course Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseAssignments.map((assignment) => {
                const assignedLec = facultyLecturers.find(l => l.id === assignment.lecturerId);
                const evalCount = evaluations.filter(e => e.courseCode === assignment.courseCode).length;

                return (
                  <div key={assignment.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg">
                          {assignment.courseCode}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1.5">{assignment.courseName}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{assignment.semester || 'Semester 7'}</span>
                      </div>

                      {isCoordinator && (
                        <button
                          onClick={() => {
                            setEditingAssignment(assignment);
                            setIsAssignModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Tukar Pensyarah"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === 'ms' ? 'Pensyarah Kursus Dilantik:' : 'Assigned Lecturer:'}
                      </div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-blue-600 shrink-0" />
                        <span>{assignment.lecturerName}</span>
                      </div>
                      {assignment.lecturerEmail && (
                        <div className="text-[11px] text-slate-500 font-mono">{assignment.lecturerEmail}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{evalCount} penilaian pelajar</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check size={11} /> Aktif
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PANDUAN RUBRIK & SKALA GRED UTEM                                   */}
      {/* ========================================================================= */}
      {activeTab === 'rubrics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              <span>{language === 'ms' ? 'Rubrik & Kriteria Penilaian Prestasi Industri Pelajar (WBL)' : 'WBL Student Industrial Rubrics'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'ms'
                ? 'Penilaian prestasi industri merangkumi 3 komponen utama iaitu Kemahiran Teknikal (40%), Kemahiran Insaniah (40%), dan Rekod Buku Log (20%).'
                : 'Evaluation covers Technical Skills (40%), Soft Skills (40%), and Logbook (20%).'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Part A */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                <div className="font-bold text-sm text-blue-900 flex items-center justify-between">
                  <span>Bahagian A: Kemahiran Teknikal</span>
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-black">40%</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Pengetahuan & Pemahaman Tugasan (10m)</li>
                  <li>Kualiti & Ketepatan Hasil Kerja (10m)</li>
                  <li>Keupayaan Menyelesaikan Masalah & Inisiatif (10m)</li>
                  <li>Kecekapan Penggunaan Alatan & Sistem Industri (10m)</li>
                </ul>
              </div>

              {/* Part B */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                <div className="font-bold text-sm text-emerald-900 flex items-center justify-between">
                  <span>Bahagian B: Kemahiran Insaniah</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-xs font-black">40%</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Kedatangan & Ketepatan Masa (10m)</li>
                  <li>Komunikasi Berkesan & Kerja Berpasukan (10m)</li>
                  <li>Etika Kerja, Integriti & SOP Keselamatan (10m)</li>
                  <li>Kebolehsuaian & Minat Pembelajaran (10m)</li>
                </ul>
              </div>

              {/* Part C */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
                <div className="font-bold text-sm text-purple-900 flex items-center justify-between">
                  <span>Bahagian C: Buku Log Latihan</span>
                  <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-black">20%</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Ketelitian Rekod Harian Buku Log (10m)</li>
                  <li>Refleksi Pembelajaran Mingguan (10m)</li>
                </ul>
              </div>
            </div>

            {/* Grading Scale Table */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                Skala Penggredan Akademik UTeM:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { range: '90 - 100', grade: 'A+', status: 'Cemerlang' },
                  { range: '80 - 89', grade: 'A', status: 'Cemerlang' },
                  { range: '75 - 79', grade: 'A-', status: 'Kepujian' },
                  { range: '70 - 74', grade: 'B+', status: 'Kepujian' },
                  { range: '65 - 69', grade: 'B', status: 'Lulus' },
                  { range: '60 - 64', grade: 'B-', status: 'Lulus' },
                  { range: '55 - 59', grade: 'C+', status: 'Lulus' },
                  { range: '50 - 54', grade: 'C', status: 'Lulus' },
                  { range: '40 - 49', grade: 'D', status: 'Lulus Bersyarat' },
                  { range: '0 - 39', grade: 'E', status: 'Gagal' },
                ].map(g => (
                  <div key={g.grade} className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-slate-800">{g.grade}</span>
                      <span className="text-[10px] text-slate-400 block">{g.range}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{g.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BORANG PENILAIAN PELAJAR (EVALUATION FORM FOR TRAINER)           */}
      {/* ========================================================================= */}
      {isFormModalOpen && editingEvaluation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Borang Penilaian Prestasi Industri Pelajar' : 'Student Performance Evaluation'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {editingEvaluation.studentName || (language === 'ms' ? 'Pilih Pelajar' : 'Select Student')}
                </h3>
                <p className="text-xs text-blue-200">
                  {editingEvaluation.courseCode} - {editingEvaluation.courseName} • Pensyarah: {editingEvaluation.lecturerName}
                </p>
              </div>

              <button
                onClick={() => { setIsFormModalOpen(false); setEditingEvaluation(null); }}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {/* Student & Course Selector Block */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">
                  {language === 'ms' ? '1. Maklumat Pelajar & Kursus Yang Dinilai' : '1. Student & Course Information'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'ms' ? 'Pilih Pelajar Penempatan:' : 'Select Student:'}
                    </label>
                    <select
                      value={editingEvaluation.studentMatric || ''}
                      onChange={(e) => handleSelectStudent(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- {language === 'ms' ? 'Sila Pilih Pelajar' : 'Select Student'} --</option>
                      {myCompanyStudents.map(app => (
                        <option key={app.id} value={app.student_id}>
                          {app.student_name} ({app.student_id}) - {app.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'ms' ? 'Pilih Kursus WBL:' : 'Select WBL Course:'}
                    </label>
                    <select
                      value={editingEvaluation.courseCode || ''}
                      onChange={(e) => handleSelectCourse(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {courseAssignments.map(ca => (
                        <option key={ca.id} value={ca.courseCode}>
                          {ca.courseCode} - {ca.courseName} (Pensyarah: {ca.lecturerName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* LIVE SCORE & GRADE SUMMARY BANNER */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                    {language === 'ms' ? 'Jumlah Markah Penilaian Semasa:' : 'Total Calculated Score:'}
                  </span>
                  <div className="text-3xl font-black mt-0.5">
                    {editingEvaluation.totalScore || 0} <span className="text-sm font-normal text-blue-200">/ 100</span>
                  </div>
                  <div className="text-xs text-blue-200 mt-1 flex gap-3">
                    <span>Teknikal: <strong>{editingEvaluation.technicalSubtotal || 0}/40</strong></span>
                    <span>•</span>
                    <span>Insaniah: <strong>{editingEvaluation.softSkillsSubtotal || 0}/40</strong></span>
                    <span>•</span>
                    <span>Buku Log: <strong>{editingEvaluation.logbookSubtotal || 0}/20</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block mb-1">
                    Gred UTeM
                  </span>
                  <span className="px-4 py-1.5 rounded-xl font-black text-xl bg-emerald-500 text-white shadow-sm inline-block">
                    {editingEvaluation.grade || 'A'}
                  </span>
                </div>
              </div>

              {/* RUBRIC SCORING INPUTS */}
              {/* Part A */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {language === 'ms' ? 'Bahagian A: Kemahiran Teknikal & Pelaksanaan Tugasan (40 Markah)' : 'Part A: Technical Skills (40 Marks)'}
                  </h4>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {editingEvaluation.technicalSubtotal || 0} / 40
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'taskKnowledge', label: '1. Pengetahuan & Pemahaman Tugasan Kerja (Task Knowledge)', desc: 'Memahami prinsip, skop kerja, dan konsep teori yang diaplikasikan.' },
                    { key: 'workQuality', label: '2. Kualiti & Ketepatan Hasil Kerja (Work Quality & Accuracy)', desc: 'Menghasilkan kerja yang teliti dan mematuhi standard industri.' },
                    { key: 'problemSolving', label: '3. Keupayaan Menyelesaikan Masalah & Inisiatif (Problem Solving)', desc: 'Mampu menganalisis isu dan mengemukakan solusi kreatif.' },
                    { key: 'toolCompetency', label: '4. Kecekapan Penggunaan Alatan & Sistem Industri (Tools Competency)', desc: 'Cekap mengendalikan perisian, mesin atau sistem IT syarikat.' },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    return (
                      <div key={crit.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                          <div className="text-[11px] text-slate-500">{crit.desc}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={val}
                            onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                            className="w-24 accent-blue-600"
                          />
                          <span className="w-10 text-center font-black text-xs text-blue-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200">
                            {val} / 10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part B */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {language === 'ms' ? 'Bahagian B: Kemahiran Insaniah & Profesionalisme (40 Markah)' : 'Part B: Soft Skills & Professionalism (40 Marks)'}
                  </h4>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {editingEvaluation.softSkillsSubtotal || 0} / 40
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'punctuality', label: '1. Disiplin, Kedatangan & Ketepatan Masa (Punctuality & Attendance)', desc: 'Mematuhi jadual kerja dan menepati masa penyerahan tugasan.' },
                    { key: 'communication', label: '2. Komunikasi & Kerjasama Berpasukan (Communication & Teamwork)', desc: 'Berkomunikasi secara profesional dan aktif dalam pasukan.' },
                    { key: 'workEthics', label: '3. Integriti, Etika Kerja & SOP Keselamatan (Ethics & Safety)', desc: 'Amanah menjaga kerahsiaan syarikat dan mematuhi SOP.' },
                    { key: 'adaptability', label: '4. Kebolehsuaian & Sikap Terhadap Pembelajaran (Adaptability)', desc: 'Bermotivasi tinggi dan terbuka menerima maklum balas pembetulan.' },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    return (
                      <div key={crit.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                          <div className="text-[11px] text-slate-500">{crit.desc}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={val}
                            onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                            className="w-24 accent-emerald-600"
                          />
                          <span className="w-10 text-center font-black text-xs text-emerald-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200">
                            {val} / 10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part C */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {language === 'ms' ? 'Bahagian C: Buku Log Latihan & Dokumentasi (20 Markah)' : 'Part C: Logbook & Documentation (20 Marks)'}
                  </h4>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {editingEvaluation.logbookSubtotal || 0} / 20
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'logbookQuality', label: '1. Ketelitian & Konsistensi Rekod Buku Log Harian (Logbook Regularity)', desc: 'Merekod aktiviti setiap hari secara teratur dan lengkap.' },
                    { key: 'reflectionQuality', label: '2. Refleksi Pembelajaran Mingguan (Weekly Reflection)', desc: 'Menghuraikan kemahiran baharu dan cabaran yang diselesaikan.' },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    return (
                      <div key={crit.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                          <div className="text-[11px] text-slate-500">{crit.desc}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={val}
                            onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                            className="w-24 accent-purple-600"
                          />
                          <span className="w-10 text-center font-black text-xs text-purple-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200">
                            {val} / 10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Industry Trainer Comments */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">
                  {language === 'ms' ? 'Ulasan & Cadangan Jurulatih Industri:' : 'Industry Coach Comments & Recommendation:'}
                </h4>
                <textarea
                  rows={3}
                  value={editingEvaluation.trainerComments || ''}
                  onChange={(e) => setEditingEvaluation({ ...editingEvaluation, trainerComments: e.target.value })}
                  placeholder={language === 'ms'
                    ? 'Ulasan mengenai pencapaian kerja pelajar, sikap, komitmen, dan bidang yang telah dikuasai dengan cemerlang...'
                    : 'Feedback regarding student performance and skills acquired...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'ms' ? 'Cadangan Penyerapan / Kerjaya Masa Hadapan:' : 'Future Career / Absorption Recommendation:'}
                  </label>
                  <input
                    type="text"
                    value={editingEvaluation.trainerRecommendation || ''}
                    onChange={(e) => setEditingEvaluation({ ...editingEvaluation, trainerRecommendation: e.target.value })}
                    placeholder="cth: Disyorkan untuk serapan jawatan Eksekutif Analitik Data selepas tamat pengajian."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsFormModalOpen(false); setEditingEvaluation(null); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t(language, 'cancel')}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Menyimpan...' : (language === 'ms' ? 'Simpan Draf' : 'Save Draft')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEvaluation(true)}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSaving ? 'Menghantar...' : (language === 'ms' ? 'Hantar kepada Pensyarah Kursus' : 'Submit to Lecturer')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SEMAKAN & PENGESAHAN PENSYARAH KURSUS (LECTURER VERIFICATION)     */}
      {/* ========================================================================= */}
      {reviewingEvaluation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Pengesahan Penilaian Prestasi Industri Pelajar' : 'Lecturer Verification'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {reviewingEvaluation.studentName} ({reviewingEvaluation.studentMatric})
                </h3>
                <p className="text-xs text-blue-200">
                  {reviewingEvaluation.courseCode} - {reviewingEvaluation.courseName} • Penilai: {reviewingEvaluation.trainerName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateEvaluationPrint(reviewingEvaluation, language)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setReviewingEvaluation(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {/* Score Summary Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {language === 'ms' ? 'Markah Keseluruhan Industri:' : 'Overall Industry Score:'}
                  </span>
                  <div className="text-3xl font-black text-blue-900 mt-0.5">
                    {reviewingEvaluation.totalScore} / 100
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span>Teknikal: <strong>{reviewingEvaluation.technicalSubtotal}/40</strong></span>
                    <span>•</span>
                    <span>Insaniah: <strong>{reviewingEvaluation.softSkillsSubtotal}/40</strong></span>
                    <span>•</span>
                    <span>Buku Log: <strong>{reviewingEvaluation.logbookSubtotal}/20</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Gred Penilaian UTeM:
                  </span>
                  <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xl font-black shadow-sm inline-block">
                    GRED {reviewingEvaluation.grade}
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">
                  {language === 'ms' ? 'Pecahan Markah Rubrik Penilaian' : 'Rubric Breakdown'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Part A */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                    <div className="font-bold text-blue-900 flex justify-between">
                      <span>Kemahiran Teknikal:</span>
                      <span>{reviewingEvaluation.technicalSubtotal}/40</span>
                    </div>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex justify-between"><span>Pengetahuan Tugasan:</span> <strong>{reviewingEvaluation.scores?.taskKnowledge || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Kualiti Kerja:</span> <strong>{reviewingEvaluation.scores?.workQuality || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Penyelesaian Masalah:</span> <strong>{reviewingEvaluation.scores?.problemSolving || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Penggunaan Alatan:</span> <strong>{reviewingEvaluation.scores?.toolCompetency || 0}/10</strong></div>
                    </div>
                  </div>

                  {/* Part B */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                    <div className="font-bold text-emerald-900 flex justify-between">
                      <span>Kemahiran Insaniah:</span>
                      <span>{reviewingEvaluation.softSkillsSubtotal}/40</span>
                    </div>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex justify-between"><span>Kedatangan & Masa:</span> <strong>{reviewingEvaluation.scores?.punctuality || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Komunikasi Pasukan:</span> <strong>{reviewingEvaluation.scores?.communication || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Etika & Integriti:</span> <strong>{reviewingEvaluation.scores?.workEthics || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Kebolehsuaian:</span> <strong>{reviewingEvaluation.scores?.adaptability || 0}/10</strong></div>
                    </div>
                  </div>

                  {/* Part C */}
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2">
                    <div className="font-bold text-purple-900 flex justify-between">
                      <span>Buku Log & Laporan:</span>
                      <span>{reviewingEvaluation.logbookSubtotal}/20</span>
                    </div>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex justify-between"><span>Ketelitian Logbook:</span> <strong>{reviewingEvaluation.scores?.logbookQuality || 0}/10</strong></div>
                      <div className="flex justify-between"><span>Refleksi Mingguan:</span> <strong>{reviewingEvaluation.scores?.reflectionQuality || 0}/10</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Industry Trainer Feedback Display */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">
                  {language === 'ms' ? 'Ulasan Jurulatih Industri:' : 'Industry Coach Comments:'}
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 italic">
                  "{reviewingEvaluation.trainerComments || 'Tiada ulasan tambahan.'}"
                </div>
                {reviewingEvaluation.trainerRecommendation && (
                  <div className="text-xs text-slate-600 pt-1">
                    <strong>Cadangan Kerjaya:</strong> {reviewingEvaluation.trainerRecommendation}
                  </div>
                )}
              </div>

              {/* LECTURER VERIFICATION SECTION */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span>{language === 'ms' ? 'Pengesahan Rasmi Pensyarah Kursus' : 'Course Lecturer Verification'}</span>
                </h4>

                {!isRevisionMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'ms' ? 'Ulasan & Catatan Pensyarah Kursus:' : 'Course Lecturer Comments:'}
                      </label>
                      <textarea
                        rows={3}
                        value={lecturerCommentsInput}
                        onChange={(e) => setLecturerCommentsInput(e.target.value)}
                        placeholder={language === 'ms'
                          ? 'Markah dan gred penilaian prestasi industri disahkan memenuhi standard kursus WBL...'
                          : 'Marks and grade confirmed for WBL course...'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      {language === 'ms' ? 'Catatan Permohonan Semakan Semula kepada Jurulatih:' : 'Revision Request Notes:'}
                    </label>
                    <textarea
                      rows={3}
                      value={revisionNotesInput}
                      onChange={(e) => setRevisionNotesInput(e.target.value)}
                      placeholder={language === 'ms' ? 'Sila jelaskan kriteria yang perlu disemak semula...' : 'Specify criteria to revise...'}
                      className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewingEvaluation(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t(language, 'cancel')}
              </button>

              <div className="flex items-center gap-2">
                {/* Actions for Lecturer */}
                {(isLecturer || isCoordinator) && (
                  !isRevisionMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRevisionMode(true)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <AlertCircle size={14} />
                        <span>{language === 'ms' ? 'Minta Semakan Semula' : 'Request Revision'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmLecturerVerification}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        <span>{isSaving ? 'Mengesahkan...' : (language === 'ms' ? 'Sahkan Penilaian Pelajar' : 'Verify Student Evaluation')}</span>
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
                        onClick={handleConfirmRevisionRequest}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send size={14} />
                        <span>{isSaving ? 'Menghantar...' : (language === 'ms' ? 'Hantar Permohonan Semakan' : 'Send Revision Request')}</span>
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TETAPAN PENSYARAH KURSUS (COURSE LECTURER ASSIGNMENT MODAL)       */}
      {/* ========================================================================= */}
      {isAssignModalOpen && editingAssignment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-blue-200">
                  {language === 'ms' ? 'Tetapan Penyelaras' : 'Coordinator Settings'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {language === 'ms' ? 'Penetapan Pensyarah Kursus' : 'Assign Course Lecturer'}
                </h3>
              </div>

              <button
                onClick={() => { setIsAssignModalOpen(false); setEditingAssignment(null); }}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ms' ? 'Kod Kursus:' : 'Course Code:'}
                </label>
                <input
                  type="text"
                  placeholder="cth: BTMT 3283(i)"
                  value={editingAssignment.courseCode || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, courseCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ms' ? 'Nama Kursus WBL:' : 'Course Name:'}
                </label>
                <input
                  type="text"
                  placeholder="cth: Analitik Perniagaan"
                  value={editingAssignment.courseName || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ms' ? 'Pensyarah Kursus Yang Dilantik:' : 'Assigned Lecturer:'}
                </label>
                <select
                  value={editingAssignment.lecturerId || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, lecturerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- {language === 'ms' ? 'Pilih Pensyarah Fakulti' : 'Select Faculty Lecturer'} --</option>
                  {facultyLecturers.map(lec => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({(lec as any).staff_id || 'FPTT'}) - {lec.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'ms' ? 'Semester Pengajian:' : 'Semester:'}
                </label>
                <select
                  value={editingAssignment.semester || 'Semester 7'}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Semester 7">Semester 7 (Tahun 4)</option>
                  <option value="Semester 8">Semester 8 (Tahun 4)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsAssignModalOpen(false); setEditingAssignment(null); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t(language, 'cancel')}
              </button>

              <button
                type="button"
                onClick={handleSaveCourseAssignment}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>{isSaving ? 'Menyimpan...' : (language === 'ms' ? 'Simpan Tetapan' : 'Save Settings')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
