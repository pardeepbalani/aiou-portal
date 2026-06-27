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
}

export type StudentStatus = 'active' | 'completed' | 'suspended';

export interface StudentRecord {
  id: string; // Document ID (usually firestore auto-ID or Registration ID)
  
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

export const PROGRAM_SEMESTERS_MAP: Record<string, number> = {
  'B.Ed (1.5 Years)': 3,
  'B.Ed (2.5 Years)': 5,
  'B.Ed (4 Years)': 8,
  'B.A Admission': 4,
  'B.Com Admission': 4,
  'Other BS Programs': 8,
};

export const PROGRAM_OPTIONS = [
  'B.Ed (1.5 Years)',
  'B.Ed (2.5 Years)',
  'B.Ed (4 Years)',
  'B.A Admission',
  'B.Com Admission',
  'Other BS Programs',
];
