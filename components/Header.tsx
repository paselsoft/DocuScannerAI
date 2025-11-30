import React from 'react';
import { ScanFace, FileText, Moon, Sun, User } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, onOpenSettings, userEmail }) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ScanFace className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Docu<span className="text-blue-600 dark:text-blue-400">Scanner</span> AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isDarkMode ? "Passa a modalità chiara" : "Passa a modalità scura"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              <FileText className="w-4 h-4" /> Documentazione
            </span>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors border border-slate-200 dark:border-slate-700"
            title="Impostazioni Utente"
          >
            <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-xs">
               {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate hidden sm:block">
                {userEmail || 'Utente'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};