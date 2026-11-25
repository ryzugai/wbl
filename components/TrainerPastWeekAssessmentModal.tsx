import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Application, StudentEvaluation, User } from '../types';
import { StorageService } from '../services/storage';
import {
  computeTrainerPendingPastWeekMarks,
  isIndustryTrainerUser,
  PendingPastWeekMarkItem
} from '../utils/wblRemindersAndEnrollment';
import { Language } from '../translations';
import { toast } from 'react-hot-toast';

interface TrainerPastWeekAssessmentModalProps {
  currentUser: User;
  users: User[];
  applications: Application[];
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  language: Language;
}

export const TrainerPastWeekAssessmentModal: React.FC<TrainerPastWeekAssessmentModalProps> = ({
  currentUser,
  users,
  applications,
  currentView,
  onNavigate,
  onLogout,
  language
}) => {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>(() =>
    StorageService.getEvaluations()
  );

  useEffect(() => {
    const sync = () => setEvaluations(StorageService.getEvaluations());
    sync();
    const unsub = StorageService.subscribe(sync);
    return () => unsub();
  }, []);

  const isTrainer = isIndustryTrainerUser(currentUser);

  const pendingItems = useMemo(() => {
    if (!isTrainer) return [];
    return computeTrainerPendingPastWeekMarks(currentUser, users, applications, evaluations);
  }, [isTrainer, currentUser, users, applications, evaluations]);

  // Notify trainer when all pending past-week marks are completed
  const prevPendingCountRef = useRef<number>(pendingItems.length);
  useEffect(() => {
    if (prevPendingCountRef.current > 0 && pendingItems.length === 0 && isTrainer) {
      toast.success(
        language === 'ms'
          ? 'Tahniah! Semua borang markah minggu kursus yang telah berlalu berjaya dilengkapkan. Peringatan telah dipadam.'
          : 'All past course week assessment forms have been completed!',
        { duration: 5000 }
      );
    }
    prevPendingCountRef.current = pendingItems.length;
  }, [pendingItems.length, isTrainer, language]);

  // Group pending items by course for clean presentation
  const groupedByCourse = useMemo(() => {
    const map = new Map<
      string,
      {
        courseCode: string;
        courseShortName: string;
        courseName: string;
        items: PendingPastWeekMarkItem[];
      }
    >();

    pendingItems.forEach((item) => {
      const existing = map.get(item.courseCode);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.courseCode, {
          courseCode: item.courseCode,
          courseShortName: item.courseShortName,
          courseName: item.courseName,
          items: [item]
        });
      }
    });

    return Array.from(map.values());
  }, [pendingItems]);

  const affectedStudentCount = useMemo(
    () => new Set(pendingItems.map((i) => i.studentMatric || i.studentId)).size,
    [pendingItems]
  );

  if (!isTrainer || pendingItems.length === 0) {
    return null;
  }

  const jumpToMarkForm = (item: PendingPastWeekMarkItem) => {
    sessionStorage.setItem('selectedWeeklyCourseCode', item.courseCode);
    sessionStorage.setItem('selectedWeeklyStudentMatric', item.studentMatric);
    sessionStorage.setItem('autoOpenWeeklyWeek', String(item.weekNumber));

    if (currentView !== 'weeklyAssessment' && currentView !== 'studentEvaluation') {
      onNavigate('weeklyAssessment');
    }

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('wblCourseSelected', {
          detail: {
            courseCode: item.courseCode,
            studentMatric: item.studentMatric,
            weekNumber: item.weekNumber,
            view: 'weekly'
          }
        })
      );
    }, 60);
  };

  const isOnAssessmentWorkspace =
    currentView === 'weeklyAssessment' || currentView === 'studentEvaluation';

  // While actively filling marks inside the Weekly Assessment workspace, show a non-dismissible top banner
  // so the trainer can interact with the grading forms without being blocked, while keeping the reminder active.
  if (isOnAssessmentWorkspace) {
    const nextItem = pendingItems[0];
    return (
      <div className="sticky top-0 z-40 mb-4 bg-gradient-to-r from-rose-700 via-red-700 to-amber-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg border-2 border-rose-300/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/15 border border-white/25 shrink-0">
              <AlertTriangle size={18} className="text-amber-300" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-black uppercase tracking-wider flex flex-wrap items-center gap-2">
                <span>
                  {language === 'ms'
                    ? 'PERINGATAN WAJIB JURULATIH INDUSTRI (TIDAK BOLEH DIPADAM)'
                    : 'MANDATORY INDUSTRY TRAINER REMINDER'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[10px]">
                  Baki {pendingItems.length} Borang Markah Minggu Lepas
                </span>
              </div>
              <p className="text-rose-100 leading-snug">
                {language === 'ms'
                  ? 'Sila lengkapkan dan HANTAR kesemua borang markah bagi minggu kursus yang telah berlalu. Peringatan ini hanya akan terpadam secara automatik selepas semua markah dihantar.'
                  : 'Please complete and submit all assessment mark forms for past course weeks. This reminder will automatically clear once all marks are submitted.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => jumpToMarkForm(nextItem)}
              className="px-3.5 py-2 bg-white text-rose-800 hover:bg-amber-50 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <ClipboardCheck size={14} />
              <span>
                Isi Seterusnya: {nextItem.courseCode} M{nextItem.weekNumber} ({nextItem.studentName.split(' ')[0]})
              </span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // On Dashboard & all other pages: FULL NON-DISMISSIBLE POPUP MODAL (No close/X/backdrop dismiss)
  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="trainer-mark-reminder-title"
    >
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-rose-500 flex flex-col overflow-hidden">
        {/* Urgent Header (No Close Button) */}
        <div className="bg-gradient-to-r from-rose-800 via-red-700 to-amber-700 text-white p-5 sm:p-6 border-b-4 border-amber-400 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-white/15 border border-white/30 shrink-0">
                <AlertTriangle size={26} className="text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <Lock size={11} />
                  <span>
                    {language === 'ms'
                      ? 'PERINGATAN MANDATORI • TIDAK BOLEH DITUTUP SEBELUM MARKAH DIISI'
                      : 'MANDATORY REMINDER • CANNOT BE DISMISSED UNTIL GRADED'}
                  </span>
                </div>
                <h2 id="trainer-mark-reminder-title" className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                  {language === 'ms'
                    ? 'Peringatan Pengisian Borang Markah Mingguan Jurulatih Industri'
                    : 'Industry Trainer Past-Week Assessment Marks Reminder'}
                </h2>
                <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                  {language === 'ms'
                    ? 'Terdapat minggu kursus WBL yang telah berlalu tetapi borang markah pelajar di syarikat anda masih belum dilengkapkan & dihantar. Selagi markah belum diisi, popup peringatan ini tidak akan terpadam.'
                    : 'There are past WBL course weeks with unfilled student assessment marks for your company. This popup cannot be dismissed until all pending marks are submitted.'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Pills */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20 text-center">
              <div className="text-lg sm:text-xl font-black text-amber-300">{pendingItems.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                Borang Markah Tertunggak
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20 text-center">
              <div className="text-lg sm:text-xl font-black text-white">{groupedByCourse.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                Kursus Terlibat
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20 text-center">
              <div className="text-lg sm:text-xl font-black text-white">{affectedStudentCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                Pelajar Industri
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable List of Pending Past-Week Mark Forms */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {groupedByCourse.map((group) => (
            <div
              key={group.courseCode}
              className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden"
            >
              <div className="px-4 py-3 bg-rose-50/90 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-black text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200 mr-2">
                    {group.courseCode}
                  </span>
                  <span className="text-xs font-black text-slate-900">{group.courseShortName}</span>
                </div>
                <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  {group.items.length} Minggu / Pelajar Belum Diisi
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                          {item.semesterWeek
                            ? `Minggu ${item.semesterWeek} (M${item.weekNumber})`
                            : `Minggu ${item.weekNumber}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>
                            Tamat: {new Date(item.endDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.currentStatus === 'revision_requested'
                              ? 'bg-rose-100 text-rose-800'
                              : item.currentStatus === 'draft'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.currentStatus === 'revision_requested'
                            ? 'Perlu Semakan Semula'
                            : item.currentStatus === 'draft'
                            ? 'Draf Belum Dihantar'
                            : 'Belum Diisi'}
                        </span>
                      </div>

                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <UserIcon size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.studentName}</span>
                        {item.studentMatric && (
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            ({item.studentMatric})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {item.taskTitle}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => jumpToMarkForm(item)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      <ClipboardCheck size={14} />
                      <span>Isi Markah</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions — Only Go To Mark Form or Logout (No Dismiss!) */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Clock size={14} className="text-rose-600 shrink-0" />
            <span>
              Popup akan <strong>terpadam secara automatik</strong> sebaik sahaja semua borang markah minggu lepas dihantar.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Keluar</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToMarkForm(pendingItems[0])}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Isi Borang Markah Sekarang</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
