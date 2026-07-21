import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Clock, 
  Bell, 
  BookOpen, 
  Users, 
  Check, 
  Mail, 
  Phone, 
  AlertTriangle,
  UserPlus,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';
import { 
  StudentRecord, 
  ExamManager, 
  StudentExamInfo, 
  CourseExamDate, 
  ExamPaymentHistory,
  StudentExamSemester,
  ExamManagerPaymentRecord,
  CoursePaymentDetails,
  ManagerPaymentEntry
} from '../types';
import SecurityAuthModal from './SecurityAuthModal';
import { 
  saveExamManager, 
  fetchAndSyncExamManagers, 
  deleteExamManager, 
  saveStudentExamInfo, 
  fetchAndSyncStudentExamInfos, 
  deleteStudentExamInfo,
  saveExamManagerPaymentRecord,
  fetchAndSyncExamManagerPaymentRecords,
  deleteExamManagerPaymentRecord
} from '../firebase';

interface ExamRecordsModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  theme: 'green' | 'blue';
}

export default function ExamRecordsModule({
  onBackToDashboard,
  studentRecords,
  theme,
}: ExamRecordsModuleProps) {
  const isGreen = theme === 'green';

  // Core navigation states
  const [step, setStep] = useState<'centre' | 'manager' | 'manager_options' | 'student_exam' | 'payment_records'>('centre');
  const [selectedCentre, setSelectedCentre] = useState<'Mithi' | 'Diplo' | null>(null);
  const [selectedManager, setSelectedManager] = useState<ExamManager | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Firestore sync states
  const [managers, setManagers] = useState<ExamManager[]>([]);
  const [examRecords, setExamRecords] = useState<StudentExamInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal / Form opening states
  const [isManagerFormOpen, setIsManagerFormOpen] = useState<boolean>(false);
  const [editingManager, setEditingManager] = useState<ExamManager | null>(null);
  const [isExamFormOpen, setIsExamFormOpen] = useState<boolean>(false);
  const [editingExamInfo, setEditingExamInfo] = useState<StudentExamInfo | null>(null);

  // Multi-semester state management
  const [formSemesters, setFormSemesters] = useState<StudentExamSemester[]>([]);
  const [activeFormSemId, setActiveFormSemId] = useState<string>('');
  const [newSemSeason, setNewSemSeason] = useState<'Autumn' | 'Spring'>('Autumn');
  const [newSemYear, setNewSemYear] = useState<string>('2026');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Manager Form fields
  const [mgrName, setMgrName] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');

  // Exam Info Form fields
  const [examStudentName, setExamStudentName] = useState('');
  const [examFatherName, setExamFatherName] = useState('');
  const [examStudentId, setExamStudentId] = useState('');
  const [examContactNumber, setExamContactNumber] = useState('');
  const [examSemesterTerm, setExamSemesterTerm] = useState('Autumn 2026');
  const [semesterSeason, setSemesterSeason] = useState<'Autumn' | 'Spring'>('Autumn');
  const [semesterYear, setSemesterYear] = useState<string>('2026');
  const [examCourseCodes, setExamCourseCodes] = useState<string[]>([]);
  const [examDatesList, setExamDatesList] = useState<CourseExamDate[]>([]);
  const [newCourseCodeInput, setNewCourseCodeInput] = useState('');
  
  // Prefill directory tracking states
  const [selectedPrefillStudent, setSelectedPrefillStudent] = useState<StudentRecord | null>(null);
  const [selectedEnrollmentSemester, setSelectedEnrollmentSemester] = useState<number | ''>('');

  // Payment Form fields
  const [totalFee, setTotalFee] = useState<number | ''>('');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<ExamPaymentHistory[]>([]);
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Active console sub-section tab ('students' or 'payments')
  const [activeConsoleTab, setActiveConsoleTab] = useState<'students' | 'payments'>('students');

  // Exam Manager Payment Records states
  const [paymentRecords, setPaymentRecords] = useState<ExamManagerPaymentRecord[]>([]);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState<ExamManagerPaymentRecord | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState<boolean>(false);
  const [paymentSemester, setPaymentSemester] = useState<string>('Autumn');
  const [paymentYear, setPaymentYear] = useState<string>('2026');
  const [paymentCourses, setPaymentCourses] = useState<CoursePaymentDetails[]>([]);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('');

  // Course row entry inside the form
  const [formCourseName, setFormCourseName] = useState<string>('BA');
  const [formCustomCourseName, setFormCustomCourseName] = useState<string>('');
  const [formPerPaperRate, setFormPerPaperRate] = useState<number | ''>('');
  const [formTotalPapers, setFormTotalPapers] = useState<number | ''>('');
  const [formEditingCourseId, setFormEditingCourseId] = useState<string | null>(null);

  // Expanded payment record ID for managing additional payments and viewing details
  const [expandedPaymentRecordId, setExpandedPaymentRecordId] = useState<string | null>(null);

  // Add payment states (for payments made later)
  const [newEntryDate, setNewEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newEntryAmount, setNewEntryAmount] = useState<number | ''>('');
  const [newEntryRemarks, setNewEntryRemarks] = useState<string>('');

  // Toast simulations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Auth Modal for Deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'manager' | 'exam_info' | 'payment_record' | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string>('');

  // Direct helper to update a single semester's records inside the multi-semester form
  const updateSemester = (semId: string, fields: Partial<StudentExamSemester>) => {
    setFormSemesters(prev => prev.map(s => {
      if (s.id === semId) {
        return { ...s, ...fields };
      }
      return s;
    }));
  };

  // Helper to switch the active semester tab in the form
  const selectSemester = (semId: string) => {
    const activeSem = formSemesters.find(s => s.id === semId);
    if (activeSem) {
      setActiveFormSemId(semId);
      setExamCourseCodes(activeSem.courseCodes || []);
      setExamDatesList(activeSem.examDates || []);
      setTotalFee(activeSem.totalFee === undefined ? '' : activeSem.totalFee);
      setAmountReceived(activeSem.amountReceived || 0);
      setPaymentHistory(activeSem.paymentHistory || []);
      
      const parts = (activeSem.semesterTerm || 'Autumn 2026').split(' ');
      setSemesterSeason(parts[0] === 'Spring' ? 'Spring' : 'Autumn');
      setSemesterYear(parts[1] || '2026');
      setExamSemesterTerm(activeSem.semesterTerm || 'Autumn 2026');
    }
  };

  // Toggle student detail expansion row
  const handleToggleExpandStudent = (id: string) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  // Safe normalization of exam records
  const setNormalizedExamRecords = (records: StudentExamInfo[]) => {
    const normalized = records.map(rec => {
      if (!rec.semesters || rec.semesters.length === 0) {
        const legacySem: StudentExamSemester = {
          id: `sem-legacy-${Math.random().toString(36).substr(2, 9)}`,
          semesterTerm: rec.semesterTerm || 'Autumn 2026',
          courseCodes: rec.courseCodes || (rec.courseCode ? [rec.courseCode] : []),
          examDates: rec.examDates || [],
          totalFee: rec.totalFee === undefined || rec.totalFee === null ? undefined : rec.totalFee,
          amountReceived: rec.amountReceived || 0,
          paymentHistory: rec.paymentHistory || []
        };
        return {
          ...rec,
          semesters: [legacySem]
        };
      }
      return rec;
    });
    setExamRecords(normalized);
  };

  // Create a new semester tab inside the editing form
  const handleCreateSemesterTab = () => {
    const termStr = `${newSemSeason} ${newSemYear}`;
    const exists = formSemesters.some(s => s.semesterTerm === termStr);
    if (exists) {
      triggerToast(`Semester ${termStr} is already registered.`);
      return;
    }
    const newSem: StudentExamSemester = {
      id: `sem-${Math.random().toString(36).substr(2, 9)}`,
      semesterTerm: termStr,
      courseCodes: [],
      examDates: [],
      totalFee: undefined,
      amountReceived: 0,
      paymentHistory: []
    };
    const updatedSems = [...formSemesters, newSem];
    setFormSemesters(updatedSems);
    setActiveFormSemId(newSem.id);

    // Sync input fields
    setExamCourseCodes([]);
    setExamDatesList([]);
    setTotalFee('');
    setAmountReceived(0);
    setPaymentHistory([]);
    setNewPayAmount('');

    triggerToast(`Added new semester tab for ${termStr}!`);
  };

  const handleSemesterSeasonChange = (season: 'Autumn' | 'Spring') => {
    setSemesterSeason(season);
    const newTerm = `${season} ${semesterYear}`;
    setExamSemesterTerm(newTerm);
    if (activeFormSemId) {
      updateSemester(activeFormSemId, { semesterTerm: newTerm });
    }
  };

  const handleSemesterYearChange = (year: string) => {
    setSemesterYear(year);
    const newTerm = `${semesterSeason} ${year}`;
    setExamSemesterTerm(newTerm);
    if (activeFormSemId) {
      updateSemester(activeFormSemId, { semesterTerm: newTerm });
    }
  };

  // Load managers, exam records, and payment records on mount and sync
  const loadExamData = async () => {
    setLoading(true);
    try {
      const syncedManagers = await fetchAndSyncExamManagers();
      const syncedExamRecords = await fetchAndSyncStudentExamInfos();
      const syncedPaymentRecords = await fetchAndSyncExamManagerPaymentRecords();
      setManagers(syncedManagers);
      setNormalizedExamRecords(syncedExamRecords);
      setPaymentRecords(syncedPaymentRecords);
    } catch (err) {
      console.error('Failed to sync Exam module tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamData();
  }, []);

  // Show auto-dismiss toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Calculate All Courses available in Successfully Enrolled Directory
  const enrolledCourses = Array.from(new Set(
    studentRecords.flatMap(student => 
      (student.semesters || []).flatMap(sem => 
        (sem.courses || []).map(c => c.code)
      )
    )
  )).filter(Boolean).sort();

  // Add standard fallback courses and scheduled courses to offer complete educational listing
  const defaultFallbackCourses = ['8601', '8602', '8603', '8604', '8605', '8606', '8607', '8608', '8613', '5601', '5602'];
  const scheduledCourseCodes = Array.from(new Set(
    examRecords.flatMap(r => 
      (r.semesters || []).flatMap(s => s.courseCodes || [])
    )
  ));
  const allAvailableCourses = Array.from(new Set([
    ...enrolledCourses,
    ...scheduledCourseCodes,
    ...defaultFallbackCourses
  ])).filter(Boolean).sort();

  // Filter managers and records by selection
  const filteredManagers = managers.filter(m => m.centre === selectedCentre);
  const filteredExamRecords = examRecords.filter(r => 
    r.centre === selectedCentre && 
    (selectedManager ? r.managerId === selectedManager.id : true) &&
    (selectedCourse ? r.courseCode === selectedCourse : true)
  );

  // Handle Exam Manager Save (Add/Edit)
  const handleSaveManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre || !mgrName.trim() || !mgrPhone.trim() || !mgrEmail.trim()) {
      triggerToast('Please fill all manager details.');
      return;
    }

    const managerObj: ExamManager = {
      id: editingManager ? editingManager.id : `mgr-${Math.random().toString(36).substr(2, 9)}`,
      name: mgrName.trim(),
      phone: mgrPhone.trim(),
      email: mgrEmail.trim(),
      centre: selectedCentre,
      createdAt: editingManager ? editingManager.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveExamManager(managerObj);
      const updated = await fetchAndSyncExamManagers();
      setManagers(updated);
      setIsManagerFormOpen(false);
      setEditingManager(null);
      setMgrName('');
      setMgrPhone('');
      setMgrEmail('');
      triggerToast(editingManager ? 'Exam Manager updated successfully!' : 'New Exam Manager added successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save exam manager.');
    }
  };

  // Handle Exam Manager Edit Trigger
  const handleEditManagerClick = (mgr: ExamManager) => {
    setEditingManager(mgr);
    setMgrName(mgr.name);
    setMgrPhone(mgr.phone);
    setMgrEmail(mgr.email);
    setIsManagerFormOpen(true);
  };

  // Handle Exam Manager Delete
  const handleDeleteManagerClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mgr = managers.find(m => m.id === id);
    const name = mgr ? mgr.name : 'this manager';
    setIdToDelete(id);
    setDeleteType('manager');
    setDeleteMessage(`Are you sure you want to delete the Exam Manager "${name}"? All associated records will remain but will lack an assigned manager.`);
    setDeleteModalOpen(true);
  };

  // Trigger Student Exam Form Add
  const handleAddExamClick = () => {
    setEditingExamInfo(null);
    setExamStudentName('');
    setExamFatherName('');
    setExamStudentId('');
    setExamContactNumber('');
    setSemesterSeason('Autumn');
    setSemesterYear('2026');
    setExamSemesterTerm('Autumn 2026');
    setSelectedPrefillStudent(null);
    setSelectedEnrollmentSemester('');
    
    // Pre-populate with currently selected course
    const initialCourse = selectedCourse ? [selectedCourse] : [];
    const initialSemId = `sem-${Math.random().toString(36).substr(2, 9)}`;
    const initialSemesters: StudentExamSemester[] = [{
      id: initialSemId,
      semesterTerm: 'Autumn 2026',
      courseCodes: initialCourse,
      examDates: initialCourse.map(code => ({
        courseCode: code,
        examDate: '',
        status: 'Pending',
        reappearDate: '',
        remarks: ''
      })),
      totalFee: undefined,
      amountReceived: 0,
      paymentHistory: []
    }];

    setFormSemesters(initialSemesters);
    setActiveFormSemId(initialSemId);

    setExamCourseCodes(initialCourse);
    setExamDatesList(initialCourse.map(code => ({
      courseCode: code,
      examDate: '',
      status: 'Pending',
      reappearDate: '',
      remarks: ''
    })));
    setTotalFee(''); // Empty/blank by default
    setAmountReceived(0);
    setPaymentHistory([]);
    setNewPayAmount('');
    setIsExamFormOpen(true);
  };

  // Trigger Student Exam Form Edit
  const handleEditExamClick = (info: StudentExamInfo) => {
    setEditingExamInfo(info);
    setExamStudentName(info.studentName);
    setExamFatherName(info.fatherName);
    setExamStudentId(info.studentId);
    setExamContactNumber(info.contactNumber);
    
    // Find the student in studentRecords to support semester course selection during edits as well
    const matchedStudent = studentRecords.find(s => s.registrationId === info.studentId || s.id === info.studentId);
    if (matchedStudent) {
      setSelectedPrefillStudent(matchedStudent);
      setSelectedEnrollmentSemester(matchedStudent.semesters?.[0]?.semesterNumber || '');
    } else {
      setSelectedPrefillStudent(null);
      setSelectedEnrollmentSemester('');
    }
    
    // Normalize semesters list
    let sems = info.semesters || [];
    if (sems.length === 0) {
      sems = [{
        id: `sem-legacy-${Math.random().toString(36).substr(2, 9)}`,
        semesterTerm: info.semesterTerm || 'Autumn 2026',
        courseCodes: info.courseCodes || (info.courseCode ? [info.courseCode] : []),
        examDates: info.examDates || [],
        totalFee: info.totalFee === undefined || info.totalFee === null ? undefined : info.totalFee,
        amountReceived: info.amountReceived || 0,
        paymentHistory: info.paymentHistory || []
      }];
    }

    setFormSemesters(sems);

    // Set first semester as active
    const firstSem = sems[0];
    setActiveFormSemId(firstSem.id);

    // Sync input fields
    setExamCourseCodes(firstSem.courseCodes || []);
    setExamDatesList(firstSem.examDates || []);
    setTotalFee(firstSem.totalFee === undefined || firstSem.totalFee === null ? '' : firstSem.totalFee);
    setAmountReceived(firstSem.amountReceived || 0);
    setPaymentHistory(firstSem.paymentHistory || []);

    const parts = (firstSem.semesterTerm || 'Autumn 2026').split(' ');
    setSemesterSeason(parts[0] === 'Spring' ? 'Spring' : 'Autumn');
    setSemesterYear(parts[1] || '2026');
    setExamSemesterTerm(firstSem.semesterTerm || 'Autumn 2026');

    setNewPayAmount('');
    setIsExamFormOpen(true);
  };

  // Handle Student Exam Record Delete
  const handleDeleteExamClick = (id: string) => {
    const rec = examRecords.find(r => r.id === id);
    const name = rec ? rec.studentName : 'this exam registration';
    setIdToDelete(id);
    setDeleteType('exam_info');
    setDeleteMessage(`Are you sure you want to delete the student exam registration for "${name}"?`);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!idToDelete || !deleteType) return;
    try {
      if (deleteType === 'manager') {
        await deleteExamManager(idToDelete);
        const updated = await fetchAndSyncExamManagers();
        setManagers(updated);
        if (selectedManager?.id === idToDelete) {
          setSelectedManager(null);
        }
        triggerToast('Exam Manager deleted.');
      } else if (deleteType === 'exam_info') {
        await deleteStudentExamInfo(idToDelete);
        const updated = await fetchAndSyncStudentExamInfos();
        setNormalizedExamRecords(updated);
        triggerToast('Exam registration deleted.');
      } else if (deleteType === 'payment_record') {
        await deleteExamManagerPaymentRecord(idToDelete);
        const updated = await fetchAndSyncExamManagerPaymentRecords();
        setPaymentRecords(updated);
        triggerToast('Payment record deleted.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting record.');
    } finally {
      setDeleteModalOpen(false);
      setIdToDelete(null);
      setDeleteType(null);
    }
  };

  // Helper to dynamically calculate total paper quantity for a course code under the selected manager
  const calculatePaperQuantity = (courseCode: string): number => {
    let quantity = 0;
    examRecords.forEach(rec => {
      if (rec.managerId === selectedManager?.id) {
        if (rec.semesters && rec.semesters.length > 0) {
          rec.semesters.forEach(sem => {
            if (sem.courseCodes && sem.courseCodes.includes(courseCode)) {
              quantity++;
            }
          });
        } else {
          if (rec.courseCodes && rec.courseCodes.includes(courseCode)) {
            quantity++;
          } else if (rec.courseCode === courseCode) {
            quantity++;
          }
        }
      }
    });
    return quantity;
  };

  // Helper to generate sequential S. No. for a manager's payment records
  const generateSerialNoForManager = (mgrId: string): number => {
    const mgrRecords = paymentRecords.filter(r => r.managerId === mgrId);
    if (mgrRecords.length === 0) return 1;
    const maxSerial = Math.max(...mgrRecords.map(r => r.serialNo || 0));
    return maxSerial + 1;
  };

  // Add/edit course row within the payment record form
  const handleAddCourseRow = () => {
    const finalCourseName = formCourseName === 'Other Programs' ? formCustomCourseName.trim() : formCourseName;
    if (!finalCourseName) {
      triggerToast('Please enter or select a valid course name.');
      return;
    }
    if (formPerPaperRate === '' || formTotalPapers === '') {
      triggerToast('Please provide both Per Paper Rate and Total Papers.');
      return;
    }

    const rate = Number(formPerPaperRate);
    const papers = Number(formTotalPapers);
    const amount = rate * papers;

    if (formEditingCourseId) {
      setPaymentCourses(prev => prev.map(c => c.id === formEditingCourseId ? {
        ...c,
        courseName: finalCourseName,
        perPaperRate: rate,
        totalPapers: papers,
        totalAmount: amount
      } : c));
      setFormEditingCourseId(null);
      triggerToast('Course updated in list.');
    } else {
      const newRow: CoursePaymentDetails = {
        id: `course-${Math.random().toString(36).substr(2, 9)}`,
        courseName: finalCourseName,
        perPaperRate: rate,
        totalPapers: papers,
        totalAmount: amount
      };
      setPaymentCourses(prev => [...prev, newRow]);
      triggerToast('Course added to list.');
    }

    // Reset row inputs
    setFormCourseName('BA');
    setFormCustomCourseName('');
    setFormPerPaperRate('');
    setFormTotalPapers('');
  };

  const handleEditCourseRow = (row: CoursePaymentDetails) => {
    const presets = ['BA', 'B.Com', 'B.Ed'];
    if (presets.includes(row.courseName)) {
      setFormCourseName(row.courseName);
      setFormCustomCourseName('');
    } else {
      setFormCourseName('Other Programs');
      setFormCustomCourseName(row.courseName);
    }
    setFormPerPaperRate(row.perPaperRate);
    setFormTotalPapers(row.totalPapers);
    setFormEditingCourseId(row.id);
  };

  const handleDeleteCourseRow = (id: string) => {
    setPaymentCourses(prev => prev.filter(c => c.id !== id));
    if (formEditingCourseId === id) {
      setFormEditingCourseId(null);
    }
    triggerToast('Course removed from list.');
  };

  // Save full Payment Record for Exam Manager
  const handleSavePaymentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    if (paymentCourses.length === 0) {
      triggerToast('Please add at least one course to the payment record.');
      return;
    }

    const grandTotal = paymentCourses.reduce((sum, c) => sum + c.totalAmount, 0);
    const paymentsList = editingPaymentRecord ? (editingPaymentRecord.payments || []) : [];
    const totalPaid = paymentsList.reduce((sum, p) => sum + p.amount, 0);
    const remaining = grandTotal - totalPaid;
    const serialNo = editingPaymentRecord ? editingPaymentRecord.serialNo : generateSerialNoForManager(selectedManager.id);

    const recordObj: ExamManagerPaymentRecord = {
      id: editingPaymentRecord ? editingPaymentRecord.id : `payrec-${Math.random().toString(36).substr(2, 9)}`,
      managerId: selectedManager.id,
      semester: paymentSemester,
      year: paymentYear,
      serialNo,
      courses: paymentCourses,
      grandTotal,
      payments: paymentsList,
      totalPaidAmount: totalPaid,
      remainingAmountPayable: remaining,
      createdAt: editingPaymentRecord ? editingPaymentRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveExamManagerPaymentRecord(recordObj);
      const updated = await fetchAndSyncExamManagerPaymentRecords();
      setPaymentRecords(updated);
      setIsPaymentFormOpen(false);
      setEditingPaymentRecord(null);
      setPaymentCourses([]);
      triggerToast(editingPaymentRecord ? 'Payment record updated successfully!' : 'New payment record created successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save payment record.');
    }
  };

  // Delete Course Payment Record for Exam Manager
  const handleDeletePaymentRecordClick = (id: string) => {
    setIdToDelete(id);
    setDeleteType('payment_record');
    setDeleteMessage('Are you sure you want to delete this payment record and all associated history?');
    setDeleteModalOpen(true);
  };

  // Record additional payments made later
  const handleAddPaymentEntry = async (record: ExamManagerPaymentRecord) => {
    if (newEntryAmount === '' || Number(newEntryAmount) <= 0) {
      triggerToast('Please enter a valid payment amount.');
      return;
    }

    const newPayment: ManagerPaymentEntry = {
      id: `entry-${Math.random().toString(36).substr(2, 9)}`,
      date: newEntryDate,
      amount: Number(newEntryAmount),
      remarks: newEntryRemarks.trim() || undefined
    };

    const updatedPayments = [...(record.payments || []), newPayment];
    const updatedPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const updatedRemaining = record.grandTotal - updatedPaid;

    const updatedRecord: ExamManagerPaymentRecord = {
      ...record,
      payments: updatedPayments,
      totalPaidAmount: updatedPaid,
      remainingAmountPayable: updatedRemaining,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveExamManagerPaymentRecord(updatedRecord);
      const updatedList = await fetchAndSyncExamManagerPaymentRecords();
      setPaymentRecords(updatedList);
      setNewEntryAmount('');
      setNewEntryRemarks('');
      triggerToast('Payment entry recorded successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to record payment.');
    }
  };

  const handleDeletePaymentEntry = async (record: ExamManagerPaymentRecord, entryId: string) => {
    const updatedPayments = (record.payments || []).filter(p => p.id !== entryId);
    const updatedPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const updatedRemaining = record.grandTotal - updatedPaid;

    const updatedRecord: ExamManagerPaymentRecord = {
      ...record,
      payments: updatedPayments,
      totalPaidAmount: updatedPaid,
      remainingAmountPayable: updatedRemaining,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveExamManagerPaymentRecord(updatedRecord);
      const updatedList = await fetchAndSyncExamManagerPaymentRecords();
      setPaymentRecords(updatedList);
      triggerToast('Payment entry removed.');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete payment entry.');
    }
  };

  // Add course code to active list in form
  const handleAddCourseCodeToExam = () => {
    const code = newCourseCodeInput.trim().toUpperCase();
    if (!code) return;
    if (examCourseCodes.includes(code)) {
      triggerToast('Course code already added.');
      return;
    }
    const updatedCodes = [...examCourseCodes, code];
    const updatedDates = [...examDatesList, { 
      courseCode: code, 
      examDate: '', 
      status: 'Pending', 
      reappearDate: '', 
      remarks: '' 
    }];
    const updatedFee = totalFee;

    setExamCourseCodes(updatedCodes);
    setExamDatesList(updatedDates);
    setTotalFee(updatedFee);
    setNewCourseCodeInput('');

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        courseCodes: updatedCodes,
        examDates: updatedDates,
        totalFee: updatedFee === '' ? undefined : updatedFee
      });
    }
  };

  // Remove course code from list in form
  const handleRemoveCourseCodeFromExam = (code: string) => {
    const updatedCodes = examCourseCodes.filter(c => c !== code);
    const updatedDates = examDatesList.filter(d => d.courseCode !== code);
    const updatedFee = totalFee;

    setExamCourseCodes(updatedCodes);
    setExamDatesList(updatedDates);
    setTotalFee(updatedFee);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        courseCodes: updatedCodes,
        examDates: updatedDates,
        totalFee: updatedFee === '' ? undefined : updatedFee
      });
    }
  };

  // Update specific exam date in form list
  const handleUpdateExamDate = (code: string, dateVal: string) => {
    const updatedDates = examDatesList.map(item => {
      if (item.courseCode === code) {
        return { ...item, examDate: dateVal };
      }
      return item;
    });
    setExamDatesList(updatedDates);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        examDates: updatedDates
      });
    }
  };

  // Update specific course exam field in form list
  const handleUpdateCourseExamField = (code: string, field: keyof CourseExamDate, value: any) => {
    const updatedDates = examDatesList.map(item => {
      if (item.courseCode === code) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setExamDatesList(updatedDates);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        examDates: updatedDates
      });
    }
  };

  // Add transaction to local payment history in form
  const handleAddPaymentToHistory = () => {
    const amt = parseFloat(newPayAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast('Enter a valid positive payment amount.');
      return;
    }
    const feeNum = totalFee === '' ? 0 : totalFee;
    const remaining = feeNum - amountReceived;
    if (amt > remaining) {
      triggerToast(`Amount exceeds outstanding balance (Rs. ${remaining.toLocaleString()}).`);
      return;
    }

    const newPayment: ExamPaymentHistory = {
      id: `pay-${Math.random().toString(36).substr(2, 9)}`,
      date: newPayDate,
      amount: amt
    };

    const updatedHistory = [...paymentHistory, newPayment];
    const updatedReceived = amountReceived + amt;

    setPaymentHistory(updatedHistory);
    setAmountReceived(updatedReceived);
    setNewPayAmount('');
    triggerToast(`Payment transaction of Rs. ${amt.toLocaleString()} recorded.`);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        paymentHistory: updatedHistory,
        amountReceived: updatedReceived
      });
    }
  };

  // Remove payment transaction
  const handleRemovePaymentTransaction = (payId: string, amount: number) => {
    const updatedHistory = paymentHistory.filter(p => p.id !== payId);
    const updatedReceived = Math.max(0, amountReceived - amount);

    setPaymentHistory(updatedHistory);
    setAmountReceived(updatedReceived);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        paymentHistory: updatedHistory,
        amountReceived: updatedReceived
      });
    }
  };

  // Handle prefilling student details from existing Directory Records
  const handlePrefillSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    if (!studentId) {
      setSelectedPrefillStudent(null);
      setSelectedEnrollmentSemester('');
      return;
    }
    const student = studentRecords.find(s => s.id === studentId);
    if (student) {
      setSelectedPrefillStudent(student);
      setExamStudentName(student.studentName);
      setExamFatherName(student.fatherName);
      setExamStudentId(student.registrationId || student.id);
      setExamContactNumber(student.phoneNumber);
      
      // Auto pre-populate courses from their first semester if available
      const firstSem = student.semesters?.[0];
      const codes = firstSem?.courses?.map(c => c.code).filter(Boolean) || [];
      setSelectedEnrollmentSemester(firstSem ? firstSem.semesterNumber : '');
      
      const initialSemId = `sem-${Math.random().toString(36).substr(2, 9)}`;
      const semTermStr = student.semesterType && student.admissionYear ? `${student.semesterType} ${student.admissionYear}` : 'Autumn 2026';
      
      const newSem: StudentExamSemester = {
        id: initialSemId,
        semesterTerm: semTermStr,
        courseCodes: codes,
        examDates: codes.map(code => ({ 
          courseCode: code, 
          examDate: '',
          status: 'Pending',
          reappearDate: '',
          remarks: ''
        })),
        totalFee: undefined,
        amountReceived: 0,
        paymentHistory: []
      };

      setFormSemesters([newSem]);
      setActiveFormSemId(initialSemId);

      setExamCourseCodes(codes);
      setExamDatesList(codes.map(code => ({ 
        courseCode: code, 
        examDate: '',
        status: 'Pending',
        reappearDate: '',
        remarks: ''
      })));
      setTotalFee('');
      setAmountReceived(0);
      setPaymentHistory([]);
      setNewPayAmount('');

      triggerToast(`Prefilled details for ${student.studentName}!`);
    }
  };

  // Handle semester-wise course retrieval and auto-loading
  const handleEnrollmentSemesterChange = (semNum: number) => {
    setSelectedEnrollmentSemester(semNum);
    if (!selectedPrefillStudent) return;
    
    // Find matching semester data
    const semData = selectedPrefillStudent.semesters?.find(s => s.semesterNumber === semNum);
    if (semData) {
      const codes = semData.courses?.map(c => c.code).filter(Boolean) || [];
      
      // Load all codes into active state
      setExamCourseCodes(codes);
      
      const newDates = codes.map(code => {
        const existing = examDatesList.find(d => d.courseCode === code);
        return existing || {
          courseCode: code,
          examDate: '',
          status: 'Pending',
          reappearDate: '',
          remarks: ''
        };
      });
      setExamDatesList(newDates);

      // Sync to the active form semester tab
      if (activeFormSemId) {
        setFormSemesters(prev => prev.map(sem => {
          if (sem.id === activeFormSemId) {
            return {
              ...sem,
              courseCodes: codes,
              examDates: newDates
            };
          }
          return sem;
        }));
      }

      triggerToast(`Loaded ${codes.length} courses from Semester ${semNum}!`);
    } else {
      triggerToast(`No previously enrolled record found for Semester ${semNum}.`);
    }
  };

  // Save student exam record
  const handleSaveStudentExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre || !selectedManager) return;
    if (!examStudentName.trim() || !examFatherName.trim() || !examStudentId.trim() || !examContactNumber.trim()) {
      triggerToast('Please fill all required student identifiers.');
      return;
    }
    if (formSemesters.length === 0) {
      triggerToast('Please register at least one semester for this student.');
      return;
    }

    // Validate that each semester has at least one course code
    const invalidSem = formSemesters.find(s => s.courseCodes.length === 0);
    if (invalidSem) {
      triggerToast(`Semester "${invalidSem.semesterTerm}" must have at least one course code.`);
      return;
    }

    // Ensure the current input states are synced to the active semester before saving
    const syncedSemesters = formSemesters.map(sem => {
      if (sem.id === activeFormSemId) {
        return {
          ...sem,
          totalFee: totalFee === '' ? undefined : totalFee,
          amountReceived: amountReceived,
          paymentHistory: paymentHistory
        };
      }
      return sem;
    });

    const activeSem = syncedSemesters.find(s => s.id === activeFormSemId) || syncedSemesters[0];

    const examObj: StudentExamInfo = {
      id: editingExamInfo ? editingExamInfo.id : `exam-${Math.random().toString(36).substr(2, 9)}`,
      centre: selectedCentre,
      managerId: selectedManager.id,
      courseCode: activeSem.courseCodes[0] || '',
      studentName: examStudentName.trim(),
      fatherName: examFatherName.trim(),
      studentId: examStudentId.trim(),
      contactNumber: examContactNumber.trim(),
      
      // Multiple semesters support
      semesters: syncedSemesters,

      // Legacy fallback support fields
      semesterTerm: activeSem.semesterTerm,
      courseCodes: activeSem.courseCodes,
      examDates: activeSem.examDates,
      totalFee: activeSem.totalFee,
      amountReceived: activeSem.amountReceived,
      remainingBalance: Math.max(0, (activeSem.totalFee || 0) - activeSem.amountReceived),
      paymentHistory: activeSem.paymentHistory,

      createdAt: editingExamInfo ? editingExamInfo.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveStudentExamInfo(examObj);
      const updated = await fetchAndSyncStudentExamInfos();
      setNormalizedExamRecords(updated);
      setIsExamFormOpen(false);
      setEditingExamInfo(null);
      triggerToast(editingExamInfo ? 'Examination record updated!' : 'New examination record created successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save examination record.');
    }
  };

  // 2. Automated Notification Reminders generator before each exam date
  // Scans all exam records for the selected manager/centre and checks dates against "today" (2026-06-28)
  const today = new Date('2026-06-28');
  const activeReminders: {
    studentName: string;
    courseCode: string;
    date: string;
    daysLeft: number;
    recordId: string;
    contactNumber: string;
  }[] = [];

  examRecords.forEach(rec => {
    // Check match
    if (rec.centre === selectedCentre && (selectedManager ? rec.managerId === selectedManager.id : true)) {
      (rec.examDates || []).forEach(d => {
        if (d.examDate) {
          const examD = new Date(d.examDate);
          const timeDiff = examD.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Generate notification alerts for exams scheduled within the next 15 days
          if (daysLeft >= 0 && daysLeft <= 15) {
            activeReminders.push({
              studentName: rec.studentName,
              courseCode: d.courseCode,
              date: d.examDate,
              daysLeft: daysLeft,
              recordId: rec.id,
              contactNumber: rec.contactNumber
            });
          }
        }
      });
    }
  });

  // Sort reminders with soonest exams first
  activeReminders.sort((a, b) => a.daysLeft - b.daysLeft);

  // Simulated Broadcast Alert
  const handleBroadcastAlert = (rem: typeof activeReminders[0]) => {
    triggerToast(
      `🔔 Broadcast alert dispatched to Exam Manager "${selectedManager?.name}" & Student "${rem.studentName}" for Course Code ${rem.courseCode} scheduled on ${rem.date}.`
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-900/95 text-white text-xs font-bold font-mono px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-800 backdrop-blur-sm animate-bounce">
          <Bell size={14} className="text-amber-500 fill-amber-100 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (step === 'student_exam') setStep('manager_options');
              else if (step === 'payment_records') setStep('manager_options');
              else if (step === 'manager_options') setStep('manager');
              else if (step === 'manager') setStep('centre');
              else onBackToDashboard();
            }}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} className="text-gray-600 font-bold" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-600 block">Allama Iqbal Open University</span>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isGreen ? 'text-emerald-950' : 'text-sky-950'}`}>
              Examination Centers & Manager Ledger
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {selectedCentre && (
            <span className="px-3 py-1 bg-purple-50 text-purple-700 font-extrabold rounded-full border border-purple-100">
              Centre: {selectedCentre}
            </span>
          )}
          {selectedManager && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-full border border-blue-100 max-w-[150px] truncate">
              Manager: {selectedManager.name}
            </span>
          )}
        </div>
      </div>

      {/* STEP 1: SELECT EXAM CENTRE */}
      {step === 'centre' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-gray-900">Select Examination Intake Centre</h3>
            <p className="text-xs text-gray-500">
              AIOU maintains two designated model examination hubs in Thar region. Choose a centre below to manage managers, register schedules, and monitor student dues.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
            {/* Centre Mithi */}
            <div 
              onClick={() => {
                setSelectedCentre('Mithi');
                setStep('manager');
              }}
              className={`p-8 bg-white border border-gray-150 rounded-3xl text-center cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                isGreen ? 'hover:border-emerald-400' : 'hover:border-sky-400'
              }`}
            >
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${
                isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
              }`}>
                <Building2 size={32} />
              </div>
              <h4 className="text-xl font-black text-gray-900">Exam Centre Mithi</h4>
              <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                Model centre handling urban & regional Tharparkar enrollment batches. Active rosters and physical audits.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-around text-xs text-gray-400 font-semibold">
                <div>
                  <span className="block text-gray-800 font-black text-sm">
                    {managers.filter(m => m.centre === 'Mithi').length}
                  </span>
                  Managers
                </div>
                <div>
                  <span className="block text-gray-800 font-black text-sm">
                    {examRecords.filter(r => r.centre === 'Mithi').length}
                  </span>
                  Scheduled Students
                </div>
              </div>
            </div>

            {/* Centre Diplo */}
            <div 
              onClick={() => {
                setSelectedCentre('Diplo');
                setStep('manager');
              }}
              className={`p-8 bg-white border border-gray-150 rounded-3xl text-center cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                isGreen ? 'hover:border-emerald-400' : 'hover:border-sky-400'
              }`}
            >
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${
                isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
              }`}>
                <Building2 size={32} />
              </div>
              <h4 className="text-xl font-black text-gray-900">Exam Centre Diplo</h4>
              <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                Model centre handling Southern border admissions, regional examinations scheduling, and field supervisors.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-around text-xs text-gray-400 font-semibold">
                <div>
                  <span className="block text-gray-800 font-black text-sm">
                    {managers.filter(m => m.centre === 'Diplo').length}
                  </span>
                  Managers
                </div>
                <div>
                  <span className="block text-gray-800 font-black text-sm">
                    {examRecords.filter(r => r.centre === 'Diplo').length}
                  </span>
                  Scheduled Students
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MANAGE EXAM MANAGERS */}
      {step === 'manager' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Exam Managers for {selectedCentre} Hub</h3>
              <p className="text-[11px] text-gray-400">
                Each centre requires an active Exam Manager to conduct paper collections, verify identities, and submit marks.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingManager(null);
                setMgrName('');
                setMgrPhone('');
                setMgrEmail('');
                setIsManagerFormOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
                isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              <Plus size={14} className="text-white font-bold" />
              <span>Add Exam Manager</span>
            </button>
          </div>

          {/* Add/Edit Manager Form Modal */}
          {isManagerFormOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4"
            >
              <div className="border-b border-gray-100 pb-3">
                <h4 className="text-xs font-black uppercase text-purple-600">
                  {editingManager ? 'Modify Exam Manager' : 'Register New Exam Manager'}
                </h4>
              </div>

              <form onSubmit={handleSaveManager} className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={mgrName}
                    onChange={(e) => setMgrName(e.target.value)}
                    placeholder="e.g. Prof. Abdul Majeed"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={mgrPhone}
                    onChange={(e) => setMgrPhone(e.target.value)}
                    placeholder="e.g. +92 333 1234567"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    placeholder="e.g. majeed@aiou.edu.pk"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManagerFormOpen(false);
                      setEditingManager(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    Save Manager Details
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Managers List */}
          {filteredManagers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 italic text-gray-400 text-xs">
              No Exam Managers registered for Centre {selectedCentre} yet. Please add a manager to proceed!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredManagers.map((mgr) => {
                const mgrCount = examRecords.filter(r => r.managerId === mgr.id).length;
                return (
                  <div
                    key={mgr.id}
                    onClick={() => {
                      setSelectedManager(mgr);
                      setSelectedCourse(null);
                      setStep('manager_options');
                    }}
                    className="p-5 bg-white border border-gray-150 rounded-2xl hover:border-purple-300 hover:shadow-xs cursor-pointer transition-all duration-150 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <UserCheck size={18} className="text-purple-500 fill-purple-100" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                              {mgr.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium">Exam Hub Coordinator</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditManagerClick(mgr);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-md cursor-pointer"
                            title="Edit Manager"
                          >
                            <Edit size={12} className="text-blue-500 fill-blue-50" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteManagerClick(mgr.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-md cursor-pointer"
                            title="Delete Manager"
                          >
                            <Trash2 size={12} className="text-red-500 fill-red-50" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-blue-500 fill-blue-50" />
                          <span>{mgr.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-indigo-500 fill-indigo-50 truncate" />
                          <span className="truncate">{mgr.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-400">Scheduled Exams:</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                        {mgrCount} student(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3.5: EXAM MANAGER OPTIONS SCREEN */}
      {step === 'manager_options' && selectedManager && (
        <div className="space-y-6">
          {/* Header contextual breadcrumb */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-purple-600 font-mono tracking-wider font-extrabold">Exam Hub Manager Control Options</span>
              <h3 className="text-base font-extrabold text-gray-900">
                Manage {selectedManager.name}
              </h3>
              <p className="text-xs text-gray-400">
                Centre: <strong>{selectedCentre} Centre</strong> • Phone: {selectedManager.phone}
              </p>
            </div>

            <button
              onClick={() => setStep('manager')}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
            >
              Back to Managers
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
            {/* Option 1: Registration list of students */}
            <div
              onClick={() => setStep('student_exam')}
              className="group p-6 bg-white border border-gray-150 rounded-2xl hover:border-purple-400 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl w-fit group-hover:bg-purple-100 transition-colors">
                  <Users size={32} className="text-purple-600 fill-purple-100" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-gray-900 group-hover:text-purple-700 transition-colors">
                    1. Student Registration List
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    View list of student examination enrollments, add new schedules, modify date sheets, and manage paper fee receivables.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-purple-600">
                <span>View Students</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Option 2: Payment to Exam manager records */}
            <div
              onClick={() => setStep('payment_records')}
              className="group p-6 bg-white border border-gray-150 rounded-2xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-750 rounded-2xl w-fit group-hover:bg-blue-100 transition-colors">
                  <Receipt size={32} className="text-blue-600 fill-blue-100" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-gray-900 group-hover:text-blue-700 transition-colors">
                    2. Payment to Exam Manager Records
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Review per-course paper rates, audit quantities, calculate total payable amounts, record payouts, and balance ledgers.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>View Payment Ledger</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: COURSE CHOSEN -> REGISTRATIONS LIST & FORM */}
      {step === 'student_exam' && selectedManager && (
        <div className="space-y-6">
          
          {/* Header contextual breadcrumb */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-purple-600 font-mono tracking-wider font-extrabold">Exam Hub Manager Console</span>
              <h3 className="text-base font-extrabold text-gray-900">
                Student Examination & Date Sheets
              </h3>
              <p className="text-xs text-gray-400">
                Assigned Manager: <strong>{selectedManager.name}</strong> • Centre: <strong>{selectedCentre} Centre</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('manager_options')}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
              >
                Back to Manager Options
              </button>
              <button
                onClick={handleAddExamClick}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} className="text-white font-bold" />
                <span>Schedule Student</span>
              </button>
            </div>
          </div>

          {/* 📢 AUTOMATIC NOTIFICATION REMINDERS SECTION */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-3xs">
            <div className="flex items-center justify-between border-b border-amber-200/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="text-amber-500 fill-amber-100 animate-swing" size={18} />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  AIOU Dynamic Exam Notification Reminders
                </h4>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md font-mono">
                {activeReminders.length} Active Reminders
              </span>
            </div>

            {activeReminders.length === 0 ? (
              <p className="text-xs text-amber-700 italic">
                No examinations scheduled within the next 15 days. System will automatically populate alerts when exams are registered.
              </p>
            ) : (
              <div className="grid gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                {activeReminders.map((rem, index) => {
                  const isUrgent = rem.daysLeft <= 7;
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isUrgent 
                          ? 'bg-red-50 border-red-150 text-red-950' 
                          : 'bg-amber-50 border-amber-150 text-amber-950'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase ${
                            isUrgent ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                          }`}>
                            Course {rem.courseCode}
                          </span>
                          <span>Student: {rem.studentName}</span>
                        </div>
                        <div className="text-[10px] opacity-75">
                          Exam Date: <strong>{rem.date}</strong> ({rem.daysLeft === 0 ? 'TODAY' : `${rem.daysLeft} days remaining`}) • Contact: {rem.contactNumber}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBroadcastAlert(rem)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white transition-colors cursor-pointer self-start sm:self-center ${
                          isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-700 hover:bg-amber-800'
                        }`}
                      >
                        Notify Manager
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          {/* Exam Registration Form Modal */}
          {isExamFormOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-purple-100 shadow-md space-y-6"
            >
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-purple-600">
                    {editingExamInfo ? 'Edit Student Examination Record' : 'Schedule Student for Examination'}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Enter student name, father name, registration, choose paper dates and manage paper fee accounts.
                  </p>
                </div>
                
                {/* PREFILL OPTION */}
                {!editingExamInfo && studentRecords.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Prefill Student:</span>
                    <select
                      onChange={handlePrefillSelect}
                      defaultValue=""
                      className="text-xs px-2.5 py-1 border border-emerald-200 rounded-lg bg-emerald-50/40 text-emerald-800 font-bold focus:outline-hidden"
                    >
                      <option value="">-- Choose Enrolled Student --</option>
                      {studentRecords.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.studentName} ({student.registrationId || 'No Reg'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveStudentExam} className="space-y-6">
                
                {/* Section 1: Student Identifiers */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Student Identifiers
                  </h5>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Student Name</label>
                      <input
                        type="text"
                        required
                        value={examStudentName}
                        onChange={(e) => setExamStudentName(e.target.value)}
                        placeholder="e.g. Ali Raza"
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Father's Name</label>
                      <input
                        type="text"
                        required
                        value={examFatherName}
                        onChange={(e) => setExamFatherName(e.target.value)}
                        placeholder="e.g. Muhammad Raza"
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Student ID / Registration ID</label>
                      <input
                        type="text"
                        required
                        value={examStudentId}
                        onChange={(e) => setExamStudentId(e.target.value)}
                        placeholder="e.g. 23FPA09511"
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Contact Number</label>
                      <input
                        type="text"
                        required
                        value={examContactNumber}
                        onChange={(e) => setExamContactNumber(e.target.value)}
                        placeholder="e.g. +92 300 9876543"
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Examination & Course Schedules */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        Academic Semesters for Examination
                      </h5>

                      <div className="flex flex-wrap items-center gap-2 p-2 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-[10px] font-black uppercase text-purple-800 px-1">New Term:</span>
                        <select
                          value={newSemSeason}
                          onChange={(e) => setNewSemSeason(e.target.value as 'Autumn' | 'Spring')}
                          className="text-xs px-2 py-1 bg-white border border-purple-200 rounded-lg text-purple-900 font-bold focus:outline-hidden"
                        >
                          <option value="Autumn">Autumn</option>
                          <option value="Spring">Spring</option>
                        </select>
                        <select
                          value={newSemYear}
                          onChange={(e) => setNewSemYear(e.target.value)}
                          className="text-xs px-2 py-1 bg-white border border-purple-200 rounded-lg text-purple-900 font-bold font-mono focus:outline-hidden"
                        >
                          {['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleCreateSemesterTab}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold rounded-lg cursor-pointer shadow-3xs flex items-center gap-1"
                        >
                          <Plus size={12} className="text-white font-bold" />
                          <span>Add Semester Tab</span>
                        </button>
                      </div>
                    </div>

                    {/* Semesters list as tabs */}
                    {formSemesters.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-purple-200 rounded-xl text-xs text-purple-700 italic bg-purple-50/20">
                        No semesters added. Please use the "Add Semester Tab" action above to create one.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
                        {formSemesters.map((sem) => {
                          const isActive = sem.id === activeFormSemId;
                          return (
                            <button
                              key={sem.id}
                              type="button"
                              onClick={() => selectSemester(sem.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isActive
                                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                  : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sem.semesterTerm}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Active semester metadata & settings */}
                    {activeFormSemId && (
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                        <div className="text-xs">
                          <span className="text-gray-400 font-bold uppercase text-[9px]">Currently Configuring:</span>{' '}
                          <span className="font-extrabold text-purple-900 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-mono">
                            {formSemesters.find(s => s.id === activeFormSemId)?.semesterTerm}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Change Active Term name:</span>
                          <select
                            value={semesterSeason}
                            onChange={(e) => handleSemesterSeasonChange(e.target.value as 'Autumn' | 'Spring')}
                            className="text-xs px-2 py-1 border border-purple-200 rounded-lg bg-white text-purple-900 font-bold focus:outline-hidden"
                          >
                            <option value="Autumn">Autumn</option>
                            <option value="Spring">Spring</option>
                          </select>
                          <select
                            value={semesterYear}
                            onChange={(e) => handleSemesterYearChange(e.target.value)}
                            className="text-xs px-2 py-1 border border-purple-200 rounded-lg bg-white text-purple-900 font-bold font-mono focus:outline-hidden"
                          >
                            {['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(yr => (
                              <option key={yr} value={yr}>{yr}</option>
                            ))}
                          </select>
                          {formSemesters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = formSemesters.filter(s => s.id !== activeFormSemId);
                                setFormSemesters(remaining);
                                selectSemester(remaining[0].id);
                                triggerToast('Semester tab deleted.');
                              }}
                              className="text-xs text-red-600 hover:text-red-850 font-bold ml-2 underline"
                            >
                              Delete Tab
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 2b: Semester-wise Course Selection (From Directory) */}
                  {selectedPrefillStudent && (
                    <div className="bg-purple-50/40 border border-purple-150 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/50 pb-3">
                        <div>
                          <h6 className="text-xs font-extrabold text-purple-950 uppercase tracking-wide">
                            Semester-wise Course Selection (From Previously Enrolled Directory)
                          </h6>
                          <p className="text-[10px] text-gray-550">
                            Click any semester below to automatically load its enrolled courses. Only valid, previously enrolled courses will be available.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-purple-800 bg-purple-100/65 px-2.5 py-1 rounded-md uppercase font-mono">
                            Linked: {selectedPrefillStudent.studentName}
                          </span>
                        </div>
                      </div>

                      {/* Semester Selectors */}
                      <div className="flex flex-wrap gap-2">
                        {(selectedPrefillStudent.semesters || []).map((sem) => {
                          const isCurrentSelected = selectedEnrollmentSemester === sem.semesterNumber;
                          return (
                            <button
                              key={sem.semesterNumber}
                              type="button"
                              onClick={() => handleEnrollmentSemesterChange(sem.semesterNumber)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                isCurrentSelected
                                  ? isGreen
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs'
                                    : 'bg-sky-600 border-sky-600 text-white shadow-3xs'
                                  : 'bg-white border-gray-200 text-gray-755 hover:bg-gray-50'
                              }`}
                            >
                              <span>Semester {sem.semesterNumber}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                isCurrentSelected 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {sem.courses?.length || 0} Courses
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selectable courses inside selected semester */}
                      {selectedEnrollmentSemester && (
                        <div className="space-y-2.5 pt-1.5">
                          <span className="block text-[10px] text-gray-550 font-extrabold uppercase tracking-wide">
                            Select / Deselect Course Codes for this Examination:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                            {(() => {
                              const semData = selectedPrefillStudent.semesters?.find(s => s.semesterNumber === selectedEnrollmentSemester);
                              const courses = semData?.courses || [];
                              if (courses.length === 0) {
                                return (
                                  <p className="text-xs text-gray-450 italic col-span-full">
                                    No course codes found in Semester {selectedEnrollmentSemester} of previous records.
                                  </p>
                                );
                              }
                              return courses.map(course => {
                                const isChecked = examCourseCodes.includes(course.code);
                                return (
                                  <button
                                    key={course.code}
                                    type="button"
                                    onClick={() => {
                                      if (isChecked) {
                                        handleRemoveCourseCodeFromExam(course.code);
                                      } else {
                                        const updatedCodes = [...examCourseCodes, course.code];
                                        setExamCourseCodes(updatedCodes);
                                        const newDates = [...examDatesList];
                                        if (!newDates.some(d => d.courseCode === course.code)) {
                                          newDates.push({
                                            courseCode: course.code,
                                            examDate: '',
                                            status: 'Pending',
                                            reappearDate: '',
                                            remarks: ''
                                          });
                                        }
                                        setExamDatesList(newDates);
                                        if (activeFormSemId) {
                                          setFormSemesters(prev => prev.map(sem => {
                                            if (sem.id === activeFormSemId) {
                                              return {
                                                ...sem,
                                                courseCodes: updatedCodes,
                                                examDates: newDates
                                              };
                                            }
                                            return sem;
                                          }));
                                        }
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left ${
                                      isChecked
                                        ? isGreen
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                          : 'bg-sky-50 border-sky-300 text-sky-950'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="font-mono">{course.code}</span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by button onClick
                                      className={`rounded pointer-events-none w-3.5 h-3.5 ${
                                        isGreen ? 'text-emerald-600 focus:ring-emerald-500' : 'text-sky-600 focus:ring-sky-500'
                                      }`}
                                    />
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Course Code adder list */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                      <span className="block text-[10px] font-extrabold uppercase text-gray-500">
                        Course Papers Registered
                      </span>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCourseCodeInput}
                          onChange={(e) => setNewCourseCodeInput(e.target.value)}
                          placeholder="e.g. 8603"
                          className="text-xs px-3 py-1.5 border rounded-lg flex-1 bg-white focus:outline-hidden uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleAddCourseCodeToExam}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black cursor-pointer"
                        >
                          Add Code
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {examCourseCodes.map(code => (
                          <span 
                            key={code}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-1 rounded-md"
                          >
                            <span>Course {code}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCourseCodeFromExam(code)}
                              className="text-red-500 hover:text-red-700 cursor-pointer font-black ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Paper Exam Dates Scheduler */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                      <span className="block text-[10px] font-extrabold uppercase text-gray-500">
                        Set Exam Date & Results for each Course Code
                      </span>

                      {examCourseCodes.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Add course codes first to schedule exam dates.</p>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {examCourseCodes.map(code => {
                            const foundItem = examDatesList.find(d => d.courseCode === code);
                            const examDateVal = foundItem?.examDate || '';
                            const statusVal = foundItem?.status || 'Pending';
                            const reappearDateVal = foundItem?.reappearDate || '';
                            const remarksVal = foundItem?.remarks || '';
                            return (
                              <div key={code} className="p-3 bg-white border border-gray-150 rounded-xl space-y-2.5 shadow-3xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-gray-800 font-mono text-xs">Course {code}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCourseCodeFromExam(code)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                  >
                                    Remove
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Exam Date</label>
                                    <input
                                      type="date"
                                      required
                                      value={examDateVal}
                                      onChange={(e) => handleUpdateCourseExamField(code, 'examDate', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-hidden font-mono"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Paper Status</label>
                                    <select
                                      value={statusVal}
                                      onChange={(e) => handleUpdateCourseExamField(code, 'status', e.target.value as any)}
                                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-hidden font-bold text-gray-800"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Passed">Passed</option>
                                      <option value="Failed">Failed</option>
                                    </select>
                                  </div>
                                </div>

                                {statusVal === 'Failed' && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-1"
                                  >
                                    <label className="block text-[9px] font-bold text-red-500 uppercase">Reappear Date</label>
                                    <input
                                      type="date"
                                      required
                                      value={reappearDateVal}
                                      onChange={(e) => handleUpdateCourseExamField(code, 'reappearDate', e.target.value)}
                                      className="w-full px-2 py-1 border border-red-200 rounded-lg text-xs bg-red-50/20 focus:outline-hidden text-red-700 font-mono"
                                    />
                                  </motion.div>
                                )}

                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Paper Remarks</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1st Attempt, Reappear, etc."
                                    value={remarksVal}
                                    onChange={(e) => handleUpdateCourseExamField(code, 'remarks', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-hidden"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment Section */}
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Paper Payment Section
                  </h5>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Financial balance displays */}
                    <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Total Paper Fee Receivable (Rs.)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2500"
                          value={totalFee}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                            setTotalFee(val);
                            if (activeFormSemId) {
                              updateSemester(activeFormSemId, {
                                totalFee: val === '' ? undefined : val
                              });
                            }
                          }}
                          className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-hidden font-bold font-mono"
                        />
                      </div>

                      <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Amount Received:</span>
                        <span className="font-bold text-emerald-700 font-mono">Rs. {amountReceived.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Remaining Balance:</span>
                        <span className="font-black text-amber-700 font-mono">Rs. {((totalFee === '' ? 0 : totalFee) - amountReceived).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Add dynamic transaction widget */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                      <span className="block text-[10px] font-extrabold uppercase text-gray-500">
                        Record New Payment Dues
                      </span>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Amount (Rs.)"
                            value={newPayAmount}
                            onChange={(e) => setNewPayAmount(e.target.value)}
                            className="text-xs px-2 py-1.5 border rounded-lg bg-white focus:outline-hidden font-mono"
                          />
                          <input
                            type="date"
                            value={newPayDate}
                            onChange={(e) => setNewPayDate(e.target.value)}
                            className="text-xs px-2 py-1.5 border rounded-lg bg-white focus:outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPaymentToHistory}
                          className="w-full py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 cursor-pointer"
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>

                    {/* Payment history list */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <span className="block text-[10px] font-extrabold uppercase text-gray-500">
                        Payment History Logs
                      </span>

                      {paymentHistory.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No payments recorded yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 text-xs">
                          {paymentHistory.map(pay => (
                            <div key={pay.id} className="flex justify-between items-center gap-2 p-1.5 bg-white rounded border border-gray-150">
                              <span className="text-[10px] text-gray-400 font-mono font-bold">{pay.date}</span>
                              <span className="font-black text-emerald-800 font-mono">Rs. {pay.amount.toLocaleString()}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePaymentTransaction(pay.id, pay.amount)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExamFormOpen(false);
                      setEditingExamInfo(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Schedule Examination Record
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* List of Student Exam registrations */}
          (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wide">
                Registrations List
              </h4>

            {filteredExamRecords.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-xs italic text-gray-400">
                No students scheduled under Centre {selectedCentre} yet. Click "Schedule Student" to register exams.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden divide-y divide-gray-150 shadow-3xs">
                {filteredExamRecords.map((info) => {
                  const isExpanded = expandedStudentId === info.id;
                  const semestersList = info.semesters || [];
                  const activeSem = semestersList[0] || {
                    id: 'sem-legacy',
                    semesterTerm: info.semesterTerm || 'Autumn 2026',
                    courseCodes: info.courseCodes || (info.courseCode ? [info.courseCode] : []),
                    examDates: info.examDates || [],
                    totalFee: info.totalFee || 0,
                    amountReceived: info.amountReceived || 0,
                    paymentHistory: info.paymentHistory || []
                  };
                  
                  // Compute total combined outstanding balance
                  const totalFeeSum = semestersList.length > 0 
                    ? semestersList.reduce((acc, s) => acc + (s.totalFee || 0), 0)
                    : (info.totalFee || 0);
                  const totalReceivedSum = semestersList.length > 0
                    ? semestersList.reduce((acc, s) => acc + (s.amountReceived || 0), 0)
                    : (info.amountReceived || 0);
                  const remainingBalanceCombined = totalFeeSum - totalReceivedSum;

                  return (
                    <div 
                      key={info.id}
                      className="border-b border-gray-150 last:border-b-0 hover:bg-gray-50/20 transition-all"
                    >
                      {/* Accordion Trigger Header */}
                      <div 
                        onClick={() => handleToggleExpandStudent(info.id)}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-400 hover:text-purple-600 transition-colors mr-1">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <span className="font-extrabold text-sm text-gray-900">{info.studentName}</span>
                            <span className="text-[10px] text-gray-400 font-bold">s/o {info.fatherName}</span>
                            <span className="text-[10px] font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                              ID: {info.studentId}
                            </span>
                            
                            {/* Semesters Badges */}
                            <div className="flex flex-wrap gap-1">
                              {semestersList.map(s => (
                                <span key={s.id} className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                  {s.semesterTerm}
                                </span>
                              ))}
                              {semestersList.length === 0 && (
                                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                  {info.semesterTerm}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone size={12} className="text-blue-500" />
                              <span>{info.contactNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                              <BookOpen size={12} className="text-purple-500 font-bold" />
                              <span>Registered Semesters: <span className="text-purple-700 font-extrabold">{Math.max(1, semestersList.length)}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Financial status and Actions */}
                        <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                          <div className="text-left md:text-right text-xs">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Combined Fee Balance</span>
                            <span className={`font-mono font-extrabold ${remainingBalanceCombined <= 0 && totalFeeSum > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {totalFeeSum === 0 && semestersList.every(s => s.totalFee === undefined)
                                ? 'Fee Not Set'
                                : remainingBalanceCombined <= 0 
                                  ? `Fully Paid (Rs. ${totalReceivedSum.toLocaleString()})` 
                                  : `Rs. ${remainingBalanceCombined.toLocaleString()} Outstanding`
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditExamClick(info)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
                              title="Edit Record / Manage Semesters"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteExamClick(info.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section showing all detailed semesters data */}
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-purple-50/20 px-5 pb-5 pt-1 border-t border-purple-100/30"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-purple-100/50 pb-2">
                              <h5 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                                All Examination & Academic Semesters Logs
                              </h5>
                              <button
                                onClick={() => handleEditExamClick(info)}
                                className="text-[10px] font-black uppercase text-purple-700 hover:text-purple-900 bg-purple-50 border border-purple-200 px-2 py-1 rounded-md transition-all flex items-center gap-1 shadow-3xs cursor-pointer"
                              >
                                <Plus size={10} />
                                <span>Add / Manage Semesters</span>
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              {/* If no semesters explicitly listed, fallback to single legacy list */}
                              {(semestersList.length > 0 ? semestersList : [activeSem]).map((sem, sIdx) => {
                                const outstanding = (sem.totalFee || 0) - (sem.amountReceived || 0);
                                return (
                                  <div key={sem.id || sIdx} className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                      <span className="font-extrabold text-xs text-purple-950 font-mono">
                                        Semester: {sem.semesterTerm}
                                      </span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono border ${
                                        outstanding <= 0 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                          : 'bg-amber-50 text-amber-700 border-amber-100'
                                      }`}>
                                        {outstanding <= 0 ? 'PAID' : `DUE: Rs. ${outstanding.toLocaleString()}`}
                                      </span>
                                    </div>

                                    {/* Exam papers list */}
                                    <div className="space-y-2">
                                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                        Papers & Exam Dates
                                      </span>
                                      
                                      {(sem.courseCodes && sem.courseCodes.length > 0 ? sem.courseCodes : []).length === 0 ? (
                                        <p className="text-[10px] text-gray-400 italic">No courses registered for this semester.</p>
                                      ) : (
                                        <div className="grid gap-2">
                                          {sem.courseCodes?.map(code => {
                                            const matchDate = sem.examDates?.find(d => d.courseCode === code);
                                            const status = matchDate?.status || 'Pending';
                                            const dateVal = matchDate?.examDate || 'Not Set';
                                            const reappear = matchDate?.reappearDate;
                                            const rmk = matchDate?.remarks;

                                            let statStyle = 'bg-gray-50 text-gray-700 border-gray-150';
                                            if (status === 'Passed') statStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                            if (status === 'Failed') statStyle = 'bg-red-50 text-red-700 border-red-100';

                                            return (
                                              <div key={code} className={`p-2 rounded-lg border text-[10px] ${statStyle} flex flex-col gap-0.5`}>
                                                <div className="flex items-center justify-between font-bold">
                                                  <span>Course {code}</span>
                                                  <span className="text-[8px] font-black uppercase font-mono bg-white/70 px-1 py-0.2 rounded shadow-4xs border border-current/10">
                                                    {status}
                                                  </span>
                                                </div>
                                                <div className="text-[9px] opacity-90 font-medium">
                                                  <div>Date: <span className="font-mono font-bold">{dateVal}</span></div>
                                                  {status === 'Failed' && reappear && (
                                                    <div className="text-red-600 font-bold">Reappear: <span className="font-mono">{reappear}</span></div>
                                                  )}
                                                  {rmk && <div className="italic text-gray-500">Remarks: {rmk}</div>}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Financial Breakdown & Logs */}
                                    <div className="pt-2 border-t border-dashed border-gray-100 space-y-2">
                                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                                        <span>Fee: <span className="font-mono text-gray-800">Rs. {sem.totalFee?.toLocaleString()}</span></span>
                                        <span>Paid: <span className="font-mono text-emerald-800">Rs. {sem.amountReceived?.toLocaleString()}</span></span>
                                      </div>

                                      {/* Nested transaction logs specific to this semester */}
                                      {sem.paymentHistory && sem.paymentHistory.length > 0 && (
                                        <div className="space-y-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100 max-h-[100px] overflow-y-auto">
                                          <span className="block text-[8px] font-bold text-gray-400 uppercase">Payment Logs</span>
                                          {sem.paymentHistory.map(pay => (
                                            <div key={pay.id} className="flex justify-between items-center text-[9px] text-gray-600 font-mono py-0.5 border-b border-gray-100/50 last:border-0">
                                              <span>{pay.date}</span>
                                              <span className="font-extrabold text-emerald-800">Rs. {pay.amount.toLocaleString()}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )
        </div>
      )}
              {/* STEP 5: EXAM MANAGER PAYMENT RECORDS */}
      {step === 'payment_records' && selectedManager && (
        <div className="space-y-6">
          
          {/* Payment Records Section Header */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wide ${isGreen ? 'text-emerald-600' : 'text-sky-600'}`}>
                Course Payment Records
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Define semester paper rates, courses, and compute due allowances for <strong>{selectedManager.name}</strong>.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('manager_options')}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
              >
                Back to Options
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPaymentRecord(null);
                  setPaymentSemester('Autumn');
                  setPaymentYear('2026');
                  setPaymentCourses([]);
                  setFormCourseName('BA');
                  setFormCustomCourseName('');
                  setFormPerPaperRate('');
                  setFormTotalPapers('');
                  setFormEditingCourseId(null);
                  setIsPaymentFormOpen(true);
                }}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
              >
                <Plus size={14} className="text-white font-bold" />
                <span>Add Payment Record</span>
              </button>
            </div>
          </div>

          {/* Payment Record Modal/Form Card */}
          {isPaymentFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6"
            >
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <h5 className={`text-xs font-black uppercase ${isGreen ? 'text-emerald-600' : 'text-sky-600'}`}>
                  {editingPaymentRecord ? 'Modify Payment Record' : 'Create Payment Record'}
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentFormOpen(false);
                    setEditingPaymentRecord(null);
                  }}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Semester *
                  </label>
                  <select
                    required
                    value={paymentSemester}
                    onChange={(e) => setPaymentSemester(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white text-gray-800 font-medium"
                  >
                    <option value="Autumn">Autumn</option>
                    <option value="Spring">Spring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Year *
                  </label>
                  <select
                    required
                    value={paymentYear}
                    onChange={(e) => setPaymentYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white text-gray-800 font-medium"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    S. No. (Auto-generated)
                  </label>
                  <div className="px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-xs font-bold font-mono text-gray-600">
                    S. No. {editingPaymentRecord ? editingPaymentRecord.serialNo : generateSerialNoForManager(selectedManager.id)}
                  </div>
                </div>
              </div>

              {/* Course-wise list addition row */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white">
                <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Course-wise Payment Details
                </h6>

                <div className="grid sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                      Course/Program Name *
                    </label>
                    <select
                      value={formCourseName}
                      onChange={(e) => setFormCourseName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 bg-white text-gray-800 font-medium"
                    >
                      <option value="BA">BA</option>
                      <option value="B.Com">B.Com</option>
                      <option value="B.Ed">B.Ed</option>
                      <option value="Other Programs">Other Programs</option>
                    </select>
                  </div>

                  {formCourseName === 'Other Programs' && (
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                        Enter Program Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BS Computer Science"
                        value={formCustomCourseName}
                        onChange={(e) => setFormCustomCourseName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-medium text-gray-800"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                      Per Paper Rate (Rs.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150"
                      value={formPerPaperRate}
                      onChange={(e) => setFormPerPaperRate(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                      Total Papers *
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25"
                      value={formTotalPapers}
                      onChange={(e) => setFormTotalPapers(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCourseRow}
                      className={`flex-1 px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer transition-colors ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
                    >
                      {formEditingCourseId ? 'Update Course' : 'Add Course'}
                    </button>
                  </div>
                </div>

                {/* Internal table of courses */}
                <div className="border border-gray-150 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-150">
                        <th className="p-3">Course Name</th>
                        <th className="p-3">Per Paper Rate</th>
                        <th className="p-3">Total Papers</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentCourses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                            No courses added. Please complete the fields above and click "Add Course".
                          </td>
                        </tr>
                      ) : (
                        paymentCourses.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">{c.courseName}</td>
                            <td className="p-3 font-mono">Rs. {c.perPaperRate.toLocaleString()}</td>
                            <td className="p-3 font-mono">{c.totalPapers}</td>
                            <td className="p-3 font-mono font-bold text-emerald-700">Rs. {c.totalAmount.toLocaleString()}</td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditCourseRow(c)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourseRow(c.id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {paymentCourses.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50/80 font-bold border-t border-gray-150 text-gray-800">
                          <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-[10px] font-black text-gray-400">
                            Grand Total of All Course Amounts
                          </td>
                          <td colSpan={2} className={`p-3 font-mono font-black text-sm ${isGreen ? 'text-emerald-700' : 'text-sky-700'}`}>
                            Rs. {paymentCourses.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentFormOpen(false);
                    setEditingPaymentRecord(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentRecord}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg cursor-pointer shadow-xs ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
                >
                  Save Payment Record
                </button>
              </div>
            </motion.div>
          )}

          {/* Search bar and Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center justify-between">
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="Search by Semester, Year, Course Name..."
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-1 bg-white"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              Showing {
                paymentRecords
                  .filter(r => r.managerId === selectedManager.id)
                  .filter(r => {
                    if (!paymentSearchQuery) return true;
                    const q = paymentSearchQuery.toLowerCase();
                    const semMatch = r.semester.toLowerCase().includes(q);
                    const yearMatch = r.year.toLowerCase().includes(q);
                    const courseMatch = r.courses?.some(c => c.courseName.toLowerCase().includes(q));
                    return semMatch || yearMatch || courseMatch;
                  }).length
              } record(s)
            </div>
          </div>

          {/* Payment Records List */}
          {paymentRecords.filter(r => r.managerId === selectedManager.id).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 text-xs italic text-gray-400">
              No payment records configured for this manager yet. Click "Add Payment Record" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {paymentRecords
                .filter(r => r.managerId === selectedManager.id)
                .filter(r => {
                  if (!paymentSearchQuery) return true;
                  const q = paymentSearchQuery.toLowerCase();
                  const semMatch = r.semester.toLowerCase().includes(q);
                  const yearMatch = r.year.toLowerCase().includes(q);
                  const courseMatch = r.courses?.some(c => c.courseName.toLowerCase().includes(q));
                  return semMatch || yearMatch || courseMatch;
                })
                .map((rec) => {
                  const isExpanded = expandedPaymentRecordId === rec.id;
                  return (
                    <div key={rec.id} className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-3xs divide-y divide-gray-150">
                      {/* High level info card */}
                      <div 
                        onClick={() => setExpandedPaymentRecordId(isExpanded ? null : rec.id)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl font-mono text-xs font-black uppercase ${isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                            S. No. {rec.serialNo}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-gray-900 uppercase">
                              {rec.semester} {rec.year}
                            </h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {rec.courses?.length || 0} program(s) configured
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-center md:text-right md:mr-6">
                          <div>
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Payable</span>
                            <span className="text-xs font-mono font-black text-gray-800">Rs. {rec.grandTotal.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Paid Amount</span>
                            <span className="text-xs font-mono font-black text-emerald-700">Rs. {rec.totalPaidAmount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Remaining Due</span>
                            <span className={`text-xs font-mono font-black ${rec.remainingAmountPayable > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                              Rs. {rec.remainingAmountPayable.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPaymentRecord(rec);
                              setPaymentSemester(rec.semester);
                              setPaymentYear(rec.year);
                              setPaymentCourses(rec.courses || []);
                              setFormCourseName('BA');
                              setFormCustomCourseName('');
                              setFormPerPaperRate('');
                              setFormTotalPapers('');
                              setFormEditingCourseId(null);
                              setIsPaymentFormOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePaymentRecordClick(rec.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="p-1.5 text-gray-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details section */}
                      {isExpanded && (
                        <div className="bg-gray-50/30 p-5 space-y-6">
                          
                          {/* Course-wise details table */}
                          <div className="space-y-2">
                            <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                              Course-wise Payment Details
                            </h6>
                            <div className="bg-white rounded-xl border border-gray-150 overflow-hidden">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-150">
                                    <th className="p-3">Course Name</th>
                                    <th className="p-3">Per Paper Rate</th>
                                    <th className="p-3">Total Papers</th>
                                    <th className="p-3">Total Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {rec.courses?.map((c) => (
                                    <tr key={c.id}>
                                      <td className="p-3 font-bold text-gray-800">{c.courseName}</td>
                                      <td className="p-3 font-mono text-gray-600">Rs. {c.perPaperRate.toLocaleString()}</td>
                                      <td className="p-3 font-mono text-gray-600">{c.totalPapers}</td>
                                      <td className="p-3 font-mono font-bold text-gray-800">Rs. {c.totalAmount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-50/50 font-bold border-t border-gray-150 text-gray-800">
                                    <td colSpan={3} className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">
                                      Grand Total of Course Amounts
                                    </td>
                                    <td className="p-3 font-mono font-black text-sm text-gray-950">
                                      Rs. {rec.grandTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Payment Summary */}
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col justify-between shadow-4xs">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Payable Amount</span>
                              <span className="text-base font-black text-gray-900 font-mono mt-1">
                                Rs. {rec.grandTotal.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-1 italic">Allowance for all courses</span>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col justify-between shadow-4xs">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Paid Amount</span>
                              <span className="text-base font-black text-emerald-700 font-mono mt-1">
                                Rs. {rec.totalPaidAmount.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-1 italic">Sum of recorded payments</span>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col justify-between shadow-4xs">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Remaining Amount Payable</span>
                              <span className={`text-base font-black font-mono mt-1 ${rec.remainingAmountPayable > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                                Rs. {rec.remainingAmountPayable.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-1 italic">Total Payable − Total Paid</span>
                            </div>
                          </div>

                          {/* Additional Payments Section */}
                          <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                  Additional Payment Entries
                                </h6>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Record cash or bank payments made to the exam manager.
                                </p>
                              </div>
                            </div>

                            {/* List of payments */}
                            <div className="bg-white rounded-xl border border-gray-150 overflow-hidden">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-150">
                                    <th className="p-3">Payment Date</th>
                                    <th className="p-3">Payment Amount</th>
                                    <th className="p-3">Remarks</th>
                                    <th className="p-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {!rec.payments || rec.payments.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="p-4 text-center text-gray-400 italic">
                                        No payments recorded yet for this semester.
                                      </td>
                                    </tr>
                                  ) : (
                                    rec.payments.map((p) => (
                                      <tr key={p.id}>
                                        <td className="p-3 font-mono font-medium text-gray-700">{p.date}</td>
                                        <td className="p-3 font-mono font-black text-emerald-700">Rs. {p.amount.toLocaleString()}</td>
                                        <td className="p-3 text-gray-500 italic font-medium">{p.remarks || '—'}</td>
                                        <td className="p-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() => handleDeletePaymentEntry(rec, p.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                                            title="Delete Payment Entry"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Mini-form to add a payment */}
                            <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-3">
                              <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                                Add Payment Record Later
                              </span>
                              <div className="grid sm:grid-cols-3 gap-4 items-end">
                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                    Payment Date *
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={newEntryDate}
                                    onChange={(e) => setNewEntryDate(e.target.value)}
                                    className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden text-gray-700"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                    Payment Amount (Rs.) *
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="e.g. 10000"
                                    value={newEntryAmount}
                                    onChange={(e) => setNewEntryAmount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden font-bold font-mono text-gray-800"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                    Remarks / Notes (Optional)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="e.g. Paid via cheque"
                                      value={newEntryRemarks}
                                      onChange={(e) => setNewEntryRemarks(e.target.value)}
                                      className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden text-gray-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddPaymentEntry(rec)}
                                      className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer transition-colors ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
                                    >
                                      Add Payment
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <SecurityAuthModal
        isOpen={deleteModalOpen}
        message={deleteMessage}
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setIdToDelete(null);
          setDeleteType(null);
        }}
        theme={theme}
      />

    </div>
  );
}
