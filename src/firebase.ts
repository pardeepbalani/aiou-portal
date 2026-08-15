import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  getDocsFromServer,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { StudentRecord, ExamManager, StudentExamInfo, StudentDegreeRecord, StudentQuizRecord, ResearchProjectRecord, ExamManagerPaymentRecord, F2FManager, F2FCandidateRecord, F2FManagerPaymentRecord } from './types';
import { getSampleDegreeRecords, getSampleRecords } from './samples';

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

// Initialize Firestore safely to prevent app startup crash if custom database is not yet fully provisioned
let initialDb: any;
try {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  initialDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch (e) {
  console.warn("Failed to initialize firestore with custom database ID and long polling, falling back to default:", e);
  try {
    initialDb = getFirestore(app);
  } catch (err2) {
    console.error("Failed to initialize default firestore:", err2);
    // Create a safe dummy fallback object so module loads successfully and leverages local fallback
    initialDb = {
      type: 'firestore-fallback-dummy',
      _databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    } as any;
  }
}

export const db = initialDb;
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

// Clear legacy persistent quota flag on startup
try {
  localStorage.removeItem('aiou_quota_exceeded');
} catch (e) {}

export function isQuotaExceeded(): boolean {
  return quotaExceededFlag;
}

export function setQuotaExceeded(exceeded: boolean) {
  quotaExceededFlag = exceeded;
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
    programCategory: typeof r?.programCategory === 'string' ? r.programCategory : undefined,
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

export function removeDeletedId(collectionName: string, id: string) {
  try {
    const ids = getDeletedIds(collectionName);
    if (ids.includes(id)) {
      const updated = ids.filter(x => x !== id);
      localStorage.setItem(DELETED_IDS_PREFIX + collectionName, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to remove deleted ID:', e);
  }
}

/**
 * Helper to wrap any Promise with a strict timeout to prevent long network hangs.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Get all records from local storage.
 */
export function getLocalRecords(includeDeleted = true): StudentRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    let records = Array.isArray(parsed) ? parsed.map(sanitizeStudentRecord) : [];
    const deletedIds = getDeletedIds(COLLECTION_NAME);

    // Filter active records
    let activeRecords = records.filter(r => !r.isDeleted && !deletedIds.includes(r.id));

    if (includeDeleted) {
      return records;
    }
    return activeRecords;
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

  // Remove from deleted tracking if present
  removeDeletedId(COLLECTION_NAME, updatedRecord.id);

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
    const cleanData = cleanObjectForFirestore(updatedRecord);
    await setDoc(docRef, cleanData);
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

/**
 * Generic Bidirectional Sync Engine for all collections:
 * 1. Fetches latest documents from Cloud Firestore.
 * 2. Compares each record's updatedAt timestamp between Remote and Local.
 * 3. Latest timestamp wins without destructive blind overwrites.
 * 4. Pushes ONLY strictly newer local modifications to Cloud Firestore.
 * 5. Updates Local Storage with the synchronized truth.
 */
async function syncCollectionBidirectional<T extends { id: string; updatedAt?: string; createdAt?: string; isDeleted?: boolean }>(
  collectionName: string,
  getLocal: (includeDeleted?: boolean) => T[],
  saveLocal: (items: T[]) => void,
  sanitizeItem?: (item: any) => T
): Promise<T[]> {
  const deletedIds = getDeletedIds(collectionName);
  const localItems = getLocal(true);
  let remoteItems: T[] = [];
  let cloudSuccess = false;

  try {
    await withTimeout(ensureAuthenticated(), 5000).catch(() => {});
    const colRef = collection(db, collectionName);
    let querySnapshot;
    try {
      querySnapshot = await withTimeout(getDocs(colRef), 10000);
    } catch (e1) {
      console.warn(`Initial getDocs failed for ${collectionName}, retrying:`, e1);
      querySnapshot = await getDocs(colRef);
    }

    setQuotaExceeded(false); // Self-healing
    cloudSuccess = true;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data) {
        const item = sanitizeItem ? sanitizeItem(data) : (data as T);
        if (item.isDeleted) {
          remoteItems.push(item);
        } else if (deletedIds.includes(item.id)) {
          remoteItems.push({ ...item, isDeleted: true });
        } else {
          remoteItems.push(item);
        }
      }
    });
  } catch (error) {
    console.warn(`Firestore read failed for ${collectionName}. Reading local records only:`, error);
    setQuotaExceeded(true);
    return localItems.filter(i => !i.isDeleted && !deletedIds.includes(i.id));
  }

  if (!cloudSuccess) {
    return localItems.filter(i => !i.isDeleted && !deletedIds.includes(i.id));
  }

  const localMap = new Map<string, T>();
  localItems.forEach(item => localMap.set(item.id, item));

  const remoteMap = new Map<string, T>();
  remoteItems.forEach(item => remoteMap.set(item.id, item));

  const mergedMap = new Map<string, T>();
  const toUploadToCloud: T[] = [];

  // 1. Process all remote records from Firestore
  remoteItems.forEach(remote => {
    const local = localMap.get(remote.id);
    if (!local) {
      // Exists in Cloud Firestore, not locally -> adopt Cloud version
      mergedMap.set(remote.id, remote);
    } else {
      const rTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
      const lTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
      const safeR = isNaN(rTime) ? 0 : rTime;
      const safeL = isNaN(lTime) ? 0 : lTime;

      if (safeR >= safeL) {
        // Cloud has newer or equal version -> adopt Cloud version
        mergedMap.set(remote.id, remote);
      } else {
        // Local has strictly newer version (e.g. offline modifications) -> keep local & queue upload
        mergedMap.set(local.id, local);
        if (!local.isDeleted) {
          toUploadToCloud.push(local);
        }
      }
    }
  });

  // 2. Process local items that don't exist on remote at all
  localItems.forEach(local => {
    if (!remoteMap.has(local.id) && !local.isDeleted && !deletedIds.includes(local.id)) {
      // Include valid offline-created item and schedule upload to cloud
      mergedMap.set(local.id, local);
      toUploadToCloud.push(local);
    }
  });

  const mergedItems = Array.from(mergedMap.values());

  // Sort by updatedAt descending
  mergedItems.sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    const valA = isNaN(tA) ? 0 : tA;
    const valB = isNaN(tB) ? 0 : tB;
    return valB - valA;
  });

  // Save the full synchronized set locally
  saveLocal(mergedItems);

  // Push strictly newer local records to Cloud in non-blocking batches
  if (toUploadToCloud.length > 0 && !isQuotaExceeded()) {
    const BATCH_SIZE = 10;
    for (let i = 0; i < toUploadToCloud.length; i += BATCH_SIZE) {
      const batch = toUploadToCloud.slice(i, i + BATCH_SIZE);
      Promise.allSettled(
        batch.map(item => {
          const docRef = doc(db, collectionName, item.id);
          const cleanData = cleanObjectForFirestore(item);
          return withTimeout(setDoc(docRef, cleanData), 8000);
        })
      ).catch(e => console.warn(`Async background push for ${collectionName} warning:`, e));
    }
  }

  const activeItems = mergedItems.filter(i => !i.isDeleted && !deletedIds.includes(i.id));
  return activeItems;
}

/**
 * Fetch all records from Firestore and sync with Local Storage.
 * Supports forced cloud server fetch with strict network timeouts and instant local storage fallback.
 */
export async function fetchAndSyncRecords(options?: { forceCloudFetch?: boolean }): Promise<StudentRecord[]> {
  return syncCollectionBidirectional<StudentRecord>(
    COLLECTION_NAME,
    (includeDeleted) => getLocalRecords(includeDeleted ?? true),
    (items) => saveLocalRecords(items),
    sanitizeStudentRecord
  );
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

  // Remove from deleted tracking if present
  removeDeletedId(EXAM_MANAGERS_COLLECTION, updatedManager.id);

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
    await setDoc(docRef, cleanObjectForFirestore(updatedManager));
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed for Exam Manager, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncExamManagers(): Promise<ExamManager[]> {
  return syncCollectionBidirectional<ExamManager>(
    EXAM_MANAGERS_COLLECTION,
    () => getLocalExamManagers(),
    (items) => saveLocalExamManagers(items)
  );
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

  // Remove from deleted tracking if present
  removeDeletedId(EXAM_RECORDS_COLLECTION, updatedRecord.id);

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
    await setDoc(docRef, cleanObjectForFirestore(updatedRecord));
    setQuotaExceeded(false); // Self-healing: clear quota flag on success
  } catch (error) {
    console.warn('Firestore write failed for Student Exam Info, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncStudentExamInfos(): Promise<StudentExamInfo[]> {
  return syncCollectionBidirectional<StudentExamInfo>(
    EXAM_RECORDS_COLLECTION,
    () => getLocalExamRecords(),
    (items) => saveLocalExamRecords(items)
  );
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

export function cleanObjectForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
}

export function sanitizeStudentDegreeRecord(r: any): StudentDegreeRecord {
  const sanitized: StudentDegreeRecord = {
    id: typeof r?.id === 'string' && r.id ? r.id : `deg-${Math.random().toString(36).substring(2, 9)}`,
    studentName: typeof r?.studentName === 'string' ? r.studentName : '',
    fatherName: typeof r?.fatherName === 'string' ? r.fatherName : '',
    studentId: typeof r?.studentId === 'string' ? r.studentId : '',
    contactNumber: typeof r?.contactNumber === 'string' ? r.contactNumber : '',
    courseName: typeof r?.courseName === 'string' ? r.courseName : '',
    category: r?.category === 'Urgent' ? 'Urgent' : 'Normal',
    appliedDate: typeof r?.appliedDate === 'string' ? r.appliedDate : new Date().toISOString().split('T')[0],
    status: ['Applied', 'Under Process', 'Dispatched', 'Received at Hub', 'Delivered to Student'].includes(r?.status) ? r.status : 'Applied',
    totalFee: typeof r?.totalFee === 'number' ? r.totalFee : Number(r?.totalFee) || 0,
    amountReceived: typeof r?.amountReceived === 'number' ? r.amountReceived : Number(r?.amountReceived) || 0,
    paymentHistory: Array.isArray(r?.paymentHistory) ? r.paymentHistory.map((p: any) => ({
      id: typeof p?.id === 'string' ? p.id : `pay-${Math.random().toString(36).substring(2, 9)}`,
      date: typeof p?.date === 'string' ? p.date : new Date().toISOString().split('T')[0],
      amount: typeof p?.amount === 'number' ? p.amount : Number(p?.amount) || 0,
      remarks: typeof p?.remarks === 'string' ? p.remarks : ''
    })) : [],
    verificationStatus: ['Pending', 'Verified', 'Rejected'].includes(r?.verificationStatus) ? r.verificationStatus : 'Pending',
    createdAt: typeof r?.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r?.updatedAt === 'string' ? r.updatedAt : new Date().toISOString()
  };

  if (typeof r?.degreeReceivedDate === 'string' && r.degreeReceivedDate.trim()) {
    sanitized.degreeReceivedDate = r.degreeReceivedDate.trim();
  }
  if (typeof r?.trackingNumber === 'string' && r.trackingNumber.trim()) {
    sanitized.trackingNumber = r.trackingNumber.trim();
  }
  if (typeof r?.remarks === 'string' && r.remarks.trim()) {
    sanitized.remarks = r.remarks.trim();
  }

  return sanitized;
}

export function getLocalDegreeRecords(): StudentDegreeRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_DEGREE_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(DEGREE_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id)).map(sanitizeStudentDegreeRecord);
  } catch (error) {
    console.error('Failed to load local degree records:', error);
    return [];
  }
}

export function saveLocalDegreeRecords(records: StudentDegreeRecord[]): void {
  try {
    const deletedIds = getDeletedIds(DEGREE_RECORDS_COLLECTION);
    const filtered = records.map(sanitizeStudentDegreeRecord).filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_DEGREE_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local degree records:', error);
  }
}

export async function saveStudentDegreeRecord(record: StudentDegreeRecord): Promise<void> {
  const now = new Date().toISOString();
  const sanitized = sanitizeStudentDegreeRecord({
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  });

  // Remove from deleted tracking if present
  removeDeletedId(DEGREE_RECORDS_COLLECTION, sanitized.id);

  const local = getLocalDegreeRecords();
  const index = local.findIndex(r => r.id === sanitized.id);
  if (index >= 0) {
    local[index] = sanitized;
  } else {
    local.push(sanitized);
  }
  saveLocalDegreeRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, DEGREE_RECORDS_COLLECTION, sanitized.id);
    const cleanData = cleanObjectForFirestore(sanitized);
    await setDoc(docRef, cleanData);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Student Degree Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncStudentDegreeRecords(): Promise<StudentDegreeRecord[]> {
  const result = await syncCollectionBidirectional<StudentDegreeRecord>(
    DEGREE_RECORDS_COLLECTION,
    () => getLocalDegreeRecords(),
    (items) => saveLocalDegreeRecords(items),
    sanitizeStudentDegreeRecord
  );

  // Seed sample degree records if database & local storage are both empty
  if (result.length === 0 && localStorage.getItem('aiou_degree_seeded') !== 'true') {
    const samples = getSampleDegreeRecords();
    localStorage.setItem('aiou_degree_seeded', 'true');
    saveLocalDegreeRecords(samples);
    for (const sample of samples) {
      try {
        await saveStudentDegreeRecord(sample);
      } catch (e) {
        console.warn('Could not write sample degree record to Firestore', e);
      }
    }
    return samples;
  }

  return result;
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

  // Remove from deleted tracking if present
  removeDeletedId(QUIZ_RECORDS_COLLECTION, updatedRecord.id);

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
  return syncCollectionBidirectional<StudentQuizRecord>(
    QUIZ_RECORDS_COLLECTION,
    () => getLocalQuizRecords(),
    (items) => saveLocalQuizRecords(items)
  );
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
// RESEARCH PROJECT RECORDS LOGIC
// ==========================================
const RESEARCH_PROJECT_RECORDS_COLLECTION = 'research_project_records';
const LOCAL_RESEARCH_PROJECT_RECORDS_KEY = 'aiou_local_research_project_records';

export function getLocalResearchProjectRecords(): ResearchProjectRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_RESEARCH_PROJECT_RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(RESEARCH_PROJECT_RECORDS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local research project records:', error);
    return [];
  }
}

export function saveLocalResearchProjectRecords(records: ResearchProjectRecord[]): void {
  try {
    const deletedIds = getDeletedIds(RESEARCH_PROJECT_RECORDS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_RESEARCH_PROJECT_RECORDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local research project records:', error);
  }
}

export async function saveResearchProjectRecord(record: ResearchProjectRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord: ResearchProjectRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  // Remove from deleted tracking if present
  removeDeletedId(RESEARCH_PROJECT_RECORDS_COLLECTION, updatedRecord.id);

  const local = getLocalResearchProjectRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalResearchProjectRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, RESEARCH_PROJECT_RECORDS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Research Project Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncResearchProjectRecords(): Promise<ResearchProjectRecord[]> {
  return syncCollectionBidirectional<ResearchProjectRecord>(
    RESEARCH_PROJECT_RECORDS_COLLECTION,
    () => getLocalResearchProjectRecords(),
    (items) => saveLocalResearchProjectRecords(items)
  );
}

export async function deleteResearchProjectRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(RESEARCH_PROJECT_RECORDS_COLLECTION, id);

  const local = getLocalResearchProjectRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalResearchProjectRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, RESEARCH_PROJECT_RECORDS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.error('Firestore delete failed for Research Project Record:', error);
    setQuotaExceeded(true);
  }
}

// ==========================================
// EXAM MANAGER PAYMENT RECORDS LOGIC
// ==========================================
const EXAM_MANAGER_PAYMENTS_COLLECTION = 'exam_manager_payments';
const LOCAL_EXAM_MANAGER_PAYMENTS_KEY = 'aiou_local_exam_manager_payments';

export function getLocalExamManagerPaymentRecords(): ExamManagerPaymentRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_EXAM_MANAGER_PAYMENTS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(EXAM_MANAGER_PAYMENTS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local manager payment records:', error);
    return [];
  }
}

export function saveLocalExamManagerPaymentRecords(records: ExamManagerPaymentRecord[]): void {
  try {
    const deletedIds = getDeletedIds(EXAM_MANAGER_PAYMENTS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_EXAM_MANAGER_PAYMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local manager payment records:', error);
  }
}

export async function saveExamManagerPaymentRecord(record: ExamManagerPaymentRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord: ExamManagerPaymentRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  // Remove from deleted tracking if present
  removeDeletedId(EXAM_MANAGER_PAYMENTS_COLLECTION, updatedRecord.id);

  const local = getLocalExamManagerPaymentRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalExamManagerPaymentRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, EXAM_MANAGER_PAYMENTS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.warn('Firestore write failed for Exam Manager Payment Record, using local fallback. Error:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncExamManagerPaymentRecords(): Promise<ExamManagerPaymentRecord[]> {
  return syncCollectionBidirectional<ExamManagerPaymentRecord>(
    EXAM_MANAGER_PAYMENTS_COLLECTION,
    () => getLocalExamManagerPaymentRecords(),
    (items) => saveLocalExamManagerPaymentRecords(items)
  );
}

export async function deleteExamManagerPaymentRecord(id: string): Promise<void> {
  // Add to deleted tracking
  addDeletedId(EXAM_MANAGER_PAYMENTS_COLLECTION, id);

  const local = getLocalExamManagerPaymentRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalExamManagerPaymentRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, EXAM_MANAGER_PAYMENTS_COLLECTION, id));
    setQuotaExceeded(false); // Self-healing
  } catch (error) {
    console.error('Firestore delete failed for Exam Manager Payment Record:', error);
    setQuotaExceeded(true);
  }
}

// ==========================================
// F2F Workshop Management Persistence & Sync
// ==========================================

const F2F_MANAGERS_COLLECTION = 'f2f_managers';
const LOCAL_F2F_MANAGERS_KEY = 'aiou_local_f2f_managers';

const F2F_CANDIDATES_COLLECTION = 'f2f_candidates';
const LOCAL_F2F_CANDIDATES_KEY = 'aiou_local_f2f_candidates';

const F2F_MANAGER_PAYMENTS_COLLECTION = 'f2f_manager_payments';
const LOCAL_F2F_MANAGER_PAYMENTS_KEY = 'aiou_local_f2f_manager_payments';

// 1. F2F Managers Helpers
export function getLocalF2FManagers(): F2FManager[] {
  try {
    const data = localStorage.getItem(LOCAL_F2F_MANAGERS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(F2F_MANAGERS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local F2F managers:', error);
    return [];
  }
}

export function saveLocalF2FManagers(records: F2FManager[]) {
  try {
    const deletedIds = getDeletedIds(F2F_MANAGERS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_F2F_MANAGERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local F2F managers:', error);
  }
}

export async function saveF2FManager(manager: F2FManager): Promise<void> {
  const now = new Date().toISOString();
  const updatedManager = {
    ...manager,
    updatedAt: now,
    createdAt: manager.createdAt || now
  };

  removeDeletedId(F2F_MANAGERS_COLLECTION, updatedManager.id);

  const local = getLocalF2FManagers();
  const index = local.findIndex(m => m.id === updatedManager.id);
  if (index >= 0) {
    local[index] = updatedManager;
  } else {
    local.push(updatedManager);
  }
  saveLocalF2FManagers(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, F2F_MANAGERS_COLLECTION, updatedManager.id);
    await setDoc(docRef, updatedManager);
    setQuotaExceeded(false);
  } catch (error) {
    console.warn('Firestore write failed for F2F Manager, using local fallback:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncF2FManagers(): Promise<F2FManager[]> {
  return syncCollectionBidirectional<F2FManager>(
    F2F_MANAGERS_COLLECTION,
    () => getLocalF2FManagers(),
    (items) => saveLocalF2FManagers(items)
  );
}

export async function deleteF2FManager(id: string): Promise<void> {
  addDeletedId(F2F_MANAGERS_COLLECTION, id);

  const local = getLocalF2FManagers();
  const updated = local.filter(m => m.id !== id);
  saveLocalF2FManagers(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, F2F_MANAGERS_COLLECTION, id));
    setQuotaExceeded(false);
  } catch (error) {
    console.error('Firestore delete failed for F2F Manager:', error);
    setQuotaExceeded(true);
  }
}

// 2. F2F Candidates Helpers
export function getLocalF2FCandidates(): F2FCandidateRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_F2F_CANDIDATES_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(F2F_CANDIDATES_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local F2F candidates:', error);
    return [];
  }
}

export function saveLocalF2FCandidates(records: F2FCandidateRecord[]) {
  try {
    const deletedIds = getDeletedIds(F2F_CANDIDATES_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_F2F_CANDIDATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local F2F candidates:', error);
  }
}

export async function saveF2FCandidate(record: F2FCandidateRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  removeDeletedId(F2F_CANDIDATES_COLLECTION, updatedRecord.id);

  const local = getLocalF2FCandidates();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalF2FCandidates(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, F2F_CANDIDATES_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false);
  } catch (error) {
    console.warn('Firestore write failed for F2F Candidate, using local fallback:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncF2FCandidates(): Promise<F2FCandidateRecord[]> {
  return syncCollectionBidirectional<F2FCandidateRecord>(
    F2F_CANDIDATES_COLLECTION,
    () => getLocalF2FCandidates(),
    (items) => saveLocalF2FCandidates(items)
  );
}

export async function deleteF2FCandidate(id: string): Promise<void> {
  addDeletedId(F2F_CANDIDATES_COLLECTION, id);

  const local = getLocalF2FCandidates();
  const updated = local.filter(r => r.id !== id);
  saveLocalF2FCandidates(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, F2F_CANDIDATES_COLLECTION, id));
    setQuotaExceeded(false);
  } catch (error) {
    console.error('Firestore delete failed for F2F Candidate:', error);
    setQuotaExceeded(true);
  }
}

// 3. F2F Manager Payments Helpers
export function getLocalF2FManagerPaymentRecords(): F2FManagerPaymentRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_F2F_MANAGER_PAYMENTS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const deletedIds = getDeletedIds(F2F_MANAGER_PAYMENTS_COLLECTION);
    return parsed.filter((r: any) => !deletedIds.includes(r.id));
  } catch (error) {
    console.error('Failed to load local F2F manager payments:', error);
    return [];
  }
}

export function saveLocalF2FManagerPaymentRecords(records: F2FManagerPaymentRecord[]) {
  try {
    const deletedIds = getDeletedIds(F2F_MANAGER_PAYMENTS_COLLECTION);
    const filtered = records.filter(r => !deletedIds.includes(r.id));
    localStorage.setItem(LOCAL_F2F_MANAGER_PAYMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save local F2F manager payments:', error);
  }
}

export async function saveF2FManagerPaymentRecord(record: F2FManagerPaymentRecord): Promise<void> {
  const now = new Date().toISOString();
  const updatedRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  removeDeletedId(F2F_MANAGER_PAYMENTS_COLLECTION, updatedRecord.id);

  const local = getLocalF2FManagerPaymentRecords();
  const index = local.findIndex(r => r.id === updatedRecord.id);
  if (index >= 0) {
    local[index] = updatedRecord;
  } else {
    local.push(updatedRecord);
  }
  saveLocalF2FManagerPaymentRecords(local);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, F2F_MANAGER_PAYMENTS_COLLECTION, updatedRecord.id);
    await setDoc(docRef, updatedRecord);
    setQuotaExceeded(false);
  } catch (error) {
    console.warn('Firestore write failed for F2F Manager Payment, using local fallback:', error);
    setQuotaExceeded(true);
  }
}

export async function fetchAndSyncF2FManagerPaymentRecords(): Promise<F2FManagerPaymentRecord[]> {
  return syncCollectionBidirectional<F2FManagerPaymentRecord>(
    F2F_MANAGER_PAYMENTS_COLLECTION,
    () => getLocalF2FManagerPaymentRecords(),
    (items) => saveLocalF2FManagerPaymentRecords(items)
  );
}

export async function deleteF2FManagerPaymentRecord(id: string): Promise<void> {
  addDeletedId(F2F_MANAGER_PAYMENTS_COLLECTION, id);

  const local = getLocalF2FManagerPaymentRecords();
  const updated = local.filter(r => r.id !== id);
  saveLocalF2FManagerPaymentRecords(updated);

  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, F2F_MANAGER_PAYMENTS_COLLECTION, id));
    setQuotaExceeded(false);
  } catch (error) {
    console.error('Firestore delete failed for F2F Manager Payment:', error);
    setQuotaExceeded(true);
  }
}

// ==========================================
// MASTER BACKUP & SYSTEM SYNC HELPERS
// ==========================================

export async function forceUploadAllLocalToCloud(): Promise<number> {
  let uploadedCount = 0;
  try {
    await ensureAuthenticated();
    setQuotaExceeded(false);

    // Push local student records to Cloud Firestore
    const students = getLocalRecords(true).filter(r => !r.isDeleted);
    if (students.length > 0) {
      for (let i = 0; i < students.length; i += 10) {
        const batch = students.slice(i, i + 10);
        await Promise.allSettled(
          batch.map(r => withTimeout(setDoc(doc(db, COLLECTION_NAME, r.id), cleanObjectForFirestore(r)), 8000))
        );
      }
      uploadedCount = students.length;
    }

    // Push local degree records
    const degrees = getLocalDegreeRecords();
    if (degrees.length > 0) {
      for (let i = 0; i < degrees.length; i += 10) {
        const batch = degrees.slice(i, i + 10);
        await Promise.allSettled(
          batch.map(r => withTimeout(setDoc(doc(db, DEGREE_RECORDS_COLLECTION, r.id), cleanObjectForFirestore(r)), 8000))
        );
      }
    }

    // Push local exam records
    const exams = getLocalExamRecords();
    if (exams.length > 0) {
      for (let i = 0; i < exams.length; i += 10) {
        const batch = exams.slice(i, i + 10);
        await Promise.allSettled(
          batch.map(r => withTimeout(setDoc(doc(db, EXAM_RECORDS_COLLECTION, r.id), cleanObjectForFirestore(r)), 8000))
        );
      }
    }
  } catch (error) {
    console.warn('forceUploadAllLocalToCloud encountered non-blocking errors:', error);
  }
  return uploadedCount;
}

export async function syncAllModulesToCloud(): Promise<void> {
  try {
    setQuotaExceeded(false);
    // First push any local records to Cloud Firestore
    await forceUploadAllLocalToCloud().catch(() => {});

    // Then re-fetch and sync all collections from Cloud
    await Promise.allSettled([
      fetchAndSyncRecords({ forceCloudFetch: true }),
      fetchAndSyncExamManagers(),
      fetchAndSyncStudentExamInfos(),
      fetchAndSyncExamManagerPaymentRecords(),
      fetchAndSyncStudentDegreeRecords(),
      fetchAndSyncStudentQuizRecords(),
      fetchAndSyncResearchProjectRecords(),
      fetchAndSyncF2FManagers(),
      fetchAndSyncF2FCandidates(),
      fetchAndSyncF2FManagerPaymentRecords()
    ]);
  } catch (error) {
    console.warn('Full module cloud sync encountered non-blocking errors:', error);
  }
}

export function exportAllDataToJSON(): string {
  const backup = {
    appName: 'AIOU Student & Academic Management System',
    version: '2.0',
    exportDate: new Date().toISOString(),
    collections: {
      students_records: getLocalRecords(true),
      exam_managers: getLocalExamManagers(),
      exam_records: getLocalExamRecords(),
      exam_manager_payments: getLocalExamManagerPaymentRecords(),
      degree_records: getLocalDegreeRecords(),
      quiz_records: getLocalQuizRecords(),
      research_project_records: getLocalResearchProjectRecords(),
      f2f_managers: getLocalF2FManagers(),
      f2f_candidates: getLocalF2FCandidates(),
      f2f_manager_payments: getLocalF2FManagerPaymentRecords()
    }
  };
  return JSON.stringify(backup, null, 2);
}

export async function importAllDataFromJSON(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let data = JSON.parse(jsonString);
    
    // If double encoded string
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    let totalImported = 0;

    // Helper to merge and save student records safely
    const processStudentArray = (arr: any[]) => {
      if (!Array.isArray(arr) || arr.length === 0) return;
      const existing = getLocalRecords(true);
      const map = new Map<string, StudentRecord>();
      existing.forEach(r => map.set(r.id, r));
      arr.forEach(r => {
        if (r && typeof r === 'object' && (r.id || r.studentId || r.studentName)) {
          const id = r.id || `${r.studentId || 'std'}_${Date.now()}_${Math.random()}`;
          map.set(id, { ...r, id });
        }
      });
      const merged = Array.from(map.values());
      saveLocalRecords(merged);
      totalImported += arr.length;
    };

    if (data.collections) {
      if (Array.isArray(data.collections.students_records)) {
        processStudentArray(data.collections.students_records);
      }
      if (Array.isArray(data.collections.exam_managers)) {
        saveLocalExamManagers(data.collections.exam_managers);
        totalImported += data.collections.exam_managers.length;
      }
      if (Array.isArray(data.collections.exam_records)) {
        saveLocalExamRecords(data.collections.exam_records);
        totalImported += data.collections.exam_records.length;
      }
      if (Array.isArray(data.collections.exam_manager_payments)) {
        saveLocalExamManagerPaymentRecords(data.collections.exam_manager_payments);
        totalImported += data.collections.exam_manager_payments.length;
      }
      if (Array.isArray(data.collections.degree_records)) {
        saveLocalDegreeRecords(data.collections.degree_records);
        totalImported += data.collections.degree_records.length;
      }
      if (Array.isArray(data.collections.quiz_records)) {
        saveLocalQuizRecords(data.collections.quiz_records);
        totalImported += data.collections.quiz_records.length;
      }
      if (Array.isArray(data.collections.research_project_records)) {
        saveLocalResearchProjectRecords(data.collections.research_project_records);
        totalImported += data.collections.research_project_records.length;
      }
      if (Array.isArray(data.collections.f2f_managers)) {
        saveLocalF2FManagers(data.collections.f2f_managers);
        totalImported += data.collections.f2f_managers.length;
      }
      if (Array.isArray(data.collections.f2f_candidates)) {
        saveLocalF2FCandidates(data.collections.f2f_candidates);
        totalImported += data.collections.f2f_candidates.length;
      }
      if (Array.isArray(data.collections.f2f_manager_payments)) {
        saveLocalF2FManagerPaymentRecords(data.collections.f2f_manager_payments);
        totalImported += data.collections.f2f_manager_payments.length;
      }
    } else if (Array.isArray(data)) {
      // Direct array of student records
      processStudentArray(data);
    } else if (typeof data === 'object' && data !== null) {
      // Raw localStorage dump object
      const studentCandidates = 
        data.aiou_students_local_records || 
        data.aiou_students_records || 
        data.students || 
        data.records;

      if (studentCandidates) {
        const parsed = typeof studentCandidates === 'string' ? JSON.parse(studentCandidates) : studentCandidates;
        if (Array.isArray(parsed)) {
          processStudentArray(parsed);
        }
      }

      // Check if any root keys hold array of student records
      for (const [key, val] of Object.entries(data)) {
        if (key.includes('student') || key.includes('record')) {
          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.studentName) {
            processStudentArray(parsed);
          }
        }
      }
    }

    if (totalImported === 0) {
      throw new Error('No valid student or system records found in the backup file.');
    }

    // Immediately trigger cloud sync to push imported data up to Firestore
    await syncAllModulesToCloud();

    return {
      success: true,
      message: `Successfully imported ${totalImported} records across modules and synced with Cloud Firestore!`,
      count: totalImported
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to parse JSON backup file.',
      count: 0
    };
  }
}

/**
 * Delete all demo/sample student records from Local Storage and Cloud Firestore.
 */
export async function deleteAllDemoStudentRecords(): Promise<{ count: number; message: string }> {
  try {
    const sampleStudents = getSampleRecords();
    const sampleDegrees = getSampleDegreeRecords();
    const demoIds = new Set<string>([
      ...sampleStudents.map(s => s.id),
      ...sampleDegrees.map(d => d.id)
    ]);

    // Mark seeded flag to prevent automatic re-seeding
    localStorage.setItem('aiou_degree_seeded', 'true');

    // 1. Process Student Records
    const localStudents = getLocalRecords(true);
    let deletedStudentCount = 0;
    const remainingStudents: StudentRecord[] = [];

    for (const record of localStudents) {
      const isDemo = 
        demoIds.has(record.id) ||
        demoIds.has(record.registrationId) ||
        /^23FPA|^24SPA|^deg-sample-|^demo-|^sample-/i.test(record.id) ||
        (record.registrationId && /^23FPA|^24SPA/i.test(record.registrationId)) ||
        ((record as any).studentId && /^23FPA|^24SPA/i.test((record as any).studentId)) ||
        (record.remarks && record.remarks.includes('AIOU Student record #'));

      if (isDemo) {
        deletedStudentCount++;
        addDeletedId(COLLECTION_NAME, record.id);
        try {
          await deleteDoc(doc(db, COLLECTION_NAME, record.id));
        } catch (e) {
          console.warn(`Firestore delete error for demo student record ${record.id}:`, e);
        }
      } else {
        remainingStudents.push(record);
      }
    }

    saveLocalRecords(remainingStudents);

    // 2. Process Degree Records
    const localDegrees = getLocalDegreeRecords();
    let deletedDegreeCount = 0;
    const remainingDegrees: StudentDegreeRecord[] = [];

    for (const deg of localDegrees) {
      const isDemo = 
        demoIds.has(deg.id) ||
        demoIds.has(deg.studentId) ||
        /^deg-sample-|^demo-|^sample-|^23FPA|^24SPA/i.test(deg.id) ||
        (deg.studentId && /^23FPA|^24SPA/i.test(deg.studentId)) ||
        deg.studentName === 'Ahmad Khan' || deg.studentName === 'Sana Fatima' || deg.studentName === 'Muhammad Ali';

      if (isDemo) {
        deletedDegreeCount++;
        addDeletedId(DEGREE_RECORDS_COLLECTION, deg.id);
        try {
          await deleteDoc(doc(db, DEGREE_RECORDS_COLLECTION, deg.id));
        } catch (e) {
          console.warn(`Firestore delete error for demo degree record ${deg.id}:`, e);
        }
      } else {
        remainingDegrees.push(deg);
      }
    }

    saveLocalDegreeRecords(remainingDegrees);

    const totalDeleted = deletedStudentCount + deletedDegreeCount;

    return {
      count: totalDeleted,
      message: `Successfully deleted ${totalDeleted} demo record(s) (${deletedStudentCount} students, ${deletedDegreeCount} degree applications)!`
    };
  } catch (error: any) {
    console.error('Error deleting demo records:', error);
    return {
      count: 0,
      message: error?.message || 'Failed to delete demo records.'
    };
  }
}




