import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <HelpCircle size={14} className="text-gray-500 cursor-help ml-1 hover:text-harvest-accent transition-colors" />}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 hardware-surface !bg-black/95 border border-harvest-border rounded-lg shadow-xl"
          >
            <div className="text-[10px] font-mono text-gray-300 leading-relaxed text-left whitespace-normal">
              {content}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-harvest-border border-t-8 border-x-transparent border-x-8 border-b-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
