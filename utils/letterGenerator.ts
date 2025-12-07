
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
        .header { text-align: center; margin-bottom: 15px; }
        .logo { height: 70px; margin-bottom: 5px; }
        
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
        .field-label {
            font-size: 8pt;
            margin-top: 2px;
            color: #555;
        }

        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; border-radius: 5px; font-family: sans-serif; z-index: 1000; }
        @media print { 
            .print-btn { display: none; } 
            body { padding: 0; margin: 0; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
      
      <div class="header">
        <img src="https://www.utem.edu.my/templates/yootheme/cache/a4/utem-25300x-a44e3a0d.png" class="logo" alt="UTeM Logo">
      </div>

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
                <div>Sharing of expertise between UTeM and ${company.company_name} related to <span style="background-color: #ffcccc; padding: 0 2px;">Work-Based Learning (WBL)</span> as agreed by both Parties;</div>
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
            <td class="sig-space"></td>
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
                <div class="field-label">(Name)</div>
            </td>
        </tr>

        <!-- Position Row -->
        <tr>
            <td style="vertical-align: top;">
                Dean<br>
                Faculty of Technology Management and Technopreneurship
            </td>
            <td style="vertical-align: top;">
                <div style="height: 20px;"></div>
                <div class="sig-line"></div>
                <div class="field-label">(Position)</div>
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
