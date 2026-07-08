import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  MessageSquare, 
  Calendar, 
  Bell, 
  ChevronRight, 
  ArrowLeft, 
  BookOpen, 
  User, 
  Phone, 
  ShieldAlert, 
  List, 
  FileText, 
  Send, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { StudentRecord, StudentQuizRecord, PROGRAM_OPTIONS } from '../types';
import SecurityAuthModal from './SecurityAuthModal';
import { 
  saveStudentQuizRecord, 
  fetchAndSyncStudentQuizRecords, 
  deleteStudentQuizRecord,
  saveStudentRecord
} from '../firebase';

interface QuizMgtModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  theme: 'green' | 'blue';
}

export default function QuizMgtModule({
  onBackToDashboard,
  studentRecords,
  theme
}: QuizMgtModuleProps) {
  const isGreen = theme === 'green';

  // State Management
  const [quizRecords, setQuizRecords] = useState<StudentQuizRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Overdue' | 'Upcoming'>('All');
  const [programFilter, setProgramFilter] = useState('');
  
  // Quiz Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentQuizRecord | null>(null);
  
  // Selected student from main directory
  const [selectedMainStudentId, setSelectedMainStudentId] = useState<string>('');
  
  // Form fields
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [studentId, setStudentId] = useState(''); // Registration ID
  const [contactNumber, setContactNumber] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [quizDate, setQuizDate] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Completed'>('Pending');
  const [remarks, setRemarks] = useState('');
  const [addToMainDirectory, setAddToMainDirectory] = useState(false);

  // Security Auth Modal for Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [deleteDetails, setDeleteDetails] = useState('');

  // UI Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and sync quiz records
  const loadQuizRecords = async () => {
    setLoading(true);
    try {
      const records = await fetchAndSyncStudentQuizRecords();
      setQuizRecords(records);
    } catch (error) {
      console.error('Error fetching quiz records:', error);
      triggerToast('Failed to load quiz schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizRecords();
  }, []);

  // Helper to trigger toast notifications
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-detect overdue status for pending quizzes based on current date
  const getComputedRecords = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return quizRecords.map(rec => {
      if (rec.status === 'Pending' && rec.quizDate < todayStr) {
        return { ...rec, status: 'Overdue' as const };
      }
      return rec;
    });
  };

  const computedRecords = getComputedRecords();

  // Selected student link handler
  useEffect(() => {
    if (selectedMainStudentId) {
      const student = studentRecords.find(s => s.id === selectedMainStudentId);
      if (student) {
        setStudentName(student.studentName);
        setFatherName(student.fatherName);
        setStudentId(student.registrationId);
        setContactNumber(student.phoneNumber);
        setAddToMainDirectory(false);
      }
    } else if (!editingRecord) {
      setStudentName('');
      setFatherName('');
      setStudentId('');
      setContactNumber('');
    }
  }, [selectedMainStudentId]);

  // Form submission handler
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentId || !courseCode || !quizDate) {
      triggerToast('Please fill in all mandatory fields.');
      return;
    }

    const recId = editingRecord ? editingRecord.id : `quiz-${Math.random().toString(36).substr(2, 9)}`;
    const newQuiz: StudentQuizRecord = {
      id: recId,
      studentName: studentName.trim(),
      fatherName: fatherName.trim(),
      studentId: studentId.trim().toUpperCase(),
      contactNumber: contactNumber.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      quizDate,
      status: editingRecord ? (status as any) : 'Pending',
      remarks: remarks.trim(),
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Save Quiz schedule
      await saveStudentQuizRecord(newQuiz);

      // 2. If checked, save as a new record in main student directory
      if (addToMainDirectory && !editingRecord) {
        const studentAlreadyExists = studentRecords.some(s => s.registrationId.toUpperCase() === studentId.trim().toUpperCase());
        if (!studentAlreadyExists) {
          const newStudent: StudentRecord = {
            id: `student-${Math.random().toString(36).substr(2, 9)}`,
            studentName: studentName.trim(),
            fatherName: fatherName.trim(),
            phoneNumber: contactNumber.trim(),
            registrationId: studentId.trim().toUpperCase(),
            lmsPasswordId: '',
            cmsPasswordId: '',
            admissionYear: new Date(quizDate).getFullYear().toString(),
            programSelected: 'B.Ed (1.5 Years)', // Default
            semesterType: 'Autumn',
            semesters: [
              {
                semesterNumber: 1,
                courses: [{ code: courseCode.trim().toUpperCase(), assignment: false, workshop: false, quiz: true, assignment1: false, assignment2: false }]
              }
            ],
            totalReceivable: 0,
            paymentsList: [],
            serviceEnrollment: false,
            serviceWorkshops: false,
            serviceQuiz: true,
            serviceAssignments: false,
            servicePhysicalWorkshop: false,
            serviceResearchReport: false,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await saveStudentRecord(newStudent);
          triggerToast('Quiz saved & student registered in primary directory.');
        } else {
          triggerToast('Quiz saved. Student already existed in directory.');
        }
      } else {
        triggerToast('Quiz schedule saved successfully.');
      }

      // Reset state and close form
      setShowForm(false);
      setEditingRecord(null);
      setSelectedMainStudentId('');
      setStudentName('');
      setFatherName('');
      setStudentId('');
      setContactNumber('');
      setCourseCode('');
      setQuizDate('');
      setStatus('Pending');
      setRemarks('');
      setAddToMainDirectory(false);
      
      // Reload records
      loadQuizRecords();
    } catch (err) {
      console.error(err);
      triggerToast('Error saving quiz record.');
    }
  };

  // Open Edit Form
  const handleEditClick = (rec: StudentQuizRecord) => {
    setEditingRecord(rec);
    setStudentName(rec.studentName);
    setFatherName(rec.fatherName);
    setStudentId(rec.studentId);
    setContactNumber(rec.contactNumber);
    setCourseCode(rec.courseCode);
    setQuizDate(rec.quizDate);
    setStatus(rec.status === 'Overdue' ? 'Pending' : rec.status as any);
    setRemarks(rec.remarks || '');
    setSelectedMainStudentId('');
    setAddToMainDirectory(false);
    setShowForm(true);
  };

  // Handle direct status toggle to Completed
  const handleToggleComplete = async (rec: StudentQuizRecord) => {
    try {
      const updated: StudentQuizRecord = {
        ...rec,
        status: 'Completed',
        updatedAt: new Date().toISOString()
      };
      await saveStudentQuizRecord(updated);
      triggerToast(`Quiz marked as Completed for ${rec.studentName}.`);
      loadQuizRecords();
    } catch (err) {
      console.error(err);
      triggerToast('Error updating status.');
    }
  };

  // Delete handler
  const handleDeleteClick = (id: string) => {
    const rec = quizRecords.find(r => r.id === id);
    const name = rec ? rec.studentName : 'Quiz Record';
    const course = rec ? rec.courseCode : '';
    setIdToDelete(id);
    setDeleteDetails(`Are you sure you want to delete the quiz schedule of ${name} for course ${course}? This action is irreversible.`);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!idToDelete) return;
    try {
      await deleteStudentQuizRecord(idToDelete);
      triggerToast('Quiz schedule deleted successfully.');
      loadQuizRecords();
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting quiz record.');
    } finally {
      setDeleteModalOpen(false);
      setIdToDelete(null);
    }
  };

  // Reminders / Alerts generator
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingThresholdDate = new Date();
  upcomingThresholdDate.setDate(upcomingThresholdDate.getDate() + 3);
  const upcomingThresholdStr = upcomingThresholdDate.toISOString().split('T')[0];

  const criticalAlarms = computedRecords.filter(rec => {
    if (rec.status === 'Completed') return false;
    return rec.quizDate <= todayStr || (rec.quizDate <= upcomingThresholdStr);
  }).sort((a, b) => a.quizDate.localeCompare(b.quizDate));

  // WhatsApp reminder message builder
  const handleSendWhatsApp = (rec: StudentQuizRecord) => {
    if (!rec.contactNumber) {
      triggerToast('Contact number not available for this student.');
      return;
    }
    const cleanPhone = rec.contactNumber.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('03') ? '92' + cleanPhone.substring(1) : cleanPhone;
    
    const message = `Dear ${rec.studentName},\n\nThis is a friendly reminder that your online Quiz for AIOU course *${rec.courseCode}* is scheduled/due on *${rec.quizDate}*.\n\nPlease make sure to log in to your LMS portal on time and complete it. If you need assistance with LMS login credentials or portal checks, please reach out.\n\nBest regards,\nAIOU Support Desk`;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filter records
  const filteredRecords = computedRecords.filter(rec => {
    // Search filter
    const matchesSearch = rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (rec.contactNumber && rec.contactNumber.includes(searchQuery));

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = rec.status === 'Pending';
    } else if (statusFilter === 'Completed') {
      matchesStatus = rec.status === 'Completed';
    } else if (statusFilter === 'Overdue') {
      matchesStatus = rec.status === 'Overdue';
    } else if (statusFilter === 'Upcoming') {
      matchesStatus = rec.status === 'Pending' && rec.quizDate > todayStr;
    }

    // Program Filter
    const matchesProgram = programFilter === '' || rec.programSelected === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className={`p-2 rounded-xl border border-gray-200 bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-colors ${
              isGreen ? 'text-emerald-700' : 'text-sky-700'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight ${
              isGreen ? 'text-emerald-950' : 'text-sky-950'
            }`}>
              Quiz Management & Timely Alarms
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Display online student quiz schedules, manage due dates, and monitor upcoming or overdue exams.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setSelectedMainStudentId('');
            setStudentName('');
            setFatherName('');
            setStudentId('');
            setContactNumber('');
            setCourseCode('');
            setQuizDate('');
            setStatus('Pending');
            setRemarks('');
            setAddToMainDirectory(false);
            setShowForm(true);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
            isGreen 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
              : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
          }`}
        >
          <Plus size={16} />
          <span>Schedule New Quiz</span>
        </button>
      </div>

      {/* Alarms & Notifications Panel */}
      {criticalAlarms.length > 0 && (
        <div className="bg-red-50/50 border border-red-150 rounded-2xl p-5 shadow-3xs space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm pb-1 border-b border-red-100">
            <Bell size={18} className="text-red-500 animate-bounce" />
            <span>CRITICAL QUIZ ALARMS ({criticalAlarms.length})</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {criticalAlarms.map(rec => {
              const isOverdue = rec.quizDate < todayStr;
              const isToday = rec.quizDate === todayStr;
              return (
                <div 
                  key={rec.id} 
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 shadow-4xs ${
                    isOverdue 
                      ? 'bg-red-50 border-red-200 text-red-950' 
                      : isToday 
                        ? 'bg-amber-50 border-amber-200 text-amber-950' 
                        : 'bg-blue-50/50 border-blue-200 text-blue-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs block truncate max-w-[150px]">{rec.studentName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                        isOverdue 
                          ? 'bg-red-200 text-red-800' 
                          : isToday 
                            ? 'bg-amber-200 text-amber-800 animate-pulse' 
                            : 'bg-blue-200 text-blue-800'
                      }`}>
                        {isOverdue ? 'Overdue' : isToday ? 'Due Today' : 'Approaching'}
                      </span>
                    </div>
                    <div className="text-[11px] mt-1 text-gray-500 space-y-0.5">
                      <p>Course: <strong className="font-mono text-gray-950">{rec.courseCode}</strong></p>
                      <p className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>Date: <strong className="font-mono text-gray-950">{rec.quizDate}</strong></span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-dashed border-gray-200">
                    <button
                      onClick={() => handleToggleComplete(rec)}
                      className="flex-1 bg-white hover:bg-green-50 text-[10px] font-bold text-green-700 py-1 px-1.5 rounded-md border border-green-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check size={10} />
                      <span>Complete</span>
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(rec)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-1 px-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <MessageSquare size={10} />
                      <span>Alert</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pop-up Edit/Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-150 shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className={`text-base font-black ${isGreen ? 'text-emerald-950' : 'text-sky-950'}`}>
                {editingRecord ? 'Edit Quiz Schedule' : 'Schedule New Quiz'}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-extrabold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              
              {/* Optional Quick lookup dropdown of previously enrolled students */}
              {!editingRecord && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Quick Fill: Link Previously Enrolled Student
                  </label>
                  <select
                    value={selectedMainStudentId}
                    onChange={(e) => setSelectedMainStudentId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden"
                  >
                    <option value="">-- Or enter new student details manually below --</option>
                    {studentRecords.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.studentName} ({s.registrationId}) - {s.programSelected}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Father's Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Enter father's name"
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Student ID / Reg ID *</label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 23FPA09511"
                    className="w-full p-2.5 border border-gray-300 rounded-lg uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Contact Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. 8601"
                    className="w-full p-2.5 border border-gray-300 rounded-lg uppercase font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Quiz Schedule Date *</label>
                  <input
                    type="date"
                    required
                    value={quizDate}
                    onChange={(e) => setQuizDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {editingRecord && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Quiz Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-gray-550">Remarks / Instructions</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Requires assistance with portal login checks."
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Checkbox to add to main student directory if manual input */}
              {!editingRecord && !selectedMainStudentId && (
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="addToMainDir"
                    checked={addToMainDirectory}
                    onChange={(e) => setAddToMainDirectory(e.target.checked)}
                    className="mt-0.5 rounded cursor-pointer text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="addToMainDir" className="text-[11px] text-gray-600 font-medium leading-relaxed cursor-pointer select-none">
                    <strong>Save to Main Student Directory</strong><br />
                    This will register the student into the previously enrolled directory for global search lookup as well.
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-bold text-white transition-all cursor-pointer ${
                    isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  Save Schedule
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* Main Tabular View & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-2xs overflow-hidden">
        
        {/* Filters Toolbar */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-150 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, ID, or course code..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-gray-200 rounded-xl">
            {(['All', 'Pending', 'Upcoming', 'Overdue', 'Completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  statusFilter === tab 
                    ? isGreen 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-550 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Program filter */}
          <div className="w-full md:w-56 flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs"
            >
              <option value="">All Programs</option>
              {PROGRAM_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Schedules Table */}
        <div className="overflow-x-auto text-xs">
          {loading ? (
            <div className="p-12 text-center text-gray-400 font-medium">
              Loading schedules, please wait...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium space-y-1.5">
              <BookOpen className="mx-auto text-gray-300" size={28} />
              <p>No quiz schedules found matching your filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wide border-b border-gray-150 text-[10px]">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4 font-mono">Student ID</th>
                  <th className="py-3 px-4 font-mono">Course Code</th>
                  <th className="py-3 px-4">Quiz Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredRecords.map(rec => {
                  const isOverdue = rec.status === 'Overdue';
                  const isCompleted = rec.status === 'Completed';
                  const isToday = rec.quizDate === todayStr;

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-extrabold text-gray-900 block">{rec.studentName}</span>
                          {rec.contactNumber && (
                            <span className="text-[10px] text-gray-450 font-mono flex items-center gap-1 mt-0.5">
                              <Phone size={10} />
                              <span>{rec.contactNumber}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                          {rec.studentId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-gray-950 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          {rec.courseCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-700">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{rec.quizDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          isCompleted 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : isOverdue 
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                              : isToday 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : isToday ? 'Due Today' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={rec.remarks}>
                        {rec.remarks || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Toggle Complete button if Pending/Overdue */}
                          {!isCompleted && (
                            <button
                              onClick={() => handleToggleComplete(rec)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 border border-transparent hover:border-green-150 transition-colors cursor-pointer"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {/* Edit record */}
                          <button
                            onClick={() => handleEditClick(rec)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Direct WhatsApp Alert */}
                          <button
                            onClick={() => handleSendWhatsApp(rec)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-250 transition-colors cursor-pointer"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare size={15} />
                          </button>

                          {/* Delete record */}
                          <button
                            onClick={() => handleDeleteClick(rec.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-150 transition-colors cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info counts */}
        <div className="p-3 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span>Total Matches: {filteredRecords.length} Quiz Schedules</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Overdue Warning Radar is Operational</span>
          </span>
        </div>

      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-950/95 backdrop-blur-md text-white font-extrabold text-xs px-5 py-3 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Security Auth Modal for Record Deletion */}
      <SecurityAuthModal
        isOpen={deleteModalOpen}
        message={deleteDetails}
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setIdToDelete(null);
        }}
        theme={theme}
      />

    </div>
  );
}
