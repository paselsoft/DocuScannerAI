import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { getTagColor } from '../services/tagUtils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags = [], onChange, className }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      onChange([...tags, trimmedInput]);
      setInputValue('');
    } else if (tags.includes(trimmedInput)) {
        setInputValue(''); // Clear duplicate but don't add
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Tag className="w-3 h-3" /> Tag Personalizzati
      </label>
      
      <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {tags.map((tag, index) => (
          <span 
            key={index} 
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getTagColor(tag)} animate-fade-in`}
          >
            {tag}
            <button 
              onClick={() => removeTag(index)}
              className="hover:opacity-75 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Es. Lavoro, Banca... (Invio per aggiungere)" : ""}
          className="flex-grow min-w-[120px] bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
        Premi Invio o Virgola per creare un tag.
      </p>
    </div>
  );
};