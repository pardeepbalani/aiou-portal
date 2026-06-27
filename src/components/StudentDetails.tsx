import React, { useState } from 'react';
import { StudentRecord, CourseData, SemesterData } from '../types';
import { 
  Printer, 
  FileSpreadsheet, 
  FileDown, 
  Edit3, 
  Calendar, 
  User, 
  Phone, 
  Hash, 
  BookOpen, 
  DollarSign, 
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText,
  Plus,
  Receipt,
  Check,
  TrendingUp,
  AlertTriangle,
  Building,
  MessageSquare,
  Send,
  Copy
} from 'lucide-react';

interface StudentDetailsProps {
  student: StudentRecord;
  onEdit: () => void;
  onClose: () => void;
  onUpdateStudent?: (updated: StudentRecord) => Promise<void>;
  theme: 'green' | 'blue';
}

export default function StudentDetails({
  student,
  onEdit,
  onClose,
  onUpdateStudent,
  theme,
}: StudentDetailsProps) {
  const isGreen = theme === 'green';

  // Toggle state to switch between regular view, PDF/transcript Mode, and Challan Mode
  const [pdfModeActive, setPdfModeActive] = useState(false);
  const [challanModeActive, setChallanModeActive] = useState(false);

  // New Payment Form states
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calculate payment details
  const totalPaid = student.paymentsList?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = student.totalReceivable - totalPaid;

  // Smart Communication templates state
  const [selectedTemplate, setSelectedTemplate] = useState<'fee' | 'deadline' | 'workshop' | 'welcome'>('fee');
  const [copied, setCopied] = useState(false);

  const getTemplateText = () => {
    const activeCoursesStr = student.semesters
      .flatMap(s => s.courses)
      .filter(c => c.code && c.code.trim())
      .map(c => c.code)
      .join(', ');

    switch (selectedTemplate) {
      case 'fee':
        return `Dear ${student.studentName},\n\nThis is a friendly reminder from AIOU Support regarding your outstanding dues for the ${student.programSelected} program.\n\n*Fee Breakdown*:\n- Total Receivable: Rs. ${student.totalReceivable?.toLocaleString()}\n- Total Paid: Rs. ${totalPaid.toLocaleString()}\n- *Outstanding Balance: Rs. ${balance.toLocaleString()}*\n\nPlease deposit your outstanding fee using Challan No: AIOU-${student.registrationId} at ABL, MCB or Alfalah banks. Kindly share a picture or screenshot of the payment receipt once deposited so we can log it.\n\nThank you,\nAcademic Administrative Support`;
      case 'deadline':
        return `Dear ${student.studentName},\n\nWe would like to remind you that several assignments, quizzes, or workshop checkpoints for your ${student.programSelected} program courses are currently showing as incomplete in our student tracking records.\n\n*LMS Portal Login Details*:\n- Portal URL: https://academic.aiou.edu.pk\n- Registration ID/Login: ${student.registrationId}\n- LMS Password ID: ${student.lmsPasswordId || 'Check Profile'}\n- CMS Password ID: ${student.cmsPasswordId || 'Check Profile'}\n\nPlease update your submissions at your earliest convenience to maintain passing grades. For any technical support, feel free to reply.\n\nBest regards,\nAIOU Support Desk`;
      case 'workshop':
        return `Dear ${student.studentName},\n\nThis is an urgent workshop attendance alert for your ${student.programSelected} courses (${activeCoursesStr || 'selected courses'}).\n\nAttending Allama Iqbal Open University online workshops is mandatory. Students with low workshop attendance run the risk of failing the semester. Please log in to your Microsoft Teams / LMS Portal during your active schedule to mark your attendance.\n\nRegards,\nWorkshop Attendance Coordinator`;
      case 'welcome':
        return `Dear ${student.studentName},\n\nCongratulations! Your enrollment registration for ${student.programSelected} (${student.semesterType} Cycle - ${student.admissionYear}) is officially confirmed.\n\n*Your Student Portal Access Details*:\n- CMS Registration ID: ${student.registrationId}\n- CMS Portal Password: ${student.cmsPasswordId || 'Not Set'}\n- LMS Portal Password: ${student.lmsPasswordId || 'Not Set'}\n\nWe are excited to support you on your educational journey. Please save our number for future updates!\n\nBest wishes,\nAdmissions Office`;
      default:
        return '';
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getTemplateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Course status inline checkboxes toggle
  const handleToggleCourseCheck = async (
    semNum: number, 
    courseCode: string, 
    field: 'assignment' | 'workshop' | 'quiz' | 'assignment1' | 'assignment2'
  ) => {
    if (!onUpdateStudent) return;

    // Deep copy semesters
    const updatedSemesters = student.semesters.map(sem => {
      if (sem.semesterNumber === semNum) {
        return {
          ...sem,
          courses: sem.courses.map(course => {
            if (course.code === courseCode) {
              return {
                ...course,
                [field]: !course[field]
              };
            }
            return course;
          })
        };
      }
      return sem;
    });

    const updatedStudent: StudentRecord = {
      ...student,
      semesters: updatedSemesters,
      updatedAt: new Date().toISOString()
    };

    await onUpdateStudent(updatedStudent);
  };

  // Add payment action
  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess(false);

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Please enter a valid payment amount (greater than 0).');
      return;
    }

    if (!paymentRef.trim()) {
      setPaymentError('Please provide a Voucher / Transaction Reference ID.');
      return;
    }

    if (!onUpdateStudent) return;

    const newPayment = {
      id: 'pay-' + Date.now(),
      amount: amountNum,
      date: paymentDate,
      voucherRef: paymentRef.trim()
    };

    const currentPayments = student.paymentsList || [];
    const updatedStudent: StudentRecord = {
      ...student,
      paymentsList: [...currentPayments, newPayment],
      updatedAt: new Date().toISOString()
    };

    try {
      await onUpdateStudent(updatedStudent);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch (err) {
      setPaymentError('Could not post payment. Please check your network connection.');
    }
  };

  // EXCEL / CSV DOWNLOAD EXPORT FUNCTION
  const handleExportToCSV = () => {
    const headers = ['Field', 'Value / Detail'];
    const rows: string[][] = [
      ['AIOU Student Record Sheet', ''],
      ['Export Date', new Date().toLocaleDateString()],
      ['', ''],
      ['STUDENT PERSONAL INFORMATION', ''],
      ['Student Name', student.studentName],
      ['Father Name', student.fatherName || 'N/A'],
      ['Phone Number', student.phoneNumber || 'N/A'],
      ['', ''],
      ['OFFICIAL REGISTRATION & PROGRAM IDS', ''],
      ['Registration ID', student.registrationId],
      ['LMS Password ID', student.lmsPasswordId || 'N/A'],
      ['CMS Password ID', student.cmsPasswordId || 'N/A'],
      ['', ''],
      ['ADMISSION STATUS', ''],
      ['Admission Year', student.admissionYear],
      ['Program / Course Selected', student.programSelected],
      ['Semester Cycle', student.semesterType],
      ['Status', student.status.toUpperCase()],
      ['', ''],
      ['FINANCIAL SUMMARY', ''],
      ['Total Receivable Fees', `Rs. ${student.totalReceivable}`],
      ['Total Received Over Time', `Rs. ${totalPaid}`],
      ['Remaining Balance due', `Rs. ${balance}`],
      ['Service Charges Amount', `Rs. ${student.serviceChargesAmount || 0}`],
      ['Remarks', student.remarks || 'N/A'],
      ['', ''],
      ['SERVICES REQUIRED CHECKLIST', ''],
      ['Service Charges Against Enrollment', student.serviceEnrollment ? 'Yes' : 'No'],
      ['Service Charges Against Workshops', student.serviceWorkshops ? 'Yes' : 'No'],
      ['Service Charges Against Quiz', student.serviceQuiz ? 'Yes' : 'No'],
      ['Service Charges Against Assignments', student.serviceAssignments ? 'Yes' : 'No'],
      ['Service Charges Against Physical Workshop', student.servicePhysicalWorkshop ? 'Yes' : 'No'],
      ['Service Charges Against Research Report', student.serviceResearchReport ? 'Yes' : 'No'],
    ];

    rows.push(['', '']);
    rows.push(['ACADEMIC SEMESTERS COURSE COMPLETION', '']);
    
    student.semesters.forEach((sem) => {
      rows.push([`SEMESTER ${sem.semesterNumber}`, '']);
      rows.push(['Course Code', 'Workshop', 'Quiz', 'Assignment 1', 'Assignment 2']);
      sem.courses.forEach((c) => {
        if (c.code) {
          rows.push([
            c.code,
            c.workshop ? 'Completed' : 'Not Completed',
            c.quiz ? 'Completed' : 'Not Completed',
            c.assignment1 ? 'Completed' : 'Not Completed',
            c.assignment2 ? 'Completed' : 'Not Completed',
          ]);
        }
      });
      rows.push(['', '']);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AIOU_Record_${student.registrationId}_${student.studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintScreen = () => {
    window.print();
  };

  // Auto calculate itemized Challan values
  const challanDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const tuitionFee = student.totalReceivable - (student.serviceChargesAmount || 0);
  const supportFee = student.serviceChargesAmount || 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Printable Style overrides */}
      <style>{`
        @media print {
          header, 
          #header-back-button, 
          #header-logout-button,
          .interactive-actions,
          .back-nav-container,
          .pdf-toggle-banner,
          .ledger-form-section {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .printable-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Apply Landscape layout specifically if printing Challan copy */
          .challan-print-container {
            width: 100% !important;
            max-width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            gap: 15px !important;
            font-size: 10px !important;
          }
          .challan-part {
            flex: 1 !important;
            border-right: 1px dashed #000 !important;
            padding-right: 15px !important;
          }
          .challan-part:last-child {
            border-right: none !important;
            padding-right: 0 !important;
          }
        }
      `}</style>

      {/* Navigation & Controls header (Hidden in print) */}
      <div className="interactive-actions flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Directory</span>
          </button>
          
          <button
            onClick={onEdit}
            id="details-edit-record-button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white transition-colors cursor-pointer ${
              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            <Edit3 size={16} />
            <span>Edit Information</span>
          </button>
        </div>

        {/* Action Button Set */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Challan View toggle */}
          <button
            onClick={() => {
              setChallanModeActive(!challanModeActive);
              setPdfModeActive(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              challanModeActive 
                ? 'bg-rose-100 border-rose-300 text-rose-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Receipt size={14} className="text-rose-600" />
            <span>{challanModeActive ? 'Exit Challan Mode' : 'Print AIOU Challan'}</span>
          </button>

          {/* Transcript / Report Toggle Mode */}
          <button
            onClick={() => {
              setPdfModeActive(!pdfModeActive);
              setChallanModeActive(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              pdfModeActive 
                ? 'bg-amber-100 border-amber-300 text-amber-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <FileText size={14} className="text-amber-600" />
            <span>{pdfModeActive ? 'Exit Transcript Layout' : 'Toggle Official Transcript'}</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 rounded-lg text-gray-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export to Excel</span>
          </button>

          {/* Print option */}
          <button
            onClick={handlePrintScreen}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 rounded-lg text-gray-700 transition-all cursor-pointer"
          >
            <Printer size={14} className="text-sky-600" />
            <span>Print Current Page</span>
          </button>
        </div>
      </div>

      {/* PDF View Banner message */}
      {pdfModeActive && (
        <div className="pdf-toggle-banner mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">📄 Official Transcript Mode is Active.</span>
            <span className="hidden sm:inline">The student details are pre-formatted for printing an elegant, structured transcript.</span>
          </div>
          <button
            onClick={handlePrintScreen}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Print / Save Transcript PDF
          </button>
        </div>
      )}

      {/* Challan View Banner message */}
      {challanModeActive && (
        <div className="pdf-toggle-banner mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-900 text-sm rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">🎫 Official AIOU Fee Challan is Active.</span>
            <span className="hidden sm:inline">Structured in classic Tripartite format (Bank Copy, University Copy, Student Copy). Set printer to Landscape for best results.</span>
          </div>
          <button
            onClick={handlePrintScreen}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer animate-pulse"
          >
            Print Official Landscape Challan
          </button>
        </div>
      )}

      {/* RENDER DYNAMIC TRIPARTITE FEES CHALLAN MODE */}
      {challanModeActive ? (
        <div className="bg-white border-2 border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto challan-print-container flex flex-col md:flex-row gap-6 divide-y md:divide-y-0 md:divide-x divide-dashed divide-gray-400">
          
          {/* THREE IDENTICAL CHALLAN SECTIONS: BANK COPY, UNIVERSITY COPY, STUDENT COPY */}
          {['Bank Copy', 'University Copy', 'Student Copy'].map((copyTitle, copyIdx) => (
            <div key={copyIdx} className="flex-1 challan-part pt-4 md:pt-0 md:pl-4 first:pl-0">
              {/* Header */}
              <div className="text-center border-b pb-2.5 mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-900">Allama Iqbal Open University</h3>
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">Official Fee Challan Voucher</h4>
                <span className="inline-block mt-1 bg-gray-100 text-[9px] font-black uppercase text-gray-700 px-2.5 py-0.5 rounded border border-gray-250">
                  {copyTitle}
                </span>
              </div>

              {/* Bank accounts */}
              <div className="text-[9px] text-gray-500 font-mono space-y-1 mb-3.5 leading-tight">
                <div className="flex items-center gap-1">
                  <Building size={10} className="text-gray-400" />
                  <span>ABL A/C: 1012-002012920</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building size={10} className="text-gray-400" />
                  <span>MCB A/C: 0582-901841289</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building size={10} className="text-gray-400" />
                  <span>Alfalah A/C: 5081-301931813</span>
                </div>
              </div>

              {/* Voucher Details */}
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[10px] space-y-1.5 font-sans mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Challan No:</span>
                  <span className="font-extrabold text-gray-900">AIOU-{student.registrationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Due Date:</span>
                  <span className="font-bold text-rose-700">{dueDate.toLocaleDateString()}</span>
                </div>
                <div className="border-t border-dashed my-1" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Student Name:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[120px]">{student.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Father Name:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[120px]">{student.fatherName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registration ID:</span>
                  <span className="font-mono font-bold text-gray-900">{student.registrationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Program Selected:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[110px]">{student.programSelected}</span>
                </div>
              </div>

              {/* Itemized charges table */}
              <div className="space-y-1.5 text-[10px] border-b pb-2 mb-3.5">
                <div className="flex justify-between font-bold text-gray-400 uppercase text-[8px] tracking-wide pb-1 border-b">
                  <span>Particulars</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between">
                  <span>Course Tuition & Admission Fee</span>
                  <span>Rs. {tuitionFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Administrative Support services</span>
                  <span>Rs. {supportFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-1.5 font-extrabold text-gray-900 text-xs">
                  <span>Total Payable Fees:</span>
                  <span>Rs. {student.totalReceivable?.toLocaleString()}</span>
                </div>
              </div>

              {/* Instructions and Signatures */}
              <div className="text-[8px] text-gray-400 leading-normal mb-5 space-y-0.5">
                <p>• Challan is valid for deposit at any online branch listed above.</p>
                <p>• Fees once deposited are non-refundable & non-transferable.</p>
                <p>• Retain student copy for academic verification purposes.</p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end text-[9px] text-gray-500 pt-3 border-t border-dashed">
                <div className="text-center w-5/12 border-t pt-1 border-gray-300">
                  <span>Cashier Sign</span>
                </div>
                <div className="text-center w-5/12 border-t pt-1 border-gray-300">
                  <span>Depositor Sign</span>
                </div>
              </div>
            </div>
          ))}
          
        </div>
      ) : (
        /* STANDARD OR DETAILED TRANSCRIPT VIEW */
        <div className={`printable-card bg-white rounded-2xl border transition-all duration-300 ${
          pdfModeActive 
            ? 'p-10 max-w-4xl mx-auto border-gray-900/60 shadow-none font-serif text-black' 
            : 'p-6 sm:p-8 border-gray-150 shadow-2xs'
        }`}>

          {/* 1. Official Header (Visually highly authoritative in PDF mode) */}
          <div className="border-b-2 border-gray-800 pb-6 mb-8 text-center relative">
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">
              Allama Iqbal Open University (AIOU)
            </h2>
            <h3 className="text-md font-bold tracking-wider text-gray-600 uppercase mt-1">
              Student Record Management Sheet
            </h3>
            
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500 font-mono">
              <span>Report Generated: {new Date().toLocaleDateString()}</span>
              <span>Registration ID: <strong className="text-gray-900 text-sm">{student.registrationId}</strong></span>
            </div>

            {/* Status stamp in PDF mode */}
            <div className="absolute top-2 right-2">
              <span className={`text-xs font-extrabold border-2 px-3 py-1 rounded uppercase tracking-wider transform rotate-12 inline-block ${
                student.status === 'completed'
                  ? 'border-green-600 text-green-700 bg-green-50/50'
                  : student.status === 'suspended'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-blue-600 text-blue-700 bg-blue-50/50'
              }`}>
                {student.status}
              </span>
            </div>
          </div>

          {/* 2. Double Grid layout: Personal & Program Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8 border-b border-gray-200 pb-6">
            
            {/* Column A: Personal Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b pb-1">
                Student Personal Profile
              </h4>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Student Name:</span>
                  <span className="font-bold text-gray-900">{student.studentName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Father Name:</span>
                  <span className="font-semibold text-gray-800">{student.fatherName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Phone Number:</span>
                  <span className="font-mono text-gray-800">{student.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Degree Program:</span>
                  <span className="font-bold text-gray-900">{student.programSelected}</span>
                </div>
              </div>
            </div>

            {/* Column B: Systems & Program Access IDs */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b pb-1">
                Official Program IDs & Portals
              </h4>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Registration ID:</span>
                  <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {student.registrationId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">LMS Password ID:</span>
                  <span className="font-mono font-semibold text-gray-800">{student.lmsPasswordId || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">CMS Password ID:</span>
                  <span className="font-mono font-semibold text-gray-800">{student.cmsPasswordId || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Cycle Intake:</span>
                  <span className="font-semibold text-gray-800">{student.admissionYear} ({student.semesterType})</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Academic Transcript Section (Semester-wise course checklist) */}
          <div className="space-y-6 mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between border-b pb-1 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Academic Semesters Course Checklist & Completion
              </h4>
              <span className="interactive-actions text-[10px] text-gray-400 font-semibold italic">
                *Click checkboxes below to toggle completion statuses in real-time
              </span>
            </div>

            {student.semesters.map((sem) => {
              // Count completed courses
              const activeCourses = sem.courses.filter(c => c.code.trim());
              const completedCount = sem.courses.reduce((sum, c) => {
                if (!c.code.trim()) return sum;
                const allDone = c.workshop && c.quiz && c.assignment1 && c.assignment2;
                return allDone ? sum + 1 : sum;
              }, 0);

              // Calculate overall checklist completion percentage for this semester
              let totalChecks = 0;
              let checkedCount = 0;
              activeCourses.forEach(c => {
                totalChecks += 4; // 4 components: workshop, quiz, assignment1, assignment2
                if (c.workshop) checkedCount++;
                if (c.quiz) checkedCount++;
                if (c.assignment1) checkedCount++;
                if (c.assignment2) checkedCount++;
              });
              const semesterProgress = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;

              return (
                <div key={sem.semesterNumber} className="border border-gray-200 rounded-xl p-4 bg-gray-50/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-dashed border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-800">
                        Semester {sem.semesterNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        semesterProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800 border'
                      }`}>
                        {semesterProgress}% Complete
                      </span>
                    </div>
                    
                    <div className="w-full sm:w-48 bg-gray-200 h-2 rounded-full overflow-hidden border">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${semesterProgress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${semesterProgress}%` }}
                      />
                    </div>
                  </div>

                  {activeCourses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No course codes set for this semester yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeCourses.map((course, cIdx) => (
                        <div key={cIdx} className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-2 shadow-3xs">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                              Course Code: {course.code}
                            </span>
                            
                            {/* Individual course completion badge */}
                            {(course.workshop && course.quiz && course.assignment1 && course.assignment2) ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200">
                                <Check size={10} /> Fully Done
                              </span>
                            ) : null}
                          </div>

                          {/* INTERACTIVE TOGGLES CHECKLIST */}
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                            {[
                              { label: 'Wkshp', field: 'workshop' as const },
                              { label: 'Quiz', field: 'quiz' as const },
                              { label: 'Asgn 1', field: 'assignment1' as const },
                              { label: 'Asgn 2', field: 'assignment2' as const },
                            ].map((item, itemIdx) => {
                              const isActive = course[item.field];
                              return (
                                <button
                                  key={itemIdx}
                                  type="button"
                                  onClick={() => handleToggleCourseCheck(sem.semesterNumber, course.code, item.field)}
                                  className={`interactive-actions p-1 rounded font-bold border transition-all cursor-pointer ${
                                    isActive 
                                      ? 'bg-green-600 text-white border-green-700 shadow-3xs' 
                                      : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border-gray-150'
                                  }`}
                                  title={`Toggle ${item.label} completion`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4. Financial Status & Payment logs + Services required (Grid) */}
          <div className="grid md:grid-cols-2 gap-8 mb-4">
            
            {/* Col A: Financial transactions & Collection Ledger */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b pb-1">
                Financial Ledger Summary
              </h4>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Receivable Fees:</span>
                  <span className="font-bold text-gray-900">Rs. {student.totalReceivable?.toLocaleString() || 0}</span>
                </div>
                
                {/* Payment transactions ledger list */}
                <div className="space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-3xs">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                    Payments History Ledger
                  </span>
                  
                  {student.paymentsList && student.paymentsList.length > 0 ? (
                    <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-1">
                      {student.paymentsList.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex justify-between items-center text-gray-600 py-1 border-b border-gray-150 border-dashed last:border-b-0">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">● Rs. {p.amount.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400 font-mono">Date: {p.date} {p.voucherRef ? `| Ref: ${p.voucherRef}` : ''}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">Realized</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic block py-2">No payments recorded yet.</span>
                  )}
                </div>

                {/* COLLECT PAYMENT DYNAMIC FORM (INTERACTIVE ACTIONS ONLY) */}
                <div className="interactive-actions ledger-form-section bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-dashed pb-1.5">
                    <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1">
                      <Plus size={14} className="text-emerald-600" />
                      <span>Collect New Payment</span>
                    </span>
                    <span className={`text-[10px] font-extrabold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      Due: Rs. {balance.toLocaleString()}
                    </span>
                  </div>

                  <form onSubmit={handleAddPaymentSubmit} className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-0.5">Amount (Rs.)</label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-0.5">Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase mb-0.5">Voucher / Challan ID / Bank Ref ID</label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. CH-201842-NBP"
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    {paymentError && (
                      <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>{paymentError}</span>
                      </p>
                    )}

                    {paymentSuccess && (
                      <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 animate-bounce">
                        <CheckCircle size={12} />
                        <span>Payment recorded and synced successfully!</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                    >
                      <Check size={14} />
                      <span>Post Fee Transaction</span>
                    </button>
                  </form>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-400 font-medium">Total Received Amount:</span>
                  <span className="font-extrabold text-emerald-700">Rs. {totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Remaining Outstanding Balance:</span>
                  <span className={`font-extrabold text-md ${balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    Rs. {balance.toLocaleString()}
                  </span>
                </div>
                {student.serviceChargesAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Charges (Extra):</span>
                    <span className="font-semibold text-gray-800">Rs. {student.serviceChargesAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Col B: Services Required & Remarks */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b pb-1">
                Services Required & Administrative Notes
              </h4>

              {/* Services required checklist visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Enrollment Support', active: student.serviceEnrollment },
                  { label: 'Workshops Handling', active: student.serviceWorkshops },
                  { label: 'Online Quizzes', active: student.serviceQuiz },
                  { label: 'Assignments Submission', active: student.serviceAssignments },
                  { label: 'Physical Workshop', active: student.servicePhysicalWorkshop },
                  { label: 'Research Report Assistance', active: student.serviceResearchReport },
                ].map((service, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg border flex items-center gap-2 ${
                      service.active
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold'
                        : 'bg-gray-50/50 border-gray-150 text-gray-400'
                    }`}
                  >
                    {service.active ? (
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-gray-300 shrink-0" />
                    )}
                    <span className="truncate">{service.label}</span>
                  </div>
                ))}
              </div>

              {/* Remarks visual card */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide block mb-1">
                  Administrative Remarks
                </span>
                <p className="text-gray-700 leading-relaxed italic">
                  {student.remarks || 'No remarks recorded for this student.'}
                </p>
              </div>

              {/* SMART COMMUNICATION & REMINDER TOOL (INTERACTIVE ACTIONS ONLY - HIDDEN IN PRINT) */}
              <div className="interactive-actions bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <MessageSquare size={16} className={isGreen ? 'text-emerald-600' : 'text-sky-600'} />
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    Smart Reminders & Alerts Hub
                  </span>
                </div>

                {/* Select Template tab list */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                  {[
                    { id: 'fee' as const, label: 'Fee Outstanding' },
                    { id: 'deadline' as const, label: 'LMS Deadlines' },
                    { id: 'workshop' as const, label: 'Workshops Alert' },
                    { id: 'welcome' as const, label: 'CMS Credentials' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tab.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedTemplate === tab.id
                          ? isGreen 
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-sky-600 text-white border-sky-700'
                          : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Preview text-area */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Template Draft Preview
                  </label>
                  <textarea
                    readOnly
                    value={getTemplateText()}
                    className="w-full h-36 p-2 bg-gray-50 text-[11px] text-gray-700 font-sans border border-gray-200 rounded-lg leading-relaxed focus:outline-hidden resize-none select-all"
                  />
                </div>

                {/* Call to actions */}
                <div className="flex gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-gray-300 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>

                  {/* Send WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=${(student.phoneNumber || '').replace(/\D/g, '').startsWith('03') ? '92' + (student.phoneNumber || '').replace(/\D/g, '').substring(1) : (student.phoneNumber || '').replace(/\D/g, '')}&text=${encodeURIComponent(getTemplateText())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 text-white shadow-3xs cursor-pointer ${
                      isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    <Send size={13} />
                    <span>Send on WhatsApp</span>
                  </a>
                </div>
                
                <p className="text-[9px] text-gray-400 font-medium italic text-center">
                  *WhatsApp button pre-fills the message directly to the student's mobile number: {student.phoneNumber || 'N/A'}.
                </p>
              </div>
            </div>

          </div>

          {/* Official Signatures footer for PDF transcripts */}
          <div className="hidden pdf-mode-only print:flex justify-between items-center mt-12 pt-8 border-t border-gray-300 text-xs text-gray-500">
            <div className="text-center w-1/3 border-t border-gray-300 pt-2">
              <strong>Prepared By</strong>
              <p className="text-[10px] text-gray-400">Portal Specialist</p>
            </div>
            <div className="w-1/3"></div>
            <div className="text-center w-1/3 border-t border-gray-300 pt-2">
              <strong>Approved Authorized Signatory</strong>
              <p className="text-[10px] text-gray-400">AIOU Registrar</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
