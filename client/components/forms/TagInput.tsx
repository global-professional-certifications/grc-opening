import React, { useState } from 'react';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestionText?: string;
  className?: string;
}

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

export function TagInput({ label, tags, onChange, placeholder = "Type to add...", suggestionText, className = '' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      onChange(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label className="text-sm font-bold tracking-wide uppercase mb-2" style={{ ...MONO, color: 'var(--db-text)' }}>
          {label}
        </label>
      )}

      <div 
        className="flex flex-wrap items-center gap-2 p-2 min-h-[50px] border rounded-md transition-all focus-within:ring-1 focus-within:ring-[var(--db-primary)] focus-within:border-[var(--db-primary)]"
        style={{ backgroundColor: 'var(--db-card)', borderColor: 'var(--db-border)' }}
      >
        {tags.map((tag, i) => (
          <span 
            key={i} 
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded font-[JetBrains_Mono]"
            style={{ 
              backgroundColor: 'rgba(4, 255, 180, 0.1)', // Approximate primary with low opacity
              color: 'var(--db-primary)',
              border: '1px solid rgba(4, 255, 180, 0.2)'
            }}
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-white transition-colors"
              aria-label={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[var(--db-text)] placeholder-[var(--db-text-muted)] p-1 text-sm"
        />
      </div>
      
      {suggestionText && (
        <p className="text-xs italic mt-2" style={{ color: 'var(--db-text-muted)' }}>
          {suggestionText}
        </p>
      )}
    </div>
  );
}
