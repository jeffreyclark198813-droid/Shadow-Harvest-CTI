import React, { useState } from 'react';
import { Download, FileJson, FileText, Database, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Target, IntelligenceReport, ThreatAssessment } from '../services/dbService';
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
  const [format, setFormat] = useState<'json' | 'csv' | 'neo4j'>('json');
  const [detailLevel, setDetailLevel] = useState<'summary' | 'detailed'>('summary');
  const [dateRange, setDateRange] = useState<'all' | 'last30' | 'last7'>('all');
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

      const summaryData = {
        targetId: target.id,
        targetName: target.name,
        targetType: target.type,
        posture: target.status,
        intelligenceCount: filteredReports.length,
        assessmentCount: assessments.length,
        exportDate: new Date().toISOString()
      };

      const detailedData = {
        ...summaryData,
        reports: filteredReports.map(r => ({
          id: r.id,
          source: r.source,
          content: r.content,
          timestamp: r.timestamp,
        })),
        assessments: assessments.map(a => ({
          id: a.id,
          capabilities: a.capabilities,
          ttps: a.ttps,
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
        content = `// Neo4j Cypher Import Script for Target: ${target.name}\n// Generated: ${new Date().toISOString()}\n\n`;
        
        if (graphData && graphData.nodes) {
          // Create Nodes
          graphData.nodes.forEach(node => {
            const safeLabel = node.label.replace(/"/g, '\\"');
            const nodeType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
            content += `MERGE (n:${nodeType} {id: "${node.id}"})\nSET n.label = "${safeLabel}"\n;\n`;
          });
          
          // Create Edges
          if (graphData.edges) {
            graphData.edges.forEach(edge => {
              const relName = edge.relationship.toUpperCase().replace(/\s+/g, '_');
              content += `MATCH (a {id: "${edge.source}"}), (b {id: "${edge.target}"})\nMERGE (a)-[:${relName}]->(b)\n;\n`;
            });
          }
        } else {
          content += `// No graph data available to export.\n`;
        }
      } else {
        // Simple CSV construction
        mimeType = 'text/csv';
        fileExt = 'csv';
        if (detailLevel === 'summary') {
          content = `Target ID,Name,Type,Posture,Intelligence Count,Assessment Count,Export Date\n`;
          content += `"${summaryData.targetId}","${summaryData.targetName}","${summaryData.targetType}","${summaryData.posture}",${summaryData.intelligenceCount},${summaryData.assessmentCount},"${summaryData.exportDate}"\n`;
        } else {
          content = `Data Type,ID,Source/Tactic,Timestamp/Technique,Content/Procedure\n`;
          filteredReports.forEach(r => {
            const cleanContent = r.content.replace(/"/g, '""');
            content += `"IntelligenceReport","${r.id}","${r.source}","${r.timestamp}","${cleanContent}"\n`;
          });
          assessments.forEach(a => {
            a.ttps.forEach((ttp, idx) => {
              const cleanProcedure = ttp.procedure.replace(/"/g, '""');
              content += `"ThreatAssessment_TTP","${a.id}_${idx}","${ttp.tactic}","${ttp.technique?.id}: ${ttp.technique?.name}","${cleanProcedure}"\n`;
            });
          });
        }
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shadow_harvest_intel_${target.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${fileExt}`;
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
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFormat('json')}
                  className={`p-3 border rounded flex flex-col items-center gap-2 transition-colors ${format === 'json' ? 'bg-harvest-accent/10 border-harvest-accent text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <FileJson size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">JSON<br/>Dossier</span>
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-3 border rounded flex flex-col items-center gap-2 transition-colors ${format === 'csv' ? 'bg-harvest-accent/10 border-harvest-accent text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <FileText size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">CSV<br/>Matrix</span>
                </button>
                <button
                  onClick={() => setFormat('neo4j')}
                  className={`p-3 border rounded flex flex-col items-center gap-2 transition-colors ${format === 'neo4j' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                >
                  <Database size={20} className={format === 'neo4j' ? 'text-purple-500' : ''} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Neo4j<br/>Cypher</span>
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

            <button 
              className="w-full hardware-button py-3 flex items-center justify-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={16} />
              {isExporting ? 'PROCESSING DECRYPTION...' : 'AUTHORIZE EXPORT'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
