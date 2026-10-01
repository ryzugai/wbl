export interface StudentPlacementPoint {
  id: string;
  studentId: string;
  name: string;
  matricNo: string;
  program: string;
  email: string;
  phone: string;
  avatarUrl: string;
  companyName: string;
  companyAddress: string;
  state: string;
  district: string;
  industry: string;
  industryTrainerName: string;
  facultySupervisorName: string;
  // Map positioning (0 to 1000 x, 0 to 500 y)
  mapCoordinates: { x: number; y: number };
  // Daily logbook tracking
  hasFilledTodayLog: boolean;
  todayLogDate: string;
  todayLogStatus: 'verified' | 'submitted' | 'pending';
  todayLogSummary?: string;
  todayLogHours?: number;
  todayDepartment?: string;
  todayTools?: string;
  totalLogbookHours: number;
  totalWeeksLogged: number;
}

export interface StateRegionInfo {
  id: string;
  name: string;
  code: string;
  capital: string;
  zone: 'Semenanjung' | 'Sabah' | 'Sarawak' | 'Wilayah';
  centerCoordinates: { x: number; y: number };
  pathData: string;
}

// Malaysian states vector paths and geographic layout (viewBox 0 0 1000 480)
// Scaled & aligned accurately for Peninsular Malaysia (West) and Borneo (East: Sabah & Sarawak)
export const MALAYSIA_STATE_PATHS: StateRegionInfo[] = [
  // SEMENANJUNG (West Malaysia)
  {
    id: 'perlis',
    name: 'Perlis',
    code: 'PLS',
    capital: 'Kangar',
    zone: 'Semenanjung',
    centerCoordinates: { x: 105, y: 36 },
    pathData: 'M 96,25 L 118,22 L 122,38 L 108,48 L 94,40 Z'
  },
  {
    id: 'kedah',
    name: 'Kedah',
    code: 'KDH',
    capital: 'Alor Setar',
    zone: 'Semenanjung',
    centerCoordinates: { x: 122, y: 68 },
    pathData: 'M 108,48 L 122,38 L 142,42 L 155,75 L 140,105 L 115,100 L 98,72 L 108,48 Z'
  },
  {
    id: 'pulau_pinang',
    name: 'Pulau Pinang',
    code: 'PNG',
    capital: 'Georgetown / Bayan Lepas',
    zone: 'Semenanjung',
    centerCoordinates: { x: 88, y: 104 },
    pathData: 'M 82,95 L 94,92 L 96,112 L 84,115 Z'
  },
  {
    id: 'perak',
    name: 'Perak',
    code: 'PRK',
    capital: 'Ipoh',
    zone: 'Semenanjung',
    centerCoordinates: { x: 135, y: 155 },
    pathData: 'M 115,100 L 140,105 L 158,118 L 165,165 L 152,210 L 128,212 L 110,165 L 115,100 Z'
  },
  {
    id: 'kelantan',
    name: 'Kelantan',
    code: 'KTN',
    capital: 'Kota Bharu',
    zone: 'Semenanjung',
    centerCoordinates: { x: 212, y: 82 },
    pathData: 'M 155,75 L 198,62 L 235,70 L 242,112 L 210,140 L 175,130 L 158,118 Z'
  },
  {
    id: 'terengganu',
    name: 'Terengganu',
    code: 'TRG',
    capital: 'Kuala Terengganu',
    zone: 'Semenanjung',
    centerCoordinates: { x: 268, y: 125 },
    pathData: 'M 235,70 L 265,95 L 292,152 L 275,185 L 242,168 L 242,112 Z'
  },
  {
    id: 'pahang',
    name: 'Pahang',
    code: 'PHG',
    capital: 'Kuantan',
    zone: 'Semenanjung',
    centerCoordinates: { x: 235, y: 220 },
    pathData: 'M 175,130 L 210,140 L 242,168 L 275,185 L 290,225 L 278,280 L 225,285 L 175,255 L 165,165 Z'
  },
  {
    id: 'selangor',
    name: 'Selangor',
    code: 'SGR',
    capital: 'Shah Alam / Petaling Jaya',
    zone: 'Semenanjung',
    centerCoordinates: { x: 160, y: 258 },
    pathData: 'M 128,212 L 152,210 L 175,255 L 168,295 L 138,292 L 132,248 Z'
  },
  {
    id: 'kuala_lumpur',
    name: 'Kuala Lumpur',
    code: 'KUL',
    capital: 'Kuala Lumpur',
    zone: 'Wilayah',
    centerCoordinates: { x: 172, y: 255 },
    pathData: 'M 166,248 L 178,248 L 180,262 L 168,262 Z'
  },
  {
    id: 'negeri_sembilan',
    name: 'Negeri Sembilan',
    code: 'NSN',
    capital: 'Seremban',
    zone: 'Semenanjung',
    centerCoordinates: { x: 195, y: 300 },
    pathData: 'M 168,295 L 198,285 L 225,285 L 222,325 L 185,330 L 172,310 Z'
  },
  {
    id: 'melaka',
    name: 'Melaka',
    code: 'MLK',
    capital: 'Bandaraya Melaka / Batu Berendam',
    zone: 'Semenanjung',
    centerCoordinates: { x: 212, y: 345 },
    pathData: 'M 185,330 L 222,325 L 235,348 L 208,368 L 192,352 Z'
  },
  {
    id: 'johor',
    name: 'Johor',
    code: 'JHR',
    capital: 'Johor Bahru / Senai',
    zone: 'Semenanjung',
    centerCoordinates: { x: 275, y: 365 },
    pathData: 'M 225,285 L 278,280 L 322,342 L 315,405 L 275,415 L 235,348 L 222,325 Z'
  },
  // EAST MALAYSIA (Borneo: Sarawak & Sabah)
  {
    id: 'sarawak',
    name: 'Sarawak',
    code: 'SWK',
    capital: 'Kuching / Bintulu / Miri',
    zone: 'Sarawak',
    centerCoordinates: { x: 610, y: 305 },
    pathData: 'M 490,380 L 525,355 L 565,368 L 595,310 L 640,270 L 695,230 L 738,198 L 748,220 L 715,260 L 675,295 L 640,350 L 585,385 L 525,410 L 490,380 Z'
  },
  {
    id: 'sabah',
    name: 'Sabah',
    code: 'SBH',
    capital: 'Kota Kinabalu / Sandakan',
    zone: 'Sabah',
    centerCoordinates: { x: 840, y: 150 },
    pathData: 'M 748,220 L 738,198 L 760,165 L 785,142 L 815,115 L 852,78 L 878,92 L 915,120 L 928,175 L 895,225 L 850,230 L 785,228 Z'
  },
  {
    id: 'labuan',
    name: 'W.P. Labuan',
    code: 'LBN',
    capital: 'Victoria',
    zone: 'Wilayah',
    centerCoordinates: { x: 765, y: 152 },
    pathData: 'M 760,148 L 770,148 L 770,158 L 760,158 Z'
  }
];

// Rich placed students data with real companies across Malaysia & daily logbook states
export const DEFAULT_PLACED_STUDENTS: StudentPlacementPoint[] = [
  {
    id: 'point_faris',
    studentId: 'student_1',
    name: 'Muhammad Faris bin Rosli',
    matricNo: 'B032110045',
    program: 'Sarjana Muda Teknousahawanan (BTEC)',
    email: 'b032110045@student.utem.edu.my',
    phone: '011-28491022',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
    companyName: 'CTRM Aerostructures Sdn Bhd',
    companyAddress: 'Kompleks CTRM, Batu Berendam, Melaka',
    state: 'Melaka',
    district: 'Batu Berendam',
    industry: 'Aeroangkasa & Pembuatan Komposit',
    industryTrainerName: 'En. Kamarul Zaman bin Harun',
    facultySupervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
    mapCoordinates: { x: 215, y: 342 },
    hasFilledTodayLog: true,
    todayLogDate: new Date().toISOString().split('T')[0],
    todayLogStatus: 'verified',
    todayLogSummary: 'Pemeriksaan integriti struktur komposit fiuslaj A350 menggunakan ujian tanpa musnah (NDT). Menyediakan ringkasan kualiti bahagian QA.',
    todayLogHours: 8,
    todayDepartment: 'Quality Assurance & Composite Assembly',
    todayTools: 'Ultrasonic Scanner, Laser Metrology, SAP ERP',
    totalLogbookHours: 240,
    totalWeeksLogged: 6
  },
  {
    id: 'point_amirul',
    studentId: 'student_amirul',
    name: 'Muhamad Amirul bin Razali',
    matricNo: 'B032110099',
    program: 'Sarjana Muda Teknousahawanan (BTEC)',
    email: 'b032110099@student.utem.edu.my',
    phone: '013-4819201',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    companyName: 'PETRONAS Digital Sdn Bhd',
    companyAddress: 'Level 18, Menara Dayabumi, Jalan Sultan Hishamuddin, Kuala Lumpur',
    state: 'Kuala Lumpur',
    district: 'Kuala Lumpur',
    industry: 'Teknologi Maklumat & Pendigitalan Tenaga',
    industryTrainerName: 'En. Azman bin Khalid',
    facultySupervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
    mapCoordinates: { x: 175, y: 252 },
    hasFilledTodayLog: true,
    todayLogDate: new Date().toISOString().split('T')[0],
    todayLogStatus: 'submitted',
    todayLogSummary: 'Membangunkan skrip automasi pengesahan data saluran paip gas berasaskan Python & Grafana. Sesi pemantauan tiket insiden harian.',
    todayLogHours: 8,
    todayDepartment: 'Enterprise Cloud & Data Engineering',
    todayTools: 'Python, Docker, Datadog, Grafana',
    totalLogbookHours: 232,
    totalWeeksLogged: 6
  },
  {
    id: 'point_aina',
    studentId: 'student_2',
    name: 'Nur Aina Farhana binti Zulkifli',
    matricNo: 'B032110078',
    program: 'Sarjana Muda Teknousahawanan (BTEC)',
    email: 'b032110078@student.utem.edu.my',
    phone: '012-9481920',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    companyName: 'Infineon Technologies (M) Sdn Bhd',
    companyAddress: 'Batu Berendam FTZ, Melaka',
    state: 'Melaka',
    district: 'Batu Berendam',
    industry: 'Semikonduktor & Automotif Mikroelektronik',
    industryTrainerName: 'Pn. Norhafizah binti Zainal',
    facultySupervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
    mapCoordinates: { x: 228, y: 356 },
    hasFilledTodayLog: true,
    todayLogDate: new Date().toISOString().split('T')[0],
    todayLogStatus: 'verified',
    todayLogSummary: 'Analisis kegagalan mikrocip automotif pada stesen pengujian bilik bersih. Penentukuran mesin pick-and-place automatik.',
    todayLogHours: 8,
    todayDepartment: 'Wafer Fab & Semiconductor Test Engineering',
    todayTools: 'Cleanroom SEM, Automated Optical Inspection',
    totalLogbookHours: 248,
    totalWeeksLogged: 6
  },
  {
    id: 'point_daniel',
    studentId: 'student_3',
    name: 'Ahmad Daniel bin Yusof',
    matricNo: 'B032110112',
    program: 'Sarjana Muda Pengurusan Teknologi (BTPM)',
    email: 'b032110112@student.utem.edu.my',
    phone: '017-3819402',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    companyName: 'Intel Technology Sdn Bhd',
    companyAddress: 'Bayan Lepas Free Industrial Zone, Pulau Pinang',
    state: 'Pulau Pinang',
    district: 'Bayan Lepas',
    industry: 'Mikropemproses & Reka Bentuk Silikon',
    industryTrainerName: 'Mr. David Tan Boon Hock',
    facultySupervisorName: 'Prof. Madya Dr. Zulkifli bin Ahmad',
    mapCoordinates: { x: 88, y: 104 },
    hasFilledTodayLog: false,
    todayLogDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    todayLogStatus: 'pending',
    todayLogSummary: 'Semakan logbook semalam: Pengujian voltan cip pemproses generasi ke-14. Hari ini belum mengemukakan entri aktiviti.',
    todayLogHours: 0,
    todayDepartment: 'Silicon Validation Labs',
    todayTools: 'Oscilloscope, Logic Analyzer, Intel Labview',
    totalLogbookHours: 200,
    totalWeeksLogged: 5
  },
  {
    id: 'point_siti',
    studentId: 'student_4',
    name: 'Siti Nurhaliza binti Kamaruddin',
    matricNo: 'B032110156',
    program: 'Sarjana Muda Teknousahawanan (BTEC)',
    email: 'b032110156@student.utem.edu.my',
    phone: '019-3829103',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
    companyName: 'Inari Amertron Berhad',
    companyAddress: 'Batu Kawan Industrial Park, Seberang Perai, Pulau Pinang',
    state: 'Pulau Pinang',
    district: 'Seberang Perai / Batu Kawan',
    industry: 'Pemasangan & Pengujian Elektronik OSAT',
    industryTrainerName: 'Pn. Salmah binti Othman',
    facultySupervisorName: 'Dr. Nor Liyana binti Sulaiman',
    mapCoordinates: { x: 102, y: 112 },
    hasFilledTodayLog: true,
    todayLogDate: new Date().toISOString().split('T')[0],
    todayLogStatus: 'verified',
    todayLogSummary: 'Pengawasan barisan pengeluaran cip frekuensi radio (RF) bagi telefon pintar 5G. Menjana laporan kawalan kualiti statistik (SPC).',
    todayLogHours: 8,
    todayDepartment: 'RF Testing & Assembly Operations',
    todayTools: 'Minitab SPC, Anritsu Spectrum Analyzer',
    totalLogbookHours: 240,
    totalWeeksLogged: 6
  }
];

export const getStudentCoordinatesByState = (stateName: string, district?: string, index: number = 0): { x: number; y: number } => {
  const normState = (stateName || '').toLowerCase().trim();
  const offsets = [
    { dx: 0, dy: 0 },
    { dx: 14, dy: 10 },
    { dx: -12, dy: 14 },
    { dx: 12, dy: -12 },
    { dx: -14, dy: -10 }
  ];
  const offset = offsets[index % offsets.length];

  if (normState.includes('melaka')) return { x: 215 + offset.dx, y: 345 + offset.dy };
  if (normState.includes('kuala lumpur') || normState.includes('kl')) return { x: 175 + offset.dx, y: 255 + offset.dy };
  if (normState.includes('selangor')) return { x: 158 + offset.dx, y: 268 + offset.dy };
  if (normState.includes('johor')) return { x: 285 + offset.dx, y: 375 + offset.dy };
  if (normState.includes('pinang') || normState.includes('penang')) return { x: 92 + offset.dx, y: 105 + offset.dy };
  if (normState.includes('perak')) return { x: 135 + offset.dx, y: 160 + offset.dy };
  if (normState.includes('kedah')) return { x: 122 + offset.dx, y: 68 + offset.dy };
  if (normState.includes('perlis')) return { x: 105 + offset.dx, y: 36 + offset.dy };
  if (normState.includes('kelantan')) return { x: 212 + offset.dx, y: 82 + offset.dy };
  if (normState.includes('terengganu')) return { x: 268 + offset.dx, y: 125 + offset.dy };
  if (normState.includes('pahang')) return { x: 235 + offset.dx, y: 220 + offset.dy };
  if (normState.includes('sembilan')) return { x: 195 + offset.dx, y: 300 + offset.dy };
  if (normState.includes('sarawak')) return { x: 550 + offset.dx, y: 370 + offset.dy };
  if (normState.includes('sabah')) return { x: 835 + offset.dx, y: 145 + offset.dy };
  if (normState.includes('labuan')) return { x: 765 + offset.dx, y: 152 + offset.dy };

  return { x: 210 + offset.dx, y: 340 + offset.dy }; // Default Melaka / UTeM
};
