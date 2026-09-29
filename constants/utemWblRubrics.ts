export interface WeeklyAssessmentArea {
  id: number;
  title: string;
  description?: string;
}

export interface SectorAdaptationExample {
  sector: 'perkhidmatan' | 'pembarangan' | 'perdagangan' | 'pembuatan' | 'universal';
  sectorName: string;
  icon: string;
  applicationGuide: string;
  examples: string[];
  areaInterpretations?: {
    area1: string;
    area2: string;
    area3: string;
  };
}

export interface WeeklyAssessmentConfig {
  week: number;
  semesterWeek?: number;
  semesterWeekLabel?: string;
  courseCode: string;
  courseName: string;
  cloStatement: string;
  taskTitle: string;
  taskHighlights: string[];
  areas: WeeklyAssessmentArea[];
  maxMarks: number; // 12
  startDate?: string;
  endDate?: string;
  milestone?: string;
  sectorGuides?: SectorAdaptationExample[];
}

export interface RubricCriterionLevel {
  score: number; // 1, 2, 3, 4
  label: string; // Lemah, Sederhana, Baik, Cemerlang
  description: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  maxScore: number; // usually 4
  clo?: string;
  levels: {
    1: string; // Lemah / Tidak Memuaskan
    2: string; // Sederhana / Kurang Memuaskan
    3: string; // Baik / Memuaskan
    4: string; // Cemerlang
  };
}

export interface CourseAssessmentPart {
  partCode: string; // Bahagian A, B, C, D, E
  partTitle: string;
  evaluator: 'JI' | 'TPF' | 'JI & TPF';
  weightagePercent: number; // e.g. 40%, 30%, 20%, 10%
  description: string;
  criteria: RubricCriterion[];
}

export interface CoursePortfolioScheme {
  courseCode: string;
  courseName: string;
  creditHours: number;
  evaluatorRatio: string; // e.g. "JI: 60% | TPF: 40%"
  jiTotalPercent: number;
  tpfTotalPercent: number;
  componentsSummary: {
    no: number;
    componentName: string;
    domain: string;
    clo: string;
    plo: string;
    evaluator: string;
    weightPercent: number;
  }[];
  parts: CourseAssessmentPart[];
}

// =========================================================================
// 1. OFFICIAL WEEKLY ASSESSMENTS (WEEKS 1 - 5) AS PER UTeM ATTACHMENT
// =========================================================================

export const UTEM_WEEKLY_ASSESSMENTS: Record<string, WeeklyAssessmentConfig[]> = {
  'BTMT 3273(i)': [
    {
      week: 1,
      semesterWeek: 6,
      semesterWeekLabel: 'Minggu 6 (Semester) / M1 (Modul)',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      milestone: 'Modul 2 (Minggu 6 - 10)',
      courseCode: 'BTMT 3273',
      courseName: 'DIGITAL ENTREPRENEURSHIP',
      cloStatement: 'CLO 3: Propose a unique digital business model (PLO8, P7, C5)',
      taskTitle: 'MINGGU 6 (02 Nov - 06 Nov 2026): Digital Business Ecosystem & Regulations (M1)',
      taskHighlights: [
        'Explore the digital business ecosystem, startup models, and economic landscape at the placement firm',
        'Review legal and ethical frameworks in e-commerce',
        'Conduct a digital audit of existing business operations'
      ],
      areas: [
        { id: 1, title: 'Explore the digital business ecosystem, startup models, and economic landscape at the placement firm' },
        { id: 2, title: 'Review legal and ethical frameworks in e-commerce' },
        { id: 3, title: 'Conduct a digital audit of existing business operations' }
      ],
      maxMarks: 12
    },
    {
      week: 2,
      semesterWeek: 7,
      semesterWeekLabel: 'Minggu 7 (Semester) / M2 (Modul)',
      startDate: '2026-11-09',
      endDate: '2026-11-13',
      milestone: 'Modul 2 (Minggu 6 - 10)',
      courseCode: 'BTMT 3273',
      courseName: 'DIGITAL ENTREPRENEURSHIP',
      cloStatement: 'CLO 3: Propose a unique digital business model (PLO8, P7, C5)',
      taskTitle: 'MINGGU 7 (09 Nov - 13 Nov 2026): Digital Business Model Canvas (BMC) & UVP (M2)',
      taskHighlights: [
        'Develop a Digital Business Model Canvas (Digital BMC) draft for the firm',
        'Design value propositions for digital markets and customer segmentation',
        'Establish monetization strategies and strategic partnerships in e-business'
      ],
      areas: [
        { id: 1, title: 'Develop a Digital Business Model Canvas (Digital BMC) draft for the firm' },
        { id: 2, title: 'Design value propositions for digital markets and customer segmentation' },
        { id: 3, title: 'Establish monetization strategies and strategic partnerships in e-business' }
      ],
      maxMarks: 12
    },
    {
      week: 3,
      semesterWeek: 8,
      semesterWeekLabel: 'Minggu 8 (Semester) / M3 (Modul)',
      startDate: '2026-11-16',
      endDate: '2026-11-20',
      milestone: 'Modul 2 (Minggu 6 - 10)',
      courseCode: 'BTMT 3273',
      courseName: 'DIGITAL ENTREPRENEURSHIP',
      cloStatement: 'CLO 3: Propose a unique digital business model (PLO8, P7, C5)',
      taskTitle: 'MINGGU 8 (16 Nov - 20 Nov 2026): Social Media Marketing & Creative Copywriting (M3)',
      taskHighlights: [
        'Implement social media marketing strategies (Facebook, Instagram, TikTok, YouTube)',
        'Produce creative copywriting and visual content for digital advertising',
        'Manage brand engagement and community building'
      ],
      areas: [
        { id: 1, title: 'Implement social media marketing strategies (Facebook, Instagram, TikTok, YouTube)' },
        { id: 2, title: 'Produce creative copywriting and visual content for digital advertising' },
        { id: 3, title: 'Manage brand engagement and community building' }
      ],
      maxMarks: 12
    },
    {
      week: 4,
      semesterWeek: 9,
      semesterWeekLabel: 'Minggu 9 (Semester) / M4 (Modul)',
      startDate: '2026-11-23',
      endDate: '2026-11-27',
      milestone: 'Modul 2 (Minggu 6 - 10)',
      courseCode: 'BTMT 3273',
      courseName: 'DIGITAL ENTREPRENEURSHIP',
      cloStatement: 'CLO 3: Propose a unique digital business model (PLO8, P7, C5)',
      taskTitle: 'MINGGU 9 (23 Nov - 27 Nov 2026): E-Marketplace Operations & Customer Fulfillment (M4)',
      taskHighlights: [
        'Manage e-marketplace stores and cross-border e-commerce operations',
        'Integrate payment gateways and ensure transaction security',
        'Handle customer engagement, order fulfillment, and omnichannel service (WhatsApp/Telegram)'
      ],
      areas: [
        { id: 1, title: 'Manage e-marketplace stores and cross-border e-commerce operations' },
        { id: 2, title: 'Integrate payment gateways and ensure transaction security' },
        { id: 3, title: 'Handle customer engagement, order fulfillment, and omnichannel service (WhatsApp/Telegram)' }
      ],
      maxMarks: 12
    },
    {
      week: 5,
      semesterWeek: 10,
      semesterWeekLabel: 'Minggu 10 (Semester) / M5 (Modul)',
      startDate: '2026-11-30',
      endDate: '2026-12-04',
      milestone: 'Modul 2 (Minggu 6 - 10)',
      courseCode: 'BTMT 3273',
      courseName: 'DIGITAL ENTREPRENEURSHIP',
      cloStatement: 'CLO 3: Propose a unique digital business model (PLO8, P7, C5)',
      taskTitle: 'MINGGU 10 (30 Nov - 04 Dis 2026): Final Assessment, Digital Project Report & Comprehensive Presentation (M5)',
      taskHighlights: [
        'Measure and analyze digital business performance metrics and ROI',
        'Prepare final digital entrepreneurship project report and joint assessment presentation (Viva)',
        'Final verification by Industry Coach (JI) and Faculty Supervisor (TPF)'
      ],
      areas: [
        { id: 1, title: 'Comprehensive presentation and defense of digital entrepreneurship project and model' },
        { id: 2, title: 'Quality, depth and accuracy of final digital project report documentation' },
        { id: 3, title: 'Professionalism, ethics and overall industrial performance across 5 weeks' }
      ],
      maxMarks: 12
    }
  ],

  'BTMU 2103(i)': [
    {
      week: 1,
      semesterWeek: 1,
      semesterWeekLabel: 'Minggu 1 (Semester) / M1 (Modul)',
      startDate: '2026-09-28',
      endDate: '2026-10-02',
      milestone: 'Modul 1 (Minggu 1 - 5)',
      courseCode: 'BTMU 2103',
      courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
      cloStatement: 'CLO 3: Evaluate effective operational systems utilizing all available resources (PLO9, A5, C3F)',
      taskTitle: 'MINGGU 1 (28 Sep - 02 Okt 2026): Susun Atur Fasiliti Operasi & Analisis Aliran Proses Kerja (Operations Facility Layout & Process Flow Analysis)',
      taskHighlights: [
        'Memetakan susun atur ruang operasi & fasiliti tempat kerja (pejabat perkhidmatan, stor barangan, hab gudang/logistik, atau lantai operasi)',
        'Menganalisis aliran proses kerja (workflow) dari pesanan/input sehingga penyerahan produk atau perkhidmatan siap (Value Stream Mapping / Service Blueprint)',
        'Mengenal pasti stesen kerja kritikal, titik sentuh operasi/pelanggan (touchpoints), dan prinsip aliran lancar bebas sekatan'
      ],
      areas: [
        { id: 1, title: 'Pemetaan susun atur fasiliti operasi (ruang kerja/stor/kaunter/gudang) dan reka bentuk ruang kerja yang ergonomik serta efisien' },
        { id: 2, title: 'Analisis aliran proses kerja (workflow) dari penerimaan pesanan/input sehingga penyerahan produk atau perkhidmatan akhir' },
        { id: 3, title: 'Pengecaman stesen kerja kritikal, titik sentuh operasi/pelanggan, dan pematuhan prinsip aliran lancar' }
      ],
      sectorGuides: [
        {
          sector: 'perkhidmatan',
          sectorName: 'Perkhidmatan (Services - IT, Perundingan, Perbankan, Agensi, Hospitaliti)',
          icon: '🏢',
          applicationGuide: 'Fokus kepada Service Blueprint, susun atur ruang kerja/kaunter pelanggan, dan aliran pemprosesan tiket, dokumen atau tugasan digital.',
          examples: ['Memetakan perjalanan pelanggan (Customer Journey) di kaunter/portal', 'Aliran semakan & kelulusan dokumen tanpa kelewatan', 'Susun atur ergonomik stesen kerja staf sokongan pelanggan'],
          areaInterpretations: {
            area1: 'Susun atur ruang pejabat/kaunter servis pelanggan dan ergonomik stesen kerja staf sokongan digital/fizikal',
            area2: 'Pemetaan Service Blueprint dan aliran proses tiket permohonan/projek dari penerimaan sehingga kelulusan akhir',
            area3: 'Pengecaman titik sentuh pelanggan (customer touchpoints) dan pematuhan aliran interaksi bebas gangguan'
          }
        },
        {
          sector: 'pembarangan',
          sectorName: 'Pembarangan (Merchandising / Stor / Runcit / FMCG)',
          icon: '🏪',
          applicationGuide: 'Fokus kepada susunan rak jualan (planogram), reka bentuk ruang stor barangan, aliran penerimaan stok masuk dan paparan jualan.',
          examples: ['Pelan susun atur lantai jualan dan pergerakan pelanggan', 'Aliran pemindahan stok dari stor belakang ke rak jualan', 'Pengecaman zon barangan panas (high-traffic merchandising zones)'],
          areaInterpretations: {
            area1: 'Susun atur lantai jualan (planogram), zon peragaan barangan dan reka bentuk ruang stor simpanan',
            area2: 'Aliran pemindahan stok barangan masuk dari dok penerimaan sehingga dipamerkan di rak jualan',
            area3: 'Pengecaman zon jualan panas, kelancaran laluan troli/pelanggan dan titik sentuh kaunter juruwang'
          }
        },
        {
          sector: 'perdagangan',
          sectorName: 'Perdagangan & Pengedaran (Trade / Commerce / Pemborongan / Logistik)',
          icon: '💼',
          applicationGuide: 'Fokus kepada susun atur hab gudang transit, zon pembungkusan, laluan logistik pemunggahan dan aliran pemprosesan pesanan.',
          examples: ['Susun atur kawasan pengambilan pesanan (order picking layout)', 'Aliran penerimaan kargo dari pembekal sehingga pelepasan penghantaran', 'Laluan pantas barangan keluar-masuk (cross-docking route)'],
          areaInterpretations: {
            area1: 'Susun atur hab gudang pengedaran, zon penyimpanan palet dan stesen pembungkusan kargo',
            area2: 'Aliran proses pemenuhan pesanan (order picking, packing, dispatch) dari tempahan sehingga pengedaran',
            area3: 'Pengecaman zon pemunggahan kritikal, laluan pantas cross-docking dan keselamatan trafik armada'
          }
        },
        {
          sector: 'pembuatan',
          sectorName: 'Pembuatan & Kejuruteraan (Manufacturing / Production)',
          icon: '🏭',
          applicationGuide: 'Fokus kepada susun atur sel pengeluaran kilang, aliran bahan mentah ke barangan siap, dan interaksi mesin-operator.',
          examples: ['Susun atur sel berbentuk U atau barisan pemasangan', 'Analisis Value Stream Mapping bahan mentah ke produk siap', 'Pengecaman stesen kerja kritikal dan zon keselamatan kilang'],
          areaInterpretations: {
            area1: 'Susun atur lantai kilang (cellular/line layout), ruang kerja mesin dan zon keselamatan ergonomik',
            area2: 'Pemetaan aliran proses nilai (Value Stream Mapping) dari bahan mentah sehingga pemasangan produk siap',
            area3: 'Pengecaman stesen kerja kekangan mesin dan pematuhan prinsip aliran lancar bahan dalam proses'
          }
        }
      ],
      maxMarks: 12
    },
    {
      week: 2,
      semesterWeek: 2,
      semesterWeekLabel: 'Minggu 2 (Semester) / M2 (Modul)',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      milestone: 'Modul 1 (Minggu 1 - 5)',
      courseCode: 'BTMU 2103',
      courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
      cloStatement: 'CLO 3: Evaluate effective operational systems utilizing all available resources (PLO9, A5, C3F)',
      taskTitle: 'MINGGU 2 (05 Okt - 09 Okt 2026): Perancangan Kapasiti Sumber & Penjadualan Operasi (Capacity Planning & Operational Scheduling)',
      taskHighlights: [
        'Menganalisis perancangan kapasiti sumber manusia, sistem/peralatan operasi, dan peruntukan beban kerja mengikut unjuran permintaan firma',
        'Menilai penjadualan operasi, agihan giliran tugas/syif kerja, dan kaedah ramalan permintaan perkhidmatan atau barangan niaga',
        'Menilai pengurusan masa operasi harian, masa kitaran (cycle/lead time), dan produktiviti operasi firma'
      ],
      areas: [
        { id: 1, title: 'Analisis perancangan kapasiti sumber (tenaga kerja, sistem digital/peralatan, dan ruang operasi) mengikut permintaan pasaran' },
        { id: 2, title: 'Penjadualan operasi kerja, giliran tugas staf/syif, dan ketepatan masa pemenuhan pesanan atau perkhidmatan' },
        { id: 3, title: 'Pengurusan masa operasi, kawalan masa kitaran (lead time) dan kecekapan penyelesaian tugasan harian' }
      ],
      sectorGuides: [
        {
          sector: 'perkhidmatan',
          sectorName: 'Perkhidmatan (Services - IT, Perundingan, Perbankan, Agensi)',
          icon: '🏢',
          applicationGuide: 'Fokus kepada kapasiti perunding/staf teknikal, pengurusan masa menunggu klien, penjadualan janji temu, dan pemenuhan tempahan.',
          examples: ['Mengimbangi nisbah pegawai kaunter dengan jumlah pelanggan waktu puncak', 'Penjadualan syif meja bantuan sokongan IT/pelanggan', 'Pengurangan masa pemprosesan permohonan/tiket pelanggan'],
          areaInterpretations: {
            area1: 'Perancangan kapasiti bilangan staf perunding/eksekutif servis mengikut lonjakan tiket/pelanggan',
            area2: 'Penjadualan syif meja bantuan, penetapan janji temu klien dan ketepatan masa pemenuhan servis',
            area3: 'Kawalan masa penyelesaian (Service Level Agreement - SLA), masa menunggu giliran dan kecekapan harian'
          }
        },
        {
          sector: 'pembarangan',
          sectorName: 'Pembarangan (Merchandising / Runcit / FMCG / Stor)',
          icon: '🏪',
          applicationGuide: 'Fokus kepada had muatan stok stor, kapasiti juruwang waktu puncak, dan unjuran keperluan barangan musim promosi.',
          examples: ['Penjadualan waktu penerimaan lori bekalan di dermaga pemunggahan', 'Perancangan kapasiti juruwang semasa hujung minggu/kempen jualan', 'Unjuran kuantiti stok barangan laris bagi mengelakkan ketiadaan stok'],
          areaInterpretations: {
            area1: 'Perancangan kapasiti ruang simpanan stor, kuota juruwang aktif dan unjuran keperluan stok jualan promosi',
            area2: 'Penjadualan syif kaunter juruwang dan waktu ketibaan lori pembekal di dermaga penerimaan stor',
            area3: 'Masa kitaran pemunggahan stok sehingga susun atur di rak jualan dan pengurangan masa beratur pelanggan'
          }
        },
        {
          sector: 'perdagangan',
          sectorName: 'Perdagangan & Pengedaran (Trade / Commerce / Logistik / Borong)',
          icon: '💼',
          applicationGuide: 'Fokus kepada keupayaan pemprosesan pesanan harian (order fulfillment capacity), peruntukan armada logistik, dan jadual pemuatan.',
          examples: ['Pengiraan volum maksimum pesanan boleh diproses sehari (order throughput)', 'Penjadualan laluan lori penghantaran mengikut zon geografi', 'Perancangan sumber gudang mengikut ramalan permintaan eksport/import'],
          areaInterpretations: {
            area1: 'Perancangan had kapasiti pemprosesan pesanan harian (order throughput) dan saiz muatan ruang kontena/lori',
            area2: 'Penjadualan masa pemuatan kargo, agihan zon penghantaran dan giliran staf logistik gudang',
            area3: 'Kawalan masa kitaran pemprosesan pesanan (order-to-delivery lead time) dan ketepatan masa penghantaran'
          }
        },
        {
          sector: 'pembuatan',
          sectorName: 'Pembuatan & Kejuruteraan (Manufacturing / Production)',
          icon: '🏭',
          applicationGuide: 'Fokus kepada kapasiti mesin dan operator, penjadualan kelompok pengeluaran (batch scheduling), dan pengiraan utilization rate.',
          examples: ['Perancangan jam operasi mesin dan penyelenggaraan berkala', 'Penjadualan giliran operator syif pagi dan petang', 'Pengiraan masa kitaran pengeluaran produk bagi memenuhi kuota'],
          areaInterpretations: {
            area1: 'Perancangan kapasiti mesin (OEE), keseimbangan barisan kerja (line balancing) dan operator syif kilang',
            area2: 'Penjadualan kelompok pengeluaran (master production schedule) dan giliran syif operasi kerja berjadual',
            area3: 'Kawalan masa kitaran (cycle/takt time), pengurangan masa henti mesin dan pencapaian kuota harian'
          }
        }
      ],
      maxMarks: 12
    },
    {
      week: 3,
      semesterWeek: 3,
      semesterWeekLabel: 'Minggu 3 (Semester) / M3 (Modul)',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      milestone: 'Modul 1 (Minggu 1 - 5)',
      courseCode: 'BTMU 2103',
      courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
      cloStatement: 'CLO 3: Evaluate effective operational systems utilizing all available resources (PLO9, A5, C3F)',
      taskTitle: 'MINGGU 3 (12 Okt - 16 Okt 2026): Operasi Ramping, 5S & Penghapusan Pembaziran (Lean Operations, 5S & Waste Elimination)',
      taskHighlights: [
        'Melaksanakan amalan atau audit 5S (Sisih, Susun, Sapu, Seragam, Sentiasa Amal) di ruang kerja fizikal, stor, kaunter, atau sistem digital firma',
        'Mengenal pasti dan menghapuskan pembaziran operasi (Wastes/Muda) seperti masa menunggu, kerja berulang (rework), lebihan stok, dan proses lewah',
        'Mengaplikasikan prinsip Kaizen (penambahbaikan berterusan), visual management, dan sistem aliran kerja lancar (Just-In-Time / Pull System)'
      ],
      areas: [
        { id: 1, title: 'Pelaksanaan audit dan amalan organisasi tempat kerja 5S yang kemas, selamat, dan teratur di ruang kerja firma' },
        { id: 2, title: 'Keupayaan mengenal pasti dan mengurangkan pembaziran operasi (masa menunggu, kesilapan dokumen/proses, lewah kerja, atau lebihan stok)' },
        { id: 3, title: 'Aplikasi kaedah penambahbaikan berterusan (Kaizen) dan visual management/Kanban untuk kelancaran operasi' }
      ],
      sectorGuides: [
        {
          sector: 'perkhidmatan',
          sectorName: 'Perkhidmatan (Services - IT, Perundingan, Agensi, Bank)',
          icon: '🏢',
          applicationGuide: '5S sistem fail/komputer, visual management papan tugasan (Trello/Kanban), penghapusan pembaziran langkah birokrasi dan masa menunggu.',
          examples: ['5S pangkalan data dokumen dan storan digital', 'Penghapusan kerja berulang (rework) akibat kesilapan borang pelanggan', 'Pelaksanaan papan visual status perkhidmatan klien secara masa nyata'],
          areaInterpretations: {
            area1: 'Amalan 5S sistem fail digital/komputer, organisasi ruang kerja pejabat dan susun atur borang/peralatan servis',
            area2: 'Mengenal pasti dan menghapuskan pembaziran langkah birokrasi, kerja berulang (rework) dokumen dan masa menunggu kelulusan',
            area3: 'Aplikasi papan status tugasan visual (Kanban/Trello) dan penambahbaikan berterusan (Kaizen) perkhidmatan'
          }
        },
        {
          sector: 'pembarangan',
          sectorName: 'Pembarangan (Merchandising / Runcit / FMCG / Stor)',
          icon: '🏪',
          applicationGuide: '5S stor simpanan & label harga, penyingkiran barangan rosak/luput (dead stock), dan sistem pengisian stok berterusan (Kanban shelf replenishment).',
          examples: ['Label kod bar dan tagging lokasi barangan yang jelas di stor', 'Pemisahan segera barangan rosak/luput daripada ruang jualan aktif', 'Papan tanda visual zon kategori barangan untuk memudahkan pelanggan & staf'],
          areaInterpretations: {
            area1: 'Amalan 5S ruang stor barangan, zon pelabelan harga dan susunan rak jualan yang kemas serta selamat',
            area2: 'Penghapusan pembaziran kerosakan barangan, penyingkiran barangan lapuk/mati (dead stock) dan lewah simpanan',
            area3: 'Sistem visual amaran kehabisan stok, papan kawalan stor dan sistem pengisian semula rak jualan (shelf Kanban)'
          }
        },
        {
          sector: 'perdagangan',
          sectorName: 'Perdagangan & Pengedaran (Trade / Commerce / Logistik)',
          icon: '💼',
          applicationGuide: '5S kawasan pembungkusan barangan, pengurangan pergerakan pembaziran staf dalam gudang, dan sistem pesanan berasaskan tarikan pelanggan (pull order).',
          examples: ['Penyusunan alatan pembungkusan di stesen kerja secara teratur', 'Pengurangan laluan berpatah balik staf semasa mengambil barangan (pick-path optimization)', 'Kad arahan kerja visual untuk penghantaran berkembar'],
          areaInterpretations: {
            area1: 'Amalan 5S stesen pembungkusan kargo, pelabelan palet dan kebersihan serta ketenteraman laluan gudang',
            area2: 'Pengurangan pergerakan pembaziran pekerja (pick-path optimization), lebihan bahan pembungkusan dan kesilapan resit',
            area3: 'Penggunaan kad kerja visual, papan pemantauan status lori pengedaran dan sistem pesanan berasaskan tarikan pelanggan'
          }
        },
        {
          sector: 'pembuatan',
          sectorName: 'Pembuatan & Kejuruteraan (Manufacturing / Production)',
          icon: '🏭',
          applicationGuide: '5S lantai kilang, penyingkiran 7 Muda (pergerakan, lebihan inventori, kecacatan, masa menunggu, overproduction), dan Kanban JIT.',
          examples: ['Garis sempadan keselamatan dan pelabelan perkakasan di stesen mesin', 'Pengurangan inventori kerja dalam proses (WIP reduction)', 'Kaizen berpasukan untuk mempercepat masa pertukaran alatan (setup time)'],
          areaInterpretations: {
            area1: 'Pelaksanaan audit 5S lantai operasi kilang, penandaan sempadan keselamatan dan susunan alat kerja mesin',
            area2: 'Pengecaman dan penghapusan 7 pembaziran pembuatan (Muda: kerja berulang, inventori WIP berlebihan, masa henti)',
            area3: 'Pelaksanaan sistem kad Kanban JIT, visual management papan andon dan amalan Kaizen berpasukan'
          }
        }
      ],
      maxMarks: 12
    },
    {
      week: 4,
      semesterWeek: 4,
      semesterWeekLabel: 'Minggu 4 (Semester) / M4 (Modul)',
      startDate: '2026-10-19',
      endDate: '2026-10-23',
      milestone: 'Modul 1 (Minggu 1 - 5)',
      courseCode: 'BTMU 2103',
      courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
      cloStatement: 'CLO 3: Evaluate effective operational systems utilizing all available resources (PLO9, A5, C3F)',
      taskTitle: 'MINGGU 4 (19 Okt - 23 Okt 2026): Kawalan Kualiti, Pengurusan Inventori & Penyelesaian Kekangan (Quality Control, Inventory & Bottleneck Resolution)',
      taskHighlights: [
        'Melibatkan diri dalam jaminan kualiti operasi (TQM), pematuhan Prosedur Operasi Standard (SOP) dan kawalan standard kualiti output perkhidmatan/barangan',
        'Menjalankan pemantauan kawalan inventori/stok, semakan ralat atau ketepatan pesanan, dan pengurusan pembekal',
        'Menganalisis sistem giliran (queueing system) dan mengenal pasti penyelesaian bagi mengatasi kekangan/kesesakan (operational bottlenecks)'
      ],
      areas: [
        { id: 1, title: 'Pematuhan piawaian kualiti, SOP organisasi, dan pengesanan ralat/kecacatan operasi secara sistematik' },
        { id: 2, title: 'Pengurusan inventori, kawalan rekod stok/data, dan ketepatan pemenuhan keperluan pelanggan atau rakan niaga' },
        { id: 3, title: 'Analisis sistem giliran dan cadangan praktikal bagi menyelesaikan kesesakan/kelewatan (bottlenecks) operasi' }
      ],
      sectorGuides: [
        {
          sector: 'perkhidmatan',
          sectorName: 'Perkhidmatan (Services - IT, Perundingan, Agensi, Bank)',
          icon: '🏢',
          applicationGuide: 'Pematuhan Service Level Agreement (SLA), audit semakan kepuasan pelanggan, analisis kesesakan meja perkhidmatan (service bottleneck).',
          examples: ['Memantau kadar pematuhan SLA masa maklum balas pelanggan', 'Menganalisis punca kelewatan pengesahan peringkat pengurusan', 'Menyusun semula aliran kerja bagi melancarkan proses giliran tiket aduan'],
          areaInterpretations: {
            area1: 'Pematuhan standard kualiti perkhidmatan (SLA), semakan ralat dokumen dan audit kepuasan pelanggan',
            area2: 'Pengurusan inventori alatan pejabat/pangkalan data dan ketepatan pemfailan maklumat pelanggan',
            area3: 'Analisis sistem giliran pelanggan (kaunter/tiket) dan penyelesaian kesesakan (bottleneck) kelulusan'
          }
        },
        {
          sector: 'pembarangan',
          sectorName: 'Pembarangan (Merchandising / Runcit / FMCG / Stor)',
          icon: '🏪',
          applicationGuide: 'Pemeriksaan kualiti barangan masuk (receiving inspection), pengurusan stok penampan (safety stock), dan penyelesaian kesesakan kaunter bayaran.',
          examples: ['Pemeriksaan fizikal bungkusan dan tarikh luput barangan pembekal', 'Kawalan stok minimum dan amaran pesanan semula automatik', 'Pengaktifan kaunter bayaran ekspres semasa barisan pelanggan panjang'],
          areaInterpretations: {
            area1: 'Pemeriksaan kualiti penerimaan barangan pembekal, semakan tarikh luput dan integriti bungkusan',
            area2: 'Kawalan stok penampan (safety stock), pengiraan tahap pesanan semula (ROP) dan audit stok POS',
            area3: 'Analisis masa menunggu barisan pelanggan di kaunter juruwang dan pengaktifan kaunter pantas'
          }
        },
        {
          sector: 'perdagangan',
          sectorName: 'Perdagangan & Pengedaran (Trade / Commerce / Logistik)',
          icon: '💼',
          applicationGuide: 'Semakan ketepatan invois dan barangan keluar (dispatch accuracy audit), pengurusan inventori transit, dan analisis kesesakan kontena/logistik.',
          examples: ['Audit kadar ketepatan pesanan barangan pelanggan (Order Accuracy Rate)', 'Pengurusan dokumentasi kastam dan insurans penghantaran', 'Penyelesaian kelewatan pemunggahan di pintu gudang logistik'],
          areaInterpretations: {
            area1: 'Audit ketepatan pesanan keluar (order accuracy audit), pematuhan piawaian pembungkusan dan semakan dokumen',
            area2: 'Kawalan inventori transit kargo, rekod sistem pengurusan gudang (WMS) dan audit ketepatan stok',
            area3: 'Analisis kesesakan pemunggahan di pintu gudang dan penyelarasan jadual ketibaan lori pengedaran'
          }
        },
        {
          sector: 'pembuatan',
          sectorName: 'Pembuatan & Kejuruteraan (Manufacturing / Production)',
          icon: '🏭',
          applicationGuide: 'Kawalan proses statistik (SPC), pemeriksaan kecacatan produk akhir, pengiraan Economic Order Quantity (EOQ), dan bottleneck mesin.',
          examples: ['Penggunaan carta kawalan kualiti dan senarai semak kecacatan', 'Pengiraan kuantiti pesanan ekonomi bahan mentah utama', 'Penyelarasan semula aliran pengeluaran bagi mengelakkan mesin penumpukan'],
          areaInterpretations: {
            area1: 'Kawalan kualiti statistik (SPC), pemeriksaan kecacatan produk mengikut spesifikasi toleransi',
            area2: 'Pengiraan kuantiti pesanan ekonomi (EOQ), pengurusan inventori bahan mentah dan stok penampan',
            area3: 'Analisis kekangan stesen mesin penumpukan (Theory of Constraints / Line Balancing) bagi memaksimumkan output'
          }
        }
      ],
      maxMarks: 12
    },
    {
      week: 5,
      semesterWeek: 5,
      semesterWeekLabel: 'Minggu 5 (Semester) / M5 (Modul)',
      startDate: '2026-10-26',
      endDate: '2026-10-30',
      milestone: 'Modul 1 (Minggu 1 - 5)',
      courseCode: 'BTMU 2103',
      courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
      cloStatement: 'CLO 3: Evaluate effective operational systems utilizing all available resources (PLO9, A5, C3F)',
      taskTitle: 'MINGGU 5 (26 Okt - 30 Okt 2026): Penilaian Akhir, Laporan Kajian Kes Operasi & Pembentangan (Final Operational Assessment & Comprehensive Report)',
      taskHighlights: [
        'Mensintesis keseluruhan dapatan penilaian operasi industri (susun atur, kapasiti, kecekapan lean, dan kawalan kualiti) di firma penempatan',
        'Menyediakan laporan kajian kes penambahbaikan operasi firma yang komprehensif disokong data sebenar tempat kerja',
        'Membentangkan hasil projek operasi dan cadangan penambahbaikan sistem di hadapan Jurulatih Industri dan Pensyarah Kursus'
      ],
      areas: [
        { id: 1, title: 'Pembentangan dan pembelaan hasil projek penambahbaikan sistem operasi firma secara profesional' },
        { id: 2, title: 'Kualiti, ketelitian dan kesahihan dokumentasi laporan kajian kes operasi industri merentasi 5 minggu' },
        { id: 3, title: 'Profesionalisme, etika kerja, disiplin dan komitmen sepanjang tempoh penilaian operasi industri' }
      ],
      sectorGuides: [
        {
          sector: 'perkhidmatan',
          sectorName: 'Perkhidmatan (Services - IT, Perundingan, Agensi, Bank)',
          icon: '🏢',
          applicationGuide: 'Laporan dan pembentangan akhir merumuskan impak penambahbaikan Service Blueprint, pengurangan masa respons klien, kecekapan aliran kerja digital dan kepuasan pelanggan.',
          examples: ['Laporan kajian kes penambahbaikan aliran tiket perkhidmatan & kepuasan klien', 'Slaid pembentangan impak pengurangan masa pemprosesan perkhidmatan', 'Refleksi etika kerahsiaan dan cadangan penambahbaikan berterusan'],
          areaInterpretations: {
            area1: 'Pembentangan projek penambahbaikan aliran perkhidmatan, Service Blueprint dan impak kepuasan pelanggan secara profesional',
            area2: 'Ketelitian laporan kajian kes operasi perkhidmatan lengkap berserta bukti data masa respon (SLA) dan analisis sebelum vs selepas',
            area3: 'Profesionalisme, pematuhan kerahsiaan data klien, disiplin waktu kerja dan etika perundingan'
          }
        },
        {
          sector: 'pembarangan',
          sectorName: 'Pembarangan (Merchandising / Runcit / FMCG / Stor)',
          icon: '🏪',
          applicationGuide: 'Laporan dan pembentangan akhir merumuskan keberkesanan pelan susun atur jualan (planogram), pengurangan pembaziran stok luput, kelancaran aliran juruwang dan peningkatan jualan.',
          examples: ['Laporan kajian kes pengoptimuman susun atur rak jualan & pengurusan stok stor', 'Pembentangan visual sebelum vs selepas pelaksanaan 5S stor dan rak jualan', 'Refleksi disiplin, khidmat pelanggan runcit dan inisiatif operasi jualan'],
          areaInterpretations: {
            area1: 'Pembentangan projek penambahbaikan susun atur jualan runcit, pembarangan visual dan pengurusan stor di hadapan panel',
            area2: 'Dokumentasi laporan kajian kes operasi stor/jualan yang kemas disokong rekod pusingan inventori dan data jualan',
            area3: 'Profesionalisme, integriti pengendalian stok barangan, disiplin kehadiran dan ketepatan masa di lantai jualan'
          }
        },
        {
          sector: 'perdagangan',
          sectorName: 'Perdagangan & Pengedaran (Trade / Commerce / Logistik)',
          icon: '💼',
          applicationGuide: 'Laporan dan pembentangan akhir merumuskan peningkatan keupayaan pemprosesan pesanan (throughput), ketepatan inventori transit, kelajuan penghantaran dan penjimatan kos operasi logistik.',
          examples: ['Laporan kajian kes pemendekan masa pemenuhan pesanan gudang logistik', 'Pembentangan pelan susun atur hab transit dan pengoptimuman laluan lori pengedaran', 'Refleksi etika perdagangan, pematuhan regulatori dan komitmen operasi'],
          areaInterpretations: {
            area1: 'Pembentangan hasil projek pengoptimuman aliran pengedaran, ketepatan pesanan dan logistik perdagangan secara meyakinkan',
            area2: 'Laporan kajian kes komprehensif mengandungi metrik pemenuhan pesanan harian, analisis kos logistik dan carta alir gudang',
            area3: 'Profesionalisme, akauntabiliti terhadap barangan niaga, kepatuhan piawaian keselamatan logistik dan integriti perdagangan'
          }
        },
        {
          sector: 'pembuatan',
          sectorName: 'Pembuatan & Kejuruteraan (Manufacturing / Production)',
          icon: '🏭',
          applicationGuide: 'Laporan dan pembentangan akhir merumuskan penjimatan kos pengeluaran, penghapusan pembaziran 5S/Lean, peningkatan OEE mesin dan kawalan kecacatan produk kilang.',
          examples: ['Laporan kajian kes pengurangan kecacatan produk dan pengimbangan barisan mesin (line balancing)', 'Pembentangan slaid teknikal impak pelaksanaan Lean/Kaizen terhadap kuota harian', 'Refleksi amalan keselamatan industri (OSHA) dan etika kejuruteraan pembuatan'],
          areaInterpretations: {
            area1: 'Pembentangan projek teknikal operasi kilang, analisis penambahbaikan OEE dan penjimatan kos pengeluaran',
            area2: 'Kualiti laporan kajian kes teknikal lengkap dengan data statistik kualiti (SPC), analisis VSM dan cadangan kejuruteraan',
            area3: 'Pematuhan piawaian OSHA/keselamatan industri, disiplin kerja syif kilang dan etika kejuruteraan profesional'
          }
        },
        {
          sector: 'universal',
          sectorName: 'Semua Sektor (Perkhidmatan, Pembarangan, Perdagangan, Pembuatan)',
          icon: '🌐',
          applicationGuide: 'Laporan dan pembentangan akhir merumuskan impak penambahbaikan operasi terhadap kecekapan, pengurangan kos/pembaziran, dan kepuasan pelanggan firma.',
          examples: ['Laporan komprehensif kajian kes operasi firma dengan analisis sebelum vs selepas', 'Slaid pembentangan profesional di hadapan Jurulatih Industri & Pensyarah', 'Refleksi pengalaman amali operasi dan cadangan kesinambungan bagi firma'],
          areaInterpretations: {
            area1: 'Pembentangan dan pembelaan hasil projek penambahbaikan sistem operasi firma secara profesional',
            area2: 'Kualiti, ketelitian dan kesahihan dokumentasi laporan kajian kes operasi industri merentasi 5 minggu',
            area3: 'Profesionalisme, etika kerja, disiplin dan komitmen sepanjang tempoh penilaian operasi industri'
          }
        }
      ],
      maxMarks: 12
    }
  ],

  'BTMT 3283(i)': [
    {
      week: 1,
      semesterWeek: 11,
      semesterWeekLabel: 'Minggu 11 (Semester) / M1 (Modul)',
      startDate: '2026-12-07',
      endDate: '2026-12-11',
      milestone: 'Modul 3 (Minggu 11 - 15)',
      courseCode: 'BTMT 3283',
      courseName: 'BUSINESS ANALYTICS',
      cloStatement: 'CLO 3: Propose alternative actions for decision making (PLO8, A2/A3, C5)',
      taskTitle: 'MINGGU 11 (07 Dis - 11 Dis 2026): Data Extraction & Business Problem Framing (M1)',
      taskHighlights: [
        'Identify business problems and scope within the industrial placement firm',
        'Extract raw data sources and execute data cleaning (data wrangling)',
        'Ensure data governance and quality control standards'
      ],
      areas: [
        { id: 1, title: 'Identify business problems and scope within the industrial placement firm' },
        { id: 2, title: 'Extract raw data sources and execute data cleaning (data wrangling)' },
        { id: 3, title: 'Ensure data governance and quality control standards' }
      ],
      maxMarks: 12
    },
    {
      week: 2,
      semesterWeek: 12,
      semesterWeekLabel: 'Minggu 12 (Semester) / M2 (Modul)',
      startDate: '2026-12-14',
      endDate: '2026-12-18',
      milestone: 'Modul 3 (Minggu 11 - 15)',
      courseCode: 'BTMT 3283',
      courseName: 'BUSINESS ANALYTICS',
      cloStatement: 'CLO 3: Propose alternative actions for decision making (PLO8, A2/A3, C5)',
      taskTitle: 'MINGGU 12 (14 Dis - 18 Dis 2026): Exploratory Data Analysis (EDA) & Descriptive Statistics (M2)',
      taskHighlights: [
        'Execute Exploratory Data Analysis (EDA) using analytics software (Excel/Python/SPSS)',
        'Summarize descriptive statistics and operational patterns',
        'Apply statistical tools for business decisions'
      ],
      areas: [
        { id: 1, title: 'Execute Exploratory Data Analysis (EDA) using analytics software (Excel/Python/SPSS)' },
        { id: 2, title: 'Summarize descriptive statistics and operational patterns' },
        { id: 3, title: 'Apply statistical tools for business decisions' }
      ],
      maxMarks: 12
    },
    {
      week: 3,
      semesterWeek: 13,
      semesterWeekLabel: 'Minggu 13 (Semester) / M3 (Modul)',
      startDate: '2026-12-21',
      endDate: '2026-12-25',
      milestone: 'Modul 3 (Minggu 11 - 15)',
      courseCode: 'BTMT 3283',
      courseName: 'BUSINESS ANALYTICS',
      cloStatement: 'CLO 3: Propose alternative actions for decision making (PLO8, A2/A3, C5)',
      taskTitle: 'MINGGU 13 (21 Dis - 25 Dis 2026): Predictive Modeling & Decision-Making Tools (M3)',
      taskHighlights: [
        'Develop predictive models or optimization models to evaluate sales/inventory efficiency',
        'Apply forecasting methods for business performance projections',
        'Validate and test analytics models'
      ],
      areas: [
        { id: 1, title: 'Develop predictive models or optimization models to evaluate sales/inventory efficiency' },
        { id: 2, title: 'Apply forecasting methods for business performance projections' },
        { id: 3, title: 'Validate and test analytics models' }
      ],
      maxMarks: 12
    },
    {
      week: 4,
      semesterWeek: 14,
      semesterWeekLabel: 'Minggu 14 (Semester) / M4 (Modul)',
      startDate: '2026-12-28',
      endDate: '2027-01-01',
      milestone: 'Modul 3 (Minggu 11 - 15)',
      courseCode: 'BTMT 3283',
      courseName: 'BUSINESS ANALYTICS',
      cloStatement: 'CLO 3: Propose alternative actions for decision making (PLO8, A2/A3, C5)',
      taskTitle: 'MINGGU 14 (28 Dis 2026 - 01 Jan 2027): Dashboard Visualization & Prescriptive Insights (M4)',
      taskHighlights: [
        'Build visual dashboards (e.g., Power BI) for management review',
        'Translate data insights into strategic prescriptive recommendations',
        'Communicate data stories effectively to stakeholders'
      ],
      areas: [
        { id: 1, title: 'Build visual dashboards (e.g., Power BI) for management review' },
        { id: 2, title: 'Translate data insights into strategic prescriptive recommendations' },
        { id: 3, title: 'Communicate data stories effectively to stakeholders' }
      ],
      maxMarks: 12
    },
    {
      week: 5,
      semesterWeek: 15,
      semesterWeekLabel: 'Minggu 15 (Semester) / M5 (Modul)',
      startDate: '2027-01-04',
      endDate: '2027-01-08',
      milestone: 'Modul 3 (Minggu 11 - 15)',
      courseCode: 'BTMT 3283',
      courseName: 'BUSINESS ANALYTICS',
      cloStatement: 'CLO 3: Propose alternative actions for decision making (PLO8, A2/A3, C5)',
      taskTitle: 'MINGGU 15 (04 Jan - 08 Jan 2027): Final Assessment, Analytics Report & Comprehensive Presentation (M5)',
      taskHighlights: [
        'Synthesize overall business analytics project findings and model verification',
        'Prepare final case study report and joint assessment presentation (Viva)',
        'Final verification by Industry Coach (JI) and Faculty Supervisor (TPF)'
      ],
      areas: [
        { id: 1, title: 'Comprehensive presentation and defense of business analytics project and model' },
        { id: 2, title: 'Quality, depth and accuracy of final analytics case study report documentation' },
        { id: 3, title: 'Professionalism, ethics and overall industrial performance across 5 weeks' }
      ],
      maxMarks: 12
    }
  ],

  'BTMT 2113(i)': [
    {
      week: 1,
      semesterWeek: 16,
      semesterWeekLabel: 'Minggu 16 (Semester) / M1 (Modul)',
      startDate: '2027-01-11',
      endDate: '2027-01-15',
      milestone: 'Modul 4 (Minggu 16 - 20)',
      courseCode: 'BTMT 2113',
      courseName: 'BRAND MANAGEMENT',
      cloStatement: 'CLO 3: Propose brand portfolio strategies for corporate and product branding (PLO8, A1, C5)',
      taskTitle: 'MINGGU 16 (11 Jan - 15 Jan 2027): Brand and Brand Management for a New Entrepreneurial Venture (M1)',
      taskHighlights: [
        "Find the company's profile and brand",
        "Explain the importance of the company's brand",
        "Find the company's branding challenges & opportunities"
      ],
      areas: [
        { id: 1, title: "Find the company's profile and brand" },
        { id: 2, title: "Explain the importance of the company's brand" },
        { id: 3, title: "Find the company's branding challenges & opportunities" }
      ],
      maxMarks: 12
    },
    {
      week: 2,
      semesterWeek: 17,
      semesterWeekLabel: 'Minggu 17 (Semester) / M2 (Modul)',
      startDate: '2027-01-18',
      endDate: '2027-01-22',
      milestone: 'Modul 4 (Minggu 16 - 20)',
      courseCode: 'BTMT 2113',
      courseName: 'BRAND MANAGEMENT',
      cloStatement: 'CLO 3: Propose brand portfolio strategies for corporate and product branding (PLO8, A1, C5)',
      taskTitle: 'MINGGU 17 (18 Jan - 22 Jan 2027): Choosing Brand Elements & Developing Brand Equity Measurement Systems (M2)',
      taskHighlights: [
        'Pick an example of criteria of brand elements used at your place (e.g., name, logo, and color schemes)',
        'Identify a brand equity management system at your workplace',
        'Implement brand tracking studies (brand building initiatives based on consumer and business impact)'
      ],
      areas: [
        { id: 1, title: 'Pick an example of criteria of brand elements used at your workplace' },
        { id: 2, title: 'Identify a brand equity management system at your workplace' },
        { id: 3, title: 'Implement brand tracking studies and evaluate business/consumer impact' }
      ],
      maxMarks: 12
    },
    {
      week: 3,
      semesterWeek: 18,
      semesterWeekLabel: 'Minggu 18 (Semester) / M3 (Modul)',
      startDate: '2027-01-25',
      endDate: '2027-01-29',
      milestone: 'Modul 4 (Minggu 16 - 20)',
      courseCode: 'BTMT 2113',
      courseName: 'BRAND MANAGEMENT',
      cloStatement: 'CLO 3: Propose brand portfolio strategies for corporate and product branding (PLO8, A1, C5)',
      taskTitle: 'MINGGU 18 (25 Jan - 29 Jan 2027): Branding in Digital Era: Application of Technology & Brand Management (M3)',
      taskHighlights: [
        'Define key issues and brand engagement',
        'Identify digital communications',
        'Analyze the Pros and Cons of paid channels'
      ],
      areas: [
        { id: 1, title: 'Define key issues and brand engagement in digital channels' },
        { id: 2, title: 'Identify digital communications and tools used by the firm' },
        { id: 3, title: 'Analyze the Pros and Cons of paid channels utilized in marketing' }
      ],
      maxMarks: 12
    },
    {
      week: 4,
      semesterWeek: 19,
      semesterWeekLabel: 'Minggu 19 (Semester) / M4 (Modul)',
      startDate: '2027-02-01',
      endDate: '2027-02-05',
      milestone: 'Modul 4 (Minggu 16 - 20)',
      courseCode: 'BTMT 2113',
      courseName: 'BRAND MANAGEMENT',
      cloStatement: 'CLO 3: Propose brand portfolio strategies for corporate and product branding (PLO8, A1, C5)',
      taskTitle: 'MINGGU 19 (01 Feb - 05 Feb 2027): Integrating Marketing Communications (IMC), Brand Extensions & Portfolio Strategies (M4)',
      taskHighlights: [
        'Suggest/develop New Product and Brand Extensions',
        'Implement Brand Architecture Strategies',
        'Measure the results of Integrating Marketing Communications (IMC) programs to build brand equity'
      ],
      areas: [
        { id: 1, title: 'Suggest/develop New Product and Brand Extensions' },
        { id: 2, title: 'Implement Brand Architecture Strategies' },
        { id: 3, title: 'Measure the results of Integrating Marketing Communications (IMC) programs' }
      ],
      maxMarks: 12
    },
    {
      week: 5,
      semesterWeek: 20,
      semesterWeekLabel: 'Minggu 20 (Semester) / M5 (Modul)',
      startDate: '2027-02-08',
      endDate: '2027-02-12',
      milestone: 'Modul 4 (Minggu 16 - 20)',
      courseCode: 'BTMT 2113',
      courseName: 'BRAND MANAGEMENT',
      cloStatement: 'CLO 3: Propose brand portfolio strategies for corporate and product branding (PLO8, A1, C5)',
      taskTitle: 'MINGGU 20 (08 Feb - 12 Feb 2027): Final Assessment, Presentation & Comprehensive Portfolio Submission (M5)',
      taskHighlights: [
        'Synthesize overall WBL brand management project findings',
        'Prepare final case study report and joint assessment presentation (Viva)',
        'Final verification by Industry Coach (JI) and Faculty Supervisor (TPF)'
      ],
      areas: [
        { id: 1, title: 'Comprehensive presentation and defense of brand strategy project' },
        { id: 2, title: 'Quality, depth and accuracy of final case study report documentation' },
        { id: 3, title: 'Professionalism, ethics and overall industrial performance across 5 weeks' }
      ],
      maxMarks: 12
    }
  ],

  // Course 5: BTMU 4084(i) Final Year Project II (PSM II) - 20 Minggu Bermula 28 September 2026
  'BTMU 4084(i)': [
    {
      week: 1,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-09-28',
      endDate: '2026-10-02',
      milestone: 'Fasa 1: Pengesahan Skop Masalah Industri',
      cloStatement: 'CLO 1: Formulate research objectives addressing industrial operational problems (PLO4, C4)',
      taskTitle: 'MINGGU 1 (28 Sep - 02 Okt 2026): Penyelarasan Skop Masalah Industri & Penetapan Objektif Bersama JI',
      taskHighlights: [
        'Penyelarasan isu dan skop penyelidikan sebenar bersama Jurulatih Industri di premis syarikat',
        'Analisis awal proses operasi, sistem kerja dan data baseline sedia ada organisasi',
        'Penyusunan jadual perbatuan (milestone) 20 minggu PSM II yang dipersetujui JI dan TPF'
      ],
      areas: [
        { id: 1, title: 'Kefahaman dan ketepatan penetapan isu operasi sebenar industri' },
        { id: 2, title: 'Hubung jalin objektif penyelidikan dengan keperluan penambahbaikan firma' },
        { id: 3, title: 'Komitmen perancangan jadual kerja penyelidikan 20 minggu (Gantt Chart)' }
      ],
      maxMarks: 12
    },
    {
      week: 2,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      milestone: 'Fasa 1: Sorotan Literatur Lanjutan',
      cloStatement: 'CLO 1: Synthesize relevant literature for industrial solutions (PLO4, C4)',
      taskTitle: 'MINGGU 2 (05 Okt - 09 Okt 2026): Sorotan Literatur Lanjutan & Penentuan Jurang Kajian Kontekstual',
      taskHighlights: [
        'Penerokaan artikel jurnal berwasit terkini berkaitan isu penyelesaian di firma penempatan',
        'Penentuan jurang kajian (research gap) antara amalan teori akademik dan amalan industri',
        'Penyusunan sintesis literatur Bab 2 serta pemetaan amalan terbaik (best practices)'
      ],
      areas: [
        { id: 1, title: 'Kualiti dan kerelevanan sumber rujukan akademik yang diteroka' },
        { id: 2, title: 'Keupayaan mengenal pasti jurang praktikal operasi organisasi' },
        { id: 3, title: 'Sintesis teori dan perkaitannya dengan amalan di tempat kerja' }
      ],
      maxMarks: 12
    },
    {
      week: 3,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      milestone: 'Fasa 1: Kerangka Konseptual',
      cloStatement: 'CLO 1: Synthesize relevant literature for industrial solutions (PLO4, C4)',
      taskTitle: 'MINGGU 3 (12 Okt - 16 Okt 2026): Pembinaan Kerangka Konseptual & Model Pembolehubah Kajian',
      taskHighlights: [
        'Membangunkan kerangka konseptual penyelidikan berdasarkan sorotan literatur dan cabaran firma',
        'Mengenal pasti pembolehubah bersandar, pembolehubah bebas dan faktor kekangan industri',
        'Sesi konsultasi kerangka konseptual bersama Jurulatih Industri dan Penyelia Fakulti'
      ],
      areas: [
        { id: 1, title: 'Keteguhan kerangka konseptual yang menghubungkan masalah firma' },
        { id: 2, title: 'Definisi operasi pembolehubah yang jelas dan boleh diukur secara saintifik' },
        { id: 3, title: 'Penerimaan dan pengesahan awal konsep model oleh Jurulatih Industri' }
      ],
      maxMarks: 12
    },
    {
      week: 4,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-10-19',
      endDate: '2026-10-23',
      milestone: 'Fasa 2: Reka Bentuk Metodologi Lapangan',
      cloStatement: 'CLO 2: Design rigorous research methodology suitable for industry setting (PLO7, C5)',
      taskTitle: 'MINGGU 4 (19 Okt - 23 Okt 2026): Reka Bentuk Penyelidikan & Perancangan Pensampelan Lapangan',
      taskHighlights: [
        'Menetapkan reka bentuk penyelidikan (kuantitatif / kualitatif / kaedah campuran) di industri',
        'Menentukan populasi, saiz sampel dan teknik pensampelan yang sesuai dengan operasi firma',
        'Penyediaan protokol etika penyelidikan, persetujuan termaklum dan kerahsiaan data organisasi'
      ],
      areas: [
        { id: 1, title: 'Kesesuaian reka bentuk kajian dengan persekitaran operasi firma' },
        { id: 2, title: 'Ketepatan kaedah pensampelan dan justifikasi saiz sampel' },
        { id: 3, title: 'Pematuhan prosedur integriti dan kerahsiaan data syarikat' }
      ],
      maxMarks: 12
    },
    {
      week: 5,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-10-26',
      endDate: '2026-10-30',
      milestone: 'Fasa 2: Pembangunan Instrumen & Semakan JI',
      cloStatement: 'CLO 2: Design rigorous research methodology suitable for industry setting (PLO7, C5)',
      taskTitle: 'MINGGU 5 (26 Okt - 30 Okt 2026): Pembangunan Draf Instrumen Kajian & Semakan Kesahan Kandungan',
      taskHighlights: [
        'Membina draf instrumen (borang soal selidik / protokol temubual / senarai semak audit proses)',
        'Semakan kesahan muka dan kandungan bersama Jurulatih Industri dan pakar teknikal firma',
        'Penambahbaikan item instrumen mengikut terminologi standard industri'
      ],
      areas: [
        { id: 1, title: 'Kualiti pembinaan item instrumen penyelidikan' },
        { id: 2, title: 'Kesesuaian bahasa dan terminologi yang diguna pakai di firma' },
        { id: 3, title: 'Maklum balas dan pengesahan kesahan kandungan oleh Jurulatih Industri' }
      ],
      maxMarks: 12
    },
    {
      week: 6,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      milestone: 'Fasa 2: Kajian Rintis (Pilot Test)',
      cloStatement: 'CLO 2: Execute pilot study and reliability testing (PLO7, C5)',
      taskTitle: 'MINGGU 6 (02 Nov - 06 Nov 2026): Pelaksanaan Kajian Rintis (Pilot Study) & Pengujian Kebolehpercayaan',
      taskHighlights: [
        'Mengedarkan instrumen kepada sampel rintis dalam organisasi penempatan',
        'Menjalankan ujian kebolehpercayaan (Cronbach Alpha / semakan tematik pakar)',
        'Menyempurnakan draf Bab 1, 2 dan 3 untuk semakan rasmi Milestone 1'
      ],
      areas: [
        { id: 1, title: 'Pelaksanaan ujian rintis secara beretika di premis industri' },
        { id: 2, title: 'Ketepatan analisis kebolehpercayaan instrumen kajian' },
        { id: 3, title: 'Kesiapsiagaan manuskrip Bab 1-3 untuk semakan kemajuan' }
      ],
      maxMarks: 12
    },
    {
      week: 7,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-11-09',
      endDate: '2026-11-13',
      milestone: 'Milestone 1: Penilaian Kemajuan Fasa Pertama',
      cloStatement: 'CLO 3: Evaluate research progress and demonstrate professional conduct (PLO8, A2)',
      taskTitle: 'MINGGU 7 (09 Nov - 13 Nov 2026): Penilaian Kemajuan Fasa 1 Bersama JI & TPF (Milestone 1)',
      taskHighlights: [
        'Pembentangan kemajuan metodologi dan instrumen kepada Jurulatih Industri',
        'Penyelarasan cadangan pembetulan dan penambahbaikan instrumen daripada JI dan TPF',
        'Penyediaan pelan tindakan pengumpulan data sebenar di premis syarikat'
      ],
      areas: [
        { id: 1, title: 'Kejelasan pembentangan kemajuan metodologi kepada JI' },
        { id: 2, title: 'Ketangkasan membuat pembetulan berdasarkan maklum balas penilai' },
        { id: 3, title: 'Disiplin dan komitmen perantisan sepanjang 6 minggu pertama' }
      ],
      maxMarks: 12
    },
    {
      week: 8,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-11-16',
      endDate: '2026-11-20',
      milestone: 'Fasa 3: Pengumpulan Data Lapangan (Primer)',
      cloStatement: 'CLO 2: Collect empirical data adhering to industry confidentiality (PLO8, P4)',
      taskTitle: 'MINGGU 8 (16 Nov - 20 Nov 2026): Pengumpulan Data Sebenar Fasa 1 (Data Primer / Lapangan)',
      taskHighlights: [
        'Mengedarkan soal selidik / menjalankan sesi temubual pekerja dan pengurusan firma',
        'Memantau kadar maklum balas (response rate) dan menyemak kelengkapan data',
        'Menyimpan log audit pengumpulan data secara selamat dan berintegriti'
      ],
      areas: [
        { id: 1, title: 'Pengurusan pengumpulan data di lapangan industri secara berhemah' },
        { id: 2, title: 'Kadar respon dan usaha mengatasi kekangan kutipan data' },
        { id: 3, title: 'Penyimpanan rekod data secara selamat dan berintegriti' }
      ],
      maxMarks: 12
    },
    {
      week: 9,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-11-23',
      endDate: '2026-11-27',
      milestone: 'Fasa 3: Pengumpulan Data Sekunder & Operasi',
      cloStatement: 'CLO 2: Collect empirical data adhering to industry confidentiality (PLO8, P4)',
      taskTitle: 'MINGGU 9 (23 Nov - 27 Nov 2026): Pengumpulan Data Sebenar Fasa 2 (Data Sekunder & Metrik Operasi)',
      taskHighlights: [
        'Mengekstrak data sekunder operasi firma (rekod jualan, kecekapan barisan, log kecacatan produk)',
        'Mengesahkan ketulenan dan kesahihan data sekunder bersama ketua bahagian berkaitan',
        'Memadankan data primer soal selidik dengan metrik operasi sebenar organisasi'
      ],
      areas: [
        { id: 1, title: 'Ketelitian mengekstrak data sekunder operasi organisasi' },
        { id: 2, title: 'Kerjasama profesional dengan warga kerja firma semasa kutipan data' },
        { id: 3, title: 'Keselarasan antara data primer lapangan dan rekod operasi firma' }
      ],
      maxMarks: 12
    },
    {
      week: 10,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-11-30',
      endDate: '2026-12-04',
      milestone: 'Fasa 4: Pembersihan & Penyaringan Data',
      cloStatement: 'CLO 3: Prepare clean data sets for scientific analysis (PLO7, C4)',
      taskTitle: 'MINGGU 10 (30 Nov - 04 Dis 2026): Pembersihan, Penyaringan & Pengkodan Data (Data Wrangling)',
      taskHighlights: [
        'Pemeriksaan data hilang (missing data), nilai ekstrem (outliers) dan andaian normaliti',
        'Pengkodan transkrip temubual dan penetapan tema awal (analisis tematik kualitatif)',
        'Penyediaan pangkalan data bersih (clean dataset) untuk analisis inferensi/statistik lanjutan'
      ],
      areas: [
        { id: 1, title: 'Kemahiran teknikal pembersihan dan saringan data mentah' },
        { id: 2, title: 'Ketepatan pengkodan pembolehubah penyelidikan' },
        { id: 3, title: 'Dokumentasi langkah saringan data secara telus dan boleh diulang semak' }
      ],
      maxMarks: 12
    },
    {
      week: 11,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-12-07',
      endDate: '2026-12-11',
      milestone: 'Milestone 2: Analisis Deskriptif & Semakan Pertengahan',
      cloStatement: 'CLO 3: Analyze baseline descriptive statistics and operational trends (PLO4, C4)',
      taskTitle: 'MINGGU 11 (07 Dis - 11 Dis 2026): Analisis Data Deskriptif & Penilaian Kemajuan Pertengahan (Milestone 2)',
      taskHighlights: [
        'Menjana profil demografi responden dan taburan statistik deskriptif pembolehubah',
        'Menganalisis corak asas prestasi operasi syarikat dan trend cabaran utama',
        'Semakan buku log dan sesi konsultasi pertengahan semester bersama Jurulatih Industri'
      ],
      areas: [
        { id: 1, title: 'Kedalaman analisis deskriptif terhadap senario operasi firma' },
        { id: 2, title: 'Kualiti visualisasi carta, jadual dan grafik data awal' },
        { id: 3, title: 'Prestasi dan komitmen kerja separuh jalan (Minggu 1 - 10)' }
      ],
      maxMarks: 12
    },
    {
      week: 12,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-12-14',
      endDate: '2026-12-18',
      milestone: 'Fasa 4: Analisis Inferensi & Ujian Hipotesis',
      cloStatement: 'CLO 3: Perform inferential statistics / thematic modeling (PLO4, C5)',
      taskTitle: 'MINGGU 12 (14 Dis - 18 Dis 2026): Analisis Data Lanjutan (Ujian Inferensi / Pemodelan Tematik)',
      taskHighlights: [
        'Melaksanakan ujian hipotesis (regresi berganda, korelasi, ANOVA) atau pemodelan tematik',
        'Menilai tahap signifikasi statistik dan saiz kesan terhadap isu produktiviti firma',
        'Mengesahkan ketepatan dapatan analisis statistik bersama penyelia teknikal industri'
      ],
      areas: [
        { id: 1, title: 'Aplikasi alat analisis data saintifik yang betul dan mantap' },
        { id: 2, title: 'Ketepatan tafsiran statistik/tematik berlandaskan objektif kajian' },
        { id: 3, title: 'Perbincangan intelek dapatan analisis bersama Jurulatih Industri' }
      ],
      maxMarks: 12
    },
    {
      week: 13,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-12-21',
      endDate: '2026-12-25',
      milestone: 'Fasa 5: Penterjemahan Dapatan ke Punca Utama',
      cloStatement: 'CLO 3: Interpret analytical findings relative to research objectives (PLO4, C5)',
      taskTitle: 'MINGGU 13 (21 Dis - 25 Dis 2026): Penterjemahan Dapatan Analisis ke Masalah Punca Utama (Root Cause)',
      taskHighlights: [
        'Menghubungkaitkan dapatan data dengan punca sebenar masalah operasi organisasi',
        'Mengaplikasikan kaedah Fishbone Diagram atau 5-Why Analysis berasaskan data empirikal',
        'Membentangkan sintesis dapatan awal kepada pasukan pengurusan firma'
      ],
      areas: [
        { id: 1, title: 'Keupayaan menterjemah angka data kepada punca operasi nyata' },
        { id: 2, title: 'Logik analitikal dalam mengenal pasti punca masalah utama firma' },
        { id: 3, title: 'Ketrampilan berkongsi maklumat dan meyakinkan penyelia industri' }
      ],
      maxMarks: 12
    },
    {
      week: 14,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2026-12-28',
      endDate: '2027-01-01',
      milestone: 'Fasa 5: Penggubalan Model Solusi Inovatif',
      cloStatement: 'CLO 3: Formulate actionable industrial solutions based on evidence (PLO8, C5)',
      taskTitle: 'MINGGU 14 (28 Dis 2026 - 01 Jan 2027): Penggubalan Model Solusi Inovatif & Pelan Tindakan Industri',
      taskHighlights: [
        'Merangka model penyelesaian / inovasi teknopreneur berasaskan bukti saintifik kajian',
        'Menyediakan draf prosedur operasi standard (SOP) baharu atau prototaip cadangan penambahbaikan',
        'Menganalisis impak kos dan faedah (cost-benefit analysis) bagi pelaksanaan di syarikat'
      ],
      areas: [
        { id: 1, title: 'Kreativiti dan kebolehlaksanaan model solusi yang dicadangkan' },
        { id: 2, title: 'Nilai tambah ekonomi/operasi yang bakal dinikmati oleh organisasi' },
        { id: 3, title: 'Kelengkapan pelan tindakan pelaksanaan penambahbaikan' }
      ],
      maxMarks: 12
    },
    {
      week: 15,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-01-04',
      endDate: '2027-01-08',
      milestone: 'Fasa 5: Pengujian / Simulasi Lapangan',
      cloStatement: 'CLO 2: Test and validate recommended solution within organization (PLO7, P5)',
      taskTitle: 'MINGGU 15 (04 Jan - 08 Jan 2027): Pengujian / Simulasi Kebolehlaksanaan Solusi di Premis Firma',
      taskHighlights: [
        'Menjalankan ujian simulasi / percubaan terhad model penambahbaikan di premis firma',
        'Mengumpul maklum balas daripada pengendali operasi dan penyelia industri',
        'Membuat pelarasan akhir kepada cadangan penyelesaian agar berdaya maju sepenuhnya'
      ],
      areas: [
        { id: 1, title: 'Pelaksanaan sesi pengujian / simulasi di persekitaran kerja sebenar' },
        { id: 2, title: 'Kepekaan terhadap maklum balas pekerja dan kekangan praktikal operasi' },
        { id: 3, title: 'Kualiti penambahbaikan solusi selepas sesi percubaan lapangan' }
      ],
      maxMarks: 12
    },
    {
      week: 16,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-01-11',
      endDate: '2027-01-15',
      milestone: 'Fasa 6: Penulisan Manuskrip Bab 4 & 5',
      cloStatement: 'CLO 1: Document empirical findings and synthesize implications (PLO4, PLO8, C4, C5)',
      taskTitle: 'MINGGU 16 (11 Jan - 15 Jan 2027): Penulisan Penuh Bab 4 (Analisis & Dapatan) & Bab 5 (Perbincangan)',
      taskHighlights: [
        'Menulis laporan komprehensif Bab 4 dan Bab 5 mengikut format tesis ilmiah UTeM',
        'Menghuraikan implikasi teori dan praktikal cadangan penambahbaikan kepada industri',
        'Mengemukakan draf laporan lengkap Bab 1-5 kepada Jurulatih Industri untuk semakan'
      ],
      areas: [
        { id: 1, title: 'Kualiti penulisan laporan teknikal dan kedalaman perbincangan dapatan' },
        { id: 2, title: 'Kejelasan persembahan data, graf dan jadual sokongan' },
        { id: 3, title: 'Kekukuhan justifikasi cadangan penyelesaian untuk organisasi' }
      ],
      maxMarks: 12
    },
    {
      week: 17,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-01-18',
      endDate: '2027-01-22',
      milestone: 'Fasa 6: Semakan Format Tesis & Integriti',
      cloStatement: 'CLO 1: Assemble complete thesis conforming to UTeM formatting standard (PLO8, C4)',
      taskTitle: 'MINGGU 17 (18 Jan - 22 Jan 2027): Semakan Manuskrip Tesis Penuh, Format APA & Integriti Akademik',
      taskHighlights: [
        'Menyemak pematuhan format Buku Panduan PSM UTeM dan format rujukan APA edisi terkini',
        'Menjalankan semakan Turnitin (indeks keserupaan plagiarisme mesti <= 20%)',
        'Menyediakan abstrak dwi-bahasa (Bahasa Melayu dan Bahasa Inggeris)'
      ],
      areas: [
        { id: 1, title: 'Kepatuhan format tesis, rujukan dan susun atur dokumen universiti' },
        { id: 2, title: 'Integriti akademik dan peratusan indeks keserupaan plagiarisme' },
        { id: 3, title: 'Kualiti penulisan abstrak teknikal dan tatabahasa' }
      ],
      maxMarks: 12
    },
    {
      week: 18,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-01-25',
      endDate: '2027-01-29',
      milestone: 'Fasa 7: Penyediaan Slaid Kolokium & Pra-Viva',
      cloStatement: 'CLO 4: Prepare professional research presentation for stakeholders (PLO9, C3C)',
      taskTitle: 'MINGGU 18 (25 Jan - 29 Jan 2027): Penyediaan Slaid Pembentangan Kolokium & Latihan Pra-Viva Bersama JI',
      taskHighlights: [
        'Merekabentuk slaid pembentangan seminar bertaraf profesional eksekutif korporat',
        'Menghasilkan poster ringkasan penyelidikan infografik yang padat dan informatif',
        'Sesi raptai pembentangan (mock viva) di hadapan Jurulatih Industri dan pasukan kerja'
      ],
      areas: [
        { id: 1, title: 'Kualiti reka bentuk slaid dan kejelasan infografik data kajian' },
        { id: 2, title: 'Kelancaran pengucapan awam dan artikulasi hujah penyelidikan' },
        { id: 3, title: 'Respons terhadap sesi soal jawab latihan bersama Jurulatih Industri' }
      ],
      maxMarks: 12
    },
    {
      week: 19,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-02-01',
      endDate: '2027-02-05',
      milestone: 'Milestone 3: Pembentangan Seminar / Viva PSM II',
      cloStatement: 'CLO 4: Present and defend final research project before evaluation panel (PLO9, A5, C3C)',
      taskTitle: 'MINGGU 19 (01 Feb - 05 Feb 2027): Sesi Seminar Kolokium / Pembentangan Viva PSM II Bersama Panel JI & TPF',
      taskHighlights: [
        'Membentangkan hasil projek penyelidikan PSM II kepada panel penilai (JI & TPF)',
        'Mempertahankan dapatan, metodologi dan solusi dalam sesi soal jawab viva akademik',
        'Menerima rubrik penilaian pembentangan seminar rasmi (JI 15% + TPF 15%)'
      ],
      areas: [
        { id: 1, title: 'Penguasaan keseluruhan projek dan kejelasan pembentangan viva' },
        { id: 2, title: 'Pertahanan hujah secara matang, kritis dan berfakta kajian' },
        { id: 3, title: 'Ketrampilan profesional, etika, kepimpinan dan penampilan diri' }
      ],
      maxMarks: 12
    },
    {
      week: 20,
      courseCode: 'BTMU 4084(i)',
      courseName: 'FINAL YEAR PROJECT II (PSM II)',
      startDate: '2027-02-08',
      endDate: '2027-02-12',
      milestone: 'Milestone 4: Pengesahan & Serahan Akhir Tesis',
      cloStatement: 'CLO 1, 2, 3, 4: Finalize archival research report and portfolio (PLO4, PLO7, PLO8, PLO9)',
      taskTitle: 'MINGGU 20 (08 Feb - 12 Feb 2027): Pembetulan Akhir Manuskrip, Pengesahan Markah Akhir & Penyerahan Portfolio',
      taskHighlights: [
        'Menyelesaikan pembetulan tesis yang disyorkan oleh panel penilai seminar',
        'Mendapatkan pengesahan dan tandatangan rasmi Jurulatih Industri (JI) & Penyelia Fakulti (TPF)',
        'Menyerahkan naskhah akhir tesis dan portfolio lengkap PSM II kepada pihak firma dan universiti'
      ],
      areas: [
        { id: 1, title: 'Kesempurnaan pembetulan manuskrip mengikut teguran panel penilai' },
        { id: 2, title: 'Kelengkapan borang pengesahan, dokumen portfolio dan serahan rasmi' },
        { id: 3, title: 'Prestasi keseluruhan, integriti dan sumbangan bernilai tinggi kepada firma sepanjang 20 minggu' }
      ],
      maxMarks: 12
    }
  ]
};

// Aliases for course codes without '(i)'
UTEM_WEEKLY_ASSESSMENTS['BTMU 2103'] = UTEM_WEEKLY_ASSESSMENTS['BTMU 2103(i)'];
UTEM_WEEKLY_ASSESSMENTS['BTMT 3273'] = UTEM_WEEKLY_ASSESSMENTS['BTMT 3273(i)'];
UTEM_WEEKLY_ASSESSMENTS['BTMT 3283'] = UTEM_WEEKLY_ASSESSMENTS['BTMT 3283(i)'];
UTEM_WEEKLY_ASSESSMENTS['BTMT 2113'] = UTEM_WEEKLY_ASSESSMENTS['BTMT 2113(i)'];
UTEM_WEEKLY_ASSESSMENTS['BTMU 4084'] = UTEM_WEEKLY_ASSESSMENTS['BTMU 4084(i)'];

// =========================================================================
// WBL OFFICIAL COURSE SEQUENCE (5-WEEK MODULES & 20-WEEK PSM2)
// =========================================================================

export interface WblCourseSequenceItem {
  order: number;
  courseCode: string;
  courseName: string;
  shortName: string;
  creditHours: number;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  badge: string;
  evaluatorRatio: string;
  jiWeightPercent: number;
  tpfWeightPercent: number;
  description: string;
}

export const WBL_COURSE_SEQUENCE: WblCourseSequenceItem[] = [
  {
    order: 1,
    courseCode: 'BTMU 2103(i)',
    courseName: 'OPERATIONS MANAGEMENT (PENGURUSAN OPERASI)',
    shortName: 'Pengurusan Operasi',
    creditHours: 3,
    durationWeeks: 5,
    startDate: '2026-09-28',
    endDate: '2026-10-30',
    badge: 'Modul 1 (Minggu 1 - 5)',
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiWeightPercent: 60,
    tpfWeightPercent: 40,
    description: 'Bermula 28 September 2026 (Minggu 1 - 5): Susun atur operasi fasiliti, perancangan kapasiti sumber, operasi ramping (Lean 5S & penghapusan pembaziran), kawalan kualiti/SOP & laporan projek operasi (Universal untuk Pembarangan, Perdagangan, Perkhidmatan & Pembuatan).'
  },
  {
    order: 2,
    courseCode: 'BTMT 3273(i)',
    courseName: 'DIGITAL ENTREPRENEURSHIP (KEUSAHAWANAN DIGITAL)',
    shortName: 'Keusahawanan Digital',
    creditHours: 3,
    durationWeeks: 5,
    startDate: '2026-11-02',
    endDate: '2026-12-04',
    badge: 'Modul 2 (Minggu 6 - 10 / M1-5)',
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiWeightPercent: 60,
    tpfWeightPercent: 40,
    description: 'Bermula 02 November 2026 (Minggu 6 - 10): Ekosistem digital, Digital Business Model Canvas (BMC), pemasaran media sosial, operasi e-pasaran & laporan projek.'
  },
  {
    order: 3,
    courseCode: 'BTMT 3283(i)',
    courseName: 'BUSINESS ANALYTICS (ANALITIK PERNIAGAAN)',
    shortName: 'Analitik Perniagaan',
    creditHours: 3,
    durationWeeks: 5,
    startDate: '2026-12-07',
    endDate: '2027-01-08',
    badge: 'Modul 3 (Minggu 11 - 15 / M1-5)',
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiWeightPercent: 60,
    tpfWeightPercent: 40,
    description: 'Bermula 07 Disember 2026 (Minggu 11 - 15): Pengekstrakan data, analisis penerokaan (EDA), pemodelan ramalan, papan pemuka Power BI & laporan kajian analitik.'
  },
  {
    order: 4,
    courseCode: 'BTMT 2113(i)',
    courseName: 'BRAND MANAGEMENT (PENGURUSAN PENJENAMAAN)',
    shortName: 'Pengurusan Penjenamaan',
    creditHours: 3,
    durationWeeks: 5,
    startDate: '2027-01-11',
    endDate: '2027-02-12',
    badge: 'Modul 4 (Minggu 16 - 20 / M1-5)',
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiWeightPercent: 60,
    tpfWeightPercent: 40,
    description: 'Bermula 11 Januari 2027 (Minggu 16 - 20): Elemen jenama, ekuiti jenama, penjenamaan era digital, komunikasi pemasaran bersepadu (IMC) & serahan portfolio.'
  },
  {
    order: 5,
    courseCode: 'BTMU 4084(i)',
    courseName: 'FINAL YEAR PROJECT II (PROJEK SARJANA MUDA II / PSM II)',
    shortName: 'PSM II (20 Minggu)',
    creditHours: 4,
    durationWeeks: 20,
    startDate: '2026-09-28',
    endDate: '2027-02-12',
    badge: 'Sepanjang Semester (20 Minggu)',
    evaluatorRatio: 'JI: 40% | TPF: 60%',
    jiWeightPercent: 40,
    tpfWeightPercent: 60,
    description: 'Bermula 28 September 2026 selama 20 minggu: Skop masalah industri, sorotan literatur, metodologi lapangan, analisis data, solusi penambahbaikan, pembentangan viva & tesis akhir.'
  }
];

// =========================================================================
// 2. OFFICIAL COMPREHENSIVE COURSE PORTFOLIOS & RUBRICS (ATTACHMENT P. 39 - 87)
// =========================================================================

export const UTEM_PORTFOLIO_SCHEMES: Record<string, CoursePortfolioScheme> = {
  // Course 1: BTMU 4056(i) Technopreneur Internship (6 Kredit)
  'BTMU 4056(i)': {
    courseCode: 'BTMU 4056(i)',
    courseName: 'Technopreneur Internship',
    creditHours: 6,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Logbook & Laporan Kemajuan Mingguan', domain: 'Kognitif (C2 & C4)', clo: 'CLO1, CLO2', plo: 'PLO2, PLO7', evaluator: 'JI (10%) & TPF (20%)', weightPercent: 30 },
      { no: 2, componentName: 'Soft Skills & Competencies Assessment', domain: 'Afektif (A4) / C3F', clo: 'CLO4', plo: 'PLO9 (Kepimpinan)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 30 },
      { no: 3, componentName: 'Presentation di Industri (Pembentangan Akhir)', domain: 'Afektif & Kognitif / C3C', clo: 'CLO4', plo: 'PLO9 (Komunikasi)', evaluator: 'JI (10%) & TPF (10%)', weightPercent: 20 },
      { no: 4, componentName: 'Professionalism & Ethics (Etika Profesional)', domain: 'Psikomotor (P3) / C5', clo: 'CLO3', plo: 'PLO8 (Etika)', evaluator: 'JI (10%) & TPF (10%)', weightPercent: 20 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Buku Log & Laporan Aktiviti Mingguan (30%)',
        evaluator: 'JI & TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Jurulatih Industri (JI - 10%) dan Tenaga Pengajar Fakulti (TPF - 20%) berdasarkan rekod aktiviti perantisan 24 minggu.',
        criteria: [
          {
            id: 'logbook_1',
            title: '1. Ketekalan & Kesempurnaan Catatan Harian/Mingguan',
            maxScore: 4,
            levels: {
              1: 'Catatan tidak lengkap, banyak minggu tertinggal dan lewat dikemukakan untuk semakan.',
              2: 'Catatan ada tetapi ringkas, tidak konsisten dan pengesahan JI tidak teratur.',
              3: 'Catatan lengkap setiap minggu, disemak dan disahkan secara berkala oleh JI.',
              4: 'Catatan sangat terperinci, kemas, konsisten 24 minggu, disertakan bukti bergambar/dokumen dan pengesahan JI lengkap.'
            }
          },
          {
            id: 'logbook_2',
            title: '2. Pengecaman Masalah & Isu Operasi Firma (CLO1)',
            maxScore: 4,
            levels: {
              1: 'Gagal mengenal pasti isu sebenar syarikat dan deskripsi tugasan kabur.',
              2: 'Mengenal pasti tugas harian tetapi kurang jelas dari segi permasalahan operasi.',
              3: 'Berjaya mengenal pasti masalah dan cabaran operasi/perniagaan firma dengan jelas.',
              4: 'Sangat analitikal dalam mengenal pasti punca masalah utama firma serta menghuraikan implikasinya kepada organisasi.'
            }
          },
          {
            id: 'logbook_3',
            title: '3. Aplikasi Kaedah & Alat Analisis Masalah (CLO2)',
            maxScore: 4,
            levels: {
              1: 'Tiada penggunaan alat atau teknik saintifik dalam menganalisis tugas industri.',
              2: 'Aplikasi alat analisis sangat asas dan terhad kepada kaedah konvensional.',
              3: 'Menggunakan kaedah dan alat pengurusan/teknikal yang sesuai untuk menganalisis masalah.',
              4: 'Sangat cekap mengaplikasikan kaedah saintifik/teknikal lanjutan bagi menganalisis data dan proses firma.'
            }
          },
          {
            id: 'logbook_4',
            title: '4. Refleksi Pembelajaran Kendiri & Bimbingan JI',
            maxScore: 4,
            levels: {
              1: 'Tiada catatan refleksi atau refleksi sekadar menyalin semula huraian kerja.',
              2: 'Refleksi pembelajaran terlalu umum dan tidak menunjukkan kematangan pemikiran.',
              3: 'Refleksi menghubungkaitkan pengalaman kerja dengan teori akademik yang dipelajari.',
              4: 'Refleksi sangat matang, kritikal, mendokumentasikan pembelajaran daripada bimbingan JI serta cadangan penambahbaikan diri.'
            }
          },
          {
            id: 'logbook_5',
            title: '5. Kualiti Dokumentasi & Format Laporan',
            maxScore: 4,
            levels: {
              1: 'Format tidak teratur, bahasa lemah dan mengabaikan panduan buku log fakulti.',
              2: 'Format sederhana dan lampiran sokongan aktiviti sangat terhad.',
              3: 'Format mematuhi Buku Panduan Latihan Industri WBL dan bahasa kemas.',
              4: 'Dokumentasi bertaraf profesional industri, susun atur sangat rapi dan lampiran evidens lengkap.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Kemahiran Insaniah & Kompetensi Praktikal Industri (30%)',
        evaluator: 'JI',
        weightagePercent: 30,
        description: 'Dinilai sepenuhnya oleh Jurulatih Industri (JI - 30%) sepanjang 6 bulan penempatan bagi mengukur kebolehan pelaksanaan kerja, daya kepimpinan, autonomi dan kompetensi amali.',
        criteria: [
          {
            id: 'soft_1',
            title: '1. Keupayaan Pelaksanaan Tugas Amali & Solusi Firma',
            maxScore: 4,
            levels: {
              1: 'Gagal melaksanakan tugasan operasi/amali yang diarahkan oleh penyelia industri.',
              2: 'Melaksanakan tugasan asas tetapi memerlukan pemantauan dan bantuan berterusan.',
              3: 'Melaksanakan tugasan industri dengan betul, cekap dan mematuhi standard firma.',
              4: 'Penguasaan amali sangat cemerlang, berdikari dan berjaya melaksanakan projek solusi dengan berkesan.'
            }
          },
          {
            id: 'soft_2',
            title: '2. Kepimpinan, Autonomi & Kebertanggungjawaban (CLO4 / PLO9)',
            maxScore: 4,
            levels: {
              1: 'Mengelak daripada memikul tanggungjawab dan tidak boleh bekerja secara berdikari.',
              2: 'Kurang yakin membuat keputusan operasi dan bergantung sepenuhnya kepada rakan sekerja.',
              3: 'Mampu memimpin tugasan kecil, berautonomi dan bertanggungjawab atas hasil kerja.',
              4: 'Ciri kepimpinan cemerlang, berautonomi tinggi, matang dalam membuat keputusan dan menjadi contoh teladan.'
            }
          },
          {
            id: 'soft_3',
            title: '3. Kerja Berpasukan & Hubungan Interpersonal Silang Budaya',
            maxScore: 4,
            levels: {
              1: 'Sukar bekerjasama, pasif dan kerap menimbulkan perselisihan faham.',
              2: 'Kurang berkomunikasi dan berinteraksi secara terhad dengan warga syarikat.',
              3: 'Bekerjasama dengan baik, mesra dan menghormati semua peringkat warga kerja.',
              4: 'Sangat proaktif membina hubungan kerja yang harmoni, memotivasi rakan sepasukan dan menyokong matlamat firma.'
            }
          },
          {
            id: 'soft_4',
            title: '4. Inisiatif, Kreativiti & Daya Usaha Inovasi',
            maxScore: 4,
            levels: {
              1: 'Pasif, menunggu arahan dan tidak menunjukkan minat terhadap penambahbaikan.',
              2: 'Melakukan tugasan rutin tanpa sebarang inisiatif nilai tambah.',
              3: 'Menunjukkan minat belajar, rajin dan bersedia mencuba kaedah kerja baharu.',
              4: 'Sangat berinisiatif tinggi, kreatif mencadangkan idea inovatif bagi meningkatkan produktiviti organisasi.'
            }
          },
          {
            id: 'soft_5',
            title: '5. Daya Tahan Kerja & Kebolehsuaian Persekitaran Industri',
            maxScore: 4,
            levels: {
              1: 'Mudah putus asa, tidak tahan tekanan kerja dan sukar menyesuaikan diri.',
              2: 'Mengambil masa terlalu lama untuk menyesuaikan diri dengan persekitaran syarikat.',
              3: 'Mudah menyesuaikan diri dengan budaya kerja dan mampu menangani beban tugas.',
              4: 'Daya tahan sangat tinggi (resilient), tangkas (agile) menangani tekanan dan pantas mengatasi cabaran operasi.'
            }
          },
          {
            id: 'soft_6',
            title: '6. Ketelitian, Kualiti Kerja & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Hasil kerja cuai, banyak kesilapan dan sering gagal menepati tarikh akhir tugasan.',
              2: 'Hasil kerja memerlukan semakan berulang kali daripada Jurulatih Industri.',
              3: 'Hasil kerja berkualiti, kemas, teliti dan menepati jadual waktu yang ditetapkan.',
              4: 'Kualiti kerja bertaraf profesional industri, sangat teliti, sifar ralat dan pengurusan masa cemerlang.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Pembentangan Akhir di Premis Industri (20%)',
        evaluator: 'JI & TPF',
        weightagePercent: 20,
        description: 'Dinilai bersama oleh Jurulatih Industri (JI - 10%) dan Tenaga Pengajar Fakulti (TPF - 10%) semasa sesi lawatan pemantauan kedua di industri (CLO4, PLO9).',
        criteria: [
          {
            id: 'pres_1',
            title: '1. Penguasaan Kandungan Latihan & Projek Firma',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan aktiviti perantisan dan peranan dalam projek syarikat.',
              2: 'Penerangan aktiviti latihan terlalu umum dan kurang menghuraikan impak kepada firma.',
              3: 'Menerangkan skop latihan, masalah yang diselesaikan dan impak projek dengan jelas.',
              4: 'Penguasaan teknikal sangat mantap, menghuraikan sumbangan projek kepada operasi firma secara menyeluruh.'
            }
          },
          {
            id: 'pres_2',
            title: '2. Struktur Pembentangan & Kelancaran Bahasa',
            maxScore: 4,
            levels: {
              1: 'Penyampaian tidak teratur, gugup dan bahasa sukar difahami.',
              2: 'Penyampaian mendatar, urutan slaid kurang logik dan kurang berkeyakinan.',
              3: 'Penyampaian tersusun mengikut urutan fasa latihan, lancar dan berkeyakinan baik.',
              4: 'Penyampaian sangat lancar, gaya korporat profesional, bahasa fasih dan memukau hadirin.'
            }
          },
          {
            id: 'pres_3',
            title: '3. Kualiti Slaid & Pembuktian Visual Projek',
            maxScore: 4,
            levels: {
              1: 'Slaid teks padat, tidak kemas dan tiada gambar rajah/bukti aktiviti di industri.',
              2: 'Visual minima dan slaid persembahan kurang menarik perhatian panel penilai.',
              3: 'Slaid kemas, berstruktur dan menyertakan foto aktiviti serta carta pelaksanaan projek.',
              4: 'Reka bentuk persembahan bertaraf eksekutif, infografik data kemas dan bukti evidens projek sangat lengkap.'
            }
          },
          {
            id: 'pres_4',
            title: '4. Sesi Soal Jawab & Maklum Balas Panel (Q&A)',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan panel penilai JI dan TPF.',
              2: 'Jawapan teragak-agak, kurang tepat dan tidak disokong fakta pengalaman kerja.',
              3: 'Menjawab soalan panel penilai dengan tenang, tepat dan berkeyakinan.',
              4: 'Menjawab soalan secara kritis, matang, mempertahankan cadangan solusi dengan data konkrit industri.'
            }
          },
          {
            id: 'pres_5',
            title: '5. Profesionalisme, Penampilan & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Pakaian tidak mematuhi etika korporat dan pembentangan melebihi had masa.',
              2: 'Pengurusan masa kurang seimbang antara bahagian pengenalan dan dapatan.',
              3: 'Menepati had masa yang ditetapkan dan berpakaian kemas mematuhi etika korporat.',
              4: 'Pengurusan masa tepat, interaksi dua hala berkarisma tinggi dan mempamerkan etika eksekutif cemerlang.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian D',
        partTitle: 'Borang Penilaian Etika Profesional & Pematuhan Keselamatan (20%)',
        evaluator: 'JI & TPF',
        weightagePercent: 20,
        description: 'Dinilai bersama oleh Jurulatih Industri (JI - 10%) dan Tenaga Pengajar Fakulti (TPF - 10%) sepanjang 6 bulan (CLO3, PLO8).',
        criteria: [
          {
            id: 'eth_1',
            title: '1. Kehadiran & Ketetapan Waktu Kerja Industri',
            maxScore: 4,
            levels: {
              1: 'Kerap ponteng, datang lewat dan pulang awal tanpa kebenaran pihak pengurusan firma.',
              2: 'Pernah lewat dan tidak memaklumkan ketidakhadiran mengikut prosedur syarikat.',
              3: 'Sentiasa hadir bertugas tepat pada masanya dan mematuhi jadual kerja firma.',
              4: 'Rekod kehadiran 100% sempurna, sangat komited, berintegriti terhadap masa dan teladan terbaik.'
            }
          },
          {
            id: 'eth_2',
            title: '2. Pematuhan Dasar Keselamatan, Kesihatan Pekerjaan & 5S (OSHA)',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan SOP keselamatan, enggan memakai PPE dan mengancam keselamatan tempat kerja.',
              2: 'Mematuhi peraturan keselamatan hanya apabila dipantau secara ketat oleh penyelia.',
              3: 'Sentiasa memakai PPE, mematuhi SOP keselamatan dan menjaga kebersihan ruang kerja (5S).',
              4: 'Sangat komited terhadap budaya keselamatan sifar kemalangan, proaktif mengenal pasti hazad dan mengamalkan 5S cemerlang.'
            }
          },
          {
            id: 'eth_3',
            title: '3. Integriti, Amanah & Kerahsiaan Perniagaan Firma',
            maxScore: 4,
            levels: {
              1: 'Membocorkan maklumat sulit syarikat atau tidak jujur dalam urusan kerja.',
              2: 'Kurang peka terhadap batas kerahsiaan maklumat perniagaan dan harta intelek firma.',
              3: 'Menjaga kerahsiaan data perniagaan dan amanah dalam melaksanakan tugas.',
              4: 'Integriti sangat tinggi, jujur, telus dan mempertahankan nama baik serta kerahsiaan syarikat sepenuhnya.'
            }
          },
          {
            id: 'eth_4',
            title: '4. Kepatuhan Terhadap Arahan & Kod Etika Majikan',
            maxScore: 4,
            levels: {
              1: 'Ingkar arahan Jurulatih Industri dan melanggar peraturan tatatertib syarikat.',
              2: 'Melaksanakan arahan dengan rungutan dan kurang menghormati hierarki organisasi.',
              3: 'Sentiasa akur kepada arahan pihak majikan dan menghormati carta organisasi syarikat.',
              4: 'Sangat patuh, menghormati budaya korporat syarikat dan menunjukkan kesetiaan profesional yang tinggi.'
            }
          },
          {
            id: 'eth_5',
            title: '5. Tingkah Laku Moral & Tatatertib Pelajar UTeM',
            maxScore: 4,
            levels: {
              1: 'Melakukan salah laku moral atau mencemarkan imej universiti dan syarikat.',
              2: 'Tingkah laku kurang memuaskan dan memerlukan teguran daripada pihak pengurusan.',
              3: 'Mempamerkan sahsiah terpuji, bersopan santun dan memelihara nama baik universiti.',
              4: 'Menjadi duta pelajar UTeM yang cemerlang, berakhlak mulia dan dipuji oleh pihak pengurusan industri.'
            }
          }
        ]
      }
    ]
  },

  // Course 2: BTMT 3283(i) Business Analytics (3 Kredit)
  'BTMT 3283(i)': {
    courseCode: 'BTMT 3283(i)',
    courseName: 'Business Analytics',
    creditHours: 3,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Student Performance Evaluation (Weekly Report)', domain: 'Kognitif (C2/C4)', clo: 'CLO3', plo: 'PLO8 (C5)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 40 },
      { no: 2, componentName: 'Student Performance Evaluation (Soft Skills & Digital)', domain: 'Afektif (A2/A3)', clo: 'CLO2', plo: 'PLO6 (C3D)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 20 },
      { no: 3, componentName: 'Presentation (Pembentangan Analitik)', domain: 'Kognitif (C4)', clo: 'CLO1', plo: 'PLO3 (C3A)', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 10 },
      { no: 4, componentName: 'Case Study Report (Laporan Kajian Kes Analitik)', domain: 'Psikomotor (P1/P4)', clo: 'CLO1, 2, 3', plo: 'PLO3, 6, 8', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 30 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Prestasi Mingguan & Laporan Analitik (JI - 40%)',
        evaluator: 'JI',
        weightagePercent: 40,
        description: 'Dinilai oleh Jurulatih Industri (JI) di tempat kerja bagi mengukur kebolehan pelajar mengekstrak data, meneroka isu analitik dan mencadangkan tindakan keputusan (CLO3, PLO8).',
        criteria: [
          {
            id: 'ba_w_1',
            title: '1. Pemahaman Konsep & Ekstraksi Data Industri',
            maxScore: 4,
            levels: {
              1: 'Gagal memahami struktur data industri dan tidak tahu mengekstrak data yang relevan.',
              2: 'Memahami konsep asas tetapi memerlukan bimbingan kerap dalam mengumpul data.',
              3: 'Mampu mengekstrak data industri yang berkaitan dengan operasi syarikat secara teratur.',
              4: 'Sangat mahir mengekstrak, membersihkan (data cleaning) dan menstruktur data kompleks industri.'
            }
          },
          {
            id: 'ba_w_2',
            title: '2. Aplikasi Alat Analitik & Pemodelan Data',
            maxScore: 4,
            levels: {
              1: 'Tidak tahu menggunakan perisian analitik (Excel Solver, SPSS, Python, PowerBI).',
              2: 'Menggunakan alat analitik secara terhad dan bergantung kepada templat asas.',
              3: 'Mengaplikasikan alat statistik dan model pembuatan keputusan dengan betul.',
              4: 'Penguasaan tinggi dalam membangunkan model deskriptif/prediktif untuk menyelesaikan isu perniagaan.'
            }
          },
          {
            id: 'ba_w_3',
            title: '3. Kualiti & Analisis Laporan Mingguan',
            maxScore: 4,
            levels: {
              1: 'Laporan tidak lengkap, lewat dihantar dan tiada analisis data perniagaan.',
              2: 'Laporan sekadar mencatat tugasan rutin tanpa sokongan visualisasi atau graf.',
              3: 'Laporan lengkap, menyertakan visualisasi data dan dihantar tepat pada masanya.',
              4: 'Laporan sangat analitikal, menyertakan papan pemuka (dashboard), cerapan data (insights) dan disokong fakta.'
            }
          },
          {
            id: 'ba_w_4',
            title: '4. Cadangan Tindakan Berasaskan Data (Decision Making)',
            maxScore: 4,
            levels: {
              1: 'Pasif, tiada cadangan alternatif untuk menyelesaikan masalah industri.',
              2: 'Cadangan tidak disokong oleh bukti analitik yang kukuh.',
              3: 'Mencadangkan alternatif tindakan yang logik dan disokong oleh interpretasi data.',
              4: 'Sangat proaktif mencadangkan tindakan preskriptif yang inovatif, berdaya maju dan berimpak tinggi.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Kemahiran Insaniah, Etika & Kemahiran Digital (JI - 20%)',
        evaluator: 'JI',
        weightagePercent: 20,
        description: 'Dinilai oleh Jurulatih Industri (JI) bagi mengukur etika pengendalian data, integriti, disiplin dan kemahiran digital pelajar (CLO2, PLO6).',
        criteria: [
          {
            id: 'ba_s_1',
            title: '1. Integriti & Etika Kerahsiaan Data (Data Governance)',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan kerahsiaan data sulit industri dan tidak beretika.',
              2: 'Kurang peka terhadap privasi data syarikat.',
              3: 'Sentiasa menjaga kerahsiaan data mengikut polisi syarikat.',
              4: 'Sangat beretika, mematuhi akta perlindungan data dan garis panduan industri.'
            }
          },
          {
            id: 'ba_s_2',
            title: '2. Kehadiran & Ketepatan Masa',
            maxScore: 4,
            levels: {
              1: 'Kerap lewat atau tidak hadir tanpa makluman rasmi.',
              2: 'Pernah lewat dan kurang berdisiplin terhadap masa kerja.',
              3: 'Kehadiran sangat baik dan sentiasa menepati masa.',
              4: 'Kehadiran 100%, sangat komited dan menepati tarikh akhir projek.'
            }
          },
          {
            id: 'ba_s_3',
            title: '3. Literasi Digital & Kebolehan Mempelajari Alat Baharu',
            maxScore: 4,
            levels: {
              1: 'Sukar menguasai sistem perisian digital syarikat.',
              2: 'Mengambil masa lama untuk menyesuaikan diri dengan sistem perisian.',
              3: 'Cepat mempelajari perisian dan platform analitik yang digunakan.',
              4: 'Sangat tangkas (agile) dalam meneroka dan memanfaatkan teknologi digital terkini.'
            }
          },
          {
            id: 'ba_s_4',
            title: '4. Komunikasi Data & Hubungan Interpersonal',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan dapatan analitik kepada rakan sekerja.',
              2: 'Komunikasi data terhad dan sukar difahami oleh bukan pakar teknikal.',
              3: 'Mampu berkomunikasi dan menerangkan hasil analitik dengan sopan.',
              4: 'Sangat mahir menceritakan data (data storytelling) secara meyakinkan dan profesional.'
            }
          },
          {
            id: 'ba_s_5',
            title: '5. Kerja Berpasukan & Kolaborasi Silang Fungsi',
            maxScore: 4,
            levels: {
              1: 'Sukar bekerjasama dan kerap menimbulkan salah faham.',
              2: 'Kurang berinteraksi dengan jabatan/unit lain dalam syarikat.',
              3: 'Bekerjasama dengan baik bersama pasukan pelbagai fungsi.',
              4: 'Pemimpin pasukan yang cemerlang dan memupuk kolaborasi analitik yang harmoni.'
            }
          },
          {
            id: 'ba_s_6',
            title: '6. Tanggungjawab & Ketelitian Kerja (Attention to Detail)',
            maxScore: 4,
            levels: {
              1: 'Kerja cuai, banyak kesilapan data dan mengabaikan arahan.',
              2: 'Memerlukan semakan berulang kali daripada penyelia.',
              3: 'Hasil kerja teliti, tepat dan bertanggungjawab.',
              4: 'Sangat teliti, sifar ralat analisis data dan bertanggungjawab penuh atas tugasan.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Pembentangan Projek Analitik (TPF - 10%)',
        evaluator: 'TPF',
        weightagePercent: 10,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) semasa lawatan pemantauan atau pembentangan viva analitik perniagaan (CLO1, PLO3).',
        criteria: [
          {
            id: 'ba_p_1',
            title: '1. Penguasaan Metodologi & Model Analitik',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan metodologi dan model analitik yang diguna pakai.',
              2: 'Penerangan model analitik terlalu umum dan kurang tepat.',
              3: 'Menerangkan kaedah analisis dan algoritma pemodelan dengan jelas.',
              4: 'Penguasaan teori dan teknikal analitik sangat mendalam dan mantap.'
            }
          },
          {
            id: 'ba_p_2',
            title: '2. Visualisasi Data & Reka Bentuk Papan Pemuka',
            maxScore: 4,
            levels: {
              1: 'Visualisasi data mengelirukan, tidak tersusun dan tiada carta.',
              2: 'Visualisasi minima dan reka bentuk papan pemuka kurang kemas.',
              3: 'Papan pemuka (dashboard) tersusun dengan graf analitik yang sesuai.',
              4: 'Visualisasi interaktif, reka bentuk dashboard bertaraf profesional dan estetik.'
            }
          },
          {
            id: 'ba_p_3',
            title: '3. Struktur & Gaya Penyampaian (Data Storytelling)',
            maxScore: 4,
            levels: {
              1: 'Penyampaian tidak teratur dan gagal menyampaikan mesej analitik.',
              2: 'Penyampaian mendatar dan urutan slaid kurang logik.',
              3: 'Penyampaian tersusun, yakin dan menghubungkan data dengan konteks perniagaan.',
              4: 'Penceritaan data (storytelling) sangat menarik, lancar, memukau dan berfokus.'
            }
          },
          {
            id: 'ba_p_4',
            title: '4. Sesi Soal Jawab & Justifikasi Model',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan teknikal daripada panel penilai.',
              2: 'Jawapan kurang meyakinkan dan tidak disokong fakta data.',
              3: 'Menjawab soalan teknikal dan praktikal industri dengan yakin.',
              4: 'Hujah sangat matang, mempertahankan ketepatan model dengan bukti empirikal.'
            }
          },
          {
            id: 'ba_p_5',
            title: '5. Profesionalisme & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Pakaian tidak profesional dan masa pembentangan melebihi had.',
              2: 'Pengurusan masa kurang seimbang antara analisis dan dapatan.',
              3: 'Menepati masa dan berpakaian kemas mematuhi etika akademik/industri.',
              4: 'Sangat menepati had masa, berkarisma dan beretika tinggi.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian D',
        partTitle: 'Borang Penilaian Laporan Kajian Kes Analitik Perniagaan (TPF - 30%)',
        evaluator: 'TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) berdasarkan laporan penuh projek analitik data di industri (CLO1, CLO2, CLO3).',
        criteria: [
          {
            id: 'ba_r_1',
            title: '1. Pengenalan Masalah Perniagaan & Skop Data (15%)',
            maxScore: 4,
            levels: {
              1: 'Latar belakang masalah perniagaan dan definisi data sangat kabur.',
              2: 'Penerangan masalah ada tetapi skop pemboleh ubah data tidak jelas.',
              3: 'Penerangan masalah perniagaan jelas dan set data dikenal pasti dengan tepat.',
              4: 'Pernyataan masalah sangat berfokus, objektif analitik jelas dan profil data komprehensif.'
            }
          },
          {
            id: 'ba_r_2',
            title: '2. Pra-pemprosesan Data & Eksplorasi (EDA) (20%)',
            maxScore: 4,
            levels: {
              1: 'Tiada pra-pemprosesan dan analisis data eksploratori (EDA) tidak dijalankan.',
              2: 'EDA sangat asas tanpa menangani nilai hilang (missing values) atau pencilan (outliers).',
              3: 'Pembersihan data dilaksanakan dengan baik dan disertakan analisis statistik deskriptif.',
              4: 'Eksplorasi data (EDA) sangat mendalam, normalisasi rapi dan korelasi dianalisis secara saintifik.'
            }
          },
          {
            id: 'ba_r_3',
            title: '3. Pembangunan & Penilaian Model Analitik (25%)',
            maxScore: 4,
            levels: {
              1: 'Gagal membina model analitik dan tiada pengesahan model.',
              2: 'Model dibina tetapi kriteria penilaian ketepatan model tidak mencukupi.',
              3: 'Model analitik dibina dengan teknik yang betul dan dinilai prestasinya.',
              4: 'Model analitik cemerlang, pengesahan silang (cross-validation) mantap dan metrik prestasi terperinci.'
            }
          },
          {
            id: 'ba_r_4',
            title: '4. Cadangan Strategik & Preskriptif Perniagaan (25%)',
            maxScore: 4,
            levels: {
              1: 'Cadangan tidak praktikal dan tiada kaitan dengan hasil analitik.',
              2: 'Cadangan perniagaan umum tanpa disokong oleh cerapan data yang jelas.',
              3: 'Cadangan tindakan perniagaan praktikal dan berpandukan dapatan model.',
              4: 'Solusi preskriptif inovatif, disertakan analisis kos-faedah (ROI) dan pelan pelaksanaan industri.'
            }
          },
          {
            id: 'ba_r_5',
            title: '5. Format, Gaya Penulisan & Rujukan Saintifik (15%)',
            maxScore: 4,
            levels: {
              1: 'Format tidak kemas, plagiarisme tinggi dan tiada rujukan.',
              2: 'Format laporan sederhana dan senarai rujukan sangat terhad.',
              3: 'Format mengikut panduan fakulti, rujukan relevan dan bahasa akademik kemas.',
              4: 'Laporan bertaraf profesional, struktur teknikal mantap, visualisasi kemas dan rujukan terkini.'
            }
          }
        ]
      }
    ]
  },

  // Course 3: BTMU 2103(i) Operations Management (3 Kredit)
  'BTMU 2103(i)': {
    courseCode: 'BTMU 2103(i)',
    courseName: 'Operations Management',
    creditHours: 3,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Student Performance Evaluation (Weekly Report)', domain: 'Kognitif (C6)', clo: 'CLO3', plo: 'PLO9 (C3F)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 40 },
      { no: 2, componentName: 'Student Performance Evaluation (Soft Skills Rubric)', domain: 'Afektif (A5)', clo: 'CLO2', plo: 'PLO8 (C5)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 20 },
      { no: 3, componentName: 'Presentation (Pembentangan Projek)', domain: 'Kognitif (C6)', clo: 'CLO1', plo: 'PLO3 (C3A)', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 10 },
      { no: 4, componentName: 'Case Study Report (Laporan Kajian Kes WBL)', domain: 'Psikomotor (P6)', clo: 'CLO1, 2, 3', plo: 'PLO3, 8, 9', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 30 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Prestasi Mingguan & Laporan Operasi (JI - 40%)',
        evaluator: 'JI',
        weightagePercent: 40,
        description: 'Dinilai oleh Jurulatih Industri (JI) di tempat kerja bagi mengukur penguasaan teknikal dan pematuhan jadual operasi pelajar (CLO3, PLO9).',
        criteria: [
          {
            id: 'om_w_1',
            title: '1. Kefahaman Aliran Operasi & Susun Atur Fasiliti (W1-W4)',
            maxScore: 4,
            levels: {
              1: 'Gagal memahami susun atur fasiliti operasi (ruang kerja/kaunter/gudang/stor/pejabat) dan aliran proses kerja dari input sehingga penyerahan output/perkhidmatan.',
              2: 'Memahami prinsip asas aliran operasi tetapi memerlukan bimbingan berterusan dalam memetakan proses kerja firma.',
              3: 'Memahami aliran operasi, stesen kerja, pengurusan masa dan susun atur fasiliti operasi dengan tepat.',
              4: 'Penguasaan mendalam aliran operasi fasiliti, perancangan kapasiti sumber (manusia/sistem/peralatan), dan proaktif mengenal pasti serta mengatasi kekangan (bottleneck) operasi.'
            }
          },
          {
            id: 'om_w_2',
            title: '2. Aplikasi Alat & Teknik Pengurusan Operasi (Universal Lean & Kaizen)',
            maxScore: 4,
            levels: {
              1: 'Tidak menggunakan alat pengurusan operasi (5S, Kaizen, Kanban, SLA/SOP kualiti) dalam tugasan harian.',
              2: 'Mengaplikasikan alat operasi secara minimum dan terhad kepada arahan langsung.',
              3: 'Menggunakan alat pengurusan operasi (5S, SOP, aliran kerja lancar) dengan betul dan konsisten dalam tugasan.',
              4: 'Sangat mahir mengaplikasi kaedah penambahbaikan operasi (Lean/Kaizen/5S), mengenal pasti pembaziran dan meningkatkan produktiviti perkhidmatan/barangan.'
            }
          },
          {
            id: 'om_w_3',
            title: '3. Ketepatan & Analisis Laporan Mingguan',
            maxScore: 4,
            levels: {
              1: 'Laporan mingguan tidak lengkap, lewat dihantar, dan tidak mengandungi data operasi.',
              2: 'Laporan sekadar ringkasan aktiviti harian tanpa analisis teknikal operasi.',
              3: 'Laporan berstruktur, mengandungi data operasi dan dihantar tepat pada masanya.',
              4: 'Laporan sangat komprehensif, mengandungi analisis log operasi yang analitikal, reflektif dan disokong data sebenar tempat kerja.'
            }
          },
          {
            id: 'om_w_4',
            title: '4. Penyelesaian Masalah Operasi & Inisiatif Solusi',
            maxScore: 4,
            levels: {
              1: 'Pasif terhadap masalah operasi dan tiada inisiatif menyelesaikan isu kerja.',
              2: 'Cuba menyelesaikan masalah rutin tetapi bergantung sepenuhnya kepada bimbingan.',
              3: 'Berjaya menyelesaikan masalah operasi rutin di ruang kerja industri secara berdikari.',
              4: 'Proaktif, mencadangkan penyelesaian inovatif untuk mengatasi isu kapasiti, masa menunggu, kesesakan dan kawalan kualiti sistem.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Kemahiran Insaniah & Etika Profesional (JI - 20%)',
        evaluator: 'JI',
        weightagePercent: 20,
        description: 'Dinilai oleh Jurulatih Industri (JI) berasaskan pemerhatian sikap, etika, dan disiplin pelajar di industri (CLO2, PLO8).',
        criteria: [
          {
            id: 'om_s_1',
            title: '1. Kehadiran, Ketepatan Masa & Kebergantungan',
            maxScore: 4,
            levels: {
              1: 'Kerap lewat/tidak hadir tanpa sebab munasabah.',
              2: 'Pernah lewat dan kurang proaktif terhadap masa.',
              3: 'Hadir tepat pada masanya dan boleh diharap.',
              4: 'Kehadiran 100%, sangat menepati masa dan berdisiplin tinggi.'
            }
          },
          {
            id: 'om_s_2',
            title: '2. Etika Kerja & Pematuhan Keselamatan (OSHA)',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan SOP keselamatan dan etika kerja.',
              2: 'Mematuhi SOP hanya apabila dipantau rapi.',
              3: 'Sentiasa mematuhi peraturan dan memakai PPE.',
              4: 'Teladan dalam amalan 5S, keselamatan dan etika profesional.'
            }
          },
          {
            id: 'om_s_3',
            title: '3. Inisiatif & Pembelajaran Kendiri',
            maxScore: 4,
            levels: {
              1: 'Pasif, menunggu arahan dan kurang berminat.',
              2: 'Melakukan tugasan asas tanpa inisiatif tambahan.',
              3: 'Menunjukkan minat belajar dan inisiatif menyelesaikan tugas.',
              4: 'Sangat proaktif, berinisiatif tinggi mencari ilmu dan tugasan baharu.'
            }
          },
          {
            id: 'om_s_4',
            title: '4. Kerja Berpasukan & Hubungan Interpersonal',
            maxScore: 4,
            levels: {
              1: 'Sukar bekerjasama dan kerap menimbulkan konflik.',
              2: 'Kurang berinteraksi dengan rakan sepasukan industri.',
              3: 'Bekerjasama dengan baik dan menghormati rakan sekerja.',
              4: 'Pemimpin pasukan yang cemerlang, memotivasi rakan sekerja.'
            }
          },
          {
            id: 'om_s_5',
            title: '5. Komunikasi Profesional',
            maxScore: 4,
            levels: {
              1: 'Gagal berkomunikasi dengan jelas dan sopan.',
              2: 'Komunikasi terhad dan kurang yakin.',
              3: 'Berkomunikasi secara berkesan dan bertatasusila.',
              4: 'Komunikasi lisan/bertulis sangat fasih, tepat dan meyakinkan.'
            }
          },
          {
            id: 'om_s_6',
            title: '6. Kebolehsuaian & Tanggungjawab (Accountability)',
            maxScore: 4,
            levels: {
              1: 'Mengelak daripada memikul tanggungjawab.',
              2: 'Mengambil masa lama untuk menyesuaikan diri.',
              3: 'Mudah menyesuaikan diri dengan budaya kerja syarikat.',
              4: 'Sangat tangkas (agile), bertanggungjawab penuh atas hasil kerja.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Pembentangan Projek Operasi (TPF - 10%)',
        evaluator: 'TPF',
        weightagePercent: 10,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) semasa sesi lawatan industri / pembentangan viva projek operasi (CLO1, PLO3).',
        criteria: [
          {
            id: 'om_p_1',
            title: '1. Penguasaan Kandungan Teknikal Operasi',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan sistem dan konsep operasi syarikat.',
              2: 'Penerangan konsep asas operasi kurang mendalam.',
              3: 'Menerangkan sistem operasi industri dengan jelas dan tepat.',
              4: 'Penguasaan teknikal cemerlang, sintesis data operasi mantap.'
            }
          },
          {
            id: 'om_p_2',
            title: '2. Struktur & Kejelasan Penyampaian',
            maxScore: 4,
            levels: {
              1: 'Penyampaian tidak teratur dan sukar difahami.',
              2: 'Penyampaian mendatar dan urutan slaid kurang logik.',
              3: 'Penyampaian tersusun mengikut struktur projek yang baik.',
              4: 'Penyampaian sangat profesional, menarik dan lancar.'
            }
          },
          {
            id: 'om_p_3',
            title: '3. Kualiti Bahan Bantuan Visual (Slaid)',
            maxScore: 4,
            levels: {
              1: 'Slaid teks padat, tidak menarik dan tiada visual operasi.',
              2: 'Visual minima, format kurang kemas.',
              3: 'Slaid tersusun, menggunakan carta aliran dan gambar rajah.',
              4: 'Reka bentuk visual profesional, infografik operasi sangat jelas.'
            }
          },
          {
            id: 'om_p_4',
            title: '4. Sesi Soal Jawab (Q&A)',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan teknikal panel penilai.',
              2: 'Jawapan kurang tepat dan teragak-agak.',
              3: 'Menjawab soalan teknikal dengan tepat dan yakin.',
              4: 'Jawapan sangat matang, disokong bukti data operasi industri.'
            }
          },
          {
            id: 'om_p_5',
            title: '5. Profesionalisme & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Pakaian tidak kemas dan masa pembentangan melebihi had.',
              2: 'Pengurusan masa kurang memuaskan.',
              3: 'Menepati masa dan berpakaian profesional.',
              4: 'Sangat menepati masa, karisma dan etika profesional tinggi.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian D',
        partTitle: 'Borang Penilaian Laporan Kajian Kes Operasi Industri (TPF - 30%)',
        evaluator: 'TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) bagi mengukur kemahiran analitikal dan cadangan penambahbaikan sistem operasi sebenar (CLO1, CLO2, CLO3).',
        criteria: [
          {
            id: 'om_r_1',
            title: '1. Pengenalan & Pemetaan Aliran Operasi Firma (15%)',
            maxScore: 4,
            levels: {
              1: 'Penerangan latar belakang syarikat dan aliran operasi sangat kabur.',
              2: 'Penerangan asas operasi syarikat tetapi tiada pemetaan proses terperinci.',
              3: 'Penerangan operasi jelas dengan rajah susun atur dan aliran proses lengkap.',
              4: 'Gambaran holistik sistem operasi, carta alir nilai (VSM) dan susun atur sangat cemerlang.'
            }
          },
          {
            id: 'om_r_2',
            title: '2. Analisis Kekangan & Isu Operasi (Bottleneck) (30%)',
            maxScore: 4,
            levels: {
              1: 'Tiada data operasi dan gagal mengenal pasti isu kekangan operasi.',
              2: 'Mengenal pasti isu operasi tetapi analisis data adalah minima.',
              3: 'Analisis isu operasi (kapasiti, masa kitaran, inventori) disokong data.',
              4: 'Analisis diagnostik mendalam terhadap bottleneck, pembaziran (Muda) disokong data empirikal.'
            }
          },
          {
            id: 'om_r_3',
            title: '3. Penandaarasan Industri (Benchmarking) (15%)',
            maxScore: 4,
            levels: {
              1: 'Tiada perbandingan dengan amalan terbaik industri.',
              2: 'Perbandingan industri terhad dan kurang relevan.',
              3: 'Membuat penandaarasan amalan operasi terbaik industri (Lean/JIT).',
              4: 'Penandaarasan komprehensif mengikut piawaian industri global (ISO/Six Sigma/Lean).'
            }
          },
          {
            id: 'om_r_4',
            title: '4. Cadangan Penambahbaikan & Pelan Pelaksanaan (25%)',
            maxScore: 4,
            levels: {
              1: 'Cadangan tidak praktikal dan tidak menyelesaikan punca masalah.',
              2: 'Cadangan penyelesaian asas tanpa pelan tindakan yang jelas.',
              3: 'Cadangan praktikal, menyelesaikan isu operasi dan disertakan jadual.',
              4: 'Solusi inovatif, analisis kos-faedah (ROI) yang mantap serta pelan pelaksanaan realistik.'
            }
          },
          {
            id: 'om_r_5',
            title: '5. Format, Etika & Rujukan Akademik (15%)',
            maxScore: 4,
            levels: {
              1: 'Format laporan tidak teratur, tiada rujukan dan plagiarisme tinggi.',
              2: 'Format laporan sederhana dan senarai rujukan terhad.',
              3: 'Format mengikut garis panduan fakulti, rujukan relevan dan etika dipatuhi.',
              4: 'Format laporan sangat profesional, gaya penulisan teknikal tinggi, rujukan piawai terkini.'
            }
          }
        ]
      }
    ]
  },

  // Course 4: BTMT 2113(i) Brand Management (3 Kredit)
  'BTMT 2113(i)': {
    courseCode: 'BTMT 2113(i)',
    courseName: 'Brand Management',
    creditHours: 3,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Student Performance Evaluation (Weekly Report)', domain: 'Afektif (A1)', clo: 'CLO3', plo: 'PLO8 (C5)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 40 },
      { no: 2, componentName: 'Student Performance Evaluation (Soft Skills Rubric)', domain: 'Psikomotor (P2)', clo: 'CLO2', plo: 'PLO3 (C3A)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 20 },
      { no: 3, componentName: 'Presentation (Pembentangan Projek Penjenamaan)', domain: 'Kognitif (C2)', clo: 'CLO1', plo: 'PLO2 (C2)', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 10 },
      { no: 4, componentName: 'Case Study Report (Laporan Kajian Kes Penjenamaan)', domain: 'Kognitif & Psikomotor', clo: 'CLO1, 2, 3', plo: 'PLO2, 3, 8', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 30 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Prestasi Mingguan & Laporan Penjenamaan (JI - 40%)',
        evaluator: 'JI',
        weightagePercent: 40,
        description: 'Dinilai oleh Jurulatih Industri (JI) di tempat kerja bagi mengukur kebolehan pelajar melaksanakan strategi penjenamaan korporat/produk (CLO3, PLO8).',
        criteria: [
          {
            id: 'bm_w_1',
            title: '1. Pemahaman Identiti Jenama & Posisi Pasaran (Brand Positioning)',
            maxScore: 4,
            levels: {
              1: 'Gagal memahami identiti jenama organisasi dan sasaran posisi pasaran syarikat.',
              2: 'Memahami identiti asas tetapi memerlukan panduan kerap dalam aktiviti penjenamaan.',
              3: 'Memahami kedudukan jenama (brand positioning) dan identiti jenama dengan jelas.',
              4: 'Penguasaan sangat mendalam terhadap ekuiti jenama berasaskan pelanggan (CBBE) dan posisi pasaran unik firma.'
            }
          },
          {
            id: 'bm_w_2',
            title: '2. Aplikasi Teknologi & Alat Komunikasi Pemasaran Bersepadu (IMC)',
            maxScore: 4,
            levels: {
              1: 'Tidak mengaplikasikan alat digital/teknologi dalam kempen komunikasi jenama.',
              2: 'Penggunaan alat teknologi jenama sangat minimum dan terhad kepada arahan langsung.',
              3: 'Menggunakan alat teknologi dan saluran IMC dengan betul serta konsisten.',
              4: 'Sangat kreatif mengintegrasikan teknologi digital, media sosial dan kempen IMC bagi membina ekuiti jenama.'
            }
          },
          {
            id: 'bm_w_3',
            title: '3. Ketepatan, Struktur & Analisis Laporan Mingguan',
            maxScore: 4,
            levels: {
              1: 'Laporan tidak lengkap, lewat dihantar dan tiada analisis aktiviti jenama.',
              2: 'Laporan sekadar mencatat log tugas harian tanpa analisis prestasi jenama.',
              3: 'Laporan lengkap, tersusun rapi, disertakan bukti visual dan dihantar tepat pada masanya.',
              4: 'Laporan sangat komprehensif, analitikal, mengandungi analisis sentimen jenama dan refleksi strategik.'
            }
          },
          {
            id: 'bm_w_4',
            title: '4. Cadangan Strategi Portfolio Jenama & Inisiatif Nilai Tambah',
            maxScore: 4,
            levels: {
              1: 'Bersikap pasif dan tiada cadangan penambahbaikan nilai jenama firma.',
              2: 'Cadangan penjenamaan asas tanpa pelan peluasan jenama (brand extension) yang jelas.',
              3: 'Mencadangkan strategi portfolio jenama yang logik dan sesuai dengan pasaran firma.',
              4: 'Sangat proaktif mencadangkan strategi portfolio dan peluasan jenama yang inovatif, berdaya saing dan bernilai tinggi.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Kemahiran Insaniah & Praktikal Teknologi Jenama (JI - 20%)',
        evaluator: 'JI',
        weightagePercent: 20,
        description: 'Dinilai oleh Jurulatih Industri (JI) bagi mengukur kebolehan praktikal pembangunan mekanisme teknologi jenama, disiplin, etika dan kerjasama pasukan (CLO2, PLO3).',
        criteria: [
          {
            id: 'bm_s_1',
            title: '1. Kehadiran, Disiplin & Ketepatan Masa',
            maxScore: 4,
            levels: {
              1: 'Kerap lewat atau tidak hadir tanpa sebab munasabah.',
              2: 'Pernah lewat dan kurang komited terhadap waktu kerja.',
              3: 'Sentiasa hadir tepat pada masanya dan berdisiplin.',
              4: 'Kehadiran 100%, sangat menepati masa dan komitmen kerja cemerlang.'
            }
          },
          {
            id: 'bm_s_2',
            title: '2. Etika Kerja & Perlindungan Integriti Jenama Korporat',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan etika dan garis panduan integriti jenama syarikat.',
              2: 'Mematuhi garis panduan jenama hanya apabila ditegur.',
              3: 'Sentiasa mematuhi etika profesional dan garis panduan jenama korporat.',
              4: 'Sangat berintegriti dalam memelihara reputasi jenama dan kerahsiaan strategi organisasi.'
            }
          },
          {
            id: 'bm_s_3',
            title: '3. Inisiatif & Kreativiti Pembangunan Aset Jenama',
            maxScore: 4,
            levels: {
              1: 'Pasif, menunggu arahan dan tiada idea kreatif.',
              2: 'Melaksanakan kerja penjenamaan asas tanpa sebarang inovasi.',
              3: 'Menunjukkan kreativiti dan inisiatif menghasilkan bahan jenama.',
              4: 'Sangat inovatif, mencetuskan idea reka bentuk jenama dan kempen kreatif yang berimpak.'
            }
          },
          {
            id: 'bm_s_4',
            title: '4. Kerjasama Pasukan & Hubungan Interpersonal',
            maxScore: 4,
            levels: {
              1: 'Sukar bekerjasama dan kerap menimbulkan perselisihan faham.',
              2: 'Kurang berinteraksi dengan rakan sepasukan pemasaran/operasi.',
              3: 'Bekerjasama dengan baik dan menghormati rakan sekerja.',
              4: 'Semangat kerja sepasukan cemerlang, memupuk sinergi kreatif dalam pasukan.'
            }
          },
          {
            id: 'bm_s_5',
            title: '5. Komunikasi Profesional & Pembentangan Mesej Jenama',
            maxScore: 4,
            levels: {
              1: 'Gagal menyampaikan mesej jenama secara berkesan.',
              2: 'Komunikasi terhad dan kurang yakin menyampaikan konsep jenama.',
              3: 'Berkomunikasi secara jelas, sopan dan meyakinkan.',
              4: 'Sangat fasih, penyampaian mesej jenama menarik dan bertaraf profesional.'
            }
          },
          {
            id: 'bm_s_6',
            title: '6. Kebolehsuaian & Akauntabiliti (Accountability)',
            maxScore: 4,
            levels: {
              1: 'Mengelak daripada memikul tanggungjawab penjenamaan.',
              2: 'Mengambil masa lama untuk menyesuaikan diri dengan budaya firma.',
              3: 'Mudah menyesuaikan diri dengan persekitaran kerja industri.',
              4: 'Sangat tangkas (agile), bertanggungjawab penuh ke atas setiap kempen yang diamanahkan.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Pembentangan Projek Pengurusan Jenama (TPF - 10%)',
        evaluator: 'TPF',
        weightagePercent: 10,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) semasa sesi lawatan pemantauan industri atau viva pembentangan strategi jenama (CLO1, PLO2).',
        criteria: [
          {
            id: 'bm_p_1',
            title: '1. Penguasaan Teori & Konsep Pengurusan Jenama',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan konsep ekuiti, resonans dan nilai jenama firma.',
              2: 'Penerangan konsep jenama terlalu umum dan kurang mendalam.',
              3: 'Menerangkan strategi penjenamaan dan model resonans jenama dengan tepat.',
              4: 'Penguasaan konsep jenama sangat mantap, mengaitkan teori akademik dengan konteks industri sebenar.'
            }
          },
          {
            id: 'bm_p_2',
            title: '2. Analisis Isu & Prosedur Pelaksanaan Jenama',
            maxScore: 4,
            levels: {
              1: 'Gagal menganalisis isu reputasi atau cabaran jenama firma.',
              2: 'Analisis cabaran jenama kurang menyeluruh dan terhad.',
              3: 'Menganalisis isu pasaran jenama dan prosedur pelaksanaan secara teratur.',
              4: 'Analisis diagnostik isu penjenamaan sangat tajam, analitikal dan disokong fakta industri.'
            }
          },
          {
            id: 'bm_p_3',
            title: '3. Reka Bentuk Visual & Kualiti Bahan Pembentangan',
            maxScore: 4,
            levels: {
              1: 'Slaid teks padat, reka bentuk tidak kemas dan tiada aset visual jenama.',
              2: 'Visual jenama minima dan susun atur persembahan kurang menarik.',
              3: 'Slaid tersusun kemas, menyertakan visual identiti jenama dan carta aliran.',
              4: 'Reka bentuk persembahan bertaraf agensi kreatif, infografik visual jenama sangat menarik dan profesional.'
            }
          },
          {
            id: 'bm_p_4',
            title: '4. Sesi Soal Jawab & Keyakinan Hujah (Q&A)',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan penilaian panel TPF.',
              2: 'Jawapan kurang meyakinkan dan tidak disokong bukti pasaran.',
              3: 'Menjawab soalan teknikal penjenamaan dengan tepat dan berkeyakinan.',
              4: 'Menjawab soalan dengan hujah matang, mempertahankan strategi jenama dengan fakta empirikal industri.'
            }
          },
          {
            id: 'bm_p_5',
            title: '5. Profesionalisme & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Pakaian tidak mematuhi etika profesional dan melebihi masa.',
              2: 'Pengurusan masa pembentangan kurang seimbang antara topik.',
              3: 'Menepati masa dan berpakaian kemas mematuhi etika korporat.',
              4: 'Sangat menepati had masa, gaya karismatik, berkeyakinan tinggi dan beretika cemerlang.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian D',
        partTitle: 'Borang Penilaian Laporan Kajian Kes Pengurusan Jenama Industri (TPF - 30%)',
        evaluator: 'TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) berdasarkan laporan penuh projek kajian kes penjenamaan korporat dan produk (CLO1, CLO2, CLO3).',
        criteria: [
          {
            id: 'bm_r_1',
            title: '1. Latar Belakang Organisasi & Audit Ekuiti Jenama (15%)',
            maxScore: 4,
            levels: {
              1: 'Latar belakang firma dan audit ekuiti jenama sangat kabur.',
              2: 'Audit jenama dilaksanakan secara asas tanpa instrumen penilaian jelas.',
              3: 'Penerangan profil jenama jelas disertakan analisis audit ekuiti jenama yang teratur.',
              4: 'Audit ekuiti jenama komprehensif, merangkumi rantaian nilai jenama (Brand Value Chain) yang terperinci.'
            }
          },
          {
            id: 'bm_r_2',
            title: '2. Analisis Pasaran, Pesaing & Isu Penjenamaan (25%)',
            maxScore: 4,
            levels: {
              1: 'Tiada analisis pesaing dan gagal mengenal pasti isu jenama firma.',
              2: 'Analisis pesaing sangat terhad dan kurang mendalam.',
              3: 'Analisis kedudukan jenama berbanding pesaing jelas disokong data pasaran.',
              4: 'Analisis perbandingan pesaing (competitive benchmarking) sangat mendalam, SWOT/TOWS jenama mantap.'
            }
          },
          {
            id: 'bm_r_3',
            title: '3. Pembangunan Mekanisme Teknologi Penjenamaan (25%)',
            maxScore: 4,
            levels: {
              1: 'Tiada aplikasi teknologi dalam penyelesaian pengurusan jenama.',
              2: 'Aplikasi teknologi jenama sangat asas tanpa mekanisme pelaksanaan.',
              3: 'Membangunkan mekanisme teknologi digital penjenamaan yang relevan.',
              4: 'Mekanisme teknologi penjenamaan sangat inovatif, mengintegrasikan platform digital, sistem CRM dan IMC.'
            }
          },
          {
            id: 'bm_r_4',
            title: '4. Cadangan Strategi Portfolio & Peluasan Jenama (20%)',
            maxScore: 4,
            levels: {
              1: 'Cadangan strategi jenama tidak praktikal dan tiada hala tuju.',
              2: 'Cadangan strategi umum tanpa pelan tindakan portfolio yang jelas.',
              3: 'Cadangan peluasan jenama (brand extension) dan portfolio praktikal.',
              4: 'Cadangan portfolio jenama holistik, pelan pengurusan risiko reputasi mantap dan pelan pelaksanaan realistik.'
            }
          },
          {
            id: 'bm_r_5',
            title: '5. Format, Etika Penulisan & Rujukan Akademik (15%)',
            maxScore: 4,
            levels: {
              1: 'Format tidak teratur, tiada rujukan dan plagiarisme tinggi.',
              2: 'Format laporan sederhana dan senarai rujukan sangat terhad.',
              3: 'Format mengikut panduan fakulti, rujukan relevan dan etika dipatuhi.',
              4: 'Format laporan sangat profesional, gaya penulisan teknikal tinggi, rujukan berwasit edisi terkini.'
            }
          }
        ]
      }
    ]
  },

  // Course 5: BTMU 4084(i) Final Year Project II (PSM II) (4 Kredit)
  'BTMU 4084(i)': {
    courseCode: 'BTMU 4084(i)',
    courseName: 'Final Year Project II (PSM II)',
    creditHours: 4,
    evaluatorRatio: 'JI: 40% | TPF: 60%',
    jiTotalPercent: 40,
    tpfTotalPercent: 60,
    componentsSummary: [
      { no: 1, componentName: 'General Conduct (Sahsiah, Disiplin & Etika)', domain: 'Afektif (A2) / C5', clo: 'CLO3', plo: 'PLO8 (Etika & Profesionalisme)', evaluator: 'JI (5%) & TPF (5%)', weightPercent: 10 },
      { no: 2, componentName: 'PSM Seminar & Presentation (Pembentangan & Viva)', domain: 'Afektif & Kognitif / C3C', clo: 'CLO4', plo: 'PLO9 (Komunikasi & Kepimpinan)', evaluator: 'JI (15%) & TPF (15%)', weightPercent: 30 },
      { no: 3, componentName: 'Research Report (Laporan Akhir Penyelidikan)', domain: 'Kognitif & Psikomotor / C3C, C4B', clo: 'CLO1, 2, 3, 4', plo: 'PLO4, PLO7, PLO8, PLO9', evaluator: 'JI (20%) & TPF (40%)', weightPercent: 60 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Sahsiah, Etika & Kebertanggungjawaban (General Conduct - 10%)',
        evaluator: 'JI & TPF',
        weightagePercent: 10,
        description: 'Dinilai secara bersama oleh Jurulatih Industri (JI - 5%) dan Tenaga Pengajar Fakulti / Penyelia (TPF - 5%) (CLO3, PLO8).',
        criteria: [
          {
            id: 'psm_g_1',
            title: '1. Disiplin Kehadiran, Komitmen & Pertemuan Penyeliaan',
            maxScore: 4,
            levels: {
              1: 'Kerap gagal menghadiri sesi penyeliaan (bersama TPF/JI) tanpa sebab dan sukar dihubungi.',
              2: 'Menghadiri sesi perbincangan tetapi kurang bersedia dan tidak mematuhi jadual penyelidikan.',
              3: 'Menghadiri sesi penyeliaan secara konsisten, menepati masa dan membawa kemajuan draf kajian.',
              4: 'Komitmen luar biasa, 100% menepati masa, proaktif mengatur perbincangan teknikal dan sangat berdisiplin tinggi.'
            }
          },
          {
            id: 'psm_g_2',
            title: '2. Etika Penyelidikan & Kerahsiaan Data Industri',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan etika penyelidikan, manipulasi data atau tidak mematuhi kerahsiaan firma.',
              2: 'Kurang peka terhadap sensitiviti maklumat sulit industri dan prosedur data.',
              3: 'Mematuhi etika akademik dan menjaga kerahsiaan data organisasi dengan baik.',
              4: 'Integriti penyelidikan cemerlang, sifar isu etika/plagiarisme dan mematuhi polisi keselamatan data firma sepenuhnya.'
            }
          },
          {
            id: 'psm_g_3',
            title: '3. Inisiatif, Sikap Berdikari & Minat Meneroka',
            maxScore: 4,
            levels: {
              1: 'Sangat pasif, menunggu arahan sepenuhnya dan tidak menunjukkan usaha berdikari.',
              2: 'Menjalankan tugas penyelidikan secara minima dan kurang inisiatif menyelesaikan halangan.',
              3: 'Menunjukkan usaha berdikari yang baik dalam mencari sumber literatur dan data lapangan.',
              4: 'Sangat berdikari, proaktif mengatasi kekangan lapangan dan bersemangat tinggi menjayakan projek industri.'
            }
          },
          {
            id: 'psm_g_4',
            title: '4. Responsiviti Terhadap Maklum Balas Penyelia',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan teguran dan tidak membetulkan kesilapan yang diarahkan oleh penyelia.',
              2: 'Mengambil masa terlalu lama untuk membuat pembetulan dan kerap mengulangi ralat.',
              3: 'Menerima teguran dengan positif dan membetulkan kesilapan mengikut tempoh masa yang dipersetujui.',
              4: 'Sangat responsif, memproses maklum balas secara matang, kritis dan menyempurnakan penambahbaikan dengan segera.'
            }
          },
          {
            id: 'psm_g_5',
            title: '5. Akauntabiliti & Profesionalisme Penyelidikan',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan tanggungjawab projek dan menyalahkan pihak lain atas kelewatan kajian.',
              2: 'Kurang bertanggungjawab dalam memastikan kualiti draf projek sarjana muda.',
              3: 'Bertanggungjawab penuh terhadap kualiti data dan ketepatan masa fasa penyelidikan.',
              4: 'Mempamerkan profesionalisme bertaraf graduan cemerlang, berakauntabiliti tinggi dan beretika murni.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Seminar & Pembentangan Projek PSM II (30%)',
        evaluator: 'JI & TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Jurulatih Industri (JI - 15%) dan Tenaga Pengajar Fakulti (TPF - 15%) semasa sesi Kolokium / Seminar Pembentangan PSM II (CLO4, PLO9).',
        criteria: [
          {
            id: 'psm_p_1',
            title: '1. Penguasaan Masalah, Objektif & Konteks Industri',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan objektif penyelidikan dan perkaitan isu sebenar di industri.',
              2: 'Penerangan isu terlalu umum, kurang jelas hala tuju dan konteks firma kabur.',
              3: 'Menerangkan pernyataan masalah, objektif dan skop kajian dengan jelas dan teratur.',
              4: 'Penguasaan menyeluruh, menghubungkaitkan jurang praktikal industri dengan objektif penyelidikan secara sangat tuntas.'
            }
          },
          {
            id: 'psm_p_2',
            title: '2. Penerangan Metodologi & Kebolehpercayaan Data',
            maxScore: 4,
            levels: {
              1: 'Gagal memperincikan kaedah kutipan data, sampel dan instrumen penyelidikan.',
              2: 'Penerangan metodologi ada tetapi kabur dari aspek kebolehpercayaan instrumen.',
              3: 'Menerangkan kaedah pensampelan, pengumpulan data dan teknik analisis data dengan tepat.',
              4: 'Justifikasi pemilihan metodologi sangat kukuh, saintifik, teliti dan mematuhi piawaian penyelidikan berwasit.'
            }
          },
          {
            id: 'psm_p_3',
            title: '3. Pembentangan Analisis Dapatan & Solusi Cadangan',
            maxScore: 4,
            levels: {
              1: 'Gagal membentangkan hasil analisis data dan tiada cadangan penyelesaian masalah firma.',
              2: 'Pembentangan dapatan terlalu ringkas dan cadangan penyelesaian tidak praktikal.',
              3: 'Membentangkan hasil analisis data kualitatif/kuantitatif dengan baik dan menyertakan cadangan relevan.',
              4: 'Pembentangan analisis dapatan sangat mendalam, disokong bukti visual/statistik mantap dan cadangan solusi berimpak tinggi.'
            }
          },
          {
            id: 'psm_p_4',
            title: '4. Reka Bentuk Visual Slaid & Kejelasan Penyampaian',
            maxScore: 4,
            levels: {
              1: 'Slaid tidak teratur, teks padat, pembentangan mengelirukan dan suara tidak jelas.',
              2: 'Slaid ringkas tetapi susun atur hambar, penyampaian mendatar dan kurang meyakinkan.',
              3: 'Slaid kemas, susunan logik mengikut bab projek, penyampaian jelas dan teratur.',
              4: 'Reka bentuk visual bertaraf persidangan profesional, infografik data menarik, artikulasi fasih dan sangat berkarisma.'
            }
          },
          {
            id: 'psm_p_5',
            title: '5. Sesi Soal Jawab & Pertahanan Hujah (Viva Q&A)',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan panel penilai atau memberikan jawapan yang bertentangan dengan data.',
              2: 'Jawapan teragak-agak, kurang tepat dan tidak disokong bukti analisis projek.',
              3: 'Menjawab soalan panel penilai dengan tenang, tepat, yakin dan berasaskan fakta kajian.',
              4: 'Mempertahankan hujah secara intelektual, kritis, matang dan menguasai setiap aspek penyelidikan secara cemerlang.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Laporan Akhir Penyelidikan PSM II (60%)',
        evaluator: 'JI & TPF',
        weightagePercent: 60,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF - 40%) dan Jurulatih Industri (JI - 20%) berdasarkan manuskrip laporan akhir PSM II.',
        criteria: [
          {
            id: 'psm_r_1',
            title: 'Bab 1: Pengenalan & Pernyataan Masalah (15%)',
            maxScore: 4,
            levels: {
              1: 'Latar belakang kabur, isu industri tidak berasas dan tiada objektif jelas.',
              2: 'Pernyataan masalah ada tetapi kurang mengaitkan dengan isu sebenar firma industri.',
              3: 'Latar belakang jelas, isu operasi firma dihuraikan dengan baik dan objektif berfokus.',
              4: 'Justifikasi masalah industri sangat tajam, disokong data awal firma dan objektif SMART yang cemerlang.'
            }
          },
          {
            id: 'psm_r_2',
            title: 'Bab 2: Sorotan Literatur & Kerangka Konseptual (15%)',
            maxScore: 4,
            levels: {
              1: 'Tiada sorotan literatur berkaitan dan tiada kerangka teori/konseptual kajian.',
              2: 'Rujukan literatur terhad, sumber lapuk dan kerangka konseptual kurang mantap.',
              3: 'Sorotan literatur relevan daripada jurnal berwasit terkini dan kerangka konseptual jelas.',
              4: 'Sintesis literatur sangat kritikal, menghubungkan teori akademik dengan praktikal industri dan kerangka kajian kukuh.'
            }
          },
          {
            id: 'psm_r_3',
            title: 'Bab 3: Metodologi & Instrumen Kutipan Data (20%)',
            maxScore: 4,
            levels: {
              1: 'Reka bentuk penyelidikan tidak tepat, instrumen tiada dan kaedah kutipan data kabur.',
              2: 'Metodologi diterangkan secara asas tanpa bukti pengujian kesahan dan kebolehpercayaan.',
              3: 'Kaedah pensampelan, prosedur kutipan data dan instrumen kajian dihuraikan dengan tepat.',
              4: 'Reka bentuk kajian saintifik mantap, protokol kutipan data industri teliti dan instrumen disahkan secara ketat.'
            }
          },
          {
            id: 'psm_r_4',
            title: 'Bab 4: Analisis Data Kualitatif / Kuantitatif (25%)',
            maxScore: 4,
            levels: {
              1: 'Tiada analisis data atau analisis yang dibuat sepenuhnya salah dan mengelirukan.',
              2: 'Analisis data sangat asas, banyak kesilapan statistik/tematik dan tafsiran cetek.',
              3: 'Analisis data dijalankan dengan kaedah yang betul dan dapatan dihuraikan secara tersusun.',
              4: 'Analisis data sangat mendalam (analisis statistik mantap / analisis tematik rapi), visualisasi data profesional dan tafsiran ilmiah.'
            }
          },
          {
            id: 'psm_r_5',
            title: 'Bab 5: Cadangan Penyelesaian & Implikasi Industri (15%)',
            maxScore: 4,
            levels: {
              1: 'Tiada cadangan penyelesaian atau cadangan tidak menyelesaikan objektif kajian.',
              2: 'Cadangan terlalu umum dan sukar diaplikasikan dalam konteks firma penempatan.',
              3: 'Cadangan penyelesaian masalah praktikal, realistik dan menjawab objektif penyelidikan.',
              4: 'Solusi yang dicadangkan sangat inovatif, mempunyai nilai komersial/penjimatan kos, disertakan pelan pelaksanaan industri.'
            }
          },
          {
            id: 'psm_r_6',
            title: 'Format, Gaya Penulisan, Rujukan & Integriti (10%)',
            maxScore: 4,
            levels: {
              1: 'Format tidak mengikut Buku Panduan PSM UTeM, rujukan tidak lengkap dan plagiarisme tinggi.',
              2: 'Format penulisan sederhana, senarai rujukan terhad dan gaya penulisan kurang kemas.',
              3: 'Format mematuhi Buku Panduan PSM FPTT, rujukan mengikut gaya APA dan etika dipatuhi.',
              4: 'Gaya penulisan teknikal cemerlang, tatabahasa rapi, rujukan jurnal autoritatif terkini dan sifar isu integriti akademik.'
            }
          }
        ]
      }
    ]
  },

  // Course 6: BTMT 3273(i) Digital Entrepreneurship (3 Kredit)
  'BTMT 3273(i)': {
    courseCode: 'BTMT 3273(i)',
    courseName: 'Digital Entrepreneurship',
    creditHours: 3,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Student Performance Evaluation (Weekly Report / Tasks)', domain: 'Kognitif', clo: 'CLO3', plo: 'PLO8 (C5)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 40 },
      { no: 2, componentName: 'Student Performance Evaluation (Soft Skill Rubric)', domain: 'Afektif (A5)', clo: 'CLO2', plo: 'PLO7 (C4B)', evaluator: 'Jurulatih Industri (JI)', weightPercent: 20 },
      { no: 3, componentName: 'Presentation (Pembentangan Keusahawanan Digital)', domain: 'Kognitif (C6)', clo: 'CLO1', plo: 'PLO2 (C2)', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 10 },
      { no: 4, componentName: 'Case Study Report (Laporan Kajian Kes Keusahawanan)', domain: 'Psikomotor (P7)', clo: 'CLO1, 2, 3', plo: 'PLO2, 7, 8', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 30 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Borang Penilaian Prestasi Mingguan & Projek Keusahawanan Digital (JI - 40%)',
        evaluator: 'JI',
        weightagePercent: 40,
        description: 'Dinilai oleh Jurulatih Industri (JI) berdasarkan pelaksanaan tugasan mingguan Minggu 1 hingga Minggu 5 di organisasi (CLO3, PLO8).',
        criteria: [
          {
            id: 'de_w_1',
            title: '1. Pemahaman Ekosistem Perniagaan Digital & Model Permulaan',
            maxScore: 4,
            levels: {
              1: 'Gagal memahami ekosistem digital syarikat dan keperluan undang-undang e-dagang.',
              2: 'Memahami asas perniagaan digital tetapi memerlukan bimbingan kerap dalam audit operasi.',
              3: 'Berjaya memetakan ekosistem perniagaan digital dan audit operasi syarikat dengan jelas.',
              4: 'Penguasaan menyeluruh model perniagaan digital inovatif serta analisis landskap ekonomi firma yang tajam.'
            }
          },
          {
            id: 'de_w_2',
            title: '2. Pembangunan Digital Business Model Canvas (BMC) & UVP',
            maxScore: 4,
            levels: {
              1: 'Draf BMC digital tidak teratur dan cadangan nilai kabur.',
              2: 'Draf BMC asas tetapi strategi pengewangan kurang realistik.',
              3: 'Membangunkan Digital BMC yang lengkap dengan cadangan nilai dan perkongsian strategik jelas.',
              4: 'Digital BMC bertaraf industri termaju, strategi pengewangan bernas dan segmentasi pasaran tepat.'
            }
          },
          {
            id: 'de_w_3',
            title: '3. Pemasaran Media Sosial, Copywriting Kreatif & E-Pasaran',
            maxScore: 4,
            levels: {
              1: 'Tiada kemahiran copywriting dan gagal menguruskan saluran e-pasaran syarikat.',
              2: 'Copywriting asas dan kandungan media sosial kurang menarik perhatian sasaran.',
              3: 'Menghasilkan bahan pengiklanan digital yang kreatif serta menguruskan kedai e-pasaran dengan baik.',
              4: 'Kandungan visual dan copywriting sangat berimpak tinggi, pengurusan pesanan pantas dan kadar penglibatan cemerlang.'
            }
          },
          {
            id: 'de_w_4',
            title: '4. Prestasi Perniagaan Digital, ROI & Laporan Projek',
            maxScore: 4,
            levels: {
              1: 'Tiada analisis prestasi jualan/ROI dan laporan projek tidak lengkap.',
              2: 'Laporan sekadar mencatat data jualan asas tanpa cadangan penambahbaikan.',
              3: 'Analisis metrik prestasi perniagaan digital jelas disokong data analitik yang tepat.',
              4: 'Analisis pulangan pelaburan (ROI) dan cadangan masa hadapan perniagaan sangat mantap dan berdaya saing.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Borang Penilaian Kemahiran Insaniah & Sikap Keusahawanan (JI - 20%)',
        evaluator: 'JI',
        weightagePercent: 20,
        description: 'Dinilai oleh Jurulatih Industri (JI) bagi mengukur kebolehan kepimpinan, komunikasi, daya tahan dan minda keusahawanan pelajar (CLO2, PLO7).',
        criteria: [
          {
            id: 'de_s_1',
            title: '1. Kehadiran, Disiplin & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Kerap lewat atau mengabaikan jadual kerja firma.',
              2: 'Menepati waktu kerja tetapi kurang proaktif dalam pengurusan tugasan.',
              3: 'Sentiasa hadir tepat pada masanya, berdisiplin dan menepati tarikh akhir.',
              4: 'Kehadiran 100%, komitmen luar biasa dan menjadi contoh disiplin kepada rakan sekerja.'
            }
          },
          {
            id: 'de_s_2',
            title: '2. Minda Keusahawanan (Entrepreneurial Mindset) & Inisiatif',
            maxScore: 4,
            levels: {
              1: 'Pasif, hanya menunggu arahan tanpa minat mencipta peluang.',
              2: 'Melakukan tugasan rutin tanpa sebarang inisiatif nilai tambah.',
              3: 'Menunjukkan inisiatif proaktif dalam meneroka peluang perniagaan baharu.',
              4: 'Daya keusahawanan sangat tinggi, sentiasa berfikir di luar kotak dan mencadangkan solusi perniagaan berimpak.'
            }
          },
          {
            id: 'de_s_3',
            title: '3. Kemahiran Komunikasi Pelanggan & Rakan Niaga',
            maxScore: 4,
            levels: {
              1: 'Komunikasi lemah dan kerap menimbulkan salah faham dengan pelanggan.',
              2: 'Komunikasi asas tetapi kurang meyakinkan dalam rundingan perniagaan.',
              3: 'Berkomunikasi secara profesional, sopan dan meyakinkan pelanggan.',
              4: 'Sangat petah, kemahiran perundingan cemerlang dan berjaya membina hubungan pelanggan jangka panjang.'
            }
          },
          {
            id: 'de_s_4',
            title: '4. Kerja Berpasukan & Kepimpinan Projek',
            maxScore: 4,
            levels: {
              1: 'Sukar bekerjasama dalam pasukan dan mengabaikan matlamat bersama.',
              2: 'Bekerjasama hanya apabila diarahkan secara terhad.',
              3: 'Bekerjasama dengan baik, menyokong rakan sepasukan dan berkongsi idea.',
              4: 'Ciri kepimpinan cemerlang, memupuk semangat sinergi dan memimpin projek ke arah kejayaan.'
            }
          },
          {
            id: 'de_s_5',
            title: '5. Kebolehsuaian (Agility) & Daya Tahan Pasaran',
            maxScore: 4,
            levels: {
              1: 'Mudah putus asa apabila kempen digital tidak mencapai sasaran.',
              2: 'Mengambil masa lama untuk menyesuaikan diri dengan perubahan pasaran.',
              3: 'Mampu menangani cabaran pasaran dan mengubah suai taktik dengan pantas.',
              4: 'Sangat tangkas (resilient & agile), positif menghadapi kegagalan dan pantas mencari penyelesaian alternatif.'
            }
          },
          {
            id: 'de_s_6',
            title: '6. Etika Perniagaan Digital & Integriti Transaksi',
            maxScore: 4,
            levels: {
              1: 'Mengabaikan etika perniagaan dan privasi transaksi pelanggan.',
              2: 'Mematuhi etika hanya apabila diawasi ketat.',
              3: 'Sentiasa mengutamakan kejujuran dan pematuhan transaksi selamat.',
              4: 'Integriti perniagaan bertaraf tinggi, telus dan mempertahankan amanah pelanggan serta syarikat sepenuhnya.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian C',
        partTitle: 'Borang Penilaian Pembentangan Keusahawanan Digital (TPF - 10%)',
        evaluator: 'TPF',
        weightagePercent: 10,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) semasa lawatan industri atau sesi pembentangan viva (CLO1, PLO2).',
        criteria: [
          {
            id: 'de_p_1',
            title: '1. Penguasaan Konsep Perniagaan Digital & Model Permulaan',
            maxScore: 4,
            levels: {
              1: 'Gagal menerangkan konsep perniagaan digital dan model yang dicadangkan.',
              2: 'Penerangan model perniagaan terlalu umum dan kurang hujah teknikal.',
              3: 'Menerangkan konsep, pasaran sasaran dan cadangan nilai dengan jelas.',
              4: 'Penguasaan teori dan praktikal digital keusahawanan sangat mantap dan mengagumkan.'
            }
          },
          {
            id: 'de_p_2',
            title: '2. Demonstrasi Platform E-Dagang & Strategi Pengiklanan',
            maxScore: 4,
            levels: {
              1: 'Tiada demonstrasi platform dan tiada bukti kempen pemasaran digital.',
              2: 'Demonstrasi platform tidak lancar dan data jualan kurang jelas.',
              3: 'Menunjukkan platform e-dagang dan bukti kempen pengiklanan yang beroperasi.',
              4: 'Demonstrasi sangat profesional, platform berfungsi sepenuhnya dengan bukti interaksi pelanggan aktif.'
            }
          },
          {
            id: 'de_p_3',
            title: '3. Kualiti Slaid & Bahasa Pembentangan',
            maxScore: 4,
            levels: {
              1: 'Slaid tidak kemas, teks terlalu padat dan bahasa kurang lancar.',
              2: 'Slaid ringkas tetapi visual kurang menarik perhatian.',
              3: 'Slaid tersusun kemas, visual menarik dan penyampaian lancar.',
              4: 'Reka bentuk persembahan bertaraf eksekutif, infografik data kemas dan artikulasi fasih.'
            }
          },
          {
            id: 'de_p_4',
            title: '4. Sesi Soal Jawab & Pertahanan Model Bisnes (Q&A)',
            maxScore: 4,
            levels: {
              1: 'Gagal menjawab soalan panel penilai mengenai model perniagaan.',
              2: 'Jawapan teragak-agak dan kurang berasaskan fakta operasi syarikat.',
              3: 'Menjawab soalan panel penilai dengan yakin dan berasaskan pengalaman kerja.',
              4: 'Mempertahankan model perniagaan secara kritis, matang dan berpandukan data pasaran kukuh.'
            }
          },
          {
            id: 'de_p_5',
            title: '5. Penampilan & Pengurusan Masa',
            maxScore: 4,
            levels: {
              1: 'Pakaian tidak sesuai dan masa pembentangan melebihi had.',
              2: 'Pengurusan masa kurang seimbang antara topik perbincangan.',
              3: 'Menepati masa dan berpakaian kemas mematuhi etika korporat.',
              4: 'Pengurusan masa cemerlang, berkarisma tinggi dan mempamerkan etika profesional teladan.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian D',
        partTitle: 'Borang Penilaian Laporan Kajian Kes Keusahawanan Digital (TPF - 30%)',
        evaluator: 'TPF',
        weightagePercent: 30,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) berdasarkan laporan penuh projek kajian kes keusahawanan digital (CLO1, CLO2, CLO3).',
        criteria: [
          {
            id: 'de_r_1',
            title: '1. Pengenalan Organisasi & Audit Perniagaan Digital (15%)',
            maxScore: 4,
            levels: {
              1: 'Latar belakang syarikat dan audit perniagaan digital sangat kabur.',
              2: 'Audit perniagaan dilaksanakan secara asas tanpa bukti operasi jelas.',
              3: 'Penerangan latar belakang dan audit operasi digital firma dihuraikan dengan teratur.',
              4: 'Audit perniagaan digital komprehensif, merangkumi analisis rantaian nilai e-dagang terperinci.'
            }
          },
          {
            id: 'de_r_2',
            title: '2. Pembangunan Digital Business Model Canvas (BMC) (25%)',
            maxScore: 4,
            levels: {
              1: 'Digital BMC tidak lengkap dan tiada strategi pengewangan.',
              2: 'Digital BMC asas tetapi blok hubungan pelanggan dan saluran kurang jelas.',
              3: 'Digital BMC lengkap, cadangan nilai dan rakan strategik dikenal pasti dengan tepat.',
              4: 'Digital BMC sangat inovatif, disokong analisis kebolehlaksanaan pasaran dan unjuran kewangan realistik.'
            }
          },
          {
            id: 'de_r_3',
            title: '3. Pelaksanaan Kempen Pemasaran Media Sosial & E-Pasaran (25%)',
            maxScore: 4,
            levels: {
              1: 'Tiada bukti kempen pemasaran digital dan operasi e-pasaran tidak dilaksanakan.',
              2: 'Kempen pemasaran dilaksanakan secara minimum tanpa analisis ROI.',
              3: 'Kempen media sosial dan pengurusan e-pasaran dihuraikan dengan bukti pelaksanaan jelas.',
              4: 'Kempen pemasaran digital sangat kreatif, integrasi omnichannel mantap dengan bukti data jualan konkrit.'
            }
          },
          {
            id: 'de_r_4',
            title: '4. Analisis Prestasi Digital, Metrik & Cadangan Skalabiliti (20%)',
            maxScore: 4,
            levels: {
              1: 'Tiada metrik prestasi digital dan tiada pelan pertumbuhan syarikat.',
              2: 'Metrik digital asas tanpa cerapan strategi masa hadapan.',
              3: 'Analisis metrik prestasi (trafik, penukaran, jualan) jelas beserta cadangan pertumbuhan.',
              4: 'Analisis prestasi mendalam berasaskan data sebenar, pelan skalabiliti perniagaan bernilai tinggi dan berdaya maju.'
            }
          },
          {
            id: 'de_r_5',
            title: '5. Format, Gaya Penulisan & Rujukan Industri (15%)',
            maxScore: 4,
            levels: {
              1: 'Format tidak teratur, tiada rujukan dan plagiarisme tinggi.',
              2: 'Format laporan sederhana dan senarai rujukan terhad.',
              3: 'Format mematuhi panduan fakulti, rujukan relevan dan bahasa kemas.',
              4: 'Laporan bertaraf dokumen pelaburan profesional, visualisasi kemas dan rujukan terkini.'
            }
          }
        ]
      }
    ]
  },

  // Course 7: BTMU 4066(i) Technopreneurship Portfolio (6 Kredit)
  'BTMU 4066(i)': {
    courseCode: 'BTMU 4066(i)',
    courseName: 'Technopreneurship Portfolio',
    creditHours: 6,
    evaluatorRatio: 'JI: 60% | TPF: 40%',
    jiTotalPercent: 60,
    tpfTotalPercent: 40,
    componentsSummary: [
      { no: 1, componentName: 'Portfolio Content & Technical Verification', domain: 'Kognitif & Psikomotor (C4, P4)', clo: 'CLO1, CLO2', plo: 'PLO6, PLO8', evaluator: 'Jurulatih Industri (JI)', weightPercent: 60 },
      { no: 2, componentName: 'Portfolio Academic & Impact Evaluation', domain: 'Afektif (A3)', clo: 'CLO3', plo: 'PLO9', evaluator: 'Tenaga Pengajar Fakulti (TPF)', weightPercent: 40 }
    ],
    parts: [
      {
        partCode: 'Bahagian A',
        partTitle: 'Pengesahan Kandungan Teknikal Portfolio (JI - 60%)',
        evaluator: 'JI',
        weightagePercent: 60,
        description: 'Dinilai oleh Jurulatih Industri (JI) bagi mengesahkan pelaksanaan sebenar projek inovasi dan impak teknikal di premis firma.',
        criteria: [
          {
            id: 'tp_ji_1',
            title: '1. Pengecaman Masalah & Pengesahan Proses Operasi (CLO1)',
            maxScore: 4,
            levels: {
              1: 'Gagal mendokumentasikan masalah operasi firma secara terperinci.',
              2: 'Masalah dikenal pasti tetapi kurang evidens pelaksanaan di industri.',
              3: 'Proses pengecaman masalah disahkan dengan bukti dokumentasi yang baik.',
              4: 'Dokumentasi masalah sangat komprehensif, disokong data sebenar dan disahkan sepenuhnya oleh JI.'
            }
          },
          {
            id: 'tp_ji_2',
            title: '2. Pembangunan Solusi Inovasi Teknopreneur (CLO2)',
            maxScore: 4,
            levels: {
              1: 'Tiada pembangunan penyelesaian inovasi yang bermakna bagi syarikat.',
              2: 'Solusi asas tanpa integrasi kemahiran teknikal yang mencukupi.',
              3: 'Membangunkan solusi inovasi yang berfungsi dan menyelesaikan isu operasi.',
              4: 'Solusi inovasi bertaraf tinggi, memacu kecekapan operasi dan menghasilkan nilai tambah nyata kepada firma.'
            }
          },
          {
            id: 'tp_ji_3',
            title: '3. Pelaksanaan & Pengujian Solusi di Industri (CLO3)',
            maxScore: 4,
            levels: {
              1: 'Solusi tidak diuji di persekitaran operasi sebenar.',
              2: 'Pengujian minimum tanpa metrik pengukuran prestasi yang jelas.',
              3: 'Solusi berjaya diuji dan dilaksanakan di lantai operasi industri.',
              4: 'Pelaksanaan solusi berjaya sepenuhnya, melepasi standard piawaian industri dengan rekod pengujian lengkap.'
            }
          }
        ]
      },
      {
        partCode: 'Bahagian B',
        partTitle: 'Penilaian Akademik & Impak Portfolio (TPF - 40%)',
        evaluator: 'TPF',
        weightagePercent: 40,
        description: 'Dinilai oleh Tenaga Pengajar Fakulti (TPF) bagi menilai kematangan penulisan portfolio saintifik dan impak projek inovasi.',
        criteria: [
          {
            id: 'tp_tpf_1',
            title: '1. Kualiti Penulisan Teknikal & Saintifik Portfolio (CLO2)',
            maxScore: 4,
            levels: {
              1: 'Penulisan tidak teratur, hujah kabur dan tiada struktur portfolio.',
              2: 'Penulisan portfolio sederhana dan kekurangan data saintifik sokongan.',
              3: 'Penulisan teknikal kemas, mengikut garis panduan buku panduan WBL UTeM.',
              4: 'Penulisan bertaraf profesional tinggi, hujah saintifik mantap dan struktur dokumentasi sempurna.'
            }
          },
          {
            id: 'tp_tpf_2',
            title: '2. Analisis Impak & Kemampanan Solusi Teknopreneur (CLO3)',
            maxScore: 4,
            levels: {
              1: 'Tiada penilaian impak terhadap penyelesaian yang dicadangkan.',
              2: 'Penilaian impak terhad kepada aspek kos asas tanpa unjuran kemampanan.',
              3: 'Analisis impak dihuraikan dengan data pulangan pelaburan dan faedah firma yang jelas.',
              4: 'Analisis impak sangat analitikal, berpandangan jauh, mempunyai potensi komersial dan kemampanan jangka panjang.'
            }
          }
        ]
      }
    ]
  }
};
