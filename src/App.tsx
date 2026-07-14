import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdmissionSelection from './components/AdmissionSelection';
import EnrollmentForm from './components/EnrollmentForm';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import ExamRecordsModule from './components/ExamRecordsModule';
import DegreeMgtModule from './components/DegreeMgtModule';
import QuizMgtModule from './components/QuizMgtModule';
import SemesterCourseCodesModule from './components/SemesterCourseCodesModule';

import { StudentRecord, PROGRAM_OPTIONS, PROGRAM_SEMESTERS_MAP } from './types';
import { fetchAndSyncRecords, saveStudentRecord, deleteStudentRecord, getLocalRecords, saveLocalRecords, isQuotaExceeded } from './firebase';
import { getSampleRecords } from './samples';
import { RefreshCcw, Download, Smartphone, Share, X, PlusSquare, AlertCircle } from 'lucide-react';

export default function App() {
  // Session & UI States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('aiou_admin_logged_in') === 'true';
  });

  const [theme, setTheme] = useState<'green' | 'blue'>(() => {
    return (localStorage.getItem('aiou_theme') as 'green' | 'blue') || 'green';
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'admission' | 'enroll' | 'list' | 'details' | 'exam_records' | 'degree_records' | 'quiz_records' | 'semester_courses'>(() => {
    return isLoggedIn ? 'dashboard' : 'dashboard'; // Default to dashboard if logged in
  });

  // Data States
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  // Form Routing States
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Sync preference
  useEffect(() => {
    localStorage.setItem('aiou_theme', theme);
  }, [theme]);

  // Handle PWA Event Listeners
  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (ios && !isStandaloneMode) {
      const dismissed = localStorage.getItem('aiou_pwa_ios_dismissed') === 'true';
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowInstallBanner(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User prompt decision: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    if (isIOS) {
      localStorage.setItem('aiou_pwa_ios_dismissed', 'true');
    }
  };

  // Load records and seed if empty
  const loadData = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      // 1. Try to fetch from Firebase and sync
      const synced = await fetchAndSyncRecords();
      
      // 2. If no records exist, seed some beautiful sample records for a complete demo experience!
      const hasSeeded = localStorage.getItem('aiou_seeded') === 'true';
      if (synced.length === 0 && !hasSeeded) {
        const sampleRecords = getSampleRecords();
        localStorage.setItem('aiou_seeded', 'true');
        
        // Save samples to Local Storage and Firestore
        saveLocalRecords(sampleRecords);
        for (const sample of sampleRecords) {
          try {
            await saveStudentRecord(sample);
          } catch (e) {
            console.warn('Could not write initial sample to Firebase', e);
          }
        }
        setRecords(sampleRecords);
      } else if (synced.length === 0) {
        // If the database was cleared or we already seeded, respect the user's intent of an empty database!
        setRecords([]);
      } else {
        // If we have records, ensure seeded is marked as true to prevent future accidental reseeding
        localStorage.setItem('aiou_seeded', 'true');
        setRecords(synced);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to load database records:', error);
      setSyncStatus('failed');
      
      // Fallback: Read local storage records
      const local = getLocalRecords();
      const hasSeeded = localStorage.getItem('aiou_seeded') === 'true';
      if (local.length === 0 && !hasSeeded) {
        console.log('No local records found on this browser. Seeding sample demo records locally.');
        const sampleRecords = getSampleRecords();
        localStorage.setItem('aiou_seeded', 'true');
        saveLocalRecords(sampleRecords);
        setRecords(sampleRecords);
      } else if (local.length === 0) {
        setRecords([]);
      } else {
        localStorage.setItem('aiou_seeded', 'true');
        setRecords(local);
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading records on mount or when logging in
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  // Centralized hook to keep selectedStudent state synchronized with records to avoid stale details views
  useEffect(() => {
    if (selectedStudent) {
      const updated = records.find(r => r.id === selectedStudent.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedStudent)) {
        setSelectedStudent(updated);
      }
    }
  }, [records, selectedStudent]);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('aiou_admin_logged_in', 'true');
    setCurrentView('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('aiou_admin_logged_in');
    setCurrentView('dashboard'); // This switches back to login view automatically because isLoggedIn is false
  };

  // Shared Back Button handler
  const handleBackNavigation = () => {
    if (currentView === 'details') {
      setCurrentView('list');
      setSelectedStudent(null);
    } else if (currentView === 'enroll') {
      if (selectedStudent) {
        // We were editing an existing student, go back to details
        setCurrentView('details');
      } else {
        // We were enrolling a new student, go back to program selection
        setCurrentView('admission');
      }
    } else if (currentView === 'admission') {
      setCurrentView('dashboard');
    } else if (currentView === 'list') {
      setCurrentView('dashboard');
    } else if (currentView === 'exam_records') {
      setCurrentView('dashboard');
    } else if (currentView === 'degree_records') {
      setCurrentView('dashboard');
    } else if (currentView === 'quiz_records') {
      setCurrentView('dashboard');
    } else if (currentView === 'semester_courses') {
      setCurrentView('dashboard');
    } else if (currentView === 'tutorship') {
      setCurrentView('dashboard');
    }
  };

  // Save student record handler
  const handleSaveStudent = async (record: StudentRecord) => {
    await saveStudentRecord(record);
    // Reload database
    await loadData();
    // Keep selected student updated to reflect freshly saved changes immediately
    if (selectedStudent && selectedStudent.id === record.id) {
      setSelectedStudent(record);
    }
  };

  // Delete student record handler
  const handleDeleteStudent = async (id: string) => {
    await deleteStudentRecord(id);
    // Reload database
    await loadData();
    // If we were looking at details of the deleted student, go back to list
    if (selectedStudent?.id === id) {
      setCurrentView('list');
      setSelectedStudent(null);
    }
  };

  // Dashboard Stats Calculations
  const statsSummary = {
    totalStudents: records.length,
    activeStudents: records.filter(r => r.status === 'active').length,
    completedStudents: records.filter(r => r.status === 'completed').length,
  };

  // Main UI render logic based on authentication and routing state
  const isGreen = theme === 'green';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isGreen ? 'bg-emerald-50/20 text-gray-800' : 'bg-sky-50/20 text-gray-800'
    }`}>
      
      {/* 1. Header component */}
      <Header
        showBackButton={isLoggedIn && currentView !== 'dashboard'}
        onBack={handleBackNavigation}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Quota limit fallback notification */}
      {isLoggedIn && isQuotaExceeded() && (
        <div className="w-full max-w-7xl mx-auto px-6 pt-4">
          <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <AlertCircle size={20} className="text-amber-500 fill-amber-50 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-amber-950">Firebase Cloud Quota Limit Reached (Running on Offline-Local Mode)</h4>
                <p className="text-xs text-amber-850 mt-0.5 leading-relaxed">
                  The cloud database is currently at its daily free limit. <strong>Don't worry! All student records, admissions, exam centers, and manager edits are saved 100% safely in your local storage.</strong> You can continue using the entire app normally. It will sync back to the cloud automatically once the daily limit resets.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Synchronizer Indicators */}
      {isLoggedIn && (
        <div className="w-full max-w-7xl mx-auto px-6 pt-3 flex justify-between items-center text-[10px] text-gray-400 font-mono select-none">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span>
              {syncStatus === 'syncing' && 'Syncing with Firestore...'}
              {syncStatus === 'synced' && 'Cloud Database Synced'}
              {syncStatus === 'failed' && 'Offline Fallback Active'}
              {syncStatus === 'idle' && 'Offline'}
            </span>
          </div>
          <button 
            onClick={loadData}
            title="Force refresh & sync with Firestore"
            className="flex items-center gap-1 hover:text-emerald-700 cursor-pointer"
          >
            <RefreshCcw size={10} className={`text-emerald-500 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* 2. Main content area */}
      <main className="flex-1 pb-12">
        {!isLoggedIn ? (
          <Login onLoginSuccess={handleLoginSuccess} theme={theme} />
        ) : (
          <div className="animate-fade-in">
            {currentView === 'dashboard' && (
              <Dashboard
                onSelectEnroll={() => {
                  setSelectedStudent(null);
                  setCurrentView('admission');
                }}
                onSelectPrevious={() => {
                  setCurrentView('list');
                }}
                onSelectExamRecords={() => {
                  setCurrentView('exam_records');
                }}
                onSelectDegreeMgt={() => {
                  setCurrentView('degree_records');
                }}
                onSelectQuizMgt={() => {
                  setCurrentView('quiz_records');
                }}
                onSelectSemesterCourses={() => {
                  setCurrentView('semester_courses');
                }}
                theme={theme}
                stats={statsSummary}
                records={records}
                onSelectStudent={(student) => {
                  setSelectedStudent(student);
                  setCurrentView('details');
                }}
              />
            )}

            {currentView === 'admission' && (
              <AdmissionSelection
                onSelectProgram={(program) => {
                  setSelectedProgram(program);
                  setSelectedStudent(null);
                  setCurrentView('enroll');
                }}
                theme={theme}
              />
            )}

            {currentView === 'enroll' && (
              <EnrollmentForm
                selectedProgram={selectedProgram}
                initialStudent={selectedStudent}
                onSave={handleSaveStudent}
                onCancel={handleBackNavigation}
                theme={theme}
              />
            )}

            {currentView === 'list' && (
              <StudentList
                records={records}
                onSelectStudent={(student) => {
                  setSelectedStudent(student);
                  setCurrentView('details');
                }}
                onAddNewEnrollment={() => {
                  setSelectedStudent(null);
                  setCurrentView('admission');
                }}
                onDeleteStudent={handleDeleteStudent}
                theme={theme}
              />
            )}

            {currentView === 'details' && selectedStudent && (
              <StudentDetails
                student={selectedStudent}
                onEdit={() => {
                  // Preload selected student into selectedStudent and move to enroll
                  setCurrentView('enroll');
                }}
                onUpdateStudent={async (updated) => {
                  await handleSaveStudent(updated);
                  setSelectedStudent(updated);
                }}
                onClose={handleBackNavigation}
                theme={theme}
              />
            )}

            {currentView === 'exam_records' && (
              <ExamRecordsModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                studentRecords={records}
                theme={theme}
              />
            )}

            {currentView === 'degree_records' && (
              <DegreeMgtModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                studentRecords={records}
                theme={theme}
              />
            )}

            {currentView === 'quiz_records' && (
              <QuizMgtModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                studentRecords={records}
                theme={theme}
              />
            )}

            {currentView === 'semester_courses' && (
              <SemesterCourseCodesModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                studentRecords={records}
                onUpdateStudent={handleSaveStudent}
                theme={theme}
              />
            )}
          </div>
        )}
      </main>

      {/* Modern, elegant Floating PWA Mobile Install Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl shadow-xl p-5 z-50 animate-fade-in transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'} shrink-0`}>
              <Smartphone size={24} className={isGreen ? 'text-emerald-500 fill-emerald-100' : 'text-sky-500 fill-sky-100'} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-extrabold text-gray-900">
                  Install AIOU Portal Mobile App
                </h4>
                <button 
                  onClick={handleDismissInstall}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={16} className="text-gray-500 hover:text-gray-750 font-bold" />
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isIOS 
                  ? "Access your student directory instantly from your home screen. Tap the Share icon on your browser and select 'Add to Home Screen'!"
                  : "Install our lightweight mobile application directly onto your device for offline support, fast loading, and an immersive native experience!"
                }
              </p>

              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  onClick={handleDismissInstall}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
                
                {!isIOS ? (
                  <button
                    onClick={handleInstallClick}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                      isGreen 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                        : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
                    }`}
                  >
                    <Download size={14} className="text-white fill-white/20 font-bold" />
                    <span>Install App</span>
                  </button>
                ) : (
                  <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                    isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                  }`}>
                    <Share size={12} className={isGreen ? 'text-emerald-500 fill-emerald-100' : 'text-sky-500 fill-sky-100'} />
                    <span>Tap Share</span>
                    <span>→</span>
                    <PlusSquare size={12} className={isGreen ? 'text-emerald-500 fill-emerald-100' : 'text-sky-500 fill-sky-100'} />
                    <span>Add to Home Screen</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
