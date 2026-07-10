import React, { useState } from 'react';
import { 
  Search, 
  ArrowLeft, 
  BookOpenCheck,
  User,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Filter,
  ChevronRight,
  BookMarked,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentRecord } from '../types';

interface SemesterCourseCodesModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  onUpdateStudent: (record: StudentRecord) => Promise<void>;
  theme: 'green' | 'blue';
}

export default function SemesterCourseCodesModule({
  onBackToDashboard,
  studentRecords,
  theme
}: SemesterCourseCodesModuleProps) {
  const isGreen = theme === 'green';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Filter out soft-deleted records
  const validStudents = studentRecords.filter(s => !s.isDeleted);

  // Filter and Search logic for student look-up
  const filteredStudents = validStudents.filter(student => {
    const query = searchQuery.toLowerCase().trim();
    
    // Check program filter
    if (selectedProgramFilter !== 'All' && student.programSelected !== selectedProgramFilter) {
      return false;
    }

    if (!query) return true;

    // Search by name, ID, program or any enrolled course code
    const matchesProfile = (
      student.studentName.toLowerCase().includes(query) ||
      student.registrationId.toLowerCase().includes(query) ||
      student.programSelected.toLowerCase().includes(query)
    );

    if (matchesProfile) return true;

    const matchesCourseCode = student.semesters?.some(sem => 
      sem.courses?.some(course => course.code.toLowerCase().includes(query))
    );

    return matchesCourseCode;
  }).sort((a, b) => a.studentName.localeCompare(b.studentName));

  // Extract unique academic programs for filter dropdown
  const programs = Array.from(
    new Set(validStudents.map(s => s.programSelected))
  ).filter(Boolean).sort();

  // Selected student details lookup
  const selectedStudent = validStudents.find(s => s.id === selectedStudentId) || null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* 1. Header with Title and Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedStudentId ? () => setSelectedStudentId(null) : onBackToDashboard}
            id="semester-courses-back-btn"
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
              <BookOpenCheck size={24} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
              <span>Semester Course Codes Directory</span>
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              {selectedStudentId 
                ? "Detailed semester-wise academic course schedule view (Read-Only)."
                : "Search and filter to audit a specific student's registered course codes."}
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        {!selectedStudentId && (
          <div className={`self-start md:self-center px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isGreen 
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
              : 'bg-sky-50/50 border-sky-100 text-sky-800'
          }`}>
            <span>Total Enrolled:</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs ${
              isGreen ? 'bg-emerald-100 text-emerald-950' : 'bg-sky-100 text-sky-950'
            }`}>
              {filteredStudents.length}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedStudentId ? (
          /* ==================== VIEW A: LOOK-UP DIRECTORY (NO COURSE CODES DISPLAYED TOGETHER) ==================== */
          <motion.div
            key="directory-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search & Filtering Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {/* Search input */}
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name, registration ID, or program..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/20 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans"
                />
              </div>

              {/* Program dropdown filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Filter size={14} className="text-gray-400" />
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="w-full sm:w-56 p-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 transition-all"
                >
                  <option value="All">All Academic Programs</option>
                  {programs.map(prog => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* List of Student Lookup Cards (Strictly basic profile details, no course codes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.length === 0 ? (
                <div className="col-span-1 md:col-span-2 bg-white p-12 rounded-2xl border border-gray-150 text-center text-xs text-gray-400 italic">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <BookOpen size={36} className="text-gray-300 animate-pulse" />
                    <span>No student records match your active filters or search terms.</span>
                  </div>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const semesterCount = student.semesters?.length || 0;
                  return (
                    <div 
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs hover:shadow-2xs transition-all cursor-pointer group flex flex-col justify-between border-l-4 ${
                        isGreen ? 'hover:border-emerald-500 border-l-emerald-600' : 'hover:border-sky-500 border-l-sky-600'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-950 transition-colors">
                            {student.studentName}
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-850' 
                              : 'bg-amber-100 text-amber-850'
                          }`}>
                            {student.status || 'Active'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="flex items-center gap-1.5 font-medium">
                            <GraduationCap size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate">{student.programSelected}</span>
                          </p>
                          <p className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                            <span>ID: <strong className="text-gray-650 font-bold">{student.registrationId}</strong></span>
                            <span>•</span>
                            <span>Intake: <strong className="text-gray-650 font-bold">{student.admissionYear} ({student.semesterType || 'Autumn'})</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {semesterCount} Registered {semesterCount === 1 ? 'Semester' : 'Semesters'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold transition-colors ${
                          isGreen ? 'text-emerald-700 group-hover:text-emerald-900' : 'text-sky-700 group-hover:text-sky-900'
                        }`}>
                          <span>View Course Codes</span>
                          <ChevronRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          /* ==================== VIEW B: INDIVIDUAL SINGLE STUDENT DETAILS (READ-ONLY) ==================== */
          <motion.div
            key="details-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            
            {/* Back Button to Roster lookup */}
            <button
              onClick={() => setSelectedStudentId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-4xs cursor-pointer transition-all hover:bg-gray-50"
            >
              <ArrowLeft size={13} />
              <span>Back to Student Roster</span>
            </button>

            {/* Profile Brief Banner Card */}
            <div className={`p-6 rounded-2xl border text-white shadow-2xs relative overflow-hidden ${
              isGreen 
                ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-950' 
                : 'bg-gradient-to-r from-sky-800 to-indigo-900 border-sky-950'
            }`}>
              <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center mr-8">
                <BookMarked size={120} />
              </div>

              <div className="relative z-10 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded font-mono">
                    ID: {selectedStudent?.registrationId}
                  </span>
                  <span className="text-[10px] font-medium text-white/80">
                    Status: {selectedStudent?.status || 'Active'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {selectedStudent?.studentName}
                </h3>
                
                <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/90 font-medium">
                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="opacity-80" />
                    <span>{selectedStudent?.programSelected}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={14} className="opacity-80" />
                    <span>Admission Year: {selectedStudent?.admissionYear} ({selectedStudent?.semesterType || 'Autumn'} Intake)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Read-Only Semester Grid Layout */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-3xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <Layers size={14} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-widest font-mono">
                  Enrolled Semester Course Codes Distribution
                </h4>
              </div>

              {!selectedStudent?.semesters || selectedStudent.semesters.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 italic">
                  No registered semester schedules are currently available for this student.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedStudent.semesters
                    .sort((a, b) => a.semesterNumber - b.semesterNumber)
                    .map((sem) => {
                      const coursesList = sem.courses || [];
                      return (
                        <div 
                          key={sem.semesterNumber} 
                          className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50/30 transition-colors"
                        >
                          {/* Semester Number Tag */}
                          <div className="sm:w-36 shrink-0 flex items-center gap-2">
                            <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md border ${
                              isGreen 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                : 'bg-sky-50 text-sky-800 border-sky-100'
                            }`}>
                              S-{sem.semesterNumber}
                            </span>
                            <span className="text-xs font-black text-gray-800">
                              Semester {sem.semesterNumber}
                            </span>
                          </div>

                          {/* Course list tags Column */}
                          <div className="flex-1">
                            {coursesList.length === 0 ? (
                              <span className="text-xs text-gray-400 italic">No courses enrolled in this semester</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {coursesList.map((course, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center bg-gray-55/40 border border-gray-200 text-gray-800 font-mono font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-4xs"
                                    title="Enrolled course code (read-only)"
                                  >
                                    {course.code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Bottom Note */}
            <div className="flex items-center gap-2 justify-center text-[11px] text-gray-400 font-medium">
              <Sparkles size={12} className={isGreen ? 'text-emerald-500' : 'text-sky-500'} />
              <span>All records synchronized directly with database. No modify access granted in this directory.</span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
