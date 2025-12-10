
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

  // Hardcoded Program Name as requested
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
        .ref-col { width: 60%; } /* Increased width to ensure single line ref */
        
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; }
        
        p { margin-bottom: 10px; text-align: justify; }
        
        .student-table { width: 100%; margin: 15px 0; border-collapse: collapse; }
        .student-table td { vertical-align: top; padding: 2px; }
        .label-col { width: 150px; font-weight: bold; }
        .sep-col { width: 20px; text-align: center; }
        
        .coordinator-table { width: 100%; margin-left: 20px; font-size: 10pt; }
        .coordinator-table td { padding: 1px; }

        .footer { margin-top: 30px; font-size: 10pt; }
        .computer-gen { font-style: italic; font-size: 9pt; margin-top: 15px; }

        .page-break { page-break-before: always; }

        .reply-header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .reply-ref { text-align: right; margin-bottom: 15px; }
        .input-line { border-bottom: 1px solid black; display: inline-block; width: 100%; min-height: 18px; }
        
        .reply-table { width: 100%; margin-top: 15px; border-collapse: collapse; }
        .reply-table td { padding: 5px; vertical-align: bottom; }
        
        .acceptance-box { border: 1px dashed #000; padding: 10px; margin-top: 20px; font-size: 10pt; }

        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; border-radius: 5px; z-index: 1000; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
      
      <!-- PAGE 1: FACULTY LETTER -->
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
        <div class="ref-col">
            Ruj. Kami (Our Ref) : ${refNumber}<br>
            Ruj. Tuan (You Ref) :
        </div>
        <div class="ref-col" style="text-align: right;">
            ${formattedDate}
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        TO WHOM IT MAY CONCERN<br><br>
        Dear Sir / Madam
      </div>

      <div style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 15px;">
        Universiti Teknikal Malaysia Melaka (UTeM)<br>
        Student Work Based Learning Programme<br>
        Learning Session : 5/10/2026 to 1/10/2027
      </div>

      <p>
        Universiti Teknikal Malaysia Melaka (UTeM) is a public university (UA) under the Ministry of Education Malaysia, established on 1st December 2000. UTeM currently offers undergraduate and postgraduate programmes in various fields e.g. Electronic and Computer Engineering, Electrical Engineering, Mechanical Engineering, Manufacturing Engineering, Engineering Technology, Information & Communication Technology (ICT) and Technology Management & Technopreneurship. The WBL programme for a period of approximately 56 weeks is compulsory for the Degree Programmes in UTeM.
      </p>

      <p>
        2. With reference to the above, we wish to acknowledge that the bearer of this letter is the student of University Teknikal Malaysia Melaka (UTeM). We will be very grateful if you can consider the application of WBL programme placement in your company for the duration specified above.
      </p>

      <table class="student-table">
        <tr>
            <td class="label-col">Student Name</td><td class="sep-col">:</td>
            <td>${student.name.toUpperCase()}</td>
        </tr>
        <tr>
            <td class="label-col">Identity Card No.</td><td class="sep-col">:</td>
            <td>${student.ic_no || '-'}</td>
        </tr>
        <tr>
            <td class="label-col">Matric No.</td><td class="sep-col">:</td>
            <td>${student.matric_no}</td>
        </tr>
        <tr>
            <td class="label-col">Programme</td><td class="sep-col">:</td>
            <td>${programName}</td>
        </tr>
      </table>

      <p>
        3. Should the company agree to accept or not this student, please complete the attached "Reply Form" to be submitted to the university one month before.
      </p>

      <p>
        4. Should there be any queries with regards to the above, please do not hesitate to contact Faculty Industrial Training Coordinators as below :
      </p>

      <table class="coordinator-table">
        <tr><td style="width: 80px;">Name</td><td>: DR. MOHD GUZAIRY BIN ABD GHANI</td></tr>
        <tr><td>Tel No.</td><td>: 06-2708134</td></tr>
        <tr><td>Fax No.</td><td>: 06-2701043</td></tr>
        <tr><td>Email</td><td>: guzairy@utem.edu.my</td></tr>
        <tr><td>Url</td><td>: http://fptt.utem.edu.my/</td></tr>
      </table>

      <p style="margin-top: 15px;">
        5. Thank you in advance for your kind consideration and participation in UTeM student WBL Programme.
      </p>

      <div class="footer">
        Your Sincerely,<br><br><br>
        <strong>PROF. DR. MOHD. SYAIFUL RIZAL BIN ABDUL HAMID</strong><br>
        Dean<br>
        FACULTY OF TECHNOLOGY MANAGEMENT AND TECHNOPRENEURSHIP<br>
        On behalf of Vice Chancellor<br>
        Universiti Teknikal Malaysia Melaka (UTeM)
        
        <div class="computer-gen">This letter is computer generated, no signature is required</div>
      </div>

      <!-- PAGE 2: REPLY FORM -->
      <div class="page-break"></div>

      <div class="reply-header">
        REPLY FORM<br>
        (To Be returned to UTeM)
      </div>

      <div class="ref-section">
        <div class="ref-col">
            Our Ref : 
        </div>
        <div class="ref-col" style="text-align: right;">
            Date: ${formattedDate}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <strong>${company?.company_name || 'COMPANY NAME'}</strong><br>
        ${company?.company_address ? company.company_address.replace(/\n/g, '<br>') : 'Company Address'}<br>
        Tel No.: ${company?.company_contact_phone || '-'}<br>
        Fax No.: -
      </div>

      <div>
        To,<br>
        FACULTY OF TECHNOLOGY MANAGEMENT AND TECHNOPRENEURSHIP<br><br>
        Dear Sir / Madam,<br><br>
        <strong>UTeM STUDENT WORK BASED LEARNING PROGRAMME<br>
        LEARNING SESSION : 5/10/2026 - 1/10/2027</strong>
      </div>

      <p>
        With reference to the above we <strong>agree / disagree</strong> to accept the student as mentioned below to undergo WBL programme at our company for the period specified above :
      </p>

       <table class="student-table" style="font-size: 10pt;">
        <tr>
            <td class="label-col">Student's Name</td><td class="sep-col">:</td>
            <td>${student.name.toUpperCase()}</td>
        </tr>
        <tr>
            <td class="label-col">Identity Card No.</td><td class="sep-col">:</td>
            <td>${student.ic_no || '-'}</td>
        </tr>
        <tr>
            <td class="label-col">Matric No.</td><td class="sep-col">:</td>
            <td>${student.matric_no}</td>
        </tr>
        <tr>
            <td class="label-col">Programme</td><td class="sep-col">:</td>
            <td>${programName}</td>
        </tr>
      </table>

      <p>2. This student will be located at :</p>

      <table style="width: 100%; margin-bottom: 10px;">
        <tr>
            <td style="width: 120px; font-weight: bold;">Department</td>
            <td style="width: 10px;">:</td>
            <td><div class="input-line"></div></td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Address</td>
            <td>:</td>
            <td><div class="input-line"></div><div class="input-line" style="margin-top:5px;"></div></td>
        </tr>
      </table>

      <p style="font-size: 10pt; font-weight: bold; font-style: italic;">
        (Please take note : Virtual office is not allowed and working from home can only be done during the Covid 19 Pandemic only)
      </p>

      <table style="width: 100%;">
        <tr>
            <td style="width: 120px; font-weight: bold;">Scope of Training<br>(Compulsory)</td>
            <td style="width: 10px; vertical-align: top;">:<br>&nbsp;</td>
            <td><div class="input-line"></div><div class="input-line" style="margin-top:5px;"></div></td>
        </tr>
      </table>

      <p>3. Thank you.</p>

      <p>Yours Sincerely,</p>

      <table class="reply-table">
        <tr>
            <td style="width: 50%;">
                <div style="border-bottom: 1px solid black; width: 80%; height: 30px;"></div>
                (Signature)
            </td>
            <td style="width: 50%; vertical-align: bottom;">
                Company's Stamp :
            </td>
        </tr>
        <tr>
            <td>
                Office's Name : <span style="text-decoration: underline;">${company?.company_contact_person || ''}</span><br>
                Position : ____________________<br>
                Email : <span style="text-decoration: underline;">${company?.company_contact_email || ''}</span>
            </td>
            <td>
                 <div style="border: 1px solid #ccc; height: 50px; width: 100%;"></div>
            </td>
        </tr>
      </table>

      <div class="acceptance-box">
        <div style="text-align: center; font-weight: bold; font-style: italic; margin-bottom: 5px;">
            Acceptance of WBL Placement (upon faculty's approval)
        </div>
        <p style="text-align: justify; margin: 0;">
            I <strong>${student.name.toUpperCase()}</strong> Identity Card No. <strong>${student.ic_no || '________________'}</strong> hereby <strong>agree / disagree</strong> to accept the placement offered. In the case that i have accepted the placement offered, i promise to abide by the rules / regulations of the company and UTeM.
        </p>

        <table style="width: 100%; margin-top: 20px;">
            <tr>
                <td style="text-align: center;">
                    .............................................<br>
                    (Student's Signature)
                </td>
                <td style="text-align: center;">
                    .............................................<br>
                    (Date)
                </td>
            </tr>
        </table>
      </div>

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
  const signatureBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAYAAAC+jCIaAAAACXBIWXMAAAsTAAALEwEAmpwYAAADmElEQVR4nO2bMW4TURBF3x8REiUKKKgCNyA6WqCgC1S0QAm5AglR0gFuwA1Q0AFR0gEFHRAVHRAVJUD8z4w1Xq/XeD22Z73J+0mn2X32vTszb+bN7HjXWmtFEXAFnAIHwB1wD5wAl8Ap8A64B94C74G3wFvgrf09B94A74D3wAf7+xT4CHwCPgOfgM/AZ+Ar8A34BnwDvgHfgO/AD+An8BP4CfwEfgE/gV/AT+A38Bv4A/wB/gB/gD/AH+Av8Bf4C/wF/gJ/gb/A38x+V/1/9f/V/1f/X/1/9f/V/1f/X/1/9f/V/1f/X/1/9f/V/1f/X/1/9f/V/1f/X/1/HwFf7M818CXwJfAl8CXwBfAZ8BnwGfAZ8CnwKfAJ8AnwEfAR8BHwIfAB8AHwAfAB8B7wHvAe8B7wDvAO8A7wDvAW8BbwFvAG8AbwBvAG8AbwGvAa8BrwGvAK8ArwCvAK8ALwAvAC8ALwvNnvqv+v/r/6/+v/q/+v/q/6/+v/q/+v/q/+v/q/+v/q/+v/q/+v/q/+v/r/6/+v/q/+v/r//Ad2BDkAHoKP5fxP4GWgJtAdaAu8DvwPvA78D7wMtgV7A781+E/gZaAm0B1oCLYDmQAugOdAC2ADsBfy/AfYDewG/t9l/N7AT2AFsB7YBW4EtwBbge+A74FvgG+Ar4EvgC+Az4FPgE+AT4CPgQ+AD4D3gHeAt4A3gDeAV4BXgBeB5s99V/1/9f/X/1/9f/X/1/9X/V/9f/X/1/9X/V/9f/X/1/9f/X/1/9f/X/1/9f/X/1f9X//f78A7YFeQG/+3wFhaQ60sPnfBH4GWgLtgeb/G/Ar8AvwC/Az8BPwE/AT8CPwI/A98B3wHfAd8B3wLfAt8C3wFfAV8CXwJfAl8AXwOfAZ8BnwKfAJ8AnwCfAJ8AnwEfAR8BHwIfAB8AHwAfAB8AHwHvAe8B7wHvAe8A7wDvAO8A7wFvAW8BbwBvAG8AbwBvAG8BrwGvAa8BrwCvAK8ArwCvAC8ALwAvAC8LzZ76r/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/q/6v/r/6/+v/+B3QHOgAdgI5W/xUwBNgP+AUIAf4Hg72d7K93u/kAAAAASUVORK5CYII=";
  
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
        <tr><td style="vertical-align: bottom;"><strong>PROF. DR. MOHD SYAIFUL RIZAL BIN HAMID</strong></td><td style="vertical-align: bottom;"><div style="height: 20px;"></div><div class="sig-line"></div></td></tr>
        <tr><td style="vertical-align: top;">Dean<br>Faculty of Technology Management and Technopreneurship</td><td style="vertical-align: top;"><div style="height: 40px;"></div></td></tr>
        <tr><td>Date: ${currentDate}</td><td>Date: <div style="display:inline-block; width: 150px; border-bottom: 1px solid black;"></div></td></tr>
      </table>
    </body>
    </html>
  `;
  letterWindow.document.write(htmlContent);
  letterWindow.document.close();
};

export const downloadLOIWord = (company: Company) => {
    // ... existing word download code ...
     const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Construct a Word-compatible HTML string
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Letter of Intent - ${company.company_name}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; }
        table { border-collapse: collapse; width: 100%; mso-element: table; }
        td { vertical-align: top; padding: 5px; }
        .header-table td { text-align: center; vertical-align: middle; }
        .title-section { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 15px; }
        .parties { text-transform: uppercase; margin: 5px 0; }
        .content { text-align: justify; font-size: 10pt; }
        .signature-table { margin-top: 30px; font-size: 10pt; width: 100%; border: 1px solid black; }
        .signature-table td { border: 1px solid black; padding: 5px 8px; width: 50%; vertical-align: top; }
        .sig-line { border-bottom: 1px solid black; margin-top: 5px; width: 100%; }
      </style>
    </head>
    <body>
      <table class="header-table" style="width: 100%; margin-bottom: 20px;">
        <tr>
            <td style="text-align: right; width: 50%; padding-right: 60px;">
                <img src="https://www.utem.edu.my/templates/yootheme/cache/5b/LogoUTeM-5b80a51b.png" width="150" height="80" alt="UTeM Logo">
            </td>
            <td style="text-align: left; width: 50%; padding-left: 30px;">
                <div style="width: 150px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999;">
                    [Company Logo]
                </div>
            </td>
        </tr>
      </table>
      <div class="title-section">
        <p>LETTER OF INTENT<br/>BETWEEN<br/>UNIVERSITI TEKNIKAL MALAYSIA MELAKA<br/>AND<br/>${company.company_name.toUpperCase()}</p>
      </div>
      <div class="content">
        <p><strong>UTeM</strong> and <strong>${company.company_name}</strong> having met and discussed collaborative efforts between Parties hereby record their intent towards the collaboration under the following conditions:</p>
        <p>i. The areas of cooperation intended to be entered:</p>
        <div style="margin-left: 30px;">
            <p>(a) Sharing of expertise between UTeM and ${company.company_name} related to Work-Based Learning (WBL) as agreed by both Parties;</p>
            <p>(b) Sharing of research resources, technical data, and facilities that are available in UTeM and ${company.company_name} subject to subsequent written consent by both Parties;</p>
            <p>(c) Conducting other activities considered to be of benefits for both Parties through human capital development activities as of training and research programs; and</p>
            <p>(d) Such other collaborative activities as may be mutually agreed between the Parties from time to time.</p>
        </div>
        <p>ii. Any cooperation between the Parties pursuant to this Letter of Intent that requires financial commitment, fulfilment of obligations and responsibilities of the Parties will be formalised and secured by a written agreement.</p>
        <p>iii. This Letter of Intent does not constitute or create, and shall not be deemed to constitute or create any legally binding or enforceable obligations on the part of either Party to the Letter of Intent except by the execution of a Memorandum of Agreement between UTeM and ${company.company_name} containing such terms and conditions of the proposed collaboration.</p>
        <p>This Letter of Intent is to be executed in the English language.</p>
      </div>
      <table class="signature-table">
        <tr><td>Signed for and on behalf of</td><td>Signed for and on behalf of</td></tr>
        <tr><td style="font-weight: bold; background-color: #f9f9f9;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</td><td style="font-weight: bold; background-color: #f9f9f9;">${company.company_name.toUpperCase()}</td></tr>
        <tr><td style="height: 70px; vertical-align: bottom;"><!-- Signature Space --></td><td style="height: 70px;"></td></tr>
        <tr><td style="vertical-align: bottom;"><strong>PROF. DR. MOHD SYAIFUL RIZAL BIN HAMID</strong></td><td style="vertical-align: bottom;"><br/><div class="sig-line"></div></td></tr>
        <tr><td style="vertical-align: top;">Dean<br>Faculty of Technology Management and Technopreneurship</td><td style="vertical-align: top;"><br/></td></tr>
        <tr><td>Date: ${currentDate}</td><td>Date: _______________</td></tr>
      </table>
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
