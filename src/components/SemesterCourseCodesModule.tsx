import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  BookOpen, 
  User, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Save, 
  BookMarked, 
  X, 
  Sparkles,
  AlertCircle,
  Hash,
  Award,
  BookOpenCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentRecord, SemesterData, CourseData, PROGRAM_OPTIONS, StudentStatus } from '../types';

interface SemesterCourseCodesModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  onUpdateStudent: (record: StudentRecord) => Promise<void>;
  theme: 'green' | 'blue';
}

export default function SemesterCourseCodesModule({
  onBackToDashboard,
  studentRecords,
  onUpdateStudent,
  theme
}: SemesterCourseCodesModuleProps) {
  const isGreen = theme === 'green';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  
  // Modals / Editors state
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Student Info Modal state
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [editStudentName, setEditStudentName] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editAdmissionYear, setEditAdmissionYear] = useState('');
  const [editSemesterType, setEditSemesterType] = useState<'Autumn' | 'Spring'>('Autumn');

  // Edit Course Code Modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalType, setCourseModalType] = useState<'add' | 'edit'>('add');
  const [activeSemesterNum, setActiveSemesterNum] = useState<number>(1);
  const [activeCourseIndex, setActiveCourseIndex] = useState<number>(-1);
  const [courseCodeInput, setCourseCodeInput] = useState('');

  // Synchronize local selectedStudent state if the parent's records change
  useEffect(() => {
    if (selectedStudentId) {
      const updated = studentRecords.find(r => r.id === selectedStudentId);
      if (updated) {
        setSelectedStudent(JSON.parse(JSON.stringify(updated))); // deep copy to allow local draft modifications
      } else {
        setSelectedStudent(null);
        setSelectedStudentId('');
      }
    } else {
      setSelectedStudent(null);
    }
  }, [studentRecords, selectedStudentId]);

  // Handle Select Student
  const handleSelectStudent = (student: StudentRecord) => {
    setSelectedStudentId(student.id);
    setSelectedStudent(JSON.parse(JSON.stringify(student))); // deep copy
  };

  // Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter student directory records
  const filteredStudents = studentRecords.filter(student => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      student.studentName.toLowerCase().includes(query) ||
      student.registrationId.toLowerCase().includes(query) ||
      student.programSelected.toLowerCase().includes(query) ||
      (student.phoneNumber && student.phoneNumber.includes(query))
    );
  }).sort((a, b) => a.studentName.localeCompare(b.studentName));

  // Save updated student record back to cloud & local storage
  const saveUpdatedStudentRecord = async (updatedRecord: StudentRecord) => {
    setIsSaving(true);
    try {
      updatedRecord.updatedAt = new Date().toISOString();
      await onUpdateStudent(updatedRecord);
      triggerToast('Student semester course codes updated successfully!');
    } catch (error) {
      console.error('Error saving student course records:', error);
      triggerToast('Failed to update records. Placed in local sync buffer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Student Info
  const handleOpenStudentInfoEdit = () => {
    if (!selectedStudent) return;
    setEditStudentName(selectedStudent.studentName);
    setEditProgram(selectedStudent.programSelected);
    setEditAdmissionYear(selectedStudent.admissionYear);
    setEditSemesterType(selectedStudent.semesterType || 'Autumn');
    setShowStudentInfoModal(true);
  };

  // Save Student Info Edit
  const handleSaveStudentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const updated = {
      ...selectedStudent,
      studentName: editStudentName.trim(),
      programSelected: editProgram,
      admissionYear: editAdmissionYear.trim(),
      semesterType: editSemesterType,
    };

    setSelectedStudent(updated);
    setShowStudentInfoModal(false);
    await saveUpdatedStudentRecord(updated);
  };

  // Open Add Course Code Modal
  const handleOpenAddCourse = (semesterNum: number) => {
    setCourseModalType('add');
    setActiveSemesterNum(semesterNum);
    setCourseCodeInput('');
    setShowCourseModal(true);
  };

  // Open Edit Course Code Modal
  const handleOpenEditCourse = (semesterNum: number, courseIdx: number, currentCode: string) => {
    setCourseModalType('edit');
    setActiveSemesterNum(semesterNum);
    setActiveCourseIndex(courseIdx);
    setCourseCodeInput(currentCode);
    setShowCourseModal(true);
  };

  // Save Course Code (Add/Edit)
  const handleSaveCourseCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const trimmedCode = courseCodeInput.trim().toUpperCase();
    if (!trimmedCode) return;

    const updated = { ...selectedStudent };
    
    // Find semester
    const semIdx = updated.semesters.findIndex(s => s.semesterNumber === activeSemesterNum);
    if (semIdx !== -1) {
      if (courseModalType === 'add') {
        // Initialize courses array if it doesn't exist
        if (!updated.semesters[semIdx].courses) {
          updated.semesters[semIdx].courses = [];
        }
        
        // Add course
        const newCourse: CourseData = {
          code: trimmedCode,
          assignment: false,
          workshop: false,
          quiz: false,
          assignment1: false,
          assignment2: false
        };
        updated.semesters[semIdx].courses.push(newCourse);
      } else {
        // Edit course
        if (updated.semesters[semIdx].courses && updated.semesters[semIdx].courses[activeCourseIndex]) {
          updated.semesters[semIdx].courses[activeCourseIndex].code = trimmedCode;
        }
      }
    }

    setSelectedStudent(updated);
    setShowCourseModal(false);
    await saveUpdatedStudentRecord(updated);
  };

  // Delete Course Code
  const handleDeleteCourseCode = async (semesterNum: number, courseIdx: number) => {
    if (!selectedStudent) return;
    if (!window.confirm('Are you sure you want to delete this course code?')) return;

    const updated = { ...selectedStudent };
    const semIdx = updated.semesters.findIndex(s => s.semesterNumber === semesterNum);
    
    if (semIdx !== -1 && updated.semesters[semIdx].courses) {
      updated.semesters[semIdx].courses.splice(courseIdx, 1);
      setSelectedStudent(updated);
      await saveUpdatedStudentRecord(updated);
    }
  };

  // Add New Semester
  const handleAddNewSemester = async () => {
    if (!selectedStudent) return;
    
    const updated = { ...selectedStudent };
    const nextSemesterNumber = updated.semesters.length > 0 
      ? Math.max(...updated.semesters.map(s => s.semesterNumber)) + 1 
      : 1;

    const newSemester: SemesterData = {
      semesterNumber: nextSemesterNumber,
      courses: []
    };

    updated.semesters.push(newSemester);
    setSelectedStudent(updated);
    await saveUpdatedStudentRecord(updated);
    triggerToast(`Semester ${nextSemesterNumber} added successfully!`);
  };

  // Remove Entire Semester
  const handleRemoveSemester = async (semesterNum: number) => {
    if (!selectedStudent) return;
    if (!window.confirm(`Are you sure you want to remove Semester ${semesterNum} and all its course codes?`)) return;

    const updated = { ...selectedStudent };
    updated.semesters = updated.semesters.filter(s => s.semesterNumber !== semesterNum);
    
    // Re-index semester numbers to keep them consistent
    updated.semesters = updated.semesters.map((s, index) => ({
      ...s,
      semesterNumber: index + 1
    }));

    setSelectedStudent(updated);
    await saveUpdatedStudentRecord(updated);
    triggerToast(`Semester ${semesterNum} removed successfully.`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* 1. Header with Title and back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className={`p-2 rounded-xl border border-gray-200 bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-colors ${
              isGreen ? 'text-emerald-700 hover:text-emerald-900' : 'text-sky-700 hover:text-sky-900'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 ${
              isGreen ? 'text-emerald-950' : 'text-sky-950'
            }`}>
              <BookOpenCheck size={22} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
              <span>Semester-wise Course Codes Dashboard</span>
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Review and manage academic course code distributions, update semester configurations, or append semesters dynamically.
            </p>
          </div>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-mono">
              Editing: <strong className="text-gray-700">{selectedStudent.studentName}</strong>
            </span>
            {isSaving && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse ${
                isGreen ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'
              }`}>
                Saving changes...
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Main content split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Student Directory (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
              <span>Student Roster Directory</span>
            </h3>
            <p className="text-[10px] text-gray-400 leading-tight">
              Select any enrolled student from the roster below to audit and customize their semester course codes.
            </p>
          </div>

          {/* Search bar inside sidebar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID or program..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50/20 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans"
            />
          </div>

          {/* Students list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 italic">
                No students found matching your search.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudentId === student.id;
                const totalSems = student.semesters?.length || 0;
                const totalCoursesCount = student.semesters?.reduce((sum, s) => sum + (s.courses?.length || 0), 0) || 0;
                
                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 group pt-3 ${
                      isSelected 
                        ? isGreen 
                          ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 shadow-4xs' 
                          : 'bg-sky-50/80 border border-sky-200 text-sky-950 shadow-4xs'
                        : 'hover:bg-gray-50/60 border border-transparent text-gray-800'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs truncate block">
                          {student.studentName}
                        </span>
                        <span className={`text-[8px] px-1 py-0.2 rounded-sm font-mono font-bold ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate font-medium">
                        {student.programSelected}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono">
                        <span>ID: <strong className="text-gray-600">{student.registrationId}</strong></span>
                        <span>•</span>
                        <span>{totalSems} Sems ({totalCoursesCount} Courses)</span>
                      </div>
                    </div>
                    
                    <ChevronRight 
                      size={14} 
                      className={`shrink-0 transition-transform ${
                        isSelected 
                          ? 'transform translate-x-1 text-emerald-600' 
                          : 'text-gray-300 group-hover:text-gray-400'
                      }`} 
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Semester Course Codes Audit and Control panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedStudent ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-12 rounded-2xl border border-gray-150 shadow-3xs text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className={`p-4 rounded-2xl ${isGreen ? 'bg-emerald-50 text-emerald-500' : 'bg-sky-50 text-sky-500'} animate-pulse`}>
                  <BookOpen size={48} />
                </div>
                <div className="max-w-sm space-y-1.5">
                  <h3 className="text-base font-extrabold text-gray-900">
                    No Enrolled Student Selected
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Choose a student from the directory roster on the left sidebar to access their course schedule timeline, modify course codes, and audit semester logs.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="student-courses-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* 1. Student Info Header Display Panel */}
                <div className={`p-5 rounded-2xl border text-white shadow-2xs relative overflow-hidden ${
                  isGreen 
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-950' 
                    : 'bg-gradient-to-r from-sky-800 to-indigo-900 border-sky-950'
                }`}>
                  {/* Decorative background visual */}
                  <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center mr-6">
                    <BookMarked size={120} />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                          {selectedStudent.registrationId}
                        </span>
                        <span className="text-[10px] font-mono text-white/80">
                          Enrolled: {selectedStudent.admissionYear} ({selectedStudent.semesterType || 'Autumn'})
                        </span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight text-white">
                        {selectedStudent.studentName}
                      </h3>
                      <p className="text-xs text-white/80 font-medium">
                        {selectedStudent.programSelected}
                      </p>
                    </div>

                    <button
                      onClick={handleOpenStudentInfoEdit}
                      className="self-start sm:self-center bg-white/10 hover:bg-white/25 border border-white/20 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit size={12} />
                      <span>Edit Student Info</span>
                    </button>
                  </div>
                </div>

                {/* 2. Semesters Course Cards Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest font-mono">
                      Semester-wise Course Code Distribution
                    </h3>
                    <button
                      onClick={handleAddNewSemester}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-white ${
                        isGreen 
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' 
                          : 'border-sky-200 text-sky-700 hover:bg-sky-50'
                      }`}
                    >
                      <Plus size={13} />
                      <span>Add Semester</span>
                    </button>
                  </div>

                  {selectedStudent.semesters && selectedStudent.semesters.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center text-xs text-gray-400 italic">
                      This student has no semesters registered. Click "Add Semester" to create one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.semesters
                        ?.sort((a, b) => a.semesterNumber - b.semesterNumber)
                        .map((sem) => {
                          const courseCount = sem.courses?.length || 0;
                          return (
                            <div 
                              key={sem.semesterNumber}
                              className={`bg-white rounded-2xl border border-gray-150 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between overflow-hidden border-t-4 ${
                                isGreen ? 'hover:border-emerald-500 border-t-emerald-600' : 'hover:border-sky-500 border-t-sky-600'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1.5 rounded-lg text-xs font-bold font-mono ${
                                    isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                                  }`}>
                                    S-{sem.semesterNumber}
                                  </div>
                                  <span className="font-extrabold text-xs text-gray-800">
                                    Semester {sem.semesterNumber}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    ({courseCount} {courseCount === 1 ? 'course' : 'courses'})
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleRemoveSemester(sem.semesterNumber)}
                                  title="Remove entire semester"
                                  className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Card Body Courses list */}
                              <div className="p-4 flex-1 space-y-2 min-h-[140px] bg-gray-50/20">
                                {!sem.courses || sem.courses.length === 0 ? (
                                  <div className="text-center py-8 text-[11px] text-gray-400 italic font-medium">
                                    No course codes assigned
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {sem.courses.map((course, idx) => (
                                      <div 
                                        key={idx}
                                        className="bg-white border border-gray-200 pl-2.5 pr-1.5 py-1 rounded-lg flex items-center gap-1.5 shadow-4xs group/badge"
                                      >
                                        <span className="font-mono text-[11px] font-extrabold text-gray-900 tracking-wider">
                                          {course.code || 'UNNAMED'}
                                        </span>
                                        <div className="flex items-center gap-0.5 opacity-60 group-hover/badge:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleOpenEditCourse(sem.semesterNumber, idx, course.code)}
                                            className="p-0.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded cursor-pointer"
                                            title="Edit code"
                                          >
                                            <Edit size={10} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCourseCode(sem.semesterNumber, idx)}
                                            className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                                            title="Delete code"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Card Footer */}
                              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                  onClick={() => handleOpenAddCourse(sem.semesterNumber)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-white cursor-pointer transition-colors ${
                                    isGreen 
                                      ? 'border-emerald-150 text-emerald-700 hover:bg-emerald-50' 
                                      : 'border-sky-150 text-sky-700 hover:bg-sky-50'
                                  }`}
                                >
                                  <Plus size={11} />
                                  <span>Add Course</span>
                                </button>
                              </div>

                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. MODAL: Edit Student Info */}
      <AnimatePresence>
        {showStudentInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-gray-150 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Edit size={15} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
                  <span>Modify Semester & General Info</span>
                </h3>
                <button
                  onClick={() => setShowStudentInfoModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveStudentInfo} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                    placeholder="e.g. Ahmad Khan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-gray-550">Academic Program *</label>
                  <select
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                  >
                    {PROGRAM_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-gray-550">Admission Year *</label>
                    <input
                      type="text"
                      required
                      value={editAdmissionYear}
                      onChange={(e) => setEditAdmissionYear(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                      placeholder="e.g. 2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-gray-550">Admission Semester *</label>
                    <select
                      value={editSemesterType}
                      onChange={(e) => setEditSemesterType(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                    >
                      <option value="Autumn">Autumn</option>
                      <option value="Spring">Spring</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-150 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStudentInfoModal(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer transition-all ${
                      isGreen 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                        : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
                    }`}
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Saving...' : 'Save Student Info'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: Add/Edit Course Code */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-5 border-b border-gray-150 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Hash size={15} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
                  <span>
                    {courseModalType === 'add' ? `Add Course to Semester ${activeSemesterNum}` : `Edit Course Code (Semester ${activeSemesterNum})`}
                  </span>
                </h3>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCourseCode} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-550">Course Code *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={courseCodeInput}
                    onChange={(e) => setCourseCodeInput(e.target.value)}
                    placeholder="e.g. 8601"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono font-bold tracking-widest uppercase"
                  />
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Course codes should be entered as alphanumeric identifiers matching AIOU prospectus.
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-150 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer transition-all ${
                      isGreen 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                        : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
                    }`}
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Saving...' : 'Save Course'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-950/95 backdrop-blur-md text-white font-extrabold text-xs px-5 py-3 rounded-2xl border border-gray-800 shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
