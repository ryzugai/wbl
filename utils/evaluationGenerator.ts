import { StudentEvaluation, User } from '../types';
import { UTEM_PORTFOLIO_SCHEMES, UTEM_WEEKLY_ASSESSMENTS } from '../constants/utemWblRubrics';

export const generateEvaluationPrint = (
  evaluation: StudentEvaluation,
  language: 'ms' | 'en' = 'ms'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(language === 'ms' 
      ? "Tetingkap pop-up telah disekat. Sila benarkan pop-up pada pelayar web anda." 
      : "Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const scores = evaluation.scores || {
    taskKnowledge: 0, workQuality: 0, problemSolving: 0, toolCompetency: 0,
    punctuality: 0, communication: 0, workEthics: 0, adaptability: 0,
    logbookQuality: 0, reflectionQuality: 0
  };

  const statusBadge = () => {
    if (evaluation.status === 'verified_by_lecturer') {
      return `
        <div class="status-box status-verified">
          <span class="status-icon">✓</span>
          <strong>${language === 'ms' ? 'DISAHKAN OLEH PENSYARAH KURSUS' : 'VERIFIED BY COURSE LECTURER'}</strong>
          <div style="font-size: 8.5pt; margin-top: 2px;">
            ${evaluation.verifiedAt ? new Date(evaluation.verifiedAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </div>
        </div>
      `;
    }
    if (evaluation.status === 'submitted_by_trainer') {
      return `
        <div class="status-box status-submitted">
          <strong>${language === 'ms' ? 'TELAH DINILAI JURULATIH (MENUNGGU PENGESAHAN PENSYARAH)' : 'EVALUATED BY TRAINER (PENDING LECTURER VERIFICATION)'}</strong>
          <div style="font-size: 8.5pt; margin-top: 2px;">
            ${evaluation.submittedAt ? new Date(evaluation.submittedAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </div>
        </div>
      `;
    }
    if (evaluation.status === 'revision_requested') {
      return `
        <div class="status-box status-revision">
          <strong>${language === 'ms' ? 'SEMAKAN SEMULA DIPERLUKAN' : 'REVISION REQUESTED'}</strong>
        </div>
      `;
    }
    return `
      <div class="status-box status-draft">
        <strong>${language === 'ms' ? 'DRAF PENILAIAN' : 'DRAFT EVALUATION'}</strong>
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>Borang Penilaian Prestasi Industri Pelajar - ${evaluation.studentName} (${evaluation.courseCode})</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm;
        }

        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10pt;
          line-height: 1.35;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }

        .no-print-bar {
          background: #1e3a8a;
          color: #ffffff;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .btn-print {
          background: #ffffff;
          color: #1e3a8a;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }

        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 15px 25px;
        }

        .header-table {
          width: 100%;
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .utem-logo {
          width: 85px;
          height: auto;
        }

        .header-title {
          text-align: center;
          vertical-align: middle;
        }

        .univ-name {
          font-size: 13pt;
          font-weight: bold;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          margin: 0;
          text-transform: uppercase;
        }

        .faculty-name {
          font-size: 10.5pt;
          font-weight: bold;
          color: #374151;
          margin: 2px 0 0 0;
        }

        .program-name {
          font-size: 9pt;
          color: #4b5563;
          margin: 2px 0 0 0;
        }

        .doc-title-banner {
          background: #1e3a8a;
          color: #ffffff;
          text-align: center;
          padding: 5px;
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.8px;
          margin: 10px 0;
          text-transform: uppercase;
          border-radius: 3px;
        }

        .info-card {
          width: 100%;
          border: 1px solid #9ca3af;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 9pt;
        }

        .info-card td {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
        }

        .info-label {
          background: #f3f4f6;
          font-weight: bold;
          width: 22%;
          color: #374151;
        }

        .info-val {
          width: 28%;
          color: #111827;
        }

        .status-box {
          padding: 6px 12px;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 12px;
          font-size: 9.5pt;
        }

        .status-verified {
          background: #ecfdf5;
          border: 1.5px solid #059669;
          color: #065f46;
        }

        .status-submitted {
          background: #eff6ff;
          border: 1.5px solid #2563eb;
          color: #1e40af;
        }

        .status-revision {
          background: #fffbeb;
          border: 1.5px solid #d97706;
          color: #92400e;
        }

        .status-draft {
          background: #f3f4f6;
          border: 1.5px solid #9ca3af;
          color: #4b5563;
        }

        .section-header {
          background: #e5e7eb;
          font-weight: bold;
          font-size: 9.5pt;
          padding: 5px 8px;
          border-top: 1px solid #9ca3af;
          border-bottom: 1px solid #9ca3af;
          margin-top: 10px;
          color: #1f2937;
        }

        .rubric-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 8.5pt;
        }

        .rubric-table th, .rubric-table td {
          border: 1px solid #9ca3af;
          padding: 4px 6px;
        }

        .rubric-table th {
          background: #f9fafb;
          font-weight: bold;
          text-align: center;
          color: #1f2937;
        }

        .score-val {
          text-align: center;
          font-weight: bold;
          font-size: 10pt;
        }

        .subtotal-row {
          background: #f3f4f6;
          font-weight: bold;
        }

        .grand-total-box {
          background: #eff6ff;
          border: 2px solid #1e3a8a;
          padding: 8px 12px;
          margin: 12px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 4px;
        }

        .grand-score {
          font-size: 16pt;
          font-weight: bold;
          color: #1e3a8a;
        }

        .grand-grade {
          font-size: 16pt;
          font-weight: bold;
          color: #059669;
          background: #ffffff;
          padding: 2px 10px;
          border-radius: 4px;
          border: 1px solid #10b981;
        }

        .comment-box {
          border: 1px solid #9ca3af;
          padding: 6px 10px;
          min-height: 45px;
          font-size: 9pt;
          background: #fafafa;
          margin-bottom: 8px;
        }

        .signature-grid {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 15px;
          page-break-inside: avoid;
        }

        .sig-block {
          width: 48%;
          border: 1px solid #9ca3af;
          padding: 8px 12px;
          font-size: 8.5pt;
          border-radius: 3px;
        }

        .sig-title {
          font-weight: bold;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 3px;
          margin-bottom: 6px;
          color: #1e3a8a;
          text-transform: uppercase;
        }

        .sig-line {
          height: 35px;
          border-bottom: 1px dashed #6b7280;
          margin-bottom: 4px;
        }

        .footer-note {
          font-size: 7.5pt;
          color: #6b7280;
          text-align: center;
          margin-top: 15px;
          border-top: 1px solid #e5e7eb;
          padding-top: 5px;
        }

        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            background: #ffffff;
          }
          .container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span><strong>Borang Penilaian Prestasi Industri Pelajar (WBL)</strong> • ${evaluation.studentName} (${evaluation.courseCode})</span>
        <button class="btn-print" onclick="window.print()">CETAK / SIMPAN SEBAGAI PDF</button>
      </div>

      <div class="container">
        <!-- Header with Logo -->
        <table class="header-table">
          <tr>
            <td style="width: 90px; vertical-align: middle;">
              <svg class="utem-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" fill="#1e3a8a" stroke="#d97706" stroke-width="3"/>
                <circle cx="50" cy="50" r="38" fill="#ffffff"/>
                <path d="M50 18 L76 34 L76 66 L50 82 L24 66 L24 34 Z" fill="none" stroke="#1e3a8a" stroke-width="2.5"/>
                <path d="M35 42 L65 42 M50 42 L50 68" stroke="#d97706" stroke-width="4.5" stroke-linecap="round"/>
                <text x="50" y="78" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#1e3a8a" text-anchor="middle">UTeM</text>
              </svg>
            </td>
            <td class="header-title">
              <h1 class="univ-name">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</h1>
              <h2 class="faculty-name">FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)</h2>
              <p class="program-name">PROGRAM WORK-BASED LEARNING (WBL) 2u2i • SESI AKADEMIK 2026/2027</p>
            </td>
            <td style="width: 90px; text-align: right; vertical-align: top; font-size: 8pt; color: #4b5563;">
              <strong>FPTT-WBL-EVAL</strong><br/>
              Sem. 7 / 8
            </td>
          </tr>
        </table>

        <!-- Document Title Banner -->
        <div class="doc-title-banner">
          BORANG PENILAIAN PRESTASI INDUSTRI PELAJAR (INDUSTRY PERFORMANCE EVALUATION FORM)
        </div>

        <!-- Verification Status Banner -->
        ${statusBadge()}

        <!-- Student & Course Info Card -->
        <table class="info-card">
          <tr>
            <td class="info-label">Nama Pelajar:</td>
            <td class="info-val"><strong>${evaluation.studentName}</strong></td>
            <td class="info-label">Kod & Nama Kursus:</td>
            <td class="info-val"><strong>${evaluation.courseCode}</strong> - ${evaluation.courseName}</td>
          </tr>
          <tr>
            <td class="info-label">No. Matrik:</td>
            <td class="info-val font-mono">${evaluation.studentMatric}</td>
            <td class="info-label">Pensyarah Kursus:</td>
            <td class="info-val">${evaluation.lecturerName || 'Penyelaras Kursus FPTT'}</td>
          </tr>
          <tr>
            <td class="info-label">Program Pengajian:</td>
            <td class="info-val">${evaluation.studentProgram}</td>
            <td class="info-label">Jurulatih Industri:</td>
            <td class="info-val"><strong>${evaluation.trainerName}</strong> (${evaluation.trainerPosition || 'Jurulatih Industri'})</td>
          </tr>
          <tr>
            <td class="info-label">Syarikat Penempatan:</td>
            <td class="info-val" colspan="3">${evaluation.companyName} ${evaluation.companyAddress ? `• ${evaluation.companyAddress}` : ''}</td>
          </tr>
        </table>

        <!-- RUBRIC TABLE -->
        <!-- Part A: Kemahiran Teknikal -->
        <div class="section-header">BAHAGIAN A: KEMAHIRAN TEKNIKAL & PELAKSANAAN TUGASAN (40 MARKAH)</div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 6%;">No.</th>
              <th style="width: 58%; text-align: left;">Kriteria Penilaian Prestasi Industri</th>
              <th style="width: 18%;">Skala Rubrik</th>
              <th style="width: 18%;">Markah Diperoleh</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1.</td>
              <td>
                <strong>Pengetahuan & Pemahaman Tugasan Kerja (Task Knowledge)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Memahami prinsip, skop kerja, dan konsep teori yang diaplikasikan dalam tugasan harian industri.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.taskKnowledge || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">2.</td>
              <td>
                <strong>Kualiti & Ketepatan Hasil Kerja (Work Quality & Accuracy)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Menghasilkan kerja yang teliti, memenuhi standard kualiti industri, serta meminimumkan kesilapan.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.workQuality || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">3.</td>
              <td>
                <strong>Keupayaan Menyelesaikan Masalah & Inisiatif (Problem Solving & Initiative)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Mampu menganalisis isu operasi dan mencadangkan penyelesaian secara proaktif tanpa bergantung sepenuhnya.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.problemSolving || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">4.</td>
              <td>
                <strong>Kecekapan Penggunaan Alatan, Sistem & Teknologi (Tools & Systems Competency)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Cekap mengendalikan perisian, mesin, sistem IT atau alatan kerja khusus yang digunakan organisasi.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.toolCompetency || 0} / 10</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="3" style="text-align: right; padding-right: 12px;">SUBJUMLAH BAHAGIAN A (MAKSIMUM 40 MARKAH):</td>
              <td class="score-val" style="color: #1e3a8a;">${evaluation.technicalSubtotal || 0} / 40</td>
            </tr>
          </tbody>
        </table>

        <!-- Part B: Kemahiran Insaniah -->
        <div class="section-header">BAHAGIAN B: KEMAHIRAN INSANIAH & PROFESIONALISME (40 MARKAH)</div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 6%;">No.</th>
              <th style="width: 58%; text-align: left;">Kriteria Penilaian Prestasi Industri</th>
              <th style="width: 18%;">Skala Rubrik</th>
              <th style="width: 18%;">Markah Diperoleh</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1.</td>
              <td>
                <strong>Disiplin, Kedatangan & Ketepatan Masa (Punctuality & Attendance)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Mematuhi waktu kerja, hadir secara konsisten, menepati masa mesyuarat dan penyerahan tugasan.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.punctuality || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">2.</td>
              <td>
                <strong>Komunikasi & Kerjasama Berpasukan (Communication & Teamwork)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Berkomunikasi secara sopan dan jelas, berkolaborasi dengan rakan sekerja serta menerima bimbingan.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.communication || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">3.</td>
              <td>
                <strong>Etika Kerja, Integriti & Pematuhan SOP Keselamatan (Ethics & Safety Compliance)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Amanah menjaga kerahsiaan data syarikat, mematuhi peraturan keselamatan dan kod etika organisasi.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.workEthics || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">4.</td>
              <td>
                <strong>Kebolehsuaian & Sikap Terhadap Pembelajaran (Adaptability & Willingness to Learn)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Bersikap terbuka terhadap maklum balas, cepat menyesuaikan diri dengan budaya kerja syarikat.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.adaptability || 0} / 10</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="3" style="text-align: right; padding-right: 12px;">SUBJUMLAH BAHAGIAN B (MAKSIMUM 40 MARKAH):</td>
              <td class="score-val" style="color: #1e3a8a;">${evaluation.softSkillsSubtotal || 0} / 40</td>
            </tr>
          </tbody>
        </table>

        <!-- Part C: Buku Log Latihan -->
        <div class="section-header">BAHAGIAN C: BUKU LOG LATIHAN & DOKUMENTASI (20 MARKAH)</div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 6%;">No.</th>
              <th style="width: 58%; text-align: left;">Kriteria Penilaian Prestasi Industri</th>
              <th style="width: 18%;">Skala Rubrik</th>
              <th style="width: 18%;">Markah Diperoleh</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1.</td>
              <td>
                <strong>Konsistensi & Ketelitian Rekod Buku Log Harian (Logbook Regularity)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Merekod aktiviti setiap hari secara teratur, lengkap dengan masa kerja dan deskripsi tugasan.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.logbookQuality || 0} / 10</td>
            </tr>
            <tr>
              <td style="text-align: center;">2.</td>
              <td>
                <strong>Refleksi Mingguan & Kemahiran Diperoleh (Weekly Reflection & Learning Outcomes)</strong><br/>
                <span style="color: #6b7280; font-size: 7.5pt;">Menghuraikan kemahiran teknikal yang diperoleh dan cabaran industri yang berjaya ditangani.</span>
              </td>
              <td style="text-align: center;">0 - 10</td>
              <td class="score-val">${scores.reflectionQuality || 0} / 10</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="3" style="text-align: right; padding-right: 12px;">SUBJUMLAH BAHAGIAN C (MAKSIMUM 20 MARKAH):</td>
              <td class="score-val" style="color: #1e3a8a;">${evaluation.logbookSubtotal || 0} / 20</td>
            </tr>
          </tbody>
        </table>

        <!-- GRAND TOTAL SCORE & GRADE BANNER -->
        <div class="grand-total-box">
          <div>
            <div style="font-size: 9pt; text-transform: uppercase; color: #4b5563; font-weight: bold;">
              Jumlah Keseluruhan Markah (Bahagian A + B + C):
            </div>
            <div class="grand-score">
              ${evaluation.totalScore || 0} <span style="font-size: 11pt; color: #4b5563;">/ 100 MARKAH</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9pt; text-transform: uppercase; color: #4b5563; font-weight: bold; margin-bottom: 2px;">
              Gred Penilaian UTeM:
            </div>
            <span class="grand-grade">
              GRED ${evaluation.grade || 'A'}
            </span>
          </div>
        </div>

        <!-- Ulasan Jurulatih Industri -->
        <div style="margin-top: 8px;">
          <strong style="font-size: 8.5pt; color: #374151;">ULASAN & CADANGAN JURULATIH INDUSTRI:</strong>
          <div class="comment-box">
            ${evaluation.trainerComments ? `"${evaluation.trainerComments}"` : 'Tiada ulasan tambahan diberikan.'}
            ${evaluation.trainerRecommendation ? `<br/><strong>Cadangan Kerjaya:</strong> ${evaluation.trainerRecommendation}` : ''}
          </div>
        </div>

        <!-- Ulasan Pensyarah Kursus (Jika ada) -->
        ${evaluation.lecturerComments ? `
          <div style="margin-top: 6px;">
            <strong style="font-size: 8.5pt; color: #1e3a8a;">ULASAN & PENGESAHAN PENSYARAH KURSUS (UTeM):</strong>
            <div class="comment-box" style="background: #eff6ff; border-color: #93c5fd;">
              "${evaluation.lecturerComments}"
            </div>
          </div>
        ` : ''}

        <!-- SIGNATURES BLOCK -->
        <div class="signature-grid">
          <!-- Industry Trainer Block -->
          <div class="sig-block">
            <div class="sig-title">PERAKUAN JURULATIH INDUSTRI (INDUSTRY COACH)</div>
            <p style="font-size: 7.5pt; color: #4b5563; margin-top: 0;">
              Saya memperakui bahawa penilaian ini dibuat secara objektif berdasarkan prestasi harian sebenar pelajar di organisasi.
            </p>
            <div class="sig-line"></div>
            <div><strong>Nama:</strong> ${evaluation.trainerName}</div>
            <div><strong>Jawatan:</strong> ${evaluation.trainerPosition || 'Jurulatih Industri'}</div>
            <div><strong>Syarikat:</strong> ${evaluation.companyName}</div>
            <div><strong>Tarikh Penilaian:</strong> ${evaluation.submittedAt ? new Date(evaluation.submittedAt).toLocaleDateString('ms-MY') : '-'}</div>
            <div style="margin-top: 6px; font-size: 7.5pt; color: #9ca3af; text-align: center; border: 1px dashed #d1d5db; padding: 4px;">
              [ Cop Rasmi Syarikat / Organisasi Penempatan ]
            </div>
          </div>

          <!-- Course Lecturer Block -->
          <div class="sig-block">
            <div class="sig-title">PENGESAHAN PENSYARAH KURSUS (COURSE LECTURER)</div>
            <p style="font-size: 7.5pt; color: #4b5563; margin-top: 0;">
              Saya telah menyemak dan menentusahkan markah penilaian industri ini bagi tujuan penggredan akademik kursus WBL.
            </p>
            <div class="sig-line"></div>
            <div><strong>Nama Pensyarah:</strong> ${evaluation.verifiedByLecturerName || evaluation.lecturerName || 'Pensyarah Kursus FPTT'}</div>
            <div><strong>Jawatan:</strong> Pensyarah Kursus / Penyelaras WBL</div>
            <div><strong>Fakulti:</strong> FPTT, UTeM</div>
            <div><strong>Tarikh Pengesahan:</strong> ${evaluation.verifiedAt ? new Date(evaluation.verifiedAt).toLocaleDateString('ms-MY') : (evaluation.status === 'verified_by_lecturer' ? 'Disahkan' : 'Menunggu Pengesahan')}</div>
            <div style="margin-top: 6px; font-size: 7.5pt; color: #9ca3af; text-align: center; border: 1px dashed #d1d5db; padding: 4px;">
              [ Cop Rasmi Fakulti Pengurusan Teknologi & Teknousahawanan ]
            </div>
          </div>
        </div>

        <div class="footer-note">
          Dokumen rasmi dijana melalui Sistem Pengurusan Work-Based Learning (WBL) Fakulti Pengurusan Teknologi dan Teknousahawanan, Universiti Teknikal Malaysia Melaka (UTeM).
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export interface CourseStudentGradeRecord {
  studentMatric: string;
  studentName: string;
  studentProgram: string;
  companyName: string;
  trainerName: string;
  technicalSubtotal: number;
  softSkillsSubtotal: number;
  logbookSubtotal: number;
  totalScore: number;
  grade: string;
  status: 'verified_by_lecturer' | 'submitted_by_trainer' | 'draft' | 'unassessed' | 'revision_requested';
  verifiedAt?: string;
}

export const generateCourseGradeSummaryPrint = (
  courseInfo: {
    courseCode: string;
    courseName: string;
    semester?: string;
    creditHours?: number;
    lecturerName: string;
    lecturerStaffId?: string;
  },
  records: CourseStudentGradeRecord[],
  language: 'ms' | 'en' = 'ms'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(language === 'ms' 
      ? "Tetingkap pop-up telah disekat. Sila benarkan pop-up pada pelayar web anda." 
      : "Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const verifiedRecords = records.filter(r => r.status === 'verified_by_lecturer');
  const avgScore = verifiedRecords.length > 0 
    ? (verifiedRecords.reduce((sum, r) => sum + r.totalScore, 0) / verifiedRecords.length).toFixed(1)
    : '0';

  const rowsHtml = records.map((r, i) => {
    const statusText = 
      r.status === 'verified_by_lecturer' ? '<span style="color:#059669;font-weight:bold;">Disahkan</span>' :
      r.status === 'submitted_by_trainer' ? '<span style="color:#d97706;font-weight:bold;">Menunggu Pensyarah</span>' :
      r.status === 'revision_requested' ? '<span style="color:#dc2626;font-weight:bold;">Semakan Semula</span>' :
      r.status === 'draft' ? '<span style="color:#4b5563;">Draf</span>' :
      '<span style="color:#9ca3af;font-style:italic;">Belum Dinilai</span>';

    return `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td><strong>${r.studentMatric}</strong></td>
        <td>
          <div style="font-weight: bold; color: #1e293b;">${r.studentName}</div>
          <div style="font-size: 8pt; color: #64748b;">${r.studentProgram || '-'}</div>
        </td>
        <td>
          <div style="font-size: 8.5pt;">${r.companyName || '-'}</div>
          <div style="font-size: 7.5pt; color: #64748b;">Jurulatih: ${r.trainerName || '-'}</div>
        </td>
        <td style="text-align: center;">${r.status !== 'unassessed' ? r.technicalSubtotal : '-'}</td>
        <td style="text-align: center;">${r.status !== 'unassessed' ? r.softSkillsSubtotal : '-'}</td>
        <td style="text-align: center;">${r.status !== 'unassessed' ? r.logbookSubtotal : '-'}</td>
        <td style="text-align: center; font-weight: bold; font-size: 10pt; color: #1e3a8a;">
          ${r.status !== 'unassessed' ? r.totalScore : '-'}
        </td>
        <td style="text-align: center; font-weight: bold; font-size: 10pt; color: #b45309;">
          ${r.status !== 'unassessed' ? r.grade : '-'}
        </td>
        <td style="text-align: center; font-size: 8.5pt;">${statusText}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8" />
      <title>Ringkasan Markah Kursus WBL - ${courseInfo.courseCode}</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #1e293b; margin: 0; padding: 10px; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px; }
        .header-title { font-size: 13pt; font-weight: 800; color: #1e3a8a; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 14px; }
        .meta-item { font-size: 8.5pt; }
        .meta-item strong { display: block; color: #475569; font-size: 7.5pt; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #1e3a8a; color: white; padding: 6px 8px; font-size: 8.5pt; text-align: left; border: 1px solid #cbd5e1; }
        td { padding: 5px 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .stats-bar { display: flex; gap: 20px; font-size: 8.5pt; background: #eff6ff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bfdbfe; margin-bottom: 15px; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 25px; page-break-inside: avoid; }
        .sig-box { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 8.5pt; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 10px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 18px; background: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          Cetak Dokumen (Print)
        </button>
      </div>

      <div class="header">
        <div>
          <div style="font-size: 9pt; font-weight: bold; color: #64748b;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA (UTeM)</div>
          <div style="font-size: 8.5pt; color: #475569;">Fakulti Pengurusan Teknologi dan Teknousahawanan (FPTT)</div>
          <div class="header-title">SENARAI MARKAH & PENGGREDAN KURSUS WBL</div>
        </div>
        <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
          Tarikh Cetakan: ${new Date().toLocaleDateString('ms-MY', { dateStyle: 'long' })}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <strong>Kod & Nama Kursus</strong>
          ${courseInfo.courseCode} - ${courseInfo.courseName}
        </div>
        <div class="meta-item">
          <strong>Pensyarah Kursus</strong>
          ${courseInfo.lecturerName} ${courseInfo.lecturerStaffId ? `(${courseInfo.lecturerStaffId})` : ''}
        </div>
        <div class="meta-item">
          <strong>Semester / Jam Kredit</strong>
          ${courseInfo.semester || 'Semester 7'} • ${courseInfo.creditHours || 3} Jam Kredit
        </div>
        <div class="meta-item">
          <strong>Status Kohort</strong>
          ${records.length} Pelajar Dienrol (${verifiedRecords.length} Disahkan)
        </div>
      </div>

      <div class="stats-bar">
        <div><strong>Jumlah Pelajar Dienrol:</strong> ${records.length}</div>
        <div><strong>Telah Disahkan Pensyarah:</strong> ${verifiedRecords.length} / ${records.length}</div>
        <div><strong>Menunggu Pengesahan:</strong> ${records.filter(r => r.status === 'submitted_by_trainer').length}</div>
        <div><strong>Belum Dinilai Jurulatih:</strong> ${records.filter(r => r.status === 'unassessed').length}</div>
        <div><strong>Purata Markah Pelajar Disahkan:</strong> ${avgScore} / 100</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">No.</th>
            <th style="width: 90px;">No. Matrik</th>
            <th>Nama Pelajar & Program</th>
            <th>Organisasi Latihan & Jurulatih</th>
            <th style="width: 65px; text-align: center;">Teknikal<br>(40m)</th>
            <th style="width: 65px; text-align: center;">Insaniah<br>(40m)</th>
            <th style="width: 65px; text-align: center;">Buku Log<br>(20m)</th>
            <th style="width: 65px; text-align: center;">Jumlah<br>(100m)</th>
            <th style="width: 50px; text-align: center;">Gred</th>
            <th style="width: 110px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="sig-grid">
        <div class="sig-box">
          <div><strong>Disediakan & Disahkan oleh:</strong></div>
          <div style="height: 35px;"></div>
          <div><strong>${courseInfo.lecturerName}</strong></div>
          <div>Pensyarah Kursus ${courseInfo.courseCode}</div>
          <div>FPTT, Universiti Teknikal Malaysia Melaka</div>
        </div>
        <div class="sig-box">
          <div><strong>Disemak oleh:</strong></div>
          <div style="height: 35px;"></div>
          <div><strong>Dr. Mohd Guzairy bin Abd Ghani</strong></div>
          <div>Penyelaras WBL / Timbalan Dekan Akademik</div>
          <div>FPTT, Universiti Teknikal Malaysia Melaka</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateCourseRubricPrint = (
  courseCode: string,
  language: 'ms' | 'en' = 'ms'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(language === 'ms' 
      ? "Tetingkap pop-up telah disekat. Sila benarkan pop-up pada pelayar web anda." 
      : "Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const scheme = UTEM_PORTFOLIO_SCHEMES[courseCode] || UTEM_PORTFOLIO_SCHEMES['BTMT 3273(i)'];
  const weeklyAssessments = UTEM_WEEKLY_ASSESSMENTS[courseCode] || [];

  const partsHtml = (scheme?.parts || []).map((part, pIdx) => {
    const criteriaRows = part.criteria.map((c, cIdx) => `
      <tr style="background: ${cIdx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-weight: bold; vertical-align: top; width: 22%;">
          ${c.title}
          ${c.clo ? `<div style="font-size: 7.5pt; color: #1e40af; font-weight: normal; margin-top: 2px;">${c.clo}</div>` : ''}
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 8pt; vertical-align: top; width: 19.5%; color: #991b1b; background: #fef2f2;">
          <strong>Skor 1 (Lemah):</strong><br/>${c.levels[1]}
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 8pt; vertical-align: top; width: 19.5%; color: #92400e; background: #fffbeb;">
          <strong>Skor 2 (Sederhana):</strong><br/>${c.levels[2]}
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 8pt; vertical-align: top; width: 19.5%; color: #1e40af; background: #eff6ff;">
          <strong>Skor 3 (Baik):</strong><br/>${c.levels[3]}
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 8pt; vertical-align: top; width: 19.5%; color: #065f46; background: #ecfdf5;">
          <strong>Skor 4 (Cemerlang):</strong><br/>${c.levels[4]}
        </td>
      </tr>
    `).join('');

    return `
      <div style="margin-top: 18px; page-break-inside: avoid;">
        <div style="background: #1e3a8a; color: #ffffff; padding: 6px 12px; font-weight: bold; font-size: 9.5pt; display: flex; justify-content: space-between; border-radius: 4px 4px 0 0;">
          <span>${part.partCode}: ${part.partTitle}</span>
          <span>Penilai: ${part.evaluator} (${part.weightagePercent}%)</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 8pt; color: #475569; font-style: italic;">
          ${part.description}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8.5pt;">
          <thead>
            <tr style="background: #e2e8f0; text-align: left; font-size: 8pt; font-weight: bold;">
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1;">Kriteria Pentaksiran</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #991b1b;">1 - Lemah (0-49%)</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #92400e;">2 - Sederhana (50-64%)</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #1e40af;">3 - Baik (65-79%)</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; color: #065f46;">4 - Cemerlang (80-100%)</th>
            </tr>
          </thead>
          <tbody>
            ${criteriaRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  const weeklyRows = weeklyAssessments.map(w => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; width: 70px;">
        Minggu ${w.week}
      </td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 45%;">
        <strong>${w.taskTitle}</strong>
        <div style="font-size: 7.5pt; color: #1e40af; margin-top: 2px;">${w.cloStatement}</div>
        <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 7.5pt; color: #475569;">
          ${w.taskHighlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; width: 38%; font-size: 7.5pt;">
        <ol style="margin: 0 0 0 16px; padding: 0;">
          ${w.areas.map(a => `<li>${a.title}</li>`).join('')}
        </ol>
      </td>
      <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; width: 65px;">
        ${w.maxMarks}m
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>Rubrik & Skema Pemarkahan Rasmi WBL - ${scheme?.courseCode || courseCode}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 9pt; color: #0f172a; margin: 0; padding: 12px; }
        .no-print { background: #1e3a8a; color: white; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 11px; margin-bottom: 15px; border-radius: 6px; }
        .btn-print { background: #f59e0b; color: #111827; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
        .title-box { text-align: center; flex: 1; }
        .univ { font-size: 11pt; font-weight: bold; color: #1e3a8a; margin: 0; text-transform: uppercase; }
        .faculty { font-size: 9.5pt; font-weight: bold; color: #334155; margin: 2px 0 0; }
        .sub { font-size: 8pt; color: #64748b; margin: 2px 0 0; }
        .course-banner { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        table.summary-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8pt; }
        table.summary-tbl th, table.summary-tbl td { border: 1px solid #cbd5e1; padding: 4px 6px; }
        table.summary-tbl th { background: #f1f5f9; text-align: left; }
        @media print { .no-print { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span><strong>Rubrik & Panduan Pemarkahan Rasmi WBL FPTT UTeM</strong> • ${scheme?.courseCode} - ${scheme?.courseName}</span>
        <button class="btn-print" onclick="window.print()">CETAK / SIMPAN SEBAGAI PDF</button>
      </div>

      <div class="header">
        <div style="font-weight: bold; font-size: 9pt; color: #1e3a8a; width: 100px;">
          UTeM / FPTT
        </div>
        <div class="title-box">
          <div class="univ">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</div>
          <div class="faculty">FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)</div>
          <div class="sub">PANDUAN RUBRIK & SKEMA PEMARKAHAN INDUSTRI PROGRAM WORK-BASED LEARNING (2u2i)</div>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #64748b; width: 100px;">
          Lampiran Pentaksiran<br>Sesi 2026/2027
        </div>
      </div>

      <div class="course-banner">
        <div>
          <span style="background: #1e3a8a; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace; font-size: 9pt;">
            ${scheme?.courseCode}
          </span>
          <strong style="font-size: 10pt; margin-left: 8px; color: #0f172a;">${scheme?.courseName}</strong>
          <span style="font-size: 8pt; color: #64748b; margin-left: 8px;">(${scheme?.creditHours || 3} Jam Kredit)</span>
        </div>
        <div style="font-size: 8.5pt; font-weight: bold; color: #1e40af;">
          Nisbah Penilai: ${scheme?.evaluatorRatio || 'JI: 60% | TPF: 40%'}
        </div>
      </div>

      <!-- Component Summary Table -->
      ${scheme?.componentsSummary && scheme.componentsSummary.length > 0 ? `
        <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 4px; color: #1e3a8a;">
          1. JADUAL PEMBERAT KOMPONEN & HASIL PEMBELAJARAN KURSUS (CLO / PLO):
        </div>
        <table class="summary-tbl">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No.</th>
              <th>Komponen Penilaian Prestasi Industri</th>
              <th>Domain Pembelajaran</th>
              <th>CLO / PLO</th>
              <th>Penilai Bertanggungjawab</th>
              <th style="width: 70px; text-align: center;">Pemberat (%)</th>
            </tr>
          </thead>
          <tbody>
            ${scheme.componentsSummary.map(c => `
              <tr>
                <td style="text-align: center;">${c.no}</td>
                <td><strong>${c.componentName}</strong></td>
                <td>${c.domain}</td>
                <td style="font-family: monospace; font-size: 7.5pt;">${c.clo} / ${c.plo}</td>
                <td>${c.evaluator}</td>
                <td style="text-align: center; font-weight: bold; color: #1e40af;">${c.weightPercent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- Detailed Rubrics Parts -->
      <div style="font-weight: bold; font-size: 8.5pt; margin-top: 12px; margin-bottom: 4px; color: #1e3a8a;">
        2. RUBRIK PRESTASI MENGIKUT SKALA TAHAP PENCAPAIAN (SKOR 1 HINGGA 4):
      </div>
      ${partsHtml}

      <!-- Weekly Milestones if available -->
      ${weeklyRows ? `
        <div style="page-break-before: always; margin-top: 15px;">
          <div style="font-weight: bold; font-size: 9pt; margin-bottom: 6px; color: #1e3a8a;">
            3. PANDUAN PENTAKSIRAN TUGASAN MINGGUAN BUKU LOG (MINGGU 1 - 5):
          </div>
          <table class="summary-tbl">
            <thead>
              <tr style="background: #e2e8f0;">
                <th style="text-align: center;">Minggu</th>
                <th>Tugasan & Hasil Pembelajaran (CLO)</th>
                <th>Bidang Penilaian (Assessment Areas)</th>
                <th style="text-align: center;">Maks</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Grading Scale -->
      <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 7.5pt; color: #475569; display: flex; justify-content: space-between;">
        <div><strong>Skala Penggredan Rasmi UTeM:</strong> A+ (90-100) | A (80-89) | A- (75-79) | B+ (70-74) | B (65-69) | B- (60-64) | C+ (55-59) | C (50-54) | D (40-49) | E (0-39)</div>
        <div>Dokumen Rasmi FPTT UTeM • Work-Based Learning (WBL)</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateWeeklyStudentAssessmentPrint = (
  evaluation: StudentEvaluation,
  weekConfig?: any,
  language: 'ms' | 'en' = 'ms'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(language === 'ms' 
      ? "Tetingkap pop-up telah disekat. Sila benarkan pop-up pada pelayar web anda." 
      : "Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const wScores = evaluation.weeklyScores || {
    area1: Math.round((evaluation.scores?.taskKnowledge || 8) / 2.5),
    area2: Math.round((evaluation.scores?.workQuality || 8) / 2.5),
    area3: Math.round((evaluation.scores?.problemSolving || 8) / 2.5),
    total: 10
  };

  const weekNum = evaluation.weekNumber || 1;
  const total = wScores.total || (wScores.area1 + wScores.area2 + wScores.area3);
  const percent = Math.round((total / 12) * 100);

  const sectorLabels: Record<string, string> = {
    perkhidmatan: '🏢 Perkhidmatan (Services / IT / Agensi / Perbankan)',
    pembarangan: '🏪 Pembarangan (Merchandising / Runcit / FMCG / Stor)',
    perdagangan: '💼 Perdagangan & Pengedaran (Trade / Commerce / Logistik)',
    pembuatan: '🏭 Pembuatan & Kejuruteraan (Manufacturing / Production)',
    universal: '🌐 Universal (Semua Sektor Industri)'
  };
  const activeSector = evaluation.industrySector || 'universal';
  const sectorLabel = sectorLabels[activeSector] || '🌐 Universal (Semua Sektor Industri)';
  const matchedSectorGuide = weekConfig?.sectorGuides?.find((s: any) => s.sector === activeSector) || weekConfig?.sectorGuides?.[0];

  const html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>Borang Pentaksiran Hasil Kerja Mingguan - Minggu ${weekNum} - ${evaluation.studentName}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; color: #0f172a; margin: 0; padding: 15px; }
        .no-print { background: #1e3a8a; color: white; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 11px; margin-bottom: 15px; border-radius: 6px; }
        .btn-print { background: #f59e0b; color: #111827; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
        .title-box { text-align: center; flex: 1; }
        .univ { font-size: 11pt; font-weight: bold; color: #1e3a8a; margin: 0; text-transform: uppercase; }
        .faculty { font-size: 9pt; font-weight: bold; color: #334155; margin: 2px 0 0; }
        .doc-title { font-size: 11pt; font-weight: bold; color: #0f172a; margin: 4px 0 0; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 8.5pt; }
        .meta-card { border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; background: #f8fafc; }
        .task-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px; margin-bottom: 14px; }
        table.rubric-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 8.5pt; }
        table.rubric-table th, table.rubric-table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
        table.rubric-table th { background: #1e3a8a; color: white; }
        .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
        .sign-box { border-top: 1px solid #64748b; padding-top: 8px; font-size: 8.5pt; }
        @media print { .no-print { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span>Pratonton Cetakan Borang Pentaksiran Mingguan • UTeM FPTT WBL</span>
        <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button>
      </div>

      <div class="header">
        <div class="title-box">
          <div class="univ">UNIVERSITI TEKNIKAL MALAYSIA MELAKA (UTeM)</div>
          <div class="faculty">FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)</div>
          <div class="doc-title">BORANG PENTAKSIRAN HASIL KERJA MINGGUAN OLEH JURULATIH INDUSTRI (JI)</div>
          <div style="font-size: 8.5pt; color: #475569; margin-top: 2px;">
            PROGRAM SARJANA MUDA 2u2i WORK-BASED LEARNING (WBL)
          </div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <div style="font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 4px; color: #1e3a8a;">
            MAKLUMAT PELAJAR & PENEMPATAN
          </div>
          <div><strong>Nama Pelajar:</strong> ${evaluation.studentName}</div>
          <div><strong>No. Matrik:</strong> ${evaluation.studentMatric}</div>
          <div><strong>Program:</strong> ${evaluation.studentProgram || 'SARJANA MUDA TEKNOUSAHAWANAN (BTEC)'}</div>
          <div><strong>Syarikat Penempatan:</strong> ${evaluation.companyName}</div>
        </div>
        <div class="meta-card">
          <div style="font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 4px; color: #1e3a8a;">
            MAKLUMAT KURSUS & MINGGU PENTAKSIRAN
          </div>
          <div><strong>Kursus:</strong> ${evaluation.courseCode} - ${evaluation.courseName}</div>
          <div><strong>Sektor Firma:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-weight: bold;">${sectorLabel}</span></div>
          <div><strong>Minggu Pentaksiran:</strong> <span style="background: #fef08a; padding: 1px 6px; border-radius: 4px; font-weight: bold;">Minggu ${weekNum}</span></div>
          <div><strong>Tempoh Tarikh:</strong> ${evaluation.startDate || weekConfig?.startDate || '-'} hingga ${evaluation.endDate || weekConfig?.endDate || '-'}</div>
          <div><strong>Jurulatih Penilai (JI):</strong> ${evaluation.trainerName} (${evaluation.trainerPosition || 'Jurulatih Industri'})</div>
        </div>
      </div>

      <div class="task-box">
        <div style="font-weight: bold; color: #1e40af; font-size: 9.5pt;">
          ${evaluation.weeklyTaskTitle || weekConfig?.taskTitle || `Tugasan Pembelajaran Minggu ${weekNum}`}
        </div>
        ${weekConfig?.cloStatement ? `<div style="font-size: 8pt; color: #3b82f6; margin-top: 2px; font-weight: 600;">${weekConfig.cloStatement}</div>` : ''}
        ${matchedSectorGuide ? `
          <div style="margin-top: 6px; padding: 6px 8px; background: #ffffff; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 8pt; color: #1e3a8a;">
            <strong>Aplikasi Sektor Firma:</strong> ${matchedSectorGuide.applicationGuide}
          </div>
        ` : ''}
        ${weekConfig?.taskHighlights ? `
          <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 8pt; color: #334155;">
            ${weekConfig.taskHighlights.map((h: string) => `<li>${h}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <table class="rubric-table">
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">No.</th>
            <th>Bidang Pentaksiran Mingguan (Assessment Areas)</th>
            <th style="width: 140px; text-align: center;">Rubrik Prestasi</th>
            <th style="width: 90px; text-align: center;">Skor (Maks: 4)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; font-weight: bold;">1</td>
            <td>
              <strong>${weekConfig?.areas?.[0]?.title || 'Penguasaan konsep dan metodologi kerja industri'}</strong>
              ${matchedSectorGuide?.areaInterpretations?.area1 ? `
                <div style="font-size: 7.5pt; color: #475569; margin-top: 3px; background: #f8fafc; padding: 2px 6px; border-left: 2px solid #3b82f6;">
                  <em>Fokus Sektor (${matchedSectorGuide.sectorName.split(' ')[0]}): ${matchedSectorGuide.areaInterpretations.area1}</em>
                </div>
              ` : ''}
            </td>
            <td style="text-align: center; font-size: 8pt;">
              ${wScores.area1 === 4 ? '<span style="color: #065f46; font-weight: bold;">Cemerlang (Skor 4)</span>' : 
                wScores.area1 === 3 ? '<span style="color: #1e40af; font-weight: bold;">Baik (Skor 3)</span>' :
                wScores.area1 === 2 ? '<span style="color: #92400e; font-weight: bold;">Sederhana (Skor 2)</span>' :
                '<span style="color: #991b1b; font-weight: bold;">Lemah (Skor 1)</span>'}
            </td>
            <td style="text-align: center; font-weight: bold; font-size: 11pt;">${wScores.area1} / 4</td>
          </tr>
          <tr>
            <td style="text-align: center; font-weight: bold;">2</td>
            <td>
              <strong>${weekConfig?.areas?.[1]?.title || 'Kualiti hasil kerja, ketepatan analisis dan pematuhan SOP'}</strong>
              ${matchedSectorGuide?.areaInterpretations?.area2 ? `
                <div style="font-size: 7.5pt; color: #475569; margin-top: 3px; background: #f8fafc; padding: 2px 6px; border-left: 2px solid #3b82f6;">
                  <em>Fokus Sektor (${matchedSectorGuide.sectorName.split(' ')[0]}): ${matchedSectorGuide.areaInterpretations.area2}</em>
                </div>
              ` : ''}
            </td>
            <td style="text-align: center; font-size: 8pt;">
              ${wScores.area2 === 4 ? '<span style="color: #065f46; font-weight: bold;">Cemerlang (Skor 4)</span>' : 
                wScores.area2 === 3 ? '<span style="color: #1e40af; font-weight: bold;">Baik (Skor 3)</span>' :
                wScores.area2 === 2 ? '<span style="color: #92400e; font-weight: bold;">Sederhana (Skor 2)</span>' :
                '<span style="color: #991b1b; font-weight: bold;">Lemah (Skor 1)</span>'}
            </td>
            <td style="text-align: center; font-weight: bold; font-size: 11pt;">${wScores.area2} / 4</td>
          </tr>
          <tr>
            <td style="text-align: center; font-weight: bold;">3</td>
            <td>
              <strong>${weekConfig?.areas?.[2]?.title || 'Etika profesionalisme, inisiatif kendiri dan buku log'}</strong>
              ${matchedSectorGuide?.areaInterpretations?.area3 ? `
                <div style="font-size: 7.5pt; color: #475569; margin-top: 3px; background: #f8fafc; padding: 2px 6px; border-left: 2px solid #3b82f6;">
                  <em>Fokus Sektor (${matchedSectorGuide.sectorName.split(' ')[0]}): ${matchedSectorGuide.areaInterpretations.area3}</em>
                </div>
              ` : ''}
            </td>
            <td style="text-align: center; font-size: 8pt;">
              ${wScores.area3 === 4 ? '<span style="color: #065f46; font-weight: bold;">Cemerlang (Skor 4)</span>' : 
                wScores.area3 === 3 ? '<span style="color: #1e40af; font-weight: bold;">Baik (Skor 3)</span>' :
                wScores.area3 === 2 ? '<span style="color: #92400e; font-weight: bold;">Sederhana (Skor 2)</span>' :
                '<span style="color: #991b1b; font-weight: bold;">Lemah (Skor 1)</span>'}
            </td>
            <td style="text-align: center; font-weight: bold; font-size: 11pt;">${wScores.area3} / 4</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; padding-right: 12px; font-size: 9pt;">
              JUMLAH MARKAH MINGGUAN (MAKSIMUM: 12 MARKAH):
            </td>
            <td style="text-align: center; font-size: 12pt; color: #1e3a8a; background: #e0f2fe;">
              ${total} / 12 (${percent}%)
            </td>
          </tr>
        </tbody>
      </table>

      <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; margin-bottom: 12px; background: #fafafa;">
        <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px; font-size: 8.5pt;">
          ULASAN & BIMBINGAN JURULATIH INDUSTRI (JI):
        </div>
        <div style="font-style: italic; color: #334155; font-size: 9pt; min-height: 40px;">
          "${evaluation.trainerComments || 'Pelajar menunjukkan komitmen yang baik dalam melaksanakan tugasan mingguan di premis industri, menepati masa dan proaktif dalam penyelesaian tugasan.'}"
        </div>
        ${evaluation.trainerRecommendation ? `
          <div style="font-size: 8.5pt; color: #065f46; margin-top: 6px; font-weight: 600;">
            Cadangan / Syor: ${evaluation.trainerRecommendation}
          </div>
        ` : ''}
      </div>

      <div class="sign-grid">
        <div class="sign-box">
          <div><strong>Tandatangan Jurulatih Industri:</strong></div>
          <div style="height: 35px;"></div>
          <div>Nama: <strong>${evaluation.trainerName}</strong></div>
          <div>Jawatan: ${evaluation.trainerPosition || 'Jurulatih Industri'}</div>
          <div>Tarikh: ${evaluation.submittedAt ? new Date(evaluation.submittedAt).toLocaleDateString('ms-MY') : new Date().toLocaleDateString('ms-MY')}</div>
        </div>
        <div class="sign-box">
          <div><strong>Pengesahan Pensyarah Fakulti (TPF):</strong></div>
          <div style="height: 35px;"></div>
          <div>Nama: <strong>${evaluation.lecturerName || 'Pensyarah Kursus FPTT'}</strong></div>
          <div>Fakulti: FPTT, Universiti Teknikal Malaysia Melaka</div>
          <div>Status: <span style="color: #065f46; font-weight: bold;">${evaluation.status === 'verified_by_lecturer' ? 'Disahkan' : 'Dalam Tindakan'}</span></div>
        </div>
      </div>

      <div style="margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between;">
        <div>Borang Rasmi Pentaksiran Hasil Kerja Mingguan • FPTT UTeM</div>
        <div>Dicetak melalui Sistem Pengurusan WBL FPTT • ${new Date().toLocaleString('ms-MY')}</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
