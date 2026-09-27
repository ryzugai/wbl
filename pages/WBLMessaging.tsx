import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, WBLConversation, WBLMessage, ConversationType, Application } from '../types';
import { StorageService } from '../services/storage';
import { Language } from '../translations';
import { 
  MessageSquare, Send, Plus, Users, UserCheck, ShieldCheck, Building2, 
  GraduationCap, Search, CheckCheck, Clock, Phone, Mail, Sparkles, 
  ArrowLeft, RefreshCw, X, MessageCircle, AlertCircle, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WBLMessagingProps {
  currentUser: User;
  users: User[];
  applications: Application[];
  language?: Language;
  onNavigate?: (view: string) => void;
}

export const WBLMessaging: React.FC<WBLMessagingProps> = ({
  currentUser,
  users,
  applications,
  language = 'ms',
  onNavigate
}) => {
  const isTrainer = currentUser.role === UserRole.TRAINER;
  const isLecturer = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPERVISOR;
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.is_jkwbl === true || (currentUser as any).is_admin === true;

  const [conversations, setConversations] = useState<WBLConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WBLMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'direct' | 'student_trio' | 'course_group'>('all');

  // New Chat Modal states
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<ConversationType>('student_trio');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState('BTMT 3273(i)');
  const [newChatInitialMessage, setNewChatInitialMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = () => {
    try {
      const convs = StorageService.getWBLConversations(currentUser.id);
      setConversations(convs);
      if (!activeConversationId && convs.length > 0) {
        setActiveConversationId(convs[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    loadConversations();
    const unsub = StorageService.subscribe(loadConversations);
    return () => unsub();
  }, [currentUser]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const msgs = StorageService.getWBLMessages(activeConversationId);
    setMessages(msgs);
    // Mark as read
    StorageService.markConversationAsRead(activeConversationId, currentUser.id);

    const unsub = StorageService.subscribe(() => {
      if (activeConversationId) {
        setMessages(StorageService.getWBLMessages(activeConversationId));
      }
    });
    return () => unsub();
  }, [activeConversationId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      if (channelFilter !== 'all' && c.type !== channelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchStudent = c.relatedStudentName?.toLowerCase().includes(q);
        const matchLastMsg = c.lastMessageSnippet?.toLowerCase().includes(q);
        const matchParticipants = Object.values(c.participantNames || {}).some(name => name.toLowerCase().includes(q));
        if (!matchTitle && !matchStudent && !matchLastMsg && !matchParticipants) return false;
      }
      return true;
    });
  }, [conversations, channelFilter, searchQuery]);

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    try {
      await StorageService.sendWBLMessage({
        conversationId: activeConversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderStaffId: currentUser.staff_id,
        senderCompany: currentUser.company_affiliation,
        content: textToSend.trim()
      });

      if (!customText) {
        setInputText('');
      }
      loadConversations();
    } catch {
      toast.error('Gagal menghantar mesej.');
    } finally {
      setIsSending(false);
    }
  };

  // Quick preset template responses
  const quickTemplates = useMemo(() => {
    if (isTrainer) {
      return [
        'Salam Dr. & Penyelaras, prestasi pelajar minggu ini sangat memuaskan.',
        'Penilaian rubrik mingguan telah saya masukkan ke dalam sistem.',
        'Pelajar telah menyelesaikan modul latihan amali dengan jayanya.',
        'Mohon semakan tarikh lawatan pemantauan penyeliaan fakulti.'
      ];
    } else if (isLecturer) {
      return [
        'Salam En./Pn., bagaimana perkembangan kemahiran teknikal pelajar di tempat kerja?',
        'Peringatan pengisian markah rubrik penilaian industri bagi minggu ke-5.',
        'Markah rubrik industri telah saya semak dan sahkan dalam sistem.',
        'Terima kasih banyak atas bimbingan dan kerjasama pihak industri.'
      ];
    } else {
      return [
        'Peringatan mesra: Sila muktamadkan pengesahan penilaian industri sebelum tarikh tutup.',
        'Pihak jawatankuasa WBL merakamkan penghargaan atas kerjasama pihak syarikat.',
        'Semakan buku log dan penilaian pelajar telah dikemaskini.'
      ];
    }
  }, [isTrainer, isLecturer]);

  // Approved WBL students for starting a trio channel
  const approvedStudents = useMemo(() => {
    return applications.filter(a => a.application_status === 'Diluluskan' || a.student_preferred);
  }, [applications]);

  // Start new conversation
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();

    let title = '';
    const participantIds: string[] = [currentUser.id];
    const participantRoles: Record<string, UserRole> = { [currentUser.id]: currentUser.role };
    const participantNames: Record<string, string> = { [currentUser.id]: currentUser.name };
    const participantCompanies: Record<string, string> = {};
    if (currentUser.company_affiliation) {
      participantCompanies[currentUser.id] = currentUser.company_affiliation;
    }

    let relatedStudentId: string | undefined;
    let relatedStudentName: string | undefined;
    let relatedStudentMatric: string | undefined;
    let relatedCourseCode: string | undefined;

    if (newChatType === 'student_trio') {
      const studentApp = approvedStudents.find(a => a.student_id === selectedStudentId || a.id === selectedStudentId);
      if (!studentApp) {
        toast.error('Sila pilih pelajar penempatan.');
        return;
      }

      relatedStudentId = studentApp.student_id;
      relatedStudentName = studentApp.student_name;
      relatedStudentMatric = studentApp.student_id;
      relatedCourseCode = 'BTMT 3273(i)';
      title = `Perbincangan Pelatih - ${studentApp.student_name} (${studentApp.company_name})`;

      // Find Trainer
      const trainerUser = users.find(u => 
        u.role === UserRole.TRAINER && 
        u.company_affiliation && 
        studentApp.company_name && 
        u.company_affiliation.toLowerCase().includes(studentApp.company_name.toLowerCase())
      );
      if (trainerUser) {
        participantIds.push(trainerUser.id);
        participantRoles[trainerUser.id] = UserRole.TRAINER;
        participantNames[trainerUser.id] = trainerUser.name;
        participantCompanies[trainerUser.id] = trainerUser.company_affiliation || studentApp.company_name;
      }

      // Find Supervisor
      const supervisorUser = users.find(u => 
        (u.id === studentApp.faculty_supervisor_id || (u.name && studentApp.faculty_supervisor_name && u.name === studentApp.faculty_supervisor_name))
      );
      if (supervisorUser) {
        participantIds.push(supervisorUser.id);
        participantRoles[supervisorUser.id] = UserRole.SUPERVISOR;
        participantNames[supervisorUser.id] = supervisorUser.name;
        participantCompanies[supervisorUser.id] = 'FPTT UTeM';
      }

      // Always include Coordinator
      const coordUser = users.find(u => u.role === UserRole.COORDINATOR || u.username === 'coordinator');
      if (coordUser && !participantIds.includes(coordUser.id)) {
        participantIds.push(coordUser.id);
        participantRoles[coordUser.id] = UserRole.COORDINATOR;
        participantNames[coordUser.id] = coordUser.name;
        participantCompanies[coordUser.id] = 'Penyelaras WBL FPTT';
      }
    } else if (newChatType === 'direct') {
      const recipient = users.find(u => u.id === selectedRecipientId);
      if (!recipient) {
        toast.error('Sila pilih penerima.');
        return;
      }
      participantIds.push(recipient.id);
      participantRoles[recipient.id] = recipient.role;
      participantNames[recipient.id] = recipient.name;
      if (recipient.company_affiliation) {
        participantCompanies[recipient.id] = recipient.company_affiliation;
      }
      title = `${recipient.name} & ${currentUser.name}`;
    } else {
      title = `Penyelarasan Kursus [${selectedCourseCode}] - WBL`;
      relatedCourseCode = selectedCourseCode;
      // Add lecturers and coordinator
      users.filter(u => u.role === UserRole.COORDINATOR || u.role === UserRole.LECTURER).forEach(u => {
        if (!participantIds.includes(u.id)) {
          participantIds.push(u.id);
          participantRoles[u.id] = u.role;
          participantNames[u.id] = u.name;
        }
      });
    }

    try {
      const conv = await StorageService.createWBLConversation({
        type: newChatType,
        title,
        participantIds,
        participantRoles,
        participantNames,
        participantCompanies,
        relatedStudentId,
        relatedStudentName,
        relatedStudentMatric,
        relatedCourseCode,
        lastMessageSnippet: newChatInitialMessage ? newChatInitialMessage.slice(0, 70) : 'Perbualan baharu dimulakan.',
        lastMessageAt: new Date().toISOString(),
        lastSenderName: currentUser.name
      });

      if (newChatInitialMessage.trim()) {
        await StorageService.sendWBLMessage({
          conversationId: conv.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          senderStaffId: currentUser.staff_id,
          senderCompany: currentUser.company_affiliation,
          content: newChatInitialMessage.trim()
        });
      }

      setIsNewChatModalOpen(false);
      setNewChatInitialMessage('');
      setActiveConversationId(conv.id);
      loadConversations();
      toast.success(language === 'ms' ? 'Perbualan baharu berjaya dibuka!' : 'New conversation created!');
    } catch {
      toast.error('Gagal memulakan perbualan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/30 rounded-xl text-amber-300">
              <MessageSquare size={18} />
            </span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              {language === 'ms' ? 'Pusat Komunikasi & Permesejan Tiga Pihak WBL' : 'Three-Way WBL Communication Center'}
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            {language === 'ms' 
              ? 'Permesejan Jurulatih Industri • Penyelia Fakulti • Penyelaras WBL' 
              : 'Messaging Hub for Industry Trainers, Faculty Supervisors & Coordinators'}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            {language === 'ms'
              ? 'Platform interaksi rasmi untuk menyelaraskan bimbingan pelatih, pengesahan buku log, penilaian prestasi rubrik, dan jadual lawatan pemantauan secara berpusat.'
              : 'Direct collaborative messaging to synchronize intern supervision, rubric assessments, and industry visits.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            <span>{language === 'ms' ? '+ Mulakan Mesej / Saluran Baharu' : '+ New Message'}</span>
          </button>
        </div>
      </div>

      {/* Main Messaging Interface Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT PANE: CONVERSATION LIST (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search & Channel Filters */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ms' ? 'Cari perbualan, pelatih, atau nama...' : 'Search chat...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  channelFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('student_trio')}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  channelFilter === 'student_trio'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Trio Pelatih
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('direct')}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  channelFilter === 'direct'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mesej Terus
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('course_group')}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  channelFilter === 'course_group'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kursus
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageCircle size={28} className="mx-auto opacity-30" />
                <p className="text-xs font-semibold">
                  {language === 'ms' ? 'Tiada perbualan ditemui' : 'No conversations found'}
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === activeConversationId;
                const isTrio = conv.type === 'student_trio';
                const isGroup = conv.type === 'course_group';

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/80 bg-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isTrio
                          ? 'bg-amber-100 text-amber-800'
                          : isGroup
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isTrio ? <Users size={18} /> : isGroup ? <GraduationCap size={18} /> : conv.title.charAt(0)}
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs truncate font-black ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {conv.title}
                        </h4>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(conv.lastMessageAt).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {conv.relatedStudentName && (
                        <div className="text-[10px] text-indigo-700 font-semibold truncate flex items-center gap-1">
                          <span>Pelatih:</span>
                          <span className="underline">{conv.relatedStudentName}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 truncate leading-tight">
                        {conv.lastSenderName && <strong className="text-slate-700 font-semibold">{conv.lastSenderName.split(' ')[0]}: </strong>}
                        {conv.lastMessageSnippet || 'Mulakan perbualan...'}
                      </p>

                      {/* Participant tags preview */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {Object.values(conv.participantRoles || {}).map((role, rIdx) => (
                          <span key={rIdx} className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                            {role === UserRole.TRAINER ? '🏢 Jurulatih' : role === UserRole.SUPERVISOR || role === UserRole.LECTURER ? '👨‍🏫 Pensyarah' : '🛡️ Penyelaras'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: ACTIVE CHAT THREAD (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white h-full min-h-[600px]">
          {activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      activeConversation.type === 'student_trio'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : activeConversation.type === 'course_group'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    }`}>
                      {activeConversation.type === 'student_trio' 
                        ? 'Saluran Trio Pelatih' 
                        : activeConversation.type === 'course_group' 
                        ? 'Penyelarasan Kursus' 
                        : 'Mesej Terus'}
                    </span>
                    {activeConversation.relatedCourseCode && (
                      <span className="font-mono text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {activeConversation.relatedCourseCode}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-sm text-slate-900">
                    {activeConversation.title}
                  </h3>

                  {/* Active Participants Display with Role Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-0.5">
                    {Object.entries(activeConversation.participantNames || {}).map(([pId, pName]) => {
                      const pRole = activeConversation.participantRoles?.[pId] || UserRole.LECTURER;
                      const pCompany = activeConversation.participantCompanies?.[pId];
                      return (
                        <span key={pId} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                          <span>
                            {pRole === UserRole.TRAINER ? '🏢' : pRole === UserRole.SUPERVISOR || pRole === UserRole.LECTURER ? '👨‍🏫' : '🛡️'}
                          </span>
                          <strong className="text-slate-800">{pName}</strong>
                          {pCompany && <span className="text-slate-400">({pCompany})</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeConversationId) {
                        setMessages(StorageService.getWBLMessages(activeConversationId));
                      }
                    }}
                    className="p-2 text-slate-500 hover:bg-white rounded-lg border border-slate-200"
                    title="Segarkan Mesej"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Timeline */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare size={36} className="mx-auto opacity-30 text-indigo-400" />
                    <p className="text-xs font-bold text-slate-600">
                      {language === 'ms' ? 'Belum ada mesej dalam saluran ini.' : 'No messages in this chat yet.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {language === 'ms' ? 'Mulakan perbincangan bimbingan WBL di bawah.' : 'Send a message below to start.'}
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === currentUser.id;
                    const isMsgTrainer = msg.senderRole === UserRole.TRAINER;
                    const isMsgSupervisor = msg.senderRole === UserRole.SUPERVISOR || msg.senderRole === UserRole.LECTURER;

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 max-w-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Sender info if not me */}
                        {!isMe && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-1">
                            <span className="font-bold text-slate-800">{msg.senderName}</span>
                            <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] ${
                              isMsgTrainer 
                                ? 'bg-amber-100 text-amber-800' 
                                : isMsgSupervisor 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {isMsgTrainer ? '🏢 Jurulatih Industri' : isMsgSupervisor ? '👨‍🏫 Penyelia Fakulti' : '🛡️ Penyelaras'}
                            </span>
                            {msg.senderCompany && (
                              <span className="text-slate-400 truncate max-w-[150px]">• {msg.senderCompany}</span>
                            )}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-xs' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>

                        {/* Timestamp & Read Checkmark */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1 font-mono">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span title="Dihantar" className="text-indigo-600 font-bold">
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Preset Response Pills */}
              <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Balas Pantas:</span>
                </span>
                {quickTemplates.map((tpl, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => handleSendMessage(tpl)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors border border-slate-200"
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <textarea
                    rows={2}
                    placeholder={language === 'ms' ? 'Tuliskan mesej anda di sini... (Tekan Enter untuk hantar)' : 'Type your message...'}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 shrink-0"
                    title="Hantar Mesej"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <MessageSquare size={48} className="opacity-20 text-indigo-400" />
              <h4 className="text-base font-bold text-slate-700">
                {language === 'ms' ? 'Pilih atau Mulakan Perbualan' : 'Select or Start a Chat'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                {language === 'ms' 
                  ? 'Pilih perbualan di sebelah kiri atau klik "+ Mulakan Mesej / Saluran Baharu" untuk berhubung dengan pihak industri dan universiti.' 
                  : 'Select a conversation from the left or create a new chat.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MULAKAN PERBUALAN / SALURAN BAHARU                                */}
      {/* ========================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/30 rounded-xl text-amber-300">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h3 className="font-black text-base">
                    {language === 'ms' ? 'Mulakan Saluran Perbualan WBL' : 'Start New WBL Discussion'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {language === 'ms' ? 'Pilih jenis perbincangan dan peserta terlibat' : 'Select discussion type and participants'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="p-6 space-y-4 text-xs">
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {language === 'ms' ? 'Jenis Saluran Permesejan:' : 'Channel Type:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChatType('student_trio')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      newChatType === 'student_trio'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-black shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Users size={16} className={newChatType === 'student_trio' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-[11px]">Trio Pelatih</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChatType('direct')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      newChatType === 'direct'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-black shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <UserCheck size={16} className={newChatType === 'direct' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-[11px]">Mesej Terus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChatType('course_group')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      newChatType === 'course_group'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-black shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <GraduationCap size={16} className={newChatType === 'course_group' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-[11px]">Kursus WBL</span>
                  </button>
                </div>
              </div>

              {/* Trio Channel: Pick Student */}
              {newChatType === 'student_trio' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {language === 'ms' ? 'Pilih Pelajar Penempatan WBL:' : 'Select Student Trainee:'}
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- {language === 'ms' ? 'Pilih Pelajar' : 'Select Student'} --</option>
                    {approvedStudents.map(s => (
                      <option key={s.id} value={s.student_id || s.id}>
                        {s.student_name} ({s.student_id}) - {s.company_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    💡 Sistem akan memasukkan secara automatik: <strong>Jurulatih Industri Syarikat</strong>, <strong>Penyelia Fakulti Pelajar</strong>, dan <strong>Penyelaras WBL</strong> ke dalam perbincangan ini.
                  </p>
                </div>
              )}

              {/* Direct: Pick Recipient */}
              {newChatType === 'direct' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {language === 'ms' ? 'Pilih Rakan Perbualan:' : 'Select Recipient:'}
                  </label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- {language === 'ms' ? 'Pilih Pengguna' : 'Select User'} --</option>
                    {users.filter(u => u.id !== currentUser.id && (u.role === UserRole.TRAINER || u.role === UserRole.LECTURER || u.role === UserRole.COORDINATOR || u.role === UserRole.SUPERVISOR)).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === UserRole.TRAINER ? `Jurulatih - ${u.company_affiliation || 'Industri'}` : u.role === UserRole.COORDINATOR ? 'Penyelaras WBL' : 'Pensyarah/Penyelia'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Group: Pick Course */}
              {newChatType === 'course_group' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {language === 'ms' ? 'Pilih Kursus WBL:' : 'Select Course:'}
                  </label>
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="BTMT 3273(i)">BTMT 3273(i) - Keusahawanan Digital</option>
                    <option value="BTMT 3283(i)">BTMT 3283(i) - Pemasaran Digital & E-Dagang</option>
                    <option value="BTMI 3113(i)">BTMI 3113(i) - Teknologi Pembuatan & Automasi</option>
                    <option value="BTMI 3123(i)">BTMI 3123(i) - Pengurusan Rangkaian Bekalan & Logistik</option>
                  </select>
                </div>
              )}

              {/* Initial Message */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {language === 'ms' ? 'Mesej Pengenalan / Pertama:' : 'First Message:'}
                </label>
                <textarea
                  rows={3}
                  placeholder={language === 'ms' ? 'Tuliskan pesanan pertama untuk memulakan perbualan...' : 'Write initial message...'}
                  value={newChatInitialMessage}
                  onChange={(e) => setNewChatInitialMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {language === 'ms' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{language === 'ms' ? 'Buka Perbualan' : 'Start Chat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
