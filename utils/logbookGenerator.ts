import { WeeklyLogbook, User } from '../types';

export const generateWeeklyLogbookPrint = (
  logbook: WeeklyLogbook,
  student?: User,
  language: 'ms' | 'en' = 'ms'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(language === 'ms' 
      ? "Tetingkap pop-up telah disekat. Sila benarkan pop-up pada pelayar web anda." 
      : "Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const ratingLabel = {
    cemerlang: language === 'ms' ? 'Cemerlang (Excellent)' : 'Excellent',
    baik: language === 'ms' ? 'Baik (Good)' : 'Good',
    memuaskan: language === 'ms' ? 'Memuaskan (Satisfactory)' : 'Satisfactory',
    perlu_bimbingan: language === 'ms' ? 'Perlu Bimbingan (Needs Improvement)' : 'Needs Improvement'
  };

  const statusBadge = () => {
    if (logbook.status === 'verified') {
      return `
        <div class="status-box status-verified">
          <span class="status-icon">✓</span>
          <strong>${language === 'ms' ? 'DISAHKAN OLEH JURULATIH INDUSTRI' : 'VERIFIED BY INDUSTRY COACH'}</strong>
          <div style="font-size: 8.5pt; margin-top: 2px;">
            ${logbook.verifiedAt ? new Date(logbook.verifiedAt).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </div>
        </div>
      `;
    }
    if (logbook.status === 'submitted') {
      return `
        <div class="status-box status-submitted">
          <strong>${language === 'ms' ? 'TELAH DIHANTAR (MENUNGGU PENGESAHAN JURULATIH)' : 'SUBMITTED (PENDING VERIFICATION)'}</strong>
        </div>
      `;
    }
    if (logbook.status === 'revision') {
      return `
        <div class="status-box status-revision">
          <strong>${language === 'ms' ? 'PERLU PEMBETULAN' : 'NEEDS REVISION'}</strong>
        </div>
      `;
    }
    return `
      <div class="status-box status-draft">
        <strong>${language === 'ms' ? 'DRAF (BELUM DIHANTAR)' : 'DRAFT (NOT SUBMITTED)'}</strong>
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>DAILY TRAINING LOG - Minggu ${logbook.weekNumber} - ${logbook.studentName || logbook.studentMatric}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          font-size: 9.5pt;
          line-height: 1.35;
          color: #111827;
          background: #f8fafc;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 820px;
          margin: 0 auto;
          background: #ffffff;
          padding: 24px 30px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .container {
            max-width: 100%;
            padding: 0;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }

        /* Print Toolbar */
        .print-toolbar {
          position: fixed;
          top: 15px;
          right: 20px;
          background: #1e3a8a;
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 9999;
          font-size: 10pt;
          font-weight: bold;
        }
        .print-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 10pt;
          transition: background 0.2s;
        }
        .print-btn:hover {
          background: #2563eb;
        }

        /* Header */
        .header-table {
          width: 100%;
          border-bottom: 2.5px solid #1e3a8a;
          padding-bottom: 8px;
          margin-bottom: 14px;
        }
        .logo-cell {
          width: 110px;
          vertical-align: middle;
        }
        .logo {
          max-height: 65px;
          width: auto;
        }
        .uni-titles {
          vertical-align: middle;
          padding-left: 14px;
        }
        .uni-name {
          font-size: 12pt;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: 0.5px;
        }
        .faculty-name {
          font-size: 10pt;
          font-weight: 700;
          color: #374151;
          margin-top: 2px;
        }
        .programme-tag {
          font-size: 8.5pt;
          font-weight: 600;
          color: #4b5563;
          margin-top: 1px;
        }

        /* Banner */
        .title-banner {
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          border-left: 6px solid #1e3a8a;
          padding: 8px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-radius: 4px;
        }
        .title-main {
          font-size: 12pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .title-sub {
          font-size: 8pt;
          color: #64748b;
          font-weight: 600;
        }
        .week-pill {
          background: #1e3a8a;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 9.5pt;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        /* Info Grid */
        .info-grid {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          font-size: 9pt;
        }
        .info-grid td {
          padding: 3px 6px;
          vertical-align: top;
        }
        .info-label {
          width: 130px;
          font-weight: 700;
          color: #334155;
        }
        .info-sep {
          width: 10px;
          text-align: center;
          color: #64748b;
        }
        .info-val {
          color: #0f172a;
          font-weight: 600;
        }

        /* Status Box */
        .status-box {
          border-radius: 6px;
          padding: 6px 12px;
          text-align: center;
          display: inline-block;
          font-size: 9pt;
        }
        .status-verified {
          background: #ecfdf5;
          border: 1.5px solid #10b981;
          color: #065f46;
        }
        .status-submitted {
          background: #eff6ff;
          border: 1.5px solid #3b82f6;
          color: #1e40af;
        }
        .status-revision {
          background: #fff7ed;
          border: 1.5px solid #f97316;
          color: #9a3412;
        }
        .status-draft {
          background: #f1f5f9;
          border: 1.5px solid #94a3b8;
          color: #475569;
        }
        .status-icon {
          display: inline-block;
          margin-right: 4px;
          font-weight: bold;
        }

        /* Table */
        .log-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 14px;
          font-size: 8.5pt;
        }
        .log-table th {
          background: #1e3a8a;
          color: #ffffff;
          padding: 7px 6px;
          font-weight: 700;
          text-align: left;
          border: 1px solid #1e3a8a;
          font-size: 8pt;
          text-transform: uppercase;
        }
        .log-table td {
          border: 1px solid #cbd5e1;
          padding: 6px;
          vertical-align: top;
          line-height: 1.35;
        }
        .log-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .day-cell {
          font-weight: 700;
          color: #1e3a8a;
          white-space: nowrap;
          width: 90px;
        }
        .time-cell {
          width: 80px;
          font-size: 8pt;
          color: #475569;
          white-space: nowrap;
        }
        .dept-cell {
          width: 110px;
          font-weight: 600;
          color: #1e293b;
        }
        .task-cell {
          color: #0f172a;
        }
        .outcome-cell {
          width: 180px;
          color: #334155;
          font-style: italic;
        }

        /* Summary / Reflection */
        .section-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 14px;
          background: #ffffff;
        }
        .section-title {
          font-size: 9pt;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .section-content {
          font-size: 8.8pt;
          color: #334155;
          white-space: pre-wrap;
          line-height: 1.4;
        }

        /* Coach Verification Area */
        .coach-panel {
          border: 1.5px solid #1e3a8a;
          border-radius: 6px;
          padding: 12px;
          background: #fafbfc;
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .coach-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 8px;
        }
        .sig-box {
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          margin-top: 6px;
          color: #64748b;
          font-size: 8pt;
          text-align: center;
          padding: 6px;
        }
        .digital-stamp {
          border: 2px solid #059669;
          border-radius: 6px;
          padding: 8px;
          background: #ecfdf5;
          color: #065f46;
          text-align: center;
        }

        /* Footer Note */
        .doc-footer {
          margin-top: 20px;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          font-size: 7.5pt;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      </style>
    </head>
    <body>
      <div class="print-toolbar no-print">
        <span>DAILY TRAINING LOG - MINGGU ${logbook.weekNumber}</span>
        <button class="print-btn" onclick="window.print()">🖨️ ${language === 'ms' ? 'Cetak / Muat Turun PDF' : 'Print / Save PDF'}</button>
      </div>

      <div class="container">
        <!-- HEADER -->
        <table class="header-table">
          <tr>
            <td class="logo-cell">
              <img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" class="logo" alt="UTeM Logo">
            </td>
            <td class="uni-titles">
              <div class="uni-name">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</div>
              <div class="faculty-name">FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)</div>
              <div class="programme-tag">PROGRAM WORK-BASED LEARNING (WBL)</div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              ${statusBadge()}
            </td>
          </tr>
        </table>

        <!-- TITLE BANNER -->
        <div class="title-banner">
          <div>
            <div class="title-main">DAILY TRAINING LOG / LOG LATIHAN HARIAN</div>
            <div class="title-sub">${language === 'ms' ? 'Rekod Mingguan Aktiviti Penempatan Industri WBL Pelajar' : 'Weekly Record of Student WBL Industry Placement Activities'}</div>
          </div>
          <div class="week-pill">
            ${language === 'ms' ? 'MINGGU' : 'WEEK'} ${logbook.weekNumber}
          </div>
        </div>

        <!-- STUDENT & PLACEMENT INFO -->
        <table class="info-grid">
          <tr>
            <td class="info-label">${language === 'ms' ? 'Nama Pelajar' : 'Student Name'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.studentName || student?.name || '-'}</td>

            <td class="info-label">${language === 'ms' ? 'Organisasi / Syarikat' : 'Company / Organization'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.companyName || '-'}</td>
          </tr>
          <tr>
            <td class="info-label">${language === 'ms' ? 'No. Matrik' : 'Matric No'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.studentMatric || student?.matric_no || '-'}</td>

            <td class="info-label">${language === 'ms' ? 'Jurulatih Industri' : 'Industry Coach / Trainer'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.trainerName || student?.industry_trainer_name || (language === 'ms' ? 'Belum Ditetapkan' : 'Not Assigned')}</td>
          </tr>
          <tr>
            <td class="info-label">${language === 'ms' ? 'Program' : 'Programme'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.studentProgram || student?.program || 'BACHELOR OF TECHNOPRENEURSHIP WITH HONOURS'}</td>

            <td class="info-label">${language === 'ms' ? 'Tempoh Latihan' : 'Training Period'}</td>
            <td class="info-sep">:</td>
            <td class="info-val">${logbook.startDate || '-'} &nbsp;${language === 'ms' ? 'hingga' : 'to'}&nbsp; ${logbook.endDate || '-'}</td>
          </tr>
        </table>

        <!-- DAILY ACTIVITY TABLE -->
        <table class="log-table">
          <thead>
            <tr>
              <th style="width: 100px;">${language === 'ms' ? 'Hari & Tarikh' : 'Day & Date'}</th>
              <th style="width: 80px;">${language === 'ms' ? 'Masa' : 'Hours'}</th>
              <th style="width: 120px;">${language === 'ms' ? 'Bahagian / Jabatan' : 'Department / Unit'}</th>
              <th>${language === 'ms' ? 'Aktiviti & Tugasan Yang Dijalankan' : 'Daily Activities & Tasks Performed'}</th>
              <th style="width: 190px;">${language === 'ms' ? 'Hasil Pembelajaran & Kemahiran' : 'Learning Outcomes & Competencies'}</th>
            </tr>
          </thead>
          <tbody>
            ${(logbook.entries && logbook.entries.length > 0) ? logbook.entries.map((entry) => `
              <tr>
                <td class="day-cell">
                  <strong>${entry.day}</strong><br>
                  <span style="font-size: 7.5pt; color: #64748b; font-weight: normal;">${entry.date || '-'}</span>
                </td>
                <td class="time-cell">
                  ${entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : (entry.startTime || '-')}
                </td>
                <td class="dept-cell">
                  ${entry.department || '-'}
                </td>
                <td class="task-cell">
                  <div>${(entry.tasks || '-').replace(/\n/g, '<br>')}</div>
                  ${entry.toolsUsed ? `
                    <div style="margin-top: 4px; font-size: 7.5pt; color: #4b5563;">
                      <strong>${language === 'ms' ? 'Alatan/Sistem:' : 'Tools/System:'}</strong> ${entry.toolsUsed}
                    </div>
                  ` : ''}
                  ${entry.remarks ? `
                    <div style="margin-top: 2px; font-size: 7.5pt; color: #6b7280; font-style: italic;">
                      <strong>${language === 'ms' ? 'Catatan:' : 'Notes:'}</strong> ${entry.remarks}
                    </div>
                  ` : ''}
                </td>
                <td class="outcome-cell">
                  ${(entry.learningOutcomes || '-').replace(/\n/g, '<br>')}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">
                  ${language === 'ms' ? 'Tiada entri aktiviti harian direkodkan untuk minggu ini.' : 'No daily activity entries recorded for this week.'}
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- WEEKLY SUMMARY / REFLECTION -->
        <div class="section-box">
          <div class="section-title">
            ${language === 'ms' ? '1. Refleksi & Ringkasan Pembelajaran Mingguan Pelajar' : '1. Student Weekly Reflection & Learning Summary'}
          </div>
          <div class="section-content">
            ${logbook.weeklySummary ? logbook.weeklySummary : (language === 'ms' ? 'Tiada refleksi mingguan dimasukkan.' : 'No weekly reflection entered.')}
          </div>
        </div>

        <!-- INDUSTRY COACH VERIFICATION & ASSESSMENT -->
        <div class="coach-panel">
          <div class="section-title" style="border-bottom: 1.5px solid #1e3a8a; margin-bottom: 8px;">
            ${language === 'ms' ? '2. Pengesahan & Penilaian Jurulatih Industri (Industry Coach Endorsement)' : '2. Industry Coach Verification & Assessment'}
          </div>

          <div class="coach-grid">
            <div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #1e3a8a; font-size: 8.5pt;">${language === 'ms' ? 'Ulasan & Komen Jurulatih Industri:' : 'Coach Feedback & Comments:'}</strong>
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; min-height: 55px; margin-top: 4px; font-size: 8.5pt; color: #334155;">
                  ${logbook.trainerComments || (logbook.status === 'verified' ? 'Aktiviti disemak dan disahkan memuaskan.' : (language === 'ms' ? 'Belum diisi oleh Jurulatih Industri' : 'Not filled yet by Industry Coach'))}
                </div>
              </div>

              ${logbook.trainerRating ? `
                <div style="margin-top: 6px; font-size: 8.5pt;">
                  <strong style="color: #1e3a8a;">${language === 'ms' ? 'Penilaian Prestasi Mingguan:' : 'Weekly Performance Rating:'}</strong>
                  <span style="display: inline-block; margin-left: 6px; font-weight: bold; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px;">
                    ${ratingLabel[logbook.trainerRating] || logbook.trainerRating}
                  </span>
                </div>
              ` : ''}

              <div style="margin-top: 10px; font-size: 8.5pt; line-height: 1.4;">
                <div><strong>${language === 'ms' ? 'Nama Jurulatih:' : 'Coach Name:'}</strong> ${logbook.trainerName || (language === 'ms' ? 'Sila tandatangan & cop' : 'Please sign & stamp')}</div>
                <div><strong>${language === 'ms' ? 'Jawatan:' : 'Designation:'}</strong> ${logbook.trainerPosition || '-'}</div>
                <div><strong>${language === 'ms' ? 'Syarikat:' : 'Company:'}</strong> ${logbook.trainerCompany || logbook.companyName || '-'}</div>
              </div>
            </div>

            <div>
              <strong style="color: #1e3a8a; font-size: 8.5pt;">${language === 'ms' ? 'Pengesahan Digital / Tandatangan & Cop Syarikat:' : 'Digital Endorsement / Stamp & Signature:'}</strong>
              
              ${logbook.status === 'verified' ? `
                <div class="digital-stamp" style="margin-top: 6px;">
                  <div style="font-size: 9pt; font-weight: 800; color: #047857; letter-spacing: 0.5px;">
                    ✓ DISAHKAN SECARA DIGITAL
                  </div>
                  <div style="font-size: 8pt; font-weight: 700; color: #065f46; margin-top: 2px;">
                    ${logbook.trainerName || 'JURULATIH INDUSTRI'}
                  </div>
                  <div style="font-size: 7.5pt; color: #047857;">
                    ${logbook.trainerPosition || 'Jurulatih / Penyelia Industri'} • ${logbook.trainerCompany || logbook.companyName}
                  </div>
                  <div style="font-size: 7pt; color: #059669; margin-top: 4px; border-top: 1px dashed #10b981; padding-top: 3px;">
                    Tarikh: ${logbook.verifiedAt ? new Date(logbook.verifiedAt).toLocaleString('ms-MY') : '-'}
                  </div>
                </div>
              ` : `
                <div class="sig-box">
                  <div style="font-size: 7.5pt; color: #94a3b8;">
                    ${language === 'ms' ? 'Ruang Tandatangan Jurulatih & Cop Rasmi Syarikat' : 'Industry Coach Signature & Company Official Stamp'}
                  </div>
                  <div style="margin-top: 18px; border-bottom: 1px dotted #94a3b8; width: 80%;"></div>
                  <div style="font-size: 7pt; color: #64748b; margin-top: 3px;">
                    ${language === 'ms' ? 'Tarikh:' : 'Date:'} ........................................
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="doc-footer">
          <div>
            ${language === 'ms' 
              ? 'Nota: Buku log harian perlu diisi setiap hari bekerja dan disahkan setiap minggu oleh Jurulatih Industri.' 
              : 'Note: Daily log must be recorded on each working day and endorsed weekly by the Industry Coach.'}
          </div>
          <div>
            PWBLF UTeM © ${new Date().getFullYear()} • Sistem WBL FPTT
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
