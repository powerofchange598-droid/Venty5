import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface SelectorItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectorModalProps {
  isOpen: boolean;
  title: string;
  items: SelectorItem[];
  initialSelectedKey?: string;
  onClose: () => void;
  onSelect: (key: string) => void;
  placeholder?: string;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } } as any;
const modalVariants = { hidden: { opacity: 0, y: 24, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 24, stiffness: 280 } }, exit: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18 } } } as any;

const ITEM_HEIGHT = 44; // px
const VIEWPORT_HEIGHT = 360; // px
const BUFFER = 6;

const SelectorModal: React.FC<SelectorModalProps> = ({ isOpen, title, items, initialSelectedKey, onClose, onSelect, placeholder = 'Search' }) => {
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setScrollTop(0);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => it.label.toLowerCase().includes(q));
  }, [items, query]);

  const totalHeight = filtered.length * ITEM_HEIGHT;
  const startIndex = Math.max(Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER, 0);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + BUFFER * 2;
  const endIndex = Math.min(startIndex + visibleCount, filtered.length);
  const slice = filtered.slice(startIndex, endIndex);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-[60]" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
          <motion.div className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-lg p-0 overflow-hidden" variants={modalVariants} onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary" aria-label="Close">
                  <XMarkIcon className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <div className="mt-3 relative">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full p-3 pr-10 bg-bg-primary border border-border-primary rounded-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </span>
              </div>
            </div>
            <div
              ref={viewportRef}
              className="relative"
              style={{ height: VIEWPORT_HEIGHT, overflowY: 'auto' }}
              onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                {slice.map((it, i) => {
                  const index = startIndex + i;
                  const top = index * ITEM_HEIGHT;
                  const selected = it.key === initialSelectedKey;
                  return (
                    <div
                      key={it.key}
                      style={{ position: 'absolute', top: top, left: 0, right: 0, height: ITEM_HEIGHT }}
                      className={`flex items-center justify-between px-6 cursor-pointer ${selected ? 'bg-brand-primary/5' : ''}`}
                      onClick={() => onSelect(it.key)}
                    >
                      <div className="flex items-center gap-3">
                        {it.icon && <span className="opacity-80">{it.icon}</span>}
                        <span className="text-sm text-text-primary">{it.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectorModal;
