import React, { useState, useRef, useEffect } from 'react';

const POPULAR_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Cisco', 'Oracle',
  'Adobe', 'Flipkart', 'PhonePe', 'Meesho', 'Stripe', 'Atlassian',
];

export const CompanyCombobox = ({ value, onChange, placeholder = 'Search or type a company...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filtered = POPULAR_COMPANIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  const showCustomOption = search && !POPULAR_COMPANIES.some((c) => c.toLowerCase() === search.toLowerCase());

  const allSelectableOptions = [...filtered];
  if (showCustomOption) allSelectableOptions.push(`Use Custom: "${search}"`);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectOption = (opt) => {
    let cleanVal = opt;
    if (opt.startsWith('Use Custom: "')) cleanVal = opt.replace('Use Custom: "', '').slice(0, -1);
    onChange(cleanVal);
    setSearch('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allSelectableOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allSelectableOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSelectableOptions.length) selectOption(allSelectableOptions[selectedIndex]);
        else if (search) selectOption(`Use Custom: "${search}"`);
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElem = listRef.current.children[selectedIndex];
      if (selectedElem) selectedElem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); setSelectedIndex(0); }}
          onFocus={() => { setSearch(''); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={value || placeholder}
          className="input"
          style={{ paddingRight: 40, cursor: 'pointer' }}
        />
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-3)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', zIndex: 50, width: '100%', marginTop: 8, background: 'var(--surface)',
          border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--sh-md)',
          overflow: 'hidden', maxHeight: 260, display: 'flex', flexDirection: 'column',
        }}>
          <div className="kicker" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {search ? 'Search matches' : 'Popular profiles'}
          </div>
          <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() => selectOption(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 13.5, fontWeight: 500,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: 0,
                  background: selectedIndex === idx ? 'var(--accent-soft)' : 'transparent',
                  color: selectedIndex === idx ? 'var(--accent-2)' : 'var(--ink-2)',
                }}
              >
                <span>{item}</span>
                {value === item && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
              </button>
            ))}
            {showCustomOption && (
              <button
                type="button"
                onClick={() => selectOption(`Use Custom: "${search}"`)}
                onMouseEnter={() => setSelectedIndex(filtered.length)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 13.5, fontWeight: 600,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                  border: 0, borderTop: '1px solid var(--line)',
                  background: selectedIndex === filtered.length ? 'var(--accent-soft)' : 'transparent',
                  color: 'var(--accent-2)',
                }}
              >
                <span>Use custom: “{search}”</span>
                <span className="tag" style={{ padding: '2px 8px', fontSize: 10 }}>custom</span>
              </button>
            )}
            {allSelectableOptions.length === 0 && (
              <div className="muted" style={{ padding: '22px 16px', textAlign: 'center', fontSize: 13.5 }}>
                Type to add “{search || 'a company'}” as a custom profile.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCombobox;
