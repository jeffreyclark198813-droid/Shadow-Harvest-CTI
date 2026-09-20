import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Target as TargetIcon, FileText, Activity, ShieldAlert, Cpu, Globe, User, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { exportUserData, UserDataBundle } from '../services/dbService';
import { auth } from '../firebase';

interface GlobalSearchModalProps {
  onClose: () => void;
  activePersonaId?: string | null;
}

interface SearchResult {
  id: string;
  type: 'target' | 'report' | 'assessment' | 'note' | 'anomaly' | 'entity' | 'intel_asset';
  title: string;
  subtitle: string;
  targetId: string;
  score?: number;
  icon?: any;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose, activePersonaId }) => {
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
      // Filter by active persona context if provided
      if (activePersonaId && target.userPersonaId !== activePersonaId) return;

      // Search in Target Name, Type, and Aliases
      const matchesTargetName = target.name.toLowerCase().includes(term);
      const matchesTargetType = target.type.toLowerCase().includes(term);
      const matchesAliases = target.aliases?.some(alias => alias.toLowerCase().includes(term));

      if (matchesTargetName || matchesTargetType || matchesAliases) {
        newResults.push({
          id: target.id || '',
          targetId: target.id || '',
          type: 'target',
          title: target.name,
          subtitle: `Target \u2022 ${target.type.toUpperCase()} ${target.aliases && target.aliases.length > 0 ? `(${target.aliases.join(', ')})` : ''}`,
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
        const matchesTtps = assessment.ttps?.some(ttp => 
          ttp.tactic.toLowerCase().includes(term) || 
          ttp.technique?.name?.toLowerCase().includes(term) ||
          ttp.procedure.toLowerCase().includes(term)
        );

        if (
          assessment.capabilities?.toLowerCase().includes(term) || 
          assessment.operationalScope?.toLowerCase().includes(term) ||
          matchesTtps
        ) {
          newResults.push({
            id: assessment.id || '',
            targetId: target.id || '',
            type: 'assessment',
            title: `Threat Assessment: TTP Profiles`,
            subtitle: `Assessment \u2022 ${target.name}`,
            icon: ShieldAlert
          });
        }
      });

      // Search in Persona OSINT Sub-assets
      target.personaOSINT?.forEach(osint => {
        osint.socialProfiles?.forEach(profile => {
          if (
            profile.platform.toLowerCase().includes(term) ||
            profile.url.toLowerCase().includes(term) ||
            profile.description?.toLowerCase().includes(term) ||
            profile.recentPosts?.some(post => post.toLowerCase().includes(term)) ||
            profile.technicalSignatures?.some(sig => sig.toLowerCase().includes(term))
          ) {
            newResults.push({
              id: osint.id || profile.platform,
              targetId: target.id || '',
              type: 'entity',
              title: `OSINT Platform: ${profile.platform}`,
              subtitle: `Social Signature Profile \u2022 ${target.name}`,
              icon: Globe
            });
          }
        });
      });

      // Search in Advanced Persona Profiles (Behavioral & Stylometrics)
      target.personaProfiles?.forEach(profile => {
        const matchingUsernames = profile.identifiers?.usernames?.filter(u => u.toLowerCase().includes(term)) || [];
        const matchingEmails = profile.identifiers?.emails?.filter(e => e.toLowerCase().includes(term)) || [];
        const matchingWallets = profile.identifiers?.wallets?.filter(w => w.toLowerCase().includes(term)) || [];
        const matchingPgp = profile.identifiers?.pgpFingerprints?.filter(p => p.toLowerCase().includes(term)) || [];
        const matchesStylometrics = 
          profile.stylometricAnalysis?.writingStyle?.toLowerCase().includes(term) ||
          profile.stylometricAnalysis?.vocabulary?.toLowerCase().includes(term) ||
          profile.stylometricAnalysis?.characteristicPhrases?.some(phrase => phrase.toLowerCase().includes(term)) ||
          profile.stylometricAnalysis?.loanwordsAndJargon?.some(word => word.toLowerCase().includes(term));
        const matchesBehavioral = 
          profile.behavioralSignature?.timezoneInference?.toLowerCase().includes(term) ||
          profile.behavioralSignature?.signatureToolchain?.some(tool => tool.toLowerCase().includes(term)) ||
          profile.behavioralSignature?.cadencePattern?.toLowerCase().includes(term);

        if (
          matchingUsernames.length > 0 ||
          matchingEmails.length > 0 ||
          matchingWallets.length > 0 ||
          matchingPgp.length > 0 ||
          matchesStylometrics ||
          matchesBehavioral
        ) {
          const matchDetail = matchingUsernames.length > 0 ? `Username: ${matchingUsernames[0]}` :
                              matchingEmails.length > 0 ? `Email: ${matchingEmails[0]}` :
                              matchingWallets.length > 0 ? `Wallet: ${matchingWallets[0]}` :
                              matchingPgp.length > 0 ? `PGP Sig` :
                              matchesStylometrics ? 'Stylometrics Match' : 'Behavioral Match';

          newResults.push({
            id: profile.id || 'profile-match',
            targetId: target.id || '',
            type: 'entity',
            title: `Persona Entity profile: ${target.name}`,
            subtitle: `${matchDetail} \u2022 Forensic Persona Profile`,
            icon: User
          });
        }
      });

      // Search in Attribution Reports
      target.attributionReports?.forEach(att => {
        if (
          att.summary?.toLowerCase().includes(term) ||
          att.likelyAttribution?.toLowerCase().includes(term) ||
          att.geotemporalAnalysis?.toLowerCase().includes(term) ||
          att.behavioralCorrelations?.toLowerCase().includes(term)
        ) {
          newResults.push({
            id: att.id || 'attribution-match',
            targetId: target.id || '',
            type: 'intel_asset',
            title: `Attribution Track: ${att.likelyAttribution}`,
            subtitle: `Confidence ${att.confidenceScore}% \u2022 ${target.name}`,
            icon: Cpu
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
            title: `Anomaly Detected: ${anomaly.type.toUpperCase()}`,
            subtitle: `${anomaly.description} \u2022 ${target.name}`,
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

      // Search in Operational Narrative Scenarios
      target.narrativeEvents?.forEach(event => {
        if (
          event.title?.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term) ||
          event.impact?.toLowerCase().includes(term)
        ) {
          newResults.push({
            id: event.id || 'narrative-match',
            targetId: target.id || '',
            type: 'intel_asset',
            title: `Campaign Scenario: ${event.title}`,
            subtitle: `Operational Event \u2022 ${target.name}`,
            icon: BookOpen
          });
        }
      });
    });

    setResults(newResults.slice(0, 20)); // Limit to 20 results
  }, [query, data, activePersonaId]);

  const handleResultClick = (result: SearchResult) => {
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
            placeholder={activePersonaId ? "Search assets, entities and targets in active context..." : "Search targets, scans, reports, notes..."}
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
              Enter a query to search across {activePersonaId ? "your active persona" : "all"} operational intelligence.
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
