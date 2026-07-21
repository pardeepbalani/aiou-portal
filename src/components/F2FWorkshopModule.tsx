import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle,
  Printer, 
  X, 
  Plus, 
  Filter, 
  Users, 
  Coins, 
  History, 
  DollarSign, 
  Edit,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StudentRecord, 
  F2FManager, 
  F2FCandidateRecord, 
  F2FManagerPaymentRecord, 
  F2FCodePaymentRate, 
  F2FManagerPaymentHistory 
} from '../types';
import { 
  fetchAndSyncF2FManagers, 
  saveF2FManager, 
  deleteF2FManager,
  fetchAndSyncF2FCandidates,
  saveF2FCandidate,
  deleteF2FCandidate,
  fetchAndSyncF2FManagerPaymentRecords,
  saveF2FManagerPaymentRecord,
  deleteF2FManagerPaymentRecord
} from '../firebase';

interface F2FWorkshopModuleProps {
  onBackToDashboard: () => void;
  studentRecords: StudentRecord[];
  theme: 'green' | 'blue';
}

export default function F2FWorkshopModule({ onBackToDashboard, studentRecords, theme }: F2FWorkshopModuleProps) {
  const isGreen = theme === 'green';
  
  // App States
  const [managers, setManagers] = useState<F2FManager[]>([]);
  const [candidates, setCandidates] = useState<F2FCandidateRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<F2FManagerPaymentRecord[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Navigation State
  const [selectedManager, setSelectedManager] = useState<F2FManager | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'payments'>('candidates');
  
  // Semester and Year configuration
  const [selectedSemester, setSelectedSemester] = useState<'Spring' | 'Autumn'>('Spring');
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  
  // Search states
  const [managerSearch, setManagerSearch] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  
  // Modals / Dialogs
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [editingManager, setEditingManager] = useState<F2FManager | null>(null);
  const [managerName, setManagerName] = useState<string>('');
  const [managerPhone, setManagerPhone] = useState<string>('');
  
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<F2FCandidateRecord | null>(null);
  const [candSerialNo, setCandSerialNo] = useState<string>('');
  const [candName, setCandName] = useState<string>('');
  const [candFatherName, setCandFatherName] = useState<string>('');
  const [candPhone, setCandPhone] = useState<string>('');
  const [candRegId, setCandRegId] = useState<string>('');
  const [candCode, setCandCode] = useState<string>('');
  const [candCentre, setCandCentre] = useState<string>('');
  const [candReceivable, setCandReceivable] = useState<string>('');
  const [candRemarks, setCandRemarks] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [showStudentDropdown, setShowStudentDropdown] = useState<boolean>(false);
  
  // Code Payment editing states
  const [codeRates, setCodeRates] = useState<F2FCodePaymentRate[]>([]);
  const [editingPaymentRecordId, setEditingPaymentRecordId] = useState<string | null>(null);
  
  // Add payment history item states
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState<boolean>(false);
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payRemarks, setPayRemarks] = useState<string>('');
  
  // Delete confirm states
  const [deleteManagerId, setDeleteManagerId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deletePaymentHistoryId, setDeletePaymentHistoryId] = useState<string | null>(null);
  
  // Print states
  const [printType, setPrintType] = useState<'candidates' | 'payments' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Authentication check
  const checkAuth = (): boolean => {
    const isLoggedIn = localStorage.getItem('aiou_admin_logged_in') === 'true';
    if (!isLoggedIn) {
      alert('Unauthorized! Please log in as an administrator to perform this action.');
      return false;
    }
    return true;
  };

  // Load All Data
  const loadAllData = async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const [mList, cList, pList] = await Promise.all([
        fetchAndSyncF2FManagers(),
        fetchAndSyncF2FCandidates(),
        fetchAndSyncF2FManagerPaymentRecords()
      ]);
      setManagers(mList);
      setCandidates(cList);
      setPaymentRecords(pList);
    } catch (error) {
      console.error('Error fetching F2F records:', error);
      setSyncError('Cloud database sync issue. Currently operating on secure local fallback database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter student directory for auto-fetch
  const filteredStudentDirectory = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    return studentRecords.filter(s => 
      s.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.registrationId.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [studentSearchQuery, studentRecords]);

  // Total Receivable from Candidates
  const totalReceivables = useMemo(() => {
    if (!selectedManager) return 0;
    return candidates
      .filter(c => 
        c.managerId === selectedManager.id && 
        c.semester === selectedSemester && 
        c.year === selectedYear
      )
      .reduce((sum, c) => sum + (c.paymentReceivable || 0), 0);
  }, [candidates, selectedManager, selectedSemester, selectedYear]);

  // Candidates for the selected Manager, Semester, and Year
  const filteredCandidates = useMemo(() => {
    if (!selectedManager) return [];
    return candidates
      .filter(c => 
        c.managerId === selectedManager.id &&
        c.semester === selectedSemester &&
        c.year === selectedYear
      )
      .filter(c => {
        const query = candidateSearch.trim().toLowerCase();
        if (!query) return true;
        return (
          c.candidateName.toLowerCase().includes(query) ||
          c.registrationId.toLowerCase().includes(query) ||
          c.f2fCode.toLowerCase().includes(query) ||
          c.regionalCentre.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.serialNo - b.serialNo);
  }, [candidates, selectedManager, selectedSemester, selectedYear, candidateSearch]);

  // Dynamic grouping and auto-population for Manager Payment tab
  const activePaymentRecord = useMemo(() => {
    if (!selectedManager) return null;
    
    // Find saved payment record first
    const existing = paymentRecords.find(p => 
      p.managerId === selectedManager.id &&
      p.semester === selectedSemester &&
      p.year === selectedYear
    );
    
    return existing || null;
  }, [paymentRecords, selectedManager, selectedSemester, selectedYear]);

  // Synchronize code rates state whenever selectedManager, semester, year, or activePaymentRecord changes
  useEffect(() => {
    if (!selectedManager) return;

    if (activePaymentRecord) {
      // Use existing rates
      setCodeRates(activePaymentRecord.codeRates);
    } else {
      // Auto-compute unique F2F codes and participant count from candidate records
      const candidateRecords = candidates.filter(c => 
        c.managerId === selectedManager.id &&
        c.semester === selectedSemester &&
        c.year === selectedYear
      );

      const codeCounts: { [code: string]: number } = {};
      candidateRecords.forEach(c => {
        const code = c.f2fCode.trim();
        if (code) {
          codeCounts[code] = (codeCounts[code] || 0) + 1;
        }
      });

      const autoRates: F2FCodePaymentRate[] = Object.entries(codeCounts).map(([code, count], idx) => ({
        id: `auto_${code}_${idx}`,
        f2fCode: code,
        perCodeRate: 1000, // Default rate 1000 PKR, editable
        totalCodes: count,
        totalAmount: 1000 * count
      }));

      setCodeRates(autoRates);
    }
  }, [activePaymentRecord, selectedManager, selectedSemester, selectedYear, candidates]);

  // Grand Total calculation for payments
  const grandTotalPayable = useMemo(() => {
    return codeRates.reduce((sum, r) => sum + (r.perCodeRate * r.totalCodes), 0);
  }, [codeRates]);

  // Total paid calculation
  const totalPaid = useMemo(() => {
    if (!activePaymentRecord) return 0;
    return activePaymentRecord.paymentsList.reduce((sum, p) => sum + p.amount, 0);
  }, [activePaymentRecord]);

  // Remaining payable amount
  const remainingPayableAmount = grandTotalPayable - totalPaid;

  // Manage manager add/edit
  const handleOpenManagerModal = (manager: F2FManager | null = null) => {
    if (!checkAuth()) return;
    setEditingManager(manager);
    setFormError(null);
    if (manager) {
      setManagerName(manager.name);
      setManagerPhone(manager.phone);
    } else {
      setManagerName('');
      setManagerPhone('');
    }
    setIsManagerModalOpen(true);
  };

  const handleSaveManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!managerName.trim() || !managerPhone.trim()) {
      setFormError('Please fill out all manager details.');
      return;
    }

    const item: F2FManager = {
      id: editingManager ? editingManager.id : `f2f_mgr_${Date.now()}`,
      name: managerName.trim(),
      phone: managerPhone.trim(),
      createdAt: editingManager ? editingManager.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveF2FManager(item);
      await loadAllData();
      setIsManagerModalOpen(false);
      setEditingManager(null);
    } catch (err) {
      setFormError('Failed to save manager details to database.');
    }
  };

  const handleDeleteManagerClick = (id: string, name: string) => {
    if (!checkAuth()) return;
    setDeleteManagerId(id);
  };

  const handleConfirmDeleteManager = async () => {
    if (!deleteManagerId) return;
    try {
      await deleteF2FManager(deleteManagerId);
      if (selectedManager && selectedManager.id === deleteManagerId) {
        setSelectedManager(null);
      }
      await loadAllData();
      setDeleteManagerId(null);
    } catch (error) {
      alert('Failed to delete manager record.');
    }
  };

  // Candidates Section
  const handleOpenCandidateModal = (cand: F2FCandidateRecord | null = null) => {
    if (!checkAuth()) return;
    setEditingCandidate(cand);
    setFormError(null);
    setStudentSearchQuery('');
    setShowStudentDropdown(false);

    if (cand) {
      setCandSerialNo(cand.serialNo.toString());
      setCandName(cand.candidateName);
      setCandFatherName(cand.fatherName);
      setCandPhone(cand.contactNumber);
      setCandRegId(cand.registrationId);
      setCandCode(cand.f2fCode);
      setCandCentre(cand.regionalCentre);
      setCandReceivable(cand.paymentReceivable.toString());
      setCandRemarks(cand.remarks || '');
    } else {
      // Find maximum serial number
      const managerCands = candidates.filter(c => 
        c.managerId === selectedManager?.id && 
        c.semester === selectedSemester && 
        c.year === selectedYear
      );
      const nextSNo = managerCands.length > 0 
        ? Math.max(...managerCands.map(c => c.serialNo)) + 1 
        : 1;

      setCandSerialNo(nextSNo.toString());
      setCandName('');
      setCandFatherName('');
      setCandPhone('');
      setCandRegId('');
      setCandCode('');
      setCandCentre('');
      setCandReceivable('0');
      setCandRemarks('');
    }
    setIsCandidateModalOpen(true);
  };

  const handleAutofillStudent = (student: StudentRecord) => {
    setCandName(student.studentName);
    setCandFatherName(student.fatherName);
    setCandPhone(student.phoneNumber);
    setCandRegId(student.registrationId);
    setStudentSearchQuery(student.studentName);
    setShowStudentDropdown(false);
  };

  const handleSaveCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedManager) return;
    if (!candName.trim() || !candRegId.trim() || !candCode.trim() || !candCentre.trim() || !candSerialNo.trim()) {
      setFormError('Please fill out all mandatory fields.');
      return;
    }

    const serialNum = parseInt(candSerialNo);
    const receivableNum = parseFloat(candReceivable) || 0;

    if (isNaN(serialNum) || serialNum <= 0) {
      setFormError('S. No. must be a positive integer.');
      return;
    }

    const item: F2FCandidateRecord = {
      id: editingCandidate ? editingCandidate.id : `cand_${Date.now()}`,
      managerId: selectedManager.id,
      semester: selectedSemester,
      year: selectedYear,
      serialNo: serialNum,
      candidateName: candName.trim(),
      fatherName: candFatherName.trim(),
      contactNumber: candPhone.trim(),
      registrationId: candRegId.trim().toUpperCase(),
      f2fCode: candCode.trim().toUpperCase(),
      regionalCentre: candCentre.trim(),
      paymentReceivable: receivableNum,
      remarks: candRemarks.trim() || undefined,
      createdAt: editingCandidate ? editingCandidate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveF2FCandidate(item);
      await loadAllData();
      setIsCandidateModalOpen(false);
      setEditingCandidate(null);
    } catch (error) {
      setFormError('Failed to save candidate record.');
    }
  };

  const handleDeleteCandidateClick = (id: string) => {
    if (!checkAuth()) return;
    setDeleteCandidateId(id);
  };

  const handleConfirmDeleteCandidate = async () => {
    if (!deleteCandidateId) return;
    try {
      await deleteF2FCandidate(deleteCandidateId);
      await loadAllData();
      setDeleteCandidateId(null);
    } catch (error) {
      alert('Failed to delete candidate.');
    }
  };

  // Payments Section
  const handleUpdateCodeRateRow = (idx: number, field: keyof F2FCodePaymentRate, val: any) => {
    const updated = [...codeRates];
    updated[idx] = {
      ...updated[idx],
      [field]: val
    };
    setCodeRates(updated);
  };

  const handleAddCodeRateRow = () => {
    setCodeRates([
      ...codeRates,
      {
        id: `custom_${Date.now()}`,
        f2fCode: '',
        perCodeRate: 1000,
        totalCodes: 1,
        totalAmount: 1000
      }
    ]);
  };

  const handleRemoveCodeRateRow = (idx: number) => {
    const updated = [...codeRates];
    updated.splice(idx, 1);
    setCodeRates(updated);
  };

  const handleSavePaymentLedgerSubmit = async () => {
    if (!selectedManager) return;
    if (!checkAuth()) return;

    // Validate codeRates
    for (const r of codeRates) {
      if (!r.f2fCode.trim()) {
        alert('All payment rows must have a valid F2F Code.');
        return;
      }
    }

    const calculatedCodeRates = codeRates.map(r => ({
      ...r,
      totalAmount: r.perCodeRate * r.totalCodes
    }));

    const finalGrandTotal = calculatedCodeRates.reduce((sum, r) => sum + r.totalAmount, 0);

    const record: F2FManagerPaymentRecord = {
      id: activePaymentRecord ? activePaymentRecord.id : `pay_${selectedManager.id}_${selectedSemester}_${selectedYear}`,
      managerId: selectedManager.id,
      semester: selectedSemester,
      year: selectedYear,
      codeRates: calculatedCodeRates,
      grandTotalPayable: finalGrandTotal,
      paymentsList: activePaymentRecord ? activePaymentRecord.paymentsList : [],
      totalPaidAmount: activePaymentRecord ? activePaymentRecord.totalPaidAmount : 0,
      remainingPayable: finalGrandTotal - (activePaymentRecord ? activePaymentRecord.totalPaidAmount : 0),
      createdAt: activePaymentRecord ? activePaymentRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveF2FManagerPaymentRecord(record);
      await loadAllData();
      alert('F2F Manager Payment Ledger Saved Successfully!');
    } catch (error) {
      alert('Error saving payment ledger.');
    }
  };

  const handleAddPaymentHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;
    if (!checkAuth()) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    // Ensure we have a saved ledger first
    let ledger = activePaymentRecord;
    if (!ledger) {
      // Auto save an empty ledger first
      const firstRecord: F2FManagerPaymentRecord = {
        id: `pay_${selectedManager.id}_${selectedSemester}_${selectedYear}`,
        managerId: selectedManager.id,
        semester: selectedSemester,
        year: selectedYear,
        codeRates: codeRates,
        grandTotalPayable: grandTotalPayable,
        paymentsList: [],
        totalPaidAmount: 0,
        remainingPayable: grandTotalPayable,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveF2FManagerPaymentRecord(firstRecord);
      ledger = firstRecord;
    }

    const newPayment: F2FManagerPaymentHistory = {
      id: `p_hist_${Date.now()}`,
      date: payDate,
      amount: amt,
      remarks: payRemarks.trim() || undefined
    };

    const updatedPaymentsList = [...ledger.paymentsList, newPayment];
    const updatedTotalPaid = updatedPaymentsList.reduce((sum, p) => sum + p.amount, 0);
    const updatedGrandTotal = ledger.grandTotalPayable;

    const updatedLedger: F2FManagerPaymentRecord = {
      ...ledger,
      paymentsList: updatedPaymentsList,
      totalPaidAmount: updatedTotalPaid,
      remainingPayable: updatedGrandTotal - updatedTotalPaid,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveF2FManagerPaymentRecord(updatedLedger);
      await loadAllData();
      setIsAddPaymentOpen(false);
      setPayAmount('');
      setPayRemarks('');
    } catch (error) {
      alert('Failed to register payment.');
    }
  };

  const handleDeletePaymentHistoryItem = async (histId: string) => {
    if (!activePaymentRecord) return;
    if (!checkAuth()) return;

    const updatedPaymentsList = activePaymentRecord.paymentsList.filter(p => p.id !== histId);
    const updatedTotalPaid = updatedPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    const updatedLedger: F2FManagerPaymentRecord = {
      ...activePaymentRecord,
      paymentsList: updatedPaymentsList,
      totalPaidAmount: updatedTotalPaid,
      remainingPayable: activePaymentRecord.grandTotalPayable - updatedTotalPaid,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveF2FManagerPaymentRecord(updatedLedger);
      await loadAllData();
    } catch (error) {
      alert('Failed to delete payment transaction.');
    }
  };

  // Print execution triggers
  const handleTriggerPrint = (type: 'candidates' | 'payments') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* Printable Area - Hidden during standard screen views */}
      {printType && (
        <div className="hidden print:block p-8 space-y-6 bg-white text-black font-sans">
          <div className="text-center border-b-2 border-gray-900 pb-4">
            <h1 className="text-2xl font-black uppercase tracking-tight">Allama Iqbal Open University</h1>
            <h2 className="text-lg font-bold">Face-to-Face Workshop Management Ledger</h2>
            <p className="text-xs text-gray-500 font-mono">Printed on: {new Date().toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs border border-gray-300 p-4 rounded-lg bg-gray-50/50">
            <div>
              <p><strong>F2F Manager:</strong> {selectedManager?.name}</p>
              <p><strong>Contact Number:</strong> {selectedManager?.phone}</p>
            </div>
            <div className="text-right">
              <p><strong>Academic Semester:</strong> {selectedSemester} - {selectedYear}</p>
              <p><strong>Report Class:</strong> {printType === 'candidates' ? 'Candidate Registration Directory' : 'Manager Accounts Disbursement Statement'}</p>
            </div>
          </div>

          {printType === 'candidates' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b border-gray-400 pb-1">Registered Workshop Candidates</h3>
              <table className="w-full text-left text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border border-gray-300">S. No.</th>
                    <th className="p-2 border border-gray-300">Candidate Name</th>
                    <th className="p-2 border border-gray-300">Father's Name</th>
                    <th className="p-2 border border-gray-300">Reg. ID</th>
                    <th className="p-2 border border-gray-300">Contact</th>
                    <th className="p-2 border border-gray-300">F2F Code</th>
                    <th className="p-2 border border-gray-300">Regional Centre</th>
                    <th className="p-2 border border-gray-300 text-right">Receivable (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((c) => (
                    <tr key={c.id} className="border-b border-gray-200">
                      <td className="p-2 border border-gray-300 font-mono">{c.serialNo}</td>
                      <td className="p-2 border border-gray-300 font-bold">{c.candidateName}</td>
                      <td className="p-2 border border-gray-300">{c.fatherName}</td>
                      <td className="p-2 border border-gray-300 font-mono">{c.registrationId}</td>
                      <td className="p-2 border border-gray-300 font-mono">{c.contactNumber}</td>
                      <td className="p-2 border border-gray-300 font-mono">{c.f2fCode}</td>
                      <td className="p-2 border border-gray-300">{c.regionalCentre}</td>
                      <td className="p-2 border border-gray-300 text-right font-mono font-bold">Rs. {c.paymentReceivable.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t border-gray-400 font-bold">
                    <td colSpan={7} className="p-2 border border-gray-300 text-right">Grand Total Receivables:</td>
                    <td className="p-2 border border-gray-300 text-right font-mono">Rs. {totalReceivables.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {printType === 'payments' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-gray-400 pb-1">Course Code Rate breakdown</h3>
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-2 border border-gray-300">F2F Course Code</th>
                      <th className="p-2 border border-gray-300 text-right">Rate per code (PKR)</th>
                      <th className="p-2 border border-gray-300 text-right">Total registered codes</th>
                      <th className="p-2 border border-gray-300 text-right">Net payable (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codeRates.map((r, idx) => (
                      <tr key={r.id || idx} className="border-b border-gray-200">
                        <td className="p-2 border border-gray-300 font-mono font-bold">{r.f2fCode}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">Rs. {r.perCodeRate.toLocaleString()}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{r.totalCodes}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono font-bold">Rs. {(r.perCodeRate * r.totalCodes).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold border-t border-gray-400">
                      <td colSpan={3} className="p-2 border border-gray-300 text-right">Grand Total Payable:</td>
                      <td className="p-2 border border-gray-300 text-right font-mono">Rs. {grandTotalPayable.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b border-gray-400 pb-1">Payments Disbursement History</h3>
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-2 border border-gray-300">Disbursement Date</th>
                      <th className="p-2 border border-gray-300 text-right">Amount Disbursed (PKR)</th>
                      <th className="p-2 border border-gray-300">Audit Remarks / Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePaymentRecord?.paymentsList.map((p) => (
                      <tr key={p.id} className="border-b border-gray-200">
                        <td className="p-2 border border-gray-300 font-mono">{p.date}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono font-bold">Rs. {p.amount.toLocaleString()}</td>
                        <td className="p-2 border border-gray-300 italic text-gray-600">{p.remarks || 'N/A'}</td>
                      </tr>
                    ))}
                    {(!activePaymentRecord || activePaymentRecord.paymentsList.length === 0) && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-400 italic">No previous payouts have been recorded for this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border border-gray-400 p-4 rounded-lg bg-gray-50 flex justify-between items-center text-xs font-bold">
                <span>Net Accounts status:</span>
                <div className="text-right space-y-1">
                  <p>Total Payable: <span className="font-mono">Rs. {grandTotalPayable.toLocaleString()}</span></p>
                  <p>Total Paid: <span className="font-mono text-emerald-700">Rs. {totalPaid.toLocaleString()}</span></p>
                  <p className="text-sm border-t border-gray-300 pt-1">Remaining Dues: <span className="font-mono text-red-600">Rs. {remainingPayableAmount.toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end pt-12 text-xs">
            <div className="text-center w-40 border-t border-gray-400 pt-1">
              F2F Workshop Manager Signature
            </div>
            <div className="text-center w-40 border-t border-gray-400 pt-1">
              Authorized Registrar Signature
            </div>
          </div>
          
          {/* Button to close printed state on screen */}
          <button 
            onClick={() => setPrintType(null)} 
            className="print:hidden mt-6 bg-red-600 text-white px-4 py-2 rounded-lg font-bold w-full"
          >
            Close Print Preview & Return
          </button>
        </div>
      )}

      {/* Screen Interactive UI */}
      <div className="print:hidden">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs">
          <div className="flex items-center gap-3">
            <button
              onClick={selectedManager ? () => setSelectedManager(null) : onBackToDashboard}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isGreen ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Users size={22} className={isGreen ? 'text-emerald-500' : 'text-sky-500'} />
                <span>Face-to-Face Workshop Management Module</span>
              </h2>
              <p className="text-xs text-gray-500">
                {selectedManager 
                  ? `Administering Manager: ${selectedManager.name} (${selectedManager.phone})` 
                  : 'Manage decentralized workshop directors, candidate registers, tuition receivables, and payout balances.'}
              </p>
            </div>
          </div>

          {!selectedManager && (
            <button
              onClick={() => handleOpenManagerModal()}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs cursor-pointer transition-transform hover:scale-103 ${
                isGreen ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-sky-600 text-white hover:bg-sky-700'
              }`}
            >
              <PlusSquare size={16} />
              <span>Add F2F Manager</span>
            </button>
          )}
        </div>

        {/* Sync or quota messages */}
        {syncError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xs p-12 text-center space-y-3">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto ${
              isGreen ? 'border-emerald-600' : 'border-sky-600'
            }`} />
            <p className="text-xs text-gray-500 font-bold">Synchronizing database indices with Firestore cloud servers...</p>
          </div>
        ) : (
          <div>
            
            {/* MANAGER SELECTION DIRECTORY (Home Screen of module) */}
            {!selectedManager ? (
              <div className="space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    placeholder="Search F2F Managers by name or contact telephone..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Managers Grid */}
                {managers.filter(m => {
                  const query = managerSearch.trim().toLowerCase();
                  return !query || m.name.toLowerCase().includes(query) || m.phone.includes(query);
                }).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-150 shadow-2xs p-12 text-center text-gray-400 italic">
                    No Face-to-Face Workshop Managers found. Click "Add F2F Manager" above to seed a new manager record.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managers.filter(m => {
                      const query = managerSearch.trim().toLowerCase();
                      return !query || m.name.toLowerCase().includes(query) || m.phone.includes(query);
                    }).map((manager) => {
                      // Calculate active candidates count for this manager
                      const candCount = candidates.filter(c => c.managerId === manager.id).length;
                      return (
                        <div
                          key={manager.id}
                          className="bg-white border border-gray-150 p-5 rounded-2xl shadow-3xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
                        >
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">
                              {manager.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                              <Phone size={12} />
                              <span>{manager.phone}</span>
                            </p>
                          </div>

                          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500 font-bold">
                            <span>{candCount} Candidates total</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenManagerModal(manager)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                                title="Edit Manager Details"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteManagerClick(manager.id, manager.name)}
                                className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600"
                                title="Delete Manager"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedManager(manager);
                                  setActiveTab('candidates');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-white font-black text-[11px] ${
                                  isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                                }`}
                              >
                                Manage
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              
              // INDIVIDUAL SELECTED MANAGER VIEW
              <div className="space-y-6">
                
                {/* Tab Switcher & Semester/Year Selector Dashboard panel */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Tabs */}
                  <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setActiveTab('candidates')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        activeTab === 'candidates'
                          ? (isGreen ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white')
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <GraduationCap size={15} />
                      <span>(A) F2F Candidate Records</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        activeTab === 'payments'
                          ? (isGreen ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white')
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Coins size={15} />
                      <span>(B) Payment to Manager</span>
                    </button>
                  </div>

                  {/* Filter Criteria (Semester, Year) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-700">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-xl">
                      <Filter size={14} className="text-gray-400" />
                      <span>Semester:</span>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value as 'Spring' | 'Autumn')}
                        className="bg-transparent border-none p-0 focus:outline-hidden text-gray-900 font-extrabold cursor-pointer"
                      >
                        <option value="Spring">Spring</option>
                        <option value="Autumn">Autumn</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-xl">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Year:</span>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none p-0 focus:outline-hidden text-gray-900 font-extrabold cursor-pointer"
                      >
                        {[2024, 2025, 2026, 2027, 2028].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* TAB 1: CANDIDATES MANAGEMENT */}
                {activeTab === 'candidates' && (
                  <div className="space-y-4">
                    
                    {/* Header Action Row & KPI Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      
                      {/* Search & Add */}
                      <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={candidateSearch}
                            onChange={(e) => setCandidateSearch(e.target.value)}
                            placeholder="Query registered candidate by name, ID, or F2F Code..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl text-xs focus:outline-hidden shadow-3xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenCandidateModal()}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-white cursor-pointer ${
                              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                          >
                            <Plus size={14} />
                            <span>Add Candidate</span>
                          </button>
                          <button
                            onClick={() => handleTriggerPrint('candidates')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
                            title="Print Candidates Ledger"
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>

                      {/* KPI Card */}
                      <div className="bg-white border border-gray-150 p-3.5 rounded-2xl flex items-center justify-between shadow-3xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Total Receivables</span>
                          <span className="text-lg font-black text-gray-900 font-mono">Rs. {totalReceivables.toLocaleString()}</span>
                        </div>
                        <div className={`p-2 rounded-xl ${isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                          <DollarSign size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-extrabold uppercase tracking-wider">
                              <th className="p-4 w-16">S. No.</th>
                              <th className="p-4">Candidate Information</th>
                              <th className="p-4">Reg. ID</th>
                              <th className="p-4">F2F Code</th>
                              <th className="p-4">Centre</th>
                              <th className="p-4 text-right">Receivable (PKR)</th>
                              <th className="p-4">Remarks</th>
                              <th className="p-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredCandidates.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                                  No candidates registered for this manager in {selectedSemester} {selectedYear}. Click "Add Candidate" to begin enrollment.
                                </td>
                              </tr>
                            ) : (
                              filteredCandidates.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 font-mono font-bold text-gray-400">{c.serialNo}</td>
                                  <td className="p-4 space-y-0.5">
                                    <div className="font-extrabold text-gray-900">{c.candidateName}</div>
                                    <div className="text-[10px] text-gray-500">F/N: {c.fatherName || 'N/A'}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{c.contactNumber}</div>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-gray-800">{c.registrationId}</td>
                                  <td className="p-4 font-mono font-extrabold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded-md w-fit">
                                    {c.f2fCode}
                                  </td>
                                  <td className="p-4 text-gray-600">{c.regionalCentre}</td>
                                  <td className="p-4 text-right font-mono font-black text-gray-900">
                                    Rs. {c.paymentReceivable.toLocaleString()}
                                  </td>
                                  <td className="p-4 text-gray-500 italic max-w-xs truncate" title={c.remarks}>
                                    {c.remarks || '-'}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex justify-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenCandidateModal(c)}
                                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCandidateClick(c.id)}
                                        className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 cursor-pointer"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MANAGER PAYMENTS */}
                {activeTab === 'payments' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left & Center: Payments Breakdown Ledger */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Code Payments Table */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="font-extrabold text-gray-800 text-sm">Course/Code-wise Payout Rates</h3>
                            <p className="text-[10px] text-gray-400">Specify rates per workshop code. Press Add to append custom course codes.</p>
                          </div>
                          <button
                            onClick={handleAddCodeRateRow}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-white cursor-pointer ${
                              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                          >
                            <Plus size={12} />
                            <span>Add Code</span>
                          </button>
                        </div>

                        {codeRates.length === 0 ? (
                          <div className="text-center p-6 text-gray-400 italic text-xs">
                            No F2F Codes identified. Register candidates first or click "Add Code" above to input payout codes manually.
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                            {codeRates.map((row, idx) => (
                              <div key={row.id || idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-150">
                                
                                {/* Code input */}
                                <div className="col-span-4">
                                  <label className="text-[9px] font-extrabold text-gray-400 block uppercase">F2F Code</label>
                                  <input
                                    type="text"
                                    value={row.f2fCode}
                                    onChange={(e) => handleUpdateCodeRateRow(idx, 'f2fCode', e.target.value.toUpperCase())}
                                    placeholder="e.g., 8611"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono font-bold uppercase focus:outline-hidden"
                                  />
                                </div>

                                {/* Per Code Rate */}
                                <div className="col-span-3">
                                  <label className="text-[9px] font-extrabold text-gray-400 block uppercase">Rate (PKR)</label>
                                  <input
                                    type="number"
                                    value={row.perCodeRate || ''}
                                    onChange={(e) => handleUpdateCodeRateRow(idx, 'perCodeRate', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono focus:outline-hidden"
                                  />
                                </div>

                                {/* Total Codes count */}
                                <div className="col-span-2">
                                  <label className="text-[9px] font-extrabold text-gray-400 block uppercase">Quantity</label>
                                  <input
                                    type="number"
                                    value={row.totalCodes || ''}
                                    onChange={(e) => handleUpdateCodeRateRow(idx, 'totalCodes', parseInt(e.target.value) || 0)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-mono focus:outline-hidden"
                                  />
                                </div>

                                {/* Auto-computed subtotal */}
                                <div className="col-span-2 text-right">
                                  <span className="text-[9px] font-extrabold text-gray-400 block uppercase">Total</span>
                                  <span className="text-xs font-mono font-black text-gray-900">
                                    Rs. {(row.perCodeRate * row.totalCodes).toLocaleString()}
                                  </span>
                                </div>

                                {/* Remove row */}
                                <div className="col-span-1 text-center">
                                  <button
                                    onClick={() => handleRemoveCodeRateRow(idx)}
                                    className="p-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer mt-3"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                              </div>
                            ))}
                          </div>
                        )}

                        {/* Grand Total Footer */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
                          <span className="text-xs font-extrabold text-gray-800 uppercase">Grand Total Payable Amount:</span>
                          <span className="text-lg font-black text-gray-900 font-mono">Rs. {grandTotalPayable.toLocaleString()}</span>
                        </div>

                        {/* Save rates trigger */}
                        <button
                          onClick={handleSavePaymentLedgerSubmit}
                          className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-xs ${
                            isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                          }`}
                        >
                          Save Code Payment Rates Structure
                        </button>
                      </div>

                      {/* Payment History Table */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="font-extrabold text-gray-800 text-sm">Disbursement Payment Transactions</h3>
                            <p className="text-[10px] text-gray-400">Historical logs of payments disbursed to this manager.</p>
                          </div>
                          <button
                            onClick={() => setIsAddPaymentOpen(!isAddPaymentOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[10px] font-extrabold text-gray-700 cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>Record Payment</span>
                          </button>
                        </div>

                        {/* Slide-out form to record transaction */}
                        <AnimatePresence>
                          {isAddPaymentOpen && (
                            <motion.form
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              onSubmit={handleAddPaymentHistorySubmit}
                              className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-3 overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                  <label className="font-bold text-gray-600">Payment Date</label>
                                  <input
                                    type="date"
                                    value={payDate}
                                    onChange={(e) => setPayDate(e.target.value)}
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 font-mono focus:outline-hidden"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-gray-600">Disbursement Amount (PKR)</label>
                                  <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder={remainingPayableAmount.toString()}
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 font-mono focus:outline-hidden"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1 text-xs">
                                <label className="font-bold text-gray-600">Remarks / Transaction Ref</label>
                                <input
                                  type="text"
                                  value={payRemarks}
                                  onChange={(e) => setPayRemarks(e.target.value)}
                                  placeholder="e.g. Bank Voucher Ref #43118"
                                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:outline-hidden"
                                />
                              </div>
                              <div className="flex justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setIsAddPaymentOpen(false)}
                                  className="px-3 py-1.5 border border-gray-200 rounded-lg font-bold hover:bg-gray-100 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className={`px-3 py-1.5 text-white rounded-lg font-extrabold cursor-pointer ${
                                    isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                                  }`}
                                >
                                  Disburse Payment
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>

                        {/* Payments List table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-gray-50/50 border-b border-gray-150 text-gray-500 font-extrabold">
                                <th className="p-3">Payment Date</th>
                                <th className="p-3 text-right">Amount (PKR)</th>
                                <th className="p-3">Remarks / References</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!activePaymentRecord || activePaymentRecord.paymentsList.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                                    No disbursed payment transactions recorded yet. Click "Record Payment" to process accounts payout.
                                  </td>
                                </tr>
                              ) : (
                                activePaymentRecord.paymentsList.map((p) => (
                                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/30">
                                    <td className="p-3 font-mono font-bold text-gray-600">{p.date}</td>
                                    <td className="p-3 text-right font-mono font-black text-emerald-700">
                                      Rs. {p.amount.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-gray-600 italic">{p.remarks || 'N/A'}</td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleDeletePaymentHistoryItem(p.id)}
                                        className="p-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
                                        title="Delete Transaction"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Ledger Summary Panel & Invoice Print */}
                    <div className="space-y-4">
                      
                      {/* Financial Audit Sheet card */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-3xs text-xs">
                        <div className="border-b border-gray-100 pb-3 flex items-center gap-1.5">
                          <History size={16} className={isGreen ? 'text-emerald-500' : 'text-sky-500'} />
                          <h3 className="font-extrabold text-gray-800">Payout Settlement Summary</h3>
                        </div>

                        <div className="space-y-3.5">
                          
                          <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                            <span className="font-bold text-gray-500">Gross Payable:</span>
                            <span className="font-mono font-black text-gray-900">Rs. {grandTotalPayable.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between items-center bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100">
                            <span className="font-bold text-emerald-800">Total Settled:</span>
                            <span className="font-mono font-black text-emerald-700">Rs. {totalPaid.toLocaleString()}</span>
                          </div>

                          <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
                            remainingPayableAmount > 0 
                              ? 'bg-red-50/30 border-red-100 text-red-800' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            <span className="font-bold">Net Remaining:</span>
                            <span className="font-mono font-black text-sm">Rs. {remainingPayableAmount.toLocaleString()}</span>
                          </div>

                        </div>

                        <button
                          onClick={() => handleTriggerPrint('payments')}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-extrabold cursor-pointer shadow-3xs"
                        >
                          <Printer size={15} />
                          <span>Print Payment Statement</span>
                        </button>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* 1. ADD / EDIT MANAGER DIALOG MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {isManagerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in print:hidden">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800 text-sm">
                  {editingManager ? 'Update F2F Manager Record' : 'Register New Face-to-Face Manager'}
                </h3>
                <button
                  onClick={() => setIsManagerModalOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-50 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveManagerSubmit} className="p-5 space-y-4 text-xs">
                {formError && (
                  <div className="bg-red-50 border border-red-150 text-red-800 p-2.5 rounded-lg flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600">Manager Full Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g., Professor Muhammad Khalid"
                      required
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600">Contact Number (WhatsApp/Phone) *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      placeholder="e.g., +923001234567"
                      required
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsManagerModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg font-extrabold cursor-pointer shadow-xs ${
                      isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    {editingManager ? 'Update Manager' : 'Register Manager'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 2. ADD / EDIT CANDIDATE DIALOG MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {isCandidateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in print:hidden overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800 text-sm">
                  {editingCandidate ? 'Update Candidate registration details' : 'Register F2F Workshop Candidate'}
                </h3>
                <button
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-50 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveCandidateSubmit} className="p-5 space-y-4 text-xs">
                {formError && (
                  <div className="bg-red-50 border border-red-150 text-red-800 p-2.5 rounded-lg flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* S.No. & Search Selector */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3 space-y-1">
                    <label className="font-bold text-gray-600">S. No. *</label>
                    <input
                      type="number"
                      value={candSerialNo}
                      onChange={(e) => setCandSerialNo(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-9 space-y-1 relative">
                    <label className="font-bold text-gray-600 text-emerald-700 flex items-center gap-1">
                      <span>Auto-Fetch Student Directory</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded">Lookup</span>
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => {
                          setStudentSearchQuery(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        placeholder="Type student name or Registration ID to pre-populate..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden"
                      />
                    </div>

                    {/* Student Lookup Dropdown */}
                    {showStudentDropdown && studentSearchQuery.trim() !== '' && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 divide-y divide-gray-150 max-h-48 overflow-y-auto">
                        {filteredStudentDirectory.length === 0 ? (
                          <div className="p-3 text-center text-gray-400 italic">No students matched directory queries.</div>
                        ) : (
                          filteredStudentDirectory.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => handleAutofillStudent(student)}
                              className="p-2.5 hover:bg-emerald-50/55 cursor-pointer text-left transition-colors flex justify-between items-center"
                            >
                              <div>
                                <p className="font-extrabold text-gray-900">{student.studentName}</p>
                                <p className="text-[10px] text-gray-400 font-mono">F/N: {student.fatherName}</p>
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 rounded border border-gray-1.5">{student.registrationId}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate name, Father name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Candidate Name *</label>
                    <input
                      type="text"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      required
                      placeholder="Student full name"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Father's Name</label>
                    <input
                      type="text"
                      value={candFatherName}
                      onChange={(e) => setCandFatherName(e.target.value)}
                      placeholder="Father's full name"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Registration ID, phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">AIOU Registration ID *</label>
                    <input
                      type="text"
                      value={candRegId}
                      onChange={(e) => setCandRegId(e.target.value.toUpperCase())}
                      required
                      placeholder="e.g. 23FPA09115"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Contact Number</label>
                    <input
                      type="text"
                      value={candPhone}
                      onChange={(e) => setCandPhone(e.target.value)}
                      placeholder="e.g. +923009876543"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* F2F Code, regional centre, receivable */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">F2F Course Code *</label>
                    <input
                      type="text"
                      value={candCode}
                      onChange={(e) => setCandCode(e.target.value.toUpperCase())}
                      required
                      placeholder="e.g. 8611"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Regional Centre *</label>
                    <input
                      type="text"
                      value={candCentre}
                      onChange={(e) => setCandCentre(e.target.value)}
                      required
                      placeholder="e.g. Hyderabad"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Receivable (PKR) *</label>
                    <input
                      type="number"
                      value={candReceivable}
                      onChange={(e) => setCandReceivable(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={candRemarks}
                    onChange={(e) => setCandRemarks(e.target.value)}
                    placeholder="Provide comments or payment references if any"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCandidateModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg font-extrabold cursor-pointer shadow-xs ${
                      isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    {editingCandidate ? 'Update Record' : 'Register Candidate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 3. DELETE CONFIRMATION MODALS */}
      {/* ========================================== */}
      <AnimatePresence>
        {(deleteManagerId || deleteCandidateId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in print:hidden">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-gray-800 text-sm">Verify Irreversible Deletion</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {deleteManagerId 
                      ? 'Deleting this F2F manager will keep associated candidate records but unassign them from active management directories.'
                      : 'This action will completely remove this candidate record from the Face-to-Face Workshop registration directories.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => {
                    setDeleteManagerId(null);
                    setDeleteCandidateId(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteManagerId ? handleConfirmDeleteManager : handleConfirmDeleteCandidate}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-extrabold hover:bg-red-700 cursor-pointer shadow-xs"
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
