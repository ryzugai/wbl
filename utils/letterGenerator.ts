
import { Application, Company, User } from '../types';

export const generateLetter = (application: Application, company: Company | undefined, student: User, language: 'ms' | 'en') => {
  // Updated Ref format - Ensuring single line
  const refNumber = `UTeM.21.05/wbl.21.22/AL-01(1) (${student.matric_no})`;
  
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-GB', dateOptions);

  const letterWindow = window.open('', '_blank');
  if(!letterWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this site.");
      return;
  }

  const programName = "BACHELOR OF TECHNOPRENEURSHIP WITH HONOURS";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Surat Sokongan & Borang Jawapan - ${student.name}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.25; color: black; max-width: 800px; margin: 0 auto; }
        .header-table { width: 100%; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 15px; }
        .logo { height: 75px; }
        .uni-details { text-align: right; font-size: 9pt; line-height: 1.2; }
        .ref-section { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .ref-col { width: 60%; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; }
        p { margin-bottom: 10px; text-align: justify; }
        .student-table { width: 100%; margin: 15px 0; border-collapse: collapse; }
        .student-table td { vertical-align: top; padding: 2px; }
        .label-col { width: 150px; font-weight: bold; }
        .sep-col { width: 20px; text-align: center; }
        .coordinator-table { width: 100%; margin-left: 20px; font-size: 10pt; }
        .coordinator-table td { padding: 1px; }
        .footer { margin-top: 30px; font-size: 10pt; }
        .computer-gen { font-style: italic; font-size: 9pt; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 5px; }
        
        /* Reply Form Styles */
        .page-break { page-break-before: always; }
        .reply-header { text-align: center; font-weight: bold; margin-bottom: 20px; border: 1px solid black; padding: 10px; text-transform: uppercase; }
        .input-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; }
        .checkbox-container { display: flex; gap: 20px; margin: 15px 0; }
        .checkbox-item { display: flex; align-items: center; gap: 10px; }
        .box { width: 20px; height: 20px; border: 1px solid black; display: inline-block; }
        .underline { border-bottom: 1px solid black; display: inline-block; min-width: 250px; padding-bottom: 2px; }
        .full-underline { border-bottom: 1px solid black; display: block; width: 100%; height: 20px; margin-top: 10px; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
        .sig-col { width: 45%; }
        
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; border-radius: 5px; z-index: 1000; font-weight: bold; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
      
      <!-- PAGE 1: SUPPORT LETTER -->
      <table class="header-table">
        <tr>
            <td><img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" class="logo" alt="UTeM Logo"></td>
            <td class="uni-details">
                <strong>Universiti Teknikal Malaysia Melaka</strong><br>
                Hang Tuah Jaya,<br>
                76100 Durian Tunggal,<br>
                Melaka, Malaysia.<br><br>
                📞 +606 270 1000 &nbsp; 🌐 www.utem.edu.my
            </td>
        </tr>
      </table>
      <div style="text-align: center; font-weight: bold; margin-bottom: 15px;">
        FACULTY OF TECHNOLOGY MANAGEMENT AND TECHNOPRENEURSHIP
      </div>
      <div class="ref-section">
        <div class="ref-col">Ruj. Kami (Our Ref) : ${refNumber}<br>Ruj. Tuan (You Ref) :</div>
        <div class="ref-col" style="text-align: right;">${formattedDate}</div>
      </div>
      <div style="margin-bottom: 15px;">TO WHOM IT MAY CONCERN<br><br>Dear Sir / Madam</div>
      <div style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px;">Universiti Teknikal Malaysia Melaka (UTeM)<br>Student Work Based Learning Programme<br>Learning Session : 5/10/2026 to 1/10/2027</div>
      <p>Universiti Teknikal Malaysia Melaka (UTeM) is a public university (UA) under the Ministry of Education Malaysia, established on 1st December 2000...</p>
      <table class="student-table">
        <tr><td class="label-col">Student Name</td><td class="sep-col">:</td><td>${student.name.toUpperCase()}</td></tr>
        <tr><td class="label-col">Identity Card No.</td><td class="sep-col">:</td><td>${student.ic_no || '-'}</td></tr>
        <tr><td class="label-col">Matric No.</td><td class="sep-col">:</td><td>${student.matric_no}</td></tr>
        <tr><td class="label-col">Programme</td><td class="sep-col">:</td><td>${programName}</td></tr>
      </table>
      <p>3. Should the company agree to accept or not this student, please complete the attached "Reply Form" (on the next page) and return it to us via e-mail at guzairy@utem.edu.my at your earliest convenience.</p>
      <div class="footer">
        Your Sincerely,<br><br><br>
        <strong>PROF. DR. MOHD SYAIFUL RIZAL BIN ABDUL HAMID</strong><br>Dean<br>FACULTY OF TECHNOLOGY MANAGEMENT AND TECHNOPRENEURSHIP
        <div class="computer-gen">This letter is computer generated, no signature is required / Surat ini adalah cetakan komputer dan tidak memerlukan tandatangan.</div>
      </div>

      <!-- PAGE 2: REPLY FORM -->
      <div class="page-break"></div>
      <table class="header-table">
        <tr>
            <td><img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" class="logo" alt="UTeM Logo"></td>
            <td class="uni-details">
                <strong>Universiti Teknikal Malaysia Melaka</strong><br>
                FACULTY OF TECHNOLOGY MANAGEMENT AND TECHNOPRENEURSHIP<br>
                Hang Tuah Jaya, 76100 Durian Tunggal, Melaka.<br>
                Tel: +606 270 8002 | Email: guzairy@utem.edu.my
            </td>
        </tr>
      </table>

      <div class="reply-header">
        STUDENT WORK-BASED LEARNING (WBL) PROGRAMME<br>REPLY FORM (BORANG MAKLUM BALAS)
      </div>

      <p>Dean,<br>Faculty of Technology Management and Technopreneurship,<br>Universiti Teknikal Malaysia Melaka.</p>
      
      <p>Dear Sir/Madam,</p>
      <p>With reference to your letter Ref: <strong>${refNumber}</strong> regarding the WBL placement for the following student:</p>
      
      <div style="background: #f9fafb; padding: 10px; border: 1px solid #eee; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 10pt;">
            <tr><td width="150"><strong>Student Name:</strong></td><td>${student.name.toUpperCase()}</td></tr>
            <tr><td><strong>Matric No:</strong></td><td>${student.matric_no}</td></tr>
            <tr><td><strong>Programme:</strong></td><td>${programName}</td></tr>
        </table>
      </div>

      <p>We wish to inform you that our company:</p>
      <div class="checkbox-container">
          <div class="checkbox-item"><div class="box"></div> <strong>AGREE</strong> to accept this student</div>
          <div class="checkbox-item"><div class="box"></div> <strong>DO NOT AGREE</strong> to accept this student</div>
      </div>

      <p>If accepted, the student is required to report for duty on (Date): <span class="underline"></span></p>
      
      <p><strong>Industrial Supervisor Details:</strong></p>
      <div style="margin-left: 20px; font-size: 10pt;">
          <div style="margin-bottom: 8px;">Name: <span class="underline" style="min-width: 400px;"></span></div>
          <div style="margin-bottom: 8px;">Designation: <span class="underline" style="min-width: 370px;"></span></div>
          <div style="margin-bottom: 8px;">Department: <span class="underline" style="min-width: 380px;"></span></div>
          <div style="margin-bottom: 8px;">Tel/Fax No: <span class="underline" style="min-width: 388px;"></span></div>
          <div style="margin-bottom: 8px;">E-mail: <span class="underline" style="min-width: 403px;"></span></div>
      </div>

      <div class="signature-area">
          <div class="sig-col">
              <br><br><br>
              <div class="full-underline"></div>
              <p style="font-size: 9pt; text-align: center;">Authorized Signature & Company Stamp</p>
          </div>
          <div class="sig-col">
              <br><br><br>
              <div style="margin-bottom: 8px;">Name: <span class="underline" style="min-width: 200px;"></span></div>
              <div style="margin-bottom: 8px;">Date: <span class="underline" style="min-width: 205px;"></span></div>
          </div>
      </div>

      <div style="margin-top: 30px; padding: 10px; border: 1px dashed #666; font-size: 9pt; background-color: #fffbeb;">
          <strong>Instructions:</strong> Please scan and return this completed form to <strong>guzairy@utem.edu.my</strong> or pass it to the student. Thank you.
      </div>
      
    </body>
    </html>
  `;
  letterWindow.document.write(htmlContent);
  letterWindow.document.close();
};

/**
 * JANA SURAT PELAWAAN RAKAN KERJASAMA INDUSTRI (Optimasi 1 Muka Surat)
 */
export const generateInvitationLetter = (company: Company | undefined, bilangan: string | number = " ") => {
  const letterWindow = window.open('', '_blank');
  if(!letterWindow) {
      alert("Pop-up blocked. Sila benarkan pop-up.");
      return;
  }

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('ms-MY', dateOptions);
  
  const refKami = `UTeM.600-7/3/6 ( ${bilangan} )`;
  const logo25 = "https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <title>Surat Pelawaan Kerjasama Industri - ${company?.company_name || 'Industri'}</title>
      <style>
        @page { size: A4; margin: 10mm 15mm; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 10.5pt; 
          line-height: 1.35; 
          color: black; 
          max-width: 850px; 
          margin: 0 auto; 
        }
        
        .header-table { width: 100%; border-bottom: 2px solid #000; margin-bottom: 8px; border-collapse: collapse; }
        .header-table td { vertical-align: middle; padding: 2px; }
        .logo-25 { height: 75px; } /* Saiz logo dikecilkan */
        .uni-info { text-align: right; font-size: 8pt; line-height: 1.2; }
        
        .faculty-title { text-align: center; font-weight: bold; font-size: 11pt; margin-top: 5px; text-transform: uppercase; }
        .faculty-contact { text-align: center; font-size: 9pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        
        .ref-section { display: flex; flex-direction: column; align-items: flex-end; font-size: 9pt; margin-bottom: 15px; line-height: 1.2; }
        
        .recipient { margin-bottom: 15px; font-weight: bold; text-transform: uppercase; line-height: 1.2; font-size: 10pt; }
        .subject { font-weight: bold; text-decoration: underline; margin-bottom: 12px; text-transform: uppercase; text-align: justify; font-size: 10pt; }
        
        p { margin-bottom: 10px; text-align: justify; }
        
        .signature-section { margin-top: 15px; line-height: 1.2; }
        .computer-gen-disclaimer { margin-top: 15px; font-size: 8.5pt; font-style: italic; color: #444; border-top: 1px solid #eee; padding-top: 3px; }
        
        .footer-logos-row { border-top: 3px solid #0056b3; padding-top: 8px; margin-top: 25px; display: flex; justify-content: center; align-items: center; gap: 12px; }
        .footer-logos-row img { height: 30px; object-fit: contain; }
        .footer-tagline { text-align: center; font-size: 7.5pt; color: #666; font-weight: bold; margin-top: 3px; text-transform: uppercase; }
        
        .print-btn { position: fixed; top: 15px; right: 15px; padding: 8px 16px; background: #0056b3; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; z-index: 1000; font-size: 12px; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>

      <table class="header-table">
        <tr>
          <td width="30%"><img src="${logo25}" class="logo-25" alt="Logo 25 Tahun UTeM"></td>
          <td width="70%" class="uni-info">
            <strong>Universiti Teknikal Malaysia Melaka</strong><br>
            Hang Tuah Jaya, 76100 Durian Tunggal, Melaka, Malaysia.<br>
            📞 +606 270 1000 | 🌐 www.utem.edu.my
          </td>
        </tr>
      </table>

      <div class="faculty-title">FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN</div>
      <div class="faculty-contact">Tel : +606 270 8002 | Faks : +606 270 1043</div>

      <div class="ref-section">
        <div>Rujukan Kami (Our Ref): ${refKami}</div>
        <div>Rujukan Tuan (Your Ref): </div>
        <div>Tarikh (Date): ${formattedDate}</div>
      </div>

      <div class="recipient">
        ${company?.company_contact_person || 'PENGURUS SUMBER MANUSIA'}<br>
        ${company?.company_name || 'NAMA SYARIKAT'}<br>
        ${company?.company_address ? company.company_address.replace(/\n/g, '<br>') : 'ALAMAT SYARIKAT'}
      </div>

      <div style="margin-bottom: 10px;">Tuan/Puan,</div>

      <div class="subject">
        PELAWAAN SEBAGAI RAKAN KERJASAMA INDUSTRI BAGI PENEMPATAN PELAJAR WORK BASED LEARNING (WBL) 
        PROGRAM SARJANA MUDA TEKNOUSAHAWANAN, FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)
      </div>

      <p>Dengan hormatnya merujuk kepada perkara di atas.</p>

      <p>
        2. Adalah dimaklumkan bahawa Fakulti Pengurusan Teknologi dan Teknousahawanan (FPTT) akan menjalankan pengajian 
        Work Based Learning (WBL) di bawah program Sarjana Muda Teknousahawanan berbentuk penempatan pelajar latihan industri 
        selama tempoh satu tahun.
      </p>

      <p>
        3. Untuk makluman pihak Tuan/Puan, empat bulan pertama pihak FPTT akan menyesuaikan penyampaian empat kursus dan satu 
        projek tahun akhir dengan tugasan pelajar semasa di industri nanti. Kursus-kursus termasuklah Pengurusan Penjenamaan, 
        Pengurusan Operasi, Analitik Perniagaan dan Keusahawanan Digital. Penyesuaian adalah berbentuk pengagihan tugasan industri 
        berkaitan kursus dan penilaian berasakan rubrik. Manakala untuk lapan bulan berikutnya pelajar akan menjalani latihan industri sepenuhnya.
      </p>

      <p>
        4. Kami amat berbesar hati di atas kesudian pihak Tuan/Puan untuk menerima pelawaan ini. Sebarang persoalan pihak Tuan/Puan boleh 
        berhubung dengan Penyelaras Program <strong>Dr. Mohd Guzairy bin Abd Ghani di talian 017-6746705</strong> atau emel: <strong>guzairy@utem.edu.my</strong>.
      </p>

      <p>Segala kerjasama daripada pihak Tuan/Puan amatlah kami hargai dan kami dahului dengan ucapan terima kasih.</p>

      <p>Sekian. Wasssalam.</p>

      <div style="font-weight: bold; margin-bottom: 12px; font-size: 9.5pt;">
        <p style="margin: 0;">“MALAYSIA MADANI”</p>
        <p style="margin: 0;">“BERKHIDMAT UNTUK NEGARA”</p>
        <p style="margin: 0;">“KOMPETENSI TERAS KEGEMILANGAN”</p>
      </div>

      <div class="signature-section">
        Saya yang menjalankan amanah,<br><br>
        <div style="height: 35px; font-style: italic; color: #ccc;">[Tandatangan]</div>
        <strong>PROF. DR. MOHD SYAIFUL RIZAL BIN ABDUL HAMID</strong><br>
        Dekan<br>
        Fakulti Pengurusan Teknologi dan Teknousahawanan
      </div>

      <div class="computer-gen-disclaimer">
        Surat ini adalah cetakan komputer dan tidak memerlukan tandatangan.
      </div>

      <div class="footer-logos-row">
        <img src="https://www.utem.edu.my/images/footer-logo-2024.png" alt="Certs & Rankings" onerror="this.style.display='none'">
        <img src="${logo25}" alt="UTeM 25" style="height: 20px; opacity: 0.2;">
      </div>
      <div class="footer-tagline">SEBUAH UNIVERSITI TEKNIKAL AWAM</div>
    </body>
    </html>
  `;
  letterWindow.document.write(htmlContent);
  letterWindow.document.close();
};

export const generateLOI = (company: Company) => {
  const letterWindow = window.open('', '_blank');
  if(!letterWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this site.");
      return;
  }
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const signatureBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAYAAAC+jCIaAAAACXBIWXMAAAsTAAALEwEAmpwYAAADmElEQVR4nO2bMW4TURBF3x8REiUKKKgCNyA6WqCgC1S0QAm5AglR0gFuwA1Q0AFR0gEFHRAVHRAVJUD8z4w1Xq/XeD22Z73J+0mn2X32vTszb+bN7HjXWmtFEXAFnAIHwB1wD5wAl8Ap8A64B94C74G3wFvgrf09B94A74D3wAf7+xT4CHwCPgOfgM/AZ+Ar8A34BnwDvgHfgO/AD+An8BP4CfwEfgE/gV/AT+A38Bv4A/wB/gB/gD/AH+Av8Bf4C/wF/gJ/gb/A38x+V/1/9f/V/1f/X/1/9f/V/1f/X/1/9f/V/1f/X/1/9f/V/1f/X/1/HwFf7M818CXwJfAl8CXwBfAZ8BnwGfAZ8CnwKfAJ8AnwEfAR8BHwIfAB8AHwAfAB8B7wHvAe8B7wDvAO8A7wDvAW8BbwFvAG8AbwBvAG8AbwGvAa8BrwGvAK8ArwCvAK8ALwAvAC8ALwvNnvqv+v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/+v/r//Ad2BDkAHoKP5fxP4GWgJtAdaAu8DvwPvA78D7wMtgV7A781+E/gZaAm0B1oCLYDmQAugOdAC2ADsBfy/AfYDewG/t9l/N7AT2AFsB7YBW4EtwBbge+A74FvgG+Ar4EvgC+Az4FPgE+AT4CPgQ+AD4D3gHeAt4A3gDeAV4BXgBeB5s99V/1/9f/X/1/9f/X/1/9X/V/9f/X/1/9f/V/1f/X/1/9f/X/1/9f/X/1/9f/X/1/9f/X/1/9f/X/1f9X//f78A7YFeQG/+3wFhaQ60sPnfBH4GWgLtgeb/G/Ar8AvwC/Az8BPwE/AT8CPwI/A98B3wHfAd8B3wLfAt8C3wFfAV8CXwJfAl8AXwOfAZ8BnwKfAJ8AnwCfAJ8AnwEfAR8BHwIfAB8AHwAfAB8AHwHvAe8B7wHvAe8A7wDvAO8A7wFvAW8BbwBvAG8AbwBvAG8BrwGvAa8BrwCvAK8ArwCvAC8ALwAvAC8LzZ76r/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/+B3QHOgAdgI5W/xUwBNgP+AUIAf4Hg72d7K93u/kAAAAASUVORK5CYII=";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Letter of Intent - ${company.company_name}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; padding: 20px 40px; max-width: 800px; margin: 0 auto; line-height: 1.3; color: black; font-size: 10pt; }
        .header-table { width: 90%; margin: 0 auto 20px auto; border-collapse: collapse; }
        .header-table td { vertical-align: middle; border: none; width: 50%; }
        .logo-cell { text-align: right; padding-right: 80px; }
        .placeholder-cell { text-align: left; padding-left: 30px; }
        .logo { height: 80px; }
        .company-logo-placeholder { width: 150px; height: 80px; border: 1px dashed #e0e0e0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 8pt; background-color: #fafafa; text-align: center; }
        .title-section { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 15px; }
        .parties { text-transform: uppercase; margin: 5px 0; }
        .content { text-align: justify; margin: 15px 0; font-size: 10pt; }
        .list-item { display: flex; margin-bottom: 8px; }
        .list-bullet { width: 30px; flex-shrink: 0; }
        .sub-list { margin-left: 20px; margin-top: 5px; }
        table.signature-table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 10pt; page-break-inside: avoid; }
        table.signature-table td { border: 1px solid black; padding: 5px 8px; vertical-align: top; width: 50%; }
        .sig-space { height: 70px; }
        .sig-line { border-bottom: 1px solid black; margin-top: 5px; width: 100%; }
        .computer-gen { margin-top: 20px; font-size: 8pt; font-style: italic; color: #666; }
      </style>
    </head>
    <body>
       <table class="header-table">
        <tr>
            <td class="logo-cell">
                <img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" class="logo" alt="UTeM Logo">
            </td>
            <td class="placeholder-cell">
                <div class="company-logo-placeholder">[Ruang Logo Syarikat]</div>
            </td>
        </tr>
      </table>
      <div class="title-section">
        <div>LETTER OF INTENT</div>
        <div class="parties" style="margin-top: 10px;">BETWEEN</div>
        <div class="parties">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</div>
        <div class="parties">AND</div>
        <div class="parties" style="color: black;">${company.company_name.toUpperCase()}</div>
      </div>
      <div class="content">
        <p style="margin-bottom: 15px;">
          <strong>UTeM</strong> and <strong>${company.company_name}</strong> having met and discussed collaborative efforts between Parties hereby record their intent towards the collaboration under the following conditions:
        </p>
        <div class="list-item"><div class="list-bullet">i.</div><div>The areas of cooperation intended to be entered:<div class="sub-list"><div class="list-item"><div class="list-bullet">(a)</div><div>Sharing of expertise between UTeM and ${company.company_name} related to Work-Based Learning (WBL) as agreed by both Parties;</div></div><div class="list-item"><div class="list-bullet">(b)</div><div>Sharing of research resources, technical data, and facilities that are available in UTeM and ${company.company_name} subject to subsequent written consent by both Parties;</div></div><div class="list-item"><div class="list-bullet">(c)</div><div>Conducting other activities considered to be of benefits for both Parties through human capital development activities as of training and research programs; and</div></div><div class="list-item"><div class="list-bullet">(d)</div><div>Such other collaborative activities as may be mutually agreed between the Parties from time to time.</div></div></div></div></div>
        <div class="list-item"><div class="list-bullet">ii.</div><div>Any cooperation between the Parties pursuant to this Letter of Intent that requires financial commitment, fulfilment of obligations and responsibilities of the Parties will be formalised and secured by a written agreement.</div></div>
        <div class="list-item"><div class="list-bullet">iii.</div><div>This Letter of Intent does not constitute or create, and shall not be deemed to constitute or create any legally binding or enforceable obligations on the part of either Party to the Letter of Intent except by the execution of a Memorandum of Agreement between UTeM and ${company.company_name} containing such terms and conditions of the proposed collaboration.</div></div>
        <p style="margin-top: 15px;">This Letter of Intent is to be executed in the English language.</p>
      </div>
      <table class="signature-table">
        <tr><td>Signed for and on behalf of</td><td>Signed for and on behalf of</td></tr>
        <tr><td style="font-weight: bold; background-color: #f9f9f9;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</td><td style="font-weight: bold; background-color: #f9f9f9;">${company.company_name.toUpperCase()}</td></tr>
        <tr><td class="sig-space" style="vertical-align: bottom; position: relative;"><img src="${signatureBase64}" alt="Signature" style="height: 70px; display: block; margin-bottom: 5px; margin-left: 5px;"></td><td class="sig-space"></td></tr>
        <tr><td style="vertical-align: bottom;"><strong>PROF. DR. MOHD SYAIFUL RIZAL BIN ABDUL HAMID</strong></td><td style="vertical-align: bottom;"><div style="height: 20px;"></div><div class="sig-line"></div></td></tr>
        <tr><td style="vertical-align: top;">Dean<br>Faculty of Technology Management and Technopreneurship</td><td style="vertical-align: top;"><div style="height: 40px;"></div></td></tr>
        <tr><td>Date: ${currentDate}</td><td>Date: <div style="display:inline-block; width: 150px; border-bottom: 1px solid black;"></div></td></tr>
      </table>
      <div class="computer-gen">This letter is computer generated and does not require a signature / Surat ini adalah cetakan komputer dan tidak memerlukan tandatangan.</div>
    </body>
    </html>
  `;
  letterWindow.document.write(htmlContent);
  letterWindow.document.close();
};

export const downloadLOIWord = (company: Company) => {
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Letter of Intent - ${company.company_name}</title>
      <style>
        @page {
          mso-page-orientation: portrait;
          size: 21cm 29.7cm;
          margin: 1.27cm 1.27cm 1.27cm 1.27cm;
          mso-header-margin: 0.5cm;
          mso-footer-margin: 0.5cm;
        }
        body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.15; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; mso-table-lspace:0pt; mso-table-rspace:0pt; }
        td { vertical-align: top; padding: 3px; }
        .header-table td { text-align: center; vertical-align: middle; }
        .title-section { text-align: center; font-weight: bold; font-size: 11pt; margin-top: 5pt; margin-bottom: 10pt; }
        .parties { text-transform: uppercase; margin: 2pt 0; }
        .content { text-align: justify; font-size: 9pt; mso-line-height-rule:exactly; line-height: 12pt; }
        .signature-table { margin-top: 15pt; font-size: 9pt; width: 100%; border: 1px solid black; }
        .signature-table td { border: 1px solid black; padding: 4pt 6pt; width: 50%; vertical-align: top; }
        .sig-line { border-bottom: 1px solid black; margin-top: 2pt; width: 100%; }
        p { margin-top: 0pt; margin-bottom: 6pt; }
      </style>
    </head>
    <body>
      <table class="header-table" style="width: 100%; margin-bottom: 10pt;">
        <tr>
            <td style="text-align: right; width: 50%; padding-right: 40pt;">
                <img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" width="120" height="65" alt="UTeM Logo">
            </td>
            <td style="text-align: left; width: 50%; padding-left: 20pt;">
                <div style="width: 120pt; height: 60pt; border: 1px dashed #ccc; text-align: center; font-size: 7pt; color: #999;">
                    <br/><br/>[Logo Syarikat]
                </div>
            </td>
        </tr>
      </table>
      <div class="title-section">
        <p class="parties">LETTER OF INTENT</p>
        <p class="parties">BETWEEN</p>
        <p class="parties">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</p>
        <p class="parties">AND</p>
        <p class="parties">${company.company_name.toUpperCase()}</p>
      </div>
      <div class="content">
        <p><strong>UTeM</strong> and <strong>${company.company_name}</strong> having met and discussed collaborative efforts between Parties hereby record their intent towards the collaboration under the following conditions...</p>
      </div>
      <table class="signature-table">
        <tr>
            <td style="border-bottom: 0px;">Signed for and on behalf of</td>
            <td style="border-bottom: 0px;">Signed for and on behalf of</td>
        </tr>
        <tr>
            <td style="font-weight: bold; background-color: #f3f3f3;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</td>
            <td style="font-weight: bold; background-color: #f3f3f3;">${company.company_name.toUpperCase()}</td>
        </tr>
        <tr><td>Date: ${currentDate}</td><td>Date: _______________</td></tr>
      </table>
      <p style="margin-top: 10pt; font-size: 8pt; font-style: italic;">Surat ini adalah cetakan komputer dan tidak memerlukan tandatangan.</p>
    </body>
    </html>
  `;
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LOI_${company.company_name.replace(/[^a-z0-9]/gi, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
