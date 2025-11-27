
import React from 'react';
import { Application, Company, User, UserRole } from '../types';
import { Users, Building2, Clock, CheckCircle2, GraduationCap, BookOpen, Briefcase } from 'lucide-react';

interface DashboardProps {
  applications: Application[];
  companies: Company[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ applications, companies, users }) => {
  const pending = applications.filter(a => a.application_status === 'Menunggu').length;
  const approved = applications.filter(a => a.application_status === 'Diluluskan').length;

  // User Statistics
  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
  const totalLecturers = users.filter(u => u.role === UserRole.LECTURER).length;
  const totalIndustryStaff = users.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.SUPERVISOR).length;

  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-4 rounded-lg ${bgClass}`}>
        <Icon className={colorClass} size={28} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
      
      {/* User Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Jumlah Pelajar" 
          value={totalStudents} 
          icon={GraduationCap} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
        <StatCard 
          label="Jumlah Pensyarah" 
          value={totalLecturers} 
          icon={BookOpen} 
          colorClass="text-teal-600" 
          bgClass="bg-teal-50"
        />
        <StatCard 
          label="Jumlah Staf Industri" 
          value={totalIndustryStaff} 
          icon={Briefcase} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50"
        />
      </div>

      {/* System Stats Row */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Status Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
            label="Jumlah Permohonan" 
            value={applications.length} 
            icon={Users} 
            colorClass="text-blue-600" 
            bgClass="bg-blue-50"
            />
            <StatCard 
            label="Jumlah Syarikat" 
            value={companies.length} 
            icon={Building2} 
            colorClass="text-purple-600" 
            bgClass="bg-purple-50"
            />
            <StatCard 
            label="Menunggu Kelulusan" 
            value={pending} 
            icon={Clock} 
            colorClass="text-yellow-600" 
            bgClass="bg-yellow-50"
            />
            <StatCard 
            label="Telah Diluluskan" 
            value={approved} 
            icon={CheckCircle2} 
            colorClass="text-green-600" 
            bgClass="bg-green-50"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Status Permohonan Terkini</h3>
          {applications.length > 0 ? (
            <div className="space-y-4">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100">
                  <div>
                    <p className="font-medium text-slate-800">{app.student_name}</p>
                    <p className="text-xs text-slate-500">{app.company_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    app.application_status === 'Diluluskan' ? 'bg-green-100 text-green-700' :
                    app.application_status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {app.application_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Tiada permohonan terkini.</p>
          )}
        </div>

        <div className="bg-blue-600 p-6 rounded-xl shadow-md text-white">
            <h3 className="font-bold text-lg mb-2">Selamat Datang ke WBL System</h3>
            <p className="text-blue-100 mb-6">Sistem pengurusan latihan industri yang efisien.</p>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-sm">Sila pastikan semua maklumat pelajar dan syarikat dikemaskini sebelum membuat permohonan.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
