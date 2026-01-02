
import React, { useMemo } from 'react';
import { Application, Company, User, UserRole } from '../types';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Clock, XCircle, Building2, GraduationCap, MapPin, TrendingUp, FileUser, UserCheck, UserPlus, AlertCircle, ListChecks, Target } from 'lucide-react';
import { Language, t } from '../translations';

interface StatisticsProps {
  applications: Application[];
  companies: Company[];
  users: User[];
  language: Language;
}

export const Statistics: React.FC<StatisticsProps> = ({ applications, companies, users, language }) => {
  const students = useMemo(() => users.filter(u => u.role === UserRole.STUDENT), [users]);
  
  const studentStatusCounts = useMemo(() => {
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedOnlyCount = 0;
    let noAppCount = 0;

    students.forEach(student => {
      const studentApps = applications.filter(a => a.student_id === student.matric_no || a.created_by === student.username);
      if (studentApps.length === 0) noAppCount++;
      else if (studentApps.some(a => a.application_status === 'Diluluskan')) approvedCount++;
      else if (studentApps.some(a => a.application_status === 'Menunggu')) pendingCount++;
      else rejectedOnlyCount++;
    });

    const total = students.length || 1;
    return {
      approved: approvedCount, pending: pendingCount, rejected: rejectedOnlyCount, noApp: noAppCount,
      p_approved: (approvedCount / total) * 100, p_pending: (pendingCount / total) * 100,
      p_rejected: (rejectedOnlyCount / total) * 100, p_noApp: (noAppCount / total) * 100,
      total: students.length
    };
  }, [students, applications]);

  const resumeStats = useMemo(() => {
    const prepared = students.filter(s => s.resume_about || s.resume_education || s.resume_skills_soft).length;
    const total = students.length || 1;
    return { 
        prepared, 
        notPrepared: students.length - prepared, 
        percentage: (prepared / total) * 100 
    };
  }, [students]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      if (app.application_status === 'Diluluskan') {
        const state = app.company_state || 'Other';
        counts[state] = (counts[state] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  const companyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      const name = app.company_name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  const programBreakdown = useMemo(() => {
    const programs: Record<string, { total: number; placed: number }> = {};
    students.forEach(s => {
        const prog = s.program || 'Unknown';
        if (!programs[prog]) programs[prog] = { total: 0, placed: 0 };
        programs[prog].total++;
        
        const hasPlacement = applications.some(a => 
            (a.student_id === s.matric_no || a.created_by === s.username) && 
            a.application_status === 'Diluluskan'
        );
        if (hasPlacement) programs[prog].placed++;
    });
    return Object.entries(programs).sort((a, b) => b[1].total - a[1].total);
  }, [students, applications]);

  const PieSlice = ({ startAngle, endAngle, color }: { startAngle: number, endAngle: number, color: string }) => {
    const x1 = Math.cos((startAngle * Math.PI) / 180);
    const y1 = Math.sin((startAngle * Math.PI) / 180);
    const x2 = Math.cos((endAngle * Math.PI) / 180);
    const y2 = Math.sin((endAngle * Math.PI) / 180);
    const d = `M 0 0 L ${x1} ${y1} A 1 1 0 ${endAngle - startAngle <= 180 ? "0" : "1"} 1 ${x2} ${y2} Z`;
    return <path d={d} fill={color} />;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            <div>
            <h2 className="text-2xl font-bold text-slate-800">{t(language, 'statsTitle')}</h2>
            <p className="text-slate-500 text-sm">{t(language, 'statsDesc')}</p>
            </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl shadow-blue-100">
            <div className="p-2 bg-white/20 rounded-lg">
                <FileUser size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t(language, 'statsResumeRate')}</p>
                <p className="text-2xl font-black leading-none">{resumeStats.percentage.toFixed(1)}%</p>
            </div>
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(language, 'students')}</p>
            <h3 className="text-2xl font-black text-slate-800">{students.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(language, 'statsPlaced')}</p>
            <h3 className="text-2xl font-black text-slate-800">{studentStatusCounts.approved}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'ms' ? 'Sedang Memohon' : 'Applying'}</p>
            <h3 className="text-2xl font-black text-slate-800">{studentStatusCounts.pending}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(language, 'statsNotApplied')}</p>
            <h3 className="text-2xl font-black text-slate-800">{studentStatusCounts.noApp}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RESUME READINESS BREAKDOWN */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Target size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-800">{t(language, 'statsResumeReadiness')}</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">{t(language, 'statsResumeReady')}</span>
                <span className="font-bold text-slate-800">{resumeStats.prepared} / {students.length}</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000"
                    style={{ width: `${resumeStats.percentage}%` }}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">{t(language, 'statsResumeReady')}</p>
                    <p className="text-xl font-black text-indigo-700 leading-none mt-1">{resumeStats.prepared}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{language === 'ms' ? 'Belum Lengkap' : 'Incomplete'}</p>
                    <p className="text-xl font-black text-slate-500 leading-none mt-1">{resumeStats.notPrepared}</p>
                </div>
            </div>
          </div>
        </div>

        {/* PIE CHART - DISTRIBUTION WITH CENTERED PERCENTAGE */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">{t(language, 'statsPlacementDist')}</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative w-48 h-48">
              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
                <PieSlice startAngle={0} endAngle={studentStatusCounts.p_approved * 3.6} color="#10b981" />
                <PieSlice startAngle={studentStatusCounts.p_approved * 3.6} endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} color="#f59e0b" />
                <PieSlice startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} color="#ef4444" />
                <PieSlice startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} endAngle={360} color="#e2e8f0" />
                
                {/* Donut Hole */}
                <circle r="0.75" cx="0" cy="0" fill="white" />
                
                {/* Centered Percentage (Upright) */}
                <g transform="rotate(90)">
                    <text x="0" y="-0.05" textAnchor="middle" className="text-[0.45px] font-black" fill="#1e293b" style={{ fontSize: '0.45px', fontWeight: '900' }}>
                        {Math.round(studentStatusCounts.p_approved)}%
                    </text>
                    <text x="0" y="0.25" textAnchor="middle" className="text-[0.12px] font-bold" fill="#64748b" style={{ fontSize: '0.12px', textTransform: 'uppercase', letterSpacing: '0.05px' }}>
                        {language === 'ms' ? 'LULUS' : 'PLACED'}
                    </text>
                </g>
              </svg>
            </div>
            <div className="space-y-3 text-xs w-full md:w-auto">
              <div className="flex items-center justify-between gap-6 border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#10b981]"></div>
                    <span className="text-slate-600 font-medium">{language === 'ms' ? 'Sudah Ditempatkan' : 'Placed'}</span>
                  </div>
                  <span className="font-bold text-slate-800">{studentStatusCounts.approved}</span>
              </div>
              <div className="flex items-center justify-between gap-6 border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#f59e0b]"></div>
                    <span className="text-slate-600 font-medium">{language === 'ms' ? 'Menunggu Kelulusan' : 'Pending'}</span>
                  </div>
                  <span className="font-bold text-slate-800">{studentStatusCounts.pending}</span>
              </div>
              <div className="flex items-center justify-between gap-6 border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#e2e8f0]"></div>
                    <span className="text-slate-600 font-medium">{t(language, 'statsNotApplied')}</span>
                  </div>
                  <span className="font-bold text-slate-800">{studentStatusCounts.noApp}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
                    <span className="text-slate-600 font-medium">{language === 'ms' ? 'Ditolak' : 'Rejected'}</span>
                  </div>
                  <span className="font-bold text-slate-800">{studentStatusCounts.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOP STATES */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={18} className="text-red-500" />
            <h3 className="font-bold text-slate-800">{t(language, 'statsTopStates')}</h3>
          </div>
          <div className="space-y-4">
            {stateData.length > 0 ? stateData.map((d, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{d.name}</span> 
                    <span className="text-blue-600">{d.count} {language === 'ms' ? 'Pelajar' : 'Students'}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${(d.count / (stateData[0]?.count || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )) : <p className="text-center text-slate-400 py-8 italic">{t(language, 'noRecords')}</p>}
          </div>
        </div>

        {/* TOP COMPANIES */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={18} className="text-purple-600" />
            <h3 className="font-bold text-slate-800">{t(language, 'statsTopCompanies')}</h3>
          </div>
          <div className="space-y-3">
            {companyStats.length > 0 ? companyStats.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-white border rounded-full text-[10px] font-black text-slate-500 shadow-sm">{i + 1}</span>
                        <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-600">{c.count}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t(language, 'appStudent')}</span>
                    </div>
                </div>
            )) : <p className="text-center text-slate-400 py-8 italic">{t(language, 'noRecords')}</p>}
          </div>
        </div>

      </div>

      {/* SUMMARY FOOTER */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <TrendingUp size={32} />
              </div>
              <div>
                  <h3 className="text-xl font-black">{t(language, 'statsSummary')}</h3>
                  <p className="text-blue-100 text-sm">{language === 'ms' ? 'Prestasi penempatan pelajar secara keseluruhan.' : 'Overall student placement performance.'}</p>
              </div>
          </div>
          <div className="flex gap-8">
              <div className="text-center">
                  <p className="text-4xl font-black">{Math.round((studentStatusCounts.approved / (students.length || 1)) * 100)}%</p>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">{t(language, 'successRate')}</p>
              </div>
              <div className="text-center">
                  <p className="text-4xl font-black">{(applications.length / (students.length || 1)).toFixed(1)}</p>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">{t(language, 'averageApps')}</p>
              </div>
          </div>
      </div>
    </div>
  );
};
