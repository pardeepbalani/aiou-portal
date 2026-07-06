import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Truck, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  X, 
  AlertCircle, 
  Award, 
  Info,
  Phone,
  User,
  Activity,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { StudentRecord, StudentDegreeRecord, DegreePaymentHistory } from '../types';
import { 
  saveStudentDegreeRecord, 
  fetchAndSyncStudentDegreeRecords, 
  deleteStudentDegreeRecord 
} from '../firebase';

interface DegreeMgtModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  theme: 'green' | 'blue';
}

export default function DegreeMgtModule({
  onBackToDashboard,
  studentRecords,
  theme
}: DegreeMgtModuleProps) {
  const isGreen = theme === 'green';

  // Data States
  const [degreeRecords, setDegreeRecords] = useState<StudentDegreeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<StudentDegreeRecord | null>(null);

  // Form Fields
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [customFatherName, setCustomFatherName] = useState<string>('');
  const [customContact, setCustomContact] = useState<string>('');
  const [customCourse, setCustomCourse] = useState<string>('');
  const [category, setCategory] = useState<'Normal' | 'Urgent'>('Normal');
  const [appliedDate, setAppliedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [degreeReceivedDate, setDegreeReceivedDate] = useState<string>('');
  const [status, setStatus] = useState<'Applied' | 'Under Process' | 'Dispatched' | 'Received at Hub' | 'Delivered to Student'>('Applied');
  const [totalFee, setTotalFee] = useState<number>(2000);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');
  const [remarks, setRemarks] = useState<string>('');

  // Payment Add Modal state
  const [payingRecordId, setPayingRecordId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payRemarks, setPayRemarks] = useState<string>('');

  // UI Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Print Preview state
  const [printRecord, setPrintRecord] = useState<StudentDegreeRecord | null>(null);

  useEffect(() => {
    loadDegreeRecords();
  }, []);

  const loadDegreeRecords = async () => {
    setLoading(true);
    try {
      const records = await fetchAndSyncStudentDegreeRecords();
      setDegreeRecords(records);
    } catch (error) {
      console.error('Failed to load degree records:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Pre-load default values on Category change
  useEffect(() => {
    if (!editingRecord) {
      setTotalFee(category === 'Urgent' ? 4000 : 2000);
    }
  }, [category, editingRecord]);

  // Handle auto-fill when a student is selected from directory
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (studentId === 'custom') {
      setCustomStudentName('');
      setCustomFatherName('');
      setCustomContact('');
      setCustomCourse('');
      return;
    }

    const matched = studentRecords.find(s => s.id === studentId);
    if (matched) {
      setCustomStudentName(matched.studentName);
      setCustomFatherName(matched.fatherName);
      setCustomContact(matched.phoneNumber);
      setCustomCourse(matched.programSelected + (matched.programCategory ? ` (${matched.programCategory})` : ''));
    }
  };

  const handleOpenCreateForm = () => {
    setEditingRecord(null);
    setSelectedStudentId('');
    setCustomStudentName('');
    setCustomFatherName('');
    setCustomContact('');
    setCustomCourse('');
    setCategory('Normal');
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setDegreeReceivedDate('');
    setStatus('Applied');
    setTotalFee(2000);
    setAmountReceived(0);
    setTrackingNumber('');
    setVerificationStatus('Pending');
    setRemarks('');
    setIsFormOpen(true);
  };

  const handleEditRecordClick = (rec: StudentDegreeRecord) => {
    setEditingRecord(rec);
    // Find if student matches in original records
    const isMatched = studentRecords.some(s => s.registrationId === rec.studentId || s.studentName === rec.studentName);
    setSelectedStudentId(isMatched ? 'existing' : 'custom');
    
    setCustomStudentName(rec.studentName);
    setCustomFatherName(rec.fatherName);
    setCustomContact(rec.contactNumber);
    setCustomCourse(rec.courseName);
    setCategory(rec.category);
    setAppliedDate(rec.appliedDate);
    setDegreeReceivedDate(rec.degreeReceivedDate || '');
    setStatus(rec.status);
    setTotalFee(rec.totalFee);
    setAmountReceived(rec.amountReceived);
    setTrackingNumber(rec.trackingNumber || '');
    setVerificationStatus(rec.verificationStatus);
    setRemarks(rec.remarks || '');
    setIsFormOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStudentName.trim()) {
      triggerToast('Student Name is required');
      return;
    }

    const finalStudentId = selectedStudentId && selectedStudentId !== 'custom' && selectedStudentId !== 'existing'
      ? studentRecords.find(s => s.id === selectedStudentId)?.registrationId || `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : editingRecord ? editingRecord.studentId : `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: StudentDegreeRecord = {
      id: editingRecord ? editingRecord.id : `deg-${Math.random().toString(36).substring(2, 9)}`,
      studentName: customStudentName,
      fatherName: customFatherName,
      studentId: finalStudentId,
      contactNumber: customContact,
      courseName: customCourse || 'BS Computer Science',
      category,
      appliedDate,
      degreeReceivedDate: degreeReceivedDate || undefined,
      status,
      totalFee,
      amountReceived: editingRecord ? editingRecord.amountReceived : amountReceived,
      paymentHistory: editingRecord ? editingRecord.paymentHistory : (amountReceived > 0 ? [{
        id: `pay-${Math.random().toString(36).substring(2, 9)}`,
        date: appliedDate,
        amount: amountReceived,
        remarks: 'Initial deposit'
      }] : []),
      trackingNumber: trackingNumber || undefined,
      verificationStatus,
      remarks: remarks || undefined,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveStudentDegreeRecord(record);
      triggerToast(editingRecord ? 'Degree application updated successfully!' : 'Degree application submitted successfully!');
      setIsFormOpen(false);
      loadDegreeRecords();
    } catch (err) {
      console.error(err);
      triggerToast('Error saving degree record.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this degree record? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteStudentDegreeRecord(id);
      triggerToast('Degree application deleted successfully.');
      loadDegreeRecords();
    } catch (error) {
      console.error(error);
      triggerToast('Error deleting record.');
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecordId || payAmount <= 0) return;

    const target = degreeRecords.find(r => r.id === payingRecordId);
    if (!target) return;

    const newPayment: DegreePaymentHistory = {
      id: `pay-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      amount: payAmount,
      remarks: payRemarks || 'Degree service payment installment'
    };

    const updated: StudentDegreeRecord = {
      ...target,
      amountReceived: target.amountReceived + payAmount,
      paymentHistory: [...target.paymentHistory, newPayment],
      updatedAt: new Date().toISOString()
    };

    try {
      await saveStudentDegreeRecord(updated);
      triggerToast(`Successfully received payment of Rs. ${payAmount.toLocaleString()}!`);
      setPayingRecordId(null);
      setPayAmount(0);
      setPayRemarks('');
      loadDegreeRecords();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to record payment.');
    }
  };

  const computeDaysElapsed = (applyDateStr: string, receiveDateStr?: string) => {
    const start = new Date(applyDateStr);
    const end = receiveDateStr ? new Date(receiveDateStr) : new Date();
    
    // Reset hours to calculate precise days
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  // Filter Logic
  const filteredRecords = degreeRecords.filter(rec => {
    const matchesSearch = 
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900/95 backdrop-blur-xs text-white px-5 py-3 rounded-xl shadow-lg font-bold border border-gray-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section with back navigation and Add New */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToDashboard}
            className={`p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight ${
              isGreen ? 'text-emerald-950' : 'text-sky-950'
            } flex items-center gap-2`}>
              <Award className="text-purple-600" />
              <span>Degree Management Portal</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Apply for degrees, track processing timelines, record verification status, and manage student payments.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateForm}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus size={16} />
          <span>Apply for New Degree</span>
        </button>
      </div>

      {/* Advanced Quick Filters Panel */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold" />
          <input
            type="text"
            placeholder="Search degree applications by student name, Reg ID, or program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2 py-1.5 bg-white border border-gray-250 rounded-xl text-gray-700 font-bold focus:outline-hidden focus:border-purple-500"
            >
              <option value="All">All Categories</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2 py-1.5 bg-white border border-gray-250 rounded-xl text-gray-700 font-bold focus:outline-hidden focus:border-purple-500"
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Process">Under Process</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Received at Hub">Received at Hub</option>
              <option value="Delivered to Student">Delivered to Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid / List of Applications */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-gray-150 rounded-2xl">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2" />
          <p className="text-xs text-gray-500">Loading academic degree records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-gray-250 rounded-2xl">
          <Award size={40} className="mx-auto text-gray-300 mb-3" />
          <h4 className="text-sm font-bold text-gray-700">No Degree Applications Found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {searchQuery || categoryFilter !== 'All' || statusFilter !== 'All' 
              ? "No applications match your active search filter query. Try modifying your criteria."
              : "No students have applied for degrees yet. Click the button above to register an application!"
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden divide-y divide-gray-150 shadow-3xs">
          {filteredRecords.map((info) => {
            const isExpanded = expandedRecordId === info.id;
            const outstanding = info.totalFee - info.amountReceived;
            const daysElapsed = computeDaysElapsed(info.appliedDate, info.degreeReceivedDate);

            // Timeline states for status progression
            const statusesList = ['Applied', 'Under Process', 'Dispatched', 'Received at Hub', 'Delivered to Student'];
            const currentStatusIndex = statusesList.indexOf(info.status);

            return (
              <div 
                key={info.id}
                className="border-b border-gray-150 last:border-b-0 hover:bg-gray-50/20 transition-all"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => setExpandedRecordId(isExpanded ? null : info.id)}
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
                      
                      {/* Urg/Normal category badge */}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        info.category === 'Urgent' 
                          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {info.category} Apply
                      </span>

                      {/* Verification Badge */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                        info.verificationStatus === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : info.verificationStatus === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Verification: {info.verificationStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone size={12} className="text-blue-500" />
                        <span>{info.contactNumber || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <Award size={12} className="text-purple-500 font-bold" />
                        <span>Program: <span className="text-purple-700 font-extrabold">{info.courseName}</span></span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 font-bold">
                        <Clock size={12} className="text-amber-500" />
                        <span>Applied <span className="font-mono text-amber-700">{info.appliedDate}</span> ({daysElapsed} days {info.degreeReceivedDate ? 'total' : 'elapsed'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial status & quick actions */}
                  <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                    <div className="text-left md:text-right text-xs">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Apply Fee Balance</span>
                      <span className={`font-mono font-extrabold ${outstanding <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {outstanding <= 0 
                          ? `Fully Paid (Rs. ${info.totalFee.toLocaleString()})` 
                          : `Rs. ${outstanding.toLocaleString()} Outstanding`
                        }
                      </span>
                    </div>

                    {/* Progress Status Badge */}
                    <div className="text-left md:text-right text-xs">
                      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Processing Status</span>
                      <span className={`font-black uppercase tracking-wider text-[10px] ${
                        info.status === 'Delivered to Student'
                          ? 'text-emerald-700'
                          : info.status === 'Dispatched' || info.status === 'Received at Hub'
                          ? 'text-purple-700'
                          : 'text-amber-700'
                      }`}>
                        {info.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {outstanding > 0 && (
                        <button
                          onClick={() => {
                            setPayingRecordId(info.id);
                            setPayAmount(outstanding);
                          }}
                          className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                          title="Record Payment"
                        >
                          <DollarSign size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setPrintRecord(info)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        title="Print / Slip"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleEditRecordClick(info)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        title="Edit Record"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(info.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section showing tracking, workflow status, payment history */}
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-purple-50/20 px-5 pb-5 pt-1 border-t border-purple-100/30 space-y-4"
                  >
                    {/* Progress Workflow Timeline Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider">
                          Degree Processing Workflow Progress Track
                        </span>
                        {info.trackingNumber && (
                          <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            Courier Tracking ID: {info.trackingNumber}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 pt-2">
                        {statusesList.map((st, idx) => {
                          const isActive = idx <= currentStatusIndex;
                          const isCurrent = idx === currentStatusIndex;
                          return (
                            <div key={st} className="text-center space-y-1">
                              <div className={`h-1.5 rounded-full transition-all ${
                                isActive 
                                  ? isCurrent ? 'bg-purple-600 shadow-xs' : 'bg-purple-500' 
                                  : 'bg-gray-100'
                              }`} />
                              <span className={`block text-[8px] font-bold ${
                                isCurrent 
                                  ? 'text-purple-700 font-extrabold' 
                                  : isActive 
                                  ? 'text-gray-700' 
                                  : 'text-gray-400'
                              }`}>
                                {st}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      
                      {/* Left: Metadata and Logs */}
                      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs space-y-3">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          Application Specifications
                        </span>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="block text-gray-400 font-bold uppercase text-[9px]">Apply Date</span>
                            <span className="font-mono text-gray-700 font-bold">{info.appliedDate}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 font-bold uppercase text-[9px]">Degree Received Date</span>
                            <span className="font-mono text-gray-700 font-bold">{info.degreeReceivedDate || 'Processing...'}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 font-bold uppercase text-[9px]">Verification Status</span>
                            <span className="font-bold text-purple-700">{info.verificationStatus}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 font-bold uppercase text-[9px]">Time Elapsed</span>
                            <span className="font-bold text-amber-700 font-mono">{daysElapsed} Days total</span>
                          </div>
                        </div>

                        {info.remarks && (
                          <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs italic text-gray-600">
                            <strong>Official Remarks:</strong> {info.remarks}
                          </div>
                        )}
                      </div>

                      {/* Right: Payments history and breakdown */}
                      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-3xs space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              Payment Ledger Logs
                            </span>
                            <button
                              onClick={() => {
                                setPayingRecordId(info.id);
                                setPayAmount(outstanding);
                              }}
                              className="text-[9px] font-bold text-purple-700 hover:text-purple-950 underline"
                            >
                              Receive Payment
                            </button>
                          </div>

                          <div className="space-y-1.5 pt-2 max-h-[100px] overflow-y-auto">
                            {info.paymentHistory.length === 0 ? (
                              <p className="text-[11px] text-gray-400 italic">No payments logged yet.</p>
                            ) : (
                              info.paymentHistory.map((pay) => (
                                <div key={pay.id} className="flex justify-between items-center text-[10px] text-gray-600 font-mono py-1 border-b border-gray-50/50 last:border-0">
                                  <span>{pay.date} ({pay.remarks || 'Deposit'})</span>
                                  <span className="font-black text-emerald-700">Rs. {pay.amount.toLocaleString()}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 font-bold">Total Apply Cost: Rs. {info.totalFee.toLocaleString()}</span>
                          <span className="font-bold text-purple-900">Paid: Rs. {info.amountReceived.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Degree Application / Scheduling Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-150 shadow-xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 flex items-center justify-between text-white">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                <Award size={18} />
                <span>{editingRecord ? 'Edit Degree Record' : 'Apply Student for Degree'}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-5 space-y-4">
              
              {/* Select Student Autofill */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Select Student from Directory (Optional auto-fill)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-gray-50/30 rounded-lg text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="">-- Choose student to auto-populate --</option>
                  {studentRecords.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} ({s.registrationId}) - {s.programSelected}
                    </option>
                  ))}
                  <option value="custom">-- Enter Custom Student Details --</option>
                </select>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    placeholder="Enter Student Name"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Father Name</label>
                  <input
                    type="text"
                    value={customFatherName}
                    onChange={(e) => setCustomFatherName(e.target.value)}
                    placeholder="Enter Father Name"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Number</label>
                  <input
                    type="text"
                    value={customContact}
                    onChange={(e) => setCustomContact(e.target.value)}
                    placeholder="Enter Phone Number"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Program / Course *</label>
                  <input
                    type="text"
                    required
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    placeholder="e.g. B.Ed (1.5 Years)"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Category, Status, Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'Normal' | 'Urgent')}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Applied Date</label>
                  <input
                    type="date"
                    required
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Received Date</label>
                  <input
                    type="date"
                    value={degreeReceivedDate}
                    onChange={(e) => setDegreeReceivedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Degree Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 focus:outline-hidden"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Under Process">Under Process</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Received at Hub">Received at Hub</option>
                    <option value="Delivered to Student">Delivered to Student</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Courier Track No.</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="EMS/TCS Tracking ID"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Verification</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 focus:outline-hidden"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Financial fields */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-purple-800 tracking-wider">Degree Fee Cost (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={totalFee}
                    onChange={(e) => setTotalFee(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-purple-200 rounded-lg text-purple-950 font-bold focus:outline-hidden bg-white"
                  />
                </div>

                {!editingRecord && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-purple-800 tracking-wider">Amount Received (Rs.)</label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-purple-200 rounded-lg text-emerald-900 font-bold focus:outline-hidden bg-white"
                    />
                  </div>
                )}
                {editingRecord && (
                  <div className="flex flex-col justify-center text-xs text-purple-950 font-bold leading-relaxed px-2">
                    <span>Already Paid: Rs. {editingRecord.amountReceived.toLocaleString()}</span>
                    <span>Fee Balance: Rs. {(totalFee - editingRecord.amountReceived).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Official Remarks / Notes</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Verification details, notes, delay reasons..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  {editingRecord ? 'Save Changes' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
      {payingRecordId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-150 shadow-xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={16} />
                <span>Receive Degree Apply Fee</span>
              </h3>
              <button onClick={() => setPayingRecordId(null)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddPaymentSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold text-emerald-800"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-gray-400">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Challan / Hand Cash / Slip Ref"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingRecordId(null)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Degree Print Slip Mock Modal */}
      {printRecord && (
        <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-150 shadow-2xl p-6 space-y-6 relative animate-scale-up">
            <button 
              onClick={() => setPrintRecord(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Print Slip Content */}
            <div className="border border-dashed border-gray-300 p-5 rounded-xl space-y-4 font-sans text-gray-700 text-xs">
              <div className="text-center border-b border-gray-200 pb-3 space-y-1">
                <h4 className="text-sm font-black uppercase text-gray-900 tracking-wider">ALLAMA IQBAL OPEN UNIVERSITY</h4>
                <p className="text-[10px] font-extrabold text-purple-700">Official Degree Challan & Tracking Slip</p>
                <p className="text-[9px] text-gray-400 font-mono">Date Printed: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-2 pt-2 text-[11px]">
                <div><span className="text-gray-400 font-semibold">Student Name:</span> <span className="font-extrabold text-gray-900">{printRecord.studentName}</span></div>
                <div><span className="text-gray-400 font-semibold">Father Name:</span> <span className="font-extrabold text-gray-900">{printRecord.fatherName}</span></div>
                <div><span className="text-gray-400 font-semibold">Registration ID:</span> <span className="font-mono font-bold">{printRecord.studentId}</span></div>
                <div><span className="text-gray-400 font-semibold">Course Name:</span> <span className="font-bold">{printRecord.courseName}</span></div>
                <div><span className="text-gray-400 font-semibold">Category:</span> <span className="font-bold text-red-700 font-mono">{printRecord.category}</span></div>
                <div><span className="text-gray-400 font-semibold">Applied Date:</span> <span className="font-mono font-semibold">{printRecord.appliedDate}</span></div>
                <div><span className="text-gray-400 font-semibold">Verification:</span> <span className="font-bold text-purple-700">{printRecord.verificationStatus}</span></div>
                <div><span className="text-gray-400 font-semibold">Timeline Status:</span> <span className="font-black uppercase tracking-wider text-[9px] text-indigo-700">{printRecord.status}</span></div>
              </div>

              <div className="border-t border-b border-dashed border-gray-200 py-3 flex justify-between items-center bg-gray-50/50 px-3">
                <div>
                  <span className="block text-[9px] text-gray-400 uppercase font-black">Fee Summary</span>
                  <span className="font-bold text-gray-800">Total Fee: Rs. {printRecord.totalFee.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-gray-400 uppercase font-black">Balance Due</span>
                  <span className={`font-mono font-extrabold text-xs ${(printRecord.totalFee - printRecord.amountReceived) <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {(printRecord.totalFee - printRecord.amountReceived) <= 0 ? 'Paid' : `Rs. ${(printRecord.totalFee - printRecord.amountReceived).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                Authorized administrative signature • Secure Student Directory Indexer V2
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPrintRecord(null)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
