import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  PlusSquare, 
  Search, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  Layers, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResearchProjectRecord } from '../types';
import { 
  fetchAndSyncResearchProjectRecords, 
  saveResearchProjectRecord, 
  deleteResearchProjectRecord 
} from '../firebase';

interface ResearchProjectModuleProps {
  onBackToDashboard: () => void;
  theme: 'green' | 'blue';
}

export default function ResearchProjectModule({ onBackToDashboard, theme }: ResearchProjectModuleProps) {
  const isGreen = theme === 'green';
  const [records, setRecords] = useState<ResearchProjectRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ResearchProjectRecord | null>(null);

  // Form Fields
  const [semester, setSemester] = useState<'Spring' | 'Autumn'>('Spring');
  const [year, setYear] = useState<string>(() => new Date().getFullYear().toString());
  const [studentName, setStudentName] = useState<string>('');
  const [registrationId, setRegistrationId] = useState<string>('');
  const [researchTopic, setResearchTopic] = useState<string>('');
  const [topicApprovalDate, setTopicApprovalDate] = useState<string>('');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [supervisorContact, setSupervisorContact] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Authentication check
  const checkAuth = (): boolean => {
    const isLoggedIn = localStorage.getItem('aiou_admin_logged_in') === 'true';
    if (!isLoggedIn) {
      alert('Unauthorized! Please log in as an administrator to perform this action.');
      return false;
    }
    return true;
  };

  const loadRecords = async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const data = await fetchAndSyncResearchProjectRecords();
      // Sort by creation time / update time descending by default
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecords(sorted);
    } catch (err: any) {
      console.error(err);
      setSyncError('Could not sync research records with cloud. Using cached local storage records instead.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Filter calculations
  const filteredRecords = records.filter(record => {
    // Search terms
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || (
      record.studentName.toLowerCase().includes(query) ||
      record.registrationId.toLowerCase().includes(query) ||
      record.researchTopic.toLowerCase().includes(query) ||
      record.supervisorName.toLowerCase().includes(query)
    );

    const matchesSemester = semesterFilter === 'All' || record.semester === semesterFilter;
    const matchesYear = yearFilter === 'All' || record.year === yearFilter;

    return matchesSearch && matchesSemester && matchesYear;
  });

  // Extract unique years for filter
  const uniqueYears = Array.from(new Set(records.map(r => r.year))).sort((a: string, b: string) => b.localeCompare(a));

  const handleOpenAddModal = () => {
    if (!checkAuth()) return;
    setEditingRecord(null);
    setSemester('Spring');
    setYear(new Date().getFullYear().toString());
    setStudentName('');
    setRegistrationId('');
    setResearchTopic('');
    setTopicApprovalDate('');
    setSupervisorName('');
    setSupervisorContact('');
    setDueDate('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: ResearchProjectRecord) => {
    if (!checkAuth()) return;
    setEditingRecord(record);
    setSemester(record.semester);
    setYear(record.year);
    setStudentName(record.studentName);
    setRegistrationId(record.registrationId);
    setResearchTopic(record.researchTopic);
    setTopicApprovalDate(record.topicApprovalDate);
    setSupervisorName(record.supervisorName);
    setSupervisorContact(record.supervisorContact);
    setDueDate(record.dueDate);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (!checkAuth()) return;
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    if (!checkAuth()) return;
    try {
      await deleteResearchProjectRecord(deleteId);
      setRecords(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert('Delete operation failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth()) return;

    if (!semester || !year || !studentName.trim() || !registrationId.trim() || !researchTopic.trim() || !topicApprovalDate || !supervisorName.trim() || !supervisorContact.trim() || !dueDate) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Generate unique ID based on Registration ID, Semester, and Year to maintain cleanliness
    const cleanRegId = registrationId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const cleanSem = semester.toLowerCase();
    const cleanYear = year.trim();
    const id = editingRecord ? editingRecord.id : `${cleanRegId}_${cleanSem}_${cleanYear}`;

    // Verify unique constraints for NEW records
    if (!editingRecord) {
      const exists = records.some(r => r.id === id);
      if (exists) {
        setFormError(`A research record already exists for Student ${registrationId} in ${semester} ${year}.`);
        return;
      }
    }

    const payload: ResearchProjectRecord = {
      id,
      semester,
      year: year.trim(),
      studentName: studentName.trim(),
      registrationId: registrationId.trim().toUpperCase(),
      researchTopic: researchTopic.trim(),
      topicApprovalDate,
      supervisorName: supervisorName.trim(),
      supervisorContact: supervisorContact.trim(),
      dueDate,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveResearchProjectRecord(payload);
      
      // Update local state list
      setRecords(prev => {
        const index = prev.findIndex(r => r.id === id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = payload;
          return next;
        } else {
          return [payload, ...prev];
        }
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError('Cloud write failed. Record saved offline.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6" id="research-project-module">
      
      {/* 1. Header with Title & Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            id="research-back-btn"
            className={`p-2.5 rounded-xl border border-gray-200 bg-white shadow-3xs cursor-pointer hover:bg-gray-50 transition-colors ${
              isGreen ? 'text-emerald-700 hover:text-emerald-950' : 'text-sky-700 hover:text-sky-950'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5 ${
              isGreen ? 'text-emerald-950' : 'text-sky-950'
            }`}>
              <FileText size={24} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
              <span>Research Project Records</span>
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              Store and manage student research project semester plans, topic assignments, and supervisor allocations.
            </p>
          </div>
        </div>

        {/* Counter & Add Button */}
        <div className="flex items-center gap-3.5">
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
            isGreen 
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
              : 'bg-sky-50/50 border-sky-100 text-sky-800'
          }`}>
            <span>Total Records:</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
              isGreen ? 'bg-emerald-100 text-emerald-950' : 'bg-sky-100 text-sky-950'
            }`}>
              {filteredRecords.length}
            </span>
          </div>

          <button
            onClick={handleOpenAddModal}
            id="add-research-record-btn"
            className={`px-4 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${
              isGreen 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
            }`}
          >
            <PlusSquare size={16} />
            <span>Add Project Record</span>
          </button>
        </div>
      </div>

      {/* 2. Sync Error Display */}
      {syncError && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-amber-850 text-xs">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>{syncError}</div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, registration ID, supervisor, topic..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs bg-gray-50/20 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Layers size={13} />
            <span>Semester:</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="border border-gray-200 rounded-lg py-1 px-2 text-xs bg-white focus:outline-hidden text-gray-800 font-semibold"
            >
              <option value="All">All Semesters</option>
              <option value="Spring">Spring</option>
              <option value="Autumn">Autumn</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Calendar size={13} />
            <span>Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="border border-gray-200 rounded-lg py-1 px-2 text-xs bg-white focus:outline-hidden text-gray-800 font-semibold"
            >
              <option value="All">All Years</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
              {/* Fallback to current year if no records */}
              {!uniqueYears.includes(new Date().getFullYear().toString()) && (
                <option value={new Date().getFullYear().toString()}>{new Date().getFullYear().toString()}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Directory Table / Content View */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3.5">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${
            isGreen ? 'border-emerald-600' : 'border-sky-600'
          }`}></div>
          <p className="text-xs text-gray-400 font-medium">Loading research project files...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-16 text-center max-w-xl mx-auto space-y-4">
          <div className={`p-4 rounded-full mx-auto w-14 h-14 flex items-center justify-center ${
            isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
          }`}>
            <HelpCircle size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">No Research Records Found</h3>
            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
              No project records matching your filters were found. Try modifying your search keywords or tap <strong>Add Project Record</strong> above to log a new entry.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                  <th className="py-4.5 px-5 w-16">S. No.</th>
                  <th className="py-4.5 px-5">Student / ID</th>
                  <th className="py-4.5 px-5">Project Details</th>
                  <th className="py-4.5 px-5">Supervisor</th>
                  <th className="py-4.5 px-5">Milestones</th>
                  <th className="py-4.5 px-5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-750">
                {filteredRecords.map((record, index) => {
                  // S. No. is sequential based on position in current list
                  const serialNumber = index + 1;

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50/40 transition-colors"
                    >
                      {/* S. No. */}
                      <td className="py-4.5 px-5 font-mono text-gray-400 text-xs font-bold">
                        {String(serialNumber).padStart(2, '0')}
                      </td>

                      {/* Student Profile */}
                      <td className="py-4.5 px-5 space-y-1">
                        <div className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5">
                          <User size={13} className="text-gray-400 shrink-0" />
                          <span>{record.studentName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md w-max">
                          REG: {record.registrationId}
                        </div>
                      </td>

                      {/* Topic & Semester */}
                      <td className="py-4.5 px-5 space-y-1.5 max-w-xs">
                        <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border w-max font-mono ${
                          isGreen 
                            ? 'bg-emerald-50/40 text-emerald-800 border-emerald-100' 
                            : 'bg-sky-50/40 text-sky-800 border-sky-100'
                        }`}>
                          {record.semester} {record.year}
                        </div>
                        <p className="text-gray-900 font-semibold text-xs leading-relaxed line-clamp-2" title={record.researchTopic}>
                          {record.researchTopic}
                        </p>
                      </td>

                      {/* Supervisor Details */}
                      <td className="py-4.5 px-5 space-y-1">
                        <div className="text-gray-950 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                          <span>{record.supervisorName}</span>
                        </div>
                        <div className="text-gray-500 font-mono text-[10px] flex items-center gap-1">
                          <Phone size={10} />
                          <span>{record.supervisorContact}</span>
                        </div>
                      </td>

                      {/* Milestones / Dates */}
                      <td className="py-4.5 px-5 space-y-1 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="font-semibold w-16 text-right">Approved:</span>
                          <span className="font-bold text-gray-800">{record.topicApprovalDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <span className="w-16 text-right">Submit Due:</span>
                          <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-amber-950 font-black">{record.dueDate}</span>
                        </div>
                      </td>

                      {/* Edit/Delete actions */}
                      <td className="py-4.5 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            title="Edit Project Record"
                            className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-emerald-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record.id)}
                            title="Delete Project Record"
                            className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Create / Edit Record Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-2xl border border-gray-150 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`p-5 text-white flex items-center justify-between ${
                isGreen 
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-900' 
                  : 'bg-gradient-to-r from-sky-800 to-indigo-900'
              }`}>
                <div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                    <FileText size={18} />
                    <span>{editingRecord ? 'Edit Project Log' : 'Log Research Project'}</span>
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    {editingRecord ? 'Update current supervisor parameters and submission details.' : 'Register a new student topic assignment.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/90 transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Grid Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Semester */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Semester *</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value as 'Spring' | 'Autumn')}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-semibold"
                    >
                      <option value="Spring">Spring</option>
                      <option value="Autumn">Autumn</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Year (e.g., 2026) *</label>
                    <input
                      type="text"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-mono font-bold"
                    />
                  </div>

                  {/* Student Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-medium"
                    />
                  </div>

                  {/* Registration ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Registration ID *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingRecord} // Keep locked during editing to avoid ID discrepancies
                      value={registrationId}
                      onChange={(e) => setRegistrationId(e.target.value)}
                      placeholder="e.g. 23PIR04521"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-mono font-bold disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {/* Research Topic */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Research Topic Assigned *</label>
                  <textarea
                    required
                    value={researchTopic}
                    onChange={(e) => setResearchTopic(e.target.value)}
                    placeholder="Provide the exact research project title/topic details."
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-medium leading-relaxed"
                  />
                </div>

                {/* Supervisor Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Supervisor Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Supervisor Name *</label>
                    <input
                      type="text"
                      required
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="Supervisor's Name"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-medium"
                    />
                  </div>

                  {/* Supervisor Contact */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Supervisor Contact *</label>
                    <input
                      type="text"
                      required
                      value={supervisorContact}
                      onChange={(e) => setSupervisorContact(e.target.value)}
                      placeholder="Supervisor's Phone Number"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Topic Approval Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Topic Approval Date *</label>
                    <input
                      type="date"
                      required
                      value={topicApprovalDate}
                      onChange={(e) => setTopicApprovalDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-mono font-bold"
                    />
                  </div>

                  {/* Due Date for Submission */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Due Date for Submission *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-600 text-gray-800 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-55/40 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-white text-xs font-extrabold cursor-pointer shadow-xs transition-colors ${
                      isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Confirm Delete Dialog Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl border border-gray-150 p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 rounded-full bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-black text-gray-900">Delete Project Record?</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you absolutely sure you want to delete this research project record? This action cannot be undone and will delete the record from remote Firestore storage.
              </p>
              <div className="flex items-center justify-end gap-3.5">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 cursor-pointer shadow-xs transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
