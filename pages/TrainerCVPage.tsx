import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  UserRole,
  Company,
  Application,
  TrainerCV,
  TrainerQualificationCategory,
  TrainerCVEducationItem,
  TrainerCVWorkItem,
  TrainerCVCertificationItem
} from '../types';
import { StorageService } from '../services/storage';
import {
  JI_QUALIFICATION_CRITERIA,
  QUALIFICATION_DROPDOWN_OPTIONS,
  evaluateTrainerEligibility,
  inferQualificationCategory,
  categoryToAcademicLabel,
  buildCompaniesWithStudents
} from '../utils/trainerCvEligibility';
import { printTrainerCV, downloadTrainerCVHtml } from '../utils/trainerCvGenerator';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Award,
  Briefcase,
  GraduationCap,
  Building2,
  Printer,
  Download,
  Send,
  Save,
  Plus,
  Trash2,
  Search,
  Eye,
  ShieldCheck,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  X,
  Check,
  Edit3,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language } from '../translations';

interface TrainerCVPageProps {
  currentUser: User;
  users: User[];
  companies: Company[];
  applications: Application[];
  onUpdateUser: (updatedUser: User) => Promise<void>;
  language: Language;
  onNavigate?: (view: string) => void;
}

const WBL_COURSE_OPTIONS = [
  'BTMU 2103(i) Pengurusan Operasi',
  'BTMT 3273(i) Keusahawanan Digital',
  'BTMT 3283(i) Analitik Perniagaan',
  'BTMT 2113(i) Pengurusan Penjenamaan',
  'BTMU 4084(i) Projek Sarjana Muda II (PSM 2)'
];

const buildInitialCVFromUser = (user: User): TrainerCV => {
  const inferredCat = inferQualificationCategory(user.academic_level, user.special_recognition);
  const expYears = Number(user.experience_years) || 0;
  const hasSpecial = Boolean(user.special_recognition || inferredCat === 'special_skill');
  const elig = evaluateTrainerEligibility({
    qualificationCategory: inferredCat,
    experienceYears: expYears,
    hasSpecialRecognition: hasSpecial,
    specialRecognitionDetails: user.special_recognition_details || ''
  });

  const now = new Date().toISOString();
  return {
    id: `cv_${user.id}`,
    userId: user.id,
    username: user.username,
    userRole: user.role,
    fullName: user.name || '',
    icNo: user.ic_no || '',
    staffId: user.staff_id || '',
    email: user.email || '',
    phone: user.phone || '',
    profileImage: user.profile_image || '',
    companyName: user.company_affiliation || '',
    companyPosition: user.company_position || '',
    department: '',
    officeAddress: user.address || '',
    qualificationCategory: inferredCat,
    highestQualificationTitle: user.academic_level || '',
    fieldOfStudy: '',
    institutionName: '',
    graduationYear: '',
    experienceYears: expYears,
    hasSpecialRecognition: hasSpecial,
    specialRecognitionDetails: user.special_recognition_details || '',
    professionalSummary: '',
    educationList: [
      {
        level: user.academic_level || '',
        field: '',
        institution: '',
        year: ''
      }
    ],
    workExperienceList: [
      {
        company: user.company_affiliation || '',
        position: user.company_position || '',
        startYear: '',
        endYear: 'Kini',
        responsibilities: ''
      }
    ],
    certificationsList: [],
    areasOfExpertise: [],
    coachingCourses: ['BTMU 2103(i) Pengurusan Operasi', 'BTMT 3273(i) Keusahawanan Digital'],
    isEligible: elig.isEligible,
    matchedCriterionCode: elig.matchedCriterionCode,
    matchedCriterionText: elig.matchedCriterionText,
    status: 'draft',
    createdAt: now,
    updatedAt: now
  };
};

// Reusable In-App A4 Visual CV Preview Card (Highlights GREEN when eligible)
const TrainerCVVisualSheet: React.FC<{ cv: TrainerCV; language: Language }> = ({ cv, language }) => {
  const elig = evaluateTrainerEligibility({
    qualificationCategory: cv.qualificationCategory,
    experienceYears: cv.experienceYears,
    hasSpecialRecognition: cv.hasSpecialRecognition,
    specialRecognitionDetails: cv.specialRecognitionDetails
  });

  const isGreen = elig.isEligible;
  const initials = (cv.fullName || 'JI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg border-2 transition-all ${
        isGreen
          ? 'bg-emerald-50/40 border-emerald-500 ring-4 ring-emerald-100'
          : 'bg-white border-slate-300'
      }`}
    >
      {/* Top Banner */}
      <div
        className={`p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 ${
          isGreen
            ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 border-emerald-400'
            : 'bg-gradient-to-r from-slate-800 to-slate-700 border-amber-400'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-20 h-20 rounded-full border-4 overflow-hidden flex items-center justify-center shrink-0 text-2xl font-black ${
              isGreen ? 'border-emerald-300 bg-emerald-700' : 'border-amber-300 bg-slate-600'
            }`}
          >
            {cv.profileImage && cv.profileImage !== 'idb_stored' ? (
              <img src={cv.profileImage} alt={cv.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
              CURRICULUM VITAE • LANTIKAN JURULATIH INDUSTRI (WBL) FPTT UTeM
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-0.5">
              {cv.fullName || 'Nama Jurulatih Industri'}
            </h3>
            <p className={`text-xs font-semibold mt-0.5 ${isGreen ? 'text-emerald-200' : 'text-slate-200'}`}>
              {cv.companyPosition || 'Jurulatih Industri'} • {cv.companyName || 'Syarikat Industri'}
            </p>
          </div>
        </div>

        {/* Eligibility Seal */}
        <div
          className={`px-4 py-2.5 rounded-xl border text-left md:text-right shrink-0 ${
            isGreen
              ? 'bg-emerald-500/95 border-emerald-200 text-white shadow-md'
              : 'bg-amber-400 border-amber-200 text-slate-900'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider flex items-center md:justify-end gap-1">
            {isGreen ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span>{isGreen ? 'MEMENUHI SYARAT LANTIKAN JI' : 'BELUM MEMENUHI SYARAT'}</span>
          </div>
          <div className="text-xs font-extrabold mt-0.5">{elig.shortBadgeMs}</div>
        </div>
      </div>

      {/* Eligibility Status Strip */}
      <div
        className={`px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b text-xs ${
          isGreen
            ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-2">
          {isGreen ? (
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <strong>{isGreen ? 'Status CV HIJAU (Layak Lantikan JI): ' : 'Perhatian Syarat Kelayakan: '}</strong>
            <span>{language === 'ms' ? elig.reasonMs : elig.reasonEn}</span>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
            cv.status === 'appointed'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : cv.status === 'submitted'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : cv.status === 'revision_requested'
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          {cv.status === 'appointed'
            ? '✓ DILANTIK SEBAGAI JI'
            : cv.status === 'submitted'
            ? '⏳ MENUNGGU SEMAKAN PENYELARAS'
            : cv.status === 'revision_requested'
            ? '⚠ PERLU KEMASKINI'
            : 'DRAF CV'}
        </span>
      </div>

      {/* Main Sheet Content */}
      <div className="p-6 space-y-5">
        {/* Quick Info Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border text-xs bg-white ${
            isGreen ? 'border-emerald-200' : 'border-slate-200'
          }`}
        >
          <div>
            <span className="font-bold text-slate-500">Syarikat / Industri: </span>
            <strong className="text-slate-900">{cv.companyName || '-'}</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500">Jawatan: </span>
            <strong className="text-slate-900">{cv.companyPosition || '-'}</strong>
          </div>
          <div>
            <span className="font-bold text-slate-500">Emel Rasmi: </span>
            <span className="text-slate-800">{cv.email || '-'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500">No. Telefon: </span>
            <span className="text-slate-800">{cv.phone || '-'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500">No. KP / ID Staf: </span>
            <span className="text-slate-800 font-mono">{cv.icNo || cv.staffId || '-'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500">Pengalaman Bidang Berkaitan: </span>
            <strong className={isGreen ? 'text-emerald-700' : 'text-amber-700'}>
              {cv.experienceYears || 0} Tahun
            </strong>
          </div>
          <div className="md:col-span-2">
            <span className="font-bold text-slate-500">Kelayakan Akademik Tertinggi: </span>
            <strong className="text-slate-900">
              {cv.highestQualificationTitle || '-'} {cv.fieldOfStudy ? `(${cv.fieldOfStudy})` : ''}{' '}
              {cv.institutionName ? `— ${cv.institutionName}` : ''} {cv.graduationYear ? `[${cv.graduationYear}]` : ''}
            </strong>
          </div>
        </div>

        {/* Summary */}
        {cv.professionalSummary && (
          <div className="space-y-1.5">
            <h4
              className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 ${
                isGreen ? 'text-emerald-900 border-emerald-400' : 'text-slate-800 border-slate-300'
              }`}
            >
              1. Ringkasan Profil Profesional
            </h4>
            <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
              {cv.professionalSummary}
            </p>
          </div>
        )}

        {/* Criteria Checklist */}
        <div className="space-y-2">
          <h4
            className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 ${
              isGreen ? 'text-emerald-900 border-emerald-400' : 'text-slate-800 border-slate-300'
            }`}
          >
            2. Semakan Syarat Kelayakan Akademik & Pengalaman JI (i – vi)
          </h4>
          <div
            className={`p-4 rounded-xl border space-y-1.5 text-xs ${
              isGreen ? 'bg-emerald-50/90 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {JI_QUALIFICATION_CRITERIA.map((c) => {
              const matched = elig.isEligible && elig.matchedCriterionCode === c.code;
              return (
                <div
                  key={c.code}
                  className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg ${
                    matched
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">{matched ? '✓' : '○'}</span>
                  <span>
                    {matched && <span className="mr-1 uppercase text-[10px] bg-white/20 px-1.5 py-0.5 rounded">[DIPENUHI]</span>}
                    {c.labelMs}
                  </span>
                </div>
              );
            })}
            {cv.hasSpecialRecognition && cv.specialRecognitionDetails && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800">
                <strong className="text-emerald-800 block mb-0.5">
                  Butiran Kemahiran Istimewa / Pengiktirafan Profesional / Antarabangsa (Kriteria vi):
                </strong>
                {cv.specialRecognitionDetails}
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="space-y-2">
          <h4
            className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 ${
              isGreen ? 'text-emerald-900 border-emerald-400' : 'text-slate-800 border-slate-300'
            }`}
          >
            3. Latar Belakang Akademik
          </h4>
          <div className="space-y-2">
            {(cv.educationList && cv.educationList.length > 0 && cv.educationList.some((e) => e.level || e.institution)
              ? cv.educationList
              : [
                  {
                    level: cv.highestQualificationTitle || '-',
                    field: cv.fieldOfStudy || '-',
                    institution: cv.institutionName || '-',
                    year: cv.graduationYear || '-'
                  }
                ]
            ).map((edu, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl bg-white border flex justify-between items-start gap-3 text-xs ${
                  isGreen ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {edu.level || '-'} {edu.field ? `— ${edu.field}` : ''}
                  </div>
                  <div className="text-slate-600">{edu.institution || '-'}</div>
                </div>
                <span className="font-mono font-bold text-slate-500 shrink-0">{edu.year || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        {cv.workExperienceList && cv.workExperienceList.some((w) => w.company || w.position) && (
          <div className="space-y-2">
            <h4
              className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 ${
                isGreen ? 'text-emerald-900 border-emerald-400' : 'text-slate-800 border-slate-300'
              }`}
            >
              4. Pengalaman Kerja & Industri ({cv.experienceYears || 0} Tahun)
            </h4>
            <div className="space-y-2">
              {cv.workExperienceList
                .filter((w) => w.company || w.position)
                .map((w, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl bg-white border text-xs ${
                      isGreen ? 'border-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-slate-900">
                        {w.position || '-'} — <span className="text-slate-700">{w.company || '-'}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                        {w.startYear || '-'} – {w.endYear || 'Kini'}
                      </span>
                    </div>
                    {w.responsibilities && (
                      <p className="text-slate-600 mt-1 whitespace-pre-line">{w.responsibilities}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {cv.certificationsList && cv.certificationsList.some((c) => c.title) && (
          <div className="space-y-2">
            <h4
              className={`text-xs font-black uppercase tracking-wider pb-1 border-b-2 ${
                isGreen ? 'text-emerald-900 border-emerald-400' : 'text-slate-800 border-slate-300'
              }`}
            >
              5. Pensijilan Profesional, Anugerah & Pengiktirafan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cv.certificationsList
                .filter((c) => c.title)
                .map((c, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl bg-white border text-xs flex justify-between items-start gap-2 ${
                      isGreen ? 'border-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-slate-500">{c.issuer || '-'}</div>
                    </div>
                    <span className="font-mono text-slate-500 font-bold shrink-0">{c.year || '-'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Expertise & Courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cv.areasOfExpertise && cv.areasOfExpertise.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-black text-slate-700 uppercase">Bidang Kepakaran Industri</div>
              <div className="flex flex-wrap gap-1.5">
                {cv.areasOfExpertise.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      isGreen
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cv.coachingCourses && cv.coachingCourses.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-black text-slate-700 uppercase">Kursus WBL yang Dilatih / Diselia</div>
              <div className="flex flex-wrap gap-1.5">
                {cv.coachingCourses.map((c, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      isGreen
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coordinator Review Sign-off Box */}
        {(cv.status === 'appointed' || cv.status === 'revision_requested' || cv.coordinatorReviewNote) && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1 ${
              cv.status === 'appointed'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="font-black flex items-center gap-1.5">
              <ShieldCheck size={15} />
              <span>
                {cv.status === 'appointed'
                  ? `Pengesahan Lantikan Jurulatih Industri (${cv.appointmentLetterRef || 'SAH'})`
                  : 'Catatan Semakan Penyelaras WBL'}
              </span>
            </div>
            {cv.reviewedBy && (
              <div>
                Disemak oleh: <strong>{cv.reviewedBy}</strong>{' '}
                {cv.reviewedAt ? `(${new Date(cv.reviewedAt).toLocaleDateString('ms-MY')})` : ''}
              </div>
            )}
            {cv.coordinatorReviewNote && <div className="italic">"{cv.coordinatorReviewNote}"</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export const TrainerCVPage: React.FC<TrainerCVPageProps> = ({
  currentUser,
  users,
  companies,
  applications,
  onUpdateUser,
  language,
  onNavigate
}) => {
  const isCoordinatorView = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true;
  const isIndustryUser = currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SUPERVISOR;

  const [allCVs, setAllCVs] = useState<TrainerCV[]>(() => StorageService.getTrainerCVs());
  const [trainerActiveTab, setTrainerActiveTab] = useState<'form' | 'preview'>('form');
  const [showCriteriaGuide, setShowCriteriaGuide] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Trainer CV Form State
  const [cvForm, setCvForm] = useState<TrainerCV>(() => {
    const existing = StorageService.getTrainerCVByUserId(currentUser.id);
    if (existing) {
      return {
        ...existing,
        // Keep latest company_affiliation from user profile if user switched company
        companyName: currentUser.company_affiliation || existing.companyName,
        profileImage: currentUser.profile_image || existing.profileImage
      };
    }
    return buildInitialCVFromUser(currentUser);
  });
  const [expertiseInput, setExpertiseInput] = useState('');

  // Coordinator Review State
  const [coordSearch, setCoordSearch] = useState('');
  const [coordFilter, setCoordFilter] = useState<'all' | 'eligible' | 'ineligible' | 'submitted' | 'appointed' | 'no_cv'>('all');
  const [reviewModalCV, setReviewModalCV] = useState<TrainerCV | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [appointmentRef, setAppointmentRef] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    const syncCVs = () => {
      const latest = StorageService.getTrainerCVs();
      setAllCVs(latest);
    };
    syncCVs();
    const unsub = StorageService.subscribe(syncCVs);
    return () => unsub();
  }, []);

  // Keep company synced if user updated company in Profile
  useEffect(() => {
    if (isIndustryUser && currentUser.company_affiliation && currentUser.company_affiliation !== cvForm.companyName) {
      setCvForm((prev) => ({ ...prev, companyName: currentUser.company_affiliation || prev.companyName }));
    }
  }, [currentUser.company_affiliation, isIndustryUser]);

  const companiesWithStudents = useMemo(
    () => buildCompaniesWithStudents(companies, applications, users),
    [companies, applications, users]
  );

  // Live eligibility computation for Trainer form
  const liveEligibility = useMemo(
    () =>
      evaluateTrainerEligibility({
        qualificationCategory: cvForm.qualificationCategory,
        experienceYears: cvForm.experienceYears,
        hasSpecialRecognition: cvForm.hasSpecialRecognition,
        specialRecognitionDetails: cvForm.specialRecognitionDetails
      }),
    [
      cvForm.qualificationCategory,
      cvForm.experienceYears,
      cvForm.hasSpecialRecognition,
      cvForm.specialRecognitionDetails
    ]
  );

  const handleSaveCV = async (submitForReview: boolean) => {
    if (!cvForm.fullName.trim()) {
      toast.error('Sila masukkan nama penuh anda.');
      return;
    }
    if (!cvForm.companyName.trim()) {
      toast.error('Sila pastikan nama syarikat anda telah ditetapkan.');
      return;
    }

    setIsSaving(true);
    try {
      const elig = evaluateTrainerEligibility({
        qualificationCategory: cvForm.qualificationCategory,
        experienceYears: cvForm.experienceYears,
        hasSpecialRecognition: cvForm.hasSpecialRecognition,
        specialRecognitionDetails: cvForm.specialRecognitionDetails
      });

      const now = new Date().toISOString();
      const nextStatus = submitForReview
        ? 'submitted'
        : cvForm.status === 'appointed'
        ? 'appointed'
        : 'draft';

      const payload: TrainerCV = {
        ...cvForm,
        isEligible: elig.isEligible,
        matchedCriterionCode: elig.matchedCriterionCode,
        matchedCriterionText: elig.matchedCriterionText,
        status: nextStatus,
        submittedAt: submitForReview ? now : cvForm.submittedAt,
        updatedAt: now
      };

      const saved = await StorageService.saveTrainerCV(payload, submitForReview);
      setCvForm(saved);

      // Sync academic_level, experience_years, position, and special recognition back to User profile
      await onUpdateUser({
        ...currentUser,
        name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        ic_no: payload.icNo,
        staff_id: payload.staffId,
        company_affiliation: payload.companyName,
        company_position: payload.companyPosition,
        academic_level: categoryToAcademicLabel(payload.qualificationCategory),
        experience_years: payload.experienceYears,
        special_recognition: payload.hasSpecialRecognition,
        special_recognition_details: payload.specialRecognitionDetails
      });

      if (submitForReview) {
        toast.success(
          elig.isEligible
            ? 'CV (HIJAU / LAYAK) berjaya dihantar kepada Penyelaras untuk lantikan Jurulatih Industri!'
            : 'CV berjaya dihantar kepada Penyelaras untuk semakan.'
        );
        setTrainerActiveTab('preview');
      } else {
        toast.success('Draf CV Jurulatih Industri berjaya disimpan!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan CV.');
    } finally {
      setIsSaving(false);
    }
  };

  // Coordinator Unified Industry Candidates List (CVs + Industry Staff who haven't submitted CV yet)
  const coordinatorCandidates = useMemo(() => {
    const industryUsers = users.filter(
      (u) => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR
    );
    const cvByUserId = new Map<string, TrainerCV>();
    allCVs.forEach((cv) => cvByUserId.set(cv.userId, cv));

    const combined: {
      user?: User;
      cv?: TrainerCV;
      isEligible: boolean;
      eligibility: ReturnType<typeof evaluateTrainerEligibility>;
      displayName: string;
      companyName: string;
      studentCount: number;
      studentNames: string[];
      hasGeneratedCV: boolean;
    }[] = [];

    const processedUserIds = new Set<string>();

    // First include all saved CVs
    allCVs.forEach((cv) => {
      processedUserIds.add(cv.userId);
      const u = users.find((x) => x.id === cv.userId);
      const elig = evaluateTrainerEligibility({
        qualificationCategory: cv.qualificationCategory,
        experienceYears: cv.experienceYears,
        hasSpecialRecognition: cv.hasSpecialRecognition,
        specialRecognitionDetails: cv.specialRecognitionDetails
      });
      const compInfo = companiesWithStudents.find(
        (c) => c.companyName.toLowerCase().trim() === (cv.companyName || '').toLowerCase().trim()
      );
      combined.push({
        user: u,
        cv: {
          ...cv,
          isEligible: elig.isEligible,
          matchedCriterionCode: elig.matchedCriterionCode,
          matchedCriterionText: elig.matchedCriterionText
        },
        isEligible: elig.isEligible,
        eligibility: elig,
        displayName: cv.fullName || u?.name || 'Jurulatih Industri',
        companyName: cv.companyName || u?.company_affiliation || '-',
        studentCount: compInfo?.placedStudents.length || 0,
        studentNames: compInfo?.placedStudents.map((s) => s.name) || [],
        hasGeneratedCV: true
      });
    });

    // Then include industry users who haven't generated a CV yet
    industryUsers.forEach((u) => {
      if (processedUserIds.has(u.id)) return;
      const inferredCat = inferQualificationCategory(u.academic_level, u.special_recognition);
      const elig = evaluateTrainerEligibility({
        qualificationCategory: inferredCat,
        experienceYears: Number(u.experience_years) || 0,
        hasSpecialRecognition: u.special_recognition,
        specialRecognitionDetails: u.special_recognition_details
      });
      const compInfo = companiesWithStudents.find(
        (c) => c.companyName.toLowerCase().trim() === (u.company_affiliation || '').toLowerCase().trim()
      );
      combined.push({
        user: u,
        cv: undefined,
        isEligible: elig.isEligible,
        eligibility: elig,
        displayName: u.name,
        companyName: u.company_affiliation || '-',
        studentCount: compInfo?.placedStudents.length || 0,
        studentNames: compInfo?.placedStudents.map((s) => s.name) || [],
        hasGeneratedCV: false
      });
    });

    // Sort: Submitted & Eligible first, then Appointed, then other CVs, then No CV
    return combined.sort((a, b) => {
      if (a.hasGeneratedCV !== b.hasGeneratedCV) return a.hasGeneratedCV ? -1 : 1;
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [users, allCVs, companiesWithStudents]);

  const filteredCandidates = useMemo(() => {
    return coordinatorCandidates.filter((item) => {
      if (coordFilter === 'eligible' && !item.isEligible) return false;
      if (coordFilter === 'ineligible' && item.isEligible) return false;
      if (coordFilter === 'submitted' && item.cv?.status !== 'submitted') return false;
      if (coordFilter === 'appointed' && item.cv?.status !== 'appointed') return false;
      if (coordFilter === 'no_cv' && item.hasGeneratedCV) return false;

      if (coordSearch.trim()) {
        const q = coordSearch.toLowerCase();
        const match =
          item.displayName.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          (item.cv?.highestQualificationTitle || '').toLowerCase().includes(q) ||
          (item.user?.academic_level || '').toLowerCase().includes(q) ||
          (item.cv?.email || item.user?.email || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [coordinatorCandidates, coordFilter, coordSearch]);

  const coordStats = useMemo(() => {
    const total = coordinatorCandidates.length;
    const generated = coordinatorCandidates.filter((c) => c.hasGeneratedCV).length;
    const eligibleGreen = coordinatorCandidates.filter((c) => c.isEligible).length;
    const pendingReview = coordinatorCandidates.filter((c) => c.cv?.status === 'submitted').length;
    const appointed = coordinatorCandidates.filter((c) => c.cv?.status === 'appointed').length;
    return { total, generated, eligibleGreen, pendingReview, appointed };
  }, [coordinatorCandidates]);

  const openCoordinatorReview = (cv: TrainerCV) => {
    setReviewModalCV(cv);
    setReviewNote(cv.coordinatorReviewNote || '');
    setAppointmentRef(
      cv.appointmentLetterRef ||
        `UTeM/FPTT/WBL/JI/${new Date().getFullYear()}/${String(allCVs.indexOf(cv) + 1 || 1).padStart(3, '0')}`
    );
  };

  const handleCoordinatorDecision = async (decision: 'appointed' | 'revision_requested') => {
    if (!reviewModalCV) return;
    setIsReviewing(true);
    try {
      const updated = await StorageService.reviewTrainerCV(
        reviewModalCV.id,
        decision,
        reviewNote.trim(),
        currentUser,
        appointmentRef.trim()
      );
      setReviewModalCV(updated);
      toast.success(
        decision === 'appointed'
          ? `${updated.fullName} telah disahkan & dilantik sebagai Jurulatih Industri WBL!`
          : `Permintaan kemaskini CV telah dihantar kepada ${updated.fullName}.`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan semakan.');
    } finally {
      setIsReviewing(false);
    }
  };

  const addExpertiseTag = () => {
    const clean = expertiseInput.trim();
    if (!clean) return;
    if (!cvForm.areasOfExpertise.includes(clean)) {
      setCvForm((prev) => ({ ...prev, areasOfExpertise: [...prev.areasOfExpertise, clean] }));
    }
    setExpertiseInput('');
  };

  const toggleCoachingCourse = (course: string) => {
    setCvForm((prev) => {
      const exists = prev.coachingCourses.includes(course);
      return {
        ...prev,
        coachingCourses: exists
          ? prev.coachingCourses.filter((c) => c !== course)
          : [...prev.coachingCourses, course]
      };
    });
  };

  // =========================================================================
  // RENDER: COORDINATOR / JKWBL REVIEW & APPOINTMENT DASHBOARD
  // =========================================================================
  if (isCoordinatorView) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
              <ShieldCheck size={16} />
              <span>PENILAIAN KELAYAKAN & LANTIKAN JURULATIH INDUSTRI (WBL)</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {language === 'ms'
                ? 'Semakan CV Jurulatih Industri & Pengesahan Lantikan'
                : 'Industry Trainer CV Review & Appointment'}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
              CV yang memenuhi syarat kelayakan akademik dan pengalaman (Kriteria i hingga vi) akan{' '}
              <strong className="text-emerald-300 underline">dihijaukan secara automatik</strong> bagi memudahkan semakan pantas dan lantikan oleh Penyelaras WBL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCriteriaGuide(!showCriteriaGuide)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
          >
            <BookOpen size={15} />
            <span>{showCriteriaGuide ? 'Sembunyikan Garis Panduan Syarat' : 'Lihat 6 Syarat Kelayakan JI'}</span>
          </button>
        </div>

        {/* Official 6 Criteria Reference Card */}
        {showCriteriaGuide && (
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
              <Award size={18} className="text-emerald-700" />
              <span>Syarat Kelayakan Akademik & Pengalaman Jurulatih Industri (Automatik HIJAU jika dipenuhi)</span>
            </div>
            <p className="text-xs text-emerald-900/90 leading-relaxed">
              JI yang diperlukan mengajar komponen teori di industri, maka kelayakan akademik adalah sekurang-kurangnya satu (1) tahap lebih tinggi daripada program pengajian yang dilatih. Antara kelayakan akademik dan pengalaman JI adalah seperti berikut:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {JI_QUALIFICATION_CRITERIA.map((c) => (
                <div
                  key={c.code}
                  className="bg-white/90 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-950 font-medium flex items-start gap-2"
                >
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{c.labelMs}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Staf Industri</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{coordStats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <div className="text-[11px] font-bold text-blue-600 uppercase">CV Telah Dijana</div>
            <div className="text-2xl font-black text-blue-800 mt-1">{coordStats.generated}</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-400 shadow-xs">
            <div className="text-[11px] font-black text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 size={13} /> CV Hijau (Layak)
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{coordStats.eligibleGreen}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 shadow-xs">
            <div className="text-[11px] font-bold text-amber-800 uppercase">Menunggu Semakan</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{coordStats.pendingReview}</div>
          </div>
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-300 shadow-xs">
            <div className="text-[11px] font-bold text-teal-800 uppercase">Dilantik Sebagai JI</div>
            <div className="text-2xl font-black text-teal-800 mt-1">{coordStats.appointed}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={coordSearch}
              onChange={(e) => setCoordSearch(e.target.value)}
              placeholder="Cari nama jurulatih, syarikat, kelayakan..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `Semua (${coordinatorCandidates.length})` },
              { id: 'eligible', label: `🟢 Hijau / Layak (${coordStats.eligibleGreen})` },
              { id: 'submitted', label: `⏳ Menunggu Semakan (${coordStats.pendingReview})` },
              { id: 'appointed', label: `✓ Dilantik (${coordStats.appointed})` },
              { id: 'ineligible', label: '⚠ Belum Memenuhi Syarat' },
              { id: 'no_cv', label: 'Belum Jana CV' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCoordFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  coordFilter === f.id
                    ? f.id === 'eligible'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidates / CVs Cards Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <FileText size={36} className="mx-auto mb-2 opacity-40" />
            <p className="font-bold text-slate-600">Tiada rekod CV Jurulatih Industri ditemui bagi tapisan ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCandidates.map((item) => {
              const isGreen = item.isEligible;
              const cv = item.cv;
              const u = item.user;

              return (
                <div
                  key={cv?.id || u?.id || item.displayName}
                  className={`rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 border-2 ${
                    isGreen
                      ? 'bg-emerald-50/90 border-emerald-400 shadow-md shadow-emerald-100/70'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Name + Green Eligibility Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base shrink-0 border-2 overflow-hidden ${
                            isGreen
                              ? 'bg-emerald-600 text-white border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {cv?.profileImage || (u?.profile_image && u.profile_image !== 'idb_stored') ? (
                            <img
                              src={cv?.profileImage || u?.profile_image}
                              alt={item.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            item.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-slate-900 truncate">{item.displayName}</h3>
                          <p className="text-xs font-semibold text-slate-600 truncate">
                            {cv?.companyPosition || u?.company_position || 'Jurulatih / Penyelia Industri'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Building2 size={12} className="shrink-0" />
                            <span className="truncate font-medium">{item.companyName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Eligibility Green / Amber Badge */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                            isGreen
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isGreen ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          <span>{isGreen ? 'CV HIJAU • LAYAK' : 'BELUM LAYAK'}</span>
                        </span>

                        {cv ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              cv.status === 'appointed'
                                ? 'bg-teal-700 text-white border-teal-800'
                                : cv.status === 'submitted'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : cv.status === 'revision_requested'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {cv.status === 'appointed'
                              ? '✓ Dilantik JI'
                              : cv.status === 'submitted'
                              ? '⏳ Menunggu Semakan'
                              : cv.status === 'revision_requested'
                              ? '⚠ Perlu Kemaskini'
                              : 'Draf'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Belum Jana CV
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qualification & Eligibility Box */}
                    <div
                      className={`p-3 rounded-xl text-xs border ${
                        isGreen
                          ? 'bg-white/90 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                        <span className="flex items-center gap-1 font-bold">
                          <GraduationCap size={13} className={isGreen ? 'text-emerald-600' : 'text-amber-600'} />
                          {cv?.highestQualificationTitle || u?.academic_level || 'Belum dinyatakan'}
                        </span>
                        <span className="flex items-center gap-1 font-bold">
                          <Clock size={13} className={isGreen ? 'text-emerald-600' : 'text-amber-600'} />
                          {cv ? cv.experienceYears : u?.experience_years || 0} Tahun Pengalaman
                        </span>
                      </div>
                      <div className="text-[11px] leading-snug">{item.eligibility.reasonMs}</div>
                    </div>

                    {/* Student Placement Info */}
                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <Users size={13} className={item.studentCount > 0 ? 'text-emerald-600' : 'text-slate-400'} />
                        {item.studentCount > 0 ? (
                          <span className="text-emerald-800">
                            <strong>{item.studentCount} Pelajar Ditempatkan:</strong>{' '}
                            {item.studentNames.slice(0, 3).join(', ')}
                            {item.studentNames.length > 3 ? ` +${item.studentNames.length - 3}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">0 pelajar ditempatkan di nama syarikat ini</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200/70">
                    {cv ? (
                      <>
                        <button
                          type="button"
                          onClick={() => printTrainerCV(cv, language)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Printer size={13} />
                          <span>Cetak / PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCoordinatorReview(cv)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all ${
                            isGreen
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Eye size={14} />
                          <span>Semak CV & Lantikan</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!u) return;
                          const draft = buildInitialCVFromUser(u);
                          const saved = await StorageService.saveTrainerCV(draft, false);
                          openCoordinatorReview(saved);
                          toast.success(`Draf CV dijana dari profil ${u.name} untuk semakan.`);
                        }}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles size={13} />
                        <span>Jana Prapapar CV daripada Profil</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Coordinator Full CV Inspection & Appointment Modal */}
        {reviewModalCV && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
              {/* Modal Top Bar */}
              <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Semakan CV & Keputusan Lantikan Jurulatih Industri
                  </h3>
                  <p className="text-xs text-slate-500">
                    {reviewModalCV.fullName} • {reviewModalCV.companyName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printTrainerCV(reviewModalCV, language)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer size={14} />
                    <span>Cetak / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTrainerCVHtml(reviewModalCV, language)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Muat Turun</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewModalCV(null)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                <TrainerCVVisualSheet cv={reviewModalCV} language={language} />

                {/* Coordinator Action Panel */}
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-4 shadow-xs">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-600" />
                    <span>Tindakan Pengesahan & Lantikan Penyelaras WBL</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. Rujukan Surat Lantikan JI
                      </label>
                      <input
                        type="text"
                        value={appointmentRef}
                        onChange={(e) => setAppointmentRef(e.target.value)}
                        placeholder="Contoh: UTeM/FPTT/WBL/JI/2026/001"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ulasan / Catatan Semakan Penyelaras
                      </label>
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Contoh: Memenuhi syarat kelayakan akademik & pengalaman. Diluluskan untuk lantikan JI."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => handleCoordinatorDecision('revision_requested')}
                      className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition-colors"
                    >
                      Minta Kemaskini CV
                    </button>
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => handleCoordinatorDecision('appointed')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all"
                    >
                      <CheckCircle2 size={16} />
                      <span>Lulus & Lantik sebagai Jurulatih Industri</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: INDUSTRY TRAINER / SUPERVISOR CV BUILDER & GENERATOR VIEW
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner (Turns Green automatically when eligible!) */}
      <div
        className={`p-6 rounded-2xl shadow-md border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          liveEligibility.isEligible
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white border-emerald-400'
            : 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border-amber-400'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 border border-white/25">
              JANA CV LANTIKAN JURULATIH INDUSTRI (WBL)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                liveEligibility.isEligible
                  ? 'bg-emerald-400 text-emerald-950'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {liveEligibility.isEligible ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              <span>{liveEligibility.isEligible ? 'CV HIJAU • SYARAT DIPENUHI' : 'SYARAT BELUM DIPENUHI'}</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {language === 'ms' ? 'Penjana CV Lantikan Jurulatih Industri' : 'Industry Trainer Appointment CV Generator'}
          </h2>
          <p className="text-xs text-white/85 mt-1 max-w-2xl">
            {liveEligibility.reasonMs}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => printTrainerCV({ ...cvForm, isEligible: liveEligibility.isEligible }, language)}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Cetak / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => downloadTrainerCVHtml({ ...cvForm, isEligible: liveEligibility.isEligible }, language)}
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
          >
            <Download size={14} />
            <span>Muat Turun CV</span>
          </button>
        </div>
      </div>

      {/* Coordinator Review Status Alert (if already reviewed) */}
      {cvForm.status === 'appointed' && (
        <div className="bg-emerald-100 border-2 border-emerald-500 p-4 rounded-2xl flex items-start gap-3 text-emerald-950">
          <ShieldCheck size={22} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-black text-sm">
              Tahniah! CV Anda Telah Disahkan & Dilantik sebagai Jurulatih Industri WBL UTeM
            </div>
            <div>
              No. Rujukan Lantikan: <strong className="font-mono">{cvForm.appointmentLetterRef || 'SAH'}</strong> • Disahkan oleh:{' '}
              <strong>{cvForm.reviewedBy || 'Penyelaras WBL'}</strong>
            </div>
            {cvForm.coordinatorReviewNote && <div className="italic">Ulasan: "{cvForm.coordinatorReviewNote}"</div>}
          </div>
        </div>
      )}

      {cvForm.status === 'revision_requested' && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl flex items-start gap-3 text-rose-950">
          <AlertTriangle size={22} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-black text-sm">Semakan Penyelaras: CV Anda Perlu Dikemaskini</div>
            {cvForm.coordinatorReviewNote && <div>Catatan Penyelaras: <strong>"{cvForm.coordinatorReviewNote}"</strong></div>}
          </div>
        </div>
      )}

      {/* Official Criteria Guidance Box */}
      <div
        className={`rounded-2xl p-4 border-2 transition-all ${
          liveEligibility.isEligible
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-amber-50/70 border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Award size={16} className={liveEligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'} />
            <span>Garis Panduan Syarat Kelayakan Akademik & Pengalaman Jurulatih Industri (CV akan dihijaukan jika layak)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCriteriaGuide(!showCriteriaGuide)}
            className="text-xs font-bold text-blue-700 hover:underline shrink-0"
          >
            {showCriteriaGuide ? 'Tutup' : 'Papar'}
          </button>
        </div>

        {showCriteriaGuide && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-700">
              JI yang diperlukan mengajar komponen teori di industri, maka kelayakan akademik adalah sekurang-kurangnya satu (1) tahap lebih tinggi daripada program pengajian yang dilatih. Antara kelayakan akademik dan pengalaman JI adalah seperti berikut:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {JI_QUALIFICATION_CRITERIA.map((c) => {
                const isMatched = liveEligibility.isEligible && liveEligibility.matchedCriterionCode === c.code;
                return (
                  <div
                    key={c.code}
                    className={`px-3 py-2 rounded-xl text-xs border flex items-start gap-2 ${
                      isMatched
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="shrink-0 mt-0.5">{isMatched ? '✓' : '○'}</span>
                    <span>{c.labelMs}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs: Form vs Visual CV Preview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTrainerActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              trainerActiveTab === 'form'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Edit3 size={14} />
            <span>1. Isi / Kemaskini Maklumat CV</span>
          </button>
          <button
            type="button"
            onClick={() => setTrainerActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              trainerActiveTab === 'preview'
                ? liveEligibility.isEligible
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye size={14} />
            <span>2. Pratonton CV Rasmi {liveEligibility.isEligible ? '(HIJAU / LAYAK)' : ''}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveCV(false)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveCV(true)}
            className={`px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-sm transition-all ${
              liveEligibility.isEligible
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send size={14} />
            <span>Hantar CV untuk Semakan Penyelaras</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CV BUILDER FORM */}
      {trainerActiveTab === 'form' ? (
        <div className="space-y-6">
          {/* Section A: Kelayakan Akademik & Pengalaman (Drives Automatic Green CV Highlighting!) */}
          <div
            className={`p-6 rounded-2xl border-2 space-y-4 transition-all ${
              liveEligibility.isEligible
                ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                : 'bg-white border-amber-300 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <GraduationCap size={18} className={liveEligibility.isEligible ? 'text-emerald-600' : 'text-amber-600'} />
                <span>A. Kelayakan Akademik & Pengalaman Industri (Penentu Status Hijau CV)</span>
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black ${
                  liveEligibility.isEligible
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {liveEligibility.isEligible ? `✓ ${liveEligibility.shortBadgeMs}` : '⚠ Belum Memenuhi Syarat'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Kelayakan Akademik / Laluan Lantikan JI (i – vi) *
                </label>
                <select
                  value={cvForm.qualificationCategory}
                  onChange={(e) => {
                    const cat = e.target.value as TrainerQualificationCategory;
                    setCvForm((prev) => ({
                      ...prev,
                      qualificationCategory: cat,
                      hasSpecialRecognition: cat === 'special_skill' ? true : prev.hasSpecialRecognition
                    }));
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {QUALIFICATION_DROPDOWN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {language === 'ms' ? opt.labelMs : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempoh Pengalaman Bidang Berkaitan (Tahun) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={cvForm.experienceYears}
                  onChange={(e) =>
                    setCvForm((prev) => ({ ...prev, experienceYears: Math.max(0, parseInt(e.target.value) || 0) }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelayakan Tertinggi</label>
                <input
                  type="text"
                  placeholder="Contoh: Ijazah Sarjana Muda Pengurusan Teknologi"
                  value={cvForm.highestQualificationTitle}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, highestQualificationTitle: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bidang Pengajian</label>
                <input
                  type="text"
                  placeholder="Contoh: Keusahawanan / Operasi"
                  value={cvForm.fieldOfStudy}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, fieldOfStudy: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Graduasi</label>
                <input
                  type="text"
                  placeholder="Contoh: 2018"
                  value={cvForm.graduationYear}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, graduationYear: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Institusi / Universiti</label>
                <input
                  type="text"
                  placeholder="Contoh: Universiti Teknikal Malaysia Melaka (UTeM)"
                  value={cvForm.institutionName}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, institutionName: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Criterion (vi) Special Recognition Checkbox & Details */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cvForm.hasSpecialRecognition}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, hasSpecialRecognition: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 text-emerald-600 rounded"
                />
                <div className="text-xs">
                  <span className="font-black text-slate-800 block">
                    Kriteria (vi): Mempunyai Kemahiran Istimewa / Pengkhususan Bidang Diiktiraf Profesional / Antarabangsa / Nilai Komersial Tinggi
                  </span>
                  <span className="text-slate-500">
                    Tandakan jika anda memiliki pengalaman ≥ 5 tahun dengan pengiktirafan profesional/antarabangsa atau kepakaran bernilai komersial tinggi.
                  </span>
                </div>
              </label>

              {cvForm.hasSpecialRecognition && (
                <textarea
                  rows={2}
                  value={cvForm.specialRecognitionDetails || ''}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, specialRecognitionDetails: e.target.value }))}
                  placeholder="Nyatakan bukti kemahiran istimewa, sijil profesional (cth: Ts., Ir., PMP, Six Sigma Black Belt, Pengiktirafan Antarabangsa, atau pencapaian komersial utama)..."
                  className="w-full p-2.5 border border-emerald-300 rounded-xl text-xs bg-emerald-50/30 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>

          {/* Section B: Personal & Organization Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserCheck size={17} className="text-blue-600" />
                <span>B. Maklumat Peribadi & Organisasi Industri</span>
              </h3>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Tukar Syarikat di Profil &raquo;
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penuh *</label>
                <input
                  type="text"
                  value={cvForm.fullName}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. KP / ID Staf Syarikat</label>
                <input
                  type="text"
                  value={cvForm.icNo || cvForm.staffId || ''}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, icNo: e.target.value }))}
                  placeholder="Contoh: 850101-04-5123 / EMP-042"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Syarikat / Organisasi Industri *</label>
                <input
                  type="text"
                  value={cvForm.companyName}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jawatan Semasa *</label>
                <input
                  type="text"
                  value={cvForm.companyPosition}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, companyPosition: e.target.value }))}
                  placeholder="Contoh: Pengurus Operasi / Ketua Bahagian Pemasaran Digital"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emel Rasmi *</label>
                <input
                  type="email"
                  value={cvForm.email}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Telefon *</label>
                <input
                  type="tel"
                  value={cvForm.phone}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Profil Profesional</label>
                <textarea
                  rows={3}
                  value={cvForm.professionalSummary}
                  onChange={(e) => setCvForm((prev) => ({ ...prev, professionalSummary: e.target.value }))}
                  placeholder="Ringkasan pengalaman industri, peranan kepimpinan, serta pengalaman membimbing atau melatih staf/pelatih industri..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section C: Work Experience & Academic History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Work History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Briefcase size={16} className="text-indigo-600" />
                  <span>C. Rekod Pengalaman Kerja & Industri</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCvForm((prev) => ({
                      ...prev,
                      workExperienceList: [
                        ...prev.workExperienceList,
                        { company: '', position: '', startYear: '', endYear: '', responsibilities: '' }
                      ]
                    }))
                  }
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Pengalaman
                </button>
              </div>

              {cvForm.workExperienceList.map((work, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Syarikat"
                      value={work.company}
                      onChange={(e) => {
                        const next = [...cvForm.workExperienceList];
                        next[idx] = { ...next[idx], company: e.target.value };
                        setCvForm((prev) => ({ ...prev, workExperienceList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Jawatan"
                      value={work.position}
                      onChange={(e) => {
                        const next = [...cvForm.workExperienceList];
                        next[idx] = { ...next[idx], position: e.target.value };
                        setCvForm((prev) => ({ ...prev, workExperienceList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Tahun Mula (cth: 2019)"
                      value={work.startYear}
                      onChange={(e) => {
                        const next = [...cvForm.workExperienceList];
                        next[idx] = { ...next[idx], startYear: e.target.value };
                        setCvForm((prev) => ({ ...prev, workExperienceList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Tahun Tamat / Kini"
                      value={work.endYear}
                      onChange={(e) => {
                        const next = [...cvForm.workExperienceList];
                        next[idx] = { ...next[idx], endYear: e.target.value };
                        setCvForm((prev) => ({ ...prev, workExperienceList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex gap-2 items-start">
                    <textarea
                      rows={2}
                      placeholder="Skop tugas utama & pencapaian industri..."
                      value={work.responsibilities}
                      onChange={(e) => {
                        const next = [...cvForm.workExperienceList];
                        next[idx] = { ...next[idx], responsibilities: e.target.value };
                        setCvForm((prev) => ({ ...prev, workExperienceList: next }));
                      }}
                      className="flex-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCvForm((prev) => ({
                          ...prev,
                          workExperienceList: prev.workExperienceList.filter((_, i) => i !== idx)
                        }))
                      }
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Education List */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-600" />
                  <span>D. Rekod Pendidikan Lanjutan</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCvForm((prev) => ({
                      ...prev,
                      educationList: [...prev.educationList, { level: '', field: '', institution: '', year: '' }]
                    }))
                  }
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Pendidikan
                </button>
              </div>

              {cvForm.educationList.map((edu, idx) => (
                <div key={idx} className="flex gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Tahap (cth: Sarjana Muda)"
                      value={edu.level}
                      onChange={(e) => {
                        const next = [...cvForm.educationList];
                        next[idx] = { ...next[idx], level: e.target.value };
                        setCvForm((prev) => ({ ...prev, educationList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Bidang Pengajian"
                      value={edu.field}
                      onChange={(e) => {
                        const next = [...cvForm.educationList];
                        next[idx] = { ...next[idx], field: e.target.value };
                        setCvForm((prev) => ({ ...prev, educationList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Institusi / Universiti"
                      value={edu.institution}
                      onChange={(e) => {
                        const next = [...cvForm.educationList];
                        next[idx] = { ...next[idx], institution: e.target.value };
                        setCvForm((prev) => ({ ...prev, educationList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Tahun"
                      value={edu.year}
                      onChange={(e) => {
                        const next = [...cvForm.educationList];
                        next[idx] = { ...next[idx], year: e.target.value };
                        setCvForm((prev) => ({ ...prev, educationList: next }));
                      }}
                      className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCvForm((prev) => ({
                        ...prev,
                        educationList: prev.educationList.filter((_, i) => i !== idx)
                      }))
                    }
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Professional Certifications */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Award size={16} className="text-amber-600" />
                  <span>E. Pensijilan Profesional, Sijil Syarikat & Pengiktirafan</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCvForm((prev) => ({
                      ...prev,
                      certificationsList: [...prev.certificationsList, { title: '', issuer: '', year: '' }]
                    }))
                  }
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Sijil / Pengiktirafan
                </button>
              </div>

              {cvForm.certificationsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Tiada pensijilan ditambah lagi. Klik "+ Tambah Sijil / Pengiktirafan" jika berkaitan.
                </p>
              ) : (
                cvForm.certificationsList.map((cert, idx) => (
                  <div key={idx} className="flex gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Sijil / Anugerah"
                        value={cert.title}
                        onChange={(e) => {
                          const next = [...cvForm.certificationsList];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setCvForm((prev) => ({ ...prev, certificationsList: next }));
                        }}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Badan Penganugerahan / Syarikat"
                        value={cert.issuer}
                        onChange={(e) => {
                          const next = [...cvForm.certificationsList];
                          next[idx] = { ...next[idx], issuer: e.target.value };
                          setCvForm((prev) => ({ ...prev, certificationsList: next }));
                        }}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Tahun"
                        value={cert.year}
                        onChange={(e) => {
                          const next = [...cvForm.certificationsList];
                          next[idx] = { ...next[idx], year: e.target.value };
                          setCvForm((prev) => ({ ...prev, certificationsList: next }));
                        }}
                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCvForm((prev) => ({
                          ...prev,
                          certificationsList: prev.certificationsList.filter((_, i) => i !== idx)
                        }))
                      }
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Expertise & WBL Courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">F. Bidang Kepakaran Industri</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExpertiseTag();
                      }
                    }}
                    placeholder="Contoh: Pemasaran Digital, Lean 5S..."
                    className="flex-1 p-2 border border-slate-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addExpertiseTag}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cvForm.areasOfExpertise.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setCvForm((prev) => ({
                            ...prev,
                            areasOfExpertise: prev.areasOfExpertise.filter((_, idx) => idx !== i)
                          }))
                        }
                        className="text-emerald-600 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  G. Kursus Modular WBL yang Diselia / Dilatih
                </label>
                <div className="space-y-1.5">
                  {WBL_COURSE_OPTIONS.map((course) => {
                    const checked = cvForm.coachingCourses.includes(course);
                    return (
                      <label
                        key={course}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCoachingCourse(course)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>{course}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTrainerActiveTab('preview')}
              className="px-5 py-3 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
            >
              <Eye size={15} />
              <span>Pratonton CV</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveCV(false)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Save size={15} />
              <span>Simpan Draf CV</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveCV(true)}
              className={`px-6 py-3 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 transition-all ${
                liveEligibility.isEligible
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send size={15} />
              <span>Jana & Hantar CV kepada Penyelaras untuk Lantikan JI</span>
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: LIVE FORMATTED CV PREVIEW */
        <div className="space-y-4">
          <TrainerCVVisualSheet
            cv={{
              ...cvForm,
              isEligible: liveEligibility.isEligible,
              matchedCriterionCode: liveEligibility.matchedCriterionCode,
              matchedCriterionText: liveEligibility.matchedCriterionText
            }}
            language={language}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setTrainerActiveTab('form')}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              ← Kembali Edit CV
            </button>
            <button
              type="button"
              onClick={() => printTrainerCV({ ...cvForm, isEligible: liveEligibility.isEligible }, language)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveCV(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <Check size={15} />
              <span>Hantar CV untuk Semakan Penyelaras</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
