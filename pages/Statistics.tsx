
import React, { useMemo } from 'react';
import { Application, Company, User, UserRole } from '../types';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Clock, XCircle, Building2, GraduationCap, MapPin, TrendingUp, FileUser, UserCheck, UserPlus, AlertCircle } from 'lucide-react';

interface StatisticsProps {
  applications: Application[];
  companies: Company[];
  users: User[];
}

export const Statistics: React.FC<StatisticsProps> = ({ applications, companies, users }) => {
  const students = useMemo(() => users.filter(u => u.role === UserRole.STUDENT), [users]);
  
  // 1. Data Processing for Student Placement Status (Pie Chart)
  // Logic: Each student is categorized into ONE status
  const studentStatusCounts = useMemo(() => {
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedOnlyCount = 0;
    let noAppCount = 0;

    students.forEach(student => {
      const studentApps = applications.filter(a => a.student_id === student.matric_no || a.created_by === student.username);
      
      if (studentApps.length === 0) {
        noAppCount++;
      } else if (studentApps.some(a => a.application_status === 'Diluluskan')) {
        approvedCount++;
      } else if (studentApps.some(a => a.application_status === 'Menunggu')) {
        pendingCount++;
      } else {
        rejectedOnlyCount++;
      }
    });

    const total = students.length || 1;
    return {
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedOnlyCount,
      noApp: noAppCount,
      p_approved: (approvedCount / total) * 100,
      p_pending: (pendingCount / total) * 100,
      p_rejected: (rejectedOnlyCount / total) * 100,
      p_noApp: (noAppCount / total) * 100,
      total: students.length
    };
  }, [students, applications]);

  // 2. Resume Generation Statistics
  const resumeStats = useMemo(() => {
    // A student is considered to have "generated/prepared" a resume if they have filled the 'about' or 'education' section
    const prepared = students.filter(s => s.resume_about || s.resume_education).length;
    const total = students.length || 1;
    return {
      prepared,
      notPrepared: students.length - prepared,
      percentage: (prepared / total) * 100
    };
  }, [students]);

  // 3. Data Processing for States (Bar Chart)
  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      if (app.application_status === 'Diluluskan') {
        const state = app.company_state || 'Lain-lain';
        counts[state] = (counts[state] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 states
  }, [applications]);

  const maxStateCount = Math.max(...stateData.map(d => d.count), 1);

  // 4. Data Processing for Top 5 Companies
  const companyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      const name = app.company_name || 'Tidak Diketahui';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  const maxCompanyCount = Math.max(...companyStats.map(d => d.count), 1);

  // 5. Data Processing for Programs
  const programStats = useMemo(() => {
    const stats: Record<string, { total: number, approved: number }> = {};
    
    students.forEach(s => {
      const prog = s.program || 'Tiada Program';
      if (!stats[prog]) stats[prog] = { total: 0, approved: 0 };
    });

    applications.forEach(app => {
      const prog = app.student_program || 'Lain-lain';
      if (!stats[prog]) stats[prog] = { total: 0, approved: 0 };
      stats[prog].total++;
      if (app.application_status === 'Diluluskan') {
        stats[prog].approved++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [students, applications]);

  // SVG Helper for Pie Chart
  const PieSlice = ({ startAngle, endAngle, color }: { startAngle: number, endAngle: number, color: string }) => {
    const x1 = Math.cos((startAngle * Math.PI) / 180);
    const y1 = Math.sin((startAngle * Math.PI) / 180);
    const x2 = Math.cos((endAngle * Math.PI) / 180);
    const y2 = Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const d = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    return <path d={d} fill={color} />;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            <div>
            <h2 className="text-2xl font-bold text-slate-800">Analisa Statistik WBL</h2>
            <p className="text-slate-500 text-sm">Visualisasi data pelajar dan penempatan secara masa nyata.</p>
            </div>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg shadow-blue-100">
            <FileUser size={20} />
            <div>
                <p className="text-[10px] font-bold uppercase opacity-80">Kadar Pengisian Resume</p>
                <p className="text-lg font-black leading-none">{resumeStats.percentage.toFixed(1)}%</p>
            </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3">
            <GraduationCap size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Pelajar</p>
          <h3 className="text-2xl font-black text-slate-800">{students.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-3">
            <UserCheck size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sudah Ditempatkan</p>
          <h3 className="text-2xl font-black text-slate-800">{studentStatusCounts.approved}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit mb-3">
            <FileUser size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lengkap Resume</p>
          <h3 className="text-2xl font-black text-slate-800">{resumeStats.prepared}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg w-fit mb-3">
            <UserPlus size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Belum Memohon</p>
          <h3 className="text-2xl font-black text-slate-800">{studentStatusCounts.noApp}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART: PIE STATUS PELAJAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">Agihan Status Pelajar (%)</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative w-48 h-48">
              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
                <PieSlice startAngle={0} endAngle={studentStatusCounts.p_approved * 3.6} color="#10b981" />
                <PieSlice 
                  startAngle={studentStatusCounts.p_approved * 3.6} 
                  endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} 
                  color="#f59e0b" 
                />
                <PieSlice 
                  startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} 
                  endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} 
                  color="#ef4444" 
                />
                <PieSlice 
                  startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} 
                  endAngle={360} 
                  color="#94a3b8" 
                />
                <circle r="0.6" cx="0" cy="0" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{studentStatusCounts.total}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pelajar</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Ditempatkan</p>
                  <p className="text-sm font-bold text-slate-800">{studentStatusCounts.approved} ({studentStatusCounts.p_approved.toFixed(1)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Menunggu</p>
                  <p className="text-sm font-bold text-slate-800">{studentStatusCounts.pending} ({studentStatusCounts.p_pending.toFixed(1)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Hanya Ditolak</p>
                  <p className="text-sm font-bold text-slate-800">{studentStatusCounts.rejected} ({studentStatusCounts.p_rejected.toFixed(1)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Belum Memohon</p>
                  <p className="text-sm font-bold text-slate-800">{studentStatusCounts.noApp} ({studentStatusCounts.p_noApp.toFixed(1)}%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARTA: PRESTASI RESUME */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6">
                <FileUser size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-800">Tahap Kesiapsediaan Resume</h3>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray={364.42}
                            strokeDashoffset={364.42 - (364.42 * resumeStats.percentage) / 100}
                            className="text-indigo-600 transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute text-2xl font-black text-slate-800">{resumeStats.percentage.toFixed(0)}%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <p className="text-2xl font-black text-indigo-700 leading-none">{resumeStats.prepared}</p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">Lengkap</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-black text-slate-400 leading-none">{resumeStats.notPrepared}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Belum Lengkap</p>
                    </div>
                </div>
                
                <p className="text-xs text-slate-500 italic max-w-sm">
                    Kadar pengisian data resume (Tentang Saya/Pendidikan) oleh pelajar untuk kegunaan penjanaan resume infografik.
                </p>
            </div>
        </div>

        {/* CHART: BAR STATE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">Top 5 Penempatan (Negeri)</h3>
          </div>
          
          <div className="space-y-5 h-full">
            {stateData.length > 0 ? (
              stateData.map((data, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">{data.name}</span>
                    <span className="text-blue-600">{data.count}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(data.count / maxStateCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 italic text-sm">
                Tiada data penempatan diluluskan lagi.
              </div>
            )}
          </div>
        </div>

        {/* NEW CHART: TOP 5 COMPANIES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-800">Top 5 Syarikat Paling Diminati</h3>
          </div>
          
          <div className="space-y-5">
            {companyStats.length > 0 ? (
              companyStats.map((data, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 truncate max-w-[80%]">{data.name}</span>
                    <span className="text-indigo-600">{data.count} Permohonan</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(data.count / maxCompanyCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 italic text-sm text-center">
                <TrendingUp size={32} className="mb-2 opacity-20" />
                Tiada data permohonan lagi.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INFO BOX SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-md text-white flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Ringkasan Analisa Keseluruhan</h3>
                <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
                    Sehingga kini, <strong>{studentStatusCounts.p_approved.toFixed(1)}%</strong> pelajar telah berjaya ditempatkan di industri. 
                    Terdapat <strong>{studentStatusCounts.noApp}</strong> pelajar yang masih belum memulakan permohonan. 
                    Pihak pengurusan disarankan untuk memantau pelajar ini bagi memastikan mereka tidak terlepas tempoh penempatan WBL.
                </p>
                <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-blue-200">Purata Kejayaan</p>
                        <p className="text-xl font-black">{studentStatusCounts.p_approved.toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-blue-200">Penyediaan Resume</p>
                        <p className="text-xl font-black">{resumeStats.percentage.toFixed(1)}%</p>
                    </div>
                </div>
            </div>
            <BarChart3 className="absolute -bottom-6 -right-6 text-white/10" size={140} />
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-4 text-orange-600">
                 <AlertCircle size={20} />
                 <h4 className="font-bold text-slate-800">Tindakan Diperlukan</h4>
             </div>
             <div className="space-y-4">
                 <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                     <span className="text-xs font-bold text-orange-800">Pelajar Belum Mohon</span>
                     <span className="px-2 py-1 bg-white rounded-lg text-sm font-black text-orange-600 shadow-sm">{studentStatusCounts.noApp}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                     <span className="text-xs font-bold text-red-800">Resume Kosong</span>
                     <span className="px-2 py-1 bg-white rounded-lg text-sm font-black text-red-600 shadow-sm">{resumeStats.notPrepared}</span>
                 </div>
             </div>
         </div>
      </div>

      {/* TABLE: PROGRAM BREAKDOWN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={20} className="text-blue-600" />
            Pecahan Statistik Mengikut Program
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase">Nama Program</th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase text-center">Jum. Permohonan</th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase text-center">Diluluskan</th>
                <th className="p-4 font-bold text-xs text-slate-500 uppercase text-center">Kadar Kejayaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programStats.length > 0 ? (
                programStats.map((item, idx) => {
                  const rate = item.total > 0 ? (item.approved / item.total) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm font-semibold text-slate-800">{item.name}</td>
                      <td className="p-4 text-sm text-slate-600 text-center">{item.total}</td>
                      <td className="p-4 text-sm text-green-600 font-bold text-center">{item.approved}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          rate >= 70 ? 'bg-green-100 text-green-700' : 
                          rate >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">Tiada data program.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
