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