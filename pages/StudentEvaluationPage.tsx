import React, { useState, useEffect, useMemo } from 'react';
import { User, Application, UserRole, StudentEvaluation, CourseLecturerAssignment, EvaluationStatus, WeeklyLogbook } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_WBL_COURSES, calculateUTeMGrade } from '../constants';
import { 
  generateEvaluationPrint, 
  generateCourseGradeSummaryPrint, 
  generateCourseRubricPrint, 
  generateWeeklyStudentAssessmentPrint,
  CourseStudentGradeRecord 
} from '../utils/evaluationGenerator';
import { 
  UTEM_PORTFOLIO_SCHEMES, 
  UTEM_WEEKLY_ASSESSMENTS, 
  WBL_COURSE_SEQUENCE,
  WblCourseSequenceItem,
  CoursePortfolioScheme, 
  WeeklyAssessmentConfig,
  RubricCriterion
} from '../constants/utemWblRubrics';
import { 
  Award, CheckCircle2, Clock, AlertCircle, FileText, Printer, Send, Save, Plus, 
  Trash2, Edit3, UserCheck, ShieldCheck, Building2, Star, Search, Filter, 
  GraduationCap, BookOpen, Settings, UserCog, Check, Info, ChevronRight, HelpCircle,
  UserPlus, UserMinus, CheckSquare, Bell, ArrowRight, Eye, RefreshCw, BarChart2,
  Mail, Phone, MapPin, ExternalLink, Layers, CheckCheck, Sliders, ChevronDown, Users,
  Megaphone, MessageSquare, CalendarCheck, Sparkles
} from 'lucide-react';
import { CourseAnnouncementsSection } from '../components/CourseAnnouncementsSection';
import { Language, t } from '../translations';
import { toast } from 'react-hot-toast';

interface StudentEvaluationPageProps {
  currentUser: User;
  applications: Application[];
  users: User[];
  language: Language;
  initialTab?: 'weeklyAssessment' | 'evaluations' | 'settings' | 'rubrics' | 'courseMonitoring' | 'enrollment' | 'announcements';
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

  // Active Tab: 'weeklyAssessment' | 'evaluations' | 'settings' | 'rubrics' | 'courseMonitoring' | 'enrollment' | 'announcements'
  const [activeTab, setActiveTab] = useState<'weeklyAssessment' | 'evaluations' | 'settings' | 'rubrics' | 'courseMonitoring' | 'enrollment' | 'announcements'>(
    initialTab || (isTrainer ? 'weeklyAssessment' : 'evaluations')
  );

  // Weekly Assessment States (Industry Coach Weekly Evaluation for 4x 5-week modules & 20-week PSM2 starting 28 Sept 2026)
  const [selectedWeeklyCourseCode, setSelectedWeeklyCourseCode] = useState<string>('BTMU 2103(i)');
  const [selectedWeeklyStudentMatric, setSelectedWeeklyStudentMatric] = useState<string>('');
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [evaluatingWeekConfig, setEvaluatingWeekConfig] = useState<WeeklyAssessmentConfig | null>(null);
  const [evaluatingExistingEval, setEvaluatingExistingEval] = useState<StudentEvaluation | null>(null);
  const [weeklyAreaScores, setWeeklyAreaScores] = useState<{ area1: number; area2: number; area3: number }>({ area1: 3, area2: 3, area3: 3 });
  const [weeklyTrainerComments, setWeeklyTrainerComments] = useState<string>('');
  const [weeklyTrainerRecommendation, setWeeklyTrainerRecommendation] = useState<string>('');
  const [weeklyDeliverableNotes, setWeeklyDeliverableNotes] = useState<string>('');
  const [studentWeeklyLogbook, setStudentWeeklyLogbook] = useState<WeeklyLogbook | null>(null);
  const [isViewingLogbookModalOpen, setIsViewingLogbookModalOpen] = useState(false);

  // Official UTeM Rubrics View State (matching lampiran)
  const [selectedRubricCourseCode, setSelectedRubricCourseCode] = useState<string>('BTMT 3273(i)');
  const [rubricViewMode, setRubricViewMode] = useState<'portfolio' | 'weekly' | 'grading'>('portfolio');
  const [expandedRubricPart, setExpandedRubricPart] = useState<string | null>('Bahagian A');
  const [selectedWeeklyWeek, setSelectedWeeklyWeek] = useState<number>(1);
  const [formScoringMode, setFormScoringMode] = useState<'rubric' | 'slider'>('rubric');

  // Course Monitoring States (for Lecturer & Coordinator)
  const [selectedMonitoringCourseCode, setSelectedMonitoringCourseCode] = useState<string>('all');
  const [monitoringSearchQuery, setMonitoringSearchQuery] = useState('');
  const [monitoringStatusFilter, setMonitoringStatusFilter] = useState<string>('all');
  const [isSendingReminder, setIsSendingReminder] = useState<string | null>(null);

  // Course Enrollment States (for Coordinator)
  const [selectedEnrollmentCourseCode, setSelectedEnrollmentCourseCode] = useState<string>('BTMT 3283(i)');
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('all');
  const [selectedStudentsToEnroll, setSelectedStudentsToEnroll] = useState<string[]>([]);
  const [enrollmentActiveSubtab, setEnrollmentActiveSubtab] = useState<'enrolled' | 'available'>('enrolled');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    const evalTab = sessionStorage.getItem('selectedEvaluationTab');
    if (evalTab) {
      setActiveTab(evalTab as any);
      sessionStorage.removeItem('selectedEvaluationTab');
    }
    const navCourse = sessionStorage.getItem('selectedMonitoringCourseCode');
    if (navCourse) {
      setSelectedMonitoringCourseCode(navCourse);
      sessionStorage.removeItem('selectedMonitoringCourseCode');
    }
    const evalCourse = sessionStorage.getItem('selectedEvaluationCourseCode');
    if (evalCourse) {
      setSelectedCourseFilter(evalCourse);
      setActiveTab('evaluations');
      sessionStorage.removeItem('selectedEvaluationCourseCode');
    }
    const weeklyCourse = sessionStorage.getItem('selectedWeeklyCourseCode');
    if (weeklyCourse) {
      setSelectedWeeklyCourseCode(weeklyCourse);
      setActiveTab('weeklyAssessment');
      sessionStorage.removeItem('selectedWeeklyCourseCode');
    }
  }, [initialTab]);

  useEffect(() => {
    const handleCourseSelected = (e: any) => {
      const { courseCode, view } = e.detail || {};
      if (view === 'monitoring') {
        setSelectedMonitoringCourseCode(courseCode || 'all');
        setActiveTab('courseMonitoring');
      } else if (view === 'evaluation') {
        setSelectedCourseFilter(courseCode || 'all');
        setActiveTab('evaluations');
      } else if (view === 'weekly') {
        setSelectedWeeklyCourseCode(courseCode || 'BTMU 2103(i)');
        setActiveTab('weeklyAssessment');
      }
    };
    window.addEventListener('wblCourseSelected', handleCourseSelected);
    return () => window.removeEventListener('wblCourseSelected', handleCourseSelected);
  }, []);

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
      u.role === UserRole.SUPERVISOR ||
      Boolean((u as any).staff_id) ||
      (u.email && u.email.toLowerCase().includes('@utem.edu.my'))
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

  // List of active students for Weekly Assessment
  const activeWeeklyStudents = useMemo(() => {
    if (isStudent) {
      return [{
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentMatric: currentUser.matric_no || 'B032110045',
        studentProgram: currentUser.academic_level || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)',
        companyName: currentUser.company_affiliation || 'PETRONAS Digital Sdn Bhd',
        companyDistrict: 'Kuala Lumpur',
        companyState: 'W.P. Kuala Lumpur'
      }];
    }
    const apps = myCompanyStudents.length > 0 ? myCompanyStudents : applications.filter(a => a.student_name);
    if (apps.length > 0) {
      return apps.map(app => {
        const u = users.find(user => user.matric_no === app.student_id || user.username === app.created_by);
        return {
          studentId: u?.id || app.student_id || 'student',
          studentName: app.student_name || u?.name || 'Pelajar WBL',
          studentMatric: app.student_id || (app as any).studentMatric || u?.matric_no || 'B032110045',
          studentProgram: app.student_program || u?.academic_level || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)',
          companyName: app.company_name || currentUser.company_affiliation || 'Syarikat Penempatan Industri',
          companyDistrict: app.company_district || '',
          companyState: app.company_state || ''
        };
      });
    }
    const stUsers = users.filter(u => u.role === UserRole.STUDENT);
    return stUsers.map(u => ({
      studentId: u.id,
      studentName: u.name,
      studentMatric: u.matric_no || 'B032110045',
      studentProgram: u.academic_level || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)',
      companyName: u.company_affiliation || currentUser.company_affiliation || 'PETRONAS Digital Sdn Bhd',
      companyDistrict: 'Kuala Lumpur',
      companyState: 'W.P. Kuala Lumpur'
    }));
  }, [isStudent, currentUser, myCompanyStudents, applications, users]);

  // Helper to get assigned lecturer for a course
  const getCourseAssignedLecturer = (courseCode: string): CourseLecturerAssignment | undefined => {
    if (!courseCode) return undefined;
    const clean = courseCode.replace(/\(i\)/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const matches = courseAssignments.filter(ca => {
      const caClean = (ca.courseCode || '').replace(/\(i\)/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
      return ca.courseCode === courseCode || 
             ca.courseCode?.toLowerCase() === courseCode.toLowerCase() ||
             caClean === clean;
    });

    if (matches.length > 0) {
      // Pick the latest assigned record
      const sorted = [...matches].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      const found = sorted[0];

      const userLec = users.find(u => u.id === found.lecturerId) || 
                      users.find(u => u.name && found.lecturerName && u.name.trim().toLowerCase() === found.lecturerName.trim().toLowerCase()) ||
                      users.find(u => u.email && found.lecturerEmail && u.email.toLowerCase() === found.lecturerEmail.toLowerCase());
      if (userLec && userLec.name) {
        return {
          ...found,
          lecturerName: userLec.name,
          lecturerEmail: userLec.email || found.lecturerEmail,
          lecturerStaffId: (userLec as any).staff_id || found.lecturerStaffId
        };
      }
      return found;
    }
    return undefined;
  };

  // Helper to determine if current user has verification rights for a course (must be assigned lecturer or coordinator)
  const canUserVerifyCourse = (courseCode: string): boolean => {
    if (isCoordinator) return true; // Penyelaras WBL / Admin
    if (!isLecturer) return false;
    const assigned = getCourseAssignedLecturer(courseCode);
    if (!assigned) return false;

    const matchId = assigned.lecturerId === currentUser.id;
    const matchEmail = Boolean(assigned.lecturerEmail && currentUser.email && assigned.lecturerEmail.toLowerCase() === currentUser.email.toLowerCase());
    const matchName = Boolean(assigned.lecturerName && currentUser.name && (
      assigned.lecturerName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      currentUser.name.toLowerCase().includes(assigned.lecturerName.toLowerCase())
    ));
    return matchId || matchEmail || matchName;
  };

  useEffect(() => {
    if (!selectedWeeklyStudentMatric && activeWeeklyStudents.length > 0) {
      setSelectedWeeklyStudentMatric(activeWeeklyStudents[0].studentMatric);
    }
  }, [activeWeeklyStudents, selectedWeeklyStudentMatric]);

  const currentSelectedStudent = useMemo(() => {
    return activeWeeklyStudents.find(s => s.studentMatric === selectedWeeklyStudentMatric) || activeWeeklyStudents[0];
  }, [activeWeeklyStudents, selectedWeeklyStudentMatric]);

  const studentWeeklyEvalsMap = useMemo(() => {
    if (!currentSelectedStudent) return new Map<number, StudentEvaluation>();
    const map = new Map<number, StudentEvaluation>();
    evaluations.forEach(e => {
      const matchStudent = e.studentMatric === currentSelectedStudent.studentMatric || e.studentId === currentSelectedStudent.studentId;
      const matchCourse = e.courseCode === selectedWeeklyCourseCode;
      const isWeekly = e.evaluationType === 'weekly' || (e.weekNumber !== undefined && e.weekNumber !== null);
      if (matchStudent && matchCourse && isWeekly && e.weekNumber) {
        map.set(e.weekNumber, e);
      }
    });
    return map;
  }, [evaluations, currentSelectedStudent, selectedWeeklyCourseCode]);

  const currentWeeklyConfigs = useMemo(() => {
    return UTEM_WEEKLY_ASSESSMENTS[selectedWeeklyCourseCode] || [];
  }, [selectedWeeklyCourseCode]);

  const activeCourseSequenceItem = useMemo(() => {
    return WBL_COURSE_SEQUENCE.find(c => c.courseCode === selectedWeeklyCourseCode) || WBL_COURSE_SEQUENCE[0];
  }, [selectedWeeklyCourseCode]);

  // Open Weekly Assessment Form Modal
  const handleOpenWeeklyModal = (weekConfig: WeeklyAssessmentConfig) => {
    const existing = studentWeeklyEvalsMap.get(weekConfig.week);
    setEvaluatingWeekConfig(weekConfig);
    setEvaluatingExistingEval(existing || null);

    if (existing && existing.weeklyScores) {
      setWeeklyAreaScores({
        area1: existing.weeklyScores.area1 ?? 3,
        area2: existing.weeklyScores.area2 ?? 3,
        area3: existing.weeklyScores.area3 ?? 3
      });
      setWeeklyTrainerComments(existing.trainerComments || '');
      setWeeklyTrainerRecommendation(existing.trainerRecommendation || '');
      setWeeklyDeliverableNotes(existing.weeklyDeliverableNotes || '');
    } else {
      setWeeklyAreaScores({ area1: 3, area2: 3, area3: 3 });
      setWeeklyTrainerComments(
        `Pelajar telah menyempurnakan tugasan Minggu ${weekConfig.week} dengan baik dan mematuhi standard industri. Hasil kerja dinilai memenuhi CLO yang ditetapkan.`
      );
      setWeeklyTrainerRecommendation('Meneruskan ketekalan kerja industri dan melengkapkan catatan refleksi.');
      setWeeklyDeliverableNotes('');
    }

    if (currentSelectedStudent) {
      const allLogs = StorageService.getWeeklyLogbooks();
      const matchLog = allLogs.find(l => 
        (l.studentMatric === currentSelectedStudent.studentMatric || l.studentId === currentSelectedStudent.studentId) &&
        l.weekNumber === weekConfig.week
      );
      setStudentWeeklyLogbook(matchLog || null);
    }

    setIsWeeklyModalOpen(true);
  };

  // Save Weekly Assessment
  const handleSaveWeeklyEvaluation = async (submitNow: boolean = false) => {
    if (!evaluatingWeekConfig || !currentSelectedStudent) return;
    setIsSaving(true);
    try {
      const assignment = getCourseAssignedLecturer(selectedWeeklyCourseCode);
      const weeklySum = weeklyAreaScores.area1 + weeklyAreaScores.area2 + weeklyAreaScores.area3;
      const totalScore = Math.round((weeklySum / 12) * 100);
      const gradeObj = calculateUTeMGrade(totalScore);

      const evalData: Partial<StudentEvaluation> & { studentId: string; courseCode: string } = {
        id: evaluatingExistingEval?.id,
        studentId: currentSelectedStudent.studentId,
        studentName: currentSelectedStudent.studentName,
        studentMatric: currentSelectedStudent.studentMatric,
        studentProgram: currentSelectedStudent.studentProgram,
        companyName: currentSelectedStudent.companyName,
        courseCode: selectedWeeklyCourseCode,
        courseName: evaluatingWeekConfig.courseName,
        evaluationType: 'weekly',
        weekNumber: evaluatingWeekConfig.week,
        startDate: evaluatingWeekConfig.startDate,
        endDate: evaluatingWeekConfig.endDate,
        weeklyTaskTitle: evaluatingWeekConfig.taskTitle,
        weeklyDeliverableNotes,
        weeklyScores: {
          area1: weeklyAreaScores.area1,
          area2: weeklyAreaScores.area2,
          area3: weeklyAreaScores.area3,
          total: weeklySum
        },
        trainerId: currentUser.id,
        trainerName: currentUser.name,
        trainerPosition: currentUser.company_position || currentUser.company_affiliation || 'Jurulatih Industri',
        trainerCompany: currentUser.company_affiliation || currentSelectedStudent.companyName,
        trainerEmail: currentUser.email,
        trainerPhone: currentUser.phone,
        lecturerId: assignment?.lecturerId || facultyLecturers[0]?.id || '',
        lecturerName: assignment?.lecturerName || facultyLecturers[0]?.name || 'Pensyarah Kursus FPTT',
        lecturerStaffId: assignment?.lecturerStaffId || '',
        lecturerEmail: assignment?.lecturerEmail || '',
        scores: {
          taskKnowledge: Math.round(weeklyAreaScores.area1 * 2.5),
          workQuality: Math.round(weeklyAreaScores.area2 * 2.5),
          problemSolving: Math.round(weeklyAreaScores.area3 * 2.5),
          toolCompetency: 8,
          punctuality: 9,
          communication: 8,
          workEthics: 9,
          adaptability: 8,
          logbookQuality: 8,
          reflectionQuality: 8
        },
        technicalSubtotal: weeklyAreaScores.area1,
        softSkillsSubtotal: weeklyAreaScores.area2,
        logbookSubtotal: weeklyAreaScores.area3,
        totalScore,
        grade: gradeObj.grade,
        trainerComments: weeklyTrainerComments,
        trainerRecommendation: weeklyTrainerRecommendation,
        status: submitNow ? 'submitted_by_trainer' : 'draft',
        submittedAt: submitNow ? new Date().toISOString() : evaluatingExistingEval?.submittedAt
      };

      await StorageService.saveEvaluation(evalData);
      toast.success(
        submitNow 
          ? `Markah Minggu ${evaluatingWeekConfig.week} berjaya dihantar kepada Pensyarah Kursus (${assignment?.lecturerName || 'Ditugaskan'}) untuk pengesahan!` 
          : `Draf penilaian Minggu ${evaluatingWeekConfig.week} berjaya disimpan.`
      );
      setIsWeeklyModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(`Gagal menyimpan penilaian: ${err.message || 'Ralat'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Verify Weekly Assessment by Assigned Course Lecturer
  const handleVerifyWeeklyEvaluation = async (evaluationId: string, comments?: string) => {
    setIsSaving(true);
    try {
      await StorageService.verifyEvaluationByLecturer(evaluationId, {
        lecturerComments: comments || 'Markah penilaian hasil kerja mingguan disahkan memenuhi sukatan kursus WBL oleh pensyarah kursus.',
        verifiedByLecturerName: currentUser.name
      });
      loadData();
      setIsWeeklyModalOpen(false);
      toast.success(language === 'ms' 
        ? `Markah mingguan telah berjaya DISAHKAN oleh Pensyarah Kursus (${currentUser.name})!` 
        : `Weekly mark verified successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengesahkan markah');
    } finally {
      setIsSaving(false);
    }
  };

  // Print weekly assessment sheet
  const handlePrintWeeklyEvaluation = (existingEval: StudentEvaluation | undefined, weekConfig: WeeklyAssessmentConfig) => {
    if (!currentSelectedStudent) return;
    const evalObj: StudentEvaluation = existingEval || {
      id: `temp_${weekConfig.week}`,
      studentId: currentSelectedStudent.studentId,
      studentName: currentSelectedStudent.studentName,
      studentMatric: currentSelectedStudent.studentMatric,
      studentProgram: currentSelectedStudent.studentProgram,
      companyName: currentSelectedStudent.companyName,
      courseCode: selectedWeeklyCourseCode,
      courseName: weekConfig.courseName,
      evaluationType: 'weekly',
      weekNumber: weekConfig.week,
      startDate: weekConfig.startDate,
      endDate: weekConfig.endDate,
      weeklyTaskTitle: weekConfig.taskTitle,
      weeklyScores: { area1: 3, area2: 3, area3: 3, total: 9 },
      trainerId: currentUser.id,
      trainerName: currentUser.name,
      trainerPosition: currentUser.company_position || 'Jurulatih Industri',
      trainerCompany: currentSelectedStudent.companyName,
      lecturerId: '',
      lecturerName: 'Pensyarah Kursus FPTT',
      scores: {
        taskKnowledge: 8, workQuality: 8, problemSolving: 8, toolCompetency: 8,
        punctuality: 8, communication: 8, workEthics: 8, adaptability: 8,
        logbookQuality: 8, reflectionQuality: 8
      },
      technicalSubtotal: 3, softSkillsSubtotal: 3, logbookSubtotal: 3,
      totalScore: 75, grade: 'B+',
      trainerComments: 'Pelajar menunjukkan komitmen baik.',
      status: 'submitted_by_trainer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    generateWeeklyStudentAssessmentPrint(evalObj, weekConfig, language);
  };

  // Handle open Evaluation Form (new or edit)
  const handleOpenForm = (existing?: StudentEvaluation, presetStudent?: any, presetCourseCode?: string) => {
    if (existing) {
      setEditingEvaluation(existing);
    } else {
      // Determine default course
      const targetCourseCode = presetCourseCode || (selectedCourseFilter !== 'all' ? selectedCourseFilter : 'BTMT 3273(i)');
      const defaultCourse = courseAssignments.find(ca => ca.courseCode === targetCourseCode) || courseAssignments[0] || {
        courseCode: 'BTMT 3273(i)',
        courseName: 'Keusahawanan Digital',
        lecturerId: facultyLecturers[0]?.id || '',
        lecturerName: facultyLecturers[0]?.name || 'Pensyarah Kursus FPTT'
      };

      const firstApp = presetStudent || myCompanyStudents[0];
      const studentUser = firstApp 
        ? users.find(u => 
            (presetStudent?.studentId && (u.id === presetStudent.studentId || u.matric_no === presetStudent.studentId)) ||
            (firstApp.student_id && (u.matric_no === firstApp.student_id || u.id === firstApp.student_id)) ||
            (firstApp.studentMatric && u.matric_no === firstApp.studentMatric) ||
            (firstApp.created_by && u.username === firstApp.created_by)
          ) 
        : null;

      const studentName = presetStudent?.studentName || firstApp?.student_name || studentUser?.name || '';
      const studentMatric = presetStudent?.studentMatric || firstApp?.student_id || firstApp?.studentMatric || studentUser?.matric_no || '';
      const studentId = studentUser?.id || presetStudent?.studentId || firstApp?.student_id || studentMatric || 'student';
      const studentProgram = presetStudent?.studentProgram || firstApp?.student_program || studentUser?.academic_level || 'SARJANA MUDA TEKNOUSAHAWANAN DENGAN KEPUJIAN (BTEC)';

      const template: Partial<StudentEvaluation> = {
        studentId,
        studentName,
        studentMatric,
        studentProgram,
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
    if (!canUserVerifyCourse(reviewingEvaluation.courseCode)) {
      const assigned = getCourseAssignedLecturer(reviewingEvaluation.courseCode);
      toast.error(
        language === 'ms'
          ? `Hanya pensyarah yang ditugaskan (${assigned?.lecturerName || 'Pensyarah Kursus'}) atau Penyelaras WBL yang berkuasa mengesahkan markah ini.`
          : `Only the assigned course lecturer (${assigned?.lecturerName || 'Course Lecturer'}) or Coordinator can verify these marks.`
      );
      return;
    }
    setIsSaving(true);
    try {
      const verified = await StorageService.verifyEvaluationByLecturer(reviewingEvaluation.id, {
        lecturerComments: lecturerCommentsInput.trim() || 'Markah dan pencapaian industri disahkan memenuhi sukatan kursus WBL.',
        verifiedByLecturerName: currentUser.name
      });

      loadData();
      setReviewingEvaluation(null);
      toast.success(language === 'ms' 
        ? `Penilaian bagi ${verified.studentName} (${verified.courseCode}) telah berjaya DISAHKAN oleh ${currentUser.name}!` 
        : `Evaluation for ${verified.studentName} verified successfully by ${currentUser.name}!`);
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

    const lecturer = facultyLecturers.find(l => l.id === editingAssignment.lecturerId) ||
                     users.find(u => u.id === editingAssignment.lecturerId);
    if (!lecturer) {
      toast.error(language === 'ms' ? 'Pensyarah tidak dijumpai.' : 'Lecturer not found.');
      return;
    }

    setIsSaving(true);
    try {
      await StorageService.saveCourseAssignment({
        ...editingAssignment,
        courseCode: editingAssignment.courseCode.trim(),
        courseName: editingAssignment.courseName || editingAssignment.courseCode,
        lecturerId: lecturer.id,
        lecturerName: lecturer.name,
        lecturerStaffId: (lecturer as any).staff_id || '',
        lecturerEmail: lecturer.email || ''
      });

      loadData();
      setIsAssignModalOpen(false);
      setEditingAssignment(null);
      toast.success(language === 'ms' 
        ? `Pensyarah ${lecturer.name} berjaya ditetapkan bagi kursus ${editingAssignment.courseCode}!` 
        : 'Course lecturer settings updated!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tetapan');
    } finally {
      setIsSaving(false);
    }
  };

  // Assigned courses for current lecturer
  const myAssignedCourses = useMemo(() => {
    if (isLecturer && !isCoordinator) {
      const myCourses = courseAssignments.filter(ca => 
        ca.lecturerId === currentUser.id || 
        (ca.lecturerEmail && currentUser.email && ca.lecturerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (ca.lecturerName && currentUser.name && (
          ca.lecturerName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(ca.lecturerName.toLowerCase())
        ))
      );
      return myCourses;
    }
    return courseAssignments;
  }, [courseAssignments, currentUser, isLecturer, isCoordinator]);

  // All student users
  const studentUsersList = useMemo(() => {
    return users.filter(u => u.role === UserRole.STUDENT);
  }, [users]);

  // Course Ledger Print Handler
  const handlePrintCourseLedger = (course: CourseLecturerAssignment) => {
    const enrolledIds = course.assignedStudentIds || [];
    const evalStudentIds = evaluations.filter(e => e.courseCode === course.courseCode).map(e => e.studentId);
    const combinedIds = Array.from(new Set([...enrolledIds, ...evalStudentIds]));

    const records: CourseStudentGradeRecord[] = combinedIds.map(sId => {
      const studentUser = users.find(u => u.id === sId || u.matric_no === sId);
      const studentApp = applications.find(a => 
        (a.student_id === sId || (studentUser && (a.student_id === studentUser.matric_no || a.created_by === studentUser.username))) && 
        (a.application_status === 'Diluluskan' || a.student_preferred)
      );
      const ev = evaluations.find(e => 
        (e.studentId === sId || (studentUser && (e.studentId === studentUser.id || e.studentMatric === studentUser.matric_no))) && 
        e.courseCode === course.courseCode
      );

      return {
        studentMatric: studentUser?.matric_no || studentApp?.student_id || sId,
        studentName: studentUser?.name || studentApp?.student_name || 'Pelajar WBL',
        studentProgram: studentUser?.academic_level || studentApp?.student_program || 'BTEC',
        companyName: ev?.companyName || studentApp?.company_name || studentUser?.company_affiliation || 'Organisasi Latihan Industri',
        trainerName: ev?.trainerName || studentUser?.industry_trainer_name || 'Jurulatih Industri',
        technicalSubtotal: ev?.technicalSubtotal || 0,
        softSkillsSubtotal: ev?.softSkillsSubtotal || 0,
        logbookSubtotal: ev?.logbookSubtotal || 0,
        totalScore: ev?.totalScore || 0,
        grade: ev?.grade || '-',
        status: (ev ? ev.status : 'unassessed') as any,
        verifiedAt: ev?.verifiedAt
      };
    });

    generateCourseGradeSummaryPrint(
      {
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
        creditHours: 3,
        lecturerName: course.lecturerName,
        lecturerStaffId: course.lecturerStaffId
      },
      records,
      language
    );
  };

  // Send single reminder to trainer
  const handleSendReminderToTrainer = async (studentName: string, studentMatric: string, courseCode: string, trainerId?: string, trainerName?: string) => {
    try {
      setIsSendingReminder(`${studentMatric}_${courseCode}`);
      await StorageService.sendTrainerEvaluationReminder({
        studentName,
        studentMatric,
        courseCode,
        trainerId,
        trainerName,
        senderName: currentUser.name
      });
      toast.success(language === 'ms' 
        ? `Peringatan penilaian bagi ${studentName} berjaya dihantar kepada Jurulatih Industri!` 
        : `Evaluation reminder for ${studentName} sent to trainer!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar peringatan');
    } finally {
      setIsSendingReminder(null);
    }
  };

  // Send bulk reminders
  const handleSendBulkReminders = async (unassessedList: any[], courseCode: string) => {
    if (unassessedList.length === 0) return;
    try {
      setIsSaving(true);
      for (const item of unassessedList) {
        await StorageService.sendTrainerEvaluationReminder({
          studentName: item.studentName,
          studentMatric: item.studentMatric,
          courseCode,
          trainerId: item.trainerId,
          trainerName: item.trainerName,
          senderName: currentUser.name
        });
      }
      toast.success(language === 'ms' 
        ? `Peringatan telah dihantar kepada ${unassessedList.length} orang jurulatih industri bagi kursus ${courseCode}!` 
        : `Sent reminders to ${unassessedList.length} industry trainers!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghantar peringatan');
    } finally {
      setIsSaving(false);
    }
  };

  // Coordinator: Enroll selected students
  const handleEnrollSelectedStudents = async (courseCode: string) => {
    if (selectedStudentsToEnroll.length === 0) {
      toast.error(language === 'ms' ? 'Sila tandakan sekurang-kurangnya seorang pelajar.' : 'Please select at least one student.');
      return;
    }
    setIsSaving(true);
    try {
      await StorageService.enrollStudentsInCourse(courseCode, selectedStudentsToEnroll);
      loadData();
      setSelectedStudentsToEnroll([]);
      toast.success(language === 'ms' 
        ? `Berjaya mendaftarkan ${selectedStudentsToEnroll.length} pelajar ke kursus ${courseCode}!` 
        : `Successfully enrolled ${selectedStudentsToEnroll.length} students into ${courseCode}!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftar pelajar');
    } finally {
      setIsSaving(false);
    }
  };

  // Coordinator: Enroll all available students
  const handleEnrollAllAvailableStudents = async (courseCode: string, availableStudentIds: string[]) => {
    if (availableStudentIds.length === 0) {
      toast.error(language === 'ms' ? 'Tiada pelajar baharu untuk dienrol.' : 'No available students to enroll.');
      return;
    }
    setIsSaving(true);
    try {
      await StorageService.enrollStudentsInCourse(courseCode, availableStudentIds);
      loadData();
      setSelectedStudentsToEnroll([]);
      toast.success(language === 'ms' 
        ? `Berjaya mendaftarkan semua ${availableStudentIds.length} pelajar ke kursus ${courseCode}!` 
        : `Successfully enrolled all ${availableStudentIds.length} students into ${courseCode}!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftar pelajar');
    } finally {
      setIsSaving(false);
    }
  };

  // Coordinator: Unenroll single student
  const handleUnenrollSingleStudent = async (courseCode: string, studentId: string, studentName: string) => {
    if (!window.confirm(language === 'ms' 
      ? `Adakah anda pasti mahu mengeluarkan pelajar "${studentName}" daripada kursus ${courseCode}?` 
      : `Are you sure you want to unenroll student "${studentName}" from course ${courseCode}?`)) {
      return;
    }
    setIsSaving(true);
    try {
      await StorageService.unenrollStudentFromCourse(courseCode, studentId);
      loadData();
      toast.success(language === 'ms' 
        ? `Pelajar "${studentName}" berjaya dikeluarkan daripada kursus ${courseCode}.` 
        : `Student "${studentName}" unenrolled from ${courseCode}.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengeluarkan pelajar');
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {/* Tab 0: Pentaksiran Hasil Kerja Mingguan (4 Modul 5 Minggu & 20 Minggu PSM2) */}
        <button
          onClick={() => {
            setActiveTab('weeklyAssessment');
            if (onNavigate) onNavigate('weeklyAssessment');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'weeklyAssessment'
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-md font-black ring-2 ring-blue-400/30'
              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
          }`}
        >
          <CalendarCheck size={15} className={activeTab === 'weeklyAssessment' ? 'text-amber-300' : 'text-blue-600'} />
          <span>{language === 'ms' ? 'Pentaksiran Kerja Mingguan' : 'Weekly Work Assessment'}</span>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full shadow-xs">
            5 Mgg & 20 Mgg PSM2
          </span>
        </button>

        {/* Tab 1: Senarai Penilaian */}
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
          <span>{language === 'ms' ? 'Borang & Senarai Penilaian' : 'Evaluation Forms & List'}</span>
          {stats.pendingVerification > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {stats.pendingVerification}
            </span>
          )}
        </button>

        {/* Tab 2: Pemantauan Kursus Pensyarah (for Course Lecturer & Coordinator) */}
        {(isLecturer || isCoordinator) && (
          <button
            onClick={() => {
              setActiveTab('courseMonitoring');
              if (onNavigate) onNavigate('lecturerCourseMonitoring');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'courseMonitoring'
                ? 'bg-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <GraduationCap size={15} />
            <span>{language === 'ms' ? 'Pemantauan Kursus Pensyarah' : 'Course Lecturer Monitoring'}</span>
            <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'courseMonitoring' ? 'bg-indigo-400 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {myAssignedCourses.length} {language === 'ms' ? 'Kursus' : 'Courses'}
            </span>
            {stats.pendingVerification > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {stats.pendingVerification}
              </span>
            )}
          </button>
        )}

        {/* Tab 3: Enrolmen Kursus Pelajar (for Coordinator & JKWBL only) */}
        {isCoordinator && (
          <button
            onClick={() => {
              setActiveTab('enrollment');
              if (onNavigate) onNavigate('courseEnrollment');
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'enrollment'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <UserPlus size={14} />
            <span>{language === 'ms' ? 'Enrolmen Kursus Pelajar' : 'Student Course Enrollment'}</span>
            <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {studentUsersList.length} {language === 'ms' ? 'Pelajar' : 'Students'}
            </span>
          </button>
        )}

        {/* Tab 4: Coordinator Course Lecturer Settings Tab */}
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

        {/* Tab 5: Rubrik & Skala Gred */}
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

        {/* Tab 6: Pengumuman Kursus (Bagi Semua Kursus & Penjejakan Pembacaan) */}
        <button
          onClick={() => {
            setActiveTab('announcements');
            if (onNavigate) onNavigate('courseAnnouncements');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
          }`}
        >
          <Megaphone size={14} />
          <span>{language === 'ms' ? 'Pengumuman Kursus' : 'Course Announcements'}</span>
          <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full shadow-xs">
            📢 Baru
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: PENTAKSIRAN KERJA MINGGUAN JURULATIH INDUSTRI (JI)                 */}
      {/* 4 MODUL (5 MINGGU) & PSM II (20 MINGGU BERMULA 28 SEPTEMBER 2026)          */}
      {/* ========================================================================= */}
      {activeTab === 'weeklyAssessment' && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-indigo-900/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <CalendarCheck size={14} />
                    <span>Pentaksiran Mingguan Mengikut Minggu</span>
                  </span>
                  <span className="bg-white/10 text-indigo-200 text-xs px-3 py-1 rounded-lg border border-white/15">
                    FPTT 2u2i Work-Based Learning
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                    Tarikh Mula: 28 September 2026
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pentaksiran Hasil Kerja Mingguan oleh Jurulatih Industri (JI)
                </h3>
                <p className="text-xs sm:text-sm text-indigo-200/90 max-w-4xl leading-relaxed">
                  Jurulatih Industri menilai hasil kerja dan kompetensi mingguan pelajar mengikut sukatan rasmi UTeM selama 
                  <strong> 5 minggu bermula Pengurusan Operasi (5 minggu) → Keusahawanan Digital (5 minggu) → Analitik Perniagaan (5 minggu) → Pengurusan Penjenamaan (5 minggu)</strong>, 
                  manakala bagi <strong>Projek Sarjana Muda II (PSM2) dilaksanakan selama 20 minggu penuh bermula 28 September 2026</strong>.
                </p>
              </div>

              {/* Action: Print summary / dossier */}
              <div className="shrink-0 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const scheme = UTEM_PORTFOLIO_SCHEMES[selectedWeeklyCourseCode];
                    generateCourseRubricPrint(selectedWeeklyCourseCode, language);
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={15} />
                  <span>{language === 'ms' ? 'Skema Rubrik Kursus' : 'Course Rubric Scheme'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5 Course Modular Sequence Tabs (Requested Order) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                <span>Pilih Kursus / Modul WBL Mengikut Turutan Rasmi:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                4 Modul @ 5 Minggu + PSM2 @ 20 Minggu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {WBL_COURSE_SEQUENCE.map((c) => {
                const isSelected = selectedWeeklyCourseCode === c.courseCode;
                const totalWeeks = c.durationWeeks;
                
                // Count how many weeks have been evaluated for current student in this course
                let evaluatedCount = 0;
                if (currentSelectedStudent) {
                  evaluations.forEach(e => {
                    const matchSt = e.studentMatric === currentSelectedStudent.studentMatric || e.studentId === currentSelectedStudent.studentId;
                    const matchCr = e.courseCode === c.courseCode;
                    const isWk = e.evaluationType === 'weekly' || (e.weekNumber !== undefined && e.weekNumber !== null);
                    if (matchSt && matchCr && isWk && e.weekNumber) {
                      evaluatedCount++;
                    }
                  });
                }

                return (
                  <button
                    key={c.courseCode}
                    onClick={() => setSelectedWeeklyCourseCode(c.courseCode)}
                    className={`p-4 rounded-2xl text-left transition-all border relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-900 to-indigo-950 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.badge}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${
                          isSelected ? 'text-indigo-200' : 'text-slate-500'
                        }`}>
                          {c.courseCode}
                        </span>
                      </div>

                      <h4 className={`text-xs font-black line-clamp-2 leading-tight mb-1.5 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}>
                        {c.order}. {c.shortName}
                      </h4>

                      <div className={`text-[10px] space-y-0.5 ${
                        isSelected ? 'text-indigo-200/80' : 'text-slate-500'
                      }`}>
                        <div>📅 {c.startDate} - {c.endDate}</div>
                        <div>⚖️ Nisbah: {c.evaluatorRatio}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        Kemajuan:
                      </span>
                      <span className={`font-black px-2 py-0.5 rounded-full ${
                        evaluatedCount >= totalWeeks
                          ? 'bg-emerald-500 text-white'
                          : evaluatedCount > 0
                          ? 'bg-amber-500 text-white'
                          : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {evaluatedCount} / {totalWeeks} Minggu
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Course & Student Selector Strip */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Active Course Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg">
                  {activeCourseSequenceItem.courseCode}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg">
                  {activeCourseSequenceItem.creditHours} Jam Kredit
                </span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-lg">
                  {activeCourseSequenceItem.badge}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg">
                  📅 {activeCourseSequenceItem.startDate} hingga {activeCourseSequenceItem.endDate}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {activeCourseSequenceItem.courseName}
              </h3>
              <p className="text-xs text-slate-500 max-w-3xl">
                {activeCourseSequenceItem.description}
              </p>

              {/* Course Assigned Lecturer Info */}
              {(() => {
                const assignedLec = getCourseAssignedLecturer(activeCourseSequenceItem.courseCode);
                const canVerify = canUserVerifyCourse(activeCourseSequenceItem.courseCode);
                return (
                  <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck size={15} className={canVerify ? "text-emerald-600" : "text-blue-600"} />
                      <span>Pensyarah Pengesah Kursus (Ditugaskan):</span>
                    </span>
                    <span className="bg-indigo-50 text-indigo-950 font-bold px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {assignedLec?.lecturerName || facultyLecturers[0]?.name || (language === 'ms' ? 'Pensyarah Kursus Dilantik' : 'Assigned Lecturer')} {assignedLec?.lecturerStaffId ? `(${assignedLec.lecturerStaffId})` : ''}
                    </span>
                    {isLecturer && (
                      canVerify ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px] border border-emerald-300">
                          ✓ Anda Pensyarah Pengesah Kursus Ini
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                          Ditugaskan kepada pensyarah lain
                        </span>
                      )
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Student Selector */}
            <div className="w-full lg:w-auto bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  <span>Pelajar Yang Dinilai:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({activeWeeklyStudents.length} Pelajar)
                </span>
              </div>

              {activeWeeklyStudents.length > 1 && !isStudent ? (
                <select
                  value={selectedWeeklyStudentMatric}
                  onChange={(e) => setSelectedWeeklyStudentMatric(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {activeWeeklyStudents.map((st) => (
                    <option key={st.studentMatric} value={st.studentMatric}>
                      {st.studentName} ({st.studentMatric}) - {st.companyName}
                    </option>
                  ))}
                </select>
              ) : currentSelectedStudent ? (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    {currentSelectedStudent.studentName.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 leading-tight">
                      {currentSelectedStudent.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentSelectedStudent.studentMatric} • {currentSelectedStudent.companyName}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Cumulative Scorecard for Selected Student & Course */}
          {currentSelectedStudent && (() => {
            const totalWeeksInCourse = activeCourseSequenceItem.durationWeeks;
            const weekConfigs = currentWeeklyConfigs;
            let totalEvaluatedWeeks = 0;
            let totalMarksAccumulated = 0;

            weekConfigs.forEach((wc) => {
              const ev = studentWeeklyEvalsMap.get(wc.week);
              if (ev && ev.weeklyScores) {
                totalEvaluatedWeeks++;
                totalMarksAccumulated += (ev.weeklyScores.total || 0);
              }
            });

            const maxPossible = totalWeeksInCourse * 12;
            const averageScore = totalEvaluatedWeeks > 0 ? (totalMarksAccumulated / totalEvaluatedWeeks) : 0;
            const overallPercent = totalEvaluatedWeeks > 0 ? Math.round((averageScore / 12) * 100) : 0;
            const courseGrade = calculateUTeMGrade(overallPercent);

            // Conversion to official JI component (e.g. 40% or 60%)
            const jiComponentMax = activeCourseSequenceItem.jiWeightPercent;
            const jiWeightedMark = totalEvaluatedWeeks > 0 
              ? ((totalMarksAccumulated / (totalEvaluatedWeeks * 12)) * jiComponentMax).toFixed(1)
              : '0.0';

            return (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 p-5 rounded-3xl shadow-xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-3 border-b border-blue-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      {currentSelectedStudent.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Kad Kemajuan Pentaksiran Mingguan Pelajar
                      </div>
                      <h4 className="text-base font-black text-slate-900">
                        {currentSelectedStudent.studentName} ({currentSelectedStudent.studentMatric})
                      </h4>
                      <div className="text-xs text-slate-600 font-medium">
                        {currentSelectedStudent.companyName} • Jurulatih: <strong>{currentUser.name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Print the first evaluated week or generate rubric
                        const firstEval = studentWeeklyEvalsMap.get(1);
                        if (firstEval && weekConfigs[0]) {
                          generateWeeklyStudentAssessmentPrint(firstEval, weekConfigs[0], language);
                        } else {
                          generateCourseRubricPrint(selectedWeeklyCourseCode, language);
                        }
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Printer size={14} />
                      <span>{language === 'ms' ? 'Cetak Borang Pentaksiran' : 'Print Assessment Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Summary Score Metric Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Block 1 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Status Penilaian
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {totalEvaluatedWeeks} / {totalWeeksInCourse} <span className="text-xs font-medium text-slate-500">Minggu</span>
                    </div>
                    <div className="text-[10px] font-semibold text-blue-600 mt-1">
                      {Math.round((totalEvaluatedWeeks / totalWeeksInCourse) * 100)}% Selesai Dinilai
                    </div>
                  </div>

                  {/* Block 2 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Purata Markah Mingguan
                    </span>
                    <div className="text-xl font-black text-blue-700 mt-0.5">
                      {averageScore.toFixed(1)} <span className="text-xs font-medium text-slate-500">/ 12 Markah</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 mt-1">
                      Setara {overallPercent}% Purata
                    </div>
                  </div>

                  {/* Block 3 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Anggaran Gred Akademik
                    </span>
                    <div className="text-xl font-black text-emerald-600 mt-0.5 flex items-center gap-2">
                      <span>{totalEvaluatedWeeks > 0 ? courseGrade.grade : '-'}</span>
                      {totalEvaluatedWeeks > 0 && (
                        <span className="text-xs font-bold text-slate-600">({courseGrade.status})</span>
                      )}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700 mt-1">
                      Skala UTeM: {courseGrade.pointer.toFixed(2)} Nilai Gred
                    </div>
                  </div>

                  {/* Block 4 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Sumbangan Markah JI ({jiComponentMax}%)
                    </span>
                    <div className="text-xl font-black text-indigo-700 mt-0.5">
                      {jiWeightedMark} <span className="text-xs font-medium text-slate-500">/ {jiComponentMax}%</span>
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-600 mt-1">
                      Komponen Rasmi Jurulatih
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Week-by-Week Interactive Timeline Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <span className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-blue-600" />
                <span className="text-sm">
                  Senarai Tugasan Mingguan & Borang Penilaian ({currentWeeklyConfigs.length} Minggu):
                </span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Setiap minggu dinilai atas 3 bidang (Maks: 12 Markah)
              </span>
            </div>

            {currentWeeklyConfigs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                Tiada konfigurasi tugasan mingguan ditemui bagi kursus ini.
              </div>
            ) : (
              <div className="space-y-4">
                {currentWeeklyConfigs.map((w) => {
                  const ev = studentWeeklyEvalsMap.get(w.week);
                  const isEvaluated = Boolean(ev && ev.weeklyScores);
                  const wTotal = ev?.weeklyScores?.total ?? 0;
                  const wPercent = Math.round((wTotal / 12) * 100);
                  const wGrade = calculateUTeMGrade(wPercent);

                  return (
                    <div
                      key={w.week}
                      className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${
                        isEvaluated
                          ? 'border-emerald-200 hover:border-emerald-300'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Week Card Header */}
                      <div className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
                        ev?.status === 'verified_by_lecturer'
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : ev?.status === 'submitted_by_trainer'
                          ? 'bg-amber-50/50 border-amber-100'
                          : isEvaluated
                          ? 'bg-blue-50/30 border-blue-100'
                          : 'bg-slate-50/70 border-slate-100'
                      }`}>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`font-black text-xs px-3 py-1 rounded-xl font-mono ${
                            ev?.status === 'verified_by_lecturer'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : ev?.status === 'submitted_by_trainer'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : isEvaluated
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-blue-600 text-white shadow-xs'
                          }`}>
                            {w.semesterWeek ? `MINGGU ${w.semesterWeek} (M${w.week})` : `MINGGU ${w.week}`}
                          </span>

                          {w.semesterWeekLabel && (
                            <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              📌 {w.semesterWeekLabel}
                            </span>
                          )}

                          {w.startDate && w.endDate && (
                            <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                              📅 {w.startDate} - {w.endDate}
                            </span>
                          )}

                          {w.milestone && (
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              🎯 {w.milestone}
                            </span>
                          )}

                          {ev?.status === 'verified_by_lecturer' ? (
                            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Disahkan Pensyarah ({ev.verifiedByLecturerName || getCourseAssignedLecturer(selectedWeeklyCourseCode)?.lecturerName || 'Ditugaskan'}): {wTotal} / 12 ({wPercent}%) — Gred {wGrade.grade}</span>
                            </span>
                          ) : ev?.status === 'submitted_by_trainer' ? (
                            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-amber-300 animate-pulse">
                              <Clock size={13} className="text-amber-600" />
                              <span>Menunggu Pengesahan Pensyarah Kursus ({getCourseAssignedLecturer(selectedWeeklyCourseCode)?.lecturerName || 'Ditugaskan'}) • Markah: {wTotal} / 12</span>
                            </span>
                          ) : isEvaluated ? (
                            <span className="text-xs font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Save size={13} className="text-blue-600" />
                              <span>Draf: {wTotal} / 12 ({wPercent}%)</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock size={13} className="text-amber-600" />
                              <span>Menunggu Penilaian Jurulatih</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {isEvaluated && (
                            <button
                              onClick={() => handlePrintWeeklyEvaluation(ev, w)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                              title="Cetak Borang Pentaksiran Minggu Ini"
                            >
                              <Printer size={13} />
                              <span className="hidden sm:inline">Cetak</span>
                            </button>
                          )}

                          {/* Verification action for assigned course lecturer */}
                          {ev && ev.status === 'submitted_by_trainer' && (
                            canUserVerifyCourse(selectedWeeklyCourseCode) ? (
                              <button
                                onClick={() => handleOpenReviewModal(ev)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
                                title="Semak dan sahkan markah minggu ini sebagai pensyarah kursus yang ditugaskan"
                              >
                                <ShieldCheck size={14} />
                                <span>Sahkan Markah</span>
                              </button>
                            ) : (
                              isLecturer && (
                                <span className="text-[11px] text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200" title={`Hanya ${getCourseAssignedLecturer(selectedWeeklyCourseCode)?.lecturerName || 'pensyarah kursus'} boleh mengesahkan`}>
                                  Pengesah: {getCourseAssignedLecturer(selectedWeeklyCourseCode)?.lecturerName?.split(' ')?.[0] || 'Ditugaskan'}
                                </span>
                              )
                            )
                          )}

                          {(isTrainer || isCoordinator) && (
                            <button
                              onClick={() => handleOpenWeeklyModal(w)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${
                                isEvaluated
                                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                            >
                              <Edit3 size={14} />
                              <span>{isEvaluated ? 'Kemaskini Markah' : 'Nilai Minggu Ini'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Week Card Body */}
                      <div className="p-5 space-y-4">
                        {/* Task Title & CLO */}
                        <div className="space-y-1">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {w.taskTitle}
                          </h4>
                          <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                            <Sparkles size={13} className="text-blue-500 shrink-0" />
                            <span>{w.cloStatement}</span>
                          </div>
                        </div>

                        {/* Key Task Highlights */}
                        {w.taskHighlights && w.taskHighlights.length > 0 && (
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                              Fokus Tugasan & Aktiviti Industri (Minggu {w.week}):
                            </span>
                            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-700">
                              {w.taskHighlights.map((hl, hIdx) => (
                                <li key={hIdx} className="flex items-start gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <span>{hl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 3 Assessment Areas with Rubric Scores */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                            3 Bidang Pentaksiran Prestasi (Skema 12 Markah):
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {w.areas.map((area, aIdx) => {
                              const scoreVal = isEvaluated && ev?.weeklyScores 
                                ? (aIdx === 0 ? ev.weeklyScores.area1 : aIdx === 1 ? ev.weeklyScores.area2 : ev.weeklyScores.area3)
                                : null;

                              return (
                                <div
                                  key={area.id}
                                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                                    scoreVal !== null
                                      ? 'bg-slate-50/80 border-slate-200'
                                      : 'bg-white border-slate-200/80'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                      <span>Bidang {aIdx + 1}</span>
                                      <span className="font-mono">Maks: 4 Markah</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 leading-snug">
                                      {area.title}
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-[11px] text-slate-500">Skor Dinilai:</span>
                                    {scoreVal !== null ? (
                                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                        scoreVal === 4 ? 'bg-emerald-100 text-emerald-800' :
                                        scoreVal === 3 ? 'bg-blue-100 text-blue-800' :
                                        scoreVal === 2 ? 'bg-amber-100 text-amber-800' :
                                        'bg-rose-100 text-rose-800'
                                      }`}>
                                        {scoreVal} / 4 ({
                                          scoreVal === 4 ? 'Cemerlang' :
                                          scoreVal === 3 ? 'Baik' :
                                          scoreVal === 2 ? 'Sederhana' : 'Lemah'
                                        })
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-medium italic">
                                        Belum dinilai
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Trainer Feedback snippet if evaluated */}
                        {isEvaluated && ev?.trainerComments && (
                          <div className="bg-amber-50/60 border border-amber-200/70 p-3.5 rounded-2xl text-xs space-y-1">
                            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                              <Star size={13} className="text-amber-600 fill-amber-500" />
                              <span>Ulasan & Maklum Balas Jurulatih Industri ({ev.trainerName}):</span>
                            </span>
                            <p className="text-slate-700 italic">
                              "{ev.trainerComments}"
                            </p>
                            {ev.trainerRecommendation && (
                              <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                                💡 Syor Bimbingan: {ev.trainerRecommendation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          {/* Pilihan Borang Penilaian Mengikut Minggu (Khusus untuk Jurulatih Industri & Penyelaras) */}
          <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  {language === 'ms' ? '🗓️ PILIHAN BORANG PENTAKSIRAN MENGIKUT MINGGU' : '🗓️ WEEKLY ASSESSMENT FORM CHOICE'}
                </span>
                <span className="text-[11px] bg-white/20 text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                  {language === 'ms' ? 'Minggu 1 hingga Minggu 20 (Silibus WBL UTeM)' : 'Week 1 to Week 20 (UTeM WBL Syllabus)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {language === 'ms' 
                  ? 'Borang Penilaian Markah Tugasan Pelajar Mengikut Minggu' 
                  : 'Weekly Student Task & Performance Evaluation Form'}
              </h3>
              <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
                {language === 'ms'
                  ? 'Jurulatih Industri boleh memilih borang penilaian mengikut minggu bagi menilai tugasan amali, kemahiran teknikal, dan kualiti kerja pelajar secara berperingkat dari Minggu 1 hingga 20 dengan skema 12 markah mengikut CLO rasmi UTeM.'
                  : 'Industry Trainers can select weekly evaluation forms to score practical tasks, technical skills, and work quality progressively from Week 1 to 20 with the 12-mark rubric based on official UTeM CLO.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (selectedCourseFilter !== 'all') {
                    setSelectedWeeklyCourseCode(selectedCourseFilter);
                  }
                  setActiveTab('weeklyAssessment');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
              >
                <CalendarCheck size={16} />
                <span>{language === 'ms' ? 'Buka Borang Ikut Minggu (Minggu 1 - 20) →' : 'Open Weekly Form (Weeks 1 - 20) →'}</span>
              </button>
            </div>
          </div>
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

          {/* ========================================================================= */}
          {/* PANEL KHAS PENILAIAN JURULATIH INDUSTRI MENGIKUT KURSUS SEMESTER SEMASA  */}
          {/* ========================================================================= */}
          {isTrainer && (
            <div className="space-y-4">
              {selectedCourseFilter !== 'all' ? (
                (() => {
                  const currentCourse = courseAssignments.find(c => c.courseCode === selectedCourseFilter);
                  const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
                  const matchingTrainees = applications.filter(a => 
                    (a.application_status === 'Diluluskan' || a.student_preferred) &&
                    (!trainerComp || (a.company_name && a.company_name.toLowerCase().includes(trainerComp)))
                  );

                  return (
                    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 rounded-2xl text-white shadow-md space-y-5">
                      {/* Course Header Bar */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-lg font-black text-xs font-mono">
                              {selectedCourseFilter}
                            </span>
                            <span className="text-xs text-blue-200">
                              {currentCourse?.semester || 'Semester 7'} • 3 Jam Kredit
                            </span>
                            <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                              {matchingTrainees.length} {language === 'ms' ? 'Pelatih Syarikat Anda' : 'Company Trainees'}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white tracking-tight">
                            {currentCourse?.courseName || selectedCourseFilter}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200/90 pt-0.5">
                            <span>
                              🏢 {currentUser.company_affiliation || 'Syarikat Penempatan Industri'}
                            </span>
                            <span>
                              👨‍🏫 {language === 'ms' ? 'Pensyarah Pengesah FPTT:' : 'Course Lecturer:'} <strong className="text-white">{currentCourse?.lecturerName || 'Pensyarah Kursus'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenForm(undefined, undefined, selectedCourseFilter)}
                            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Plus size={16} />
                            <span>{language === 'ms' ? '+ Nilai Pelajar Kursus Ini' : '+ Evaluate Student'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCourseFilter('all')}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors"
                          >
                            {language === 'ms' ? 'Tunjuk Semua Kursus' : 'Show All Courses'}
                          </button>
                        </div>
                      </div>

                      {/* Trainees List for This Course */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-amber-400" />
                            <span>{language === 'ms' ? 'Senarai Pelatih Syarikat untuk Dinilai (Rubrik UTeM)' : 'Company Trainees to Evaluate (UTeM Rubric)'}</span>
                          </h4>
                          <span className="text-[11px] text-blue-200/70">
                            {language === 'ms' ? 'Pilih "Nilai Sekarang" untuk membuka borang rubrik 4-tahap' : 'Click "Evaluate Now" to open 4-band rubric form'}
                          </span>
                        </div>

                        {matchingTrainees.length === 0 ? (
                          <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-2">
                            <p className="text-xs text-blue-200">
                              {language === 'ms' 
                                ? 'Tiada pelatih ditemui untuk syarikat anda pada masa ini.' 
                                : 'No trainees currently registered under your company.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenForm(undefined, undefined, selectedCourseFilter)}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              {language === 'ms' ? 'Isi Borang Penilaian Manual' : 'Fill Form Manually'}
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {matchingTrainees.map(tr => {
                              const trEval = evaluations.find(e => 
                                (e.studentId === tr.student_id || e.studentMatric === tr.student_id || e.studentName === tr.student_name) && 
                                e.courseCode === selectedCourseFilter
                              );

                              const isVerified = trEval?.status === 'verified_by_lecturer';
                              const isSubmitted = trEval?.status === 'submitted_by_trainer';
                              const isRevision = trEval?.status === 'revision_requested';
                              const isDraft = trEval?.status === 'draft';

                              return (
                                <div 
                                  key={tr.id} 
                                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                                    isVerified 
                                      ? 'bg-emerald-950/40 border-emerald-500/40' 
                                      : isSubmitted
                                      ? 'bg-amber-950/30 border-amber-500/40'
                                      : isRevision
                                      ? 'bg-rose-950/40 border-rose-500/40'
                                      : 'bg-white/10 border-white/15 hover:border-white/30'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                        <span>{tr.student_name}</span>
                                      </div>
                                      <div className="text-[11px] text-amber-300 font-mono font-semibold">
                                        {tr.student_id}
                                      </div>
                                      <div className="text-[10px] text-blue-200/80 truncate max-w-[240px]">
                                        {tr.student_program || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)'}
                                      </div>
                                    </div>

                                    {/* Evaluation Status Badge */}
                                    <div className="shrink-0">
                                      {isVerified ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-xs">
                                          <CheckCircle2 size={11} />
                                          <span>✓ Disahkan Pensyarah</span>
                                        </span>
                                      ) : isSubmitted ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 animate-pulse">
                                          <Clock size={11} />
                                          <span>Menunggu Pengesahan</span>
                                        </span>
                                      ) : isRevision ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-400 text-slate-950 flex items-center gap-1">
                                          <AlertCircle size={11} />
                                          <span>Perlu Pembetulan</span>
                                        </span>
                                      ) : isDraft ? (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                                          Draf Disimpan
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/20">
                                          Belum Dinilai
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Score & Action Row */}
                                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                    <div className="text-xs">
                                      {trEval ? (
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-amber-300">
                                            {trEval.totalScore}/100
                                          </span>
                                          <span className="px-1.5 py-0.2 rounded font-black text-[10px] bg-white/20 text-white">
                                            Gred {trEval.grade}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-blue-200/70">
                                          {language === 'ms' ? 'Belum dinilai untuk kursus ini' : 'Not yet evaluated'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                      {trEval ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedWeeklyStudentMatric(tr.student_id);
                                              if (selectedCourseFilter !== 'all') setSelectedWeeklyCourseCode(selectedCourseFilter);
                                              setActiveTab('weeklyAssessment');
                                            }}
                                            className="px-2.5 py-1.5 bg-blue-500/30 hover:bg-blue-500/50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            title="Buka pentaksiran tugasan mingguan pelajar ini"
                                          >
                                            <CalendarCheck size={12} className="text-amber-300" />
                                            <span>{language === 'ms' ? '🗓️ Ikut Minggu' : 'Weekly'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenForm(trEval)}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                          >
                                            <Edit3 size={12} />
                                            <span>{isVerified ? (language === 'ms' ? 'Lihat Borang' : 'View') : (language === 'ms' ? 'Kemaskini' : 'Edit')}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => generateEvaluationPrint(trEval, language)}
                                            className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs transition-colors"
                                            title="Cetak Borang Penilaian Rasmi"
                                          >
                                            <Printer size={13} />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedWeeklyStudentMatric(tr.student_id);
                                              if (selectedCourseFilter !== 'all') setSelectedWeeklyCourseCode(selectedCourseFilter);
                                              setActiveTab('weeklyAssessment');
                                            }}
                                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs transition-all shadow flex items-center gap-1"
                                            title="Nilai tugasan amali pelajar ikut minggu (Minggu 1 - 20)"
                                          >
                                            <CalendarCheck size={13} />
                                            <span>{language === 'ms' ? '🗓️ Borang Ikut Minggu' : 'Weekly Form'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenForm(undefined, tr, selectedCourseFilter)}
                                            className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                                            title="Isi borang penilaian keseluruhan kursus (100%)"
                                          >
                                            <Award size={13} />
                                            <span>{language === 'ms' ? '📋 Penuh (100%)' : 'Full (100%)'}</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Course Cards Grid for Trainer when viewing 'all' */
                <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Award size={16} className="text-blue-600" />
                        <span>{language === 'ms' ? 'Submenu Penilaian Mengikut Kursus Semester Semasa' : 'Course Assessments for Current Semester'}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'ms' 
                          ? 'Pilih mana-mana kursus semester semasa di bawah untuk membuat penilaian bagi pelatih industri syarikat anda.'
                          : 'Select any current semester course to evaluate your company trainees.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {courseAssignments.map(course => {
                      const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
                      const trainees = applications.filter(a => 
                        (a.application_status === 'Diluluskan' || a.student_preferred) &&
                        (!trainerComp || (a.company_name && a.company_name.toLowerCase().includes(trainerComp)))
                      );
                      const courseEvals = evaluations.filter(e => e.courseCode === course.courseCode);
                      const completedCount = trainees.filter(t => {
                        const ev = courseEvals.find(e => e.studentId === t.student_id || e.studentMatric === t.student_id);
                        return ev && (ev.status === 'submitted_by_trainer' || ev.status === 'verified_by_lecturer');
                      }).length;
                      const pendingCount = Math.max(0, trainees.length - completedCount);

                      return (
                        <div 
                          key={course.id || course.courseCode} 
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                {course.courseCode}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {course.semester || 'Semester 7'}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                              {course.courseName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Pensyarah: <strong className="text-slate-800">{getCourseAssignedLecturer(course.courseCode)?.lecturerName || course.lecturerName || 'FPTT'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/70 pt-2">
                            <div className="text-[10px]">
                              {pendingCount > 0 ? (
                                <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  {pendingCount} belum dinilai
                                </span>
                              ) : trainees.length > 0 ? (
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  ✓ Semua dinilai
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {trainees.length} pelatih
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWeeklyCourseCode(course.courseCode);
                                  setActiveTab('weeklyAssessment');
                                }}
                                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs transition-colors flex items-center gap-1 shadow-xs"
                                title="Buka borang pentaksiran tugasan ikut minggu bagi kursus ini"
                              >
                                <CalendarCheck size={12} />
                                <span>{language === 'ms' ? 'Ikut Minggu' : 'Weekly'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedCourseFilter(course.courseCode)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <span>{language === 'ms' ? 'Senarai' : 'List'}</span>
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
                              {/* Open Weekly Assessment Action */}
                              {(isTrainer || isCoordinator || isLecturer) && (
                                <button
                                  onClick={() => {
                                    setSelectedWeeklyStudentMatric(evalItem.studentMatric || evalItem.studentId);
                                    if (evalItem.courseCode) setSelectedWeeklyCourseCode(evalItem.courseCode);
                                    setActiveTab('weeklyAssessment');
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1 border border-blue-200"
                                  title="Buka Pentaksiran Tugasan Ikut Minggu (Minggu 1 - 20) Pelajar Ini"
                                >
                                  <CalendarCheck size={13} className="text-blue-600" />
                                  <span>{language === 'ms' ? 'Ikut Minggu' : 'Weekly'}</span>
                                </button>
                              )}

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
      {/* TAB: PEMANTAUAN KURSUS PENSYARAH (COURSE LECTURER MONITORING DASHBOARD)   */}
      {/* ========================================================================= */}
      {activeTab === 'courseMonitoring' && (isLecturer || isCoordinator) && (
        <div className="space-y-6">
          {/* Header & Course Switcher */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <GraduationCap size={22} />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      {language === 'ms' ? 'Pemantauan Kursus Pensyarah & Penilaian Pelajar' : 'Course Lecturer Monitoring & Assessment'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'ms'
                        ? 'Pantau semua pelajar yang dienrol, semak penilaian prestasi industri yang dihantar oleh jurulatih, dan sahkan gred akademik kursus.'
                        : 'Monitor enrolled students, review submitted industrial assessments, and verify final course grades.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Lecturer Info Card */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 px-4 py-2.5 rounded-xl text-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-indigo-950">{currentUser.name}</div>
                  <div className="text-[11px] text-indigo-700 font-medium">
                    {isCoordinator ? 'Penyelaras WBL (Akses Semua Kursus)' : `Pensyarah Kursus FPTT (${myAssignedCourses.length} kursus ditugaskan)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Course Selector Tabs / Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">
                {language === 'ms' ? 'Pilih Kursus untuk Dipantau:' : 'Select Course to Monitor:'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonitoringCourseCode('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedMonitoringCourseCode === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers size={14} />
                  <span>{language === 'ms' ? 'Semua Kursus Saya' : 'All My Courses'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedMonitoringCourseCode === 'all' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {myAssignedCourses.length}
                  </span>
                </button>

                {myAssignedCourses.map((c) => {
                  const enrolledCount = (c.assignedStudentIds || []).length;
                  const pendingCount = evaluations.filter(e => e.courseCode === c.courseCode && e.status === 'submitted_by_trainer').length;
                  const isSelected = selectedMonitoringCourseCode === c.courseCode;

                  return (
                    <button
                      key={c.id || c.courseCode}
                      type="button"
                      onClick={() => setSelectedMonitoringCourseCode(c.courseCode)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{c.courseCode}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {enrolledCount} {language === 'ms' ? 'pelajar' : 'std'}
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Render Monitoring Content for Course(s) */}
          {(() => {
            // Selected courses to display
            const targetCourses = selectedMonitoringCourseCode === 'all'
              ? myAssignedCourses
              : myAssignedCourses.filter(c => c.courseCode === selectedMonitoringCourseCode);

            if (targetCourses.length === 0) {
              return (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <GraduationCap size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-700">
                    {language === 'ms' ? 'Tiada Kursus Ditugaskan Buat Masa Ini' : 'No Courses Assigned Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {language === 'ms' 
                      ? 'Penyelaras WBL belum menetapkan sebarang kursus di bawah akaun anda. Sila hubungi penyelaras untuk tetapan kursus.'
                      : 'The coordinator has not assigned any courses to your account yet.'}
                  </p>
                </div>
              );
            }

            return targetCourses.map((currentCourse) => {
              // Get enrolled student IDs for this course
              const enrolledIds = currentCourse.assignedStudentIds || [];
              const evalStudentIds = evaluations.filter(e => e.courseCode === currentCourse.courseCode).map(e => e.studentId);
              const allTargetStudentIds = Array.from(new Set([...enrolledIds, ...evalStudentIds]));

              // Build student items
              const studentRows = allTargetStudentIds.map(sId => {
                const studentUser = users.find(u => u.id === sId || u.matric_no === sId);
                const studentApp = applications.find(a => 
                  (a.student_id === sId || (studentUser && (a.student_id === studentUser.matric_no || a.created_by === studentUser.username))) && 
                  (a.application_status === 'Diluluskan' || a.student_preferred)
                );
                const evalData = evaluations.find(e => 
                  (e.studentId === sId || (studentUser && (e.studentId === studentUser.id || e.studentMatric === studentUser.matric_no))) && 
                  e.courseCode === currentCourse.courseCode
                );

                return {
                  studentId: sId,
                  studentUser,
                  studentApp,
                  studentName: studentUser?.name || studentApp?.student_name || 'Pelajar WBL',
                  studentMatric: studentUser?.matric_no || studentApp?.student_id || sId,
                  studentProgram: studentUser?.academic_level || studentApp?.student_program || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)',
                  companyName: evalData?.companyName || studentApp?.company_name || studentUser?.company_affiliation || 'Organisasi Latihan Industri',
                  companyLocation: studentApp?.company_district ? `${studentApp.company_district}, ${studentApp.company_state}` : (studentUser?.address || '-'),
                  trainerId: evalData?.trainerId || studentUser?.industry_trainer_id || 'trainer',
                  trainerName: evalData?.trainerName || studentUser?.industry_trainer_name || 'Jurulatih Industri',
                  trainerPosition: evalData?.trainerPosition || studentUser?.industry_trainer_position || 'Jurulatih Industri',
                  trainerPhone: evalData?.trainerPhone || studentUser?.industry_trainer_phone || '-',
                  trainerEmail: evalData?.trainerEmail || studentUser?.industry_trainer_email || '-',
                  evaluation: evalData,
                  status: evalData ? evalData.status : 'unassessed',
                  totalScore: evalData ? evalData.totalScore : null,
                  grade: evalData ? evalData.grade : null,
                  scores: evalData?.scores
                };
              });

              // Stats for this course
              const totalEnrolled = studentRows.length;
              const countVerified = studentRows.filter(r => r.status === 'verified_by_lecturer').length;
              const countPendingVerify = studentRows.filter(r => r.status === 'submitted_by_trainer').length;
              const countUnassessed = studentRows.filter(r => r.status === 'unassessed').length;
              const countRevision = studentRows.filter(r => r.status === 'revision_requested').length;
              const verifiedScores = studentRows.filter(r => r.status === 'verified_by_lecturer' && r.totalScore !== null).map(r => r.totalScore!);
              const avgScore = verifiedScores.length > 0 ? (verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length).toFixed(1) : '-';

              // Filter rows by search and status
              const filteredRows = studentRows.filter(r => {
                if (monitoringStatusFilter !== 'all' && r.status !== monitoringStatusFilter) {
                  return false;
                }
                if (monitoringSearchQuery.trim()) {
                  const q = monitoringSearchQuery.toLowerCase();
                  const match = 
                    r.studentName.toLowerCase().includes(q) ||
                    r.studentMatric.toLowerCase().includes(q) ||
                    r.companyName.toLowerCase().includes(q) ||
                    r.trainerName.toLowerCase().includes(q);
                  if (!match) return false;
                }
                return true;
              });

              return (
                <div key={currentCourse.id || currentCourse.courseCode} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  {/* Course Title Bar & Actions */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-amber-400 text-slate-900 rounded-lg">
                          {currentCourse.courseCode}
                        </span>
                        <span className="text-xs font-medium text-slate-300">
                          {currentCourse.semester || 'Semester 7'} • 3 Jam Kredit
                        </span>
                        <span className="text-xs bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                          Pensyarah: {currentCourse.lecturerName}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {currentCourse.courseName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Kohort ini mempunyai {totalEnrolled} orang pelajar berdaftar penempatan WBL.
                      </p>
                    </div>

                    {/* Quick Course Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonitoringCourseCode(currentCourse.courseCode);
                          setSelectedCourseFilter(currentCourse.courseCode);
                          setActiveTab('announcements');
                        }}
                        className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Megaphone size={14} />
                        <span>{language === 'ms' ? 'Pengumuman Kursus' : 'Course Announcements'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintCourseLedger(currentCourse)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Printer size={15} />
                        <span>{language === 'ms' ? 'Cetak Senarai Gred UTeM' : 'Print Grade Ledger'}</span>
                      </button>

                      {countUnassessed > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const unassessed = studentRows.filter(r => r.status === 'unassessed');
                            handleSendBulkReminders(unassessed, currentCourse.courseCode);
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Bell size={14} />
                          <span>{language === 'ms' ? `Peringatan (${countUnassessed})` : `Remind (${countUnassessed})`}</span>
                        </button>
                      )}

                      {isCoordinator && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnrollmentCourseCode(currentCourse.courseCode);
                            setActiveTab('enrollment');
                          }}
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <UserPlus size={14} />
                          <span>{language === 'ms' ? 'Urus Enrolmen' : 'Manage Enrollees'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Cards for this Course */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === 'ms' ? 'Pelajar Dienrol' : 'Enrolled Students'}
                      </div>
                      <div className="text-2xl font-black text-slate-800 mt-1">{totalEnrolled}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Kohort Kursus</div>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        {language === 'ms' ? 'Disahkan Pensyarah' : 'Verified by Lecturer'}
                      </div>
                      <div className="text-2xl font-black text-emerald-700 mt-1">{countVerified}</div>
                      <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">
                        {totalEnrolled > 0 ? `${Math.round((countVerified / totalEnrolled) * 100)}% selesai` : '0%'}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${
                      countPendingVerify > 0 
                        ? 'border-amber-300 bg-amber-50 shadow-xs' 
                        : 'border-slate-200 bg-slate-50/70'
                    }`}>
                      <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                        <span>{language === 'ms' ? 'Menunggu Pengesahan' : 'Pending Verify'}</span>
                        {countPendingVerify > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                      </div>
                      <div className="text-2xl font-black text-amber-800 mt-1">{countPendingVerify}</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">Perlu tindakan pensyarah</div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {language === 'ms' ? 'Belum Dinilai Jurulatih' : 'Awaiting Trainer'}
                      </div>
                      <div className="text-2xl font-black text-slate-700 mt-1">{countUnassessed}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Borang belum dihantar</div>
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60">
                      <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                        {language === 'ms' ? 'Purata Markah Kohort' : 'Cohort Average'}
                      </div>
                      <div className="text-2xl font-black text-indigo-800 mt-1">{avgScore}</div>
                      <div className="text-[10px] text-indigo-600 mt-0.5 font-bold">
                        Gred purata disahkan
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={monitoringSearchQuery}
                        onChange={(e) => setMonitoringSearchQuery(e.target.value)}
                        placeholder={language === 'ms' ? 'Cari nama pelajar, no matrik, syarikat, atau jurulatih...' : 'Search student, matric, company...'}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter size={15} className="text-slate-400 shrink-0" />
                      <select
                        value={monitoringStatusFilter}
                        onChange={(e) => setMonitoringStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">{language === 'ms' ? 'Semua Status Penilaian' : 'All Evaluation Status'}</option>
                        <option value="submitted_by_trainer">{language === 'ms' ? 'Menunggu Pengesahan Pensyarah' : 'Pending Verification'}</option>
                        <option value="verified_by_lecturer">{language === 'ms' ? 'Telah Disahkan Pensyarah' : 'Verified by Lecturer'}</option>
                        <option value="unassessed">{language === 'ms' ? 'Belum Dinilai oleh Jurulatih' : 'Awaiting Trainer'}</option>
                        <option value="revision_requested">{language === 'ms' ? 'Semakan Semula Diperlukan' : 'Revision Requested'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3.5 text-center w-12">#</th>
                          <th className="p-3.5">{language === 'ms' ? 'Pelajar & Matrik' : 'Student & Matric'}</th>
                          <th className="p-3.5">{language === 'ms' ? 'Organisasi & Jurulatih' : 'Organization & Coach'}</th>
                          <th className="p-3.5 text-center">{language === 'ms' ? 'Status Penilaian' : 'Status'}</th>
                          <th className="p-3.5 text-center">{language === 'ms' ? 'Skor & Gred UTeM' : 'Scores & Grade'}</th>
                          <th className="p-3.5 text-right">{language === 'ms' ? 'Tindakan Pensyarah' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              {language === 'ms' ? 'Tiada rekod pelajar padan dengan tapisan.' : 'No student records match filter.'}
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row, index) => {
                            const isSubmitted = row.status === 'submitted_by_trainer';
                            const isVerified = row.status === 'verified_by_lecturer';
                            const isUnassessed = row.status === 'unassessed';
                            const isRevision = row.status === 'revision_requested';

                            return (
                              <tr 
                                key={row.studentId} 
                                className={`transition-colors ${
                                  isSubmitted 
                                    ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                                    : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <td className="p-3.5 text-center font-bold text-slate-400">
                                  {index + 1}
                                </td>

                                {/* Student Information */}
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                                      {row.studentName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800">{row.studentName}</div>
                                      <div className="text-[11px] font-mono text-slate-500">{row.studentMatric}</div>
                                      <div className="text-[10px] text-slate-400">{row.studentProgram}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Company & Coach Information */}
                                <td className="p-3.5">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <Building2 size={13} className="text-slate-400 shrink-0" />
                                      <span>{row.companyName}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                      <UserCheck size={12} className="text-blue-500 shrink-0" />
                                      <span>{row.trainerName}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {row.trainerPhone !== '-' ? `Tel: ${row.trainerPhone}` : row.companyLocation}
                                    </div>
                                  </div>
                                </td>

                                {/* Evaluation Status */}
                                <td className="p-3.5 text-center">
                                  {isVerified && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 size={12} />
                                      <span>{language === 'ms' ? 'Disahkan Pensyarah' : 'Verified'}</span>
                                    </span>
                                  )}
                                  {isSubmitted && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                      <Clock size={12} />
                                      <span>{language === 'ms' ? 'Menunggu Pengesahan' : 'Pending Verification'}</span>
                                    </span>
                                  )}
                                  {isRevision && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                      <AlertCircle size={12} />
                                      <span>{language === 'ms' ? 'Semakan Semula' : 'Revision'}</span>
                                    </span>
                                  )}
                                  {isUnassessed && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      <Clock size={12} className="text-slate-400" />
                                      <span>{language === 'ms' ? 'Belum Dinilai Jurulatih' : 'Awaiting Trainer'}</span>
                                    </span>
                                  )}
                                </td>

                                {/* Scores & Grade */}
                                <td className="p-3.5 text-center">
                                  {row.evaluation ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span className="text-sm font-black text-indigo-900">
                                          {row.totalScore}/100
                                        </span>
                                        <span className={`text-xs font-black px-1.5 py-0.2 rounded ${
                                          row.totalScore! >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                          row.totalScore! >= 65 ? 'bg-blue-100 text-blue-800' :
                                          'bg-amber-100 text-amber-800'
                                        }`}>
                                          Gred {row.grade}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        T:{row.evaluation.technicalSubtotal} | I:{row.evaluation.softSkillsSubtotal} | L:{row.evaluation.logbookSubtotal}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">-</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isSubmitted && row.evaluation && (
                                      canUserVerifyCourse(currentCourse.courseCode) ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReviewModal(row.evaluation!)}
                                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black shadow-sm transition-all flex items-center gap-1"
                                          title="Semak dan sahkan penilaian pelajar ini sebagai pensyarah kursus yang ditugaskan"
                                        >
                                          <ShieldCheck size={13} />
                                          <span>{language === 'ms' ? 'Semak & Sahkan' : 'Review & Verify'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReviewModal(row.evaluation!)}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-slate-300"
                                          title={`Pengesah rasmi: ${getCourseAssignedLecturer(currentCourse.courseCode)?.lecturerName || 'Pensyarah Kursus Ditugaskan'}`}
                                        >
                                          <Eye size={13} className="text-slate-500" />
                                          <span>{language === 'ms' ? 'Lihat Markah' : 'View Marks'}</span>
                                        </button>
                                      )
                                    )}

                                    {isVerified && row.evaluation && (
                                      <button
                                        type="button"
                                        onClick={() => generateEvaluationPrint(row.evaluation!, language)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                        title="Papar / Cetak Slip Rasmi UTeM"
                                      >
                                        <Printer size={13} />
                                        <span>Slip</span>
                                      </button>
                                    )}

                                    {isUnassessed && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendReminderToTrainer(row.studentName, row.studentMatric, currentCourse.courseCode, row.trainerId, row.trainerName)}
                                        disabled={isSendingReminder === `${row.studentMatric}_${currentCourse.courseCode}`}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                        title="Hantar peringatan kepada Jurulatih Industri"
                                      >
                                        <Bell size={13} className="text-amber-600" />
                                        <span>{isSendingReminder === `${row.studentMatric}_${currentCourse.courseCode}` ? '...' : 'Peringatan'}</span>
                                      </button>
                                    )}

                                    {(isLecturer || isCoordinator) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onNavigate) onNavigate('wblMessaging');
                                        }}
                                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                                        title={`Mesej Jurulatih Industri (${row.trainerName})`}
                                      >
                                        <MessageSquare size={13} />
                                        <span>Mesej</span>
                                      </button>
                                    )}

                                    {isCoordinator && (
                                      <button
                                        type="button"
                                        onClick={() => handleUnenrollSingleStudent(currentCourse.courseCode, row.studentId, row.studentName)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Keluarkan daripada kursus"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
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
              );
            });
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ENROLMEN KURSUS PELAJAR (COORDINATOR COURSE ENROLLMENT MODULE)       */}
      {/* ========================================================================= */}
      {activeTab === 'enrollment' && isCoordinator && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <UserPlus size={22} />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {language === 'ms' ? 'Pengurusan Enrolmen Pelajar ke Kursus WBL' : 'Student Course Enrollment Management'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ms'
                      ? 'Penyelaras boleh mendaftarkan pelajar ke dalam kursus-kursus yang ditawarkan, menyemak status kohort, dan membolehkan pensyarah memantau pentaksiran pelajar.'
                      : 'Coordinator can enroll students into offered courses, track cohort progress, and assign students for lecturer verification.'}
                  </p>
                </div>
              </div>

              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold">
                Jumlah Pelajar Berdaftar: {studentUsersList.length} Orang
              </div>
            </div>

            {/* Step 1: Select Offered Course */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                {language === 'ms' ? '1. Pilih Kursus Ditawarkan untuk Urus Enrolmen:' : '1. Select Offered Course to Manage:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {courseAssignments.map((course) => {
                  const enrolledCount = (course.assignedStudentIds || []).length;
                  const isSelected = selectedEnrollmentCourseCode === course.courseCode;

                  return (
                    <div
                      key={course.id || course.courseCode}
                      onClick={() => {
                        setSelectedEnrollmentCourseCode(course.courseCode);
                        setSelectedStudentsToEnroll([]);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-400'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md">
                          {course.courseCode}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {course.semester || 'Semester 7'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 mt-2">{course.courseName}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                        <span className="truncate">Pensyarah: {course.lecturerName}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full shrink-0">
                          {enrolledCount} Dienrol
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Enrolment Workspace for Selected Course */}
          {(() => {
            const currentCourse = courseAssignments.find(c => c.courseCode === selectedEnrollmentCourseCode) || courseAssignments[0];
            if (!currentCourse) return null;

            const enrolledStudentIds = currentCourse.assignedStudentIds || [];
            
            // Available students not yet enrolled in this course
            const availableStudents = studentUsersList.filter(s => !enrolledStudentIds.includes(s.id) && !enrolledStudentIds.includes(s.matric_no || ''));

            // Filter available students
            const filteredAvailable = availableStudents.filter(s => {
              if (enrollmentProgramFilter !== 'all' && s.academic_level !== enrollmentProgramFilter) {
                return false;
              }
              if (enrollmentSearchQuery.trim()) {
                const q = enrollmentSearchQuery.toLowerCase();
                const match = s.name.toLowerCase().includes(q) || (s.matric_no && s.matric_no.toLowerCase().includes(q));
                if (!match) return false;
              }
              return true;
            });

            // Enrolled students list
            const enrolledStudents = enrolledStudentIds.map(sId => {
              const u = users.find(user => user.id === sId || user.matric_no === sId);
              const app = applications.find(a => (a.student_id === sId || (u && (a.student_id === u.matric_no || a.created_by === u.username))) && (a.application_status === 'Diluluskan' || a.student_preferred));
              return {
                id: sId,
                name: u?.name || app?.student_name || 'Pelajar WBL',
                matric: u?.matric_no || app?.student_id || sId,
                program: u?.academic_level || app?.student_program || 'BTEC',
                company: app?.company_name || u?.company_affiliation || 'Belum Ditetapkan',
                phone: u?.phone || '-'
              };
            });

            return (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                {/* Course Header Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-700">{currentCourse.courseCode}</div>
                    <h3 className="text-base font-black text-slate-800">{currentCourse.courseName}</h3>
                    <div className="text-xs text-slate-600">
                      Pensyarah Kursus: <strong>{currentCourse.lecturerName}</strong> {currentCourse.lecturerEmail ? `(${currentCourse.lecturerEmail})` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 px-3 py-1.5 rounded-lg shadow-xs">
                      {enrolledStudents.length} Pelajar Telah Dienrol
                    </span>
                  </div>
                </div>

                {/* Subtabs: Enrolled vs Add New */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEnrollmentActiveSubtab('enrolled')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                      enrollmentActiveSubtab === 'enrolled'
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck size={14} />
                    <span>{language === 'ms' ? 'Pelajar Sedang Dienrol' : 'Enrolled Students'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      enrollmentActiveSubtab === 'enrolled' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {enrolledStudents.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnrollmentActiveSubtab('available')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                      enrollmentActiveSubtab === 'available'
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserPlus size={14} />
                    <span>{language === 'ms' ? '+ Enrol Pelajar Baharu' : '+ Enroll New Students'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      enrollmentActiveSubtab === 'available' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {availableStudents.length}
                    </span>
                  </button>
                </div>

                {/* SUBTAB A: PELAJAR SEDANG DIENROL */}
                {enrollmentActiveSubtab === 'enrolled' && (
                  <div className="space-y-4">
                    {enrolledStudents.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-300 rounded-xl">
                        <UserPlus size={32} className="mx-auto text-slate-300" />
                        <div className="font-bold text-sm text-slate-600">
                          {language === 'ms' ? 'Belum Ada Pelajar Dienrol ke Kursus Ini' : 'No Students Enrolled Yet'}
                        </div>
                        <p className="text-xs">
                          {language === 'ms' 
                            ? 'Klik tab "+ Enrol Pelajar Baharu" untuk mendaftarkan pelajar aktif ke dalam kursus ini.' 
                            : 'Click "+ Enroll New Students" to add active students to this course.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setEnrollmentActiveSubtab('available')}
                          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                        >
                          + Enrol Pelajar Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="p-3 text-center w-12">#</th>
                              <th className="p-3">No. Matrik</th>
                              <th className="p-3">Nama Pelajar</th>
                              <th className="p-3">Program</th>
                              <th className="p-3">Organisasi Latihan</th>
                              <th className="p-3 text-right">Tindakan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {enrolledStudents.map((s, idx) => (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="p-3 font-mono font-bold text-blue-700">{s.matric}</td>
                                <td className="p-3 font-bold text-slate-800">{s.name}</td>
                                <td className="p-3 text-slate-500">{s.program}</td>
                                <td className="p-3 text-slate-600">{s.company}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleUnenrollSingleStudent(currentCourse.courseCode, s.id, s.name)}
                                    className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                    title="Keluarkan daripada kursus"
                                  >
                                    <Trash2 size={12} />
                                    <span>Keluarkan</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB B: ENROL PELAJAR BAHARU */}
                {enrollmentActiveSubtab === 'available' && (
                  <div className="space-y-4">
                    {/* Bulk Action Toolbar */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          {language === 'ms' ? 'Tindakan Pendaftaran Berkelompok:' : 'Batch Enrollment Actions:'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedStudentsToEnroll.length} pelajar dipilih daripada {filteredAvailable.length} pelajar tersedia
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectedStudentsToEnroll.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleEnrollSelectedStudents(currentCourse.courseCode)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <UserPlus size={14} />
                            <span>{language === 'ms' ? `Enrol Pelajar Ditanda (${selectedStudentsToEnroll.length})` : `Enroll Selected (${selectedStudentsToEnroll.length})`}</span>
                          </button>
                        )}

                        {filteredAvailable.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = filteredAvailable.map(s => s.id);
                              handleEnrollAllAvailableStudents(currentCourse.courseCode, allIds);
                            }}
                            disabled={isSaving}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <CheckCheck size={14} />
                            <span>{language === 'ms' ? `Enrol Semua Pelajar Tersedia (${filteredAvailable.length})` : `Enroll All Available (${filteredAvailable.length})`}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={enrollmentSearchQuery}
                          onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                          placeholder={language === 'ms' ? 'Cari nama pelajar atau no matrik...' : 'Search student name or matric...'}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedStudentsToEnroll.length === filteredAvailable.length) {
                              setSelectedStudentsToEnroll([]);
                            } else {
                              setSelectedStudentsToEnroll(filteredAvailable.map(s => s.id));
                            }
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <CheckSquare size={14} />
                          <span>{selectedStudentsToEnroll.length === filteredAvailable.length && filteredAvailable.length > 0 ? 'Nyah-pilih Semua' : 'Tanda Semua'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Available Students Table */}
                    {filteredAvailable.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl">
                        {language === 'ms' 
                          ? 'Semua pelajar aktif telah dienrol ke dalam kursus ini.' 
                          : 'All active students are already enrolled in this course.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="p-3 text-center w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentsToEnroll.length === filteredAvailable.length && filteredAvailable.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentsToEnroll(filteredAvailable.map(s => s.id));
                                    } else {
                                      setSelectedStudentsToEnroll([]);
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                              </th>
                              <th className="p-3">No. Matrik</th>
                              <th className="p-3">Nama Pelajar</th>
                              <th className="p-3">Program</th>
                              <th className="p-3">Penempatan Industri</th>
                              <th className="p-3 text-right">Tindakan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAvailable.map((s) => {
                              const isChecked = selectedStudentsToEnroll.includes(s.id);
                              const app = applications.find(a => (a.student_id === s.id || a.student_id === s.matric_no || a.created_by === s.username) && (a.application_status === 'Diluluskan' || a.student_preferred));

                              return (
                                <tr key={s.id} className={`hover:bg-emerald-50/40 transition-colors ${isChecked ? 'bg-emerald-50/30' : ''}`}>
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStudentsToEnroll([...selectedStudentsToEnroll, s.id]);
                                        } else {
                                          setSelectedStudentsToEnroll(selectedStudentsToEnroll.filter(id => id !== s.id));
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-800">{s.matric_no || '-'}</td>
                                  <td className="p-3 font-bold text-slate-800">{s.name}</td>
                                  <td className="p-3 text-slate-500">{s.academic_level || 'BTEC'}</td>
                                  <td className="p-3 text-slate-600">
                                    {app?.company_name || s.company_affiliation || (
                                      <span className="text-slate-400 italic">Belum ditempatkan</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleEnrollSelectedStudents(currentCourse.courseCode)}
                                      onMouseDown={() => setSelectedStudentsToEnroll([s.id])}
                                      disabled={isSaving}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 shadow-xs"
                                    >
                                      <Plus size={13} />
                                      <span>Enrol</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
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
                const assignedLec = facultyLecturers.find(l => l.id === assignment.lecturerId) || 
                                    users.find(u => u.id === assignment.lecturerId) ||
                                    users.find(u => u.name && assignment.lecturerName && u.name.trim().toLowerCase() === assignment.lecturerName.trim().toLowerCase());
                const evalCount = evaluations.filter(e => e.courseCode === assignment.courseCode).length;
                const displayLecturerName = assignedLec?.name || assignment.lecturerName;
                const displayLecturerEmail = assignedLec?.email || assignment.lecturerEmail;

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
                        <span>{displayLecturerName}</span>
                      </div>
                      {displayLecturerEmail && (
                        <div className="text-[11px] text-slate-500 font-mono">{displayLecturerEmail}</div>
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
      {/* TAB 3: PANDUAN RUBRIK & SKALA GRED UTEM (MENGIKUT LAMPIRAN RASMI)          */}
      {/* ========================================================================= */}
      {activeTab === 'rubrics' && (
        <div className="space-y-6">
          {/* Header & Course Switcher */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <BookOpen size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800">
                      {language === 'ms' 
                        ? 'Rubrik & Skema Pemarkahan Rasmi WBL (Ikut Lampiran FPTT UTeM)' 
                        : 'Official UTeM FPTT WBL Assessment Rubrics & Schemes'}
                    </h3>
                    <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Lampiran 2026/2027
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ms'
                      ? 'Rujukan lengkap rubrik 4-tahap pencapaian (Lemah, Sederhana, Baik, Cemerlang), nisbah JI (60%) vs TPF (40%), dan pentaksiran mingguan buku log.'
                      : 'Complete 4-band performance rubric, JI (60%) vs TPF (40%) evaluation ratios, and weekly logbook milestones.'}
                  </p>
                </div>
              </div>

              {/* Action: Print Official Rubric */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateCourseRubricPrint(selectedRubricCourseCode, language)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer size={15} />
                  <span>{language === 'ms' ? 'Cetak Skema Rubrik PDF' : 'Print Rubric Scheme'}</span>
                </button>
              </div>
            </div>

            {/* Course Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {language === 'ms' ? 'Pilih Kursus Ditawarkan untuk Lihat Rubrik Rasmi:' : 'Select Offered Course to View Official Rubrics:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(UTEM_PORTFOLIO_SCHEMES).map((cCode) => {
                  const s = UTEM_PORTFOLIO_SCHEMES[cCode];
                  const isSelected = selectedRubricCourseCode === cCode;
                  return (
                    <button
                      key={cCode}
                      type="button"
                      onClick={() => {
                        setSelectedRubricCourseCode(cCode);
                        const firstPart = s?.parts[0]?.partCode || 'Bahagian A';
                        setExpandedRubricPart(firstPart);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="font-mono">{cCode}</span>
                      <span className={`text-[10px] hidden sm:inline ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {s.courseName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rubric View Mode Subtabs */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRubricViewMode('portfolio')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  rubricViewMode === 'portfolio'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText size={14} />
                <span>{language === 'ms' ? 'Borang & Rubrik Penilaian (Bahagian A - D)' : 'Portfolio Rubrics (Parts A - D)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRubricViewMode('weekly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  rubricViewMode === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock size={14} />
                <span>{language === 'ms' ? 'Pentaksiran Mingguan Buku Log (Minggu 1 - 5)' : 'Weekly Logbook Tasks (Weeks 1 - 5)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRubricViewMode('grading')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  rubricViewMode === 'grading'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award size={14} />
                <span>{language === 'ms' ? 'Skala Penggredan Akademik UTeM' : 'UTeM Grading Scale'}</span>
              </button>
            </div>
          </div>

          {/* Active Course Scheme Overview */}
          {(() => {
            const currentScheme = UTEM_PORTFOLIO_SCHEMES[selectedRubricCourseCode] || UTEM_PORTFOLIO_SCHEMES['BTMT 3273(i)'];
            const weeklyTasks = UTEM_WEEKLY_ASSESSMENTS[selectedRubricCourseCode] || [];

            if (!currentScheme) return null;

            return (
              <div className="space-y-6">
                {/* Course Metadata Banner */}
                <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-lg">
                        {currentScheme.courseCode}
                      </span>
                      <span className="text-xs text-indigo-200">
                        {currentScheme.creditHours} Jam Kredit
                      </span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-indigo-100 font-semibold">
                        FPTT 2u2i Work-Based Learning
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {currentScheme.courseName}
                    </h3>
                  </div>

                  <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-xs flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-indigo-200 block uppercase font-bold tracking-wider">
                        Nisbah Penilai Rasmi
                      </span>
                      <span className="font-black text-amber-300 text-sm">
                        {currentScheme.evaluatorRatio}
                      </span>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <span className="text-[10px] text-indigo-200 block uppercase font-bold tracking-wider">
                        Jurulatih Industri
                      </span>
                      <span className="font-black text-emerald-300 text-sm">
                        {currentScheme.jiTotalPercent}% Markah
                      </span>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <span className="text-[10px] text-indigo-200 block uppercase font-bold tracking-wider">
                        Pensyarah Fakulti
                      </span>
                      <span className="font-black text-blue-300 text-sm">
                        {currentScheme.tpfTotalPercent}% Markah
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUBVIEW 1: PORTFOLIO RUBRICS (PARTS A - D) */}
                {rubricViewMode === 'portfolio' && (
                  <div className="space-y-6">
                    {/* Component Summary Table */}
                    {currentScheme.componentsSummary && currentScheme.componentsSummary.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Layers size={16} className="text-blue-600" />
                            <span>1. Jadual Komponen Penilaian, Domain Pembelajaran & Hasil Pembelajaran (CLO/PLO)</span>
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">
                            {currentScheme.componentsSummary.length} Komponen Pentaksiran
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="p-3 text-center w-10">No.</th>
                                <th className="p-3">Komponen Penilaian Industri</th>
                                <th className="p-3">Domain Pembelajaran</th>
                                <th className="p-3">Hasil Pembelajaran (CLO / PLO)</th>
                                <th className="p-3">Penilai</th>
                                <th className="p-3 text-center w-24">Pemberat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {currentScheme.componentsSummary.map((comp) => (
                                <tr key={comp.no} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-3 text-center font-bold text-slate-500">{comp.no}</td>
                                  <td className="p-3 font-bold text-slate-800">{comp.componentName}</td>
                                  <td className="p-3 text-slate-600">{comp.domain}</td>
                                  <td className="p-3 font-mono font-bold text-blue-700">{comp.clo} • {comp.plo}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                      comp.evaluator.includes('JI') && !comp.evaluator.includes('TPF')
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : comp.evaluator.includes('TPF') && !comp.evaluator.includes('JI')
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {comp.evaluator}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-black text-slate-800 bg-slate-50/50">
                                    {comp.weightPercent}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Detailed Rubrics Accordion / Cards per Part */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>2. Matriks Rubrik Prestasi 4-Tahap Pencapaian (Skor 1 hingga 4)</span>
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">1: Lemah</span>
                          <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">2: Sederhana</span>
                          <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">3: Baik</span>
                          <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">4: Cemerlang</span>
                        </div>
                      </div>

                      {/* Part Tabs Selector */}
                      <div className="flex flex-wrap gap-2">
                        {currentScheme.parts.map((p) => {
                          const isPartActive = expandedRubricPart === p.partCode;
                          return (
                            <button
                              key={p.partCode}
                              type="button"
                              onClick={() => setExpandedRubricPart(p.partCode)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                isPartActive
                                  ? 'bg-slate-900 text-white shadow-sm font-black ring-2 ring-blue-500'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              <span>{p.partCode}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                isPartActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.weightagePercent}%
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Render Active Part Details */}
                      {(() => {
                        const activePart = currentScheme.parts.find(p => p.partCode === expandedRubricPart) || currentScheme.parts[0];
                        if (!activePart) return null;

                        return (
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            {/* Part Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                              <div>
                                <div className="text-xs font-black text-blue-700 uppercase tracking-wider">{activePart.partCode}</div>
                                <h4 className="text-base font-black text-slate-800">{activePart.partTitle}</h4>
                                <p className="text-xs text-slate-600 mt-1 max-w-2xl">{activePart.description}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                                  Pemberat: {activePart.weightagePercent}%
                                </span>
                                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-lg">
                                  Penilai: {activePart.evaluator}
                                </span>
                              </div>
                            </div>

                            {/* Criteria List */}
                            <div className="space-y-4">
                              {activePart.criteria.map((criterion, idx) => (
                                <div key={criterion.id || idx} className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                                    <div className="font-black text-xs text-slate-800 flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span>{criterion.title}</span>
                                    </div>
                                    {criterion.clo && (
                                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {criterion.clo}
                                      </span>
                                    )}
                                  </div>

                                  {/* 4 Performance Band Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                    {/* Level 1: Lemah */}
                                    <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
                                      <div className="flex items-center justify-between text-xs font-black text-red-900 border-b border-red-200/60 pb-1">
                                        <span>Skor 1: Lemah</span>
                                        <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded font-mono">0 - 49%</span>
                                      </div>
                                      <p className="text-[11px] text-red-950/80 leading-relaxed pt-1">
                                        {criterion.levels[1]}
                                      </p>
                                    </div>

                                    {/* Level 2: Sederhana */}
                                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                                      <div className="flex items-center justify-between text-xs font-black text-amber-900 border-b border-amber-200/60 pb-1">
                                        <span>Skor 2: Sederhana</span>
                                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">50 - 64%</span>
                                      </div>
                                      <p className="text-[11px] text-amber-950/80 leading-relaxed pt-1">
                                        {criterion.levels[2]}
                                      </p>
                                    </div>

                                    {/* Level 3: Baik */}
                                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
                                      <div className="flex items-center justify-between text-xs font-black text-blue-900 border-b border-blue-200/60 pb-1">
                                        <span>Skor 3: Baik</span>
                                        <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-mono">65 - 79%</span>
                                      </div>
                                      <p className="text-[11px] text-blue-950/80 leading-relaxed pt-1">
                                        {criterion.levels[3]}
                                      </p>
                                    </div>

                                    {/* Level 4: Cemerlang */}
                                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                                      <div className="flex items-center justify-between text-xs font-black text-emerald-900 border-b border-emerald-200/60 pb-1">
                                        <span>Skor 4: Cemerlang</span>
                                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">80 - 100%</span>
                                      </div>
                                      <p className="text-[11px] text-emerald-950/80 leading-relaxed pt-1">
                                        {criterion.levels[4]}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* SUBVIEW 2: WEEKLY LOGBOOK TASKS (WEEKS 1 - 5) */}
                {rubricViewMode === 'weekly' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Clock size={16} className="text-indigo-600" />
                          <span>Tugasan Mingguan Buku Log & Skema Pentaksiran (Minggu 1 - 5)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Setiap minggu dinilai sebanyak 12 markah berasaskan 3 bidang penilaian utama (4 markah setiap bidang).
                        </p>
                      </div>

                      <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg">
                        Maksimum: 12 Markah / Minggu
                      </span>
                    </div>

                    {weeklyTasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl">
                        Tiada data tugasan mingguan spesifik bagi kursus ini. Sila rujuk skema portfolio komprehensif.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weeklyTasks.map((w) => (
                          <div key={w.week} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-indigo-300 transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg">
                                  Minggu {w.week}
                                </span>
                                <h5 className="font-black text-sm text-slate-800">{w.taskTitle}</h5>
                              </div>
                              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                                {w.cloStatement}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              {/* Task Highlights */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Aktiviti & Sorotan Tugasan Pelajar:
                                </span>
                                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                  {w.taskHighlights.map((h, hIdx) => (
                                    <li key={hIdx}>{h}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* 3 Assessment Areas */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                    3 Bidang Penilaian Mingguan (12 Markah):
                                  </span>
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded">
                                    4m setiap bidang
                                  </span>
                                </div>
                                <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
                                  {w.areas.map((area) => (
                                    <li key={area.id} className="font-medium">
                                      {area.title}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBVIEW 3: UTEM ACADEMIC GRADING SCALE */}
                {rubricViewMode === 'grading' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Award size={18} className="text-amber-500" />
                          <span>Skala Penggredan Akademik Universiti Teknikal Malaysia Melaka (UTeM)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Skala pemarkahan rasmi dan nilai mata gred (GPA) bagi program Sarjana Muda WBL.
                        </p>
                      </div>

                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        Gred Lulus Minimum: C (50%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { grade: 'A+', range: '90 - 100', pointer: '4.00', status: 'Cemerlang', color: 'emerald' },
                        { grade: 'A', range: '80 - 89', pointer: '4.00', status: 'Cemerlang', color: 'emerald' },
                        { grade: 'A-', range: '75 - 79', pointer: '3.67', status: 'Kepujian', color: 'blue' },
                        { grade: 'B+', range: '70 - 74', pointer: '3.33', status: 'Kepujian', color: 'blue' },
                        { grade: 'B', range: '65 - 69', pointer: '3.00', status: 'Lulus', color: 'slate' },
                        { grade: 'B-', range: '60 - 64', pointer: '2.67', status: 'Lulus', color: 'slate' },
                        { grade: 'C+', range: '55 - 59', pointer: '2.33', status: 'Lulus', color: 'amber' },
                        { grade: 'C', range: '50 - 54', pointer: '2.00', status: 'Lulus', color: 'amber' },
                        { grade: 'D', range: '40 - 49', pointer: '1.00', status: 'Lulus Bersyarat', color: 'orange' },
                        { grade: 'E', range: '0 - 39', pointer: '0.00', status: 'Gagal', color: 'red' },
                      ].map((item) => (
                        <div
                          key={item.grade}
                          className={`p-3.5 rounded-xl border transition-all ${
                            item.grade.startsWith('A')
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : item.grade.startsWith('B')
                              ? 'border-blue-200 bg-blue-50/50'
                              : item.grade.startsWith('C')
                              ? 'border-amber-200 bg-amber-50/50'
                              : item.grade === 'D'
                              ? 'border-orange-200 bg-orange-50/50'
                              : 'border-red-200 bg-red-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xl font-black text-slate-800">{item.grade}</span>
                            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {item.pointer}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1">{item.range}%</div>
                          <div className="text-[10px] font-bold text-slate-500 mt-0.5">{item.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PENGUMUMAN KURSUS & STATUS PEMBACAAN PELAJAR                       */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <CourseAnnouncementsSection
          currentUser={currentUser}
          courseCode={selectedMonitoringCourseCode !== 'all' ? selectedMonitoringCourseCode : (selectedCourseFilter !== 'all' ? selectedCourseFilter : 'all')}
          assignedCourses={courseAssignments}
          users={users}
          language={language}
          onRefresh={loadData}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 0: BORANG PENTAKSIRAN MINGGUAN JURULATIH INDUSTRI (12 MARKAH)       */}
      {/* ========================================================================= */}
      {isWeeklyModalOpen && evaluatingWeekConfig && currentSelectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg shadow-xs">
                    MINGGU {evaluatingWeekConfig.week}
                  </span>
                  <span className="text-xs bg-white/10 text-indigo-200 font-bold px-2.5 py-0.5 rounded-lg">
                    {evaluatingWeekConfig.courseCode}
                  </span>
                  {evaluatingWeekConfig.startDate && evaluatingWeekConfig.endDate && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      📅 {evaluatingWeekConfig.startDate} hingga {evaluatingWeekConfig.endDate}
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Borang Pentaksiran Hasil Kerja Mingguan Jurulatih Industri
                </h3>

                <p className="text-xs text-indigo-200/90 font-medium">
                  Pelajar: <strong>{currentSelectedStudent.studentName}</strong> ({currentSelectedStudent.studentMatric}) • {currentSelectedStudent.companyName}
                </p>

                {(() => {
                  const assignedLec = getCourseAssignedLecturer(evaluatingWeekConfig.courseCode);
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 pt-0.5">
                      <ShieldCheck size={14} className="text-amber-400" />
                      <span>Pensyarah Pengesah Kursus (Ditugaskan): <strong>{assignedLec?.lecturerName || facultyLecturers[0]?.name || (language === 'ms' ? 'Pensyarah Kursus FPTT' : 'Course Lecturer')}</strong> {assignedLec?.lecturerStaffId ? `(${assignedLec.lecturerStaffId})` : ''}</span>
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={() => setIsWeeklyModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {/* Syllabus & Task Focus Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="text-blue-600 uppercase tracking-wider font-bold">
                    Sukatan Pentaksiran Rasmi UTeM Minggu {evaluatingWeekConfig.week}
                  </span>
                  <span className="font-mono text-slate-500">Skema 12 Markah</span>
                </div>

                <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {evaluatingWeekConfig.taskTitle}
                </h4>

                <div className="text-xs text-blue-700 font-semibold flex items-center gap-1.5 pt-0.5">
                  <Sparkles size={14} className="text-blue-500 shrink-0" />
                  <span>{evaluatingWeekConfig.cloStatement}</span>
                </div>

                {evaluatingWeekConfig.taskHighlights && evaluatingWeekConfig.taskHighlights.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      Fokus Tugasan Mingguan di Industri:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {evaluatingWeekConfig.taskHighlights.map((hl, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Student Logbook Linkage (if available) */}
              {studentWeeklyLogbook ? (
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Rekod Buku Log Mingguan Pelajar (Minggu {evaluatingWeekConfig.week}) Telah Direkod</span>
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                      {studentWeeklyLogbook.entries?.length || 0} Catatan Harian
                    </span>
                  </div>

                  {studentWeeklyLogbook.weeklySummary && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-slate-700 italic">
                      "Refleksi Pelajar: {studentWeeklyLogbook.weeklySummary}"
                    </div>
                  )}

                  {studentWeeklyLogbook.entries && studentWeeklyLogbook.entries.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-slate-700 text-[11px] block">
                        Ringkasan Tugasan Harian Yang Dilaksanakan Pelajar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {studentWeeklyLogbook.entries.map((ent, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/80 text-[11px]">
                            <span className="font-bold text-blue-700">{ent.day} ({ent.date}):</span> {ent.tasks}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    Pelajar belum mengisi buku log digital bagi Minggu {evaluatingWeekConfig.week}. Jurulatih Industri boleh terus mengisi markah berdasarkan pemantauan fizikal, tugasan amali dan hasil kerja di lantai operasi firma.
                  </div>
                </div>
              )}

              {/* 3 Assessment Areas Rubric Scoring (12 Marks Max) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <span>Pentaksiran 3 Bidang Penilaian (Skala Rubrik 1 - 4):</span>
                  </h4>
                  <span className="text-xs text-blue-700 font-bold font-mono">
                    Jumlah: {weeklyAreaScores.area1 + weeklyAreaScores.area2 + weeklyAreaScores.area3} / 12 Markah
                  </span>
                </div>

                {evaluatingWeekConfig.areas.map((area, aIdx) => {
                  const currentScore = aIdx === 0 ? weeklyAreaScores.area1 : aIdx === 1 ? weeklyAreaScores.area2 : weeklyAreaScores.area3;
                  const setScore = (val: number) => {
                    if (aIdx === 0) setWeeklyAreaScores(prev => ({ ...prev, area1: val }));
                    else if (aIdx === 1) setWeeklyAreaScores(prev => ({ ...prev, area2: val }));
                    else setWeeklyAreaScores(prev => ({ ...prev, area3: val }));
                  };

                  return (
                    <div key={area.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                            Bidang {aIdx + 1} (Maks: 4 Markah)
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {area.title}
                          </h5>
                        </div>

                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 font-mono ${
                          currentScore === 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          currentScore === 3 ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          currentScore === 2 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {currentScore} / 4 ({
                            currentScore === 4 ? 'Cemerlang' :
                            currentScore === 3 ? 'Baik' :
                            currentScore === 2 ? 'Sederhana' : 'Lemah'
                          })
                        </span>
                      </div>

                      {/* 4 Rubric Bands Clickable Selector */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { score: 1, label: '1 - Lemah', desc: 'Tidak memuaskan / perlukan pemantauan rapi' },
                          { score: 2, label: '2 - Sederhana', desc: 'Kurang memuaskan / penuhi syarat minimum' },
                          { score: 3, label: '3 - Baik', desc: 'Memuaskan / penuhi standard firma' },
                          { score: 4, label: '4 - Cemerlang', desc: 'Kualiti cemerlang / berdikari bertaraf profesional' },
                        ].map((b) => (
                          <button
                            key={b.score}
                            type="button"
                            onClick={() => setScore(b.score)}
                            className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                              currentScore === b.score
                                ? b.score === 4
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold'
                                  : b.score === 3
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                                  : b.score === 2
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                                  : 'bg-rose-600 text-white border-rose-700 shadow-sm font-bold'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <span className="font-black text-xs">{b.label}</span>
                            <span className={`text-[10px] mt-0.5 line-clamp-2 leading-tight ${
                              currentScore === b.score ? 'text-white/90' : 'text-slate-500'
                            }`}>
                              {b.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Score Calculation Banner */}
                {(() => {
                  const sum = weeklyAreaScores.area1 + weeklyAreaScores.area2 + weeklyAreaScores.area3;
                  const pct = Math.round((sum / 12) * 100);
                  const gr = calculateUTeMGrade(pct);

                  return (
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-blue-200 block font-bold">
                          Rumusan Markah Minggu {evaluatingWeekConfig.week}
                        </span>
                        <div className="text-lg font-black mt-0.5">
                          {sum} / 12 Markah ({pct}%)
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-indigo-200 block uppercase font-bold">
                          Gred Mingguan UTeM
                        </span>
                        <span className="text-xl font-black text-amber-300">
                          {gr.grade} ({gr.status})
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Qualitative Feedback & Guidance */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Ulasan Kualitatif & Bimbingan Jurulatih Industri:
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ulasan Prestasi & Pencapaian Minggu Ini:
                  </label>
                  <textarea
                    rows={3}
                    value={weeklyTrainerComments}
                    onChange={(e) => setWeeklyTrainerComments(e.target.value)}
                    placeholder="Tulis ulasan penilaian prestasi tugasan, ketepatan masa, kualiti hasil kerja atau bimbingan khusus..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cadangan Penambahbaikan Minggu Seterusnya:
                  </label>
                  <input
                    type="text"
                    value={weeklyTrainerRecommendation}
                    onChange={(e) => setWeeklyTrainerRecommendation(e.target.value)}
                    placeholder="cth: Tingkatkan ketelitian analisis data dan konsistensi catatan buku log..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Bukti / Evidens Hasil Kerja (Pilihan):
                  </label>
                  <input
                    type="text"
                    value={weeklyDeliverableNotes}
                    onChange={(e) => setWeeklyDeliverableNotes(e.target.value)}
                    placeholder="cth: Laporan fizikal telah disahkan; Slaid pembentangan modul telah disemak..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs font-bold text-slate-600">
                Markah: <span className="text-blue-700 font-black">{weeklyAreaScores.area1 + weeklyAreaScores.area2 + weeklyAreaScores.area3} / 12</span> ({Math.round(((weeklyAreaScores.area1 + weeklyAreaScores.area2 + weeklyAreaScores.area3) / 12) * 100)}%)
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsWeeklyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveWeeklyEvaluation(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Simpan Draf</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveWeeklyEvaluation(true)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>Hantar & Sahkan Markah Minggu Ini</span>
                </button>
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
              {/* Form Mode / Weekly Choice Callout */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {language === 'ms' ? 'Pilihan Borang Ikut Minggu' : 'Weekly Form Choice'}
                    </span>
                    <span className="text-xs text-blue-200 font-semibold">
                      {language === 'ms' ? 'Silibus & Tugasan WBL Mingguan (1 - 20)' : 'Weekly Tasks (1 - 20)'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 max-w-xl">
                    {language === 'ms'
                      ? 'Adakah anda ingin menilai tugasan amali pelajar mengikut minggu (12 markah mingguan)? Anda boleh beralih ke borang ikut minggu bila-bila masa.'
                      : 'Do you want to evaluate weekly student tasks (12 marks weekly)? You can switch to the weekly assessment form anytime.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const studentMatric = editingEvaluation.studentMatric || editingEvaluation.studentId;
                    const courseCode = editingEvaluation.courseCode || 'BTMU 2103(i)';
                    setIsFormModalOpen(false);
                    if (studentMatric) setSelectedWeeklyStudentMatric(studentMatric);
                    if (courseCode) setSelectedWeeklyCourseCode(courseCode);
                    setActiveTab('weeklyAssessment');
                    toast.success(
                      language === 'ms'
                        ? `Membuka borang pentaksiran ikut minggu bagi ${editingEvaluation.studentName || 'pelajar'}`
                        : `Opening weekly evaluation forms for student`
                    );
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                >
                  <CalendarCheck size={15} />
                  <span>{language === 'ms' ? '🗓️ Beralih ke Borang Ikut Minggu' : 'Switch to Weekly Form'}</span>
                </button>
              </div>

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

              {/* Scoring Mode Switcher */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Mod Pengisian Markah:</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Mengikut Lampiran Rubrik Rasmi UTeM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormScoringMode('rubric')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      formScoringMode === 'rubric'
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <BookOpen size={13} />
                    <span>Mod Rubrik 4-Tahap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormScoringMode('slider')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      formScoringMode === 'slider'
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>Mod Slider (0-10)</span>
                  </button>
                </div>
              </div>

              {/* RUBRIC SCORING INPUTS */}
              {/* Part A */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {language === 'ms' ? 'Bahagian A: Kemahiran Teknikal & Pelaksanaan Tugasan (40 Markah)' : 'Part A: Technical Skills (40 Marks)'}
                    </h4>
                    <span className="text-[11px] text-slate-500">CLO1 & CLO3 • Domain Kognitif & Psikomotor Industri</span>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {editingEvaluation.technicalSubtotal || 0} / 40
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      key: 'taskKnowledge', 
                      label: '1. Pengetahuan & Pemahaman Tugasan Kerja (Task Knowledge)', 
                      desc: 'Memahami prinsip, skop kerja, dan konsep teori yang diaplikasikan.',
                      levels: {
                        1: 'Sukar memahami prinsip dan konsep teori asas tugasan firma.',
                        2: 'Memahami tugasan asas tetapi memerlukan pemantauan berterusan.',
                        3: 'Memahami skop kerja dengan jelas dan mengaplikasikan teori dengan betul.',
                        4: 'Penguasaan konsep sangat mantap dan berupaya menghubungkaitkan teori lanjutan.'
                      }
                    },
                    { 
                      key: 'workQuality', 
                      label: '2. Kualiti & Ketepatan Hasil Kerja (Work Quality & Accuracy)', 
                      desc: 'Menghasilkan kerja yang teliti dan mematuhi standard industri.',
                      levels: {
                        1: 'Hasil kerja cuai, banyak kesilapan dan tidak menepati standard industri.',
                        2: 'Hasil kerja memerlukan semakan berulang daripada penyelia industri.',
                        3: 'Kerja kemas, teliti, memenuhi spesifikasi dan standard kualiti industri.',
                        4: 'Kualiti kerja cemerlang bertaraf profesional industri, sangat teliti dan sifar ralat.'
                      }
                    },
                    { 
                      key: 'problemSolving', 
                      label: '3. Keupayaan Menyelesaikan Masalah & Inisiatif (Problem Solving)', 
                      desc: 'Mampu menganalisis isu dan mengemukakan solusi kreatif.',
                      levels: {
                        1: 'Pasif, menunggu arahan dan tidak mampu menyelesaikan masalah operasi asas.',
                        2: 'Mampu menyelesaikan masalah rutin tetapi sukar bagi isu kompleks.',
                        3: 'Mampu menganalisis isu dan mencadangkan penyelesaian secara berdikari.',
                        4: 'Sangat inovatif, pantas mengatasi cabaran dan mengemukakan solusi kreatif bernilai tambah.'
                      }
                    },
                    { 
                      key: 'toolCompetency', 
                      label: '4. Kecekapan Penggunaan Alatan & Sistem Industri (Tools Competency)', 
                      desc: 'Cekap mengendalikan perisian, mesin atau sistem IT syarikat.',
                      levels: {
                        1: 'Lemah dalam pengendalian perisian/mesin kerja dan kerap melakukan kesilapan.',
                        2: 'Mengendalikan alatan asas tetapi memerlukan bimbingan berterusan.',
                        3: 'Cekap mengendalikan perkakasan, perisian dan sistem kerja firma.',
                        4: 'Sangat mahir, cekap dan mampu membimbing rakan lain menggunakan sistem industri.'
                      }
                    },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    const activeLevel = val <= 4 ? 1 : val <= 6 ? 2 : val <= 8 ? 3 : 4;
                    const levelDescriptor = crit.levels[activeLevel as 1|2|3|4];

                    return (
                      <div key={crit.key} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                            <div className="text-[11px] text-slate-500">{crit.desc}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {formScoringMode === 'slider' && (
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={val}
                                onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                                className="w-24 accent-blue-600"
                              />
                            )}
                            <span className="w-12 text-center font-black text-xs text-blue-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200 shadow-xs">
                              {val} / 10
                            </span>
                          </div>
                        </div>

                        {/* 4-Level Rubric Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                          {[
                            { lvl: 1, label: '1: Lemah', score: 3, bgActive: 'bg-red-600 text-white', borderActive: 'border-red-600' },
                            { lvl: 2, label: '2: Sederhana', score: 6, bgActive: 'bg-amber-600 text-white', borderActive: 'border-amber-600' },
                            { lvl: 3, label: '3: Baik', score: 8, bgActive: 'bg-blue-600 text-white', borderActive: 'border-blue-600' },
                            { lvl: 4, label: '4: Cemerlang', score: 10, bgActive: 'bg-emerald-600 text-white', borderActive: 'border-emerald-600' }
                          ].map(btn => {
                            const isThisLvl = activeLevel === btn.lvl;
                            return (
                              <button
                                key={btn.lvl}
                                type="button"
                                onClick={() => updateScoreField(crit.key as any, btn.score)}
                                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center gap-1 ${
                                  isThisLvl
                                    ? `${btn.bgActive} shadow-xs font-black ring-1 ring-offset-1`
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isThisLvl && <Check size={12} />}
                                <span>{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Rubric Descriptor Feedback */}
                        {levelDescriptor && (
                          <div className={`p-2 rounded-lg text-[11px] border leading-relaxed flex items-start gap-1.5 ${
                            activeLevel === 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            activeLevel === 3 ? 'bg-blue-50 border-blue-200 text-blue-900' :
                            activeLevel === 2 ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            'bg-red-50 border-red-200 text-red-900'
                          }`}>
                            <Info size={13} className="shrink-0 mt-0.5" />
                            <span><strong>Skor {activeLevel}:</strong> {levelDescriptor}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part B */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {language === 'ms' ? 'Bahagian B: Kemahiran Insaniah & Profesionalisme (40 Markah)' : 'Part B: Soft Skills & Professionalism (40 Marks)'}
                    </h4>
                    <span className="text-[11px] text-slate-500">CLO4 • Kepimpinan, Autonomi, Kerja Berpasukan & Etika Kerja</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {editingEvaluation.softSkillsSubtotal || 0} / 40
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      key: 'punctuality', 
                      label: '1. Disiplin, Kedatangan & Ketepatan Masa (Punctuality & Attendance)', 
                      desc: 'Mematuhi jadual kerja dan menepati masa penyerahan tugasan.',
                      levels: {
                        1: 'Kerap lewat, tidak mematuhi jadual kerja dan menangguhkan penyerahan tugasan.',
                        2: 'Kadang-kala lewat dan memerlukan peringatan berulang mengenai kehadiran.',
                        3: 'Sentiasa hadir tepat pada masanya dan menepati tarikh akhir tugasan.',
                        4: 'Komitmen kehadiran 100% sempurna, sangat berdisiplin dan menjadi teladan.'
                      }
                    },
                    { 
                      key: 'communication', 
                      label: '2. Komunikasi & Kerjasama Berpasukan (Communication & Teamwork)', 
                      desc: 'Berkomunikasi secara profesional dan aktif dalam pasukan.',
                      levels: {
                        1: 'Sukar berinteraksi, pasif dan kerap menimbulkan salah faham dalam kerja.',
                        2: 'Komunikasi terhad dan kurang yakin menyampaikan idea kepada rakan.',
                        3: 'Berkomunikasi secara jelas, sopan dan bekerjasama baik dengan rakan.',
                        4: 'Komunikasi korporat cemerlang, berkarisma, dan aktif membina hubungan positif.'
                      }
                    },
                    { 
                      key: 'workEthics', 
                      label: '3. Integriti, Etika Kerja & SOP Keselamatan (Ethics & Safety)', 
                      desc: 'Amanah menjaga kerahsiaan syarikat dan mematuhi SOP.',
                      levels: {
                        1: 'Mengabaikan kod etika, membocorkan kerahsiaan atau melanggar SOP keselamatan.',
                        2: 'Mematuhi peraturan hanya apabila diawasi oleh pihak pengurusan.',
                        3: 'Berintegriti tinggi, amanah menjaga kerahsiaan dan mematuhi SOP OSHA/5S.',
                        4: 'Mempamerkan integriti profesional luar biasa dan budaya keselamatan terbaik.'
                      }
                    },
                    { 
                      key: 'adaptability', 
                      label: '4. Kebolehsuaian & Sikap Terhadap Pembelajaran (Adaptability)', 
                      desc: 'Bermotivasi tinggi dan terbuka menerima maklum balas pembetulan.',
                      levels: {
                        1: 'Sukar menyesuaikan diri, defensif terhadap teguran dan tidak berminat belajar.',
                        2: 'Mengambil masa lama untuk menyesuaikan diri dengan budaya firma.',
                        3: 'Mudah menyesuaikan diri dan terbuka menerima maklum balas pembetulan.',
                        4: 'Sangat tangkas (agile), berdaya tahan tinggi dan proaktif menimba ilmu baharu.'
                      }
                    },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    const activeLevel = val <= 4 ? 1 : val <= 6 ? 2 : val <= 8 ? 3 : 4;
                    const levelDescriptor = crit.levels[activeLevel as 1|2|3|4];

                    return (
                      <div key={crit.key} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                            <div className="text-[11px] text-slate-500">{crit.desc}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {formScoringMode === 'slider' && (
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={val}
                                onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                                className="w-24 accent-emerald-600"
                              />
                            )}
                            <span className="w-12 text-center font-black text-xs text-emerald-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200 shadow-xs">
                              {val} / 10
                            </span>
                          </div>
                        </div>

                        {/* 4-Level Rubric Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                          {[
                            { lvl: 1, label: '1: Lemah', score: 3, bgActive: 'bg-red-600 text-white', borderActive: 'border-red-600' },
                            { lvl: 2, label: '2: Sederhana', score: 6, bgActive: 'bg-amber-600 text-white', borderActive: 'border-amber-600' },
                            { lvl: 3, label: '3: Baik', score: 8, bgActive: 'bg-blue-600 text-white', borderActive: 'border-blue-600' },
                            { lvl: 4, label: '4: Cemerlang', score: 10, bgActive: 'bg-emerald-600 text-white', borderActive: 'border-emerald-600' }
                          ].map(btn => {
                            const isThisLvl = activeLevel === btn.lvl;
                            return (
                              <button
                                key={btn.lvl}
                                type="button"
                                onClick={() => updateScoreField(crit.key as any, btn.score)}
                                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center gap-1 ${
                                  isThisLvl
                                    ? `${btn.bgActive} shadow-xs font-black ring-1 ring-offset-1`
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isThisLvl && <Check size={12} />}
                                <span>{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Rubric Descriptor Feedback */}
                        {levelDescriptor && (
                          <div className={`p-2 rounded-lg text-[11px] border leading-relaxed flex items-start gap-1.5 ${
                            activeLevel === 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            activeLevel === 3 ? 'bg-blue-50 border-blue-200 text-blue-900' :
                            activeLevel === 2 ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            'bg-red-50 border-red-200 text-red-900'
                          }`}>
                            <Info size={13} className="shrink-0 mt-0.5" />
                            <span><strong>Skor {activeLevel}:</strong> {levelDescriptor}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part C */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {language === 'ms' ? 'Bahagian C: Buku Log Latihan & Dokumentasi (20 Markah)' : 'Part C: Logbook & Documentation (20 Marks)'}
                    </h4>
                    <span className="text-[11px] text-slate-500">CLO2 • Ketelitian Rekod Harian & Refleksi Pembelajaran</span>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    {editingEvaluation.logbookSubtotal || 0} / 20
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      key: 'logbookQuality', 
                      label: '1. Ketelitian & Konsistensi Rekod Buku Log Harian (Logbook Regularity)', 
                      desc: 'Merekod aktiviti setiap hari secara teratur dan lengkap.',
                      levels: {
                        1: 'Catatan tidak lengkap, banyak hari/minggu tertinggal dan lewat diserahkan.',
                        2: 'Catatan ringkas, tidak konsisten dan bukti bergambar/dokumen terhad.',
                        3: 'Catatan lengkap setiap hari dan disemak secara berkala oleh Jurulatih.',
                        4: 'Catatan sangat terperinci, kemas, konsisten dan disertakan bukti kerja lengkap.'
                      }
                    },
                    { 
                      key: 'reflectionQuality', 
                      label: '2. Refleksi Pembelajaran Mingguan (Weekly Reflection)', 
                      desc: 'Menghuraikan kemahiran baharu dan cabaran yang diselesaikan.',
                      levels: {
                        1: 'Tiada catatan refleksi atau sekadar menyalin semula huraian kerja.',
                        2: 'Refleksi pembelajaran terlalu umum dan tidak menunjukkan pemikiran matang.',
                        3: 'Refleksi menghubungkaitkan pengalaman amali dengan teori akademik.',
                        4: 'Refleksi sangat kritikal, mendalam dan mencadangkan penambahbaikan diri.'
                      }
                    },
                  ].map(crit => {
                    const val = (editingEvaluation.scores as any)?.[crit.key] || 0;
                    const activeLevel = val <= 4 ? 1 : val <= 6 ? 2 : val <= 8 ? 3 : 4;
                    const levelDescriptor = crit.levels[activeLevel as 1|2|3|4];

                    return (
                      <div key={crit.key} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-bold text-xs text-slate-800">{crit.label}</div>
                            <div className="text-[11px] text-slate-500">{crit.desc}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {formScoringMode === 'slider' && (
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={val}
                                onChange={(e) => updateScoreField(crit.key as any, parseInt(e.target.value) || 0)}
                                className="w-24 accent-purple-600"
                              />
                            )}
                            <span className="w-12 text-center font-black text-xs text-purple-800 bg-white py-1 px-1.5 rounded-lg border border-slate-200 shadow-xs">
                              {val} / 10
                            </span>
                          </div>
                        </div>

                        {/* 4-Level Rubric Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                          {[
                            { lvl: 1, label: '1: Lemah', score: 3, bgActive: 'bg-red-600 text-white', borderActive: 'border-red-600' },
                            { lvl: 2, label: '2: Sederhana', score: 6, bgActive: 'bg-amber-600 text-white', borderActive: 'border-amber-600' },
                            { lvl: 3, label: '3: Baik', score: 8, bgActive: 'bg-blue-600 text-white', borderActive: 'border-blue-600' },
                            { lvl: 4, label: '4: Cemerlang', score: 10, bgActive: 'bg-emerald-600 text-white', borderActive: 'border-emerald-600' }
                          ].map(btn => {
                            const isThisLvl = activeLevel === btn.lvl;
                            return (
                              <button
                                key={btn.lvl}
                                type="button"
                                onClick={() => updateScoreField(crit.key as any, btn.score)}
                                className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center gap-1 ${
                                  isThisLvl
                                    ? `${btn.bgActive} shadow-xs font-black ring-1 ring-offset-1`
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isThisLvl && <Check size={12} />}
                                <span>{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Rubric Descriptor Feedback */}
                        {levelDescriptor && (
                          <div className={`p-2 rounded-lg text-[11px] border leading-relaxed flex items-start gap-1.5 ${
                            activeLevel === 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            activeLevel === 3 ? 'bg-blue-50 border-blue-200 text-blue-900' :
                            activeLevel === 2 ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            'bg-red-50 border-red-200 text-red-900'
                          }`}>
                            <Info size={13} className="shrink-0 mt-0.5" />
                            <span><strong>Skor {activeLevel}:</strong> {levelDescriptor}</span>
                          </div>
                        )}
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
              {(() => {
                const assignedLec = getCourseAssignedLecturer(reviewingEvaluation.courseCode);
                const canVerify = canUserVerifyCourse(reviewingEvaluation.courseCode);

                return (
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                      <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <span>{language === 'ms' ? 'Pengesahan Rasmi Pensyarah Kursus' : 'Course Lecturer Verification'}</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">Pensyarah Ditugaskan:</span>
                        <span className="bg-indigo-50 text-indigo-950 font-bold px-2 py-0.5 rounded-lg border border-indigo-200 text-xs">
                          {assignedLec?.lecturerName || reviewingEvaluation.lecturerName || 'Pensyarah Kursus FPTT'} {assignedLec?.lecturerStaffId ? `(${assignedLec.lecturerStaffId})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Authorization Status Notice */}
                    {canVerify ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          {isCoordinator 
                            ? 'Anda log masuk sebagai Penyelaras WBL / Pentadbir (kuasa pengesahan penuh).' 
                            : `Anda adalah pensyarah yang ditugaskan (${currentUser.name}) untuk mengesahkan markah kursus ini.`}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                        <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5">Sekatan Akses Pengesahan Markah:</strong>
                          Mengikut ketetapan universiti, pengesahan markah Jurulatih Industri bagi kursus <strong>{reviewingEvaluation.courseCode}</strong> hanya sah disahkan oleh pensyarah yang diassign iaitu <strong>{assignedLec?.lecturerName || 'Pensyarah Kursus Ditugaskan'}</strong> atau Penyelaras WBL. Anda kini log masuk sebagai <strong>{currentUser.name}</strong>.
                        </div>
                      </div>
                    )}

                    {!isRevisionMode ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {language === 'ms' ? 'Ulasan & Catatan Pensyarah Kursus:' : 'Course Lecturer Comments:'}
                          </label>
                          <textarea
                            rows={3}
                            disabled={!canVerify}
                            value={lecturerCommentsInput}
                            onChange={(e) => setLecturerCommentsInput(e.target.value)}
                            placeholder={language === 'ms'
                              ? 'Markah dan gred penilaian prestasi industri disahkan memenuhi standard kursus WBL...'
                              : 'Marks and grade confirmed for WBL course...'}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
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
                          disabled={!canVerify}
                          value={revisionNotesInput}
                          onChange={(e) => setRevisionNotesInput(e.target.value)}
                          placeholder={language === 'ms' ? 'Sila jelaskan kriteria yang perlu disemak semula...' : 'Specify criteria to revise...'}
                          className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
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
                        disabled={!canUserVerifyCourse(reviewingEvaluation.courseCode)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canUserVerifyCourse(reviewingEvaluation.courseCode) ? 'Hanya pensyarah kursus yang ditugaskan boleh meminta semakan' : undefined}
                      >
                        <AlertCircle size={14} />
                        <span>{language === 'ms' ? 'Minta Semakan Semula' : 'Request Revision'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmLecturerVerification}
                        disabled={isSaving || !canUserVerifyCourse(reviewingEvaluation.courseCode)}
                        title={!canUserVerifyCourse(reviewingEvaluation.courseCode) ? `Hanya ${getCourseAssignedLecturer(reviewingEvaluation.courseCode)?.lecturerName || 'pensyarah kursus yang ditugaskan'} atau Penyelaras WBL boleh mengesahkan markah` : undefined}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        disabled={isSaving || !canUserVerifyCourse(reviewingEvaluation.courseCode)}
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
