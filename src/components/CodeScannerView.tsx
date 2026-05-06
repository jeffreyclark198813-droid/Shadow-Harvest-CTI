import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { Code2, Github, ShieldAlert, Cpu, AlertTriangle, Key } from 'lucide-react';
import { scanCodeRepositories } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface CodeScannerViewProps {
  target: Target;
}

export const CodeScannerView: React.FC<CodeScannerViewProps> = ({ target }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleScan = async () => {
    setLoading(true);
    try {
      const data = await scanCodeRepositories(JSON.stringify(target));
      setResults(data);
    } catch (error) {
      console.error("Code scan failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label flex items-center gap-2">
          <Code2 size={14} className="text-harvest-accent" />
          Code Repository & Paste Site Scanner
        </h3>
        <button
          onClick={handleScan}
          disabled={loading}
          className="hardware-button px-4 py-2 flex items-center gap-2"
        >
          {loading ? <Cpu size={14} className="animate-spin" /> : <Github size={14} />}
          {loading ? "SCANNING..." : "INITIATE SCAN"}
        </button>
      </div>

      {!results && !loading && (
        <div className="hardware-surface p-12 text-center text-gray-500">
          <Code2 size={48} className="mx-auto mb-4 opacity-20 text-harvest-accent" />
          <p className="mono-label">No scan results active.</p>
          <p className="text-[10px] text-gray-600 mt-2">Trigger a scan to detect exposed credentials and proprietary code.</p>
        </div>
      )}

      {loading && (
        <div className="hardware-surface p-12 text-center text-harvest-accent animate-pulse">
          <Cpu size={48} className="mx-auto mb-4" />
          <p className="mono-label">Parsing commit histories and paste bins...</p>
        </div>
      )}

      <AnimatePresence>
        {results && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="hardware-surface p-4">
              <h4 className="mono-label mb-2 text-harvest-accent">Executive Summary</h4>
              <p className="text-xs text-gray-300 font-mono leading-relaxed">{results.executiveSummary}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exposed Secrets */}
              <div className="hardware-surface p-4">
                <h4 className="mono-label mb-4 flex items-center gap-2"><Key size={14} className="text-harvest-warning" /> Exposed Secrets</h4>
                <div className="space-y-3">
                  {results.exposedSecrets?.map((secret: any, idx: number) => (
                    <div key={idx} className="bg-black/50 p-3 rounded border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-white uppercase">{secret.type}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                          secret.riskLevel === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                          secret.riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                          'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                        }`}>
                          {secret.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <code className="block w-full bg-black p-2 rounded text-[10px] text-harvest-warning overflow-x-auto whitespace-pre">
                        {secret.snippet}
                      </code>
                      <a href={secret.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300">
                        {secret.sourceUrl}
                      </a>
                    </div>
                  ))}
                  {(!results.exposedSecrets || results.exposedSecrets.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic">No exposed secrets detected.</p>
                  )}
                </div>
              </div>

              {/* Correlations */}
              <div className="hardware-surface p-4">
                <h4 className="mono-label mb-4 flex items-center gap-2"><ShieldAlert size={14} className="text-harvest-info" /> Persona Artifact Correlations</h4>
                <div className="space-y-3">
                  {results.correlations?.map((corr: any, idx: number) => (
                    <div key={idx} className="bg-black/50 p-3 rounded border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-harvest-info font-bold">{corr.identifier}</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-harvest-accent font-bold uppercase">{corr.associatedPersona}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-relaxed">
                        {corr.evidence}
                      </p>
                    </div>
                  ))}
                  {(!results.correlations || results.correlations.length === 0) && (
                    <p className="text-[10px] text-gray-500 italic">No direct persona correlations detected in code.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
