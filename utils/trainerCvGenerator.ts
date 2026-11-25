import { TrainerCV } from '../types';
import { evaluateTrainerEligibility, JI_QUALIFICATION_CRITERIA } from './trainerCvEligibility';

const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const buildTrainerCVHtml = (cv: TrainerCV, lang: 'ms' | 'en' = 'ms'): string => {
  const eligibility = evaluateTrainerEligibility({
    qualificationCategory: cv.qualificationCategory,
    experienceYears: cv.experienceYears,
    hasSpecialRecognition: cv.hasSpecialRecognition,
    specialRecognitionDetails: cv.specialRecognitionDetails
  });

  const isGreen = eligibility.isEligible;

  // Color palette: Vibrant Emerald Green if eligible ("hijaukan cv sekiranya syarat dipenuhi"), Slate/Amber otherwise
  const palette = isGreen
    ? {
        primary: '#065f46', // emerald-800
        primaryDark: '#064e3b', // emerald-900
        accent: '#10b981', // emerald-500
        softBg: '#ecfdf5', // emerald-50
        softBorder: '#6ee7b7', // emerald-300
        badgeBg: '#d1fae5', // emerald-100
        badgeText: '#065f46',
        pageTint: '#f0fdf4'
      }
    : {
        primary: '#334155', // slate-700
        primaryDark: '#1e293b', // slate-800
        accent: '#d97706', // amber-600
        softBg: '#fffbeb', // amber-50
        softBorder: '#fcd34d', // amber-300
        badgeBg: '#fef3c7', // amber-100
        badgeText: '#92400e',
        pageTint: '#ffffff'
      };

  const statusText =
    cv.status === 'appointed'
      ? lang === 'ms'
        ? 'DILANTIK SEBAGAI JURULATIH INDUSTRI (SAH)'
        : 'APPOINTED AS INDUSTRY TRAINER (VERIFIED)'
      : cv.status === 'submitted'
      ? lang === 'ms'
        ? 'DIHANTAR UNTUK SEMAKAN PENYELARAS'
        : 'SUBMITTED FOR COORDINATOR REVIEW'
      : cv.status === 'revision_requested'
      ? lang === 'ms'
        ? 'PERLU KEMASKINI OLEH JURULATIH'
        : 'REVISION REQUESTED'
      : lang === 'ms'
      ? 'DRAF CV JURULATIH INDUSTRI'
      : 'DRAFT INDUSTRY TRAINER CV';

  const initials = (cv.fullName || 'JI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const generatedDate = new Date().toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>CV Jurulatih Industri - ${escapeHtml(cv.fullName)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: ${isGreen ? '#ecfdf5' : '#f8fafc'};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      line-height: 1.45;
    }
    .cv-sheet {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: ${palette.pageTint};
      border: 2.5px solid ${palette.primary};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .cv-top-banner {
      background: linear-gradient(135deg, ${palette.primaryDark}, ${palette.primary});
      color: #ffffff;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      border-bottom: 4px solid ${palette.accent};
    }
    .cv-header-left {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .avatar-box {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      border: 3px solid ${palette.accent};
      background: rgba(255,255,255,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .avatar-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .utem-kicker {
      font-size: 10px;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      opacity: 0.88;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .cv-name {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .cv-sub {
      margin: 3px 0 0 0;
      font-size: 12.5px;
      color: #d1fae5;
      font-weight: 600;
    }
    .eligibility-seal {
      background: ${isGreen ? '#10b981' : '#f59e0b'};
      color: ${isGreen ? '#ffffff' : '#1e293b'};
      padding: 8px 14px;
      border-radius: 10px;
      text-align: right;
      min-width: 195px;
      border: 1.5px solid rgba(255,255,255,0.45);
    }
    .eligibility-seal .seal-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }
    .eligibility-seal .seal-sub {
      font-size: 11px;
      font-weight: 700;
      margin-top: 2px;
    }
    .eligibility-strip {
      background: ${palette.softBg};
      border-bottom: 1.5px solid ${palette.softBorder};
      padding: 12px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      font-size: 11.5px;
    }
    .eligibility-strip strong {
      color: ${palette.primaryDark};
    }
    .status-pill {
      background: ${palette.badgeBg};
      color: ${palette.badgeText};
      border: 1px solid ${palette.softBorder};
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }
    .cv-body {
      padding: 22px 28px 26px 28px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 20px;
      background: #ffffff;
      border: 1px solid ${isGreen ? '#a7f3d0' : '#e2e8f0'};
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 18px;
      font-size: 11.5px;
    }
    .info-item {
      display: flex;
      gap: 6px;
    }
    .info-label {
      font-weight: 700;
      color: ${palette.primary};
      min-width: 115px;
    }
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-heading {
      font-size: 12.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: ${palette.primaryDark};
      border-bottom: 2px solid ${palette.accent};
      padding-bottom: 4px;
      margin: 0 0 10px 0;
    }
    .summary-box {
      background: #ffffff;
      border-left: 4px solid ${palette.accent};
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 11.5px;
      color: #334155;
      border-top: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
      border-right: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
      border-bottom: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
    }
    .criteria-box {
      background: ${palette.softBg};
      border: 1.5px solid ${palette.softBorder};
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 11px;
    }
    .criteria-list {
      margin: 6px 0 0 0;
      padding-left: 16px;
      list-style: none;
    }
    .criteria-list li {
      padding: 3px 6px;
      margin-bottom: 2px;
      border-radius: 5px;
      color: #475569;
    }
    .criteria-list li.matched {
      background: #d1fae5;
      color: #064e3b;
      font-weight: 800;
      border: 1px solid #34d399;
    }
    .item-card {
      background: #ffffff;
      border: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
      border-radius: 8px;
      padding: 9px 13px;
      margin-bottom: 8px;
      font-size: 11.5px;
    }
    .item-top {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      color: #0f172a;
    }
    .item-meta {
      font-size: 10.5px;
      color: ${palette.primary};
      font-weight: 700;
    }
    .item-desc {
      margin-top: 4px;
      font-size: 11px;
      color: #475569;
    }
    .tag-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      background: ${palette.badgeBg};
      color: ${palette.badgeText};
      border: 1px solid ${palette.softBorder};
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
    }
    .footer-sign {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1.5px dashed ${palette.softBorder};
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-size: 11px;
    }
    .sign-box {
      background: #ffffff;
      border: 1px solid ${isGreen ? '#a7f3d0' : '#e2e8f0'};
      border-radius: 8px;
      padding: 10px 14px;
    }
    .sign-title {
      font-weight: 800;
      color: ${palette.primaryDark};
      font-size: 10.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    @media print {
      body { background: #ffffff; }
      .cv-sheet { box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="cv-sheet">
    <div class="cv-top-banner">
      <div class="cv-header-left">
        <div class="avatar-box">
          ${cv.profileImage ? `<img src="${cv.profileImage}" alt="${escapeHtml(cv.fullName)}" />` : escapeHtml(initials)}
        </div>
        <div>
          <div class="utem-kicker">CURRICULUM VITAE • LANTIKAN JURULATIH INDUSTRI (WBL) FPTT UTeM</div>
          <h1 class="cv-name">${escapeHtml(cv.fullName)}</h1>
          <p class="cv-sub">${escapeHtml(cv.companyPosition || 'Jurulatih Industri')} • ${escapeHtml(cv.companyName || '-')}</p>
        </div>
      </div>
      <div class="eligibility-seal">
        <div class="seal-title">${isGreen ? '✓ MEMENUHI SYARAT LANTIKAN JI' : '⚠ SEMAKAN SYARAT KELAYAKAN'}</div>
        <div class="seal-sub">${escapeHtml(eligibility.shortBadgeMs)}</div>
      </div>
    </div>

    <div class="eligibility-strip">
      <div>
        <strong>${isGreen ? 'Status Kelayakan Akademik & Pengalaman (HIJAU / LAYAK):' : 'Status Kelayakan Akademik & Pengalaman:'}</strong>
        ${escapeHtml(eligibility.reasonMs)}
      </div>
      <span class="status-pill">${escapeHtml(statusText)}</span>
    </div>

    <div class="cv-body">
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Syarikat / Industri:</span><span>${escapeHtml(cv.companyName || '-')}</span></div>
        <div class="info-item"><span class="info-label">Jawatan Semasa:</span><span>${escapeHtml(cv.companyPosition || '-')}</span></div>
        <div class="info-item"><span class="info-label">Emel Rasmi:</span><span>${escapeHtml(cv.email || '-')}</span></div>
        <div class="info-item"><span class="info-label">No. Telefon:</span><span>${escapeHtml(cv.phone || '-')}</span></div>
        <div class="info-item"><span class="info-label">No. KP / ID Staf:</span><span>${escapeHtml(cv.icNo || cv.staffId || '-')}</span></div>
        <div class="info-item"><span class="info-label">Tempoh Pengalaman:</span><span><strong>${cv.experienceYears || 0} Tahun</strong> dalam bidang berkaitan</span></div>
        <div class="info-item"><span class="info-label">Kelayakan Tertinggi:</span><span>${escapeHtml(cv.highestQualificationTitle || '-')} (${escapeHtml(cv.graduationYear || '-')})</span></div>
        <div class="info-item"><span class="info-label">Bidang & Institusi:</span><span>${escapeHtml(cv.fieldOfStudy || '-')} — ${escapeHtml(cv.institutionName || '-')}</span></div>
      </div>

      ${cv.professionalSummary ? `
      <div class="section">
        <h2 class="section-heading">1. Ringkasan Profil Profesional</h2>
        <div class="summary-box">${escapeHtml(cv.professionalSummary)}</div>
      </div>` : ''}

      <div class="section">
        <h2 class="section-heading">2. Penilaian Syarat Kelayakan Akademik & Pengalaman Jurulatih Industri (WBL)</h2>
        <div class="criteria-box">
          <div style="font-size:10.5px; color:#334155; margin-bottom:6px;">
            <em>JI yang diperlukan mengajar komponen teori di industri hendaklah memiliki kelayakan akademik sekurang-kurangnya satu (1) tahap lebih tinggi daripada program pengajian yang dilatih, atau memenuhi salah satu kriteria pengalaman berikut:</em>
          </div>
          <ul class="criteria-list">
            ${JI_QUALIFICATION_CRITERIA.map((c) => {
              const isMatched = eligibility.isEligible && eligibility.matchedCriterionCode === c.code;
              return `<li class="${isMatched ? 'matched' : ''}">${isMatched ? '✓ [DIPENUHI] ' : '○ '}${escapeHtml(c.labelMs)}</li>`;
            }).join('')}
          </ul>
          ${cv.hasSpecialRecognition && cv.specialRecognitionDetails ? `
            <div style="margin-top:8px; padding:8px 10px; background:#ffffff; border-radius:6px; border:1px solid ${palette.softBorder};">
              <strong>Butiran Kemahiran Istimewa / Pengiktirafan Profesional / Antarabangsa (Kriteria vi):</strong><br/>
              ${escapeHtml(cv.specialRecognitionDetails)}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <h2 class="section-heading">3. Latar Belakang Akademik</h2>
        ${(cv.educationList && cv.educationList.length > 0
          ? cv.educationList
          : [{ level: cv.highestQualificationTitle || '-', field: cv.fieldOfStudy || '-', institution: cv.institutionName || '-', year: cv.graduationYear || '-' }]
        ).map((edu) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(edu.level)} ${edu.field ? `— ${escapeHtml(edu.field)}` : ''}</span>
              <span class="item-meta">${escapeHtml(edu.year || '-')}</span>
            </div>
            <div class="item-desc">${escapeHtml(edu.institution || '-')}</div>
          </div>
        `).join('')}
      </div>

      ${cv.workExperienceList && cv.workExperienceList.length > 0 ? `
      <div class="section">
        <h2 class="section-heading">4. Pengalaman Kerja & Industri (${cv.experienceYears || 0} Tahun)</h2>
        ${cv.workExperienceList.map((work) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(work.position)} — ${escapeHtml(work.company)}</span>
              <span class="item-meta">${escapeHtml(work.startYear)} - ${escapeHtml(work.endYear || 'Kini')}</span>
            </div>
            ${work.responsibilities ? `<div class="item-desc">${escapeHtml(work.responsibilities)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      ${cv.certificationsList && cv.certificationsList.length > 0 ? `
      <div class="section">
        <h2 class="section-heading">5. Pensijilan Profesional, Anugerah & Pengiktirafan</h2>
        ${cv.certificationsList.map((cert) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(cert.title)}</span>
              <span class="item-meta">${escapeHtml(cert.year || '-')}</span>
            </div>
            <div class="item-desc">Penganugerahan / Badan Pengiktiraf: ${escapeHtml(cert.issuer || '-')}</div>
          </div>
        `).join('')}
      </div>` : ''}

      <div class="section">
        <h2 class="section-heading">6. Bidang Kepakaran & Kursus WBL yang Diselia / Dilatih</h2>
        ${cv.areasOfExpertise && cv.areasOfExpertise.length > 0 ? `
          <div style="margin-bottom:8px;">
            <div style="font-size:10.5px; font-weight:700; color:#475569; margin-bottom:4px;">Bidang Kepakaran Industri:</div>
            <div class="tag-wrap">
              ${cv.areasOfExpertise.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        ${cv.coachingCourses && cv.coachingCourses.length > 0 ? `
          <div>
            <div style="font-size:10.5px; font-weight:700; color:#475569; margin-bottom:4px;">Kursus Modular WBL FPTT UTeM:</div>
            <div class="tag-wrap">
              ${cv.coachingCourses.map((course) => `<span class="tag">${escapeHtml(course)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="footer-sign">
        <div class="sign-box">
          <div class="sign-title">Perakuan Calon Jurulatih Industri</div>
          <div>Nama: <strong>${escapeHtml(cv.fullName)}</strong></div>
          <div>Organisasi: ${escapeHtml(cv.companyName)}</div>
          <div>Tarikh Dijana: ${escapeHtml(generatedDate)}</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">Semakan & Pengesahan Penyelaras WBL (FPTT UTeM)</div>
          <div>Status Lantikan: <strong>${escapeHtml(statusText)}</strong></div>
          ${cv.appointmentLetterRef ? `<div>No. Rujukan Lantikan: <strong>${escapeHtml(cv.appointmentLetterRef)}</strong></div>` : ''}
          ${cv.reviewedBy ? `<div>Disemak Oleh: ${escapeHtml(cv.reviewedBy)}</div>` : '<div>Disemak Oleh: Menunggu Pengesahan Penyelaras</div>'}
          ${cv.coordinatorReviewNote ? `<div style="margin-top:4px; font-style:italic;">Ulasan: "${escapeHtml(cv.coordinatorReviewNote)}"</div>` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Prints the formatted CV using a hidden iframe (safe inside embedded AI Studio iframes without popups).
 */
export const printTrainerCV = (cv: TrainerCV, lang: 'ms' | 'en' = 'ms'): void => {
  const html = buildTrainerCVHtml(cv, lang);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1500);
    }
  }, 350);
};

/**
 * Downloads the formatted CV as a standalone printable HTML document.
 */
export const downloadTrainerCVHtml = (cv: TrainerCV, lang: 'ms' | 'en' = 'ms'): void => {
  const html = buildTrainerCVHtml(cv, lang);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (cv.fullName || 'jurulatih_industri').replace(/[^a-zA-Z0-9]+/g, '_');
  a.href = url;
  a.download = `CV_Lantikan_JI_${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
