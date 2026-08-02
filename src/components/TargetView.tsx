import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Shield, Search, Database, Share2, 
  FileText, Loader2, CheckCircle2, Image as ImageIcon, Activity,
  Zap, Radio, Globe, User, Cpu, BarChart3, EyeOff, GitMerge, Code2, Bitcoin, Download, Network, Scale, Link as LinkIcon, ShieldAlert, Server
} from 'lucide-react';
import { useEnduringState } from '../hooks/useEnduringState';
import { Target, IntelligenceReport, ThreatAssessment, MonitoringEvent, NarrativeEvent, PersonaOSINT,
  AdvancedPersonaProfile, AttributionReport, AIPersona, SynthesizedOutput, Anomaly, UserPersona,
  ConfidenceBreakdown, calculateAttributionConfidence,
  subscribeToReports, addReport, subscribeToThreatAssessments, subscribeToMonitoringEvents,
  addThreatAssessment, addMonitoringEvent, subscribeToNarrativeEvents, addNarrativeEvent, resolveNarrativeEvent,
  subscribeToPersonaOSINT, addPersonaOSINT,
  subscribeToAdvancedPersonaProfiles, addAdvancedPersonaProfile,
  subscribeToAttributionReports, addAttributionReport,
  subscribeToAIPersonas, subscribeToSynthesizedOutputs, subscribeToAnomalies,
  incrementUserStat, unlockAchievement
} from '../services/dbService';
import { 
  analyzeSurfaceWeb, analyzeDeepWeb, resolveEntities, analyzeImageArtifact,
  generateThreatAssessment, pollIntelligenceTelemetry, generateNarrativeEvent, profilePersonaOSINT,
  generateAdvancedPersonaProfile, generateAttributionReport, runAdvancedCorrelation,
  delay
} from '../services/geminiService';
import { Graph, CorrelationData } from './Graph';
import { EntityResolutionView } from './EntityResolutionView';
import { CodeScannerView } from './CodeScannerView';
import { FinancialTracingView } from './FinancialTracingView';
import { ThreatAssessmentView } from './ThreatAssessmentView';
import { MonitoringView } from './MonitoringView';
import { NarrativeEventDisplay } from './NarrativeEventDisplay';
import { PersonaOSINTView } from './PersonaOSINTView';
import { PersonaProfilingView } from './PersonaProfilingView';
import { AttributionEngineView } from './AttributionEngineView';
import { PersonaManager } from './PersonaManager';
import { IntelligenceSynthesizer } from './IntelligenceSynthesizer';
import { VisualizationDashboard } from './VisualizationDashboard';
import { AnomalyDetectionView } from './AnomalyDetectionView';
import { EthicalRiskAssessmentView } from './EthicalRiskAssessmentView';
import { AdversarialTestingView } from './AdversarialTestingView';
import { InfrastructureFingerprintingView } from './InfrastructureFingerprintingView';
import { ThreatActorProfileTemplateView } from './ThreatActorProfileTemplateView';
import { FictionalPersonaGenerationView } from './FictionalPersonaGenerationView';
import { PersonaLinkerView } from './PersonaLinkerView';
import { IdentityCorrelatorView } from './IdentityCorrelatorView';
import { DarkWebScannerView } from './DarkWebScannerView';
import { ReconScanView } from './ReconScanView';
import { generateStixBundle, downloadStixJson } from '../utils/stixExport';
import { auth, db, doc, onSnapshot, updateDoc } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings } from '../services/dbService';
import { ExportDataModal } from './ExportDataModal';
import { HelpTooltip } from './HelpTooltip';
import { notify } from './Toaster';

import { audioFeedback } from '../utils/audio';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';

interface TargetViewProps {
  activePersona: UserPersona;
  settings: UserSettings | null;
}

export const TargetView: React.FC<TargetViewProps> = ({ activePersona, settings }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [target, setTarget] = useState<Target | null>(null);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [assessments, setAssessments] = useState<ThreatAssessment[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [monitoringEvents, setMonitoringEvents] = useState<MonitoringEvent[]>([]);
  const [narrativeEvents, setNarrativeEvents] = useState<NarrativeEvent[]>([]);
  const [osintData, setOsintData] = useState<PersonaOSINT[]>([]);
  const [personaProfiles, setPersonaProfiles] = useState<AdvancedPersonaProfile[]>([]);
  const [attributionReports, setAttributionReports] = useState<AttributionReport[]>([]);
  const [personas, setPersonas] = useState<AIPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [synthesizedOutputs, setSynthesizedOutputs] = useState<SynthesizedOutput[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingEvent, setGeneratingEvent] = useState(false);
  const [graphData, setGraphData] = useEnduringState<{ nodes: any[], edges: any[] }>(`${id}_graphData`, { nodes: [], edges: [] });
  const [correlationData, setCorrelationData] = useEnduringState<CorrelationData | undefined>(`${id}_correlationData`, undefined);
  const [activeTab, setActiveTabRaw] = useState<'reports' | 'graph' | 'resolve' | 'code' | 'financial' | 'threat' | 'monitoring' | 'osint' | 'profiling' | 'link_personas' | 'attribution' | 'personas' | 'synthesis' | 'visuals' | 'anomalies' | 'ethics' | 'adversarial' | 'infrastructure_fp' | 'actor_template' | 'fictional_personas' | 'recon'>(() => {
    // Try to load cached tab from session storage
    const cached = sessionStorage.getItem(`target_tab_${id}`);
    return (cached as any) || 'reports';
  });

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabRaw(tab);
    sessionStorage.setItem(`target_tab_${id}`, tab);
  };

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  const confidenceBreakdown = calculateAttributionConfidence(
    reports,
    osintData,
    personaProfiles,
    monitoringEvents
  );

  useEffect(() => {
    if (!id) return;
    
    if (auth.currentUser) {
      incrementUserStat(auth.currentUser.uid, 'targetsViewed');
    }

    const unsubTarget = onSnapshot(doc(db, 'targets', id), (doc) => {
      if (doc.exists()) {
        setTarget({ id: doc.id, ...doc.data() } as Target);
      }
    });

    const unsubReports = subscribeToReports(id, setReports);
    const unsubAssessments = subscribeToThreatAssessments(id, (data) => {
      setAssessments(data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    });
    const unsubMonitoring = subscribeToMonitoringEvents(id, (data) => {
      setMonitoringEvents(data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    });
    const unsubNarrative = subscribeToNarrativeEvents(id, setNarrativeEvents);
    const unsubOSINT = subscribeToPersonaOSINT(id, setOsintData);
    const unsubProfiles = subscribeToAdvancedPersonaProfiles(id, setPersonaProfiles);
    const unsubAttribution = subscribeToAttributionReports(id, (data) => {
      setAttributionReports(data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    });
    const unsubPersonas = auth.currentUser ? subscribeToAIPersonas(auth.currentUser.uid, setPersonas) : () => {};
    const unsubSynthesized = subscribeToSynthesizedOutputs(id, setSynthesizedOutputs);
    const unsubAnomalies = subscribeToAnomalies(id, setAnomalies);

    return () => {
      unsubTarget();
      unsubReports();
      unsubAssessments();
      unsubMonitoring();
      unsubNarrative();
      unsubOSINT();
      unsubProfiles();
      unsubAttribution();
      unsubPersonas();
      unsubSynthesized();
      unsubAnomalies();
    };
  }, [id]);

  const generatePDFReport = async () => {
    try {
      const element = document.getElementById('report-container-pdf');
      if (!element) {
        notify({ type: 'error', title: 'Export Failed', message: 'No content available for export.' });
        return;
      }
      notify({ type: 'success', title: 'Processing', message: 'Generating stylized PDF report...' });
      audioFeedback.playTrigger('high');
      
      const imgData = await domtoimage.toJpeg(element, { 
        quality: 0.95, 
        bgcolor: '#050505',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Intelligence_Report_${target?.name || 'target'}.pdf`);
      notify({ type: 'success', title: 'Export Complete', message: 'PDF report has been downloaded successfully.' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Export Failed', message: 'Failed to generate PDF.' });
    }
  };

  const runAnalysis = async () => {
    if (!target || !id) return;
    setAnalyzing(true);
    try {
      // Phase 1: SWI
      const swi = await analyzeSurfaceWeb(target.name, selectedPersona);
      await addReport({
        targetId: id,
        phase: 1,
        content: swi.summary + "\n\n### Sources\n" + swi.sources.map(s => `- [${s.title}](${s.uri})`).join('\n'),
        source: 'SWI',
        confidence: 'B'
      });
      
      if (auth.currentUser) {
        incrementUserStat(auth.currentUser.uid, 'actionsTaken');
        unlockAchievement(auth.currentUser.uid, 'intel_gatherer');
      }

      await delay(2000);

      // Trigger a narrative event after SWI
      setGeneratingEvent(true);
      const narrative = await generateNarrativeEvent(target.name, swi.summary, selectedPersona);
      await addNarrativeEvent({
        targetId: id,
        ...narrative,
        resolved: false
      });
      setGeneratingEvent(false);

      await delay(2000);

      // Update target status and confidence
      await updateDoc(doc(db, 'targets', id), {
        status: 'active',
        confidenceScore: 45,
        updatedAt: new Date()
      });

      await delay(1000);

      // Phase 2: DWI & Entity Resolution
      const dwi = await analyzeDeepWeb(swi.summary, selectedPersona);
      await addReport({
        targetId: id,
        phase: 2,
        content: dwi,
        source: 'DWI',
        confidence: 'A'
      });

      const graph = await resolveEntities(dwi, selectedPersona);
      setGraphData({
        nodes: graph.nodes.map((n: any) => ({ ...n, targetId: id })),
        edges: graph.edges
      });

      await updateDoc(doc(db, 'targets', id), {
        confidenceScore: 85,
        updatedAt: new Date()
      });

      notify({ type: 'success', title: 'Analysis Complete', message: 'Intelligence gathering and graph resolution finished.' });

    } catch (error: any) {
      console.error("Analysis failed:", error);
      notify({ type: 'error', title: 'Analysis Failed', message: error?.message || 'An unexpected error occurred.' });
      
      const errorString = JSON.stringify(error).toLowerCase();
      const isRateLimit = 
        errorString.includes('429') || 
        errorString.includes('resource_exhausted') ||
        errorString.includes('quota exceeded') ||
        errorString.includes('surpassed the quota') ||
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.code === 429 ||
        error?.error?.code === 429;
      
      await addReport({
        targetId: id,
        phase: 0,
        content: isRateLimit 
          ? "### System Alert: Intelligence Engine Throttled\n\nThe intelligence engine has reached its temporary rate limit. This usually happens when processing multiple complex targets or large datasets in a short period. \n\n**Action Required:** The system has attempted automatic retries. If you see this message, please wait 2-3 minutes before re-initiating the scan to allow the quota to reset. Your existing data is safe."
          : `### Analysis Error\n\nAn unexpected error occurred during the intelligence gathering phase: \n\n\`${error?.message || "Unknown error"}\`\n\nPlease try again later.`,
        source: 'System Monitor',
        confidence: 'N/A'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const runThreatAssessment = async () => {
    if (settings?.role === 'user') return alert("Users cannot run AI assessments.");
    if (!id || reports.length === 0) return;
    setAnalyzing(true);
    try {
      const intelligence = reports.map(r => r.content).join('\n\n');
      const assessment = await generateThreatAssessment(intelligence, selectedPersona);
      await addThreatAssessment({
        targetId: id,
        ...assessment
      });
      if (auth.currentUser) {
        incrementUserStat(auth.currentUser.uid, 'actionsTaken');
        unlockAchievement(auth.currentUser.uid, 'threat_hunter');
      }
    } catch (error) {
      console.error("Threat assessment failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const runMonitoringCycle = async () => {
    if (settings?.role === 'user') return alert("Users cannot inject live telemetry events.");
    if (!id || !target) return;
    setAnalyzing(true);
    try {
      const event = await pollIntelligenceTelemetry(target.name, target.type, selectedPersona);
      await addMonitoringEvent({
        targetId: id,
        ...event
      });
    } catch (error) {
      console.error("Monitoring cycle failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePersonaProfile = async (personaId: string, label: string) => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const metadata = reports.map(r => r.content).join('\n');
      const osint = await profilePersonaOSINT(label, metadata, selectedPersona);
      await addPersonaOSINT({
        targetId: id,
        personaId,
        ...osint
      });
    } catch (error) {
      console.error("Persona profiling failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAdvancedPersonaProfile = async (personaId: string, label: string) => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const intelligence = reports.map(r => r.content).join('\n\n');
      const profile = await generateAdvancedPersonaProfile(label, intelligence, selectedPersona);
      await addAdvancedPersonaProfile({
        targetId: id,
        personaId,
        ...profile
      });
    } catch (error) {
      console.error("Advanced persona profiling failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const runAttributionEngine = async () => {
    if (!id || !target) return;
    setAnalyzing(true);
    try {
      const intelligence = reports.map(r => r.content).join('\n\n');
      const graphStr = JSON.stringify(graphData);
      const report = await generateAttributionReport(target.name, intelligence, graphStr, selectedPersona);
      await addAttributionReport({
        targetId: id,
        ...report
      });
    } catch (error) {
      console.error("Attribution engine failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunCorrelation = async () => {
    if (!id || graphData.nodes.length === 0) return;
    setAnalyzing(true);
    try {
      const data = await runAdvancedCorrelation(JSON.stringify(graphData), selectedPersona);
      setCorrelationData(data as CorrelationData);
    } catch (error) {
      console.error("Advanced correlation engine failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMergeEntities = async (sourceNodeId: string, targetNodeId: string, reason: string) => {
    if (!id || !target) return;
    setAnalyzing(true);
    try {
      const sourceNodeIndex = graphData.nodes.findIndex(n => n.id === sourceNodeId);
      const targetNodeIndex = graphData.nodes.findIndex(n => n.id === targetNodeId);
      
      if (sourceNodeIndex === -1 || targetNodeIndex === -1) return;

      const sourceNode = graphData.nodes[sourceNodeIndex];
      const targetNode = graphData.nodes[targetNodeIndex];

      const newEdges = graphData.edges.map(e => ({
        ...e,
        source: e.source === sourceNodeId ? targetNodeId : e.source,
        target: e.target === sourceNodeId ? targetNodeId : e.target
      }));

      const newNodes = graphData.nodes.filter(n => n.id !== sourceNodeId);

      setGraphData({ nodes: newNodes, edges: newEdges });

      await addReport({
        targetId: id,
        phase: 2,
        content: `### Entity Resolution Executed\n\n**Action:** Merged \`${sourceNode.label}\` (${sourceNode.type}) into \`${targetNode.label}\` (${targetNode.type}).\n\n**Analyst Justification:**\n${reason}`,
        source: 'Entity Resolution Engine',
        confidence: 'A'
      });

      await addNarrativeEvent({
        targetId: id,
        title: 'Entity Resolution Completed',
        description: `Analyst manually resolved entity overlap, absorbing ${sourceNode.label} into ${targetNode.label}.`,
        type: 'opportunity',
        impact: 'High',
        resolved: false,
        choices: [
          {
            label: 'Acknowledge',
            consequence: 'Cleaned intelligence index.'
          }
        ]
      });
    } catch (error) {
      console.error("Entity merge failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerNarrativeEvent = async () => {
    if (!id || !target) return;
    setGeneratingEvent(true);
    try {
      const context = reports.length > 0 ? reports[0].content : "Initial investigation phase.";
      const narrative = await generateNarrativeEvent(target.name, context, selectedPersona);
      await addNarrativeEvent({
        targetId: id,
        ...narrative,
        resolved: false
      });
    } catch (error) {
      console.error("Narrative event generation failed:", error);
    } finally {
      setGeneratingEvent(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setAnalyzing(true);
      try {
        const analysis = await analyzeImageArtifact(base64, file.type, selectedPersona);
        await addReport({
          targetId: id,
          phase: 3,
          content: `### Image Artifact Analysis\n\n${analysis}`,
          source: 'Artifact Analysis',
          confidence: 'A'
        });
      } catch (error) {
        console.error("Image analysis failed:", error);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [exportFormat, setExportFormat] = useState<'json' | 'neo4j' | 'maltego'>('json');

  const exportGraphData = (format: 'json' | 'neo4j' | 'maltego' = 'json') => {
    if (format === 'json') {
      const data = {
        nodes: graphData.nodes.map(n => ({ 
          id: n.id, 
          label: n.label, 
          type: n.type,
          metadata: n.metadata || {}
        })),
        edges: graphData.edges.map(e => ({ 
          source: typeof e.source === 'object' ? (e.source as any).id : e.source, 
          target: typeof e.target === 'object' ? (e.target as any).id : e.target, 
          relationship: e.relationship,
          confidence: e.confidence || 1.0
        }))
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `target_${id}_graph.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'neo4j') {
      let cypher = '// Neo4j Cypher Export\n\n';
      graphData.nodes.forEach(n => {
        cypher += `CREATE (n_${n.id.replace(/[^a-zA-Z0-9]/g, '')}:Entity {id: "${n.id}", label: "${n.label}", type: "${n.type}"});\n`;
      });
      cypher += '\n';
      graphData.edges.forEach((e, i) => {
        const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        cypher += `MATCH (a:Entity {id: "${srcId}"}), (b:Entity {id: "${tgtId}"}) CREATE (a)-[:${e.relationship.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()}]->(b);\n`;
      });
      const blob = new Blob([cypher], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `target_${id}_neo4j_export.cypher`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'maltego') {
      let csv = 'Source,SourceType,Target,TargetType,Relationship\n';
      graphData.edges.forEach(e => {
        const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        const src = graphData.nodes.find(n => n.id === srcId);
        const tgt = graphData.nodes.find(n => n.id === tgtId);
        if (src && tgt) {
          csv += `"${src.label}","${src.type}","${tgt.label}","${tgt.type}","${e.relationship}"\n`;
        }
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `target_${id}_maltego_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    notify({ type: 'info', title: 'Export Generated', message: `Graph state exported successfully as ${format.toUpperCase()}.` });
  };

  const bootstrapTelemetryNetwork = () => {
    const baselineNodes = [
      { id: 'node_1', label: '192.168.1.100', type: 'ip', metadata: { confidence: 0.95, source: 'Network Sensor' } },
      { id: 'node_2', label: '10.0.0.5', type: 'ip', metadata: { confidence: 0.9, source: 'Network Sensor' } },
      { id: 'node_3', label: 'admin_user', type: 'persona', metadata: { confidence: 0.85, source: 'SOCMINT' } },
      { id: 'node_4', label: '0x123...abc', type: 'wallet', metadata: { confidence: 0.99, source: 'Ledger Analysis' } },
      { id: 'node_5', label: 'evil-corp.com', type: 'domain', metadata: { confidence: 0.8, source: 'DNS Log' } },
      { id: 'node_6', label: 'Tx_789xyz', type: 'transaction', metadata: { confidence: 0.99, source: 'Ledger Analysis' } },
      { id: 'node_7', label: 'malware.exe', type: 'code_artifact', metadata: { confidence: 0.95, source: 'Endpoint Agent' } },
      { id: 'node_8', label: 'John Doe', type: 'persona', metadata: { confidence: 0.7, source: 'OSINT' } },
      { id: 'node_9', label: 'john.doe@email.com', type: 'email', metadata: { confidence: 0.85, source: 'OSINT' } },
      { id: 'node_10', label: '172.16.0.1', type: 'ip', metadata: { confidence: 0.9, source: 'Network Sensor' } },
      { id: 'node_11', label: 'C2_Server_Alpha', type: 'metadata_artifact', metadata: { confidence: 0.85, source: 'Threat Intel' } }
    ];
    
    const baselineEdges = [
      { source: 'node_1', target: 'node_5', relationship: 'RESOLVES_TO', confidence: 0.9, dataSource: 'DNS Log' },
      { source: 'node_3', target: 'node_1', relationship: 'OPERATES_FROM', confidence: 0.85, dataSource: 'Auth Log' },
      { source: 'node_3', target: 'node_4', relationship: 'OWNS', confidence: 0.95, dataSource: 'OSINT' },
      { source: 'node_4', target: 'node_6', relationship: 'INITIATED', confidence: 0.99, dataSource: 'Ledger Analysis' },
      { source: 'node_6', target: 'node_5', relationship: 'FUNDS', confidence: 0.95, dataSource: 'Ledger Analysis' },
      { source: 'node_2', target: 'node_7', relationship: 'HOSTS', confidence: 0.9, dataSource: 'EDR' },
      { source: 'node_5', target: 'node_7', relationship: 'DISTRIBUTES', confidence: 0.8, dataSource: 'Threat Intel' },
      { source: 'node_8', target: 'node_9', relationship: 'USES', confidence: 0.9, dataSource: 'OSINT' },
      { source: 'node_9', target: 'node_3', relationship: 'ALIAS', confidence: 0.75, dataSource: 'Correlation Engine' },
      { source: 'node_10', target: 'node_2', relationship: 'COMMUNICATES_WITH', confidence: 0.85, dataSource: 'NetFlow' },
      { source: 'node_5', target: 'node_11', relationship: 'HOSTED_BY', confidence: 0.8, dataSource: 'Threat Intel' }
    ];

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...baselineNodes.filter(n => !prev.nodes.find(pn => pn.id === n.id))],
      edges: [...prev.edges, ...baselineEdges]
    }));
    notify({ type: 'success', title: 'Telemetry Bootstrapped', message: 'Baseline network entities and relationships synchronized.' });
    if (auth.currentUser) {
      incrementUserStat(auth.currentUser.uid, 'actionsTaken');
      unlockAchievement(auth.currentUser.uid, 'graph_weaver');
    }
  };

  if (!target) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-harvest-bg text-gray-300 font-mono overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-harvest-border flex items-center justify-between px-4 bg-harvest-card/50 backdrop-blur-md sticky top-0 z-[50]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tighter uppercase truncate max-w-[120px] sm:max-w-none">{target.name}</h1>
              <span className="mono-label !text-[8px] bg-harvest-bg px-2 py-0.5 rounded border border-harvest-border">
                {id?.slice(0, 8)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest hidden sm:block">
              POSTURE: {target.status} // OPS: {activePersona.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 hardware-surface !rounded-full mr-2">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-harvest-accent" />
              <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Stealth: {activePersona.anonymityScore.value}%</span>
            </div>
            <div className="w-px h-3 bg-harvest-border" />
            <div className="flex items-center gap-2 group relative">
              <CheckCircle2 size={12} className="text-harvest-info" />
              <span className="text-[9px] font-bold text-white uppercase tracking-tighter">GIC: {confidenceBreakdown.score}%</span>
              
              {/* Confidence Breakdown Tooltip */}
              <div className="absolute top-full right-0 mt-4 w-64 bg-harvest-card border border-harvest-border p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none backdrop-blur-xl">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-3 border-b border-harvest-border pb-2">Attribution Confidence Model</h4>
                <div className="space-y-3">
                  {confidenceBreakdown.factors.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] uppercase">
                        <span className="text-gray-500">{f.label}</span>
                        <span className="text-harvest-accent">+{f.points}</span>
                      </div>
                      <p className="text-[8px] text-gray-600 leading-tight">{f.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-harvest-border flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white">Aggregated Vector</span>
                  <span className="text-[10px] font-bold text-harvest-accent">{confidenceBreakdown.score}%</span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={generatePDFReport}
            className="hardware-button !py-2 !px-4 !text-[10px] flex items-center gap-2 mr-2"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="hardware-button !py-2 !px-4 !text-[10px] flex items-center gap-2 mr-2"
          >
            <Download size={14} />
            <span className="hidden sm:inline">EXPORT DB</span>
          </button>
          <button 
            onClick={() => {
              const bundle = generateStixBundle(target, reports, assessments, monitoringEvents, narrativeEvents, osintData, personaProfiles, attributionReports, synthesizedOutputs, anomalies);
              downloadStixJson(bundle, `STIX_Export_${target.id}.json`);
              notify({type: 'success', title: 'STIX Exported', message: 'Structured Intelligence Export generated.'});
            }}
            className="hardware-button !py-2 !px-4 !text-[10px] flex items-center gap-2 mr-2"
            title="Export STIX 2.1 JSON"
          >
            <Share2 size={14} className="text-[#ff00ff]"/>
            <span className="hidden sm:inline text-[#ff00ff]">STIX</span>
          </button>
          <button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="hardware-button-primary !py-2 !px-4 !text-[10px] flex items-center gap-2"
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span className="hidden sm:inline">{analyzing ? 'SCANNING...' : 'SCAN'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" id="report-container-pdf">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Scroller */}
          <div className="flex border-b border-harvest-border bg-harvest-bg/50 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth px-2">
            {[
              { id: 'reports', label: 'Feed', icon: Radio },
              { id: 'graph', label: 'Graph', icon: Database },
              { id: 'resolve', label: 'Resolve', icon: GitMerge },
              { id: 'code', label: 'Code', icon: Code2 },
              { id: 'financial', label: 'Ledger', icon: Bitcoin },
              { id: 'threat', label: 'Threat', icon: Shield },
              { id: 'monitoring', label: 'Live', icon: Activity },
              { id: 'osint', label: 'OSINT', icon: Globe },
              { id: 'profiling', label: 'Profile', icon: User },
              { id: 'link_personas', label: 'Linker', icon: LinkIcon },
              { id: 'attribution', label: 'Origin', icon: Zap },
              { id: 'synthesis', label: 'Synthesis', icon: Cpu },
              { id: 'visuals', label: 'Metrics', icon: BarChart3 },
              { id: 'anomalies', label: 'Alerts', icon: EyeOff },
              { id: 'ethics', label: 'Ethics', icon: Scale },
              { id: 'adversarial', label: 'Adversarial', icon: ShieldAlert },
              { id: 'infrastructure_fp', label: 'Infra FP', icon: Network },
              { id: 'actor_template', label: 'Actor Profile', icon: FileText },
              { id: 'fictional_personas', label: 'Fictional Gen', icon: User },
              { id: 'identity_correlator', label: 'Identity Correlator', icon: Network },
              { id: 'dark_web', label: 'Dark Web Scan', icon: Globe },
              { id: 'recon', label: 'Recon', icon: Server },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border-b-2 ${
                  activeTab === tab.id ? 'border-harvest-accent text-white bg-harvest-accent/5' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto bg-harvest-bg p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl mx-auto h-full"
              >
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    {/* Event Trigger & Artifact Upload Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <button 
                        onClick={triggerNarrativeEvent}
                        disabled={generatingEvent}
                        className="hardware-surface p-4 flex items-center justify-between hover:bg-harvest-accent/5 transition-colors group relative"
                      >
                         <div className="flex items-center gap-3">
                           <Zap size={20} className="text-purple-500 group-hover:scale-110 transition-transform" />
                           <div className="text-left">
                             <div className="flex items-center gap-2">
                               <p className="text-[10px] font-bold text-white uppercase">Trigger Neural Scan</p>
                               <HelpTooltip content="Initiates a polling cycle against external threat feeds to identify new events." />
                             </div>
                             <p className="text-[8px] text-gray-600 uppercase">Trigger real-time telemetry polling</p>
                           </div>
                         </div>
                         {generatingEvent && <Loader2 size={16} className="animate-spin text-purple-500" />}
                      </button>
                      <label className="hardware-surface p-4 flex items-center justify-between hover:bg-harvest-accent/5 transition-colors group cursor-pointer relative">
                         <div className="flex items-center gap-3">
                           <ImageIcon size={20} className="text-harvest-info group-hover:scale-110 transition-transform" />
                           <div className="text-left">
                             <div className="flex items-center gap-2">
                               <p className="text-[10px] font-bold text-white uppercase">Upload Artifact</p>
                               <HelpTooltip content="Upload an image artifact (e.g. malware screenshot, map) to be analyzed by visual ML models." />
                             </div>
                             <p className="text-[8px] text-gray-600 uppercase">Input image/data for analysis</p>
                           </div>
                         </div>
                         <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                      </label>
                    </div>

                    <NarrativeEventDisplay 
                      events={narrativeEvents} 
                      onResolve={(eventId) => id && resolveNarrativeEvent(id, eventId)}
                      loading={generatingEvent}
                    />

                    {reports.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()).map((report) => (
                      <div key={report.id} className="hardware-surface overflow-hidden !border-white/5">
                        <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="mono-label !text-harvest-accent">Phase {report.phase}</span>
                            <span className="mono-label hidden sm:inline">{report.source} Monitoring</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-[9px] font-bold text-harvest-accent bg-harvest-accent/10 py-1 px-2 rounded-full border border-harvest-accent/20">CONF: {report.confidence}</span>
                             <span className="text-[9px] text-gray-600 font-mono">{report.timestamp?.toDate().toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="p-6 prose prose-invert prose-xs max-w-none prose-p:text-gray-400 prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tighter prose-hr:border-white/5">
                          <ReactMarkdown>{report.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center text-gray-600 italic gap-4">
                        <FileText size={48} className="opacity-20" />
                        <p className="mono-label">NO INTELLIGENCE LOGGED</p>
                        <button 
                          onClick={runAnalysis}
                          className="text-[10px] font-bold text-harvest-accent hover:underline"
                        >
                          INITIATE FIRST SCAN
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'graph' && (
                  <div className="flex flex-col h-full relative">
                    <Graph 
                      nodes={graphData.nodes} 
                      links={graphData.edges} 
                      onRunCorrelation={handleRunCorrelation}
                      correlationData={correlationData}
                      isAnalyzing={analyzing}
                    />
                    {graphData.nodes.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-10">
                        <Database size={32} className="text-gray-600 mb-4" />
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">No Entity Topologies Detected</h4>
                        <p className="text-[10px] text-gray-500 font-mono mb-6 max-w-sm text-center">To initiate graph modeling, run an intelligence assessment or load test telemetry data.</p>
                        <button 
                          onClick={bootstrapTelemetryNetwork}
                          className="pointer-events-auto hardware-button px-6 py-2 flex items-center gap-2 bg-harvest-accent/10 hover:bg-harvest-accent/20 border-harvest-accent"
                        >
                          <Network size={14} className="text-harvest-accent" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Bootstrap Active Telemetry</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'resolve' && (
                  <div className="max-w-6xl mx-auto">
                    <EntityResolutionView 
                      nodes={graphData.nodes}
                      onMergeEntities={handleMergeEntities}
                      loading={analyzing}
                    />
                  </div>
                )}
                {activeTab === 'recon' && (
                  <div className="max-w-6xl mx-auto">
                    <ReconScanView targetId={id || ''} domain={target.name} />
                  </div>
                )}
                {activeTab === 'code' && (
                  <div className="max-w-6xl mx-auto">
                    <CodeScannerView target={target} />
                  </div>
                )}
                {activeTab === 'financial' && (
                  <div className="max-w-6xl mx-auto">
                    <FinancialTracingView target={target} />
                  </div>
                )}
                {activeTab === 'threat' && (
                  <div className="max-w-6xl mx-auto">
                    <ThreatAssessmentView assessments={assessments} onGenerate={runThreatAssessment} loading={analyzing} />
                  </div>
                )}
                {activeTab === 'monitoring' && (
                  <div className="max-w-6xl mx-auto">
                    <MonitoringView events={monitoringEvents} onPollTelemetry={runMonitoringCycle} loading={analyzing} />
                  </div>
                )}
                {activeTab === 'osint' && (
                  <div className="max-w-6xl mx-auto">
                    <PersonaOSINTView osintData={osintData} onProfile={handlePersonaProfile} loading={analyzing} personas={graphData.nodes.filter(n => n.type === 'persona')} />
                  </div>
                )}
                {activeTab === 'profiling' && (
                  <div className="max-w-6xl mx-auto">
                    <PersonaProfilingView profiles={personaProfiles} onProfile={handleAdvancedPersonaProfile} loading={analyzing} personas={graphData.nodes.filter(n => n.type === 'persona')} />
                  </div>
                )}
                {activeTab === 'link_personas' && (
                  <div className="max-w-6xl mx-auto">
                    <PersonaLinkerView 
                      personas={graphData.nodes.filter(n => n.type === 'persona')} 
                      profiles={personaProfiles} 
                      loading={analyzing} 
                      onConfirmLink={async (sourceId, targetId, rationale) => {
                        setAnalyzing(true);
                        try {
                           // For now simply add a logic event & mock merge
                           await addReport({
                             targetId: id || '',
                             phase: 4,
                             content: `### Persona Correlation Confirmed\n\n**Linked:** \`${graphData.nodes.find(n => n.id === sourceId)?.label || sourceId}\` and \`${graphData.nodes.find(n => n.id === targetId)?.label || targetId}\`.\n\n**Engine Rationale:** ${rationale}`,
                             source: 'Attribution Engine',
                             confidence: 'A'
                           });
                           
                           // Add edge in graph
                           setGraphData(prev => ({
                             nodes: prev.nodes,
                             edges: [...prev.edges, { source: sourceId, target: targetId, relationship: 'Linked Identity', confidence: 0.95 }]
                           }));
                           notify({ type: 'success', title: 'Persona Linked', message: 'The personas have been linked in the intelligence graph.' });
                        } finally {
                          setAnalyzing(false);
                        }
                      }}
                    />
                  </div>
                )}
                {activeTab === 'attribution' && (
                  <div className="max-w-6xl mx-auto">
                    <AttributionEngineView reports={attributionReports} onGenerate={runAttributionEngine} loading={analyzing} />
                  </div>
                )}
                {activeTab === 'personas' && (
                  <div className="max-w-6xl mx-auto">
                    <PersonaManager userId={auth.currentUser?.uid || ''} personas={personas} selectedPersonaId={selectedPersonaId} onSelect={setSelectedPersonaId} />
                  </div>
                )}
                {activeTab === 'synthesis' && (
                  <div className="max-w-6xl mx-auto">
                    <IntelligenceSynthesizer targetId={id || ''} targetName={target.name} intelligenceContext={reports.map(r => r.content).join('\n\n')} persona={selectedPersona} outputs={synthesizedOutputs} />
                  </div>
                )}
                {activeTab === 'visuals' && <VisualizationDashboard reports={reports} monitoringEvents={monitoringEvents} narrativeEvents={narrativeEvents} anomalies={anomalies} nodes={graphData.nodes} />}
                {activeTab === 'anomalies' && (
                  <div className="max-w-6xl mx-auto">
                    <AnomalyDetectionView targetId={id || ''} targetName={target.name} anomalies={anomalies} intelligenceContext={reports.map(r => r.content).join('\n\n')} persona={selectedPersona} />
                  </div>
                )}
                {activeTab === 'ethics' && (
                  <div className="max-w-6xl mx-auto">
                    <EthicalRiskAssessmentView targetId={id || ''} targetName={target.name} reports={reports} />
                  </div>
                )}
                {activeTab === 'adversarial' && (
                  <div className="max-w-6xl mx-auto">
                    <AdversarialTestingView targetId={id || ''} targetName={target.name} />
                  </div>
                )}
                {activeTab === 'infrastructure_fp' && (
                  <div className="max-w-6xl mx-auto">
                    <InfrastructureFingerprintingView target={target} intelligenceContext={reports.map(r => r.content).join('\n\n')} />
                  </div>
                )}
                {activeTab === 'actor_template' && (
                  <div className="max-w-6xl mx-auto">
                    <ThreatActorProfileTemplateView target={target} intelligenceContext={reports.map(r => r.content).join('\n\n')} />
                  </div>
                )}
                {activeTab === 'fictional_personas' && (
                  <div className="max-w-6xl mx-auto">
                    <FictionalPersonaGenerationView target={target} intelligenceContext={reports.map(r => r.content).join('\n\n')} />
                  </div>
                )}
                {activeTab === 'identity_correlator' as any && (
                  <div className="max-w-6xl mx-auto">
                    <IdentityCorrelatorView target={target} />
                  </div>
                )}
                {activeTab === 'dark_web' as any && (
                  <div className="max-w-6xl mx-auto">
                    <DarkWebScannerView target={target} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Action Tray - Visible on desktop, hidden or integrated on mobile */}
        <div className="hidden lg:block w-80 border-l border-harvest-border bg-harvest-card/30 p-6 space-y-8 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="mono-label">Target Metadata</h3>
            <div className="hardware-surface p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="mono-label !text-[8px]">Type</span>
                <span className="text-[10px] text-white uppercase">{target.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="mono-label !text-[8px]">Posture</span>
                <span className="text-[10px] text-harvest-accent uppercase">{target.status}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="mono-label !text-[8px]">GIC Score</span>
                  <span className="text-[10px] text-harvest-info uppercase">{target.confidenceScore}%</span>
                </div>
                <div className="h-1 bg-harvest-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${target.confidenceScore}%` }}
                    className="h-full bg-harvest-info" 
                  />
                </div>
              </div>
            </div>

            <h3 className="mono-label">Infrastructure Resolve</h3>
            <div className="space-y-2">
              {graphData.nodes.slice(0, 10).map((node, i) => (
                <div key={i} className="flex items-center justify-between p-3 hardware-surface !bg-transparent text-[10px] hover:bg-white/[0.02] transition-colors">
                  <span className="text-gray-400 truncate mr-2">{node.label}</span>
                  <span className="text-[8px] uppercase px-2 py-0.5 bg-gray-900 text-harvest-info rounded">{node.type}</span>
                </div>
              ))}
              {graphData.nodes.length === 0 && <p className="text-[10px] text-gray-700 italic px-2 uppercase tracking-widest">No nodes resolved</p>}
            </div>

            <h3 className="mono-label">System Feed</h3>
            <div className="space-y-3 px-2">
               <div className="flex gap-3 text-[9px] uppercase">
                <CheckCircle2 size={12} className="text-harvest-accent shrink-0" />
                <span className="text-gray-500">Neural bridge ready</span>
              </div>
              {analyzing && (
                <div className="flex gap-3 text-[9px] uppercase">
                  <Loader2 size={12} className="text-harvest-info animate-spin shrink-0" />
                  <span className="text-harvest-info">Retrieving telemetry...</span>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-harvest-border space-y-2">
              <div className="flex gap-2">
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="bg-black/50 border border-white/10 text-[9px] uppercase font-bold text-gray-400 p-2 outline-none focus:border-harvest-accent rounded"
                >
                  <option value="json">JSON</option>
                  <option value="neo4j">Neo4j Cypher</option>
                  <option value="maltego">Maltego CSV</option>
                </select>
                <button 
                  onClick={() => exportGraphData(exportFormat)}
                  disabled={graphData.nodes.length === 0}
                  className="flex-1 hardware-surface !bg-transparent !py-2 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors group"
                >
                  <Share2 size={12} className="text-gray-500 group-hover:text-harvest-accent" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">Mirror State</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ExportDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        target={target}
        reports={reports}
        assessments={assessments}
        graphData={graphData}
        role={settings?.role}
      />
    </div>
  );
};
