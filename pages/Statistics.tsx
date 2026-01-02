
import React, { useMemo } from 'react';
import { Application, Company, User, UserRole } from '../types';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Clock, XCircle, Building2, GraduationCap, MapPin, TrendingUp, FileUser, UserCheck, UserPlus, AlertCircle } from 'lucide-react';
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
    const prepared = students.filter(s => s.resume_about || s.resume_education).length;
    return { prepared, notPrepared: students.length - prepared, percentage: (prepared / (students.length || 1)) * 100 };
  }, [students]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      if (app.application_status === 'Diluluskan') {
        const state = app.company_state || 'Other';
        counts[state] = (counts[state] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [applications]);

  const companyStats = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      const name = app.company_name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [applications]);

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
        <div className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
            <FileUser size={20} />
            <div>
                <p className="text-[10px] font-bold uppercase opacity-80">{t(language, 'statsResumeRate')}</p>
                <p className="text-lg font-black leading-none">{resumeStats.percentage.toFixed(1)}%</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <GraduationCap size={20} className="text-blue-600 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase">{t(language, 'students')}</p>
          <h3 className="text-2xl font-black">{students.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <UserCheck size={20} className="text-green-600 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase">{t(language, 'statsPlaced')}</p>
          <h3 className="text-2xl font-black">{studentStatusCounts.approved}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <FileUser size={20} className="text-indigo-600 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase">{t(language, 'statsResumeReady')}</p>
          <h3 className="text-2xl font-black">{resumeStats.prepared}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <UserPlus size={20} className="text-slate-400 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase">{t(language, 'statsNotApplied')}</p>
          <h3 className="text-2xl font-black">{studentStatusCounts.noApp}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">{t(language, 'statsPlacementDist')}</h3>
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
                <PieSlice startAngle={0} endAngle={studentStatusCounts.p_approved * 3.6} color="#10b981" />
                <PieSlice startAngle={studentStatusCounts.p_approved * 3.6} endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} color="#f59e0b" />
                <PieSlice startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending) * 3.6} endAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} color="#ef4444" />
                <PieSlice startAngle={(studentStatusCounts.p_approved + studentStatusCounts.p_pending + studentStatusCounts.p_rejected) * 3.6} endAngle={360} color="#94a3b8" />
                <circle r="0.6" cx="0" cy="0" fill="white" />
              </svg>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> <span>{language === 'ms' ? 'Ditempatkan' : 'Placed'}: {studentStatusCounts.approved}</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> <span>{language === 'ms' ? 'Menunggu' : 'Pending'}: {studentStatusCounts.pending}</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> <span>{t(language, 'statsNotApplied')}: {studentStatusCounts.noApp}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">{t(language, 'statsTopStates')}</h3>
          <div className="space-y-4">
            {stateData.map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold"><span>{d.name}</span> <span>{d.count}</span></div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(d.count / (stateData[0]?.count || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
