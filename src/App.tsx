import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdmissionSelection from './components/AdmissionSelection';
import EnrollmentForm from './components/EnrollmentForm';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';

import { StudentRecord, PROGRAM_OPTIONS, PROGRAM_SEMESTERS_MAP } from './types';
import { fetchAndSyncRecords, saveStudentRecord, deleteStudentRecord, getLocalRecords, saveLocalRecords } from './firebase';
import { getSampleRecords } from './samples';
import { RefreshCcw } from 'lucide-react';

export default function App() {
  // Session & UI States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('aiou_admin_logged_in') === 'true';
  });

  const [theme, setTheme] = useState<'green' | 'blue'>(() => {
    return (localStorage.getItem('aiou_theme') as 'green' | 'blue') || 'green';
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'admission' | 'enroll' | 'list' | 'details'>(() => {
    return isLoggedIn ? 'dashboard' : 'dashboard'; // Default to dashboard if logged in
  });

  // Data States
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  // Form Routing States
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Sync preference
  useEffect(() => {
    localStorage.setItem('aiou_theme', theme);
  }, [theme]);

  // Load records and seed if empty
  const loadData = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      // 1. Try to fetch from Firebase and sync
      const synced = await fetchAndSyncRecords();
      
      // 2. If no records exist, seed some beautiful sample records for a complete demo experience!
      if (synced.length === 0) {
        const sampleRecords = getSampleRecords();
        
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
      } else {
        setRecords(synced);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to load database records:', error);
      setSyncStatus('failed');
      
      // Fallback: Read local storage records
      const local = getLocalRecords();
      if (local.length === 0) {
        console.log('No local records found on this browser. Seeding sample demo records locally.');
        const sampleRecords = getSampleRecords();
        saveLocalRecords(sampleRecords);
        setRecords(sampleRecords);
      } else {
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
    }
  };

  // Save student record handler
  const handleSaveStudent = async (record: StudentRecord) => {
    await saveStudentRecord(record);
    // Reload database
    await loadData();
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
            <RefreshCcw size={10} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
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
          </div>
        )}
      </main>

    </div>
  );
}
