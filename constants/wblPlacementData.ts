export interface StudentPlacementPoint {
  id: string;
  studentId: string;
  name: string;
  matricNo: string;
  program: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  companyName: string;
  companyAddress: string;
  state: string;
  district: string;
  industry: string;
  industryTrainerName: string;
  facultySupervisorName: string;
  intake?: string;
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

// Rekod Pelajar Sebenar Aktif Kohort WBL 2026/2027 (Tiada data rekaan - 100% data pelajar asal)
export const DEFAULT_PLACED_STUDENTS: StudentPlacementPoint[] = [
  // 5 Pelajar dengan Rekod Buku Log Sebenar
  {
    id: 'student_aaron',
    studentId: '51515bde-267d-43a0-9c43-a31919d77933',
    name: 'aaron',
    matricNo: '123456',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'aaron@student.utem.edu.my',
    companyName: 'CYCLE PROCESS SDN BHD',
    companyAddress: 'Perai, Pulau Pinang',
    state: 'Pulau Pinang',
    district: 'Seberang Perai',
    industry: 'Teknologi & Kejuruteraan',
    industryTrainerName: 'En. Hisham bin Ahmad',
    facultySupervisorName: 'Fahrin',
    avatarUrl: 'https://ui-avatars.com/api/?name=Aaron&background=0284c7&color=fff&bold=true',
    mapCoordinates: { x: 92, y: 105 },
    hasFilledTodayLog: true,
    todayLogDate: '2026-10-01',
    todayLogStatus: 'verified',
    todayLogSummary: 'Analisis kestabilan pelayan dan pemantauan perkhidmatan dalam talian AWS Console.',
    todayLogHours: 8,
    todayDepartment: 'ict',
    todayTools: 'aws, docker',
    totalLogbookHours: 40,
    totalWeeksLogged: 1
  },
  {
    id: 'student_izzati',
    studentId: '0b27c9ec-d003-4043-9fac-f2162ce675ef',
    name: 'NURUL IZZATI BINTI YUSRI',
    matricNo: 'B062310215',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'izzati@student.utem.edu.my',
    companyName: 'PETRONAS Chemicals Marketing (Labuan) Ltd',
    companyAddress: 'Menara 1, Menara Berkembar PETRONAS, Kuala Lumpur',
    state: 'Kuala Lumpur',
    district: 'Kuala Lumpur',
    industry: 'Minyak & Gas / Petrokimia',
    industryTrainerName: 'Pn. Noorul Shanida binti Ahmad Fadzil',
    facultySupervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nurul+Izzati&background=059669&color=fff&bold=true',
    mapCoordinates: { x: 175, y: 255 },
    hasFilledTodayLog: true,
    todayLogDate: '2026-10-01',
    todayLogStatus: 'submitted',
    todayLogSummary: 'Menghadiri November 2026 Sales Plan Finalization Discussion dan HRPIB discussion.',
    todayLogHours: 8,
    todayDepartment: 'Reporting & Planning execution',
    todayTools: 'Microsoft Teams, Excel',
    totalLogbookHours: 32,
    totalWeeksLogged: 1
  },
  {
    id: 'student_auni',
    studentId: '8ad1aac5-d624-41c1-9607-e379b3c19e43',
    name: 'AUNI HAZIQAH BINTI HASWADI',
    matricNo: 'B062310703',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'auni@student.utem.edu.my',
    companyName: 'FERRY RICH SDN BHD',
    companyAddress: 'Melaka Tengah, Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    industry: 'Pengangkutan & Pelancongan Maritim',
    industryTrainerName: 'Pengurus Operasi FERRY RICH',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Auni+Haziqah&background=d97706&color=fff&bold=true',
    mapCoordinates: { x: 215, y: 345 },
    hasFilledTodayLog: true,
    todayLogDate: '2026-10-01',
    todayLogStatus: 'submitted',
    todayLogSummary: 'Penyelarasan pesanan jualan dan pengesahan pembayaran pelanggan.',
    todayLogHours: 8,
    todayDepartment: 'Pemasaran & Operasi',
    todayTools: 'Excel, Invoicing System',
    totalLogbookHours: 32,
    totalWeeksLogged: 1
  },
  {
    id: 'student_laila',
    studentId: '59c1517d-2bbb-449e-aaea-b4bf6386db85',
    name: 'LAILA SURAYA BT ADNAN',
    matricNo: 'B062310801',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'laila@student.utem.edu.my',
    companyName: 'FERRY RICH SDN BHD',
    companyAddress: 'Melaka Tengah, Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    industry: 'Pengangkutan & Pelancongan Maritim',
    industryTrainerName: 'Pegawai Latihan FERRY RICH',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Laila+Suraya&background=8b5cf6&color=fff&bold=true',
    mapCoordinates: { x: 228, y: 355 },
    hasFilledTodayLog: true,
    todayLogDate: '2026-09-29',
    todayLogStatus: 'submitted',
    todayLogSummary: 'Analisis SWOT ke atas pelbagai rangkaian produk syarikat dalam pasaran.',
    todayLogHours: 8,
    todayDepartment: 'Database',
    todayTools: 'Excel',
    totalLogbookHours: 16,
    totalWeeksLogged: 1
  },
  {
    id: 'student_suhaila',
    studentId: '16589537-e73b-4c9b-8c6f-1802f9a92290',
    name: 'NOOR SUHAILA BINTI MOHAMED',
    matricNo: 'B062310610',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'suhaila@student.utem.edu.my',
    companyName: 'Amtis Solution Sdn.Bhd',
    companyAddress: 'Ayer Keroh, Melaka',
    state: 'Melaka',
    district: 'Ayer Keroh',
    industry: 'Teknologi Maklumat & Perundingan',
    industryTrainerName: 'Pengurus Amtis Solution',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Noor+Suhaila&background=ec4899&color=fff&bold=true',
    mapCoordinates: { x: 205, y: 335 },
    hasFilledTodayLog: true,
    todayLogDate: '2026-09-28',
    todayLogStatus: 'submitted',
    todayLogSummary: 'Menyusun fail pentadbiran dan semakan dokumen kewangan audit tahunan.',
    todayLogHours: 8,
    todayDepartment: 'Admin',
    todayTools: 'Google Drive, Excel, Trello',
    totalLogbookHours: 8,
    totalWeeksLogged: 1
  },

  // Pelajar Aktif Kohort Lain (Status Logbook: Menunggu Pengisian / Pending)
  {
    id: 'student_putri',
    studentId: 'B062310538',
    name: 'PUTRI ZAINAB BINTI DZAINUDDIN',
    matricNo: 'B062310538',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'putri@student.utem.edu.my',
    companyName: 'C CAPITAL HOLDINGS SDN.BHD',
    companyAddress: 'Petaling Jaya, Selangor',
    state: 'Selangor',
    district: 'Petaling Jaya',
    industry: 'Pelaburan & Pengurusan Korporat',
    industryTrainerName: 'Pegawai Latihan C Capital',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Putri+Zainab&background=4f46e5&color=fff&bold=true',
    mapCoordinates: { x: 158, y: 268 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_rifaat',
    studentId: 'B062310118',
    name: "AHMAD RIFA'AT BIN ROSDI",
    matricNo: 'B062310118',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'rifaat@student.utem.edu.my',
    companyName: 'Cohu Malaysia Sdn. Bhd.',
    companyAddress: 'Batu Berendam, Melaka',
    state: 'Melaka',
    district: 'Batu Berendam',
    industry: 'Semikonduktor & Automasi Industri',
    industryTrainerName: 'Jurutera Kanan Cohu',
    facultySupervisorName: 'Dr. Mohd Guzairy bin Abd Ghani',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ahmad+Rifaat&background=0891b2&color=fff&bold=true',
    mapCoordinates: { x: 220, y: 340 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_intan',
    studentId: 'B062310578',
    name: 'INTAN NATASHA BINTI AHMAD',
    matricNo: 'B062310578',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'intan@student.utem.edu.my',
    companyName: 'PLNT PEOPLE SDN. BHD.',
    companyAddress: 'Johor Bahru, Johor',
    state: 'Johor',
    district: 'Johor Bahru',
    industry: 'Makanan & Produk Berasaskan Tumbuhan',
    industryTrainerName: 'Pengurus Operasi PLNT PEOPLE',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Intan+Natasha&background=10b981&color=fff&bold=true',
    mapCoordinates: { x: 285, y: 375 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_irsyad',
    studentId: 'B062310061',
    name: 'IRSYAD BIN AHMAD NIZAM',
    matricNo: 'B062310061',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'irsyad@student.utem.edu.my',
    companyName: 'Eddie PhotoVideo',
    companyAddress: 'Melaka Tengah, Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    industry: 'Media Digital & Fotografi Komersial',
    industryTrainerName: 'Pengarah Kreatif Eddie PhotoVideo',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Irsyad+Ahmad&background=6366f1&color=fff&bold=true',
    mapCoordinates: { x: 210, y: 350 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_norihsan',
    studentId: 'B062310620',
    name: 'NORIHSAN',
    matricNo: 'B062310620',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'norihsan@student.utem.edu.my',
    companyName: 'Prym Consumer Malaysia Sdn Bhd',
    companyAddress: 'Batu Berendam, Melaka',
    state: 'Melaka',
    district: 'Batu Berendam',
    industry: 'Pembuatan & Produk Pengguna',
    industryTrainerName: 'Pengurus Pengeluaran Prym',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Norihsan&background=f59e0b&color=fff&bold=true',
    mapCoordinates: { x: 218, y: 348 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_norashikin',
    studentId: 'B062310232',
    name: 'NORASHIKIN BINTI ABD KARIM',
    matricNo: 'B062310232',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'norashikin@student.utem.edu.my',
    companyName: 'Bintara Solution Sdn Bhd',
    companyAddress: 'Ayer Keroh, Melaka',
    state: 'Melaka',
    district: 'Ayer Keroh',
    industry: 'Penyelesaian IT & Sistem Perisian',
    industryTrainerName: 'Ketua Jurutera Perisian Bintara',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Norashikin&background=84cc16&color=fff&bold=true',
    mapCoordinates: { x: 224, y: 338 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_syahirah',
    studentId: 'B062310492',
    name: 'NUR SYAHIRAH',
    matricNo: 'B062310492',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'syahirah@student.utem.edu.my',
    companyName: 'Cabinet Hub Sdn Bhd',
    companyAddress: 'Krubong, Melaka',
    state: 'Melaka',
    district: 'Krubong',
    industry: 'Pembuatan Perabot & Rekaan Dalaman',
    industryTrainerName: 'Pengurus Operasi Cabinet Hub',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nur+Syahirah&background=14b8a6&color=fff&bold=true',
    mapCoordinates: { x: 216, y: 332 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_nazura',
    studentId: 'B062310111',
    name: 'SITI NURNAZURA',
    matricNo: 'B062310111',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'nazura@student.utem.edu.my',
    companyName: 'PLNT PEOPLE SDN. BHD.',
    companyAddress: 'Johor Bahru, Johor',
    state: 'Johor',
    district: 'Johor Bahru',
    industry: 'Makanan & Produk Berasaskan Tumbuhan',
    industryTrainerName: 'Pegawai Pemasaran PLNT PEOPLE',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Siti+Nurnazura&background=a855f7&color=fff&bold=true',
    mapCoordinates: { x: 295, y: 382 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_yixian',
    studentId: 'B062310014',
    name: 'TEOH YI XIAN',
    matricNo: 'B062310014',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'yixian@student.utem.edu.my',
    companyName: 'M ROUTE 19 WORKS SDN BHD',
    companyAddress: 'Bayan Lepas, Pulau Pinang',
    state: 'Pulau Pinang',
    district: 'Bayan Lepas',
    industry: 'Pemasaran Kreatif & Pengiklanan',
    industryTrainerName: 'Pengarah Urusan M Route 19',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Teoh+Yi+Xian&background=06b6d4&color=fff&bold=true',
    mapCoordinates: { x: 104, y: 112 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_wenhui',
    studentId: 'B062310022',
    name: 'WONG WEN HUI',
    matricNo: 'B062310022',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'wenhui@student.utem.edu.my',
    companyName: 'HONDA Malaysia Sdn Bhd',
    companyAddress: 'Alor Gajah, Melaka',
    state: 'Melaka',
    district: 'Alor Gajah',
    industry: 'Automotif & Pembuatan',
    industryTrainerName: 'Ketua Jurutera Kualiti Honda',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Wong+Wen+Hui&background=ef4444&color=fff&bold=true',
    mapCoordinates: { x: 208, y: 326 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_yanzi',
    studentId: 'B062310028',
    name: 'YAP YAN ZI',
    matricNo: 'B062310028',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'yanzi@student.utem.edu.my',
    companyName: 'Cohu Malaysia Sdn. Bhd.',
    companyAddress: 'Batu Berendam, Melaka',
    state: 'Melaka',
    district: 'Batu Berendam',
    industry: 'Semikonduktor & Automasi Industri',
    industryTrainerName: 'Pengurus Operasi Cohu',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Yap+Yan+Zi&background=3b82f6&color=fff&bold=true',
    mapCoordinates: { x: 226, y: 346 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_guofuk',
    studentId: 'B062310019',
    name: 'KER GUO FUK',
    matricNo: 'B062310019',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'guofuk@student.utem.edu.my',
    companyName: 'Penempatan Industri WBL',
    companyAddress: 'Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    industry: 'Perniagaan & Pengurusan Operasi',
    industryTrainerName: 'Jurulatih Industri',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ker+Guo+Fuk&background=64748b&color=fff&bold=true',
    mapCoordinates: { x: 212, y: 358 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_joviar',
    studentId: 'B062310052',
    name: "JOVIAR KHOR JIAN H'NG",
    matricNo: 'B062310052',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'joviar@student.utem.edu.my',
    companyName: 'Penempatan Industri WBL',
    companyAddress: 'Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    industry: 'Perniagaan & Pengurusan Operasi',
    industryTrainerName: 'Jurulatih Industri',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Joviar+Khor&background=475569&color=fff&bold=true',
    mapCoordinates: { x: 219, y: 352 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
  },
  {
    id: 'student_arif',
    studentId: 'B062310123',
    name: 'MUHAMMAD ARIF IZZUDDIN',
    matricNo: 'B062310123',
    program: 'Ijazah Sarjana Muda Teknousahawanan dengan Kepujian',
    email: 'arif@student.utem.edu.my',
    companyName: 'Penempatan Industri WBL',
    companyAddress: 'Melaka',
    state: 'Melaka',
    district: 'Ayer Keroh',
    industry: 'Perniagaan & Pengurusan Operasi',
    industryTrainerName: 'Jurulatih Industri',
    facultySupervisorName: 'Penyelia Fakulti FPTT',
    avatarUrl: 'https://ui-avatars.com/api/?name=Muhammad+Arif&background=0284c7&color=fff&bold=true',
    mapCoordinates: { x: 214, y: 342 },
    hasFilledTodayLog: false,
    todayLogDate: '',
    todayLogStatus: 'pending',
    todayLogSummary: 'Belum mengemukakan entri logbook.',
    todayLogHours: 0,
    totalLogbookHours: 0,
    totalWeeksLogged: 0
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
