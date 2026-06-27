import React from 'react';
import { LogOut, ArrowLeft, Sun, Palette, Laptop } from 'lucide-react';

interface HeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  theme: 'green' | 'blue';
  setTheme: (theme: 'green' | 'blue') => void;
}

export default function Header({
  showBackButton,
  onBack,
  isLoggedIn,
  onLogout,
  theme,
  setTheme,
}: HeaderProps) {
  const isGreen = theme === 'green';

  return (
    <header className={`w-full py-4 px-6 border-b transition-colors duration-300 ${
      isGreen 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-950' 
        : 'bg-sky-50 border-sky-100 text-sky-950'
    } shadow-xs`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Back button or placeholder */}
        <div className="w-1/4 flex justify-start">
          {showBackButton && (
            <button
              onClick={onBack}
              id="header-back-button"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer ${
                isGreen
                  ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border-sky-200 text-sky-700 hover:bg-sky-100'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Center: Website Title */}
        <div className="w-2/4 text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight select-none transition-colors duration-300 ${
            isGreen ? 'text-emerald-800' : 'text-sky-800'
          }`}>
            AIOU Students Record
          </h1>
        </div>

        {/* Right: Theme Toggle & Logout */}
        <div className="w-1/4 flex items-center justify-end gap-3">
          {/* Theme switcher */}
          <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-2xs">
            <button
              onClick={() => setTheme('green')}
              title="Green Theme"
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                isGreen ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 border border-white" />
            </button>
            <button
              onClick={() => setTheme('blue')}
              title="Blue Theme"
              className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                !isGreen ? 'bg-sky-500 text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-sky-500 border border-white" />
            </button>
          </div>

          {/* Logged in status & Logout */}
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-xs font-semibold px-2 py-1 bg-white rounded-full border border-gray-200">
                ● Admin Mode
              </span>
              <button
                onClick={onLogout}
                id="header-logout-button"
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isGreen
                    ? 'bg-white border-emerald-200 text-red-600 hover:bg-red-50 hover:border-red-200'
                    : 'bg-white border-sky-200 text-red-600 hover:bg-red-50 hover:border-red-200'
                }`}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
