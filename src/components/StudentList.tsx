import React, { useState } from 'react';
import { StudentRecord, PROGRAM_OPTIONS } from '../types';
import { 
  Search, 
  Filter, 
  User, 
  BookOpen, 
  Calendar, 
  Phone, 
  FileText, 
  PlusCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  FolderOpen,
  Trash2,
  FileSpreadsheet,
  Printer,
  Coins
} from 'lucide-react';

interface StudentListProps {
  records: StudentRecord[];
  onSelectStudent: (record: StudentRecord) => void;
  onAddNewEnrollment: () => void;
  onDeleteStudent: (id: string) => Promise<void>;
  theme: 'green' | 'blue';
}

export default function StudentList({
  records,
  onSelectStudent,
  onAddNewEnrollment,
  onDeleteStudent,
  theme,
}: StudentListProps) {
  const isGreen = theme === 'green';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Extract unique years from records for the filter dropdown
  const uniqueYears = Array.from(new Set(records.map(r => r.admissionYear))).sort().reverse();

  // Filter records
  const filteredRecords = records.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchLower) ||
      r.registrationId.toLowerCase().includes(searchLower) ||
      (r.fatherName && r.fatherName.toLowerCase().includes(searchLower)) ||
      (r.phoneNumber && r.phoneNumber.includes(searchLower)) ||
      r.programSelected.toLowerCase().includes(searchLower);
    
    const matchesProgram = selectedProgram === '' || r.programSelected === selectedProgram;
    const matchesYear = selectedYear === '' || r.admissionYear === selectedYear;
    const matchesStatus = selectedStatus === '' || r.status === selectedStatus;

    return matchesSearch && matchesProgram && matchesYear && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-150">
            <TrendingUp size={12} />
            <span>Active</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-150">
            <CheckCircle size={12} />
            <span>Completed</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-150">
            <XCircle size={12} />
            <span>Suspended</span>
          </span>
        );
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProgram('');
    setSelectedYear('');
    setSelectedStatus('');
  };

  const handleExportVisibleToCSV = () => {
    const headers = [
      'Registration ID',
      'Student Name',
      'Father Name',
      'Phone Number',
      'Program Selected',
      'Admission Year',
      'Semester Type',
      'Status',
      'Total Receivable (Rs.)',
      'Total Paid (Rs.)',
      'Remaining Balance (Rs.)',
      'Services Required',
      'Remarks'
    ];

    const rows = filteredRecords.map(r => {
      const totalPaid = r.paymentsList?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const balance = r.totalReceivable - totalPaid;
      
      const activeServices = [
        r.serviceEnrollment ? 'Enrollment' : '',
        r.serviceWorkshops ? 'Workshops' : '',
        r.serviceQuiz ? 'Quiz' : '',
        r.serviceAssignments ? 'Assignments' : '',
        r.servicePhysicalWorkshop ? 'Physical Workshop' : '',
        r.serviceResearchReport ? 'Research Report' : '',
      ].filter(Boolean).join(' | ');

      return [
        r.registrationId,
        r.studentName,
        r.fatherName || 'N/A',
        r.phoneNumber || 'N/A',
        r.programSelected,
        r.admissionYear,
        r.semesterType,
        r.status.toUpperCase(),
        r.totalReceivable,
        totalPaid,
        balance,
        activeServices || 'None',
        r.remarks || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AIOU_Student_Records_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Printable Style overrides to hide interactive UI components during native list print */}
      <style>{`
        @media print {
          header,
          #header-back-button,
          #header-logout-button,
          .student-list-print-hide {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-white {
            border: none !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #e5e7eb !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* Official Print Header */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4 text-center">
        <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900">Allama Iqbal Open University (AIOU)</h1>
        <h2 className="text-sm font-bold text-gray-600 uppercase mt-1">Registered Students Enrollment Directory</h2>
        <div className="text-[10px] text-gray-400 font-mono mt-2">
          Report Date: {new Date().toLocaleDateString()} | Active Records Listed: {filteredRecords.length}
        </div>
      </div>

      {/* Upper Title Panel */}
      <div className="student-list-print-hide flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
        <div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${
            isGreen ? 'text-emerald-950' : 'text-sky-950'
          }`}>
            Previously Enrolled Students
          </h2>
          <p className="text-gray-500 mt-1">
            Browse, search, edit, print, or download records of all registered students.
          </p>
        </div>
        <button
          onClick={onAddNewEnrollment}
          id="student-list-enroll-new-button"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-2xs ${
            isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          <PlusCircle size={16} className="text-white fill-white/20 font-bold" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="student-list-print-hide bg-white p-5 rounded-xl border border-gray-150 shadow-2xs mb-6 space-y-4">
        
        {/* Row 1: Search and Layout indicator */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={18} className="text-purple-500 font-bold" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or registration ID..."
              id="student-search-input"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/30 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Quick Clear Filter Link */}
          {(searchTerm || selectedProgram || selectedYear || selectedStatus) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Row 2: Select Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Program Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Filter by Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Programs</option>
              {PROGRAM_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Filter by Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

      </div>

      {/* Mini Financial Summary Banner of Filtered Records */}
      {filteredRecords.length > 0 && (
        <div className="student-list-print-hide grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Total Fees Receivable</span>
              <span className={`text-base font-extrabold font-mono mt-1 block ${isGreen ? 'text-emerald-950' : 'text-sky-950'}`}>
                Rs. {filteredRecords.reduce((sum, r) => sum + (r.totalReceivable || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className={`p-2 rounded-lg ${isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              <Coins size={18} className="text-amber-500 fill-amber-100" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Total Received Amount</span>
              <span className="text-base font-extrabold text-emerald-700 font-mono mt-1 block">
                Rs. {filteredRecords.reduce((sum, r) => sum + (r.paymentsList?.reduce((pSum, p) => pSum + p.amount, 0) || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle size={18} className="text-emerald-500 fill-emerald-100" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Total Remaining Balance</span>
              <span className="text-base font-extrabold text-amber-700 font-mono mt-1 block">
                Rs. {filteredRecords.reduce((sum, r) => {
                  const paid = r.paymentsList?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
                  return sum + ((r.totalReceivable || 0) - paid);
                }, 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* STUDENT RECORDS TABLE/LIST */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-2xs">
          <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FolderOpen size={24} className="text-gray-400 fill-gray-100" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Records Found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            Try resetting your search query or filters, or enroll a new student to begin tracking.
          </p>
          <button
            onClick={clearFilters}
            className={`mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
              isGreen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
            }`}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
          
          {/* Header count label & Action panel */}
          <div className="px-5 py-3 border-b bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-semibold text-gray-500">
            <span>Showing {filteredRecords.length} of {records.length} total students</span>
            
            <div className="flex items-center gap-2.5 student-list-print-hide">
              {/* Export to Excel */}
              <button
                onClick={handleExportVisibleToCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-lg text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-3xs"
                title="Export Visible Records to Excel (CSV)"
              >
                <FileSpreadsheet size={13} className="text-emerald-500 fill-emerald-50" />
                <span>Export to Excel</span>
              </button>

              {/* Print List */}
              <button
                onClick={handlePrintList}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 rounded-lg text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-3xs"
                title="Print Visible Student List"
              >
                <Printer size={13} className="text-sky-500 fill-sky-50" />
                <span>Print List</span>
              </button>
              
              <span className="hidden md:inline italic font-mono text-gray-400">Click row for details</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-5">Student Info</th>
                  <th className="py-3.5 px-4">Registration ID</th>
                  <th className="py-3.5 px-4">Program & Year</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Payment Balance</th>
                  <th className="py-3.5 px-5 text-center student-list-print-hide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => {
                  const totalPaid = r.paymentsList?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  const balance = r.totalReceivable - totalPaid;
                  
                  return (
                    <tr 
                      key={r.id} 
                      onClick={() => onSelectStudent(r)}
                      id={`student-row-${r.registrationId}`}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group align-middle"
                    >
                      {/* Name & phone */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${
                            isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                          }`}>
                            <User size={16} className={isGreen ? 'text-emerald-500 fill-emerald-50' : 'text-sky-500 fill-sky-50'} />
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                              {r.studentName}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Phone size={10} className="text-blue-500 fill-blue-50" />
                              <span>{r.phoneNumber || 'No phone'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reg ID */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {r.registrationId}
                        </span>
                      </td>

                      {/* Program & admission details */}
                      <td className="py-4 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-800 block">{r.programSelected}</span>
                          <span className="text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} className="text-indigo-500 fill-indigo-50" />
                            <span>{r.admissionYear} ({r.semesterType})</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Payment Receivable / Remaining */}
                      <td className="py-4 px-4 text-right">
                        <div className="text-xs">
                          {balance > 0 ? (
                            <>
                              <span className="text-amber-700 font-extrabold block">Rs. {balance.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400">Due (Receivable)</span>
                            </>
                          ) : (
                            <>
                              <span className="text-green-700 font-bold block">Rs. 0</span>
                              <span className="text-[10px] text-green-500 font-semibold uppercase">Fully Paid</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* View Action link */}
                      <td className="py-4 px-5 text-center student-list-print-hide" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onSelectStudent(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                              isGreen
                                ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                            }`}
                          >
                            Open Details
                          </button>
                          
                          {/* Inline Delete trigger */}
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete the record of ${r.studentName}?`)) {
                                await onDeleteStudent(r.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            title="Delete Student Record"
                          >
                            <Trash2 size={14} className="text-red-500 fill-red-50" />
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

    </div>
  );
}
