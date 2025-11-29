import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import { ChatMessage, FileData, ExtractedData } from '../types';
import { askDocumentQuestion } from '../services/geminiService';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  frontFile: FileData | null;
  backFile: FileData | null;
  extractedData?: ExtractedData | null;
  history: ChatMessage[];
  onUpdateHistory: (newHistory: ChatMessage[]) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  sessionName,
  frontFile,
  backFile,
  extractedData,
  history,
  onUpdateHistory
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, history]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input.trim(),
      timestamp: Date.now()
    };

    const updatedHistory = [...history, userMsg];
    onUpdateHistory(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const images = frontFile ? {
          front: { base64: frontFile.base64, mime: frontFile.mimeType },
          back: backFile ? { base64: backFile.base64, mime: backFile.mimeType } : undefined
      } : undefined;

      const answer = await askDocumentQuestion(
        userMsg.text,
        history,
        images,
        extractedData
      );

      const aiMsg: ChatMessage = {
        role: 'ai',
        text: answer,
        timestamp: Date.now()
      };

      onUpdateHistory([...updatedHistory, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        role: 'ai',
        text: "Mi dispiace, si è verificato un errore durante l'analisi. Riprova.",
        timestamp: Date.now()
      };
      onUpdateHistory([...updatedHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col h-[600px] max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Assistente Documento</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                {frontFile ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                <span className="truncate max-w-[150px]">{sessionName}</span>
                {!frontFile && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded ml-1">Modalità Archivio</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {history.length === 0 && (
            <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400 text-sm">
              <Bot className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p>Ciao! Sono qui per aiutarti.</p>
              <p className="mt-1">
                {frontFile 
                  ? 'Chiedimi qualsiasi cosa riguardo il documento caricato (es. "C\'è una firma?", "Traduci le note").' 
                  : 'Poiché questo è un documento archiviato, posso rispondere solo basandomi sui dati estratti (es. "Quando scade?", "Qual è il numero documento?").'}
              </p>
            </div>
          )}

          {history.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-indigo-600'}
              `}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              
              <div className={`
                max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                 <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                 <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Fai una domanda sul documento..."
              className="flex-grow px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};