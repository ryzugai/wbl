
import { User } from '../types';
import { GoogleGenAI } from "@google/genai";

export type ResumeTheme = 'modern-blue' | 'emerald-green' | 'royal-purple' | 'professional-slate';

export const generateResume = async (student: User, lang: 'ms' | 'en' = 'ms', theme: ResumeTheme = 'modern-blue') => {
  const parseJSON = (str: string | undefined, def: any = []) => {
    if (!str) return def;
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : def;
    } catch (e) {
      return def;
    }
  };

  const themes = {
    'modern-blue': { primary: '#1e293b', secondary: '#38bdf8', accent: '#f0f9ff' },
    'emerald-green': { primary: '#064e3b', secondary: '#10b981', accent: '#ecfdf5' },
    'royal-purple': { primary: '#4c1d95', secondary: '#a78bfa', accent: '#f5f3ff' },
    'professional-slate': { primary: '#0f172a', secondary: '#94a3b8', accent: '#f8fafc' }
  };

  const colors = themes[theme] || themes['modern-blue'];

  let about = student.resume_about || "";
  let coursesRaw = student.resume_courses || "";
  let education = parseJSON(student.resume_education);
  let projects = parseJSON(student.resume_projects);
  let workExperience = parseJSON(student.resume_work_experience);
  
  if (lang === 'en') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Translate the following Malaysian student resume details into professional English. 
        Maintain the structure and professional tone.
        Return ONLY a JSON object with these exact keys: 
        "about", "courses", "education" (array of objects), "projects" (array of objects), "workExperience" (array of objects).
        
        Input Data:
        - About: ${about}
        - Courses: ${coursesRaw}
        - Education: ${JSON.stringify(education)}
        - Projects: ${JSON.stringify(projects)}
        - Work Experience: ${JSON.stringify(workExperience)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const cleanedJson = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      const translatedData = JSON.parse(cleanedJson);
      
      if (translatedData.about) about = translatedData.about;
      if (translatedData.courses) coursesRaw = translatedData.courses;
      if (translatedData.education) education = translatedData.education;
      if (translatedData.projects) projects = translatedData.projects;
      if (translatedData.workExperience) workExperience = translatedData.workExperience;
    } catch (error) {
      console.error("AI Translation failed:", error);
    }
  }

  const resumeWindow = window.open('', '_blank');
  if (!resumeWindow) {
    alert("Pop-up blocked. Sila benarkan pop-up untuk menjana resume.");
    return;
  }

  const labels = {
    ms: {
      contact: 'Hubungi',
      softSkills: 'Kemahiran Insaniah',
      techSkills: 'Kemahiran Teknologi',
      languages: 'Bahasa',
      about: 'Tentang Saya',
      education: 'Pendidikan',
      work: 'Pengalaman Kerja',
      projects: 'Projek & Pencapaian',
      courses: 'Kursus Utama',
      ref: 'Rujukan',
      generated: 'Dokumen dijana melalui WBL System',
      designation: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
      current: 'Kini',
      coordinatorTitle: 'Penyelaras WBL (Mod Industri)',
      faculty: 'Fakulti Pengurusan Teknologi dan Teknousahawanan, UTeM'
    },
    en: {
      contact: 'Contact',
      softSkills: 'Soft Skills',
      techSkills: 'Technical Skills',
      languages: 'Languages',
      about: 'About Me',
      education: 'Education',
      work: 'Work Experience',
      projects: 'Projects & Achievements',
      courses: 'Core Courses',
      ref: 'References',
      generated: 'Document generated via WBL System',
      designation: 'Bachelor of Technopreneurship with Honours',
      current: 'Present',
      coordinatorTitle: 'WBL Coordinator (Industry Mode)',
      faculty: 'Faculty of Technology Management and Technopreneurship, UTeM'
    }
  };

  const t = labels[lang] || labels['ms'];
  const softSkills = parseJSON(student.resume_skills_soft);
  const techSkills = parseJSON(student.resume_skills_tech);
  const languages = parseJSON(student.resume_languages);
  const coursesList = coursesRaw ? coursesRaw.split(',').map(c => c.trim()) : [];

  const renderStars = (level: number) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span style="color: ${i <= level ? colors.secondary : '#334155'}; font-size: 10px;">${i <= level ? '★' : '☆'}</span>`;
    }
    return stars;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>Resume - ${student.name}</title>
      <style>
        @page { size: A4; margin: 0; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; padding: 0; color: #333; line-height: 1.4; background: #f8fafc; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .resume-container { display: flex; min-height: 297mm; width: 210mm; background: white; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .sidebar { width: 32%; background: ${colors.primary}; color: white; padding: 35px 25px; display: flex; flex-direction: column; }
        .profile-img-container { width: 110px; height: 110px; border-radius: 50%; background: #334155; margin: 0 auto 20px auto; overflow: hidden; border: 4px solid ${colors.secondary}; display: flex; align-items: center; justify-content: center; font-size: 45px; font-weight: bold; }
        .profile-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar h2 { font-size: 13px; text-transform: uppercase; border-bottom: 2px solid ${colors.secondary}; padding-bottom: 5px; margin-top: 22px; letter-spacing: 1px; color: ${colors.secondary}; }
        .contact-info { font-size: 11px; margin-top: 12px; }
        .contact-item { display: flex; align-items: center; margin-bottom: 8px; gap: 8px; word-break: break-all; }
        .rating-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 10.5px; }
        .main-content { width: 68%; padding: 40px 35px; display: flex; flex-direction: column; }
        .name-header { border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; margin-bottom: 20px; }
        .name-header h1 { margin: 0; font-size: 26px; color: ${colors.primary}; text-transform: uppercase; line-height: 1.1; }
        .designation-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
        .designation-row p { margin: 0; color: ${colors.secondary}; font-weight: bold; font-size: 14px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; color: ${colors.primary}; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .section-title::after { content: ""; flex: 1; height: 1.5px; background: #e2e8f0; }
        .about-text { font-size: 11.5px; text-align: justify; color: #475569; }
        .item-row { margin-bottom: 12px; }
        .item-title { font-weight: bold; font-size: 12.5px; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
        .item-sub { font-size: 11.5px; color: #64748b; font-style: italic; }
        .item-desc { font-size: 11px; margin-top: 3px; color: #475569; }
        .cgpa-badge { background: ${colors.primary}; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .cgpa-badge-small { background: ${colors.secondary}; color: white; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .courses-grid { display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 5px; }
        .course-tag { font-size: 11px; color: #334155; }
        .ref-section { margin-top: auto; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        .ref-card { font-size: 10.5px; }
        .ref-name { font-weight: bold; color: ${colors.primary}; font-size: 11.5px; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: ${colors.secondary}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 100; font-size: 13px; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
      <div class="resume-container">
        <div class="sidebar">
          <div class="profile-img-container">
            ${student.profile_image ? `<img src="${student.profile_image}" alt="Profile">` : student.name.charAt(0)}
          </div>
          <h2>${t.contact}</h2>
          <div class="contact-info">
            <div class="contact-item">📧 ${student.email}</div>
            <div class="contact-item">📞 ${student.phone}</div>
            <div class="contact-item">🆔 ${student.matric_no}</div>
            <div class="contact-item">📍 ${student.address || 'Malaysia'}</div>
          </div>
          <h2>${t.softSkills}</h2>
          <div style="margin-top: 10px;">
            ${softSkills.length > 0 ? softSkills.map((s: any) => `
              <div class="rating-item">
                <span>${s.name}</span>
                <div class="stars">${renderStars(s.level)}</div>
              </div>
            `).join('') : '<span style="font-size: 10px; opacity: 0.5;">-</span>'}
          </div>
          <h2>${t.techSkills}</h2>
          <div style="margin-top: 10px;">
            ${techSkills.length > 0 ? techSkills.map((s: any) => `
              <div class="rating-item">
                <span>${s.name}</span>
                <div class="stars">${renderStars(s.level)}</div>
              </div>
            `).join('') : '<span style="font-size: 10px; opacity: 0.5;">-</span>'}
          </div>
          <h2>${t.languages}</h2>
          <div style="margin-top: 10px;">
             ${languages.length > 0 ? languages.map((l: any) => `
              <div class="rating-item">
                <span>${l.name}</span>
                <div class="stars">${renderStars(l.level)}</div>
              </div>
            `).join('') : '<span style="font-size: 10px; opacity: 0.5;">-</span>'}
          </div>
          <div style="margin-top: auto; font-size: 9px; opacity: 0.6; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
            ${t.generated}<br>© ${new Date().getFullYear()} Dr. Mohd Guzairy
          </div>
        </div>
        <div class="main-content">
          <div class="name-header">
            <h1>${student.name}</h1>
            <div class="designation-row">
                <p>${t.designation}</p>
                ${student.resume_cgpa ? `<span class="cgpa-badge">CGPA ${student.resume_cgpa}</span>` : ''}
            </div>
          </div>
          <div class="section">
            <div class="section-title">${t.about}</div>
            <div class="about-text">${about || (lang === 'ms' ? 'Pelajar berdedikasi dari Fakulti Pengurusan Teknologi dan Teknousahawanan (FPTT), UTeM.' : 'Dedicated student from the Faculty of Technology Management and Technopreneurship (FPTT), UTeM.')}</div>
          </div>
          <div class="section">
            <div class="section-title">${t.education}</div>
            ${education.length > 0 ? education.map((e: any) => `
              <div class="item-row">
                <div class="item-title">
                   <span>${e.level}</span>
                   ${e.cgpa ? `<span class="cgpa-badge-small">CGPA ${e.cgpa}</span>` : ''}
                </div>
                <div class="item-sub">${e.school} | ${e.year}</div>
              </div>
            `).join('') : `
              <div class="item-row">
                <div class="item-title"><span>${t.designation}</span></div>
                <div class="item-sub">Universiti Teknikal Malaysia Melaka | 2022 - ${t.current}</div>
              </div>
            `}
          </div>
          ${workExperience.length > 0 ? `
          <div class="section">
            <div class="section-title">${t.work}</div>
            ${workExperience.map((w: any) => `
              <div class="item-row">
                <div class="item-title">
                   <span>${w.position}</span>
                   <span class="item-sub">${w.duration}</span>
                </div>
                <div style="font-size: 11.5px; font-weight: bold; color: #334155;">${w.company}</div>
                <div class="item-desc">${w.desc}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          <div class="section">
            <div class="section-title">${t.projects}</div>
            ${projects.length > 0 ? projects.map((p: any) => `
              <div class="item-row">
                <div class="item-title">${p.title}</div>
                <div class="item-desc">${p.desc}</div>
              </div>
            `).join('') : `
              <div class="item-row">
                <div class="item-title">Work-Based Learning (WBL) Programme</div>
                <div class="item-desc">${lang === 'ms' ? 'Menjalani latihan industri berstruktur selama 52 minggu di industri.' : 'Undergoing structured 52-week industrial training in the industry.'}</div>
              </div>
            `}
          </div>
          <div class="section">
            <div class="section-title">${t.courses}</div>
            <div class="courses-grid">
               ${coursesList.map(c => `<div class="course-tag">• ${c}</div>`).join('')}
               ${coursesList.length === 0 ? `<div class="course-tag">• ${lang === 'ms' ? 'Analitik Perniagaan, Penjenamaan, Digital Entreprenuership' : 'Business Analytics, Branding, Digital Entrepreneurship'}</div>` : ''}
            </div>
          </div>
          <div class="ref-section">
            <div class="section-title">${t.ref}</div>
            <div class="ref-card">
              <div class="ref-name">Dr. Mohd Guzairy bin Abd Ghani</div>
              <div>${t.coordinatorTitle}</div>
              <div>${t.faculty}</div>
              <div>Email: guzairy@utem.edu.my | Tel: 06-2708134</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  resumeWindow.document.write(htmlContent);
  resumeWindow.document.close();
};
