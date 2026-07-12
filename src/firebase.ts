import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { StudentRecord, ExamManager, StudentExamInfo, StudentDegreeRecord, StudentQuizRecord, TutorshipRecord } from './types';

// Firebase configuration directly populated from firebase-applet-config.json
const firebaseConfig = {
  projectId: "true-sphinx-k2t1j",
  appId: "1:521986019563:web:32a34387e5a7ecfe7deeae",
  apiKey: "AIzaSyBu08lmFJaNXGEkYuo-gBQu4QNhpzXO6Lk",
  authDomain: "true-sphinx-k2t1j.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-6f677d01-50ed-4684-8eaa-1a2edda5fb3d",
  storageBucket: "true-sphinx-k2t1j.firebasestorage.app",
  messagingSenderId: "521986019563"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provided
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

let quotaExceededFlag = false;

export function isQuotaExceeded(): boolean {
  if (quotaExceededFlag) return true;
  return localStorage.getItem('aiou_quota_exceeded') === 'true';
}

export function setQuotaExceeded(exceeded: boolean) {
  quotaExceededFlag = exceeded;
  if (exceeded) {
    localStorage.setItem('aiou_quota_exceeded', 'true');
  } else {
    localStorage.removeItem('aiou_quota_exceeded');
  }
}

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error).toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    msg.includes('limit') ||
    msg.includes('billing') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('resource exhausted')
  );
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTION_NAME = 'students_records';
const LOCAL_STORAGE_KEY = 'aiou_students_local_records';

/**
 * Sanitize student record to guarantee valid types and properties, preventing crashes with old or invalid data.
 */
export function sanitizeStudentRecord(r: any): StudentRecord {
  const sanitizeCourses = (courses: any[]): any[] => {
    return Array.isArray(courses) ? courses.map(c => ({
      code: typeof c?.code === 'string' ? c.code : '',
      assignment: Boolean(c?.assignment),
      workshop: Boolean(c?.workshop),
      quiz: Boolean(c?.quiz),
      assignment1: Boolean(c?.assignment1),
      assignment2: Boolean(c?.assignment2),
    })) : [];
  };

  const sanitizeSemesters = (semesters: any[]): any[] => {
    return Array.isArray(semesters) ? semesters.map(sem => ({
      semesterNumber: Number(sem?.semesterNumber) || 1,
      courses: sanitizeCourses(sem?.courses),
      semesterFee: typeof sem?.semesterFee === 'number' ? sem.semesterFee : Number(sem?.semesterFee) || 0,
      semesterServiceCharges: typeof sem?.semesterServiceCharges === 'number' ? sem.semesterServiceCharges : Number(sem?.semesterServiceCharges) || 0,
      semesterPaidAmount: typeof sem?.semesterPaidAmount === 'number' ? sem.semesterPaidAmount : Number(sem?.semesterPaidAmount) || 0,
      paymentsList: sanitizePayments(sem?.paymentsList),
      serviceEnrollment: Boolean(sem?.serviceEnrollment),
      serviceWorkshops: Boolean(sem?.serviceWorkshops),
      serviceQuiz: Boolean(sem?.serviceQuiz),
      serviceAssignments: Boolean(sem?.serviceAssignments),
      servicePhysicalWorkshop: Boolean(sem?.servicePhysicalWorkshop),
      serviceResearchReport: Boolean(sem?.serviceResearchReport),
      remarks: typeof sem?.remarks === 'string' ? sem.remarks : '',
    })) : [];
  };

  const sanitizePayments = (payments: any[]): any[] => {
    return Array.isArray(payments) ? payments.map(p => ({
      id: typeof p?.id === 'string' ? p.id : `pay-${Math.random().toString(36).substr(2, 9)}`,
      date: typeof p?.date === 'string' ? p.date : new Date().toISOString().split('T')[0],
      amount: Number(p?.amount) || 0,
      voucherRef: typeof p?.voucherRef === 'string' ? p.voucherRef : '',
    })) : [];
  };

  return {
    id: typeof r?.id === 'string' && r.id ? r.id : `student-${Math.random().toString(36).substr(2, 9)}`,
    studentName: typeof r?.studentName === 'string' ? r.studentName : '',
    fatherName: typeof r?.fatherName === 'string' ? r.fatherName : '',
    phoneNumber: typeof r?.phoneNumber === 'string' ? r.phoneNumber : '',
    registrationId: typeof r?.registrationId === 'string' ? r.registrationId : '',
    lmsPasswordId: typeof r?.lmsPasswordId === 'string' ? r.lmsPasswordId : '',
    cmsPasswordId: typeof r?.cmsPasswordId === 'string' ? r.cmsPasswordId : '',
    admissionYear: typeof r?.admissionYear === 'string' ? r.admissionYear : new Date().getFullYear().toString(),
    programSelected: typeof r?.programSelected === 'string' ? r.programSelected : 'B.Ed (1.5 Years)',
    semesterType: r?.semesterType === 'Spring' ? 'Spring' : 'Autumn',
    semesters: sanitizeSemesters(r?.semesters),
    isDeleted: Boolean(r?.isDeleted),
    totalReceivable: Number(r?.totalReceivable) || 0,
    paymentsList: sanitizePayments(r?.paymentsList),
    serviceChargesAmount: Number(r?.serviceChargesAmount) || 0,
    remarks: typeof r?.remarks === 'string' ? r.remarks : '',
    serviceEnrollment: Boolean(r?.serviceEnrollment),
    serviceWorkshops: Boolean(r?.serviceWorkshops),
    serviceQuiz: Boolean(r?.serviceQuiz),
    serviceAssignments: Boolean(r?.serviceAssignments),
    servicePhysicalWorkshop: Boolean(r?.servicePhysicalWorkshop),
    serviceResearchReport: Boolean(r?.serviceResearchReport),
    status: (r?.status === 'completed' || r?.status === 'suspended') ? r.status : 'active',
    createdAt: typeof r?.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r?.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

const DELETED_IDS_PREFIX = 'aiou_deleted_ids_';

export function getDeletedIds(collectionName: string): string[] {
  try {
    const data = localStorage.getItem(DELETED_IDS_PREFIX + collectionName);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedId(collectionName: string, id: string) {
  try {
    const ids = getDeletedIds(collectionName);
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_IDS_PREFIX + collectionName, JSON.stringify(ids));
    }
  } catch (e) {
    console.error('Failed to save deleted ID:', e);
  }
}

/**
 * Get all records from local storage.
 */
export function getLocalRecords(includeDeleted = true): StudentRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const records = Array.isArray(parsed) ? parsed.map(sanitizeStudentRecord) : [];
    const deletedIds = getDeletedIds(COLLECTION_NAME);
    return records.filter(r => {
      const isDeletedLocally = deletedIds.includes(r.id) || r.isDeleted;
      return includeDeleted ? true : !isDeletedLocally;
    });
  } catch (error) {
    console.error('Failed to load local records:', error);
    return [];
  }
}

/**
 * Save all records to local storage.
 */
export function saveLocalRecords(records: StudentRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save local records:', error);
  }
}

/**
 * Ensure the user is authenticated with Firebase Auth (anonymously if needed).
 */
export async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log('Successfully authenticated anonymously with Firebase Auth.');
    } catch (error) {
      // Log as warning rather than error, since Firestore rules allow unauthenticated operations with schema validation.
      console.warn('Firebase Auth anonymous login not enabled or restricted (non-fatal):', error);
    }
  }
}

/**
 * Save a record to both Firestore and Local Storage.
 */
export async function saveStudentRecord(record: StudentRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  // 1. Save locally first (immediate offline feedback)
  const localRecords = getLocalRecords(true);
  const index = localRecords.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    localRecords[index] = updatedRecord;
  } else {
    localRecords.push(updatedRecord);
  }
  saveLocalRecords(localRecords);

  // 2. Ensure authentication and save to Firestore
  try {
    await ensureAuthenticated();
    const docRef = doc(db, COLLECTION_NAME, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

/**
 * Fetch all records from Firestore and sync with Local Storage.
 */
export async function fetchAndSyncRecords(): Promise<StudentRecord[]> {
  const deletedIds = getDeletedIds(COLLECTION_NAME);
  let remoteRecords: StudentRecord[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = sanitizeStudentRecord(data);
        if (deletedIds.includes(record.id) || record.isDeleted) {
          if (record.isDeleted) {
            remoteRecords.push(record);
          } else {
            // Hard-delete or soft-delete remote record to match local deletion
            setDoc(doc.ref, { ...record, isDeleted: true, updatedAt: new Date().toISOString() })
              .catch(e => console.warn('Delayed soft-delete sync failed for', record.id, e));
          }
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalRecords(false);
  }

  // Merge remote records with local records
  // In case of conflict, prefer the one with the newer updatedAt timestamp
  const localRecords = getLocalRecords(true);
  const mergedMap = new Map<string, StudentRecord>();

  // Add local records first
  localRecords.forEach(r => mergedMap.set(r.id, r));

  // Add/overwrite with remote records if they are newer or not present locally
  remoteRecords.forEach(remote => {
    const local = mergedMap.get(remote.id);
    const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const localTime = (local && local.updatedAt) ? new Date(local.updatedAt).getTime() : 0;
    const safeRemoteTime = isNaN(remoteTime) ? 0 : remoteTime;
    const safeLocalTime = isNaN(localTime) ? 0 : localTime;

    if (!local || safeRemoteTime >= safeLocalTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const mergedRecords = Array.from(mergedMap.values());
  // Sort by updatedAt descending safely
  mergedRecords.sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    const valA = isNaN(tA) ? 0 : tA;
    const valB = isNaN(tB) ? 0 : tB;
    return valB - valA;
  });
  
  saveLocalRecords(mergedRecords);
  
  // Also try to push any newer local records back to Firestore
  for (const record of mergedRecords) {
    const remoteRecord = remoteRecords.find(r => r.id === record.id);
    const recordTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
    const remoteTime = (remoteRecord && remoteRecord.updatedAt) ? new Date(remoteRecord.updatedAt).getTime() : 0;
    const safeRecordTime = isNaN(recordTime) ? 0 : recordTime;
    const safeRemoteTime = isNaN(remoteTime) ? 0 : remoteTime;

    const isNewerThanRemote = !remoteRecord || safeRecordTime > safeRemoteTime;
    
    if (isNewerThanRemote) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, record.id), record);
        setQuotaExceeded(false); // Self-healing: clear quota flag on success
      } catch (e) {
        console.warn('Sync back to Firestore failed for', record.id, e);
        setQuotaExceeded(true);
      }
    }
  }

  return mergedRecords.filter(r => !r.isDeleted);
}

/**
 * Delete a student record.
 */
export async function deleteStudentRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(COLLECTION_NAME, id);

  // Soft-delete locally first
  const localRecords = getLocalRecords(true);
  const index = localRecords.findIndex(r => r.id === id);
  let recordToUpdate: StudentRecord | null = null;
  if (index >= 0) {
    recordToUpdate = {
      ...localRecords[index],
      isDeleted: true,
      updatedAt: new Date().toISOString()
    };
    localRecords[index] = recordToUpdate;
  } else {
    recordToUpdate = {
      id,
      isDeleted: true,
      studentName: '',
      fatherName: '',
      phoneNumber: '',
      registrationId: '',
      lmsPasswordId: '',
      cmsPasswordId: '',
      admissionYear: '',
      programSelected: '',
      semesterType: 'Autumn',
      semesters: [],
      totalReceivable: 0,
      paymentsList: [],
      serviceEnrollment: false,
      serviceWorkshops: false,
      serviceQuiz: false,
      serviceAssignments: false,
      servicePhysicalWorkshop: false,
      serviceResearchReport: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localRecords.push(recordToUpdate);
  }
  saveLocalRecords(localRecords);

  // Soft-delete on Firestore
  try {
    await ensureAuthenticated();
    await setDoc(doc(db, COLLECTION_NAME, id), recordToUpdate);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore soft-delete failed, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

const EXAM_MANAGERS_COLLECTION = 'exam_managers';
const EXAM_RECORDS_COLLECTION = 'exam_records';

const LOCAL_EXAM_MANAGERS_KEY = 'aiou_local_exam_managers';
const LOCAL_EXAM_RECORDS_KEY = 'aiou_local_exam_records';

export function getLocalExamManagers(): ExamManager[] {
  try {
    const data = localStorage.getItem(LOCAL_EXAM_MANAGERS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(EXAM_MANAGERS_COLLECTION);
    return parsed.filter((m: any) => !deletedIds.includes(m.id));
  } catch (error) {
    console.error('Failed to load local exam managers:', error);
    return [];
  }
}

export function saveLocalExamManagers(managers: ExamManager[]) {
  try {
    const deletedIds = getDeletedIds(EXAM_MANAGERS_COLLECTION);
    const filtered = managers.filter(m => !deletedIds.includes(m.id));
    localStorage.setItem(LOCAL_EXAM_MANAGERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local exam managers:', error);
  }
}

export function getLocalExamRecords(): StudentExamInfo[] {
  try {
    const data = localStorage.getItem(LOCAL_EXAM_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(EXAM_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local exam records:', error);
    return [];
  }
}

export function saveLocalExamRecords(records: StudentExamInfo[]) {
  try {
    const deletedIds = getDeletedIds(EXAM_RECORDS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_EXAM_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local exam records:', error);
  }
}

export async function saveExamManager(manager: ExamManager): Promise<void> {
  const now = new Date().toISOString();
  const updatedManager = {
    ...manager,
    updatedAt: now,
    createdAt: manager.createdAt || now
  };

  const local = getLocalExamManagers();
  const index = local.findIndex(m => m.id === updatedManager.id);
  if (index >= 0) {
    local[index] = updatedManager;
  } else {
    local.push(updatedManager);
  }
  saveLocalExamManagers(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, EXAM_MANAGERS_COLLECTION, updatedManager.id);
    await setDoc(docRef, updatedManager);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed for Exam Manager, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncExamManagers(): Promise<ExamManager[]> {
  const deletedIds = getDeletedIds(EXAM_MANAGERS_COLLECTION);
  let remoteRecords: ExamManager[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, EXAM_MANAGERS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = data as ExamManager;
        if (deletedIds.includes(record.id)) {
          deleteDoc(doc.ref).catch(e => console.warn('Delayed firestore cleanup failed for', record.id, e));
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed for Exam Managers. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalExamManagers();
  }

  const local = getLocalExamManagers();
  const mergedMap = new Map<string, ExamManager>();
  local.forEach(m => mergedMap.set(m.id, m));
  remoteRecords.forEach(remote => {
    const l = mergedMap.get(remote.id);
    const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const lTime = (l && l.updatedAt) ? new Date(l.updatedAt).getTime() : 0;
    if (!l || rTime >= lTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const merged = Array.from(mergedMap.values());
  saveLocalExamManagers(merged);
  return merged;
}

export async function deleteExamManager(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(EXAM_MANAGERS_COLLECTION, id);

  const local = getLocalExamManagers();
  const updated = local.filter(m => m.id !== id);
  saveLocalExamManagers(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, EXAM_MANAGERS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.error('Firestore delete failed for Exam Manager:', error);
    setQuotaExceeded(true);
  }
}

export async function saveStudentExamInfo(record: StudentExamInfo): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  const local = getLocalExamRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalExamRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, EXAM_RECORDS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed for Student Exam Info, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncStudentExamInfos(): Promise<StudentExamInfo[]> {
  const deletedIds = getDeletedIds(EXAM_RECORDS_COLLECTION);
  let remoteRecords: StudentExamInfo[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, EXAM_RECORDS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = data as StudentExamInfo;
        if (deletedIds.includes(record.id)) {
          deleteDoc(doc.ref).catch(e => console.warn('Delayed firestore cleanup failed for', record.id, e));
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed for Student Exam Infos. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalExamRecords();
  }

  const local = getLocalExamRecords();
  const mergedMap = new Map<string, StudentExamInfo>();
  local.forEach(r => mergedMap.set(r.id, r));
  remoteRecords.forEach(remote => {
    const l = mergedMap.get(remote.id);
    const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const lTime = (l && l.updatedAt) ? new Date(l.updatedAt).getTime() : 0;
    if (!l || rTime >= lTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const merged = Array.from(mergedMap.values());
  saveLocalExamRecords(merged);
  return merged;
}

export async function deleteStudentExamInfo(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(EXAM_RECORDS_COLLECTION, id);

  const local = getLocalExamRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalExamRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, EXAM_RECORDS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.error('Firestore delete failed for Student Exam Info:', error);
    setQuotaExceeded(true);
  }
}

const DEGREE_RECORDS_COLLECTION = 'degree_records';
const LOCAL_DEGREE_RECORDS_KEY = 'aiou_local_degree_records';

export function getLocalDegreeRecords(): StudentDegreeRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_DEGREE_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(DEGREE_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local degree records:', error);
    return [];
  }
}

export function saveLocalDegreeRecords(records: StudentDegreeRecord[]): void {
  try {
    const deletedIds = getDeletedIds(DEGREE_RECORDS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_DEGREE_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local degree records:', error);
  }
}

export async function saveStudentDegreeRecord(record: StudentDegreeRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  const local = getLocalDegreeRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalDegreeRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, DEGREE_RECORDS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Student Degree Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncStudentDegreeRecords(): Promise<StudentDegreeRecord[]> {
  const deletedIds = getDeletedIds(DEGREE_RECORDS_COLLECTION);
  let remoteRecords: StudentDegreeRecord[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, DEGREE_RECORDS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = data as StudentDegreeRecord;
        if (deletedIds.includes(record.id)) {
          deleteDoc(doc.ref).catch(e => console.warn('Delayed firestore cleanup failed for', record.id, e));
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed for Student Degree Records. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalDegreeRecords();
  }

  const local = getLocalDegreeRecords();
  const mergedMap = new Map<string, StudentDegreeRecord>();
  local.forEach(r => mergedMap.set(r.id, r));
  remoteRecords.forEach(remote => {
    const l = mergedMap.get(remote.id);
    const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const lTime = (l && l.updatedAt) ? new Date(l.updatedAt).getTime() : 0;
    if (!l || rTime >= lTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const merged = Array.from(mergedMap.values());
  saveLocalDegreeRecords(merged);
  return merged;
}

export async function deleteStudentDegreeRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(DEGREE_RECORDS_COLLECTION, id);

  const local = getLocalDegreeRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalDegreeRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, DEGREE_RECORDS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.error('Firestore delete failed for Student Degree Record:', error);
    setQuotaExceeded(true);
  }
}

const QUIZ_RECORDS_COLLECTION = 'quiz_records';
const LOCAL_QUIZ_RECORDS_KEY = 'aiou_local_quiz_records';

export function getLocalQuizRecords(): StudentQuizRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_QUIZ_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(QUIZ_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local quiz records:', error);
    return [];
  }
}

export function saveLocalQuizRecords(records: StudentQuizRecord[]): void {
  try {
    const deletedIds = getDeletedIds(QUIZ_RECORDS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_QUIZ_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local quiz records:', error);
  }
}

export async function saveStudentQuizRecord(record: StudentQuizRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  const local = getLocalQuizRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalQuizRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, QUIZ_RECORDS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Student Quiz Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncStudentQuizRecords(): Promise<StudentQuizRecord[]> {
  const deletedIds = getDeletedIds(QUIZ_RECORDS_COLLECTION);
  let remoteRecords: StudentQuizRecord[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, QUIZ_RECORDS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = data as StudentQuizRecord;
        if (deletedIds.includes(record.id)) {
          deleteDoc(doc.ref).catch(e => console.warn('Delayed firestore cleanup failed for', record.id, e));
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed for Student Quiz Records. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalQuizRecords();
  }

  const local = getLocalQuizRecords();
  const mergedMap = new Map<string, StudentQuizRecord>();
  local.forEach(r => mergedMap.set(r.id, r));
  remoteRecords.forEach(remote => {
    const l = mergedMap.get(remote.id);
    const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const lTime = (l && l.updatedAt) ? new Date(l.updatedAt).getTime() : 0;
    if (!l || rTime >= lTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const merged = Array.from(mergedMap.values());
  saveLocalQuizRecords(merged);
  return merged;
}

export async function deleteStudentQuizRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(QUIZ_RECORDS_COLLECTION, id);

  const local = getLocalQuizRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalQuizRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, QUIZ_RECORDS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.error('Firestore delete failed for Student Quiz Record:', error);
    setQuotaExceeded(true);
  }
}

// ==========================================
// TUTORSHIP RECORDS LOGIC
// ==========================================
const TUTORSHIP_RECORDS_COLLECTION = 'tutorship_records';
const LOCAL_TUTORSHIP_RECORDS_KEY = 'aiou_local_tutorship_records';

export function getLocalTutorshipRecords(): TutorshipRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_TUTORSHIP_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(TUTORSHIP_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local tutorship records:', error);
    return [];
  }
}

export function saveLocalTutorshipRecords(records: TutorshipRecord[]): void {
  try {
    const deletedIds = getDeletedIds(TUTORSHIP_RECORDS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_TUTORSHIP_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local tutorship records:', error);
  }
}

export async function saveTutorshipRecord(record: TutorshipRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord: TutorshipRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  const local = getLocalTutorshipRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalTutorshipRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, TUTORSHIP_RECORDS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Tutorship Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncTutorshipRecords(): Promise<TutorshipRecord[]> {
  const deletedIds = getDeletedIds(TUTORSHIP_RECORDS_COLLECTION);
  let remoteRecords: TutorshipRecord[] = [];
  try {
    await ensureAuthenticated();
    const q = query(collection(db, TUTORSHIP_RECORDS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setQuotaExceeded(false); // Self-healing
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        const record = data as TutorshipRecord;
        if (deletedIds.includes(record.id)) {
          deleteDoc(doc.ref).catch(e => console.warn('Delayed firestore cleanup failed for', record.id, e));
        } else {
          remoteRecords.push(record);
        }
      }
    });
  } catch (error) {
    console.error('Firestore load failed for Tutorship Records. Reading local records only.', error);
    setQuotaExceeded(true);
    return getLocalTutorshipRecords();
  }

  const local = getLocalTutorshipRecords();
  const mergedMap = new Map<string, TutorshipRecord>();
  local.forEach(r => mergedMap.set(r.id, r));
  remoteRecords.forEach(remote => {
    const l = mergedMap.get(remote.id);
    const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const lTime = (l && l.updatedAt) ? new Date(l.updatedAt).getTime() : 0;
    if (!l || rTime >= lTime) {
      mergedMap.set(remote.id, remote);
    }
  });

  const merged = Array.from(mergedMap.values());
  saveLocalTutorshipRecords(merged);
  return merged;
}

export async function deleteTutorshipRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(TUTORSHIP_RECORDS_COLLECTION, id);

  const local = getLocalTutorshipRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalTutorshipRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, TUTORSHIP_RECORDS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.error('Firestore delete failed for Tutorship Record:', error);
    setQuotaExceeded(true);
  }
}


