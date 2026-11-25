import {
  User,
  UserRole,
  Application,
  WeeklyLogbook,
  PsmCaseStudyWeeklyLog,
  StudentEvaluation
} from '../types';
import {
  WBL_COURSE_SEQUENCE,
  UTEM_WEEKLY_ASSESSMENTS,
  WeeklyAssessmentConfig
} from '../constants/utemWblRubrics';

export const WBL_SEMESTER_START_DATE = '2026-09-28';

export const normalizeText = (val?: string | null): string =>
  (val || '').replace(/\s+/g, ' ').trim().toLowerCase();

export const normalizeMatric = (val?: string | null): string =>
  (val || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export const normalizeCourseCode = (code?: string | null): string =>
  (code || '').replace(/\(i\)/gi, '').replace(/\s+/g, ' ').trim().toUpperCase();

const INVALID_COMPANY_VALUES = new Set([
  '',
  '-',
  'tiada',
  'none',
  'n/a',
  'belum ditetapkan',
  'belum ditempatkan',
  'syarikat penempatan industri',
  'syarikat rakan wbl'
]);

export const isValidCompanyName = (name?: string | null): boolean => {
  const norm = normalizeText(name);
  return norm.length > 0 && !INVALID_COMPANY_VALUES.has(norm);
};

/**
 * Computes the current WBL semester week (1..20) starting from 28 September 2026.
 */
export const getCurrentWblSemesterWeek = (now: Date = new Date()): number => {
  const start = new Date(`${WBL_SEMESTER_START_DATE}T00:00:00`);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(20, week));
};

/**
 * True for Industry Trainers (Jurulatih Industri) — includes dual-role supervisors acting as JI.
 */
export const isIndustryTrainerUser = (user?: User | null): boolean => {
  if (!user) return false;
  return (
    user.role === UserRole.TRAINER ||
    (user.role === UserRole.SUPERVISOR && Boolean(user.has_dual_role))
  );
};

/**
 * True for Faculty Supervisors (Penyelia Fakulti) — Lecturers, or Coordinators / staff assigned as faculty_supervisor.
 * Explicitly excludes Industry Trainers (Jurulatih Industri).
 */
export const isFacultySupervisorUser = (
  user: User | null | undefined,
  users: User[],
  applications: Application[]
): boolean => {
  if (!user) return false;
  if (user.role === UserRole.TRAINER) return false;
  if (user.role === UserRole.LECTURER) return true;

  // Check if assigned as faculty supervisor to any student or application
  const userNameNorm = normalizeText(user.name);
  const assignedOnUser = users.some(
    (s) =>
      s.role === UserRole.STUDENT &&
      (s.faculty_supervisor_id === user.id ||
        (Boolean(userNameNorm) && normalizeText(s.faculty_supervisor_name) === userNameNorm))
  );
  if (assignedOnUser) return true;

  const assignedOnApp = applications.some(
    (a) =>
      a.faculty_supervisor_id === user.id ||
      (Boolean(userNameNorm) && normalizeText(a.faculty_supervisor_name) === userNameNorm)
  );
  return assignedOnApp;
};

export interface StudentPlacementStatus {
  isPlaced: boolean;
  companyName: string;
  approvedApp?: Application;
  isNewCohort: boolean;
  intakeLabel: string;
}

/**
 * Determines whether a student has been placed at a company and whether they belong to a new cohort.
 */
export const getStudentPlacementStatus = (
  student: User,
  applications: Application[]
): StudentPlacementStatus => {
  const sMatric = normalizeMatric(student.matric_no);
  const sUsername = normalizeText(student.username);
  const sName = normalizeText(student.name);

  const approvedApp = applications.find((a) => {
    if (a.application_status !== 'Diluluskan') return false;
    if (!isValidCompanyName(a.company_name)) return false;

    const aMatric = normalizeMatric(a.student_id);
    const aCreator = normalizeText(a.created_by);
    const aName = normalizeText(a.student_name);

    return (
      a.student_id === student.id ||
      (Boolean(sMatric) && aMatric === sMatric) ||
      (Boolean(sUsername) && aCreator === sUsername) ||
      (Boolean(sName) && aName === sName)
    );
  });

  const companyFromProfile = isValidCompanyName(student.company_affiliation)
    ? (student.company_affiliation || '').trim()
    : '';

  const companyName = approvedApp?.company_name?.trim() || companyFromProfile || '';
  const isPlaced = Boolean(approvedApp || companyFromProfile);

  const intakeLabel = (student.intake || 'Ambilan 1').trim();
  const isNewCohort = intakeLabel !== '' && intakeLabel !== 'Ambilan 1';

  return {
    isPlaced,
    companyName,
    approvedApp,
    isNewCohort,
    intakeLabel
  };
};

export interface AssignedStudentBrief {
  studentId: string;
  studentName: string;
  studentMatric: string;
  studentProgram: string;
  companyName: string;
  username?: string;
}

/**
 * Returns deduplicated list of placed students under a given Industry Trainer (company match or direct assignment).
 */
export const getTrainerAssignedStudents = (
  trainer: User,
  users: User[],
  applications: Application[]
): AssignedStudentBrief[] => {
  const trainerComp = normalizeText(trainer.company_affiliation);
  const trainerName = normalizeText(trainer.name);
  const map = new Map<string, AssignedStudentBrief>();

  const addStudent = (item: AssignedStudentBrief) => {
    const key = normalizeMatric(item.studentMatric) || item.studentId || normalizeText(item.studentName);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, item);
    }
  };

  // 1. Check approved/preferred placement applications matching trainer's company
  if (isValidCompanyName(trainer.company_affiliation)) {
    applications.forEach((app) => {
      if (app.application_status !== 'Diluluskan' && !app.student_preferred) return;
      const appComp = normalizeText(app.company_name);
      if (!appComp) return;
      const matchesComp = appComp === trainerComp || appComp.includes(trainerComp) || trainerComp.includes(appComp);
      if (!matchesComp) return;

      const matchedUser = users.find(
        (u) =>
          u.role === UserRole.STUDENT &&
          ((app.student_id && (u.matric_no === app.student_id || u.id === app.student_id)) ||
            (app.created_by && normalizeText(u.username) === normalizeText(app.created_by)))
      );

      addStudent({
        studentId: matchedUser?.id || app.student_id || app.id,
        studentName: matchedUser?.name || app.student_name || 'Pelajar WBL',
        studentMatric: matchedUser?.matric_no || app.student_id || '',
        studentProgram: matchedUser?.program || app.student_program || 'BTEC',
        companyName: app.company_name,
        username: matchedUser?.username || app.created_by
      });
    });
  }

  // 2. Check active student users directly assigned to this trainer or company
  users
    .filter((u) => u.role === UserRole.STUDENT && u.is_active !== false)
    .forEach((u) => {
      const directMatch =
        u.industry_trainer_id === trainer.id ||
        (Boolean(trainerName) && normalizeText(u.industry_trainer_name) === trainerName);

      const placement = getStudentPlacementStatus(u, applications);
      const uComp = normalizeText(placement.companyName);
      const compMatch =
        Boolean(trainerComp) &&
        isValidCompanyName(trainer.company_affiliation) &&
        Boolean(uComp) &&
        (uComp === trainerComp || uComp.includes(trainerComp) || trainerComp.includes(uComp));

      if (directMatch || (placement.isPlaced && compMatch)) {
        addStudent({
          studentId: u.id,
          studentName: u.name,
          studentMatric: u.matric_no || '',
          studentProgram: u.program || u.academic_level || 'BTEC',
          companyName: placement.companyName || trainer.company_affiliation || 'Syarikat Industri',
          username: u.username
        });
      }
    });

  return Array.from(map.values());
};

/**
 * Returns deduplicated list of active students supervised by a Faculty Supervisor (Penyelia Fakulti).
 */
export const getFacultySupervisedStudents = (
  supervisor: User,
  users: User[],
  applications: Application[]
): AssignedStudentBrief[] => {
  const supName = normalizeText(supervisor.name);
  const map = new Map<string, AssignedStudentBrief>();

  users
    .filter((u) => u.role === UserRole.STUDENT && u.is_active !== false)
    .forEach((u) => {
      const matchUser =
        u.faculty_supervisor_id === supervisor.id ||
        (Boolean(supName) && normalizeText(u.faculty_supervisor_name) === supName);

      const matchApp = applications.find(
        (a) =>
          (a.student_id === u.matric_no || a.created_by === u.username || a.student_id === u.id) &&
          (a.faculty_supervisor_id === supervisor.id ||
            (Boolean(supName) && normalizeText(a.faculty_supervisor_name) === supName))
      );

      if (matchUser || matchApp) {
        const placement = getStudentPlacementStatus(u, applications);
        const key = normalizeMatric(u.matric_no) || u.id;
        map.set(key, {
          studentId: u.id,
          studentName: u.name,
          studentMatric: u.matric_no || '',
          studentProgram: u.program || u.academic_level || 'BTEC',
          companyName: placement.companyName || matchApp?.company_name || 'Belum Ditetapkan',
          username: u.username
        });
      }
    });

  return Array.from(map.values());
};

export interface PendingPastWeekMarkItem {
  id: string;
  courseCode: string;
  courseShortName: string;
  courseName: string;
  weekNumber: number;
  semesterWeek?: number;
  semesterWeekLabel?: string;
  startDate: string;
  endDate: string;
  taskTitle: string;
  studentId: string;
  studentName: string;
  studentMatric: string;
  companyName: string;
  currentStatus: 'missing' | 'draft' | 'revision_requested';
}

const EXCLUDED_TRAINER_POPUP_COURSE_CODES = new Set(['BTMU 4084']);

/**
 * Computes ALL unfilled weekly assessment mark forms for course weeks that have already passed (endDate < today)
 * for a given Industry Trainer across all their placed students — excluding PSM 2 (BTMU 4084(i)).
 */
export const computeTrainerPendingPastWeekMarks = (
  trainer: User,
  users: User[],
  applications: Application[],
  evaluations: StudentEvaluation[],
  todayStr: string = new Date().toISOString().split('T')[0]
): PendingPastWeekMarkItem[] => {
  if (!isIndustryTrainerUser(trainer)) return [];

  const assignedStudents = getTrainerAssignedStudents(trainer, users, applications);
  if (assignedStudents.length === 0) return [];

  const pending: PendingPastWeekMarkItem[] = [];

  for (const courseSeq of WBL_COURSE_SEQUENCE) {
    const normSeqCode = normalizeCourseCode(courseSeq.courseCode);
    // Kecualikan kursus PSM 2 BTMU 4084(i) daripada popup peringatan markah mingguan Jurulatih Industri
    if (EXCLUDED_TRAINER_POPUP_COURSE_CODES.has(normSeqCode)) continue;

    const weeklyConfigs: WeeklyAssessmentConfig[] = UTEM_WEEKLY_ASSESSMENTS[courseSeq.courseCode] || [];

    for (const weekCfg of weeklyConfigs) {
      // Only include weeks that have already passed (strictly past endDate)
      if (!weekCfg.endDate || todayStr <= weekCfg.endDate) continue;

      for (const student of assignedStudents) {
        const sMatricNorm = normalizeMatric(student.studentMatric);

        const matchingEval = evaluations.find((ev) => {
          const evCourseNorm = normalizeCourseCode(ev.courseCode);
          if (evCourseNorm !== normSeqCode) return false;
          if (ev.weekNumber !== weekCfg.week) return false;

          const matchStudent =
            ev.studentId === student.studentId ||
            (Boolean(sMatricNorm) && normalizeMatric(ev.studentMatric) === sMatricNorm);
          return matchStudent;
        });

        const isCompleted =
          matchingEval &&
          (matchingEval.status === 'submitted_by_trainer' ||
            matchingEval.status === 'verified_by_lecturer');

        if (!isCompleted) {
          pending.push({
            id: `${courseSeq.courseCode}_w${weekCfg.week}_${student.studentMatric || student.studentId}`,
            courseCode: courseSeq.courseCode,
            courseShortName: courseSeq.shortName,
            courseName: courseSeq.courseName,
            weekNumber: weekCfg.week,
            semesterWeek: weekCfg.semesterWeek,
            semesterWeekLabel: weekCfg.semesterWeekLabel,
            startDate: weekCfg.startDate || courseSeq.startDate,
            endDate: weekCfg.endDate,
            taskTitle: weekCfg.taskTitle,
            studentId: student.studentId,
            studentName: student.studentName,
            studentMatric: student.studentMatric,
            companyName: student.companyName,
            currentStatus:
              matchingEval?.status === 'revision_requested'
                ? 'revision_requested'
                : matchingEval?.status === 'draft'
                ? 'draft'
                : 'missing'
          });
        }
      }
    }
  }

  return pending;
};

export interface StudentLogReminderSummary {
  currentWeek: number;
  hasFilledCurrentDailyLog: boolean;
  missingDailyWeeks: number[];
  draftOrRevisionDailyWeeks: number[];
  hasFilledCurrentCaseStudy: boolean;
  missingCaseStudyWeeks: number[];
  draftOrRevisionCaseStudyWeeks: number[];
  needsDailyReminder: boolean;
  needsCaseStudyReminder: boolean;
}

/**
 * Computes missing / unsubmitted Buku Log Harian and Buku Log Case Study PSM 2 reminders for a student.
 */
export const computeStudentLogReminders = (
  student: User,
  weeklyLogs: WeeklyLogbook[],
  psmLogs: PsmCaseStudyWeeklyLog[],
  currentWeek: number = getCurrentWblSemesterWeek()
): StudentLogReminderSummary => {
  const sMatric = normalizeMatric(student.matric_no);
  const sName = normalizeText(student.name);

  const myDailyLogs = weeklyLogs.filter(
    (l) =>
      l.studentId === student.id ||
      (Boolean(sMatric) && normalizeMatric(l.studentMatric) === sMatric) ||
      (Boolean(sName) && normalizeText(l.studentName) === sName)
  );

  const myPsmLogs = psmLogs.filter(
    (l) =>
      l.studentId === student.id ||
      (Boolean(sMatric) && normalizeMatric(l.studentMatric) === sMatric) ||
      (Boolean(sName) && normalizeText(l.studentName) === sName)
  );

  const missingDailyWeeks: number[] = [];
  const draftOrRevisionDailyWeeks: number[] = [];

  const missingCaseStudyWeeks: number[] = [];
  const draftOrRevisionCaseStudyWeeks: number[] = [];

  for (let w = 1; w <= currentWeek; w++) {
    const dLog = myDailyLogs.find((l) => l.weekNumber === w);
    const hasEntries = Boolean(
      dLog && (dLog.entries || []).some((e) => e.tasks && e.tasks.trim().length > 0)
    );
    if (!dLog || (!hasEntries && dLog.status === 'draft')) {
      missingDailyWeeks.push(w);
    } else if (dLog.status === 'draft' || dLog.status === 'revision') {
      draftOrRevisionDailyWeeks.push(w);
    }

    const pLog = myPsmLogs.find((l) => l.weekNumber === w);
    if (!pLog || (!pLog.caseTitle?.trim() && pLog.status === 'draft')) {
      missingCaseStudyWeeks.push(w);
    } else if (pLog.status === 'draft' || pLog.status === 'revision') {
      draftOrRevisionCaseStudyWeeks.push(w);
    }
  }

  const currentDailyLog = myDailyLogs.find((l) => l.weekNumber === currentWeek);
  const hasFilledCurrentDailyLog = Boolean(
    currentDailyLog &&
      (currentDailyLog.status === 'submitted' ||
        currentDailyLog.status === 'verified' ||
        (currentDailyLog.entries || []).some((e) => e.tasks && e.tasks.trim().length > 0))
  );

  const currentPsmLog = myPsmLogs.find((l) => l.weekNumber === currentWeek);
  const hasFilledCurrentCaseStudy = Boolean(
    currentPsmLog &&
      (currentPsmLog.status === 'submitted' ||
        currentPsmLog.status === 'reviewed_by_trainer' ||
        currentPsmLog.status === 'reviewed_by_supervisor' ||
        currentPsmLog.status === 'completed' ||
        Boolean(currentPsmLog.caseTitle?.trim()))
  );

  return {
    currentWeek,
    hasFilledCurrentDailyLog,
    missingDailyWeeks,
    draftOrRevisionDailyWeeks,
    hasFilledCurrentCaseStudy,
    missingCaseStudyWeeks,
    draftOrRevisionCaseStudyWeeks,
    needsDailyReminder: !hasFilledCurrentDailyLog || missingDailyWeeks.length > 0 || draftOrRevisionDailyWeeks.length > 0,
    needsCaseStudyReminder: !hasFilledCurrentCaseStudy || missingCaseStudyWeeks.length > 0 || draftOrRevisionCaseStudyWeeks.length > 0
  };
};

export interface StaffVerificationReminders {
  isTrainer: boolean;
  isFacultySupervisor: boolean;
  pendingDailyLogsForTrainer: WeeklyLogbook[];
  pendingDailyLogsForFaculty: WeeklyLogbook[];
  // Strictly ONLY for Faculty Supervisor (Penyelia Fakulti)
  pendingCaseStudyLogsForFaculty: PsmCaseStudyWeeklyLog[];
}

/**
 * Computes pending log verification reminders:
 * - Buku Log Harian -> Jurulatih Industri AND Penyelia Fakulti
 * - Log Case Study PSM 2 -> ONLY Penyelia Fakulti (NEVER Jurulatih Industri)
 */
export const computeStaffVerificationReminders = (
  currentUser: User | null | undefined,
  users: User[],
  applications: Application[],
  weeklyLogs: WeeklyLogbook[],
  psmLogs: PsmCaseStudyWeeklyLog[]
): StaffVerificationReminders => {
  if (!currentUser) {
    return {
      isTrainer: false,
      isFacultySupervisor: false,
      pendingDailyLogsForTrainer: [],
      pendingDailyLogsForFaculty: [],
      pendingCaseStudyLogsForFaculty: []
    };
  }

  const isTrainer = isIndustryTrainerUser(currentUser);
  const isFacultySupervisor = isFacultySupervisorUser(currentUser, users, applications);

  let pendingDailyLogsForTrainer: WeeklyLogbook[] = [];
  if (isTrainer) {
    const trainerComp = normalizeText(currentUser.company_affiliation);
    const trainerName = normalizeText(currentUser.name);
    const assignedStudents = getTrainerAssignedStudents(currentUser, users, applications);
    const assignedIds = new Set(assignedStudents.map((s) => s.studentId));
    const assignedMatrics = new Set(assignedStudents.map((s) => normalizeMatric(s.studentMatric)).filter(Boolean));

    pendingDailyLogsForTrainer = weeklyLogs.filter((l) => {
      if (l.status !== 'submitted') return false;
      const matchAssigned =
        assignedIds.has(l.studentId) ||
        assignedMatrics.has(normalizeMatric(l.studentMatric));
      const matchComp =
        Boolean(trainerComp) &&
        isValidCompanyName(currentUser.company_affiliation) &&
        Boolean(l.companyName) &&
        (normalizeText(l.companyName).includes(trainerComp) ||
          trainerComp.includes(normalizeText(l.companyName)));
      const matchSelf =
        l.verifiedByTrainerId === currentUser.id ||
        (Boolean(trainerName) && normalizeText(l.trainerName) === trainerName);

      return matchAssigned || matchComp || matchSelf;
    });
  }

  let pendingDailyLogsForFaculty: WeeklyLogbook[] = [];
  let pendingCaseStudyLogsForFaculty: PsmCaseStudyWeeklyLog[] = [];

  if (isFacultySupervisor) {
    const supervised = getFacultySupervisedStudents(currentUser, users, applications);
    const supIds = new Set(supervised.map((s) => s.studentId));
    const supMatrics = new Set(supervised.map((s) => normalizeMatric(s.studentMatric)).filter(Boolean));

    // Buku Log Harian awaiting faculty supervisor verification/review
    pendingDailyLogsForFaculty = weeklyLogs.filter((l) => {
      const belongs =
        supIds.has(l.studentId) || supMatrics.has(normalizeMatric(l.studentMatric));
      if (!belongs) return false;
      if (l.status === 'draft') return false;
      return l.status === 'submitted' || !l.supervisorReviewedAt;
    });

    // Log Case Study PSM 2 awaiting faculty supervisor verification (ONLY for Penyelia Fakulti)
    pendingCaseStudyLogsForFaculty = psmLogs.filter((l) => {
      const belongs =
        supIds.has(l.studentId) || supMatrics.has(normalizeMatric(l.studentMatric));
      if (!belongs) return false;
      if (l.status === 'draft' || l.status === 'completed') return false;
      return l.supervisorStatus !== 'verified';
    });
  }

  return {
    isTrainer,
    isFacultySupervisor,
    pendingDailyLogsForTrainer,
    pendingDailyLogsForFaculty,
    pendingCaseStudyLogsForFaculty
  };
};
