
import React, { useEffect, useState } from 'react';
import { User, UserRole, Notification, CourseLecturerAssignment } from '../types';
import { LogOut, Home, Building2, Users, FileText, Upload, FileSpreadsheet, UserCog, Book, Database, Wifi, WifiOff, Menu, X, ShieldCheck, BarChart3, Languages, Map, BookCopy, UsersRound, UserCheck, Activity, Bell, Check, Trash, BookOpen, CheckCircle2, Award, ChevronDown, ChevronRight, GraduationCap, UserPlus, ClipboardCheck, MessageSquare, Megaphone } from 'lucide-react';
import { getRoleLabels } from '../constants';
import { StorageService } from '../services/storage';
import { Language, t } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, currentView, onNavigate, onLogout, language, onLanguageChange }) => {
  const [isCloud, setIsCloud] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const isEvaluationView = currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' || currentView === 'evaluationSettings' || currentView === 'evaluationRubrics' || currentView === 'courseEnrollment' || currentView === 'courseAnnouncements';
  const [isEvaluationSubmenuOpen, setIsEvaluationSubmenuOpen] = useState(isEvaluationView);
  const [pendingEvalCount, setPendingEvalCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const isCourseMonitoringView = currentView === 'lecturerCourseMonitoring';
  const [isLecturerCourseSubmenuOpen, setIsLecturerCourseSubmenuOpen] = useState(true);
  const [isTrainerCourseSubmenuOpen, setIsTrainerCourseSubmenuOpen] = useState(true);
  const [isCoordinatorCourseSubmenuOpen, setIsCoordinatorCourseSubmenuOpen] = useState(true);
  const [assignedCourses, setAssignedCourses] = useState<CourseLecturerAssignment[]>([]);
  const [allSemesterCourses, setAllSemesterCourses] = useState<CourseLecturerAssignment[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    if (isEvaluationView) {
      setIsEvaluationSubmenuOpen(true);
    }
  }, [isEvaluationView]);

  useEffect(() => {
    if (isCourseMonitoringView) {
      setIsLecturerCourseSubmenuOpen(true);
      setIsCoordinatorCourseSubmenuOpen(true);
    }
  }, [isCourseMonitoringView]);

  useEffect(() => {
    const loadAppData = () => {
      try {
        setApplications(StorageService.getApplications());
        setEvaluations(StorageService.getEvaluations());
        setUnreadMessageCount(StorageService.getUnreadWBLMessagesCount(currentUser.id));
      } catch {}
    };
    loadAppData();
    const unsub = StorageService.subscribe(loadAppData);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const loadAssignments = () => {
      try {
        const all = StorageService.getCourseAssignments();
        setAllSemesterCourses(all);

        if (currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR) {
          const myCourses = all.filter(a => 
            a.lecturerId === currentUser.id || 
            (a.lecturerEmail && currentUser.email && a.lecturerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
            (a.lecturerName && currentUser.name && (
              a.lecturerName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
              currentUser.name.toLowerCase().includes(a.lecturerName.toLowerCase())
            ))
          );
          setAssignedCourses(myCourses.length > 0 ? myCourses : all.slice(0, 2));
        } else if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
          setAssignedCourses(all);
        } else if (currentUser.role === UserRole.TRAINER) {
          setAssignedCourses(all);
        }
      } catch {}
    };

    loadAssignments();
    const unsub = StorageService.subscribe(loadAssignments);
    return () => unsub();
  }, [currentUser]);

  // Navigate to course with synchronization
  const handleCourseNavigate = (courseCode: string, view: 'monitoring' | 'evaluation' | 'weekly') => {
    if (view === 'monitoring') {
      if (courseCode === 'all') {
        sessionStorage.removeItem('selectedMonitoringCourseCode');
      } else {
        sessionStorage.setItem('selectedMonitoringCourseCode', courseCode);
      }
      handleNavigate('lecturerCourseMonitoring');
    } else if (view === 'weekly') {
      if (courseCode !== 'all') {
        sessionStorage.setItem('selectedWeeklyCourseCode', courseCode);
      }
      handleNavigate('weeklyAssessment');
    } else {
      if (courseCode === 'all') {
        sessionStorage.removeItem('selectedEvaluationCourseCode');
      } else {
        sessionStorage.setItem('selectedEvaluationCourseCode', courseCode);
      }
      handleNavigate('studentEvaluation');
    }
    window.dispatchEvent(new CustomEvent('wblCourseSelected', { detail: { courseCode, view } }));
  };

  // Get Trainer Course Stats
  const getTrainerCourseStats = (courseCode: string) => {
    const trainerComp = (currentUser.company_affiliation || '').trim().toLowerCase();
    const myTrainees = applications.filter(a => 
      (a.application_status === 'Diluluskan' || a.student_preferred) &&
      (!trainerComp || (a.company_name && a.company_name.toLowerCase().includes(trainerComp)))
    );
    const courseEvals = evaluations.filter(e => e.courseCode === courseCode);
    
    let completed = 0;
    myTrainees.forEach(t => {
      const hasEval = courseEvals.find(e => e.studentId === t.student_id || e.studentMatric === t.student_id);
      if (hasEval && (hasEval.status === 'submitted_by_trainer' || hasEval.status === 'verified_by_lecturer')) {
        completed++;
      }
    });

    const pending = Math.max(0, myTrainees.length - completed);
    return { count: myTrainees.length, pending, completed };
  };

  // Get Coordinator Course Stats
  const getCoordinatorCourseStats = (course: CourseLecturerAssignment) => {
    const enrolledCount = (course.assignedStudentIds || []).length;
    const courseEvals = evaluations.filter(e => e.courseCode === course.courseCode);
    const pendingVerify = courseEvals.filter(e => e.status === 'submitted_by_trainer').length;
    const verified = courseEvals.filter(e => e.status === 'verified_by_lecturer').length;
    return { enrolledCount, pendingVerify, verified };
  };

  // Get Lecturer Course Stats
  const getLecturerCourseStats = (course: CourseLecturerAssignment) => {
    const enrolledCount = (course.assignedStudentIds || []).length;
    const courseEvals = evaluations.filter(e => e.courseCode === course.courseCode);
    const pendingMyVerify = courseEvals.filter(e => 
      e.status === 'submitted_by_trainer' && 
      (e.lecturerId === currentUser.id || !e.lecturerId || (e.lecturerName && e.lecturerName.toLowerCase() === currentUser.name.toLowerCase()))
    ).length;
    return { enrolledCount, pendingMyVerify };
  };

  useEffect(() => {
    const updateEvalCounts = () => {
      try {
        const evals = StorageService.getEvaluations();
        if (currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR) {
          const pending = evals.filter(e => 
            e.status === 'submitted_by_trainer' && 
            (e.lecturerId === currentUser.id || !e.lecturerId || (e.lecturerName && e.lecturerName.toLowerCase() === currentUser.name.toLowerCase()))
          );
          setPendingEvalCount(pending.length);
        } else if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
          const pending = evals.filter(e => e.status === 'submitted_by_trainer');
          setPendingEvalCount(pending.length);
        } else if (currentUser.role === UserRole.TRAINER) {
          const needRevision = evals.filter(e => e.status === 'revision_requested' && e.trainerId === currentUser.id);
          setPendingEvalCount(needRevision.length);
        }
      } catch {}
    };

    updateEvalCounts();
    const unsub = StorageService.subscribe(updateEvalCounts);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    setIsCloud(StorageService.isCloudEnabled());
  }, []);

  useEffect(() => {
    const loadNotifs = () => {
      const allNotifs = StorageService.getNotifications();
      const userNotifs = allNotifs.filter(n => {
        if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
          return n.recipient_id === 'coordinator' || n.recipient_id === currentUser.id;
        }
        return n.recipient_id === currentUser.id;
      });
      setNotifications(userNotifs);
    };

    loadNotifs();
    const unsubscribe = StorageService.subscribe(loadNotifs);
    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl) {
      await StorageService.markAllNotificationsAsRead('coordinator');
    }
    await StorageService.markAllNotificationsAsRead(currentUser.id);
  };

  const handleMarkRead = async (id: string) => {
    await StorageService.markNotificationAsRead(id);
  };

  const handleDeleteNotif = async (id: string) => {
    await StorageService.deleteNotification(id);
  };

  const isCoordinator = currentUser.role === UserRole.COORDINATOR;
  const isJKWBL = currentUser.is_jkwbl === true;
  const isSupervisor = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isLecturer = isSupervisor;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isStudent = currentUser.role === UserRole.STUDENT;
  const hasSystemAccess = isCoordinator || isJKWBL;

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ view, label, icon: Icon }: { view: string, label: string, icon: any }) => (
    <button
      onClick={() => handleNavigate(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-blue-700">
            <Building2 size={24} />
            <span>WBL System</span>
        </div>
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-slate-200 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            WBL System
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
             {isCloud ? (
               <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                 <Wifi size={10} /> LIVE SYNC
               </span>
             ) : (
               <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                 <WifiOff size={10} /> OFFLINE
               </span>
             )}
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1 overflow-y-auto">
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg mb-4 border border-slate-200">
             <div className="flex items-center gap-2 text-slate-500">
                <Languages size={16} />
                <span className="text-[10px] font-bold uppercase">Language</span>
             </div>
             <div className="flex gap-1">
                <button 
                    onClick={() => onLanguageChange('ms')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${language === 'ms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                    MS
                </button>
                <button 
                    onClick={() => onLanguageChange('en')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'}`}
                >
                    EN
                </button>
             </div>
          </div>

          <NavItem view="dashboard" label={t(language, 'dashboard')} icon={Home} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t(language, 'mainMenu')}
          </div>
          
          <NavItem view="companies" label={t(language, 'companies')} icon={Building2} />
          
          <NavItem view="poster" label={t(language, 'posterTab')} icon={BookCopy} />

          {/* New Tab for Students to see their assigned Supervisor */}
          {isStudent && (
             <NavItem view="studentSupervision" label={t(language, 'menuSeliaan')} icon={UserCheck} />
          )}

          {/* Daily Training Logbook for Students */}
          {isStudent && (
             <NavItem view="dailyLogbook" label={t(language, 'logbook')} icon={BookOpen} />
          )}

          {/* Logbook Verification for Industry Trainers */}
          {isTrainer && (
             <NavItem view="dailyLogbook" label={language === 'ms' ? 'Pengesahan Log Harian' : 'Logbook Verification'} icon={CheckCircle2} />
          )}

          {/* Logbook Review & Monitoring for Faculty Supervisors (Penyelia Fakulti) */}
          {isSupervisor && !hasSystemAccess && (
             <NavItem view="dailyLogbook" label={language === 'ms' ? 'Buku Log Pelajar Seliaan' : 'Supervised Logbooks'} icon={BookOpen} />
          )}

          {/* Logbook Cohort Oversight for WBL Coordinator & JKWBL */}
          {hasSystemAccess && (
             <NavItem view="dailyLogbook" label={language === 'ms' ? 'Pemantauan Buku Log' : 'Logbook Monitoring'} icon={BookOpen} />
          )}

          {/* ========================================================= */}
          {/* SUBMENU: PENILAIAN PELAJAR (STUDENT EVALUATION MODULE)   */}
          {/* ========================================================= */}
          <div className="py-1">
            <div className={`rounded-xl border transition-all ${
              isEvaluationView 
                ? 'border-blue-300 bg-blue-50/40 shadow-xs' 
                : 'border-slate-200/80 bg-slate-50/60'
            }`}>
              {/* Main Submenu Header Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isEvaluationSubmenuOpen) {
                    setIsEvaluationSubmenuOpen(true);
                    handleNavigate('studentEvaluation');
                  } else {
                    setIsEvaluationSubmenuOpen(!isEvaluationSubmenuOpen);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                  isEvaluationView
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award size={18} className={isEvaluationView ? 'text-amber-300' : 'text-amber-600'} />
                  <span className="text-xs">{t(language, 'studentEvaluation')}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {pendingEvalCount > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isEvaluationView ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      {pendingEvalCount}
                    </span>
                  )}
                  {isEvaluationSubmenuOpen ? (
                    <ChevronDown size={14} className={isEvaluationView ? 'text-white' : 'text-slate-400'} />
                  ) : (
                    <ChevronRight size={14} className={isEvaluationView ? 'text-white' : 'text-slate-400'} />
                  )}
                </div>
              </button>

              {/* Collapsible Submenu Links */}
              {isEvaluationSubmenuOpen && (
                <div className="p-1 space-y-0.5 bg-white rounded-b-xl border-t border-slate-100">
                  {/* Submenu 0: Pentaksiran Kerja Mingguan (Ikut Minggu) */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('weeklyAssessment')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentView === 'weeklyAssessment'
                        ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-black shadow-xs'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'weeklyAssessment' ? 'bg-amber-300' : 'bg-blue-600'}`} />
                      <span>{language === 'ms' ? 'Pentaksiran Ikut Minggu' : 'Weekly Assessment'}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      currentView === 'weeklyAssessment' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                    }`}>
                      5 Mgg / PSM2
                    </span>
                  </button>

                  {/* Submenu 1: Borang & Senarai Penilaian */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('studentEvaluation')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentView === 'studentEvaluation'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'studentEvaluation' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                      <span>
                        {isTrainer 
                          ? (language === 'ms' ? 'Borang & Senarai Penilaian' : 'Student Evaluations')
                          : isLecturer 
                          ? (language === 'ms' ? 'Pengesahan Penilaian' : 'Verify Evaluations')
                          : isStudent
                          ? (language === 'ms' ? 'Keputusan & Gred' : 'Evaluation Results')
                          : (language === 'ms' ? 'Semua Penilaian' : 'All Evaluations')}
                      </span>
                    </div>
                    {pendingEvalCount > 0 && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded-full">
                        {pendingEvalCount}
                      </span>
                    )}
                  </button>

                  {/* Submenu: Borang Pentaksiran Ikut Minggu (Trainer & Coordinator) */}
                  {(isTrainer || hasSystemAccess) && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('weeklyAssessment')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'weeklyAssessment'
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'weeklyAssessment' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <span>{language === 'ms' ? '🗓️ Pentaksiran Ikut Minggu (1-20)' : '🗓️ Weekly Task Assessment (1-20)'}</span>
                      </div>
                      <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded-full">
                        Aktif
                      </span>
                    </button>
                  )}

                  {/* Submenu 2: Pemantauan Kursus Pensyarah (Lecturer & Coordinator) */}
                  {(isLecturer || hasSystemAccess) && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('lecturerCourseMonitoring')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'lecturerCourseMonitoring'
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'lecturerCourseMonitoring' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <span>{language === 'ms' ? 'Pemantauan Kursus Pensyarah' : 'Course Lecturer Monitoring'}</span>
                      </div>
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded">
                        {assignedCourses.length} {language === 'ms' ? 'Kursus' : 'Courses'}
                      </span>
                    </button>
                  )}

                  {/* Submenu 3: Enrolmen Kursus Pelajar (Coordinator & JKWBL only) */}
                  {hasSystemAccess && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('courseEnrollment')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'courseEnrollment'
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'courseEnrollment' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <span>{language === 'ms' ? 'Enrolmen Kursus Pelajar' : 'Student Course Enrollment'}</span>
                      </div>
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase">
                        Enrol
                      </span>
                    </button>
                  )}

                  {/* Submenu 4: Tetapan Pensyarah Kursus (Coordinator & Lecturer) */}
                  {(hasSystemAccess || isLecturer) && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('evaluationSettings')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'evaluationSettings'
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'evaluationSettings' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <span>{t(language, 'courseLecturerSettings')}</span>
                      </div>
                      {hasSystemAccess && (
                        <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1 py-0.2 rounded uppercase">
                          Set
                        </span>
                      )}
                    </button>
                  )}

                  {/* Submenu 5: Rubrik & Skala Gred */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('evaluationRubrics')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentView === 'evaluationRubrics'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'evaluationRubrics' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                      <span>{t(language, 'evaluationSubmenuRubrics')}</span>
                    </div>
                  </button>

                  {/* Submenu 6: Pengumuman Kursus */}
                  <button
                    type="button"
                    onClick={() => handleNavigate('courseAnnouncements')}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      currentView === 'courseAnnouncements'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'courseAnnouncements' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                      <span>{language === 'ms' ? 'Pengumuman Kursus' : 'Course Announcements'}</span>
                    </div>
                    <span className="text-[10px] text-amber-500 font-black">
                      📢
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. SUBMENU KHAS PENSYARAH: KURSUS PENGAJARAN SAYA (LECTURER ONLY)         */}
          {/* ========================================================================= */}
          {isLecturer && !hasSystemAccess && (
            <div className="py-1">
              <div className={`rounded-xl border transition-all ${
                isCourseMonitoringView 
                  ? 'border-indigo-300 bg-indigo-50/50 shadow-xs' 
                  : 'border-slate-200/80 bg-slate-50/60'
              }`}>
                {/* Header Button */}
                <button
                  type="button"
                  onClick={() => setIsLecturerCourseSubmenuOpen(!isLecturerCourseSubmenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                    isCourseMonitoringView
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap size={18} className={isCourseMonitoringView ? 'text-amber-300' : 'text-indigo-600'} />
                    <div className="flex flex-col">
                      <span className="text-xs leading-tight font-black">
                        {language === 'ms' ? 'Kursus Pengajaran Saya' : 'My Teaching Courses'}
                      </span>
                      <span className={`text-[10px] font-medium leading-none mt-0.5 ${
                        isCourseMonitoringView ? 'text-indigo-100' : 'text-slate-500'
                      }`}>
                        {assignedCourses.length} {language === 'ms' ? 'kursus ditugaskan' : 'assigned courses'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pendingEvalCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isCourseMonitoringView ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {pendingEvalCount}
                      </span>
                    )}
                    {isLecturerCourseSubmenuOpen ? (
                      <ChevronDown size={14} className={isCourseMonitoringView ? 'text-white' : 'text-slate-400'} />
                    ) : (
                      <ChevronRight size={14} className={isCourseMonitoringView ? 'text-white' : 'text-slate-400'} />
                    )}
                  </div>
                </button>

                {/* Submenu Course Links */}
                {isLecturerCourseSubmenuOpen && (
                  <div className="p-1 space-y-0.5 bg-white rounded-b-xl border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCourseNavigate('all', 'monitoring')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'lecturerCourseMonitoring' && (!sessionStorage.getItem('selectedMonitoringCourseCode') || sessionStorage.getItem('selectedMonitoringCourseCode') === 'all')
                          ? 'bg-indigo-50 text-indigo-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span>{language === 'ms' ? 'Papan Pemantauan Kursus Saya' : 'My Courses Dashboard'}</span>
                      </div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 rounded-full">
                        {assignedCourses.length}
                      </span>
                    </button>

                    {assignedCourses.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                        {language === 'ms' ? 'Tiada kursus ditugaskan lagi' : 'No courses assigned yet'}
                      </div>
                    ) : (
                      assignedCourses.map(course => {
                        const stats = getLecturerCourseStats(course);
                        return (
                          <button
                            key={course.id || course.courseCode}
                            type="button"
                            onClick={() => handleCourseNavigate(course.courseCode, 'monitoring')}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                            title={`${course.courseCode} - ${course.courseName}`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden text-left">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-600" />
                              <div className="flex flex-col truncate">
                                <span className="truncate font-semibold">{course.courseCode}</span>
                                <span className="text-[9px] text-slate-400 truncate">{course.courseName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {stats.pendingMyVerify > 0 && (
                                <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse">
                                  {stats.pendingMyVerify}
                                </span>
                              )}
                              <span className="text-[9px] bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                                {stats.enrolledCount} {language === 'ms' ? 'pelajar' : 'std'}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SUBMENU KHAS JURULATIH INDUSTRI: PENILAIAN KURSUS SEMESTER SEMASA       */}
          {/* ========================================================================= */}
          {isTrainer && (
            <div className="py-1">
              <div className={`rounded-xl border transition-all ${
                currentView === 'studentEvaluation' || currentView === 'weeklyAssessment'
                  ? 'border-blue-300 bg-blue-50/50 shadow-xs' 
                  : 'border-slate-200/80 bg-slate-50/60'
              }`}>
                {/* Header Button */}
                <button
                  type="button"
                  onClick={() => setIsTrainerCourseSubmenuOpen(!isTrainerCourseSubmenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                    currentView === 'studentEvaluation' || currentView === 'weeklyAssessment'
                      ? 'bg-blue-600 text-white font-black shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardCheck size={18} className={currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' ? 'text-amber-300' : 'text-blue-600'} />
                    <div className="flex flex-col">
                      <span className="text-xs leading-tight font-black">
                        {language === 'ms' ? 'Penilaian Kursus Semester Semasa' : 'Course Assessments (Current Sem)'}
                      </span>
                      <span className={`text-[10px] font-medium leading-none mt-0.5 ${
                        currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {allSemesterCourses.length} {language === 'ms' ? 'kursus aktif' : 'active courses'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pendingEvalCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {pendingEvalCount}
                      </span>
                    )}
                    {isTrainerCourseSubmenuOpen ? (
                      <ChevronDown size={14} className={currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' ? 'text-white' : 'text-slate-400'} />
                    ) : (
                      <ChevronRight size={14} className={currentView === 'studentEvaluation' || currentView === 'weeklyAssessment' ? 'text-white' : 'text-slate-400'} />
                    )}
                  </div>
                </button>

                {/* Submenu Course Links for Trainer */}
                {isTrainerCourseSubmenuOpen && (
                  <div className="p-1 space-y-0.5 bg-white rounded-b-xl border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCourseNavigate('all', 'weekly')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'weeklyAssessment'
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentView === 'weeklyAssessment' ? 'bg-amber-300' : 'bg-blue-600'}`} />
                        <span>{language === 'ms' ? '🗓️ Pentaksiran Ikut Minggu' : '🗓️ Weekly Assessment'}</span>
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        currentView === 'weeklyAssessment' ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Aktif
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCourseNavigate('all', 'evaluation')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'studentEvaluation' && (!sessionStorage.getItem('selectedEvaluationCourseCode') || sessionStorage.getItem('selectedEvaluationCourseCode') === 'all')
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{language === 'ms' ? '📋 Ringkasan Penilaian Pelajar' : 'All Student Evaluations'}</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 rounded-full">
                        {allSemesterCourses.length}
                      </span>
                    </button>

                    {allSemesterCourses.map(course => {
                      const stats = getTrainerCourseStats(course.courseCode);
                      const isSelected = (currentView === 'weeklyAssessment' && sessionStorage.getItem('selectedWeeklyCourseCode') === course.courseCode) ||
                                         (currentView === 'studentEvaluation' && sessionStorage.getItem('selectedEvaluationCourseCode') === course.courseCode);
                      return (
                        <button
                          key={course.id || course.courseCode}
                          type="button"
                          onClick={() => handleCourseNavigate(course.courseCode, 'weekly')}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors group ${
                            isSelected ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                          title={`${course.courseCode} - ${course.courseName}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden text-left">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-blue-600'}`} />
                            <div className="flex flex-col truncate">
                              <span className="truncate font-bold">{course.courseCode}</span>
                              <span className="text-[9px] text-slate-400 truncate">{course.courseName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {stats.pending > 0 ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                {stats.pending} {language === 'ms' ? 'perlu nilai' : 'pending'}
                              </span>
                            ) : stats.completed > 0 ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                ✓ {stats.completed} {language === 'ms' ? 'selesai' : 'done'}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                {stats.count} {language === 'ms' ? 'pelatih' : 'intern'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SUBMENU KHAS PENYELARAS: PEMANTAUAN SEMUA KURSUS (SEMESTER SEMASA)     */}
          {/* ========================================================================= */}
          {hasSystemAccess && (
            <div className="py-1">
              <div className={`rounded-xl border transition-all ${
                isCourseMonitoringView 
                  ? 'border-indigo-300 bg-indigo-50/50 shadow-xs' 
                  : 'border-slate-200/80 bg-slate-50/60'
              }`}>
                {/* Header Button */}
                <button
                  type="button"
                  onClick={() => setIsCoordinatorCourseSubmenuOpen(!isCoordinatorCourseSubmenuOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                    isCourseMonitoringView
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={18} className={isCourseMonitoringView ? 'text-amber-300' : 'text-indigo-600'} />
                    <div className="flex flex-col">
                      <span className="text-xs leading-tight font-black">
                        {language === 'ms' ? 'Pemantauan Semua Kursus (Semester Semasa)' : 'All Courses Monitoring (Current Sem)'}
                      </span>
                      <span className={`text-[10px] font-medium leading-none mt-0.5 ${
                        isCourseMonitoringView ? 'text-indigo-100' : 'text-slate-500'
                      }`}>
                        {allSemesterCourses.length} {language === 'ms' ? 'kursus dipantau' : 'monitored courses'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pendingEvalCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isCourseMonitoringView ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {pendingEvalCount}
                      </span>
                    )}
                    {isCoordinatorCourseSubmenuOpen ? (
                      <ChevronDown size={14} className={isCourseMonitoringView ? 'text-white' : 'text-slate-400'} />
                    ) : (
                      <ChevronRight size={14} className={isCourseMonitoringView ? 'text-white' : 'text-slate-400'} />
                    )}
                  </div>
                </button>

                {/* Submenu Course Links for Coordinator */}
                {isCoordinatorCourseSubmenuOpen && (
                  <div className="p-1 space-y-0.5 bg-white rounded-b-xl border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCourseNavigate('all', 'monitoring')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        currentView === 'lecturerCourseMonitoring' && (!sessionStorage.getItem('selectedMonitoringCourseCode') || sessionStorage.getItem('selectedMonitoringCourseCode') === 'all')
                          ? 'bg-indigo-50 text-indigo-700 font-black'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span>{language === 'ms' ? 'Papan Pemantauan Keseluruhan' : 'All Courses Overview'}</span>
                      </div>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 rounded-full">
                        {allSemesterCourses.length}
                      </span>
                    </button>

                    {allSemesterCourses.map(course => {
                      const stats = getCoordinatorCourseStats(course);
                      return (
                        <button
                          key={course.id || course.courseCode}
                          type="button"
                          onClick={() => handleCourseNavigate(course.courseCode, 'monitoring')}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                          title={`${course.courseCode} - ${course.courseName} (${course.lecturerName})`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden text-left">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-600" />
                            <div className="flex flex-col truncate">
                              <span className="truncate font-semibold">{course.courseCode}</span>
                              <span className="text-[9px] text-slate-400 truncate">
                                {course.lecturerName ? course.lecturerName.split(' ')[0] : 'Pensyarah'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {stats.pendingVerify > 0 && (
                              <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse">
                                {stats.pendingVerify}
                              </span>
                            )}
                            <span className="text-[9px] bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                              {stats.enrolledCount} {language === 'ms' ? 'pelajar' : 'std'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab for Lecturers/Supervisors to see their students */}
          {(isSupervisor || hasSystemAccess) && (
            <NavItem view="supervised" label={t(language, 'supervisedTab')} icon={UsersRound} />
          )}

          {/* Pusat Mesej WBL (Jurulatih Industri, Penyelia Fakulti & Penyelaras) */}
          {(isTrainer || isLecturer || hasSystemAccess || isSupervisor) && (
            <div className="py-0.5">
              <button
                type="button"
                onClick={() => handleNavigate('wblMessaging')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  currentView === 'wblMessaging'
                    ? 'bg-indigo-600 text-white font-black shadow-md'
                    : 'text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-900 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={18} className={currentView === 'wblMessaging' ? 'text-amber-300' : 'text-indigo-600'} />
                  <div className="flex flex-col text-left">
                    <span className="text-xs leading-tight font-black">
                      {language === 'ms' ? 'Pusat Mesej WBL' : 'WBL Messages'}
                    </span>
                    <span className={`text-[10px] font-medium leading-none mt-0.5 ${
                      currentView === 'wblMessaging' ? 'text-indigo-200' : 'text-slate-400'
                    }`}>
                      {language === 'ms' ? 'Jurulatih • Penyelia • Penyelaras' : 'Trainer • Supervisor • Coord'}
                    </span>
                  </div>
                </div>
                {unreadMessageCount > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    {unreadMessageCount}
                  </span>
                ) : (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    currentView === 'wblMessaging' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    3 Pihak
                  </span>
                )}
              </button>
            </div>
          )}

          {(hasSystemAccess || currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR) && (
            <NavItem view="students" label={t(language, 'students')} icon={Users} />
          )}

          {hasSystemAccess && (
            <NavItem view="staff" label={t(language, 'staff')} icon={UserCog} />
          )}
          
          <NavItem view="applications" label={t(language, 'applications')} icon={FileText} />

          {hasSystemAccess && (
            <NavItem view="userActivities" label={language === 'ms' ? 'Aktiviti & Log Masuk' : 'Activities & Logins'} icon={Activity} />
          )}
          
          {hasSystemAccess && (
            <>
                <NavItem view="statistics" label={t(language, 'statistics')} icon={BarChart3} />
                <NavItem view="analysis" label={t(language, 'analysisTab')} icon={Map} />
            </>
          )}

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'references')}
          </div>
          <NavItem view="guidebook" label={t(language, 'guidebook')} icon={Book} />
          
          {(hasSystemAccess || isLecturer || isStudent) && (
             <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
             {t(language, 'management')}
           </div>
          )}

           {(hasSystemAccess || isLecturer || isStudent) && (
             <NavItem view="addCompany" label={t(language, 'addCompany')} icon={Upload} />
           )}

           {hasSystemAccess && (
             <>
               <NavItem view="uploadExcel" label={t(language, 'uploadExcel')} icon={FileSpreadsheet} />
               <NavItem view="systemData" label={t(language, 'systemData')} icon={Database} />
             </>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={() => handleNavigate('profile')} className="flex items-center gap-3 w-full p-2 rounded hover:bg-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 relative">
              {currentUser.name.charAt(0)}
              {isJKWBL && (
                  <div className="absolute -top-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full border border-white" title="Ahli JKWBL">
                      <ShieldCheck size={10} />
                  </div>
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                  {getRoleLabels(language)[currentUser.role]}
                  {isJKWBL && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded">JKWBL</span>}
              </div>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 text-red-600 text-sm py-2 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut size={16} />
            {t(language, 'logout')}
          </button>
          
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
             <p className="text-[9px] text-slate-400 leading-tight">
                {language === 'ms' ? 'Hak Cipta' : 'Copyright'} © {currentYear}<br/>Dr. Mohd Guzairy bin Abd Ghani
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto animate-fadeIn pb-20 md:pb-0 flex flex-col min-h-full">
          
          {/* Top Bar with Session details and Notification Dropdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                Session: 2026/2027
              </span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                {language === 'ms' 
                  ? 'Sesi Latihan WBL: 28/09/2026 - 27/09/2027' 
                  : 'WBL Training Period: 28/09/2026 - 27/09/2027'}
              </span>
            </div>

            {/* Quick Actions (Messaging + Notification) */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* WBL Messaging Quick Icon */}
              {(isTrainer || isLecturer || hasSystemAccess || isSupervisor) && (
                <button
                  type="button"
                  onClick={() => handleNavigate('wblMessaging')}
                  className={`p-2 rounded-lg transition-all relative border flex items-center justify-center ${
                    currentView === 'wblMessaging'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                  title={language === 'ms' ? 'Pusat Mesej WBL' : 'WBL Messages'}
                >
                  <MessageSquare size={18} />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                      {unreadMessageCount}
                    </span>
                  )}
                </button>
              )}

              {/* Notification Bell Icon */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all relative border border-slate-200 bg-slate-50 flex items-center justify-center"
                  title={language === 'ms' ? 'Notifikasi' : 'Notifications'}
                >
                <Bell size={18} className={unreadCount > 0 ? "animate-swing origin-top" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-slideDown overflow-hidden max-h-[480px] flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <Bell size={16} className="text-blue-600" />
                        <span>{language === 'ms' ? 'Pemberitahuan' : 'Notifications'}</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} {language === 'ms' ? 'Baharu' : 'New'}
                          </span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Check size={14} />
                          <span>{language === 'ms' ? 'Semua Dibaca' : 'Mark All Read'}</span>
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell size={36} className="mx-auto mb-2 text-slate-200 stroke-1" />
                          <p className="text-xs font-medium">{language === 'ms' ? 'Tiada notifikasi baharu' : 'No new notifications'}</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-4 transition-colors relative hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-xs text-slate-800 leading-tight">
                                {language === 'ms' ? n.title_ms : n.title_en}
                              </h4>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotif(n.id);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title={language === 'ms' ? 'Padam' : 'Delete'}
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {language === 'ms' ? n.message_ms : n.message_en}
                            </p>
                            <div className="flex justify-between items-center mt-2.5">
                              <span className="text-[9px] font-medium text-slate-400">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                              {!n.is_read && (
                                <button 
                                  onClick={() => handleMarkRead(n.id)}
                                  className="text-[9px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline"
                                >
                                  <Check size={10} />
                                  <span>{language === 'ms' ? 'Tandakan Dibaca' : 'Mark Read'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          <div className="flex-1">
            {children}
          </div>
          
          <footer className="mt-12 py-6 border-t border-slate-200 text-center no-print">
            <p className="text-[10px] md:text-xs text-slate-400">
              {language === 'ms' ? 'Hak Cipta' : 'Copyright'} © {currentYear} Dr. Mohd Guzairy bin Abd Ghani. {language === 'ms' ? 'Hak Cipta Terpelihara' : 'All Rights Reserved'}.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
