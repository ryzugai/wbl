import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserActivity } from '../types';
import { StorageService } from '../services/storage';
import { Language } from '../translations';
import { 
  Activity, 
  Clock, 
  Search, 
  UserX, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  Phone, 
  Mail, 
  Users, 
  Key, 
  FileText, 
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface UserActivitiesProps {
  language: Language;
}

export const UserActivities: React.FC<UserActivitiesProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'status'>('status');
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'lecturer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'rare' | 'never'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Follow Up modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const loadData = () => {
    setActivities(StorageService.getActivities());
    setUsers(StorageService.getUsers().filter(u => u.role === UserRole.STUDENT || u.role === UserRole.LECTURER));
  };

  useEffect(() => {
    loadData();
    // Subscribe to storage changes
    const unsubscribe = StorageService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Check activity status
  const getUserStatus = (user: User) => {
    if (!user.last_login_at && !user.last_activity_at) {
      return 'never';
    }
    const lastTime = new Date(user.last_activity_at || user.last_login_at || '');
    const diffTime = Math.abs(new Date().getTime() - lastTime.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return 'rare';
    }
    return 'active';
  };

  const getDaysSinceLastActive = (user: User) => {
    const lastActive = user.last_activity_at || user.last_login_at;
    if (!lastActive) return Infinity;
    const diffTime = Math.abs(new Date().getTime() - new Date(lastActive).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = 
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.matric_no && user.matric_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.staff_id && user.staff_id.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesRole = 
          roleFilter === 'all' || 
          user.role === roleFilter;

        const status = getUserStatus(user);
        const matchesStatus = 
          statusFilter === 'all' || 
          status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const daysA = getDaysSinceLastActive(a);
        const daysB = getDaysSinceLastActive(b);

        if (sortOrder === 'desc') {
          // Most inactive first (highest days)
          return daysB - daysA;
        } else {
          // Most active first (lowest days)
          return daysA - daysB;
        }
      });
  }, [users, searchQuery, roleFilter, statusFilter, sortOrder]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const text = language === 'ms' ? act.description_ms : act.description_en;
      return (
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activities, searchQuery, language]);

  // Calculations for stats card
  const stats = useMemo(() => {
    let total = users.length;
    let active = 0;
    let rare = 0;
    let never = 0;

    users.forEach(u => {
      const status = getUserStatus(u);
      if (status === 'active') active++;
      else if (status === 'rare') rare++;
      else never++;
    });

    return { total, active, rare, never };
  }, [users]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return language === 'ms' ? 'Tiada rekod' : 'No record';
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'ms' ? 'ms-MY' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
    return 'bg-teal-50 text-teal-700 border-teal-100';
  };

  const getRoleLabel = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      return language === 'ms' ? 'Pelajar' : 'Student';
    }
    return language === 'ms' ? 'Pensyarah' : 'Lecturer';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Key size={16} className="text-emerald-600" />;
      case 'apply':
        return <FileText size={16} className="text-blue-600" />;
      case 'reply_form_upload':
      case 'offer_letter_upload':
        return <Activity size={16} className="text-indigo-600" />;
      default:
        return <Clock size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {language === 'ms' ? 'Pantauan Aktiviti & Log Masuk' : 'Activity & Login Monitoring'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ms' 
              ? 'Pantau kehadiran, log masuk, dan aktiviti terkini Pensyarah serta Pelajar.' 
              : 'Monitor attendance, logins, and latest activities of Lecturers and Students.'}
          </p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 bg-white px-4 py-2 text-slate-700 font-bold rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
        >
          <RefreshCw size={16} />
          <span>{language === 'ms' ? 'Segar Semula' : 'Refresh'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('status'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'status'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={18} />
          <span>{language === 'ms' ? 'Status Keaktifan & Log' : 'Active Status & Logins'}</span>
        </button>
        <button
          onClick={() => { setActiveTab('log'); setSearchQuery(''); }}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={18} />
          <span>{language === 'ms' ? 'Log Aktiviti Terkini' : 'Recent Activity Log'}</span>
        </button>
      </div>

      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {language === 'ms' ? 'Jumlah Pengguna' : 'Total Users'}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {language === 'ms' ? 'Aktif (< 7 hari)' : 'Active (< 7 days)'}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.active}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider animate-pulse text-amber-700">
                  {language === 'ms' ? 'Jarang Aktif (> 7 hari)' : 'Rarely Active (> 7 days)'}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.rare}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <UserX size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {language === 'ms' ? 'Belum Pernah Log Masuk' : 'Never Logged In'}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.never}</h3>
              </div>
            </div>
          </div>

          {/* Filters Area */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={language === 'ms' ? 'Cari nama, matric, staff ID...' : 'Search name, matric, staff ID...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {language === 'ms' ? 'Semua' : 'All'}
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-1.5 h-1.5 bg-current rounded-full" />
                {language === 'ms' ? 'Aktif' : 'Active'}
              </button>
              <button
                onClick={() => setStatusFilter('rare')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'rare'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-ping" />
                {language === 'ms' ? 'Jarang Aktif / Jarang Login' : 'Rarely Active'}
              </button>
              <button
                onClick={() => setStatusFilter('never')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'never'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-1.5 h-1.5 bg-current rounded-full" />
                {language === 'ms' ? 'Belum Log Masuk' : 'Never Logged In'}
              </button>
            </div>

            {/* Select Role Dropdown & Sort Order */}
            <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="all">{language === 'ms' ? 'Semua Peranan' : 'All Roles'}</option>
                <option value="student">{language === 'ms' ? 'Pelajar Sahaja' : 'Students Only'}</option>
                <option value="lecturer">{language === 'ms' ? 'Pensyarah Sahaja' : 'Lecturers Only'}</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title={language === 'ms' ? 'Turutan Keaktifan' : 'Sort by Inactivity'}
              >
                <ArrowUpDown size={16} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                    <th className="p-4">{language === 'ms' ? 'Nama / ID' : 'Name / ID'}</th>
                    <th className="p-4">{language === 'ms' ? 'Peranan' : 'Role'}</th>
                    <th className="p-4">{language === 'ms' ? 'Log Masuk Terakhir' : 'Last Login'}</th>
                    <th className="p-4">{language === 'ms' ? 'Aktiviti Terakhir' : 'Last Activity'}</th>
                    <th className="p-4">{language === 'ms' ? 'Status Keaktifan' : 'Inactivity Status'}</th>
                    <th className="p-4 text-center">{language === 'ms' ? 'Tindakan' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const status = getUserStatus(user);
                      const days = getDaysSinceLastActive(user);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <span>{user.email}</span>
                              {user.role === UserRole.STUDENT && user.matric_no && (
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono text-[10px]">{user.matric_no}</span>
                              )}
                              {user.role === UserRole.LECTURER && user.staff_id && (
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono text-[10px]">{user.staff_id}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600 text-xs">
                            {formatDate(user.last_login_at)}
                          </td>
                          <td className="p-4 font-medium text-slate-600 text-xs">
                            {formatDate(user.last_activity_at)}
                          </td>
                          <td className="p-4">
                            {status === 'active' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                {language === 'ms' ? 'Aktif' : 'Active'}
                              </span>
                            )}
                            {status === 'rare' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                {language === 'ms' ? `Sila Pantau (${days} hari)` : `Monitor (${days} days)`}
                              </span>
                            )}
                            {status === 'never' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                <span className="w-2 h-2 bg-rose-400 rounded-full" />
                                {language === 'ms' ? 'Belum Log Masuk' : 'Never Logged In'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {(status === 'rare' || status === 'never') ? (
                              <button
                                onClick={() => { setSelectedUser(user); setIsFollowUpOpen(true); }}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                              >
                                {language === 'ms' ? 'Hubungi / Susulan' : 'Follow Up'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                {language === 'ms' ? 'Selesa' : 'Ok'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        {language === 'ms' ? 'Tiada data yang sepadan dengan carian.' : 'No matching users found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={language === 'ms' ? 'Cari aktiviti, nama atau peranan...' : 'Search activities, name or role...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act) => (
                <div key={act.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{act.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeColor(act.userRole)}`}>
                        {getRoleLabel(act.userRole)}
                      </span>
                      <span className="text-slate-400 text-xs font-medium ml-auto shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
                      {language === 'ms' ? act.description_ms : act.description_en}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 italic">
                {language === 'ms' ? 'Tiada log aktiviti setakat ini.' : 'No activity logs found.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {isFollowUpOpen && selectedUser && (
        <Modal
          isOpen={isFollowUpOpen}
          onClose={() => { setIsFollowUpOpen(false); setSelectedUser(null); }}
          title={language === 'ms' ? 'Hubungi Pengguna (Susulan)' : 'Contact User (Follow Up)'}
        >
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">
                  {language === 'ms' ? 'Pantauan Keaktifan' : 'Inactivity Alert'}
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  {language === 'ms'
                    ? 'Pengguna ini dikesan kurang aktif atau belum pernah log masuk. Sila hubungi mereka untuk memastikan tiada sebarang masalah dalam mengakses sistem.'
                    : 'This user is rarely active or has never logged in. Please contact them to ensure there are no issues accessing the system.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'Nama Penuh' : 'Full Name'}</span>
                <span className="font-bold text-slate-800">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'Peranan' : 'Role'}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>
              {selectedUser.matric_no && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'No Matrik' : 'Matric No'}</span>
                  <span className="font-mono font-bold text-slate-800">{selectedUser.matric_no}</span>
                </div>
              )}
              {selectedUser.staff_id && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'No Staf' : 'Staff ID'}</span>
                  <span className="font-mono font-bold text-slate-800">{selectedUser.staff_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'Log Masuk Terakhir' : 'Last Login'}</span>
                <span className="text-slate-700 text-xs font-semibold">{formatDate(selectedUser.last_login_at)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'ms' ? 'Aktiviti Terakhir' : 'Last Activity'}</span>
                <span className="text-slate-700 text-xs font-semibold">{formatDate(selectedUser.last_activity_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`mailto:${selectedUser.email}`}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm rounded-xl transition-colors border border-blue-200"
              >
                <Mail size={18} />
                <span>{language === 'ms' ? 'Hantar Emel' : 'Send Email'}</span>
              </a>
              {selectedUser.phone ? (
                <a
                  href={`tel:${selectedUser.phone}`}
                  className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm rounded-xl transition-colors border border-emerald-200"
                >
                  <Phone size={18} />
                  <span>{selectedUser.phone}</span>
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-400 font-bold text-sm rounded-xl border border-slate-200 cursor-not-allowed">
                  <Phone size={18} />
                  <span>{language === 'ms' ? 'Tiada No Tel' : 'No Phone Number'}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setIsFollowUpOpen(false); setSelectedUser(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
              >
                {language === 'ms' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
