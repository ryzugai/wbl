import { TrainerCV } from '../types';
import { evaluateTrainerEligibility } from './trainerCvEligibility';

const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Normalizes common image share links (such as Google Drive file links) into direct image URLs.
 */
export const normalizeImageUrl = (rawUrl?: string | null): string => {
  const url = (rawUrl || '').trim();
  if (!url || url === 'idb_stored') return '';

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Google Drive: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const driveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?[^#]*id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  return url;
};

export const buildTrainerCVHtml = (cv: TrainerCV, lang: 'ms' | 'en' = 'ms'): string => {
  const eligibility = evaluateTrainerEligibility({
    qualificationCategory: cv.qualificationCategory,
    experienceYears: cv.experienceYears,
    hasSpecialRecognition: cv.hasSpecialRecognition,
    specialRecognitionDetails: cv.specialRecognitionDetails
  });

  const isGreen = eligibility.isEligible;

  // Color palette: Emerald Green theme if eligible, clean professional slate otherwise
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
        accent: '#64748b', // slate-500
        softBg: '#f8fafc', // slate-50
        softBorder: '#cbd5e1', // slate-300
        badgeBg: '#f1f5f9', // slate-100
        badgeText: '#334155',
        pageTint: '#ffffff'
      };

  const initials = (cv.fullName || 'JI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const resolvedImgUrl = normalizeImageUrl(cv.profileImage);

  // Build consecutive section numbering cleanly
  let sectionCounter = 0;
  const nextSec = () => {
    sectionCounter += 1;
    return sectionCounter;
  };

  const hasEducation = true;
  const educationRows =
    cv.educationList && cv.educationList.length > 0 && cv.educationList.some((e) => e.level || e.institution)
      ? cv.educationList
      : [
          {
            level: cv.highestQualificationTitle || '-',
            field: cv.fieldOfStudy || '-',
            institution: cv.institutionName || '-',
            year: cv.graduationYear || '-'
          }
        ];

  const validWork = (cv.workExperienceList || []).filter((w) => w.company || w.position);
  const validCerts = (cv.certificationsList || []).filter((c) => c.title);
  const hasSpecialText = Boolean(cv.hasSpecialRecognition && (cv.specialRecognitionDetails || '').trim());
  const hasCertOrRecognition = validCerts.length > 0 || hasSpecialText;
  const hasExpertiseOrCourses =
    (cv.areasOfExpertise && cv.areasOfExpertise.length > 0) ||
    (cv.coachingCourses && cv.coachingCourses.length > 0);

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
      padding: 16px 0;
      color: #1e293b;
      background: ${isGreen ? '#ecfdf5' : '#f8fafc'};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      line-height: 1.45;
    }
    .print-toolbar {
      max-width: 210mm;
      margin: 0 auto 12px auto;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      padding: 9px 18px;
      background: ${palette.primary};
      color: #ffffff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12.5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
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
      padding: 24px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 4px solid ${palette.accent};
    }
    .avatar-box {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid ${palette.accent};
      background: rgba(255,255,255,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-size: 28px;
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
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.88;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .cv-name {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .cv-sub {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: ${isGreen ? '#d1fae5' : '#e2e8f0'};
      font-weight: 600;
    }
    .cv-body {
      padding: 22px 28px 28px 28px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 20px;
      background: #ffffff;
      border: 1px solid ${isGreen ? '#a7f3d0' : '#e2e8f0'};
      border-radius: 10px;
      padding: 13px 16px;
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
      min-width: 118px;
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
      white-space: pre-line;
      border-top: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
      border-right: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
      border-bottom: 1px solid ${isGreen ? '#d1fae5' : '#e2e8f0'};
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
      gap: 10px;
    }
    .item-meta {
      font-size: 10.5px;
      color: ${palette.primary};
      font-weight: 700;
      white-space: nowrap;
    }
    .item-desc {
      margin-top: 4px;
      font-size: 11px;
      color: #475569;
      white-space: pre-line;
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
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-toolbar { display: none !important; }
      .cv-sheet { box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
  <div class="cv-sheet">
    <div class="cv-top-banner">
      <div class="avatar-box">
        ${
          resolvedImgUrl
            ? `<img src="${escapeHtml(resolvedImgUrl)}" alt="${escapeHtml(cv.fullName)}" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
            : escapeHtml(initials)
        }
      </div>
      <div>
        <div class="utem-kicker">CURRICULUM VITAE • JURULATIH INDUSTRI (WBL) FPTT UTeM</div>
        <h1 class="cv-name">${escapeHtml(cv.fullName)}</h1>
        <p class="cv-sub">${escapeHtml(cv.companyPosition || 'Jurulatih Industri')} • ${escapeHtml(cv.companyName || '-')}</p>
      </div>
    </div>

    <div class="cv-body">
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Syarikat / Industri:</span><span>${escapeHtml(cv.companyName || '-')}</span></div>
        <div class="info-item"><span class="info-label">Jawatan Semasa:</span><span>${escapeHtml(cv.companyPosition || '-')}</span></div>
        <div class="info-item"><span class="info-label">Emel Rasmi:</span><span>${escapeHtml(cv.email || '-')}</span></div>
        <div class="info-item"><span class="info-label">No. Telefon:</span><span>${escapeHtml(cv.phone || '-')}</span></div>
        <div class="info-item"><span class="info-label">No. KP / ID Staf:</span><span>${escapeHtml(cv.icNo || cv.staffId || '-')}</span></div>
        <div class="info-item"><span class="info-label">Tempoh Pengalaman:</span><span><strong>${cv.experienceYears || 0} Tahun</strong> dalam bidang berkaitan</span></div>
        <div class="info-item"><span class="info-label">Kelayakan Tertinggi:</span><span>${escapeHtml(cv.highestQualificationTitle || '-')} ${cv.graduationYear ? `(${escapeHtml(cv.graduationYear)})` : ''}</span></div>
        <div class="info-item"><span class="info-label">Bidang & Institusi:</span><span>${escapeHtml(cv.fieldOfStudy || '-')} — ${escapeHtml(cv.institutionName || '-')}</span></div>
      </div>

      ${cv.professionalSummary ? `
      <div class="section">
        <h2 class="section-heading">${nextSec()}. Ringkasan Profil Profesional</h2>
        <div class="summary-box">${escapeHtml(cv.professionalSummary)}</div>
      </div>` : ''}

      ${hasEducation ? `
      <div class="section">
        <h2 class="section-heading">${nextSec()}. Latar Belakang Akademik</h2>
        ${educationRows.map((edu) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(edu.level || '-')} ${edu.field ? `— ${escapeHtml(edu.field)}` : ''}</span>
              <span class="item-meta">${escapeHtml(edu.year || '-')}</span>
            </div>
            <div class="item-desc">${escapeHtml(edu.institution || '-')}</div>
          </div>
        `).join('')}
      </div>` : ''}

      ${validWork.length > 0 ? `
      <div class="section">
        <h2 class="section-heading">${nextSec()}. Pengalaman Kerja & Industri (${cv.experienceYears || 0} Tahun)</h2>
        ${validWork.map((work) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(work.position || '-')} — ${escapeHtml(work.company || '-')}</span>
              <span class="item-meta">${escapeHtml(work.startYear || '-')} - ${escapeHtml(work.endYear || 'Kini')}</span>
            </div>
            ${work.responsibilities ? `<div class="item-desc">${escapeHtml(work.responsibilities)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      ${hasCertOrRecognition ? `
      <div class="section">
        <h2 class="section-heading">${nextSec()}. Pensijilan Profesional, Anugerah & Pengiktirafan</h2>
        ${validCerts.map((cert) => `
          <div class="item-card">
            <div class="item-top">
              <span>${escapeHtml(cert.title)}</span>
              <span class="item-meta">${escapeHtml(cert.year || '-')}</span>
            </div>
            <div class="item-desc">Penganugerahan / Badan Pengiktiraf: ${escapeHtml(cert.issuer || '-')}</div>
          </div>
        `).join('')}
        ${hasSpecialText ? `
          <div class="item-card">
            <div class="item-top">
              <span>Kemahiran Istimewa / Pengiktirafan Profesional & Industri</span>
            </div>
            <div class="item-desc">${escapeHtml(cv.specialRecognitionDetails)}</div>
          </div>
        ` : ''}
      </div>` : ''}

      ${hasExpertiseOrCourses ? `
      <div class="section">
        <h2 class="section-heading">${nextSec()}. Bidang Kepakaran & Kursus WBL yang Diselia / Dilatih</h2>
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
      </div>` : ''}
    </div>
  </div>
</body>
</html>`;
};

/**
 * Prints / Saves as PDF the formatted CV using a hidden iframe (safe inside embedded iframes without popups).
 * Waits briefly for external profile image links to finish loading before invoking print().
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

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1500);
    }
  };

  const img = doc.querySelector('img');
  if (img && !img.complete) {
    let printed = false;
    const done = () => {
      if (printed) return;
      printed = true;
      setTimeout(triggerPrint, 150);
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    setTimeout(done, 2000);
  } else {
    setTimeout(triggerPrint, 350);
  }
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
  a.download = `CV_Jurulatih_Industri_${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
