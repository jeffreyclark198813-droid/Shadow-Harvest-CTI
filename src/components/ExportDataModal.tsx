import React, { useState } from 'react';
import { Download, FileJson, FileText, Database, CheckCircle2, AlertTriangle, X, ShieldCheck, EyeOff, Layers, Share2 } from 'lucide-react';
import { Target, IntelligenceReport, ThreatAssessment } from '../services/dbService';
import { defaultAnonymizationEngine, ANONYMIZATION_PROFILES } from '../services/anonymizationService';
import { exportToMaltegoCsv, exportToMaltegoGraphML, exportToNeo4jCypher, exportToMaltegoMtzTable } from '../services/unifiedGraphService';
import { motion, AnimatePresence } from 'motion/react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: Target | null;
  reports: IntelligenceReport[];
  assessments: ThreatAssessment[];
  graphData?: { nodes: any[], edges: any[] };
  role?: string;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ 
  isOpen, 
  onClose, 
  target, 
  reports, 
  assessments,
  graphData,
  role
}) => {
  const [format, setFormat] = useState<'json' | 'csv' | 'neo4j' | 'maltego_csv' | 'maltego_graphml' | 'mtz'>('json');
  const [detailLevel, setDetailLevel] = useState<'summary' | 'detailed'>('summary');
  const [dateRange, setDateRange] = useState<'all' | 'last30' | 'last7'>('all');
  const [enableAnonymization, setEnableAnonymization] = useState(true);
  const [anonymizationProfileId, setAnonymizationProfileId] = useState('profile-tlp-amber');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !target) return null;

  // Filter reports by date
  const filteredReports = reports.filter(r => {
    if (dateRange === 'all') return true;
    const reportDate = new Date(r.timestamp);
    const now = new Date();
    const daysDiff = (now.getTime() - reportDate.getTime()) / (1000 * 3600 * 24);
    if (dateRange === 'last7') return daysDiff <= 7;
    if (dateRange === 'last30') return daysDiff <= 30;
    return true;
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content = '';
      let mimeType = '';
      let fileExt = '';

      const activeProfile = ANONYMIZATION_PROFILES.find(p => p.id === anonymizationProfileId) || ANONYMIZATION_PROFILES[0];

      // Redact text helper if enabled
      const redact = (text: string) => {
        if (!enableAnonymization) return text;
        return defaultAnonymizationEngine.anonymizeText(text, activeProfile).redactedText;
      };

      const summaryData = {
        targetId: enableAnonymization ? redact(target.id || '') : target.id,
        targetName: enableAnonymization ? redact(target.name) : target.name,
        targetType: target.type,
        posture: target.status,
        anonymizationPolicy: enableAnonymization ? activeProfile.name : 'UNREDACTED',
        intelligenceCount: filteredReports.length,
        assessmentCount: assessments.length,
        exportDate: new Date().toISOString()
      };

      const detailedData = {
        ...summaryData,
        reports: filteredReports.map(r => ({
          id: enableAnonymization ? redact(r.id || '') : r.id,
          source: r.source,
          content: redact(r.content),
          timestamp: r.timestamp,
        })),
        assessments: assessments.map(a => ({
          id: a.id,
          capabilities: redact(a.capabilities || ''),
          ttps: a.ttps.map(t => ({
            tactic: t.tactic,
            technique: t.technique,
            procedure: redact(t.procedure)
          })),
          timestamp: a.timestamp
        }))
      };

      const payload = detailLevel === 'summary' ? summaryData : detailedData;

      if (format === 'json') {
        content = JSON.stringify(payload, null, 2);
        mimeType = 'application/json';
        fileExt = 'json';
      } else if (format === 'neo4j') {
        mimeType = 'text/plain';
        fileExt = 'cypher';
        if (graphData && graphData.nodes) {
          const graphToExport = enableAnonymization 
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedNodes
            : graphData.nodes;
          const edgesToExport = enableAnonymization
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedEdges
            : (graphData.edges || []);
          content = exportToNeo4jCypher(graphToExport, edgesToExport, target.name);
        } else {
          content = `// No graph data available to export.\n`;
        }
      } else if (format === 'maltego_csv') {
        mimeType = 'text/csv';
        fileExt = 'csv';
        if (graphData && graphData.nodes) {
          const graphToExport = enableAnonymization 
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedNodes
            : graphData.nodes;
          const edgesToExport = enableAnonymization
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedEdges
            : (graphData.edges || []);
          content = exportToMaltegoCsv(graphToExport, edgesToExport);
        } else {
          content = 'Entity.Type1,Entity.Value1,Entity.Type2,Entity.Value2,Link.Label\n';
        }
      } else if (format === 'mtz') {
        mimeType = 'text/csv';
        fileExt = 'mtz';
        if (graphData && graphData.nodes) {
          const graphToExport = enableAnonymization 
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedNodes
            : graphData.nodes;
          const edgesToExport = enableAnonymization
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedEdges
            : (graphData.edges || []);
          content = exportToMaltegoMtzTable(graphToExport, edgesToExport);
        } else {
          content = 'Entity.Type1,Entity.Value1,Entity.Confidence1,Entity.Source1,Entity.Country1,Entity.Dimension1,Entity.Type2,Entity.Value2,Entity.Confidence2,Entity.Source2,Entity.Country2,Entity.Dimension2,Link.Label,Link.Style,Link.Color,Link.Thickness,Link.Confidence,Link.Provenance\n';
        }
      } else if (format === 'maltego_graphml') {
        mimeType = 'application/xml';
        fileExt = 'graphml';
        if (graphData && graphData.nodes) {
          const graphToExport = enableAnonymization 
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedNodes
            : graphData.nodes;
          const edgesToExport = enableAnonymization
            ? defaultAnonymizationEngine.anonymizeGraph(graphData.nodes, graphData.edges || [], activeProfile).anonymizedEdges
            : (graphData.edges || []);
          content = exportToMaltegoGraphML(graphToExport, edgesToExport);
        } else {
          content = '<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph id="G" edgedefault="directed"></graph></graphml>';
        }
      } else {
        // Simple CSV construction
        mimeType = 'text/csv';
        fileExt = 'csv';
        if (detailLevel === 'summary') {
          content = `Target ID,Name,Type,Posture,Sanitization,Intelligence Count,Assessment Count,Export Date\n`;
          content += `"${summaryData.targetId}","${summaryData.targetName}","${summaryData.targetType}","${summaryData.posture}","${summaryData.anonymizationPolicy}",${summaryData.intelligenceCount},${summaryData.assessmentCount},"${summaryData.exportDate}"\n`;
        } else {
          content = `Data Type,ID,Source/Tactic,Timestamp/Technique,Content/Procedure\n`;
          filteredReports.forEach(r => {
            const cleanContent = redact(r.content).replace(/"/g, '""');
            content += `"IntelligenceReport","${r.id}","${r.source}","${r.timestamp}","${cleanContent}"\n`;
          });
          assessments.forEach(a => {
            a.ttps.forEach((ttp, idx) => {
              const cleanProcedure = redact(ttp.procedure).replace(/"/g, '""');
              content += `"ThreatAssessment_TTP","${a.id}_${idx}","${ttp.tactic}","${ttp.technique?.id}: ${ttp.technique?.name}","${cleanProcedure}"\n`;
            });
          });
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shadow_harvest_intel_${enableAnonymization ? 'sanitized_' : ''}${target.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[200]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg hardware-surface p-6 space-y-6"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Export Intelligence</h2>
            <p className="text-[10px] uppercase text-gray-500 tracking-widest font-mono mt-1">
              Extract dossier for TARGET_ID: {target.id?.slice(0, 8)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {role === 'user' || role === 'viewer' ? (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded flex gap-3 text-red-500">
            <AlertTriangle size={20} className="shrink-0" />
            <div className="text-sm font-mono leading-tight">
              PERMISSION DENIED. Your current role ({role}) does not have clearance to export local intelligence records. Requires 'moderator' or 'administrator' clearance.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Export Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <button
                  onClick={() => setFormat('json')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'json' ? 'bg-harvest-accent/10 border-harvest-accent text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <FileJson size={18} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">JSON<br/>Dossier</span>
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'csv' ? 'bg-harvest-accent/10 border-harvest-accent text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <FileText size={18} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">CSV<br/>Matrix</span>
                </button>
                <button
                  onClick={() => setFormat('neo4j')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'neo4j' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Database size={18} className={format === 'neo4j' ? 'text-emerald-400' : ''} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">Neo4j<br/>Cypher</span>
                </button>
                <button
                  onClick={() => setFormat('maltego_csv')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'maltego_csv' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Share2 size={18} className={format === 'maltego_csv' ? 'text-blue-400' : ''} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">Maltego<br/>Table CSV</span>
                </button>
                <button
                  onClick={() => setFormat('mtz')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'mtz' ? 'bg-orange-500/10 border-orange-500 text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Share2 size={18} className={format === 'mtz' ? 'text-orange-400' : ''} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">MTZ<br/>Table</span>
                </button>
                <button
                  onClick={() => setFormat('maltego_graphml')}
                  className={`p-2.5 border rounded flex flex-col items-center gap-1.5 transition-colors ${format === 'maltego_graphml' ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Layers size={18} className={format === 'maltego_graphml' ? 'text-cyan-400' : ''} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">Maltego<br/>GraphML</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Detail Level</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDetailLevel('summary')}
                  className={`p-3 border rounded transition-colors text-left ${detailLevel === 'summary' ? 'bg-harvest-accent/10 border-harvest-accent' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${detailLevel === 'summary' ? 'text-white' : 'text-gray-500'}`}>Summary Matrix</span>
                    {detailLevel === 'summary' && <CheckCircle2 size={12} className="text-harvest-accent" />}
                  </div>
                  <p className="text-[9px] text-gray-600 font-mono">Aggregated metrics, taxonomy scores.</p>
                </button>
                <button
                  onClick={() => setDetailLevel('detailed')}
                  className={`p-3 border rounded transition-colors text-left ${detailLevel === 'detailed' ? 'bg-harvest-accent/10 border-harvest-accent' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${detailLevel === 'detailed' ? 'text-white' : 'text-gray-500'}`}>Full Dossier</span>
                    {detailLevel === 'detailed' && <CheckCircle2 size={12} className="text-harvest-accent" />}
                  </div>
                  <p className="text-[9px] text-gray-600 font-mono">Includes raw INTEL snippets & assessments.</p>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Temporal Filter</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs font-mono text-white outline-none focus:border-harvest-accent"
              >
                <option value="all">ALL TIME (Full Historical Record)</option>
                <option value="last30">LAST 30 DAYS (Recent Ops)</option>
                <option value="last7">LAST 7 DAYS (Active Tracking)</option>
              </select>
            </div>

            {/* Automated PII Anonymization & Policy Selector */}
            <div className="p-3.5 bg-black/60 border border-harvest-accent/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-harvest-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono">
                    Automated PII & Sensitive Redaction
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAnonymization}
                    onChange={(e) => setEnableAnonymization(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-harvest-accent"></div>
                </label>
              </div>

              {enableAnonymization && (
                <div className="space-y-2 pt-1 border-t border-[#222]">
                  <label className="text-[9px] font-bold text-gray-400 uppercase font-mono">
                    Sanitization Policy Profile:
                  </label>
                  <select
                    value={anonymizationProfileId}
                    onChange={(e) => setAnonymizationProfileId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded p-2 text-[10px] font-mono text-harvest-accent uppercase outline-none"
                  >
                    {ANONYMIZATION_PROFILES.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[8px] text-gray-500 font-mono">
                    Scrubs emails, IPs, crypto wallets, SSNs, credit cards, PGP blocks, and secrets before generating file.
                  </p>
                </div>
              )}
            </div>

            <button 
              className="w-full hardware-button py-3 flex items-center justify-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={16} />
              {isExporting ? 'PROCESSING DECRYPTION & SANITIZATION...' : enableAnonymization ? 'AUTHORIZE SANITIZED EXPORT' : 'AUTHORIZE RAW EXPORT'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
