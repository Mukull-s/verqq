import React, { useState, useRef, useEffect } from 'react';

const POPULAR_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Cisco', 'Oracle', 
  'Adobe', 'Flipkart', 'PhonePe', 'Meesho', 'Stripe', 'Atlassian'
];

export const CompanyCombobox = ({ value, onChange, placeholder = 'Search or type a company...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filtered = POPULAR_COMPANIES.filter(c => 
    c.toLowerCase().includes(search.toLowerCase())
  );

  
  const showCustomOption = search && !POPULAR_COMPANIES.some(c => 
    c.toLowerCase() === search.toLowerCase()
  );

  const allSelectableOptions = [...filtered];
  if (showCustomOption) {
    allSelectableOptions.push(`Use Custom: "${search}"`);
  }

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectOption = (opt) => {
    let cleanVal = opt;
    if (opt.startsWith('Use Custom: "')) {
      cleanVal = opt.replace('Use Custom: "', '').slice(0, -1);
    }
    onChange(cleanVal);
    setSearch('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < allSelectableOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : allSelectableOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSelectableOptions.length) {
          selectOption(allSelectableOptions[selectedIndex]);
        } else if (search) {
          selectOption(`Use Custom: "${search}"`);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view inside dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElem = listRef.current.children[selectedIndex];
      if (selectedElem) {
        selectedElem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className="relative w-full font-chakra">
      {/* Selected Box / Search Input */}
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value || placeholder}
          className="w-full bg-[#18181B]/80 text-white rounded-xl border border-zinc-800/80 px-4 py-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-sm placeholder-zinc-500 cursor-pointer"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
          <svg className={`w-4.5 h-4.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0C0C0E] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
          <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 bg-[#070708]">
            {search ? 'Search Matches' : 'Popular Profiles'}
          </div>

          <div ref={listRef} className="overflow-y-auto divide-y divide-zinc-900 flex-1">
            {filtered.map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() => selectOption(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  selectedIndex === idx 
                    ? 'bg-purple-950/40 text-purple-300' 
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <span>{item}</span>
                {value === item && (
                  <span className="text-purple-400 font-bold">✓</span>
                )}
              </button>
            ))}

            {showCustomOption && (
              <button
                type="button"
                onClick={() => selectOption(`Use Custom: "${search}"`)}
                onMouseEnter={() => setSelectedIndex(filtered.length)}
                className={`w-full text-left px-4 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between border-t border-purple-500/10 ${
                  selectedIndex === filtered.length 
                    ? 'bg-purple-950/50 text-purple-300' 
                    : 'text-purple-400'
                }`}
              >
                <span>Use Custom: "{search}"</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-500/20 text-purple-300 uppercase tracking-wider">custom</span>
              </button>
            )}

            {allSelectableOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                Type to add "{search || 'a company'}" as custom profile.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
