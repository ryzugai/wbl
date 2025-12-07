
import { Application, Company } from '../types';

export const generateLetter = (application: Application, company: Company | undefined, language: 'ms' | 'en') => {
  const refNumber = `UTeM/FPTT/WBL/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = language === 'ms' 
    ? today.toLocaleDateString('ms-MY', dateOptions)
    : today.toLocaleDateString('en-GB', dateOptions);

  const startDate = new Date(application.start_date);
  const formattedStartDate = language === 'ms'
    ? startDate.toLocaleDateString('ms-MY', dateOptions)
    : startDate.toLocaleDateString('en-GB', dateOptions);

  const letterWindow = window.open('', '_blank');
  if(!letterWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this site.");
      return;
  }

  // Content selection based on language (simplified from reference)
  const isMs = language === 'ms';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${isMs ? 'Surat Penempatan WBL' : 'WBL Placement Letter'}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .ref-date { margin: 20px 0; display: flex; justify-content: space-between; }
        .student-details { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2563eb; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; border-radius: 5px; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print</button>
      <div class="header">
        <img src="https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png" alt="Logo" style="height: 80px;">
        <h3>FAKULTI PENGURUSAN TEKNOLOGI DAN TEKNOUSAHAWANAN (FPTT)</h3>
        <p>Universiti Teknikal Malaysia Melaka</p>
      </div>

      <div class="ref-date">
        <div>Ref: ${refNumber}</div>
        <div>Date: ${formattedDate}</div>
      </div>

      <div>
        <strong>${company?.company_contact_person || 'Manager'}</strong><br>
        <strong>${application.company_name}</strong><br>
        ${company?.company_address || ''}
      </div>

      <div style="margin-top: 20px;">
        <p><strong>${isMs ? 'PERMOHONAN PENEMPATAN PELAJAR WBL' : 'APPLICATION FOR STUDENT PLACEMENT FOR WBL'}</strong></p>
        
        <p>${isMs ? 'Merujuk perkara di atas, pihak kami bersetuju untuk menempatkan pelajar berikut:' : 'With reference to the above, we agree to place the following student:'}</p>

        <div class="student-details">
          <p><strong>Name:</strong> ${application.student_name}</p>
          <p><strong>Matric No:</strong> ${application.student_id}</p>
          <p><strong>Program:</strong> ${application.student_program}</p>
          <p><strong>Start Date:</strong> ${formattedStartDate}</p>
        </div>

        <p>${isMs ? 'Program ini akan berlangsung selama 52 minggu.' : 'This programme will last for 52 weeks.'}</p>
      </div>

      <div style="margin-top: 60px;">
        <p>Yours faithfully,</p>
        <br><br>
        <strong>DEAN</strong><br>
        FPTT, UTeM
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Letter of Intent - ${company.company_name}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            line-height: 1.3; 
            color: black; 
            font-size: 10pt;
        }
        
        /* Balanced Header Table */
        .header-table {
            width: 90%; 
            margin: 0 auto 20px auto;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            width: 50%;
        }
        .logo-cell {
            text-align: right;
            padding-right: 60px; /* Shifts UTeM logo left of center */
        }
        .placeholder-cell {
            text-align: left;
            padding-left: 30px; 
        }

        .logo { height: 80px; }
        .company-logo-placeholder { 
            width: 150px; 
            height: 80px; 
            border: 1px dashed #e0e0e0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #ccc; 
            font-size: 8pt;
            background-color: #fafafa;
            text-align: center;
        }
        
        .title-section {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 15px;
        }
        .parties { 
            text-transform: uppercase; 
            margin: 5px 0;
        }
        
        .content { 
            text-align: justify; 
            margin: 15px 0; 
            font-size: 10pt;
        }
        .list-item { display: flex; margin-bottom: 8px; }
        .list-bullet { width: 30px; flex-shrink: 0; }
        .sub-list { margin-left: 20px; margin-top: 5px; }
        
        table.signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        table.signature-table td {
            border: 1px solid black;
            padding: 5px 8px;
            vertical-align: top;
            width: 50%;
        }
        .sig-space {
            height: 70px;
        }
        .sig-line {
            border-bottom: 1px solid black;
            margin-top: 5px;
            width: 100%;
        }
        
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; border-radius: 5px; font-family: sans-serif; z-index: 1000; }
        @media print { 
            .print-btn { display: none; } 
            body { padding: 0; margin: 0; }
            .company-logo-placeholder { border: none; color: transparent; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
      
      <!-- Header using Table for alignment stability -->
      <table class="header-table">
        <tr>
            <td class="logo-cell">
                <!-- UTeM Logo with fallback background -->
                <img src="https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png" class="logo" alt="UTeM Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'height:80px; width:150px; background:#eee; display:flex; align-items:center; justify-content:center;\'>Logo UTeM</div>'">
            </td>
            <td class="placeholder-cell">
                <div class="company-logo-placeholder">
                    [Ruang Logo Syarikat]
                </div>
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

        <div class="list-item">
          <div class="list-bullet">i.</div>
          <div>The areas of cooperation intended to be entered:
            <div class="sub-list">
              <div class="list-item">
                <div class="list-bullet">(a)</div>
                <div>Sharing of expertise between UTeM and ${company.company_name} related to Work-Based Learning (WBL) as agreed by both Parties;</div>
              </div>
              <div class="list-item">
                <div class="list-bullet">(b)</div>
                <div>Sharing of research resources, technical data, and facilities that are available in UTeM and ${company.company_name} subject to subsequent written consent by both Parties;</div>
              </div>
              <div class="list-item">
                <div class="list-bullet">(c)</div>
                <div>Conducting other activities considered to be of benefits for both Parties through human capital development activities as of training and research programs; and</div>
              </div>
              <div class="list-item">
                <div class="list-bullet">(d)</div>
                <div>Such other collaborative activities as may be mutually agreed between the Parties from time to time.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="list-item">
          <div class="list-bullet">ii.</div>
          <div>Any cooperation between the Parties pursuant to this Letter of Intent that requires financial commitment, fulfilment of obligations and responsibilities of the Parties will be formalised and secured by a written agreement.</div>
        </div>

        <div class="list-item">
          <div class="list-bullet">iii.</div>
          <div>This Letter of Intent does not constitute or create, and shall not be deemed to constitute or create any legally binding or enforceable obligations on the part of either Party to the Letter of Intent except by the execution of a Memorandum of Agreement between UTeM and ${company.company_name} containing such terms and conditions of the proposed collaboration.</div>
        </div>

        <p style="margin-top: 15px;">This Letter of Intent is to be executed in the English language.</p>
      </div>

      <table class="signature-table">
        <tr>
            <td>Signed for and on behalf of</td>
            <td>Signed for and on behalf of</td>
        </tr>
        <tr>
            <td style="font-weight: bold; background-color: #f9f9f9;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</td>
            <td style="font-weight: bold; background-color: #f9f9f9;">${company.company_name.toUpperCase()}</td>
        </tr>
        
        <!-- Signature Space -->
        <tr>
            <td class="sig-space" style="vertical-align: bottom; position: relative;">
                <!-- Signature removed as requested -->
                <div style="height: 70px;"></div>
            </td>
            <td class="sig-space"></td>
        </tr>

        <!-- Name Row -->
        <tr>
            <td style="vertical-align: bottom;">
                <strong>PROF. DR. MOHD SYAIFUL RIZAL BIN HAMID</strong>
            </td>
            <td style="vertical-align: bottom;">
                <div style="height: 20px;"></div>
                <div class="sig-line"></div>
            </td>
        </tr>

        <!-- Position Row -->
        <tr>
            <td style="vertical-align: top;">
                Dean<br>
                Faculty of Technology Management and Technopreneurship
            </td>
            <td style="vertical-align: top;">
                <div style="height: 40px;"></div>
            </td>
        </tr>

        <!-- Date Row -->
        <tr>
            <td>Date: ${currentDate}</td>
            <td>
                Date: 
                <div style="display:inline-block; width: 150px; border-bottom: 1px solid black;"></div>
            </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  letterWindow.document.write(htmlContent);
  letterWindow.document.close();
};

export const downloadLOIWord = (company: Company) => {
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
      
      <!-- Header Table -->
      <table class="header-table" style="width: 100%; margin-bottom: 20px;">
        <tr>
            <td style="text-align: right; width: 50%; padding-right: 60px;">
                <img src="https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png" width="150" height="80" alt="UTeM Logo">
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
        <p>
          <strong>UTeM</strong> and <strong>${company.company_name}</strong> having met and discussed collaborative efforts between Parties hereby record their intent towards the collaboration under the following conditions:
        </p>

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
        <tr>
            <td>Signed for and on behalf of</td>
            <td>Signed for and on behalf of</td>
        </tr>
        <tr>
            <td style="font-weight: bold; background-color: #f9f9f9;">UNIVERSITI TEKNIKAL MALAYSIA MELAKA</td>
            <td style="font-weight: bold; background-color: #f9f9f9;">${company.company_name.toUpperCase()}</td>
        </tr>
        
        <tr>
            <td style="height: 70px; vertical-align: bottom;">
                <!-- Signature Space -->
            </td>
            <td style="height: 70px;"></td>
        </tr>

        <tr>
            <td style="vertical-align: bottom;">
                <strong>PROF. DR. MOHD SYAIFUL RIZAL BIN HAMID</strong>
            </td>
            <td style="vertical-align: bottom;">
                <br/>
                <div class="sig-line"></div>
            </td>
        </tr>

        <tr>
            <td style="vertical-align: top;">
                Dean<br>
                Faculty of Technology Management and Technopreneurship
            </td>
            <td style="vertical-align: top;">
                <br/>
            </td>
        </tr>

        <tr>
            <td>Date: ${currentDate}</td>
            <td>
                Date: _______________
            </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // Saving as .doc is robust for HTML-Word conversion without external libraries
  link.download = `LOI_${company.company_name.replace(/[^a-z0-9]/gi, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
