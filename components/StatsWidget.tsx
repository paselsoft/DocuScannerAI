import React from 'react';
import { SavedDocument } from '../services/dbService';
import { getExpirationInfo } from '../services/dateUtils';
import { FileText, AlertTriangle, CalendarClock, TrendingUp } from 'lucide-react';

interface StatsWidgetProps {
  docs: SavedDocument[];
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ docs }) => {
  if (!docs || docs.length === 0) return null;

  let expiredCount = 0;
  let expiringSoonCount = 0; // Entro 30 giorni
  const totalCount = docs.length;

  docs.forEach(doc => {
    if (doc.is_error) return;
    const info = getExpirationInfo(doc.content.data_scadenza);
    
    if (info.status === 'expired') {
      expiredCount++;
    } else if (info.status === 'warning' && info.daysLeft <= 30) {
      expiringSoonCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in">
      {/* Total Documents */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Totale Documenti</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</h3>
        </div>
      </div>

      {/* Expiring Soon */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg flex-shrink-0">
          <CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scadenza (30gg)</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {expiringSoonCount}
            {expiringSoonCount > 0 && <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Urgenti</span>}
          </h3>
        </div>
      </div>

      {/* Expired */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scaduti</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {expiredCount}
            {expiredCount > 0 && <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">Azione Richiesta</span>}
          </h3>
        </div>
      </div>
    </div>
  );
};