import React from 'react';
import { 
  LogOut, 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Award, 
  GraduationCap, 
  Users2, 
  Bell, 
  BookOpenCheck, 
  FileText 
} from 'lucide-react';

interface HeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  theme: 'green' | 'blue';
  setTheme: (theme: 'green' | 'blue') => void;
  currentView?: string;
  onNavigate?: (view: 'dashboard' | 'list' | 'admission' | 'exam_records' | 'degree_records' | 'f2f_workshop' | 'quiz_records' | 'semester_courses' | 'research_records') => void;
}

export default function Header({
  showBackButton,
  onBack,
  isLoggedIn,
  onLogout,
  theme,
  setTheme,
  currentView = 'dashboard',
  onNavigate,
}: HeaderProps) {
  const isGreen = theme === 'green';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'list', label: 'Students Directory', icon: Users },
    { id: 'admission', label: 'New Enrollment', icon: UserPlus },
    { id: 'degree_records', label: 'Degree Management', icon: Award, highlight: true },
    { id: 'exam_records', label: 'Exam Records', icon: GraduationCap, highlight: true },
    { id: 'f2f_workshop', label: 'Face-to-Face Section', icon: Users2, highlight: true },
    { id: 'quiz_records', label: 'Quiz Mgt', icon: Bell },
    { id: 'semester_courses', label: 'Semester Courses', icon: BookOpenCheck },
    { id: 'research_records', label: 'Research Projects', icon: FileText },
  ];

  return (
    <header className={`w-full border-b transition-colors duration-300 ${
      isGreen 
        ? 'bg-white border-emerald-100 text-emerald-950' 
        : 'bg-white border-sky-100 text-sky-950'
    } shadow-xs sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto py-3.5 px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Back button or brand title */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack}
              id="header-back-button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer shadow-2xs ${
                isGreen
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <ArrowLeft size={16} className="text-emerald-700 font-extrabold" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm ${
              isGreen ? 'bg-gradient-to-br from-emerald-600 to-teal-800' : 'bg-gradient-to-br from-sky-600 to-indigo-800'
            }`}>
              A
            </div>
            <div>
              <h1 className={`text-lg md:text-xl font-black tracking-tight select-none leading-none ${
                isGreen ? 'text-emerald-950' : 'text-sky-950'
              }`}>
                AIOU Portal
              </h1>
              <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">Academic & Financial Management</span>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle & Logout */}
        <div className="flex items-center justify-end gap-3">
          {/* Theme switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setTheme('green')}
              title="Emerald Green Theme"
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isGreen ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Green
            </button>
            <button
              onClick={() => setTheme('blue')}
              title="Sky Blue Theme"
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isGreen ? 'bg-sky-600 text-white shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Blue
            </button>
          </div>

          {/* Logged in status & Logout */}
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Admin
              </span>
              <button
                onClick={onLogout}
                id="header-logout-button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Logout"
              >
                <LogOut size={14} className="text-rose-600 font-extrabold" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Primary Navigation Bar (Scrollable Tabs) */}
      {isLoggedIn && onNavigate && (
        <div className={`w-full border-t border-b overflow-x-auto scrollbar-none py-1.5 px-4 sm:px-6 ${
          isGreen ? 'bg-emerald-50/40 border-emerald-100' : 'bg-sky-50/40 border-sky-100'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'admission' && currentView === 'enroll');
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? isGreen
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-sky-700 text-white shadow-xs'
                      : item.highlight
                        ? isGreen
                          ? 'bg-white text-emerald-900 border border-emerald-250 hover:bg-emerald-100/70'
                          : 'bg-white text-sky-900 border border-sky-250 hover:bg-sky-100/70'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-white' : item.highlight ? (isGreen ? 'text-emerald-700' : 'text-sky-700') : 'text-gray-500'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

