import { StudentRecord, StudentDegreeRecord } from './types';

export function getSampleDegreeRecords(): StudentDegreeRecord[] {
  return [
    {
      id: 'deg-sample-1',
      studentName: 'Ahmad Khan',
      fatherName: 'Muhammad Khan',
      studentId: '23FPA09511',
      contactNumber: '03001234567',
      courseName: 'B.Ed (1.5 Years)',
      category: 'Urgent',
      appliedDate: '2026-01-10',
      degreeReceivedDate: '2026-02-15',
      status: 'Received at Hub',
      totalFee: 4000,
      amountReceived: 4000,
      paymentHistory: [
        { id: 'pay-deg-1', date: '2026-01-10', amount: 4000, remarks: 'Full fee paid at time of application' }
      ],
      trackingNumber: 'TCS-98421033',
      verificationStatus: 'Verified',
      remarks: 'All documents verified. Degree received at Regional Hub.',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-02-15T14:30:00.000Z'
    },
    {
      id: 'deg-sample-2',
      studentName: 'Sana Fatima',
      fatherName: 'Abdul Rehman',
      studentId: '24SPA08412',
      contactNumber: '03159876543',
      courseName: 'B.A Admission',
      category: 'Normal',
      appliedDate: '2026-02-01',
      status: 'Under Process',
      totalFee: 2000,
      amountReceived: 2000,
      paymentHistory: [
        { id: 'pay-deg-2', date: '2026-02-01', amount: 2000, remarks: 'Normal apply deposit' }
      ],
      verificationStatus: 'Verified',
      remarks: 'Degree processing at main campus Islamabad.',
      createdAt: '2026-02-01T11:20:00.000Z',
      updatedAt: '2026-02-01T11:20:00.000Z'
    },
    {
      id: 'deg-sample-3',
      studentName: 'Muhammad Ali',
      fatherName: 'Tariq Mehmood',
      studentId: '22FPA01944',
      contactNumber: '03451122334',
      courseName: 'BS Computer Science',
      category: 'Urgent',
      appliedDate: '2026-02-20',
      status: 'Applied',
      totalFee: 4000,
      amountReceived: 2000,
      paymentHistory: [
        { id: 'pay-deg-3', date: '2026-02-20', amount: 2000, remarks: 'Partial deposit' }
      ],
      verificationStatus: 'Pending',
      remarks: 'Awaiting remaining fee payment and metric transcript copy.',
      createdAt: '2026-02-20T09:15:00.000Z',
      updatedAt: '2026-02-20T09:15:00.000Z'
    }
  ];
}

export function getSampleRecords(): StudentRecord[] {
  const firstNames = [
    'Ahmad', 'Sana', 'Muhammad', 'Zainab', 'Usama', 'Hamza', 'Aisha', 'Fatima', 'Syed', 'Bilal',
    'Tariq', 'Noman', 'Maria', 'Hassan', 'Maryam', 'Ali', 'Omer', 'Khadija', 'Saad', 'Hira',
    'Asad', 'Rabia', 'Farhan', 'Iqra', 'Waqas', 'Anum', 'Zeeshan', 'Saba', 'Shahzaib', 'Mehwish',
    'Kamran', 'Sidra', 'Imran', 'Nida', 'Faisal', 'Laiba', 'Arslan', 'Areeba', 'Babar', 'Ayesha',
    'Rizwan', 'Bushra', 'Danish', 'Sumaira', 'Naveed', 'Kiran', 'Adeel', 'Mahnoor', 'Shehroz', 'Farah',
    'Haris', 'Kausar', 'Taimoor', 'Rimsha', 'Muneeb', 'Saima', 'Sufyan', 'Shazia', 'Shoaib', 'Sobia',
    'Rehan', 'Fouzia', 'Yasir', 'Nazia', 'Junaid', 'Sania', 'Ahsan', 'Kinza', 'Zahid', 'Sundas',
    'Shahid', 'Eman', 'Moazzam', 'Tehreem', 'Mudassir', 'Bishma', 'Fahad', 'Nimra', 'Atif', 'Alina',
    'Rashid', 'Zara', 'Asif', 'Aiman', 'Tanveer', 'Habiba', 'Zia', 'Sadia', 'Sohail', 'Hina',
    'Salman', 'Javeria', 'Shakir', 'Amna', 'Waseem'
  ];

  const fatherNames = [
    'Khan', 'Rehman', 'Mehmood', 'Shah', 'Malik', 'Zahra', 'Farhan', 'Ahmed', 'Raza', 'Qureshi',
    'Nawaz', 'Imran', 'Iqbal', 'Hussain', 'Abbasi', 'Chaudhry', 'Bhatti', 'Jutt', 'Gharshin', 'Kakar',
    'Tareen', 'Siddiqui', 'Baig', 'Mirza', 'Ansari', 'Ghafoor', 'Saeed', 'Aziz', 'Sharif', 'Rashid',
    'Akram', 'Arshad', 'Latif', 'Yaseen', 'Mustafa', 'Ghanis', 'Khawaja', 'Vohra', 'Laghari', 'Soomro'
  ];

  const programs = [
    'B.Ed (1.5 Years)', 'B.A Admission', 'BS Computer Science', 'M.A Education',
    'B.Com', 'BS English', 'BBA', 'M.Sc Mathematics', 'BS Physics', 'B.Ed (2.5 Years)',
    'Associate Degree in Arts', 'Associate Degree in Commerce'
  ];

  const getCourseCodes = (program: string, semNum: number) => {
    let base = 1000 * (semNum);
    if (program.includes('B.Ed')) base = 8600 + (semNum - 1) * 10;
    else if (program.includes('B.A')) base = 400 + (semNum - 1) * 10;
    else if (program.includes('Computer')) base = 3400 + (semNum - 1) * 10;
    else if (program.includes('M.A')) base = 6500 + (semNum - 1) * 10;
    else if (program.includes('B.Com')) base = 1420 + (semNum - 1) * 10;
    else if (program.includes('English')) base = 9000 + (semNum - 1) * 10;
    else if (program.includes('BBA')) base = 5400 + (semNum - 1) * 10;
    else if (program.includes('Mathematics')) base = 7500 + (semNum - 1) * 10;

    return [1, 2, 3, 4, 5, 6].map(i => (base + i).toString());
  };

  const records: StudentRecord[] = [];

  for (let i = 1; i <= 95; i++) {
    const sIndex = i - 1;
    const fName = firstNames[sIndex % firstNames.length];
    const faName = fatherNames[sIndex % fatherNames.length];
    const studentName = `${fName} ${faName}`;
    const fatherName = `${fatherNames[(sIndex + 5) % fatherNames.length]} ${faName}`;

    // Format registration ID as 23FPA095xx or 24SPA084xx
    const regNumStr = i.toString().padStart(2, '0');
    const registrationId = i % 2 === 1 ? `23FPA095${regNumStr}` : `24SPA084${regNumStr}`;
    const phoneNum = `0300${(1234500 + i).toString()}`;
    const program = programs[sIndex % programs.length];
    const year = i % 3 === 0 ? '2024' : (i % 3 === 1 ? '2025' : '2026');
    const semesterType = i % 2 === 0 ? 'Spring' : 'Autumn';
    const status: 'active' | 'completed' | 'suspended' = i % 15 === 0 ? 'suspended' : (i % 4 === 0 ? 'completed' : 'active');

    const semesters = [1, 2, 3].map(semNum => {
      const codes = getCourseCodes(program, semNum);
      const isCompletedSem = semNum === 1 || (semNum === 2 && i % 2 === 0);
      return {
        semesterNumber: semNum,
        courses: codes.map((code, cIdx) => ({
          code: isCompletedSem ? code : (cIdx < 3 ? code : ''),
          assignment: isCompletedSem || cIdx < 3,
          workshop: isCompletedSem || cIdx < 2,
          quiz: isCompletedSem || cIdx < 2,
          assignment1: isCompletedSem || cIdx < 4,
          assignment2: isCompletedSem || cIdx < 2,
        })),
        semesterFee: 12000 + (semNum * 1500),
        semesterPaidAmount: isCompletedSem ? 12000 + (semNum * 1500) : 6000,
        remarks: `Semester ${semNum} ${isCompletedSem ? 'cleared successfully' : 'in progress'}`
      };
    });

    const totalFee = 24000 + (i % 10) * 1500;
    const paidAmount = status === 'completed' ? totalFee : Math.floor(totalFee * (0.5 + (i % 5) * 0.1));

    // Created & Updated timestamps spread across late 2025 to early 2026
    const dateObj = new Date(2026, (i % 3), (i % 28) + 1, 10, (i * 3) % 60);
    const timeStr = dateObj.toISOString();

    records.push({
      id: registrationId,
      studentName,
      fatherName,
      phoneNumber: phoneNum,
      registrationId,
      lmsPasswordId: `${fName.toLowerCase()}@aiou${(10 + i)}`,
      cmsPasswordId: `cms#${registrationId.toLowerCase()}`,
      admissionYear: year,
      programSelected: program,
      semesterType,
      semesters,
      totalReceivable: totalFee,
      paymentsList: [
        {
          id: `pay-${i}-1`,
          date: `2025-${((i % 5) + 8).toString().padStart(2, '0')}-15`,
          amount: Math.floor(paidAmount * 0.6),
          voucherRef: `VOUCH-${1000 + i}`
        },
        ...(paidAmount > Math.floor(paidAmount * 0.6) ? [{
          id: `pay-${i}-2`,
          date: `2026-01-20`,
          amount: paidAmount - Math.floor(paidAmount * 0.6),
          voucherRef: `VOUCH-${2000 + i}`
        }] : [])
      ],
      serviceChargesAmount: 1000 + (i % 5) * 200,
      remarks: `AIOU Student record #${i}. Contact verified.`,
      serviceEnrollment: true,
      serviceWorkshops: i % 2 === 0,
      serviceQuiz: i % 3 !== 0,
      serviceAssignments: true,
      servicePhysicalWorkshop: i % 4 === 0,
      serviceResearchReport: i % 5 === 0,
      status,
      createdAt: timeStr,
      updatedAt: timeStr
    });
  }

  return records;
}
