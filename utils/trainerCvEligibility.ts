import { Application, Company, TrainerQualificationCategory, User, UserRole } from '../types';

export interface JiCriterionDefinition {
  code: 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi';
  category: TrainerQualificationCategory;
  minYears: number;
  requiresSpecialRecognition?: boolean;
  labelMs: string;
  labelEn: string;
  shortLabelMs: string;
}

export const JI_QUALIFICATION_CRITERIA: JiCriterionDefinition[] = [
  {
    code: 'i',
    category: 'phd',
    minYears: 0,
    labelMs: 'i. Ijazah Kedoktoran (PhD) dalam bidang berkaitan;',
    labelEn: 'i. Doctoral Degree (PhD) in a related field;',
    shortLabelMs: 'Ijazah Kedoktoran (PhD)'
  },
  {
    code: 'ii',
    category: 'master',
    minYears: 0,
    labelMs: 'ii. Sarjana (Master) dalam bidang berkaitan;',
    labelEn: 'ii. Master’s Degree in a related field;',
    shortLabelMs: 'Sarjana (Master)'
  },
  {
    code: 'iii',
    category: 'degree',
    minYears: 3,
    labelMs: 'iii. Sarjana Muda dengan tiga (3) tahun pengalaman dalam bidang berkaitan;',
    labelEn: 'iii. Bachelor’s Degree with three (3) years of experience in a related field;',
    shortLabelMs: 'Sarjana Muda + ≥ 3 Tahun Pengalaman'
  },
  {
    code: 'iv',
    category: 'diploma',
    minYears: 5,
    labelMs: 'iv. Diploma Lanjutan/Diploma dengan lima (5) tahun pengalaman dalam bidang berkaitan;',
    labelEn: 'iv. Advanced Diploma/Diploma with five (5) years of experience in a related field;',
    shortLabelMs: 'Diploma Lanjutan/Diploma + ≥ 5 Tahun Pengalaman'
  },
  {
    code: 'v',
    category: 'certificate',
    minYears: 7,
    labelMs: 'v. Sebarang sijil atau kelayakan yang diiktiraf oleh syarikat dengan tujuh (7) tahun pengalaman dalam bidang berkaitan; atau',
    labelEn: 'v. Any certificate or qualification recognized by the company with seven (7) years of experience in a related field; or',
    shortLabelMs: 'Sijil / Kelayakan Diiktiraf Syarikat + ≥ 7 Tahun Pengalaman'
  },
  {
    code: 'vi',
    category: 'special_skill',
    minYears: 5,
    requiresSpecialRecognition: true,
    labelMs: 'vi. Pengalaman kerja lima (5) tahun ke atas dengan kemahiran istimewa/pengkhususan bidang yang diiktiraf secara profesional/pengiktirafan antarabangsa/nilai komersial yang tinggi.',
    labelEn: 'vi. Five (5) years or more work experience with special skills/field specialization recognized professionally/internationally/high commercial value.',
    shortLabelMs: '≥ 5 Tahun Pengalaman + Kemahiran Istimewa / Pengiktirafan Profesional'
  }
];

export const QUALIFICATION_DROPDOWN_OPTIONS: { value: TrainerQualificationCategory; labelMs: string; labelEn: string }[] = [
  { value: 'phd', labelMs: 'Ijazah Kedoktoran (PhD) dalam bidang berkaitan (Kriteria i)', labelEn: 'Doctoral Degree / PhD (Criterion i)' },
  { value: 'master', labelMs: 'Sarjana (Master) dalam bidang berkaitan (Kriteria ii)', labelEn: 'Master’s Degree (Criterion ii)' },
  { value: 'degree', labelMs: 'Ijazah Sarjana Muda (Degree) — perlu ≥ 3 tahun pengalaman (Kriteria iii)', labelEn: 'Bachelor’s Degree — requires ≥ 3 yrs exp (Criterion iii)' },
  { value: 'diploma', labelMs: 'Diploma Lanjutan / Diploma — perlu ≥ 5 tahun pengalaman (Kriteria iv)', labelEn: 'Advanced Diploma / Diploma — requires ≥ 5 yrs exp (Criterion iv)' },
  { value: 'certificate', labelMs: 'Sijil / Kelayakan Diiktiraf Syarikat — perlu ≥ 7 tahun pengalaman (Kriteria v)', labelEn: 'Company-Recognized Certificate — requires ≥ 7 yrs exp (Criterion v)' },
  { value: 'special_skill', labelMs: 'Pengalaman ≥ 5 Tahun dengan Kemahiran Istimewa / Pengiktirafan Profesional / Antarabangsa / Nilai Komersial Tinggi (Kriteria vi)', labelEn: '≥ 5 Years Experience with Special Professional/International Recognition (Criterion vi)' }
];

export function inferQualificationCategory(
  academicLevel?: string,
  hasSpecialRecognition?: boolean
): TrainerQualificationCategory {
  const raw = (academicLevel || '').toLowerCase().trim();
  if (raw.includes('phd') || raw.includes('kedoktoran') || raw.includes('doctor')) return 'phd';
  if (raw.includes('master') || raw.includes('sarjana') && !raw.includes('muda')) return 'master';
  if (raw.includes('degree') || raw.includes('sarjana muda') || raw.includes('bachelor') || raw.includes('ijazah')) return 'degree';
  if (raw.includes('diploma')) return 'diploma';
  if (raw.includes('special') || raw.includes('kemahiran istimewa') || raw.includes('profesional')) return 'special_skill';
  if (hasSpecialRecognition) return 'special_skill';
  if (raw.includes('sijil') || raw.includes('spm') || raw.includes('skm') || raw.includes('cert')) return 'certificate';
  return 'degree';
}

export function categoryToAcademicLabel(category: TrainerQualificationCategory): string {
  switch (category) {
    case 'phd': return 'PhD';
    case 'master': return 'Master';
    case 'degree': return 'Degree';
    case 'diploma': return 'Diploma';
    case 'certificate': return 'Sijil / SPM';
    case 'special_skill': return 'Kemahiran Istimewa / Pengiktirafan Profesional';
  }
}

export interface TrainerEligibilityResult {
  isEligible: boolean;
  matchedCriterionCode?: 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi';
  matchedCriterionText?: string;
  shortBadgeMs: string;
  reasonMs: string;
  reasonEn: string;
  missingRequirementMs?: string;
}

export function evaluateTrainerEligibility(params: {
  qualificationCategory: TrainerQualificationCategory;
  experienceYears: number;
  hasSpecialRecognition?: boolean;
  specialRecognitionDetails?: string;
}): TrainerEligibilityResult {
  const years = Number(params.experienceYears) || 0;
  const cat = params.qualificationCategory;
  const hasSpecial = Boolean(params.hasSpecialRecognition || cat === 'special_skill');
  const hasSpecialDetail = Boolean((params.specialRecognitionDetails || '').trim().length >= 3);

  // i. PhD dalam bidang berkaitan
  if (cat === 'phd') {
    return {
      isEligible: true,
      matchedCriterionCode: 'i',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[0].labelMs,
      shortBadgeMs: 'Layak (Kriteria i: Ijazah Kedoktoran)',
      reasonMs: `Memenuhi Kriteria (i): Ijazah Kedoktoran (PhD) dalam bidang berkaitan (${years} tahun pengalaman).`,
      reasonEn: `Meets Criterion (i): Doctoral Degree (PhD) in a related field (${years} years experience).`
    };
  }

  // ii. Sarjana dalam bidang berkaitan
  if (cat === 'master') {
    return {
      isEligible: true,
      matchedCriterionCode: 'ii',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[1].labelMs,
      shortBadgeMs: 'Layak (Kriteria ii: Sarjana)',
      reasonMs: `Memenuhi Kriteria (ii): Ijazah Sarjana (Master) dalam bidang berkaitan (${years} tahun pengalaman).`,
      reasonEn: `Meets Criterion (ii): Master’s Degree in a related field (${years} years experience).`
    };
  }

  // iii. Sarjana Muda dengan >= 3 tahun pengalaman
  if (cat === 'degree' && years >= 3) {
    return {
      isEligible: true,
      matchedCriterionCode: 'iii',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[2].labelMs,
      shortBadgeMs: `Layak (Kriteria iii: Sarjana Muda + ${years} Thn)`,
      reasonMs: `Memenuhi Kriteria (iii): Sarjana Muda dengan ${years} tahun pengalaman (syarat minimum: 3 tahun).`,
      reasonEn: `Meets Criterion (iii): Bachelor’s Degree with ${years} years experience (minimum: 3 years).`
    };
  }

  // iv. Diploma Lanjutan/Diploma dengan >= 5 tahun pengalaman
  if (cat === 'diploma' && years >= 5) {
    return {
      isEligible: true,
      matchedCriterionCode: 'iv',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[3].labelMs,
      shortBadgeMs: `Layak (Kriteria iv: Diploma + ${years} Thn)`,
      reasonMs: `Memenuhi Kriteria (iv): Diploma Lanjutan/Diploma dengan ${years} tahun pengalaman (syarat minimum: 5 tahun).`,
      reasonEn: `Meets Criterion (iv): Advanced Diploma/Diploma with ${years} years experience (minimum: 5 years).`
    };
  }

  // v. Sebarang sijil atau kelayakan diiktiraf syarikat dengan >= 7 tahun pengalaman
  if (cat === 'certificate' && years >= 7) {
    return {
      isEligible: true,
      matchedCriterionCode: 'v',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[4].labelMs,
      shortBadgeMs: `Layak (Kriteria v: Sijil + ${years} Thn)`,
      reasonMs: `Memenuhi Kriteria (v): Sijil/kelayakan diiktiraf syarikat dengan ${years} tahun pengalaman (syarat minimum: 7 tahun).`,
      reasonEn: `Meets Criterion (v): Company-recognized certificate with ${years} years experience (minimum: 7 years).`
    };
  }

  // vi. Pengalaman kerja >= 5 tahun ke atas dengan kemahiran istimewa / pengiktirafan profesional / antarabangsa / nilai komersial tinggi
  if (years >= 5 && hasSpecial && (cat !== 'special_skill' || hasSpecialDetail || params.hasSpecialRecognition)) {
    return {
      isEligible: true,
      matchedCriterionCode: 'vi',
      matchedCriterionText: JI_QUALIFICATION_CRITERIA[5].labelMs,
      shortBadgeMs: `Layak (Kriteria vi: ≥5 Thn + Kemahiran Istimewa)`,
      reasonMs: `Memenuhi Kriteria (vi): ${years} tahun pengalaman kerja dengan kemahiran istimewa / pengiktirafan profesional / antarabangsa / nilai komersial tinggi.`,
      reasonEn: `Meets Criterion (vi): ${years} years work experience with special professional/international recognition or high commercial value.`
    };
  }

  // Not yet eligible -> construct helpful missing requirement message
  let missingRequirementMs = '';
  if (cat === 'degree') {
    missingRequirementMs = `Sarjana Muda memerlukan sekurang-kurangnya 3 tahun pengalaman dalam bidang berkaitan (semasa: ${years} tahun).`;
  } else if (cat === 'diploma') {
    missingRequirementMs = `Diploma Lanjutan/Diploma memerlukan sekurang-kurangnya 5 tahun pengalaman dalam bidang berkaitan (semasa: ${years} tahun).`;
  } else if (cat === 'certificate') {
    missingRequirementMs = `Sijil/kelayakan syarikat memerlukan sekurang-kurangnya 7 tahun pengalaman (semasa: ${years} tahun), ATAU ≥ 5 tahun dengan pengiktirafan kemahiran istimewa (Kriteria vi).`;
  } else if (cat === 'special_skill') {
    if (years < 5) {
      missingRequirementMs = `Kriteria (vi) memerlukan sekurang-kurangnya 5 tahun pengalaman kerja (semasa: ${years} tahun) beserta pengesahan kemahiran istimewa / pengiktirafan profesional.`;
    } else {
      missingRequirementMs = `Sila nyatakan butiran kemahiran istimewa / pengiktirafan profesional / antarabangsa / nilai komersial tinggi untuk memenuhi Kriteria (vi).`;
    }
  }

  return {
    isEligible: false,
    shortBadgeMs: 'Belum Memenuhi Syarat Minimum JI',
    reasonMs: missingRequirementMs || 'Kelayakan akademik atau tempoh pengalaman belum memenuhi syarat minimum lantikan Jurulatih Industri.',
    reasonEn: 'Academic qualification or experience duration does not yet meet the minimum Industry Trainer criteria.',
    missingRequirementMs
  };
}

export interface CompanyWithStudentsInfo {
  companyName: string; // Exact string used in applications / companies
  companyId?: string;
  district?: string;
  state?: string;
  industry?: string;
  placedStudents: {
    id: string;
    name: string;
    matricNo: string;
    status: string;
  }[];
  pendingStudentCount: number;
  isDuplicateNameVariant: boolean;
}

/**
 * Builds a comprehensive directory of all companies in the system paired with
 * their EXACT matched placed students (Diluluskan or student_preferred),
 * ensuring SV Industri & JI can immediately tell which company entry has students
 * when there are duplicate/similar company names in the database.
 */
export function buildCompaniesWithStudents(
  companies: Company[],
  applications: Application[],
  users: User[] = []
): CompanyWithStudentsInfo[] {
  const map = new Map<string, CompanyWithStudentsInfo>();

  // Helper to ensure entry exists by exact company_name
  const ensureEntry = (name: string, meta?: Partial<CompanyWithStudentsInfo>) => {
    const exactKey = name.trim();
    if (!exactKey) return null;
    if (!map.has(exactKey)) {
      map.set(exactKey, {
        companyName: exactKey,
        companyId: meta?.companyId,
        district: meta?.district || '',
        state: meta?.state || '',
        industry: meta?.industry || '',
        placedStudents: [],
        pendingStudentCount: 0,
        isDuplicateNameVariant: false
      });
    } else if (meta) {
      const existing = map.get(exactKey)!;
      if (!existing.companyId && meta.companyId) existing.companyId = meta.companyId;
      if (!existing.district && meta.district) existing.district = meta.district;
      if (!existing.state && meta.state) existing.state = meta.state;
      if (!existing.industry && meta.industry) existing.industry = meta.industry;
    }
    return map.get(exactKey)!;
  };

  // 1. Add all companies from Company table
  companies.forEach((c) => {
    if (!c.company_name) return;
    ensureEntry(c.company_name, {
      companyId: c.id,
      district: c.company_district,
      state: c.company_state,
      industry: c.company_industry
    });
  });

  // 2. Attach placed students from Applications (using exact company_name match!)
  applications.forEach((app) => {
    if (!app.company_name) return;
    const entry = ensureEntry(app.company_name, {
      district: app.company_district,
      state: app.company_state
    });
    if (!entry) return;

    const isPlaced = app.application_status === 'Diluluskan' || Boolean(app.student_preferred);
    if (isPlaced) {
      const alreadyIn = entry.placedStudents.some(
        (s) =>
          (app.student_id && s.matricNo === app.student_id) ||
          s.name.toLowerCase() === (app.student_name || '').toLowerCase()
      );
      if (!alreadyIn) {
        entry.placedStudents.push({
          id: app.id,
          name: app.student_name || 'Pelajar WBL',
          matricNo: app.student_id || '-',
          status: app.application_status
        });
      }
    } else if (app.application_status === 'Menunggu') {
      entry.pendingStudentCount += 1;
    }
  });

  // 3. Also check Student users who have company_affiliation directly set (if not already captured)
  users
    .filter((u) => u.role === UserRole.STUDENT && u.company_affiliation)
    .forEach((stu) => {
      const entry = ensureEntry(stu.company_affiliation!);
      if (!entry) return;
      const alreadyIn = entry.placedStudents.some(
        (s) =>
          (stu.matric_no && s.matricNo === stu.matric_no) ||
          s.name.toLowerCase() === (stu.name || '').toLowerCase()
      );
      if (!alreadyIn) {
        entry.placedStudents.push({
          id: stu.id,
          name: stu.name,
          matricNo: stu.matric_no || '-',
          status: 'Diluluskan'
        });
      }
    });

  // 4. Detect duplicate/similar normalized company names (e.g., "ABC Sdn Bhd" vs "ABC SDN. BHD.")
  const normalizeForDupCheck = (str: string) =>
    str
      .toLowerCase()
      .replace(/\bsdn\.?\s*bhd\.?\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const normCounts = new Map<string, number>();
  const list = Array.from(map.values());
  list.forEach((item) => {
    const norm = normalizeForDupCheck(item.companyName);
    if (norm) {
      normCounts.set(norm, (normCounts.get(norm) || 0) + 1);
    }
  });

  list.forEach((item) => {
    const norm = normalizeForDupCheck(item.companyName);
    if (norm && (normCounts.get(norm) || 0) > 1) {
      item.isDuplicateNameVariant = true;
    }
  });

  // Sort: Companies with placed students FIRST (highest student count first), then alphabetically
  return list.sort((a, b) => {
    if (b.placedStudents.length !== a.placedStudents.length) {
      return b.placedStudents.length - a.placedStudents.length;
    }
    return a.companyName.localeCompare(b.companyName);
  });
}
