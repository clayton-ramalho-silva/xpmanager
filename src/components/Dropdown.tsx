import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ items, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="p-1.5 hover:bg-[#252a38] rounded text-slate-400 hover:text-white transition-colors">
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-48 bg-[#1a1e28] border border-[#252a38] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="py-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
