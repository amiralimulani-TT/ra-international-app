import { useState, useRef, useEffect } from 'react';

interface AutoCompleteProps {
  items: { id: string; label: string; sublabel?: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function AutoComplete({ items, value, onChange, placeholder, required }: AutoCompleteProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = items.find(i => i.id === value);

  useEffect(() => {
    if (selected) setSearch(selected.label);
  }, [selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    (i.sublabel && i.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (id: string) => {
    onChange(id);
    const item = items.find(i => i.id === id);
    if (item) setSearch(item.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIdx].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); setHighlightIdx(-1); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition ${idx === highlightIdx ? 'bg-emerald-50' : ''}`}
            >
              <div className="font-medium text-sm">{item.label}</div>
              {item.sublabel && <div className="text-xs text-gray-500">{item.sublabel}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
