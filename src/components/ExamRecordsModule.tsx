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
  ChevronUp
} from 'lucide-react';
import { 
  StudentRecord, 
  ExamManager, 
  StudentExamInfo, 
  CourseExamDate, 
  ExamPaymentHistory,
  StudentExamSemester
} from '../types';
import SecurityAuthModal from './SecurityAuthModal';
import { 
  saveExamManager, 
  fetchAndSyncExamManagers, 
  deleteExamManager, 
  saveStudentExamInfo, 
  fetchAndSyncStudentExamInfos, 
  deleteStudentExamInfo 
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
  const [step, setStep] = useState<'centre' | 'manager' | 'courses' | 'student_exam'>('centre');
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

  // Payment Form fields
  const [totalFee, setTotalFee] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<ExamPaymentHistory[]>([]);
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Toast simulations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Auth Modal for Deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'manager' | 'exam_info' | null>(null);
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
      setTotalFee(activeSem.totalFee || 0);
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
          totalFee: rec.totalFee || 0,
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
      totalFee: 2500,
      amountReceived: 0,
      paymentHistory: []
    };
    const updatedSems = [...formSemesters, newSem];
    setFormSemesters(updatedSems);
    setActiveFormSemId(newSem.id);

    // Sync input fields
    setExamCourseCodes([]);
    setExamDatesList([]);
    setTotalFee(2500);
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

  // Load managers and exam records on mount and sync
  const loadExamData = async () => {
    setLoading(true);
    try {
      const syncedManagers = await fetchAndSyncExamManagers();
      const syncedExamRecords = await fetchAndSyncStudentExamInfos();
      setManagers(syncedManagers);
      setNormalizedExamRecords(syncedExamRecords);
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

  // Add standard fallback courses to offer complete educational listing if none exist yet
  const defaultFallbackCourses = ['8601', '8602', '8603', '8604', '8605', '8606', '8607', '8608', '8613', '5601', '5602'];
  const allAvailableCourses = enrolledCourses.length > 0 
    ? Array.from(new Set([...enrolledCourses, ...defaultFallbackCourses])).sort()
    : defaultFallbackCourses;

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
      totalFee: 2500,
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
    setTotalFee(2500); // Standard paper fee
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
    
    // Normalize semesters list
    let sems = info.semesters || [];
    if (sems.length === 0) {
      sems = [{
        id: `sem-legacy-${Math.random().toString(36).substr(2, 9)}`,
        semesterTerm: info.semesterTerm || 'Autumn 2026',
        courseCodes: info.courseCodes || (info.courseCode ? [info.courseCode] : []),
        examDates: info.examDates || [],
        totalFee: info.totalFee || 0,
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
    setTotalFee(firstSem.totalFee || 0);
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
    const updatedFee = totalFee + 500;

    setExamCourseCodes(updatedCodes);
    setExamDatesList(updatedDates);
    setTotalFee(updatedFee);
    setNewCourseCodeInput('');

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        courseCodes: updatedCodes,
        examDates: updatedDates,
        totalFee: updatedFee
      });
    }
  };

  // Remove course code from list in form
  const handleRemoveCourseCodeFromExam = (code: string) => {
    const updatedCodes = examCourseCodes.filter(c => c !== code);
    const updatedDates = examDatesList.filter(d => d.courseCode !== code);
    const updatedFee = Math.max(1000, totalFee - 500);

    setExamCourseCodes(updatedCodes);
    setExamDatesList(updatedDates);
    setTotalFee(updatedFee);

    if (activeFormSemId) {
      updateSemester(activeFormSemId, {
        courseCodes: updatedCodes,
        examDates: updatedDates,
        totalFee: updatedFee
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
    const remaining = totalFee - amountReceived;
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
    if (!studentId) return;
    const student = studentRecords.find(s => s.id === studentId);
    if (student) {
      setExamStudentName(student.studentName);
      setExamFatherName(student.fatherName);
      setExamStudentId(student.registrationId || student.id);
      setExamContactNumber(student.phoneNumber);
      
      // Auto pre-populate courses from their active semester if available
      const firstSem = student.semesters?.[0];
      const codes = firstSem?.courses?.map(c => c.code).filter(Boolean) || [];
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
        totalFee: 1000 + (codes.length * 500),
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
      setTotalFee(1000 + (codes.length * 500));
      setAmountReceived(0);
      setPaymentHistory([]);
      setNewPayAmount('');

      triggerToast(`Prefilled details for ${student.studentName}!`);
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

    // Keep active or first semester's values as top-level properties for legacy compatibility
    const activeSem = formSemesters.find(s => s.id === activeFormSemId) || formSemesters[0];

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
      semesters: formSemesters,

      // Legacy fallback support fields
      semesterTerm: activeSem.semesterTerm,
      courseCodes: activeSem.courseCodes,
      examDates: activeSem.examDates,
      totalFee: activeSem.totalFee,
      amountReceived: activeSem.amountReceived,
      remainingBalance: Math.max(0, activeSem.totalFee - activeSem.amountReceived),
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
              if (step === 'student_exam') setStep('manager');
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
                      setStep('student_exam');
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
                onClick={() => setStep('manager')}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
              >
                Back to Managers
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
                          required
                          value={totalFee}
                          onChange={(e) => setTotalFee(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-hidden font-bold font-mono"
                        />
                      </div>

                      <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Amount Received:</span>
                        <span className="font-bold text-emerald-700 font-mono">Rs. {amountReceived.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Remaining Balance:</span>
                        <span className="font-black text-amber-700 font-mono">Rs. {(totalFee - amountReceived).toLocaleString()}</span>
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
                            <span className={`font-mono font-extrabold ${remainingBalanceCombined <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {remainingBalanceCombined <= 0 
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
