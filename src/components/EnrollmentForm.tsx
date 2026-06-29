import React, { useState, useEffect } from 'react';
import { 
  StudentRecord, 
  SemesterData, 
  CourseData, 
  PaymentEntry, 
  PROGRAM_SEMESTERS_MAP, 
  StudentStatus 
} from '../types';
import { 
  Save, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  User, 
  IdCard, 
  CheckSquare, 
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins
} from 'lucide-react';

interface EnrollmentFormProps {
  selectedProgram: string;
  initialStudent?: StudentRecord | null; // If provided, we are in Edit Mode
  onSave: (record: StudentRecord) => Promise<void>;
  onCancel: () => void;
  theme: 'green' | 'blue';
}

export default function EnrollmentForm({
  selectedProgram,
  initialStudent,
  onSave,
  onCancel,
  theme,
}: EnrollmentFormProps) {
  const isGreen = theme === 'green';

  // Determine number of semesters
  const programName = initialStudent ? initialStudent.programSelected : selectedProgram;
  const totalSemesters = PROGRAM_SEMESTERS_MAP[programName] || 4;

  // Active Semester Tab
  const [activeSemTab, setActiveSemTab] = useState(1);

  // Form Fields State
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [lmsPasswordId, setLmsPasswordId] = useState('');
  const [cmsPasswordId, setCmsPasswordId] = useState('');
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear().toString());
  const [semesterType, setSemesterType] = useState<'Autumn' | 'Spring'>('Autumn');
  const [status, setStatus] = useState<StudentStatus>('active');

  // Academic Semesters State
  const [semesters, setSemesters] = useState<SemesterData[]>([]);

  // Payment & Service Charges State
  const [totalReceivable, setTotalReceivable] = useState<number>(0);
  const [paymentsList, setPaymentsList] = useState<PaymentEntry[]>([]);
  const [serviceChargesAmount, setServiceChargesAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  // Services Required State
  const [serviceEnrollment, setServiceEnrollment] = useState(false);
  const [serviceWorkshops, setServiceWorkshops] = useState(false);
  const [serviceQuiz, setServiceQuiz] = useState(false);
  const [serviceAssignments, setServiceAssignments] = useState(false);
  const [servicePhysicalWorkshop, setServicePhysicalWorkshop] = useState(false);
  const [serviceResearchReport, setServiceResearchReport] = useState(false);

  // New Payment Temp Input State
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Error & Status State
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Initial Student Data if in Edit Mode
  useEffect(() => {
    if (initialStudent) {
      setStudentName(initialStudent.studentName);
      setFatherName(initialStudent.fatherName);
      setPhoneNumber(initialStudent.phoneNumber);
      setRegistrationId(initialStudent.registrationId);
      setLmsPasswordId(initialStudent.lmsPasswordId);
      setCmsPasswordId(initialStudent.cmsPasswordId);
      setAdmissionYear(initialStudent.admissionYear);
      setSemesterType(initialStudent.semesterType);
      
      const deepCopiedSemesters: SemesterData[] = JSON.parse(JSON.stringify(initialStudent.semesters));
      
      // Migrate legacy global payment data to first semester if semester-level payment history is empty
      const hasAnySemesterPayments = deepCopiedSemesters.some(sem => sem.paymentsList && sem.paymentsList.length > 0);
      if (!hasAnySemesterPayments && initialStudent.paymentsList && initialStudent.paymentsList.length > 0) {
        if (deepCopiedSemesters[0]) {
          deepCopiedSemesters[0].paymentsList = initialStudent.paymentsList;
          deepCopiedSemesters[0].semesterPaidAmount = initialStudent.paymentsList.reduce((sum, p) => sum + p.amount, 0);
        }
      }
      
      // Migrate legacy global service charges and checkboxes to first semester if semester-level services are empty
      const hasAnySemesterServices = deepCopiedSemesters.some(sem => 
        sem.serviceEnrollment || sem.serviceWorkshops || sem.serviceQuiz || 
        sem.serviceAssignments || sem.servicePhysicalWorkshop || sem.serviceResearchReport || sem.semesterServiceCharges
      );
      if (!hasAnySemesterServices && deepCopiedSemesters[0]) {
        deepCopiedSemesters[0].semesterServiceCharges = initialStudent.serviceChargesAmount;
        deepCopiedSemesters[0].serviceEnrollment = initialStudent.serviceEnrollment;
        deepCopiedSemesters[0].serviceWorkshops = initialStudent.serviceWorkshops;
        deepCopiedSemesters[0].serviceQuiz = initialStudent.serviceQuiz;
        deepCopiedSemesters[0].serviceAssignments = initialStudent.serviceAssignments;
        deepCopiedSemesters[0].servicePhysicalWorkshop = initialStudent.servicePhysicalWorkshop;
        deepCopiedSemesters[0].serviceResearchReport = initialStudent.serviceResearchReport;
        deepCopiedSemesters[0].remarks = initialStudent.remarks;
      }

      setSemesters(deepCopiedSemesters);
      setTotalReceivable(initialStudent.totalReceivable);
      setPaymentsList(initialStudent.paymentsList || []);
      setServiceChargesAmount(initialStudent.serviceChargesAmount || 0);
      setRemarks(initialStudent.remarks || '');
      setServiceEnrollment(initialStudent.serviceEnrollment || false);
      setServiceWorkshops(initialStudent.serviceWorkshops || false);
      setServiceQuiz(initialStudent.serviceQuiz || false);
      setServiceAssignments(initialStudent.serviceAssignments || false);
      setServicePhysicalWorkshop(initialStudent.servicePhysicalWorkshop || false);
      setServiceResearchReport(initialStudent.serviceResearchReport || false);
      setStatus(initialStudent.status || 'active');
    } else {
      // Create empty semesters structure
      const emptySems: SemesterData[] = [];
      for (let s = 1; s <= totalSemesters; s++) {
        const courses: CourseData[] = [];
        for (let c = 1; c <= 6; c++) {
          courses.push({
            code: '',
            assignment: false,
            workshop: false,
            quiz: false,
            assignment1: false,
            assignment2: false,
          });
        }
        emptySems.push({
          semesterNumber: s,
          courses,
        });
      }
      setSemesters(emptySems);
    }
  }, [initialStudent, totalSemesters, selectedProgram]);

  // Handle Course Code change
  const handleCourseCodeChange = (semIndex: number, courseIndex: number, code: string) => {
    const updated = [...semesters];
    updated[semIndex].courses[courseIndex].code = code;
    setSemesters(updated);
  };

  // Toggle Course Completion Item
  const toggleCourseCompletion = (
    semIndex: number, 
    courseIndex: number, 
    field: 'assignment' | 'workshop' | 'quiz' | 'assignment1' | 'assignment2'
  ) => {
    const updated = [...semesters];
    const course = updated[semIndex].courses[courseIndex];
    course[field] = !course[field];
    setSemesters(updated);
  };

  // Quick auto-populate standard course codes based on indices for lazy testers/users
  const handleAutoFillCourseCodes = (semIndex: number) => {
    const updated = [...semesters];
    const defaults = ['8601', '8602', '8603', '8604', '8605', '8606'];
    updated[semIndex].courses.forEach((c, i) => {
      if (!c.code) {
        c.code = defaults[i] || `COURSE-${i+1}`;
      }
    });
    setSemesters(updated);
  };

  // Add Payment Entry
  const handleAddPayment = () => {
    const amt = parseFloat(newPaymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    const newEntry: PaymentEntry = {
      id: Math.random().toString(36).substring(2, 9),
      date: newPaymentDate,
      amount: amt
    };
    setPaymentsList([...paymentsList, newEntry]);
    setNewPaymentAmount('');
    // reset to today's date
    setNewPaymentDate(new Date().toISOString().split('T')[0]);
  };

  // Remove Payment Entry
  const handleRemovePayment = (id: string) => {
    setPaymentsList(paymentsList.filter(p => p.id !== id));
  };

  // Calculate received total
  const totalReceived = paymentsList.reduce((sum, p) => sum + p.amount, 0);
  const remainingReceivable = totalReceivable - totalReceived;

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!studentName.trim()) {
      setFormError('Student Name is required.');
      return;
    }
    if (!registrationId.trim()) {
      setFormError('Registration ID is required.');
      return;
    }
    if (!admissionYear.trim()) {
      setFormError('Admission Year is required.');
      return;
    }

    setSaving(true);

    // Calculate global aggregates dynamically from the semesters array
    const computedTotalReceivable = semesters.reduce((sum, sem) => sum + (sem.semesterFee || 0) + (sem.semesterServiceCharges || 0), 0) || totalReceivable;
    const computedPaymentsList = semesters.flatMap(sem => sem.paymentsList || []);
    const computedServiceChargesAmount = semesters.reduce((sum, sem) => sum + (sem.semesterServiceCharges || 0), 0);
    const computedRemarks = semesters.map(sem => sem.remarks ? `Sem ${sem.semesterNumber}: ${sem.remarks}` : '').filter(Boolean).join(' | ') || remarks;
    
    const computedServiceEnrollment = semesters.some(sem => sem.serviceEnrollment);
    const computedServiceWorkshops = semesters.some(sem => sem.serviceWorkshops);
    const computedServiceQuiz = semesters.some(sem => sem.serviceQuiz);
    const computedServiceAssignments = semesters.some(sem => sem.serviceAssignments);
    const computedServicePhysicalWorkshop = semesters.some(sem => sem.servicePhysicalWorkshop);
    const computedServiceResearchReport = semesters.some(sem => sem.serviceResearchReport);

    const finalRecord: StudentRecord = {
      id: initialStudent?.id || registrationId.trim(), // Use registration ID or auto ID as key
      studentName: studentName.trim(),
      fatherName: fatherName.trim(),
      phoneNumber: phoneNumber.trim(),
      registrationId: registrationId.trim(),
      lmsPasswordId: lmsPasswordId.trim(),
      cmsPasswordId: cmsPasswordId.trim(),
      admissionYear: admissionYear.trim(),
      programSelected: programName,
      semesterType,
      semesters,
      totalReceivable: computedTotalReceivable,
      paymentsList: computedPaymentsList.length > 0 ? computedPaymentsList : paymentsList,
      serviceChargesAmount: computedServiceChargesAmount,
      remarks: computedRemarks.trim(),
      serviceEnrollment: computedServiceEnrollment,
      serviceWorkshops: computedServiceWorkshops,
      serviceQuiz: computedServiceQuiz,
      serviceAssignments: computedServiceAssignments,
      servicePhysicalWorkshop: computedServicePhysicalWorkshop,
      serviceResearchReport: computedServiceResearchReport,
      status,
      createdAt: initialStudent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(finalRecord);
      setSaveSuccess(true);
      setTimeout(() => {
        onCancel(); // go back
      }, 1000);
    } catch (err) {
      console.error(err);
      setFormError('Failed to save record. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
            isGreen ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
          }`}>
            {initialStudent ? 'Edit Student Record' : 'Enrollment Form'}
          </span>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${
            isGreen ? 'text-emerald-950' : 'text-sky-950'
          }`}>
            {initialStudent ? `Edit: ${studentName}` : `New Enrollment: ${programName}`}
          </h2>
          <p className="text-gray-500 mt-1">
            Program: <span className="font-bold text-gray-700">{programName}</span> ({totalSemesters} Semesters)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || saveSuccess}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${
              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
            } disabled:opacity-50`}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Record'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={24} className="text-green-600" />
          <div>
            <p className="font-bold">Record saved successfully!</p>
            <p className="text-sm">Online storage and offline cache sync complete.</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {formError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle size={24} className="text-red-600" />
          <p className="font-semibold">{formError}</p>
        </div>
      )}

      {/* Main Form Fields Grid */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION A: Admission Details & Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-2xs">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <BookOpen className={isGreen ? 'text-emerald-600' : 'text-sky-600'} size={20} />
            <h3 className="text-lg font-bold text-gray-800">A. Admission Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Admission Year *
              </label>
              <input
                type="text"
                required
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                placeholder="e.g. 2026"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Course / Program Selected
              </label>
              <input
                type="text"
                disabled
                value={programName}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Semester Type *
              </label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setSemesterType('Autumn')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    semesterType === 'Autumn'
                      ? 'bg-white shadow-2xs text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Autumn
                </button>
                <button
                  type="button"
                  onClick={() => setSemesterType('Spring')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    semesterType === 'Spring'
                      ? 'bg-white shadow-2xs text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Spring
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Student Status
              </label>
              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    status === 'completed'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('suspended')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    status === 'suspended'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: Personal Information */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-2xs">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <User className={isGreen ? 'text-emerald-600' : 'text-sky-600'} size={20} />
            <h3 className="text-lg font-bold text-gray-800">C. Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Full Student Name"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Father Name
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father's Name"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone / Mobile Number"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: Program IDs */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-2xs">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <IdCard className={isGreen ? 'text-emerald-600' : 'text-sky-600'} size={20} />
            <h3 className="text-lg font-bold text-gray-800">D. Program IDs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Registration ID *
              </label>
              <input
                type="text"
                required
                disabled={!!initialStudent} // Cannot change Registration ID after creation since it's the identifier
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="e.g. 21FPA10423"
                className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                  initialStudent ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-gray-50/50 border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                LMS Password ID
              </label>
              <input
                type="text"
                value={lmsPasswordId}
                onChange={(e) => setLmsPasswordId(e.target.value)}
                placeholder="LMS Account Password"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                CMS Password ID
              </label>
              <input
                type="text"
                value={cmsPasswordId}
                onChange={(e) => setCmsPasswordId(e.target.value)}
                placeholder="CMS Portal Password"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: Academic Information (Semesters & Courses) */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className={isGreen ? 'text-emerald-600' : 'text-sky-600'} size={20} />
              <h3 className="text-lg font-bold text-gray-800">B. Academic Information</h3>
            </div>
            
            {/* Quick Fill option */}
            <button
              type="button"
              onClick={() => handleAutoFillCourseCodes(activeSemTab - 1)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-1 rounded border border-emerald-100"
            >
              <Sparkles size={12} />
              <span>Auto-fill course codes</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Below are the semesters for this program. Select a semester tab to edit its 6 course codes and toggle completion.
          </p>

          {/* Semesters Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {semesters.map((sem, i) => (
              <button
                key={sem.semesterNumber}
                type="button"
                onClick={() => setActiveSemTab(sem.semesterNumber)}
                className={`flex-1 min-w-[80px] py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  activeSemTab === sem.semesterNumber
                    ? isGreen
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semester {sem.semesterNumber}
              </button>
            ))}
          </div>

          {/* Course Codes & Toggle Options Grid */}
          {semesters[activeSemTab - 1] && (
            <div className="space-y-4">
              <div className="hidden lg:grid grid-cols-12 gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider px-3 pb-2 border-b">
                <div className="col-span-3">Course Code</div>
                <div className="col-span-9 grid grid-cols-4 text-center">
                  <div>Workshop</div>
                  <div>Quiz</div>
                  <div>Assignment 1</div>
                  <div>Assignment 2</div>
                </div>
              </div>

              {semesters[activeSemTab - 1].courses.map((course, courseIdx) => (
                <div 
                  key={courseIdx} 
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-3 items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                  {/* Course Code Input */}
                  <div className="col-span-1 lg:col-span-3">
                    <label className="block lg:hidden text-xs font-bold text-gray-500 uppercase mb-1">
                      Course {courseIdx + 1} Code
                    </label>
                    <input
                      type="text"
                      value={course.code}
                      onChange={(e) => handleCourseCodeChange(activeSemTab - 1, courseIdx, e.target.value)}
                      placeholder={`Course Code ${courseIdx + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Toggle Controls */}
                  <div className="col-span-1 lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 text-center">
                    
                    {/* Workshop Toggle */}
                    <div>
                      <span className="block lg:hidden text-xs text-gray-500 mb-1">Workshop</span>
                      <button
                        type="button"
                        onClick={() => toggleCourseCompletion(activeSemTab - 1, courseIdx, 'workshop')}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          course.workshop
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {course.workshop ? '✓ Completed' : 'Not Done'}
                      </button>
                    </div>

                    {/* Quiz Toggle */}
                    <div>
                      <span className="block lg:hidden text-xs text-gray-500 mb-1">Quiz</span>
                      <button
                        type="button"
                        onClick={() => toggleCourseCompletion(activeSemTab - 1, courseIdx, 'quiz')}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          course.quiz
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {course.quiz ? '✓ Completed' : 'Not Done'}
                      </button>
                    </div>

                    {/* Assignment 1 Toggle */}
                    <div>
                      <span className="block lg:hidden text-xs text-gray-500 mb-1">Assignment 1</span>
                      <button
                        type="button"
                        onClick={() => toggleCourseCompletion(activeSemTab - 1, courseIdx, 'assignment1')}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          course.assignment1
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {course.assignment1 ? '✓ Completed' : 'Not Done'}
                      </button>
                    </div>

                    {/* Assignment 2 Toggle */}
                    <div>
                      <span className="block lg:hidden text-xs text-gray-500 mb-1">Assignment 2</span>
                      <button
                        type="button"
                        onClick={() => toggleCourseCompletion(activeSemTab - 1, courseIdx, 'assignment2')}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          course.assignment2
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {course.assignment2 ? '✓ Completed' : 'Not Done'}
                      </button>
                    </div>

                  </div>
                </div>
              ))}

              {/* E. Payment & Service Charges Section inside active semester */}
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                  <Coins size={16} className="text-emerald-600" />
                  <span>E. Payment & Service Charges for Semester {activeSemTab}</span>
                </span>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Side: Payment Summary and history */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Payment Summary & Fees
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Semester Fee (Rs.)
                        </label>
                        <input
                          type="number"
                          value={semesters[activeSemTab - 1].semesterFee || ''}
                          onChange={(e) => {
                            const updated = [...semesters];
                            updated[activeSemTab - 1].semesterFee = Number(e.target.value);
                            setSemesters(updated);
                          }}
                          placeholder="e.g. 12000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Service Charges (Rs.)
                        </label>
                        <input
                          type="number"
                          value={semesters[activeSemTab - 1].semesterServiceCharges || ''}
                          onChange={(e) => {
                            const updated = [...semesters];
                            updated[activeSemTab - 1].semesterServiceCharges = Number(e.target.value);
                            setSemesters(updated);
                          }}
                          placeholder="e.g. 2500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>

                    {/* Add Payment Received for this Semester */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-gray-700 uppercase block">
                        Record Semester {activeSemTab} Payment Received
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 mb-1">Amount (Rs)</label>
                          <input
                            type="number"
                            value={newPaymentAmount}
                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 mb-1">Date</label>
                          <input
                            type="date"
                            value={newPaymentDate}
                            onChange={(e) => setNewPaymentDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(newPaymentAmount);
                          if (isNaN(amt) || amt <= 0) {
                            alert('Please enter a valid payment amount.');
                            return;
                          }
                          const newEntry: PaymentEntry = {
                            id: Math.random().toString(36).substring(2, 9),
                            date: newPaymentDate,
                            amount: amt
                          };
                          const updated = [...semesters];
                          const sem = updated[activeSemTab - 1];
                          const pList = sem.paymentsList || [];
                          sem.paymentsList = [...pList, newEntry];
                          sem.semesterPaidAmount = sem.paymentsList.reduce((sum, p) => sum + p.amount, 0);
                          setSemesters(updated);
                          setNewPaymentAmount('');
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 text-white ${
                          isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                        }`}
                      >
                        <Plus size={14} />
                        <span>Record Payment for Semester {activeSemTab}</span>
                      </button>
                    </div>

                    {/* Payments History List for this Semester */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">
                        Semester {activeSemTab} Payments Ledger
                      </span>
                      {!(semesters[activeSemTab - 1].paymentsList && semesters[activeSemTab - 1].paymentsList!.length > 0) ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                          No payment transactions recorded for this semester yet.
                        </p>
                      ) : (
                        <div className="max-h-[140px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {semesters[activeSemTab - 1].paymentsList!.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 bg-white text-xs hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-gray-400" />
                                <span className="font-mono text-gray-600">{p.date}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-emerald-700">Rs. {p.amount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...semesters];
                                    const sem = updated[activeSemTab - 1];
                                    if (sem.paymentsList) {
                                      sem.paymentsList = sem.paymentsList.filter(pay => pay.id !== p.id);
                                      sem.semesterPaidAmount = sem.paymentsList.reduce((sum, pay) => sum + pay.amount, 0);
                                      setSemesters(updated);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Summary Balances for this Semester */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">Paid Amount</span>
                        <span className="text-sm font-extrabold text-emerald-900 mt-1">
                          Rs. {(semesters[activeSemTab - 1].semesterPaidAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl border flex flex-col ${
                        ((semesters[activeSemTab - 1].semesterFee || 0) + (semesters[activeSemTab - 1].semesterServiceCharges || 0) - (semesters[activeSemTab - 1].semesterPaidAmount || 0)) > 0 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase ${
                          ((semesters[activeSemTab - 1].semesterFee || 0) + (semesters[activeSemTab - 1].semesterServiceCharges || 0) - (semesters[activeSemTab - 1].semesterPaidAmount || 0)) > 0 ? 'text-amber-800' : 'text-green-800'
                        }`}>
                          {((semesters[activeSemTab - 1].semesterFee || 0) + (semesters[activeSemTab - 1].semesterServiceCharges || 0) - (semesters[activeSemTab - 1].semesterPaidAmount || 0)) > 0 ? 'Semester Balance' : 'Fully Paid'}
                        </span>
                        <span className={`text-sm font-extrabold mt-1 ${
                          ((semesters[activeSemTab - 1].semesterFee || 0) + (semesters[activeSemTab - 1].semesterServiceCharges || 0) - (semesters[activeSemTab - 1].semesterPaidAmount || 0)) > 0 ? 'text-amber-900' : 'text-green-900'
                        }`}>
                          Rs. {Math.max(0, ((semesters[activeSemTab - 1].semesterFee || 0) + (semesters[activeSemTab - 1].semesterServiceCharges || 0) - (semesters[activeSemTab - 1].semesterPaidAmount || 0))).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Services required and Remarks */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Services Required & Semester Notes
                    </h4>

                    {/* Services List Toggles for this Semester */}
                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-gray-700 uppercase block mb-1">
                        Services Required for Semester {activeSemTab}
                      </span>

                      <div className="space-y-2">
                        {[
                          { id: 'serviceEnrollment', label: 'Service Charges Against Enrollment' },
                          { id: 'serviceWorkshops', label: 'Service Charges Against Workshops' },
                          { id: 'serviceQuiz', label: 'Service Charges Against Quiz' },
                          { id: 'serviceAssignments', label: 'Service Charges Against Assignments' },
                          { id: 'servicePhysicalWorkshop', label: 'Service Charges Against Physical Workshop' },
                          { id: 'serviceResearchReport', label: 'Service Charges Against Research Report' },
                        ].map((service) => {
                          const val = !!(semesters[activeSemTab - 1] as any)[service.id];
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                const updated = [...semesters];
                                (updated[activeSemTab - 1] as any)[service.id] = !val;
                                setSemesters(updated);
                              }}
                              className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/5 text-left text-xs transition-all cursor-pointer"
                            >
                              <span className="font-medium text-gray-700">{service.label}</span>
                              <div className={`p-0.5 rounded transition-colors ${
                                val ? 'text-emerald-600' : 'text-gray-300'
                              }`}>
                                {val ? (
                                  <CheckSquare size={18} className="fill-emerald-50 text-emerald-600" />
                                ) : (
                                  <Square size={18} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Remarks Box for this Semester */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Semester {activeSemTab} Notes (Optional)
                      </label>
                      <textarea
                        value={semesters[activeSemTab - 1].remarks || ''}
                        onChange={(e) => {
                          const updated = [...semesters];
                          updated[activeSemTab - 1].remarks = e.target.value;
                          setSemesters(updated);
                        }}
                        placeholder={`e.g., details on Semester ${activeSemTab} assignments, physical workshop locations...`}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || saveSuccess}
            id="form-submit-save-button"
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs ${
              isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
            } disabled:opacity-50`}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved successfully!' : 'Save Record Data'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
