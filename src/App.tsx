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
import ResearchProjectModule from './components/ResearchProjectModule';
import F2FWorkshopModule from './components/F2FWorkshopModule';

import { StudentRecord, PROGRAM_OPTIONS, PROGRAM_SEMESTERS_MAP } from './types';
import { 
  fetchAndSyncRecords, 
  saveStudentRecord, 
  deleteStudentRecord, 
  getLocalRecords, 
  saveLocalRecords, 
  isQuotaExceeded,
  syncAllModulesToCloud,
  exportAllDataToJSON,
  importAllDataFromJSON,
  deleteAllDemoStudentRecords
} from './firebase';
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

  const [currentView, setCurrentView] = useState<'dashboard' | 'admission' | 'enroll' | 'list' | 'details' | 'exam_records' | 'degree_records' | 'quiz_records' | 'semester_courses' | 'research_records' | 'f2f_workshop'>(() => {
    return isLoggedIn ? 'dashboard' : 'dashboard'; // Default to dashboard if logged in
  });

  // Data States
  const [records, setRecords] = useState<StudentRecord[]>(() => {
    return getLocalRecords(false);
  });
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

  // Load records directly from Firebase Cloud Firestore and sync with local state
  const loadData = async (forceCloud = false) => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      // Always sync local records to Cloud Firestore on load so data transfers seamlessly between mobile and laptop
      await syncAllModulesToCloud();

      // Fetch from Firebase and perform cloud verification to load all student records
      const synced = await fetchAndSyncRecords({ forceCloudFetch: forceCloud });
      
      let allStudentRecords = synced.filter(r => !r.isDeleted);

      // Sort by updatedAt descending
      allStudentRecords.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });

      // Save synced dataset back to local storage
      saveLocalRecords(allStudentRecords);
      setRecords(allStudentRecords);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to load database records:', error);
      setSyncStatus('failed');
      
      // Fallback: Read local storage records without forcing fake sample data
      const local = getLocalRecords(false);
      let allStudentRecords = local.filter(r => !r.isDeleted);

      allStudentRecords.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });

      setRecords(allStudentRecords);
    } finally {
      setLoading(false);
    }
  };

  const handleFullSync = async () => {
    await loadData(true);
  };

  const handleExportBackup = () => {
    try {
      const jsonStr = exportAllDataToJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AIOU_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to generate export backup file: ' + (e?.message || e));
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      setLoading(true);
      setSyncStatus('syncing');
      const text = await file.text();
      const result = await importAllDataFromJSON(text);
      if (result.success) {
        alert(result.message);
        await loadData(true);
      } else {
        alert('Import Error: ' + result.message);
        setSyncStatus('failed');
      }
    } catch (e: any) {
      alert('Failed to read backup file: ' + (e?.message || e));
      setSyncStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDemoRecords = async () => {
    if (window.confirm('Are you sure you want to delete all demo/sample student records? Real student records will not be affected.')) {
      setLoading(true);
      setSyncStatus('syncing');
      try {
        const res = await deleteAllDemoStudentRecords();
        alert(res.message);
        await loadData(true);
      } catch (err: any) {
        alert('Failed to delete demo records: ' + (err?.message || err));
        setSyncStatus('failed');
      } finally {
        setLoading(false);
      }
    }
  };

  // Trigger loading records on mount or when logging in
  useEffect(() => {
    if (isLoggedIn) {
      loadData(true);
    }
  }, [isLoggedIn]);

  // Real-time automatic background synchronization across mobile and desktop
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        syncAllModulesToCloud().then(() => {
          fetchAndSyncRecords({ forceCloudFetch: true }).then(synced => {
            const active = synced.filter(r => !r.isDeleted);
            active.sort((a, b) => {
              const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return tB - tA;
            });
            setRecords(active);
            setSyncStatus('synced');
          }).catch(() => setSyncStatus('failed'));
        }).catch(() => {});
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('online', handleFocusOrVisible);

    const interval = setInterval(() => {
      handleFocusOrVisible();
    }, 25000);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('online', handleFocusOrVisible);
      clearInterval(interval);
    };
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
    } else if (currentView === 'research_records') {
      setCurrentView('dashboard');
    } else if (currentView === 'f2f_workshop') {
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
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        syncStatus={syncStatus}
        onSync={handleFullSync}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onDeleteDemoRecords={handleDeleteDemoRecords}
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
            onClick={() => loadData(true)}
            title="Force refresh & verify cloud database with Firestore"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
          >
            <RefreshCcw size={11} className={`text-emerald-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span className="font-semibold text-[11px] text-gray-600 hover:text-emerald-700">Cloud Sync ({records.length} records)</span>
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
                onSelectResearchRecords={() => {
                  setCurrentView('research_records');
                }}
                onSelectF2FWorkshop={() => {
                  setCurrentView('f2f_workshop');
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
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onDeleteDemoRecords={handleDeleteDemoRecords}
              />
            )}

            {currentView === 'details' && (
              selectedStudent ? (
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
              ) : (
                <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-2xs text-center border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">No Student Selected for Preview</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Please select a student record from the directory to preview full details.</p>
                  <button
                    onClick={() => setCurrentView('list')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Return to Student List
                  </button>
                </div>
              )
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

            {currentView === 'research_records' && (
              <ResearchProjectModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                theme={theme}
              />
            )}

            {currentView === 'f2f_workshop' && (
              <F2FWorkshopModule
                onBackToDashboard={() => setCurrentView('dashboard')}
                studentRecords={records}
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
