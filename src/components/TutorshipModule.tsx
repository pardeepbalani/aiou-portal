import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  ArrowLeft,
  User, 
  TrendingUp, 
  AlertCircle,
  FileText,
  CreditCard,
  Building,
  Info
} from 'lucide-react';
import { TutorshipRecord, TutorshipCourse } from '../types';
import { saveTutorshipRecord, getLocalTutorshipRecords, deleteTutorshipRecord, fetchAndSyncTutorshipRecords } from '../firebase';

interface TutorshipModuleProps {
  onBackToDashboard: () => void;
  theme: 'green' | 'blue';
}

export default function TutorshipModule({ onBackToDashboard, theme }: TutorshipModuleProps) {
  const isGreen = theme === 'green';

  // State managers
  const [records, setRecords] = useState<TutorshipRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Modals / Editors state
  const [showSemesterModal, setShowSemesterModal] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(null);

  // New Semester Form state
  const [newSemesterTerm, setNewSemesterTerm] = useState<string>('');
  const [newProgram, setNewProgram] = useState<string>('BA Program');
  const [semesterPaymentReceived, setSemesterPaymentReceived] = useState<number>(0);
  const [semesterPaymentDate, setSemesterPaymentDate] = useState<string>('');
  const [semesterRemarks, setSemesterRemarks] = useState<string>('');

  // New Course Form state
  const [courseName, setCourseName] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('');
  const [totalCandidates, setTotalCandidates] = useState<number>(0);
  const [assignment1, setAssignment1] = useState<number>(0);
  const [assignment2, setAssignment2] = useState<number>(0);
  const [assignment3, setAssignment3] = useState<number>(0);
  const [assignment4, setAssignment4] = useState<number>(0);
  const [hasAssignment3, setHasAssignment3] = useState<boolean>(false);
  const [hasAssignment4, setHasAssignment4] = useState<boolean>(false);
  const [gradingStatus, setGradingStatus] = useState<'Completed' | 'Pending'>('Pending');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentDue, setPaymentDue] = useState<number>(0);

  // Load and seed default data if empty
  const loadRecords = async () => {
    setLoading(true);
    try {
      const fetched = await fetchAndSyncTutorshipRecords();
      if (fetched.length === 0) {
        // Seed default records for tutor PARDEEP as requested in example
        const seedRecords: TutorshipRecord[] = [
          {
            id: 'autumn_2025_ba_program',
            semesterTerm: 'Autumn 2025',
            program: 'BA Program',
            totalPaymentReceived: 8600,
            paymentReceivedDate: '2025-12-05',
            remarks: 'All grading successfully completed and payment disbursed.',
            courses: [
              {
                courseName: 'Basics of Information & Communication Technology',
                courseCode: '1431',
                totalCandidates: 90,
                assignment1Candidates: 90,
                assignment2Candidates: 90,
                gradingStatus: 'Completed',
                finalGradingDueDate: '2025-11-15',
                paymentDue: 4500 // e.g. Rs. 50 per candidate
              },
              {
                courseName: 'Business Mathematics',
                courseCode: '1429',
                totalCandidates: 82,
                assignment1Candidates: 82,
                assignment2Candidates: 82,
                gradingStatus: 'Completed',
                finalGradingDueDate: '2025-11-20',
                paymentDue: 4100
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'spring_2026_bed_program',
            semesterTerm: 'Spring 2026',
            program: 'B.Ed (1.5 Years)',
            totalPaymentReceived: 0,
            paymentReceivedDate: '',
            remarks: 'Active grading semester.',
            courses: [
              {
                courseName: 'Educational Assessment & Evaluation',
                courseCode: '8602',
                totalCandidates: 65,
                assignment1Candidates: 65,
                assignment2Candidates: 65,
                assignment3Candidates: 65,
                assignment4Candidates: 65,
                gradingStatus: 'Pending',
                finalGradingDueDate: '2026-08-30',
                paymentDue: 3250
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        for (const record of seedRecords) {
          await saveTutorshipRecord(record);
        }
        setRecords(seedRecords);
        setSelectedSemester('Autumn 2025');
        setSelectedProgram('BA Program');
      } else {
        setRecords(fetched);
        
        // Select first available semester/program
        if (fetched.length > 0) {
          setSelectedSemester(fetched[0].semesterTerm);
          setSelectedProgram(fetched[0].program);
        }
      }
    } catch (error) {
      console.error('Error loading tutorship records, loading locally:', error);
      const local = getLocalTutorshipRecords();
      setRecords(local);
      if (local.length > 0) {
        setSelectedSemester(local[0].semesterTerm);
        setSelectedProgram(local[0].program);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Filter lists
  const availableSemesters = Array.from(new Set(records.map(r => r.semesterTerm))).sort().reverse();
  const availableProgramsForSemester = records
    .filter(r => r.semesterTerm === selectedSemester)
    .map(r => r.program);

  // Ensure selected program is valid when semester changes
  useEffect(() => {
    if (selectedSemester) {
      const programs = records
        .filter(r => r.semesterTerm === selectedSemester)
        .map(r => r.program);
      if (programs.length > 0 && !programs.includes(selectedProgram)) {
        setSelectedProgram(programs[0]);
      }
    }
  }, [selectedSemester, records]);

  // Active record
  const activeRecord = records.find(r => r.semesterTerm === selectedSemester && r.program === selectedProgram);

  // Calculations
  const activeCourses = activeRecord?.courses || [];
  const totalPaymentDue = activeCourses.reduce((sum, c) => sum + (c.paymentDue || 0), 0);
  const paymentReceived = activeRecord?.totalPaymentReceived || 0;
  const outstandingBalance = totalPaymentDue - paymentReceived;
  const paymentReceivedDate = activeRecord?.paymentReceivedDate || '';

  // Calculate grading stats
  const totalAssignedCandidates = activeCourses.reduce((sum, c) => sum + (c.totalCandidates || 0), 0);
  const completedCoursesCount = activeCourses.filter(c => c.gradingStatus === 'Completed').length;
  const pendingCoursesCount = activeCourses.filter(c => c.gradingStatus === 'Pending').length;

  // Save semester entry
  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterTerm.trim() || !newProgram.trim()) return;

    const id = `${newSemesterTerm.replace(/\s+/g, '_').toLowerCase()}_${newProgram.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check if duplicate
    const existing = records.find(r => r.semesterTerm === newSemesterTerm && r.program === newProgram);
    
    const recordToSave: TutorshipRecord = existing ? {
      ...existing,
      totalPaymentReceived: Number(semesterPaymentReceived),
      paymentReceivedDate: semesterPaymentDate,
      remarks: semesterRemarks,
      updatedAt: new Date().toISOString()
    } : {
      id,
      semesterTerm: newSemesterTerm,
      program: newProgram,
      courses: [],
      totalPaymentReceived: Number(semesterPaymentReceived),
      paymentReceivedDate: semesterPaymentDate,
      remarks: semesterRemarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTutorshipRecord(recordToSave);
      const updated = await fetchAndSyncTutorshipRecords();
      setRecords(updated);
      setSelectedSemester(newSemesterTerm);
      setSelectedProgram(newProgram);
      setShowSemesterModal(false);
      
      // Reset
      setNewSemesterTerm('');
      setSemesterPaymentReceived(0);
      setSemesterPaymentDate('');
      setSemesterRemarks('');
    } catch (err) {
      console.error('Error saving semester record:', err);
    }
  };

  // Delete current semester-program record
  const handleDeleteSemester = async () => {
    if (!activeRecord) return;
    if (!window.confirm(`Are you sure you want to delete the complete tutorship record for ${selectedSemester} - ${selectedProgram}?`)) return;

    try {
      await deleteTutorshipRecord(activeRecord.id);
      const updated = await fetchAndSyncTutorshipRecords();
      setRecords(updated);
      if (updated.length > 0) {
        setSelectedSemester(updated[0].semesterTerm);
        setSelectedProgram(updated[0].program);
      } else {
        setSelectedSemester('');
        setSelectedProgram('');
      }
    } catch (err) {
      console.error('Error deleting tutorship record:', err);
    }
  };

  // Open course form for adding
  const handleOpenCourseAdd = () => {
    setCourseName('');
    setCourseCode('');
    setTotalCandidates(0);
    setAssignment1(0);
    setAssignment2(0);
    setAssignment3(0);
    setAssignment4(0);
    setHasAssignment3(false);
    setHasAssignment4(false);
    setGradingStatus('Pending');
    setDueDate('');
    setPaymentDue(0);
    setEditingCourseIndex(null);
    setShowCourseModal(true);
  };

  // Auto-calculate course payment due based on candidate counts
  useEffect(() => {
    // Standard pay structure: e.g. Rs. 50 per assigned student candidate
    setPaymentDue(totalCandidates * 50);
  }, [totalCandidates]);

  // Handle open course edit
  const handleOpenCourseEdit = (idx: number) => {
    if (!activeRecord) return;
    const c = activeRecord.courses[idx];
    setCourseName(c.courseName);
    setCourseCode(c.courseCode);
    setTotalCandidates(c.totalCandidates);
    setAssignment1(c.assignment1Candidates);
    setAssignment2(c.assignment2Candidates);
    setAssignment3(c.assignment3Candidates || 0);
    setAssignment4(c.assignment4Candidates || 0);
    setHasAssignment3(c.assignment3Candidates !== undefined);
    setHasAssignment4(c.assignment4Candidates !== undefined);
    setGradingStatus(c.gradingStatus);
    setDueDate(c.finalGradingDueDate);
    setPaymentDue(c.paymentDue);
    setEditingCourseIndex(idx);
    setShowCourseModal(true);
  };

  // Save course info to active record
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord || !courseName.trim() || !courseCode.trim()) return;

    const newCourse: TutorshipCourse = {
      courseName,
      courseCode,
      totalCandidates: Number(totalCandidates),
      assignment1Candidates: Number(assignment1),
      assignment2Candidates: Number(assignment2),
      ...(hasAssignment3 ? { assignment3Candidates: Number(assignment3) } : {}),
      ...(hasAssignment4 ? { assignment4Candidates: Number(assignment4) } : {}),
      gradingStatus,
      finalGradingDueDate: dueDate,
      paymentDue: Number(paymentDue)
    };

    const updatedCourses = [...activeRecord.courses];
    if (editingCourseIndex !== null) {
      updatedCourses[editingCourseIndex] = newCourse;
    } else {
      updatedCourses.push(newCourse);
    }

    const updatedRecord: TutorshipRecord = {
      ...activeRecord,
      courses: updatedCourses,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTutorshipRecord(updatedRecord);
      const updated = await fetchAndSyncTutorshipRecords();
      setRecords(updated);
      setShowCourseModal(false);
    } catch (err) {
      console.error('Error saving course info:', err);
    }
  };

  // Delete course
  const handleDeleteCourse = async (idx: number) => {
    if (!activeRecord) return;
    if (!window.confirm('Are you sure you want to delete this course from the tutorship record?')) return;

    const updatedCourses = activeRecord.courses.filter((_, i) => i !== idx);
    const updatedRecord: TutorshipRecord = {
      ...activeRecord,
      courses: updatedCourses,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveTutorshipRecord(updatedRecord);
      const updated = await fetchAndSyncTutorshipRecords();
      setRecords(updated);
    } catch (err) {
      console.error('Error deleting course from tutorship record:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-150 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className={`p-2.5 rounded-xl border cursor-pointer hover:scale-105 transition-transform ${
              isGreen ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isGreen ? 'text-emerald-950' : 'text-sky-950'}`}>
              Tutorship Record Management
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <User size={14} className="text-gray-400" />
                Tutor: <strong className={isGreen ? 'text-emerald-800' : 'text-sky-800'}>PARDEEP</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building size={14} className="text-gray-400" />
                Organization: Allama Iqbal Open University (AIOU)
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setNewSemesterTerm('');
              setNewProgram('BA Program');
              setSemesterPaymentReceived(0);
              setSemesterPaymentDate('');
              setSemesterRemarks('');
              setShowSemesterModal(true);
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all ${
              isGreen ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-100'
            }`}
          >
            <Plus size={16} />
            <span>Add Semester Record</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-gray-150 shadow-2xs text-center">
          <div className={`w-10 h-10 border-4 rounded-full border-t-transparent animate-spin mx-auto ${isGreen ? 'border-emerald-600' : 'border-sky-600'}`} />
          <p className="text-gray-500 mt-4 font-medium text-sm">Syncing Tutorship records with Firestore...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-150 shadow-2xs text-center space-y-4">
          <Info size={40} className="mx-auto text-gray-400 animate-pulse" />
          <div>
            <h4 className="text-lg font-bold text-gray-900">No Tutorship Records Found</h4>
            <p className="text-xs text-gray-500 mt-1">Initialize a semester-wise tutorship log to track student assignments, deadlines, grading statuses, and outstanding balance payments due.</p>
          </div>
          <button
            onClick={() => setShowSemesterModal(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all ${
              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            <Plus size={16} />
            <span>Create New Tutorship Log</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Selection Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Semester Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Academic Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500/20 focus:outline-hidden"
                >
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Program Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Program Name</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500/20 focus:outline-hidden"
                >
                  {availableProgramsForSemester.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeRecord) {
                    setNewSemesterTerm(activeRecord.semesterTerm);
                    setNewProgram(activeRecord.program);
                    setSemesterPaymentReceived(activeRecord.totalPaymentReceived);
                    setSemesterPaymentDate(activeRecord.paymentReceivedDate || '');
                    setSemesterRemarks(activeRecord.remarks || '');
                    setShowSemesterModal(true);
                  }
                }}
                className={`p-2 rounded-lg border text-gray-600 hover:text-gray-800 hover:bg-gray-50 cursor-pointer text-xs font-bold flex items-center gap-1.5`}
                title="Edit Semester Payment details"
              >
                <Edit3 size={14} />
                <span>Edit Payments</span>
              </button>
              <button
                onClick={handleDeleteSemester}
                className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Delete this entire program logs"
              >
                <Trash2 size={14} />
                <span>Delete Log</span>
              </button>
            </div>
          </div>

          {/* Calculations Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Workload</span>
                <span className="text-xl font-black text-gray-900 block">{totalAssignedCandidates} candidates</span>
                <span className="text-xs text-gray-500 block">Across {activeCourses.length} assigned course(s)</span>
              </div>
              <div className={`p-3 rounded-xl ${isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                <BookOpen size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Payment Due</span>
                <span className="text-xl font-black text-gray-900 block font-mono">Rs. {totalPaymentDue.toLocaleString()}</span>
                <span className="text-xs text-gray-500 block">Generated earnings</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Payment Received</span>
                <span className="text-xl font-black text-emerald-700 block font-mono">Rs. {paymentReceived.toLocaleString()}</span>
                <span className="text-xs text-gray-500 block">
                  {paymentReceivedDate ? `On ${paymentReceivedDate}` : 'No date recorded'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <CreditCard size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Outstanding Balance</span>
                <span className={`text-xl font-black block font-mono ${outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  Rs. {outstandingBalance.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block">
                  {outstandingBalance > 0 ? 'Payment Pending' : 'Cleared/No Balance'}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${outstandingBalance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          {/* Active Workload Courses Section */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-3xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Assigned Courses & Grading Worksheets
                </h3>
                <p className="text-xs text-gray-500">
                  Detailed roster workload of assignments 1-4, deadlines, grading statuses, and course receivables for {selectedSemester} – {selectedProgram}.
                </p>
              </div>

              <button
                onClick={handleOpenCourseAdd}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer transition-colors ${
                  isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                <Plus size={14} />
                <span>Assign Course</span>
              </button>
            </div>

            {activeCourses.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">
                No courses assigned to {selectedProgram} in {selectedSemester} yet. Click "Assign Course" to log new assignments workload.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none border-b border-gray-150">
                      <th className="py-3 px-4">Course Info</th>
                      <th className="py-3 px-4 text-center">Total Candidates</th>
                      <th className="py-3 px-4 text-center">Assignment 1</th>
                      <th className="py-3 px-4 text-center">Assignment 2</th>
                      <th className="py-3 px-4 text-center">Assignment 3</th>
                      <th className="py-3 px-4 text-center">Assignment 4</th>
                      <th className="py-3 px-4 text-center">Grading Status</th>
                      <th className="py-3 px-4">Grading Deadline</th>
                      <th className="py-3 px-4 text-right">Payment Due</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {activeCourses.map((course, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold">
                          <div className="text-gray-900 font-extrabold">{course.courseName}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {course.courseCode}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-gray-800">
                          {course.totalCandidates}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-gray-600 font-mono">
                          {course.assignment1Candidates}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-gray-600 font-mono">
                          {course.assignment2Candidates}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold font-mono">
                          {course.assignment3Candidates !== undefined ? (
                            <span className="text-gray-600">{course.assignment3Candidates}</span>
                          ) : (
                            <span className="text-gray-300 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold font-mono">
                          {course.assignment4Candidates !== undefined ? (
                            <span className="text-gray-600">{course.assignment4Candidates}</span>
                          ) : (
                            <span className="text-gray-300 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            course.gradingStatus === 'Completed'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {course.gradingStatus === 'Completed' ? (
                              <>
                                <CheckCircle size={10} className="text-green-500 fill-green-50" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Clock size={10} className="text-amber-500" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {course.finalGradingDueDate || 'Not set'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono whitespace-nowrap">
                          Rs. {course.paymentDue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenCourseEdit(idx)}
                              className="p-1 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-100 cursor-pointer"
                              title="Edit Course info"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(idx)}
                              className="p-1 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                              title="Delete Course from workload"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remarks Card */}
          {activeRecord?.remarks && (
            <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-start gap-3 text-xs text-gray-500">
              <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-700 block mb-0.5">Tutorship Remarks:</strong>
                {activeRecord.remarks}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SEMESTER MODAL ==================== */}
      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-150 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingRecordId ? 'Update Tutorship Ledger' : 'Create Tutorship Semester'}
              </h3>
              <button
                onClick={() => setShowSemesterModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveSemester} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Semester Term</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn 2025"
                  value={newSemesterTerm}
                  onChange={(e) => setNewSemesterTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Program Name</label>
                <select
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 font-bold focus:outline-hidden"
                >
                  <option value="BA Program">BA Program</option>
                  <option value="B.Ed (1.5 Years)">B.Ed (1.5 Years)</option>
                  <option value="B.Ed (2.5 Years)">B.Ed (2.5 Years)</option>
                  <option value="B.Ed (4 Years)">B.Ed (4 Years)</option>
                  <option value="B.Com Admission">B.Com Admission</option>
                  <option value="Other BS Programs">Other BS Programs</option>
                  <option value="Matriculation (2 Years)">Matriculation (2 Years)</option>
                  <option value="Intermediate (2 Years)">Intermediate (2 Years)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Received (Rs.)</label>
                <input
                  type="number"
                  placeholder="e.g. 8600"
                  value={semesterPaymentReceived}
                  onChange={(e) => setSemesterPaymentReceived(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Received Date</label>
                <input
                  type="date"
                  value={semesterPaymentDate}
                  onChange={(e) => setSemesterPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tutor Remarks / Notes</label>
                <textarea
                  placeholder="Enter remarks or payment details..."
                  rows={3}
                  value={semesterRemarks}
                  onChange={(e) => setSemesterRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg cursor-pointer ${
                    isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  Save Ledger Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== COURSE MODAL ==================== */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-gray-150 shadow-2xl my-8 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingCourseIndex !== null ? 'Modify Course Workload' : 'Assign Course & Grading Specs'}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Course Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basics of Information & Commu"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1431"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Assigned Candidates</label>
                  <input
                    type="number"
                    required
                    value={totalCandidates}
                    onChange={(e) => setTotalCandidates(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Due (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={paymentDue}
                    onChange={(e) => setPaymentDue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wide">Assignment Candidate Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignment 1 Candidates</label>
                    <input
                      type="number"
                      value={assignment1}
                      onChange={(e) => setAssignment1(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden font-mono bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignment 2 Candidates</label>
                    <input
                      type="number"
                      value={assignment2}
                      onChange={(e) => setAssignment2(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Additional Assignments checkboxes */}
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 font-semibold text-[11px] text-gray-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAssignment3}
                      onChange={(e) => setHasAssignment3(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Has Assignment 3</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-semibold text-[11px] text-gray-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAssignment4}
                      onChange={(e) => setHasAssignment4(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Has Assignment 4</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {hasAssignment3 && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignment 3 Candidates</label>
                      <input
                        type="number"
                        value={assignment3}
                        onChange={(e) => setAssignment3(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden font-mono bg-white"
                      />
                    </div>
                  )}

                  {hasAssignment4 && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignment 4 Candidates</label>
                      <input
                        type="number"
                        value={assignment4}
                        onChange={(e) => setAssignment4(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden font-mono bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grading Status</label>
                  <select
                    value={gradingStatus}
                    onChange={(e) => setGradingStatus(e.target.value as 'Completed' | 'Pending')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold focus:outline-hidden"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final Grading Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg cursor-pointer ${
                    isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  Save Course Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
