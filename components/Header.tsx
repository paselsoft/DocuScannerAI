
import React from 'react';
import { ScanFace, FileText, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Header: React.FC = () => {
  const handleLogout = async () => {
    // 1. Pulizia manuale LocalStorage
    // Rimuoviamo i token di sessione Supabase (iniziano con sb- e finiscono con -auth-token)
    // Questo è fondamentale su Cloud Run/Ambienti persistenti dove signOut() asincrono potrebbe non finire prima del reload
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
        }
    });

    // 2. Logout servizio (Best effort)
    await supabase.auth.signOut();
    
    // 3. Forza reload per pulire cache locale e stato React
    window.location.reload(); 
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ScanFace className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Docu<span className="text-blue-600">Scanner</span> AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer">
              <FileText className="w-4 h-4" /> Documentazione
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 transition-colors p-2"
            title="Esci"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
