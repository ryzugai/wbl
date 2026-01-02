
import React, { useMemo } from 'react';
import { Application, Company, User, UserRole } from '../types';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Clock, XCircle, Building2, GraduationCap, MapPin } from 'lucide-react';

interface StatisticsProps {
  applications: Application[];
  companies: Company[];
  users: User[];
}

export const Statistics: React.FC<StatisticsProps> = ({ applications, companies, users }) => {
  // 1. Data Processing for Status (Pie Chart)
  const statusCounts = useMemo(() => {
    const counts = {
      approved: applications.filter(a => a.application_status === 'Diluluskan').length,
      pending: applications.filter(a => a.application_status === 'Menunggu').length,
      rejected: applications.filter(a => a.application_status === 'Ditolak').length,
    };
    const total = applications.length || 1;
    return {
      ...counts,
      p_approved: (counts.approved / total) * 100,
      p_pending: (counts.pending / total) * 100,
      p_rejected: (counts.rejected / total) * 100,
      total: applications.length
    };
  }, [applications]);

  // 2. Data Processing for States (Bar Chart)
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

  // 3. Data Processing for Programs (Table)
  const programStats = useMemo(() => {
    const stats: Record<string, { total: number, approved: number }> = {};
    
    // Get all unique programs from users (students)
    users.filter(u => u.role === UserRole.STUDENT).forEach(s => {
      const prog = s.program || 'Tiada Program';
      if (!stats[prog]) stats[prog] = { total: 0, approved: 0 };
    });

    // Add application counts
    applications.forEach(app => {
      const prog = app.student_program || 'Lain-lain';
      if (!stats[prog]) stats[prog] = { total: 0, approved: 0 };
      stats[prog].total++;
      if (app.application_status === 'Diluluskan') {
        stats[prog].approved++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [applications, users]);

  // SVG Helper for simple Pie Chart
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
      <div className="flex items-center gap-3">
        <BarChart3 className="text-blue-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analisa Statistik WBL</h2>
          <p className="text-slate-500 text-sm">Visualisasi data permohonan dan penempatan secara masa nyata.</p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3">
            <GraduationCap size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Pelajar</p>
          <h3 className="text-2xl font-black text-slate-800">{users.filter(u => u.role === UserRole.STUDENT).length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-3">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penempatan Diluluskan</p>
          <h3 className="text-2xl font-black text-slate-800">{statusCounts.approved}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg w-fit mb-3">
            <Clock size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Kelulusan</p>
          <h3 className="text-2xl font-black text-slate-800">{statusCounts.pending}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
            <Building2 size={20} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syarikat Berdaftar</p>
          <h3 className="text-2xl font-black text-slate-800">{companies.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART: PIE STATUS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">Status Permohonan (%)</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative w-48 h-48">
              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
                <PieSlice startAngle={0} endAngle={statusCounts.p_approved * 3.6} color="#10b981" />
                <PieSlice 
                  startAngle={statusCounts.p_approved * 3.6} 
                  endAngle={(statusCounts.p_approved + statusCounts.p_pending) * 3.6} 
                  color="#f59e0b" 
                />
                <PieSlice 
                  startAngle={(statusCounts.p_approved + statusCounts.p_pending) * 3.6} 
                  endAngle={360} 
                  color="#ef4444" 
                />
                <circle r="0.6" cx="0" cy="0" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{statusCounts.total}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Jumlah</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Diluluskan</p>
                  <p className="text-sm font-bold text-slate-800">{statusCounts.approved} ({statusCounts.p_approved.toFixed(1)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Menunggu</p>
                  <p className="text-sm font-bold text-slate-800">{statusCounts.pending} ({statusCounts.p_pending.toFixed(1)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium leading-none">Ditolak</p>
                  <p className="text-sm font-bold text-slate-800">{statusCounts.rejected} ({statusCounts.p_rejected.toFixed(1)}%)</p>
                </div>
              </div>
            </div>
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
