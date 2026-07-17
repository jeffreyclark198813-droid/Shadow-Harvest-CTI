import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Target as TargetIcon, FileText, Activity, ShieldAlert, Cpu, Globe, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { exportUserData, UserDataBundle } from '../services/dbService';
import { auth } from '../firebase';

interface GlobalSearchModalProps {
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'target' | 'report' | 'assessment' | 'note' | 'anomaly';
  title: string;
  subtitle: string;
  targetId: string;
  score?: number;
  icon?: any;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<UserDataBundle | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        setLoading(true);
        try {
          const bundle = await exportUserData(user.uid);
          setData(bundle);
        } catch (e) {
          console.error("Failed to load user data for search", e);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!data || !query.trim()) {
      setResults([]);
      return;
    }

    const term = query.toLowerCase();
    const newResults: SearchResult[] = [];

    data.targets.forEach(target => {
      // Search in Target
      if (target.name.toLowerCase().includes(term) || target.type.toLowerCase().includes(term)) {
        newResults.push({
          id: target.id || '',
          targetId: target.id || '',
          type: 'target',
          title: target.name,
          subtitle: `Target \u2022 ${target.type.toUpperCase()}`,
          icon: TargetIcon
        });
      }

      // Search in Reports / Scan History
      target.reports?.forEach(report => {
        if (report.content?.toLowerCase().includes(term) || report.source?.toLowerCase().includes(term)) {
          newResults.push({
            id: report.id || '',
            targetId: target.id || '',
            type: 'report',
            title: `Report from ${report.source || 'Unknown'}`,
            subtitle: `Phase ${report.phase} Report \u2022 ${target.name}`,
            icon: FileText
          });
        }
      });

      // Search in Threat Assessments
      target.threatAssessments?.forEach(assessment => {
        if (assessment.capabilities?.toLowerCase().includes(term) || assessment.operationalScope?.toLowerCase().includes(term)) {
          newResults.push({
            id: assessment.id || '',
            targetId: target.id || '',
            type: 'assessment',
            title: `Threat Assessment`,
            subtitle: `Assessment \u2022 ${target.name}`,
            icon: ShieldAlert
          });
        }
      });

      // Search in Anomalies
      target.anomalies?.forEach(anomaly => {
        if (anomaly.description?.toLowerCase().includes(term) || anomaly.type?.toLowerCase().includes(term)) {
           newResults.push({
            id: anomaly.id || '',
            targetId: target.id || '',
            type: 'anomaly',
            title: anomaly.type,
            subtitle: `Anomaly \u2022 ${target.name}`,
            icon: Activity
          });
        }
      });
      
      // Search in Synthesized Outputs (Notes)
      target.synthesizedOutputs?.forEach(output => {
        if (output.title?.toLowerCase().includes(term) || output.content?.toLowerCase().includes(term)) {
           newResults.push({
            id: output.id || '',
            targetId: target.id || '',
            type: 'note',
            title: output.title || 'Synthesized Note',
            subtitle: `Intelligence Note \u2022 ${target.name}`,
            icon: FileText
          });
        }
      });
    });

    setResults(newResults.slice(0, 20)); // Limit to 20 results
  }, [query, data]);

  const handleResultClick = (result: SearchResult) => {
    // We navigate to the target view and can possibly anchor or highlight, but for now just go to the target
    navigate(`/target/${result.targetId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center p-4 pt-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-harvest-card border border-harvest-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="relative flex items-center border-b border-harvest-border bg-black/50 px-4">
          <Search size={20} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search targets, scans, reports, notes..."
            className="w-full bg-transparent border-none text-white px-4 py-4 outline-none placeholder:text-gray-600 font-mono text-sm"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <div className="h-6 w-px bg-harvest-border mx-2" />
          <button 
            onClick={onClose}
            className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading && !data ? (
            <div className="p-8 text-center text-gray-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
              Initializing Secure Index...
            </div>
          ) : query.trim() === '' ? (
            <div className="p-8 text-center text-gray-600 font-mono text-xs">
              Enter a query to search across all operational data.
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, idx) => {
                const Icon = result.icon || FileText;
                return (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="p-2 bg-harvest-accent/10 rounded text-harvest-accent group-hover:scale-110 transition-transform">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{result.title}</h4>
                      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 font-mono text-sm">
              No correlating intelligence found for "{query}".
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
