import React, { useState } from 'react';
import { 
  UserPlus, 
  FolderOpen, 
  GraduationCap, 
  Users, 
  TrendingUp, 
  Coins, 
  BookOpen, 
  CheckCircle, 
  Activity, 
  Sparkles,
  PieChart,
  Search,
  ArrowRight,
  Award
} from 'lucide-react';
import { StudentRecord } from '../types';

interface DashboardProps {
  onSelectEnroll: () => void;
  onSelectPrevious: () => void;
  onSelectExamRecords: () => void;
  onSelectDegreeMgt: () => void;
  theme: 'green' | 'blue';
  stats: {
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
  };
  records: StudentRecord[];
  onSelectStudent?: (record: StudentRecord) => void;
}

export default function Dashboard({
  onSelectEnroll,
  onSelectPrevious,
  onSelectExamRecords,
  onSelectDegreeMgt,
  theme,
  stats,
  records,
  onSelectStudent,
}: DashboardProps) {
  const isGreen = theme === 'green';

  // Dashboard Quick Student Lookup Search State
  const [dashboardSearch, setDashboardSearch] = useState('');

  const dashboardSearchResults = dashboardSearch.trim() === '' 
    ? [] 
    : records.filter(r => {
        const query = dashboardSearch.toLowerCase();
        return r.studentName.toLowerCase().includes(query) ||
               r.registrationId.toLowerCase().includes(query) ||
               (r.phoneNumber && r.phoneNumber.includes(query)) ||
               r.programSelected.toLowerCase().includes(query);
      }).slice(0, 5);

  // Calculate advanced stats
  const totalReceivable = records.reduce((sum, r) => sum + (r.totalReceivable || 0), 0);
  const totalPaid = records.reduce((sum, r) => {
    const paid = r.paymentsList?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
    return sum + paid;
  }, 0);
  const outstandingBalance = totalReceivable - totalPaid;
  const collectionPercentage = totalReceivable > 0 ? Math.round((totalPaid / totalReceivable) * 100) : 0;

  // Calculate program distribution
  const programCounts: { [key: string]: number } = {};
  records.forEach(r => {
    const prog = r.programSelected || 'Unassigned';
    programCounts[prog] = (programCounts[prog] || 0) + 1;
  });
  const programData = Object.entries(programCounts).map(([name, count]) => ({
    name,
    count,
    percentage: records.length > 0 ? Math.round((count / records.length) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // Calculate services active counts
  const serviceStats = {
    enrollment: records.filter(r => r.serviceEnrollment).length,
    workshops: records.filter(r => r.serviceWorkshops).length,
    quiz: records.filter(r => r.serviceQuiz).length,
    assignments: records.filter(r => r.serviceAssignments).length,
    physicalWorkshops: records.filter(r => r.servicePhysicalWorkshop).length,
    researchReport: records.filter(r => r.serviceResearchReport).length,
  };

  // Status breakdown
  const activeCount = stats.activeStudents;
  const completedCount = stats.completedStudents;
  const suspendedCount = records.filter(r => r.status === 'suspended').length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Welcome Title */}
      <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${
            isGreen ? 'text-emerald-950' : 'text-sky-950'
          }`}>
            AIOU Administrative Command Center
          </h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            Enrollments, course completion checks, automated financial audit, and service ledger synchronizations.
          </p>
        </div>
        
        <div className="flex justify-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
            isGreen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`}>
            <Sparkles size={12} className="animate-pulse text-yellow-500 fill-yellow-250" />
            <span>Academic Intake 2026</span>
          </span>
        </div>
      </div>

      {/* Quick Student Lookup Widget */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-2.5">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <Search size={16} className={isGreen ? 'text-emerald-500 fill-emerald-100 font-bold' : 'text-sky-500 fill-sky-100' } />
              <span>Real-Time Student Lookup & Credentials Finder</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Type student name, phone number, or AIOU Registration ID to fetch dues, CMS passwords, or academic statuses instantly.
            </p>
          </div>
          {dashboardSearch && (
            <button
              onClick={() => setDashboardSearch('')}
              className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md border border-red-150 cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={18} className="text-purple-500 font-bold" />
          </div>
          <input
            type="text"
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
            placeholder="Type Registration ID (e.g., 23FPA09511) or Name (e.g., Ahmad Khan) to search..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/20 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Live Search Results Overlay list */}
        {dashboardSearch.trim() !== '' && (
          <div className="border border-gray-200 rounded-xl bg-gray-50/30 overflow-hidden text-xs max-h-80 overflow-y-auto divide-y divide-gray-150 animate-fade-in shadow-3xs">
            {dashboardSearchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-400 italic font-medium">
                No students found matching "{dashboardSearch}"
              </div>
            ) : (
              dashboardSearchResults.map((student) => {
                const sPaid = student.paymentsList?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const sBalance = student.totalReceivable - sPaid;
                return (
                  <div
                    key={student.id}
                    onClick={() => onSelectStudent && onSelectStudent(student)}
                    className="p-3.5 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors duration-150 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {student.studentName}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          {student.registrationId}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-[10px] text-gray-500">
                        <span>Program: <strong>{student.programSelected}</strong></span>
                        {student.phoneNumber && (
                          <span>Phone: <strong className="font-mono">{student.phoneNumber}</strong></span>
                        )}
                        <span>Intake: <strong>{student.admissionYear}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-[10px]">
                        <span className="block text-gray-400 font-bold uppercase tracking-wide">Financial Balance</span>
                        <span className={`font-black font-mono ${sBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {sBalance > 0 ? `Rs. ${sBalance.toLocaleString()} Due` : 'Fully Paid'}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${
                        isGreen ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border-emerald-100' : 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white border-sky-100'
                      } transition-colors`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Call to Action Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Enroll Card */}
        <button
          onClick={onSelectEnroll}
          id="dashboard-enroll-button"
          className={`flex flex-col items-center md:items-start md:text-left p-6 bg-white border rounded-2xl cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
            isGreen
              ? 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/10'
              : 'border-sky-100 hover:border-sky-300 hover:bg-sky-50/10'
          }`}
        >
          <div className={`p-3.5 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ${
            isGreen ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            <UserPlus size={28} className={isGreen ? "text-emerald-500 fill-emerald-100" : "text-sky-500 fill-sky-100"} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
            Enroll New Student Record
          </h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-sm">
            Launch dynamic multi-step enrollment form, select program, set up academic semester schedules, and add service packages.
          </p>
        </button>

        {/* Previously Enrolled Students */}
        <button
          onClick={onSelectPrevious}
          id="dashboard-previous-button"
          className={`flex flex-col items-center md:items-start md:text-left p-6 bg-white border rounded-2xl cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
            isGreen
              ? 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/10'
              : 'border-sky-100 hover:border-sky-300 hover:bg-sky-50/10'
          }`}
        >
          <div className={`p-3.5 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ${
            isGreen ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            <FolderOpen size={28} className={isGreen ? "text-emerald-500 fill-emerald-100" : "text-sky-500 fill-sky-100"} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-sky-700 transition-colors">
            Previously Enrolled Directory
          </h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-sm">
            Advanced multi-attribute filters, full transaction tracking ledger, print grade sheets, download Excel spreadsheets, and edit active records.
          </p>
        </button>

        {/* Exam Records */}
        <button
          onClick={onSelectExamRecords}
          id="dashboard-exam-records-button"
          className={`flex flex-col items-center md:items-start md:text-left p-6 bg-white border rounded-2xl cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
            isGreen
              ? 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/10'
              : 'border-sky-100 hover:border-sky-300 hover:bg-sky-50/10'
          }`}
        >
          <div className={`p-3.5 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ${
            isGreen ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            <GraduationCap size={28} className={isGreen ? "text-emerald-500 fill-emerald-100" : "text-sky-500 fill-sky-100"} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
            Exam Records
          </h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-sm">
            Manage Exam Centres (Mithi/Diplo), assign Exam Managers, schedule course paper dates, track fees, and receive reminders.
          </p>
        </button>

        {/* Degree Mgt */}
        <button
          onClick={onSelectDegreeMgt}
          id="dashboard-degree-mgt-button"
          className={`flex flex-col items-center md:items-start md:text-left p-6 bg-white border rounded-2xl cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
            isGreen
              ? 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/10'
              : 'border-sky-100 hover:border-sky-300 hover:bg-sky-50/10'
          }`}
        >
          <div className={`p-3.5 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ${
            isGreen ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            <Award size={28} className={isGreen ? "text-emerald-500 fill-emerald-100" : "text-sky-500 fill-sky-100"} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
            Degree Mgt
          </h3>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-sm">
            Apply for student degree issuance, select Normal or Urgent processing, track total days elapsed, and manage degree fee ledgers.
          </p>
        </button>
      </div>

      {/* METRICS & GRAPHS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Core Enrollment Stats & Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                <Users size={16} className={isGreen ? 'text-emerald-500 fill-emerald-100' : 'text-sky-500 fill-sky-100'} />
                <span>Student Roster Stats</span>
              </h4>
              <span className="text-[10px] font-mono text-gray-400">Total Enrolled: {stats.totalStudents}</span>
            </div>

            {/* Custom Pie Chart Representing Status Breakdown */}
            <div className="flex justify-around items-center py-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG circular track representing status shares */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  
                  {/* Completed Segments (Green) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray={`${(completedCount / (stats.totalStudents || 1)) * 100} ${100 - (completedCount / (stats.totalStudents || 1)) * 100}`} 
                    strokeDashoffset="0" />
                  
                  {/* Active Segments (Blue) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="3" 
                    strokeDasharray={`${(activeCount / (stats.totalStudents || 1)) * 100} ${100 - (activeCount / (stats.totalStudents || 1)) * 100}`} 
                    strokeDashoffset={`-${(completedCount / (stats.totalStudents || 1)) * 100}`} />

                  {/* Suspended Segments (Amber) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#d97706" strokeWidth="3" 
                    strokeDasharray={`${(suspendedCount / (stats.totalStudents || 1)) * 100} ${100 - (suspendedCount / (stats.totalStudents || 1)) * 100}`} 
                    strokeDashoffset={`-${((completedCount + activeCount) / (stats.totalStudents || 1)) * 100}`} />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-gray-800 block leading-none">{stats.totalStudents}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Students</span>
                </div>
              </div>

              {/* Legend with Counts */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
                  <span className="text-gray-500 font-medium">Active:</span>
                  <span className="font-bold text-gray-800">{activeCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />
                  <span className="text-gray-500 font-medium">Completed:</span>
                  <span className="font-bold text-gray-800">{completedCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-600 rounded-full inline-block" />
                  <span className="text-gray-500 font-medium">Suspended:</span>
                  <span className="font-bold text-gray-800">{suspendedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Roster Active Rate</span>
            <span className="font-extrabold text-blue-600">
              {stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 2: Financial Audit Gauge & Collection Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                <Coins size={16} className="text-amber-500 fill-amber-100" />
                <span>Financial Collections Audit</span>
              </h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGreen ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'}`}>
                {collectionPercentage}% Collected
              </span>
            </div>

            <div className="space-y-4 py-1">
              {/* Financial Metrics Stack */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Receivable:</span>
                <span className="font-bold text-gray-900 font-mono">Rs. {totalReceivable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Realized (Paid):</span>
                <span className="font-bold text-emerald-700 font-mono">Rs. {totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-dashed pb-2.5">
                <span className="text-gray-400 font-medium">Outstanding Balances:</span>
                <span className="font-black text-amber-700 font-mono">Rs. {outstandingBalance.toLocaleString()}</span>
              </div>

              {/* Progress Bar Gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <span>Fee Collection Progress Gauge</span>
                  <span>{collectionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      isGreen ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${collectionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/60 flex items-center justify-between text-xs text-emerald-800 mt-2">
            <span>Outstanding Collections</span>
            <span className="font-black">Rs. {outstandingBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Academic Program Registrations Distributions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                <BookOpen size={16} className="text-purple-500 fill-purple-100" />
                <span>Program Intake Ratios</span>
              </h4>
              <span className="text-[10px] font-mono text-gray-400">Programs: {programData.length}</span>
            </div>

            <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
              {programData.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 italic">No admissions recorded yet</div>
              ) : (
                programData.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700 truncate max-w-[180px]">{item.name}</span>
                      <span className="font-bold text-gray-900 font-mono">{item.count} student(s)</span>
                    </div>
                    {/* Tiny representation bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-purple-500' : idx === 1 ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs text-purple-800 mt-2">
            <span>Primary Program Intake</span>
            <span className="font-bold truncate max-w-[130px]">{programData[0]?.name || 'None'}</span>
          </div>
        </div>

      </div>

      {/* SERVICE PACKAGE ADOPTION RATES CARD */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h4 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
            <Activity size={16} className="text-rose-500 fill-rose-100" />
            <span>Interactive Service Package Adoption Breakdown</span>
          </h4>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Real-time counts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Enrollment Support</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{serviceStats.enrollment}</span>
          </div>
          <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Workshop Guides</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{serviceStats.workshops}</span>
          </div>
          <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Quiz Portal Help</span>
            <span className="text-xl font-black text-indigo-700 mt-1 block">{serviceStats.quiz}</span>
          </div>
          <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Assignment Help</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{serviceStats.assignments}</span>
          </div>
          <div className="p-3 bg-sky-50/30 border border-sky-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Physical Workshops</span>
            <span className="text-xl font-black text-sky-700 mt-1 block">{serviceStats.physicalWorkshops}</span>
          </div>
          <div className="p-3 bg-purple-50/30 border border-purple-100 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Research Projects</span>
            <span className="text-xl font-black text-purple-700 mt-1 block">{serviceStats.researchReport}</span>
          </div>
        </div>
      </div>

      {/* Support Info Footer */}
      <div className="text-center text-[10px] text-gray-400 font-mono select-none">
        Allama Iqbal Open University Student Record Indexer V2.0 • Data fully secure via Google Cloud FireStore
      </div>

    </div>
  );
}
