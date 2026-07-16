export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  voucherRef?: string;
}

export interface CourseData {
  code: string;
  assignment: boolean;
  workshop: boolean;
  quiz: boolean;
  assignment1: boolean;
  assignment2: boolean;
}

export interface SemesterData {
  semesterNumber: number; // 1-indexed
  courses: CourseData[]; // 6 courses per semester
  semesterFee?: number;
  semesterServiceCharges?: number;
  semesterPaidAmount?: number;
  paymentsList?: PaymentEntry[];
  serviceEnrollment?: boolean;
  serviceWorkshops?: boolean;
  serviceQuiz?: boolean;
  serviceAssignments?: boolean;
  servicePhysicalWorkshop?: boolean;
  serviceResearchReport?: boolean;
  remarks?: string;
}

export type StudentStatus = 'active' | 'completed' | 'suspended';

export interface StudentRecord {
  id: string; // Document ID (usually firestore auto-ID or Registration ID)
  isDeleted?: boolean; // Tombstone flag for robust offline-first synchronization
  
  // Personal Info
  studentName: string;
  fatherName: string;
  phoneNumber: string;

  // Program IDs
  registrationId: string;
  lmsPasswordId: string;
  cmsPasswordId: string;

  // Admission Details
  admissionYear: string;
  programSelected: string;
  programCategory?: string; // e.g. 'Science' | 'General' | 'Pre-medical' | 'Pre-Engineering'
  semesterType: 'Autumn' | 'Spring';

  // Academic Semesters (depends on program)
  semesters: SemesterData[];

  // Payment & Service Charges
  totalReceivable: number;
  paymentsList: PaymentEntry[];
  serviceChargesAmount?: number;
  remarks?: string;

  // Services Required
  serviceEnrollment: boolean;
  serviceWorkshops: boolean;
  serviceQuiz: boolean;
  serviceAssignments: boolean;
  servicePhysicalWorkshop: boolean;
  serviceResearchReport: boolean;

  // Status
  status: StudentStatus;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ExamManager {
  id: string;
  name: string;
  phone: string;
  email: string;
  centre: 'Mithi' | 'Diplo';
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaymentHistory {
  id: string;
  date: string;
  amount: number;
}

export interface CourseExamDate {
  courseCode: string;
  examDate: string;
  status?: 'Passed' | 'Failed' | 'Pending';
  reappearDate?: string;
  remarks?: string;
}

export interface StudentExamSemester {
  id: string;
  semesterTerm: string;
  courseCodes: string[];
  examDates: CourseExamDate[];
  totalFee: number;
  amountReceived: number;
  paymentHistory: ExamPaymentHistory[];
}

export interface StudentExamInfo {
  id: string;
  centre: 'Mithi' | 'Diplo';
  managerId: string;
  courseCode: string; // Selected course
  studentName: string;
  fatherName: string;
  studentId: string;
  contactNumber: string;
  
  // Multiple semesters support
  semesters?: StudentExamSemester[];

  // Fallbacks/Legacy fields
  semesterTerm?: string;
  courseCodes?: string[];
  examDates?: CourseExamDate[];
  totalFee?: number;
  amountReceived?: number;
  remainingBalance?: number;
  paymentHistory?: ExamPaymentHistory[];

  createdAt: string;
  updatedAt: string;
}

export const PROGRAM_SEMESTERS_MAP: Record<string, number> = {
  'B.Ed (1.5 Years)': 3,
  'B.Ed (2.5 Years)': 5,
  'B.Ed (4 Years)': 8,
  'B.A Admission': 4,
  'B.Com Admission': 4,
  'Other BS Programs': 8,
  'Matriculation (2 Years)': 4,
  'Intermediate (2 Years)': 4,
};

export const PROGRAM_OPTIONS = [
  'B.Ed (1.5 Years)',
  'B.Ed (2.5 Years)',
  'B.Ed (4 Years)',
  'B.A Admission',
  'B.Com Admission',
  'Other BS Programs',
  'Matriculation (2 Years)',
  'Intermediate (2 Years)',
];

export interface DegreePaymentHistory {
  id: string;
  date: string;
  amount: number;
  remarks?: string;
}

export interface StudentDegreeRecord {
  id: string;
  studentName: string;
  fatherName: string;
  studentId: string;
  contactNumber: string;
  courseName: string;
  category: 'Normal' | 'Urgent';
  appliedDate: string;
  degreeReceivedDate?: string;
  status: 'Applied' | 'Under Process' | 'Dispatched' | 'Received at Hub' | 'Delivered to Student';
  totalFee: number;
  amountReceived: number;
  paymentHistory: DegreePaymentHistory[];
  trackingNumber?: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentQuizRecord {
  id: string;
  studentName: string;
  fatherName: string;
  studentId: string; // main registration ID or unique lookup id
  contactNumber: string;
  courseCode: string;
  quizDate: string; // YYYY-MM-DD
  quizDateFrom?: string; // YYYY-MM-DD
  quizDateTo?: string; // YYYY-MM-DD
  quizStartTime?: string; // HH:MM
  quizEndTime?: string; // HH:MM
  status: 'Pending' | 'Completed' | 'Overdue';
  programSelected?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchProjectRecord {
  id: string; // unique document ID, e.g. clean studentId_semester_year
  semester: 'Spring' | 'Autumn';
  year: string;
  studentName: string;
  registrationId: string;
  researchTopic: string;
  topicApprovalDate: string; // YYYY-MM-DD
  supervisorName: string;
  supervisorContact: string;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}



