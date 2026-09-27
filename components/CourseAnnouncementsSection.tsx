import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, CourseAnnouncement, CourseAnnouncementReadReceipt, AnnouncementPriority, AnnouncementCategory, CourseLecturerAssignment } from '../types';
import { StorageService } from '../services/storage';
import { Language } from '../translations';
import { 
  Megaphone, Plus, Bell, CheckCircle2, Clock, AlertTriangle, 
  Trash2, Eye, Users, Search, Filter, Check, Calendar, UserCheck, 
  Send, X, Sparkles, BookOpen, ChevronDown, ChevronUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CourseAnnouncementsSectionProps {
  currentUser: User;
  courseCode?: string; // If provided, shows announcements for this course; if 'all' or undefined, shows for all relevant courses
  courseName?: string;
  assignedCourses?: CourseLecturerAssignment[];
  users?: User[];
  language?: Language;
  onRefresh?: () => void;
}

export const CourseAnnouncementsSection: React.FC<CourseAnnouncementsSectionProps> = ({
  currentUser,
  courseCode = 'all',
  courseName,
  assignedCourses = [],
  users = [],
  language = 'ms',
  onRefresh
}) => {
  const isLecturer = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true || (currentUser as any).is_admin === true;
  const isStudent = currentUser.role === UserRole.STUDENT;
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const canPost = isLecturer || isCoordinator;

  const [announcements, setAnnouncements] = useState<CourseAnnouncement[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(courseCode);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<CourseAnnouncement | null>(null);
  const [receiptTab, setReceiptTab] = useState<'read' | 'unread'>('read');
  const [isSendingBulkReminders, setIsSendingBulkReminders] = useState(false);

  // Form state
  const [formCourseCode, setFormCourseCode] = useState<string>(courseCode !== 'all' ? courseCode : (assignedCourses[0]?.courseCode || 'BTMT 3273(i)'));
  const [formBroadcastAll, setFormBroadcastAll] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>('normal');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('general');

  useEffect(() => {
    setSelectedCourseFilter(courseCode);
  }, [courseCode]);

  const loadData = () => {
    try {
      const all = StorageService.getCourseAnnouncements(selectedCourseFilter === 'all' ? undefined : selectedCourseFilter);
      setAnnouncements(all);
    } catch {}
  };

  useEffect(() => {
    loadData();
    const unsub = StorageService.subscribe(loadData);
    return () => unsub();
  }, [selectedCourseFilter]);

  // If student views an announcement, auto-mark as read
  useEffect(() => {
    if (isStudent && announcements.length > 0) {
      announcements.forEach(ann => {
        const alreadyRead = (ann.readReceipts || []).some(r => 
          r.studentId === currentUser.id || 
          (currentUser.matric_no && r.studentMatric === currentUser.matric_no)
        );
        if (!alreadyRead) {
          // Check if student belongs to this course or cohort
          StorageService.markAnnouncementAsRead(ann.id, currentUser).catch(() => {});
        }
      });
    }
  }, [isStudent, announcements, currentUser]);

  // Available courses for dropdown
  const availableCourses = useMemo(() => {
    if (assignedCourses.length > 0) return assignedCourses;
    return StorageService.getCourseAssignments();
  }, [assignedCourses]);

  // Enrolled students map for each course
  const courseEnrolledMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    availableCourses.forEach(c => {
      map[c.courseCode] = c.assignedStudentIds || [];
    });
    return map;
  }, [availableCourses]);

  // All student users in system
  const allStudents = useMemo(() => {
    return users.filter(u => u.role === UserRole.STUDENT);
  }, [users]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      if (selectedCourseFilter !== 'all' && a.courseCode !== selectedCourseFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.courseCode.toLowerCase().includes(q) ||
          a.lecturerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements, selectedCourseFilter, priorityFilter, searchQuery]);

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan tajuk pengumuman.' : 'Please enter announcement title.');
      return;
    }
    if (!formContent.trim()) {
      toast.error(language === 'ms' ? 'Sila masukkan kandungan pengumuman.' : 'Please enter announcement content.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formBroadcastAll && assignedCourses.length > 0) {
        // Broadcast to all assigned courses
        for (const c of assignedCourses) {
          await StorageService.saveCourseAnnouncement({
            courseCode: c.courseCode,
            courseName: c.courseName,
            lecturerId: currentUser.id,
            lecturerName: currentUser.name,
            lecturerStaffId: currentUser.staff_id,
            lecturerEmail: currentUser.email,
            title: formTitle,
            content: formContent,
            priority: formPriority,
            category: formCategory,
            semester: c.semester || 'Semester 7',
            targetStudentIds: c.assignedStudentIds || []
          });
        }
        toast.success(
          language === 'ms' 
            ? `Pengumuman berjaya diterbitkan kepada ${assignedCourses.length} kursus!` 
            : `Announcement broadcast to ${assignedCourses.length} courses!`
        );
      } else {
        const targetCourse = availableCourses.find(c => c.courseCode === formCourseCode) || {
          courseCode: formCourseCode,
          courseName: courseName || formCourseCode,
          semester: 'Semester 7',
          assignedStudentIds: []
        };

        await StorageService.saveCourseAnnouncement({
          courseCode: targetCourse.courseCode,
          courseName: targetCourse.courseName,
          lecturerId: currentUser.id,
          lecturerName: currentUser.name,
          lecturerStaffId: currentUser.staff_id,
          lecturerEmail: currentUser.email,
          title: formTitle,
          content: formContent,
          priority: formPriority,
          category: formCategory,
          semester: targetCourse.semester || 'Semester 7',
          targetStudentIds: targetCourse.assignedStudentIds || []
        });
        toast.success(
          language === 'ms' 
            ? `Pengumuman bagi ${targetCourse.courseCode} berjaya diterbitkan!` 
            : `Announcement published for ${targetCourse.courseCode}!`
        );
      }

      setFormTitle('');
      setFormContent('');
      setFormPriority('normal');
      setFormCategory('general');
      setIsCreateModalOpen(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menerbitkan pengumuman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!window.confirm(language === 'ms' ? `Adakah anda pasti ingin memadam pengumuman "${title}"?` : `Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await StorageService.deleteCourseAnnouncement(id);
      toast.success(language === 'ms' ? 'Pengumuman telah dipadam.' : 'Announcement deleted.');
      loadData();
    } catch {
      toast.error(language === 'ms' ? 'Gagal memadam pengumuman.' : 'Failed to delete announcement.');
    }
  };

  // Compute Readership Stats for a given announcement
  const getReadershipStats = (announcement: CourseAnnouncement) => {
    const enrolledIds = courseEnrolledMap[announcement.courseCode] || announcement.targetStudentIds || [];
    
    // Eligible students for this course
    let targetStudents: User[] = [];
    if (enrolledIds.length > 0) {
      targetStudents = allStudents.filter(s => enrolledIds.includes(s.id) || enrolledIds.includes(s.matric_no || ''));
    } else {
      // Default to cohort students
      targetStudents = allStudents;
    }

    const totalTarget = Math.max(targetStudents.length, (announcement.readReceipts || []).length);
    const readReceipts = announcement.readReceipts || [];
    
    // Identify read students
    const readStudentIds = new Set(readReceipts.map(r => r.studentId));
    const readMatrics = new Set(readReceipts.map(r => r.studentMatric));

    const readList = targetStudents.filter(s => readStudentIds.has(s.id) || (s.matric_no && readMatrics.has(s.matric_no)));
    // Also include any receipts that might not match targetStudents directly
    const readCount = readReceipts.length;

    // Identify unread students
    const unreadList = targetStudents.filter(s => !readStudentIds.has(s.id) && (!s.matric_no || !readMatrics.has(s.matric_no)));
    const unreadCount = Math.max(0, targetStudents.length - readList.length);

    const percentRead = totalTarget > 0 ? Math.min(100, Math.round((readCount / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      readCount,
      unreadCount,
      percentRead,
      readList: readReceipts,
      unreadList
    };
  };

  // Send single reminder to unread student
  const handleSendReminder = async (announcement: CourseAnnouncement, student: User) => {
    try {
      await StorageService.sendAnnouncementReminder(announcement.id, {
        id: student.id,
        name: student.name,
        matric_no: student.matric_no
      });
      toast.success(language === 'ms' ? `Peringatan dihantar kepada ${student.name}.` : `Reminder sent to ${student.name}.`);
    } catch {
      toast.error('Gagal menghantar peringatan.');
    }
  };

  // Send bulk reminders to all unread students
  const handleSendBulkReminders = async (announcement: CourseAnnouncement, unreadList: User[]) => {
    if (unreadList.length === 0) return;
    setIsSendingBulkReminders(true);
    try {
      const count = await StorageService.sendBulkAnnouncementReminders(
        announcement.id,
        unreadList.map(s => ({ id: s.id, name: s.name, matric_no: s.matric_no }))
      );
      toast.success(
        language === 'ms'
          ? `Peringatan segera berjaya dihantar kepada ${count} orang pelajar belum baca!`
          : `Reminders sent to ${count} unread students!`
      );
    } catch {
      toast.error('Ralat menghantar peringatan pukal.');
    } finally {
      setIsSendingBulkReminders(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/30 rounded-xl text-amber-300">
              <Megaphone size={18} />
            </span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              {language === 'ms' ? 'Modul Komunikasi Kursus' : 'Course Communication Module'}
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{language === 'ms' ? 'Pengumuman Kursus & Penjejakan Pembaca Pelajar' : 'Course Announcements & Read Receipts'}</span>
          </h3>
          <p className="text-xs text-slate-300">
            {language === 'ms' 
              ? 'Pensyarah boleh menyiarkan pengumuman kursus dan memantau status siapa pelajar yang telah membaca atau belum membaca secara masa nyata.'
              : 'Lecturers can post course announcements and track real-time student readership (who has read vs not read).'}
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            onClick={() => {
              setFormCourseCode(courseCode !== 'all' ? courseCode : (assignedCourses[0]?.courseCode || 'BTMT 3273(i)'));
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            <span>{language === 'ms' ? '+ Buat Pengumuman Kursus' : '+ Post Course Announcement'}</span>
          </button>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ms' ? 'Cari tajuk, isi kandungan, kursus atau pensyarah...' : 'Search announcement...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course Filter */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none"
          >
            <option value="all">{language === 'ms' ? 'Semua Kursus' : 'All Courses'}</option>
            {availableCourses.map(c => (
              <option key={c.id || c.courseCode} value={c.courseCode}>
                {c.courseCode} - {c.courseName}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none"
          >
            <option value="all">{language === 'ms' ? 'Semua Keutamaan' : 'All Priorities'}</option>
            <option value="urgent">{language === 'ms' ? '🚨 Segera / Mustahak' : 'Urgent'}</option>
            <option value="important">{language === 'ms' ? '⭐ Penting' : 'Important'}</option>
            <option value="normal">{language === 'ms' ? 'Makluman Biasa' : 'Normal'}</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-colors"
            title="Muat semula"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
              <Megaphone size={26} />
            </div>
            <h4 className="text-base font-bold text-slate-700">
              {language === 'ms' ? 'Tiada Pengumuman Kursus Dijumpai' : 'No Course Announcements Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {canPost 
                ? (language === 'ms' ? 'Klik butang "+ Buat Pengumuman Kursus" untuk menyiarkan pemberitahuan kepada para pelajar.' : 'Click "+ Post Course Announcement" to create announcements.')
                : (language === 'ms' ? 'Pensyarah belum menerbitkan sebarang pengumuman bagi kursus ini.' : 'No announcements have been published for this course yet.')}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const stats = getReadershipStats(ann);
            const isReadByMe = isStudent && (ann.readReceipts || []).some(r => 
              r.studentId === currentUser.id || (currentUser.matric_no && r.studentMatric === currentUser.matric_no)
            );

            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';

            return (
              <div 
                key={ann.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-4 ${
                  isUrgent 
                    ? 'border-rose-300 ring-2 ring-rose-100' 
                    : isImportant
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                {/* Announcement Top Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                      {ann.courseCode}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {ann.courseName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {ann.semester || 'Semester 7'}
                    </span>

                    {/* Priority Badge */}
                    {isUrgent ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={11} />
                        <span>SEGERA / MUSTAHAK</span>
                      </span>
                    ) : isImportant ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertCircle size={11} />
                        <span>PENTING</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Makluman Biasa
                      </span>
                    )}

                    {/* Student personal read status */}
                    {isStudent && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                        isReadByMe 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800 animate-pulse'
                      }`}>
                        {isReadByMe ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        <span>{isReadByMe ? '✓ Telah Dibaca' : 'Pengumuman Baharu'}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions for Lecturer */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(ann.createdAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>

                    {canPost && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Padam pengumuman"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcement Content */}
                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-900 leading-snug">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {ann.content}
                  </p>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                    <span>Diterbitkan oleh:</span>
                    <strong className="text-indigo-900 font-semibold">{ann.lecturerName}</strong>
                    {ann.lecturerStaffId && <span className="text-slate-400">({ann.lecturerStaffId})</span>}
                  </div>
                </div>

                {/* READERSHIP STATUS BAR (WHO READ / WHO HASN'T READ) */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/80 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Read Progress Summary */}
                    <div className="space-y-1.5 flex-1 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Eye size={13} className="text-indigo-600" />
                          <span>Status Pembacaan Pelajar:</span>
                        </span>
                        <span className="font-black text-indigo-700">
                          {stats.readCount} / {stats.totalTarget} Pelajar ({stats.percentRead}%)
                        </span>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${stats.percentRead}%` }} 
                        />
                        <div 
                          className="bg-amber-400 h-full transition-all duration-500" 
                          style={{ width: `${100 - stats.percentRead}%` }} 
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 font-bold">
                          ✓ {stats.readCount} telah baca
                        </span>
                        <span className="text-amber-800 font-bold">
                          ⏳ {stats.unreadCount} belum baca
                        </span>
                      </div>
                    </div>

                    {/* View Details Button (Available to lecturers/coordinators) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {canPost && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceiptModal(ann);
                            setReceiptTab('unread');
                          }}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <Users size={14} />
                          <span>{language === 'ms' ? 'Lihat Siapa Baca / Belum Baca' : 'View Read Breakdown'}</span>
                        </button>
                      )}

                      {canPost && stats.unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendBulkReminders(ann, stats.unreadList)}
                          disabled={isSendingBulkReminders}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <Bell size={13} />
                          <span>{language === 'ms' ? `Peringatan (${stats.unreadCount})` : `Remind (${stats.unreadCount})`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT PENGUMUMAN KURSUS BAHARU                                    */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/30 rounded-xl text-amber-300">
                  <Megaphone size={18} />
                </span>
                <div>
                  <h3 className="font-black text-base">
                    {language === 'ms' ? 'Buat Pengumuman Kursus Baharu' : 'Create New Course Announcement'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {language === 'ms' ? 'Siarkan mesej rasmi kepada pelajar yang dienrol bagi kursus' : 'Broadcast official message to enrolled students'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4 text-xs">
              {/* Target Course */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {language === 'ms' ? 'Sasaran Kursus:' : 'Target Course:'}
                </label>
                <select
                  value={formCourseCode}
                  onChange={(e) => setFormCourseCode(e.target.value)}
                  disabled={formBroadcastAll}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500 disabled:bg-slate-100"
                >
                  {availableCourses.map(c => (
                    <option key={c.id || c.courseCode} value={c.courseCode}>
                      {c.courseCode} - {c.courseName} ({c.lecturerName})
                    </option>
                  ))}
                </select>

                {assignedCourses.length > 1 && (
                  <label className="flex items-center gap-2 pt-1 text-slate-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBroadcastAll}
                      onChange={(e) => setFormBroadcastAll(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>
                      {language === 'ms' 
                        ? `Siarkan sekaligus kepada kesemua ${assignedCourses.length} kursus pengajaran saya` 
                        : `Broadcast to all my ${assignedCourses.length} assigned courses`}
                    </span>
                  </label>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {language === 'ms' ? 'Tajuk Pengumuman:' : 'Announcement Title:'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ms' ? 'Contoh: Peringatan Tarikh Akhir Penyerahan Rubrik Minggu 5' : 'e.g. Reminder on Rubric Submission'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {language === 'ms' ? 'Tahap Keutamaan:' : 'Priority Level:'}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as AnnouncementPriority)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="normal">{language === 'ms' ? 'Biasa (Makluman Am)' : 'Normal'}</option>
                    <option value="important">{language === 'ms' ? '⭐ Penting (Perlu Tindakan)' : 'Important'}</option>
                    <option value="urgent">{language === 'ms' ? '🚨 Segera / Mustahak' : 'Urgent'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {language === 'ms' ? 'Kategori:' : 'Category:'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AnnouncementCategory)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="general">{language === 'ms' ? 'Makluman Am' : 'General'}</option>
                    <option value="assessment">{language === 'ms' ? 'Penilaian Industri' : 'Industrial Assessment'}</option>
                    <option value="assignment">{language === 'ms' ? 'Tugasan & Aktiviti' : 'Assignment'}</option>
                    <option value="rubric">{language === 'ms' ? 'Rubrik & Kriteria UTeM' : 'Rubrics'}</option>
                    <option value="reminder">{language === 'ms' ? 'Peringatan / Tarikh Akhir' : 'Deadline Reminder'}</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {language === 'ms' ? 'Kandungan / Butiran Pengumuman:' : 'Announcement Content:'}
                </label>
                <textarea
                  rows={5}
                  placeholder={language === 'ms' ? 'Tuliskan teks pesanan, arahan, atau peringatan kepada pelajar di sini...' : 'Write announcement text here...'}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 leading-relaxed"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <Bell size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'ms'
                    ? 'Notifikasi sistem akan dihantar secara automatik kepada semua pelajar yang dienrol bagi kursus ini apabila diterbitkan.'
                    : 'System notifications will be automatically broadcast to all enrolled students upon publication.'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {language === 'ms' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? (language === 'ms' ? 'Menerbitkan...' : 'Publishing...') : (language === 'ms' ? 'Terbitkan Pengumuman' : 'Publish Announcement')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STATUS BACAAN PELAJAR (READ RECEIPTS BREAKDOWN: TELAH BACA / BELUM)*/}
      {/* ========================================================================= */}
      {activeReceiptModal && (() => {
        const stats = getReadershipStats(activeReceiptModal);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-amber-400 text-slate-900 rounded">
                      {activeReceiptModal.courseCode}
                    </span>
                    <span className="text-xs text-slate-300">
                      Status Bacaan Pelajar (Read Receipts)
                    </span>
                  </div>
                  <h3 className="font-black text-base truncate max-w-lg">
                    {activeReceiptModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Jumlah Enrolmen: {stats.totalTarget} pelajar • {stats.readCount} telah membaca ({stats.percentRead}%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReceiptModal(null)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subtabs: Belum Baca vs Telah Baca */}
              <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 pt-3">
                <button
                  type="button"
                  onClick={() => setReceiptTab('unread')}
                  className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                    receiptTab === 'unread'
                      ? 'border-amber-500 text-amber-900 bg-white rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Clock size={14} className="text-amber-600" />
                  <span>Pelajar Belum Baca</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {stats.unreadCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptTab('read')}
                  className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                    receiptTab === 'read'
                      ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Pelajar Telah Baca</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {stats.readCount}
                  </span>
                </button>
              </div>

              {/* Tab Content List */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3">
                {receiptTab === 'unread' ? (
                  stats.unreadList.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                      <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-sm text-emerald-900">
                        {language === 'ms' ? 'Semua Pelajar Telah Membaca!' : 'All Students Have Read!'}
                      </h4>
                      <p className="text-xs text-emerald-700">
                        {language === 'ms' 
                          ? '100% daripada pelajar yang disasarkan telah membuka dan membaca pengumuman ini.' 
                          : '100% of targeted students have read this announcement.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Bulk Reminder Banner */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-amber-600 shrink-0" />
                          <span className="text-xs text-amber-900 font-semibold">
                            {stats.unreadList.length} orang pelajar belum membaca makluman ini.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendBulkReminders(activeReceiptModal, stats.unreadList)}
                          disabled={isSendingBulkReminders}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-xs transition-all disabled:opacity-50"
                        >
                          {isSendingBulkReminders ? 'Menghantar...' : 'Hantar Peringatan Pukal'}
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {stats.unreadList.map(student => (
                          <div key={student.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <span>{student.name}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {student.matric_no || student.id} • {student.email}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-sm">
                                {student.program || student.academic_level || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSendReminder(activeReceiptModal, student)}
                              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                            >
                              <Bell size={12} />
                              <span>Peringatan</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  stats.readList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-400">
                        {language === 'ms' ? 'Belum ada pelajar yang membaca pengumuman ini.' : 'No students have read this announcement yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {stats.readList.map((receipt, idx) => (
                        <div key={receipt.studentId || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <span>{receipt.studentName}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Telah Baca
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {receipt.studentMatric} • {receipt.studentEmail || '-'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {receipt.studentProgram || 'Pelajar WBL FPTT'}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                              <CheckCircle2 size={12} />
                              <span>Dibaca Pada:</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {new Date(receipt.readAt).toLocaleString('ms-MY', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {stats.readCount} daripada {stats.totalTarget} pelajar telah mengesahkan bacaan
                </span>
                <button
                  type="button"
                  onClick={() => setActiveReceiptModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
                >
                  {language === 'ms' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
