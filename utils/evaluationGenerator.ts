import { StudentEvaluation, User } from '../types';

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
