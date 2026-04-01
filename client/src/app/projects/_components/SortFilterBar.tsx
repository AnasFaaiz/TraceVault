'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export type SortOption = 'recent' | 'oldest' | 'active' | 'alpha';
export type FilterOption = 'all' | 'pivotal' | 'recent_active' | 'empty';

interface SortFilterBarProps {
  totalCount: number;
  filteredCount: number;
  sort: SortOption;
  filter: FilterOption;
  onSort: (val: SortOption) => void;
  onFilter: (val: FilterOption) => void;
  onClear: () => void;
  hideControls?: boolean;
}

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Most Recent',
  oldest: 'Oldest First',
  active: 'Most Active',
  alpha: 'Alphabetical',
};

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  pivotal: 'Has Pivotal entries',
  recent_active: 'Active this month',
  empty: 'No entries yet',
};

export default function SortFilterBar({ 
  totalCount, 
  filteredCount, 
  sort, 
  filter, 
  onSort, 
  onFilter, 
  onClear,
  hideControls = false,
}: SortFilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '32px',
      paddingBottom: '20px',
      borderBottom: '1px solid var(--border)'
    }}>
      {/* Left side: Count context */}
      <div style={{ 
        fontSize: '12px', 
        fontFamily: 'var(--mono)', 
        color: 'var(--muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        {filter !== 'all' ? (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{filteredCount}</span> OF {totalCount} PROJECTS
          </>
        ) : (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{totalCount}</span> {totalCount === 1 ? 'PROJECT' : 'PROJECTS'}
          </>
        )}
      </div>

      {/* Right side: Controls */}
      {!hideControls && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        
        {/* Sort Dropdown */}
        <div ref={sortRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            style={{
              background: '#fff',
              border: `1px solid ${sort !== 'recent' ? 'var(--amber)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--ink)',
              fontWeight: 500,
              transition: 'all 0.2s',
              boxShadow: sort !== 'recent' ? '0 0 0 1px var(--amber)' : 'none'
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Sort:</span> 
            {SORT_LABELS[sort]}
            <ChevronDown size={14} style={{ opacity: 0.4, transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {sortOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, 
              background: '#fff', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '8px', width: '180px', zIndex: 1000,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              animation: 'slideDown 0.2s ease-out'
            }}>
              {Object.entries(SORT_LABELS).map(([val, label]) => (
                <button 
                  key={val} 
                  type="button"
                  onClick={() => { onSort(val as SortOption); setSortOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: sort === val ? 'var(--paper)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: sort === val ? 'var(--amber)' : 'var(--muted)',
                    fontWeight: sort === val ? 600 : 400,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = sort === val ? 'var(--paper)' : 'transparent')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              background: '#fff',
              border: `1px solid ${filter !== 'all' ? 'var(--amber)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--ink)',
              fontWeight: 500,
              transition: 'all 0.2s',
              boxShadow: filter !== 'all' ? '0 0 0 1px var(--amber)' : 'none',
              position: 'relative'
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Filter:</span> 
            {FILTER_LABELS[filter]}
            {filter !== 'all' && (
              <div style={{ width: '6px', height: '6px', background: 'var(--amber)', borderRadius: '50%', position: 'absolute', top: '-1px', right: '-1px', boxShadow: '0 0 0 3px #fff' }} />
            )}
            <ChevronDown size={14} style={{ opacity: 0.4, transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {filterOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, 
              background: '#fff', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '8px', width: '200px', zIndex: 1000,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              animation: 'slideDown 0.2s ease-out'
            }}>
              {Object.entries(FILTER_LABELS).map(([val, label]) => (
                <button 
                  key={val} 
                  type="button"
                  onClick={() => { onFilter(val as FilterOption); setFilterOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: filter === val ? 'var(--paper)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: filter === val ? 'var(--amber)' : 'var(--muted)',
                    fontWeight: filter === val ? 600 : 400,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = filter === val ? 'var(--paper)' : 'transparent')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filter !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--mono)' }}>
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
            <button 
              type="button"
              onClick={onClear}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', textDecoration: 'underline' }}>
              Reset Filters
            </button>
          </div>
        )}
      </div>}

      <style jsx>{`
        @keyframes slideDown { 
          from { transform: translateY(-10px); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }
      `}</style>
    </div>
  );
}
