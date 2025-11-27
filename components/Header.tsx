import React from 'react';
import { ScanFace, FileText } from 'lucide-react';

export const Header: React.FC = () => {
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
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <span className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer">
            <FileText className="w-4 h-4" /> Documentazione
          </span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">v1.0.0</span>
        </div>
      </div>
    </header>
  );
};