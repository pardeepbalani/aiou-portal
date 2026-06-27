import React from 'react';
import { PROGRAM_OPTIONS, PROGRAM_SEMESTERS_MAP } from '../types';
import { BookOpen, GraduationCap, Award, HelpCircle } from 'lucide-react';

interface AdmissionSelectionProps {
  onSelectProgram: (program: string) => void;
  theme: 'green' | 'blue';
}

export default function AdmissionSelection({
  onSelectProgram,
  theme,
}: AdmissionSelectionProps) {
  const isGreen = theme === 'green';

  // Return appropriate decorative badge/details for program types
  const getProgramIcon = (program: string) => {
    if (program.includes('B.Ed')) return <GraduationCap size={24} />;
    if (program.includes('B.A') || program.includes('B.Com')) return <Award size={24} />;
    return <BookOpen size={24} />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Page Title */}
      <div className="text-center mb-8">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
          isGreen ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
        }`}>
          Step 1 of 2: Admission Setup
        </span>
        <h2 className={`text-2xl md:text-3xl font-extrabold ${
          isGreen ? 'text-emerald-950' : 'text-sky-950'
        }`}>
          Select Admission Type
        </h2>
        <p className="text-gray-500 mt-2">
          Choose the degree program to configure semester layouts and course fields.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {PROGRAM_OPTIONS.map((program) => {
          const semCount = PROGRAM_SEMESTERS_MAP[program];
          return (
            <button
              key={program}
              onClick={() => onSelectProgram(program)}
              id={`program-select-${program.replace(/\s+/g, '-').toLowerCase()}`}
              className={`flex flex-col items-start p-6 bg-white border rounded-xl text-left cursor-pointer group hover:shadow-xs transition-all duration-200 transform hover:-translate-y-0.5 ${
                isGreen
                  ? 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/10'
                  : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/10'
              }`}
            >
              {/* Program Icon */}
              <div className={`p-3 rounded-lg mb-4 transition-colors ${
                isGreen 
                  ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' 
                  : 'bg-sky-50 text-sky-600 group-hover:bg-sky-100'
              }`}>
                {getProgramIcon(program)}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                {program}
              </h3>

              {/* Semester Count Badge */}
              <span className={`inline-block mt-3 px-2 py-0.5 text-xs font-semibold rounded-md ${
                isGreen ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
              }`}>
                {semCount} Semesters
              </span>

              {/* Subtitle helper */}
              <span className="text-xs text-gray-400 mt-2">
                Configure 6 courses for each of the {semCount} semesters
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
