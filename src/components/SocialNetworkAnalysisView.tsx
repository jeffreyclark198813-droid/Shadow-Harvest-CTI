import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Network, Users, GitMerge, Fingerprint, Activity, Zap, 
  Search, Filter, Download, ArrowRight, Clock, ShieldCheck, 
  ExternalLink, Layers, Route, CheckCircle2, XCircle, AlertTriangle, 
  Sliders, Eye, Key, Send, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { AdvancedPersonaProfile } from '../services/dbService';
import { 
  DigitalIdentityCorrelation, 
  CommunicationPatternEvent, 
  SNAMetricData, 
  CommunityCluster, 
  IdentityVectorType 
} from '../types/intelligence_ops';
import { auth, db, addDoc, collection, serverTimestamp } from '../firebase';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';

interface SocialNetworkAnalysisViewProps {
  personas?: { id: string; label: string }[];
  profiles?: AdvancedPersonaProfile[];
  loading?: boolean;
  onLinkConfirmed?: (sourceId: string, targetId: string, rationale: string) => void;
}

interface SNAVisualNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'persona' | 'alias' | 'email' | 'wallet' | 'pgp' | 'infrastructure';
  role?: string;
  clusterId?: string;
  centrality?: number;
  anonymityRisk?: number;
  metadata?: any;
}

interface SNAVisualLink extends d3.SimulationLinkDatum<SNAVisualNode> {
  id: string;
  source: string | SNAVisualNode;
  target: string | SNAVisualNode;
  relationship: string;
  vector: IdentityVectorType | 'Encrypted Message Flow' | 'Financial Transfer';
  confidence: number;
  mitre?: string;
  frequency?: number;
}

export const SocialNetworkAnalysisView: React.FC<SocialNetworkAnalysisViewProps> = ({
  personas = [],
  profiles = [],
  loading = false,
  onLinkConfirmed
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'correlations' | 'comms' | 'matrix' | 'clusters'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [selectedVectorFilter, setSelectedVectorFilter] = useState<string>('ALL');
  const [selectedNode, setSelectedNode] = useState<SNAVisualNode | null>(null);
  const [pathSource, setPathSource] = useState<string>('');
  const [pathTarget, setPathTarget] = useState<string>('');
  const [computedPath, setComputedPath] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Correlation Creation Modal State
  const [isAddCorrelationOpen, setIsAddCorrelationOpen] = useState(false);
  const [newCorrSource, setNewCorrSource] = useState('');
  const [newCorrTarget, setNewCorrTarget] = useState('');
  const [newCorrVector, setNewCorrVector] = useState<IdentityVectorType>('Forum Alias ➔ Social Media');
  const [newCorrFootprint, setNewCorrFootprint] = useState('');
  const [newCorrConfidence, setNewCorrConfidence] = useState(0.85);

  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Base persona list with fallback synthetic dataset if empty
  const basePersonas = useMemo(() => {
    const defaultActors = [
      { id: 'actor-01', label: 'ShadowOperator_99' },
      { id: 'actor-02', label: 'NullSector_X' },
      { id: 'actor-03', label: 'CipherGhost' },
      { id: 'actor-04', label: 'Vortex_Broker' },
      { id: 'actor-05', label: 'KryptonDark' },
      { id: 'actor-06', label: 'ByteProwler' },
      { id: 'actor-07', label: 'MuleVault_Alpha' }
    ];

    const map = new Map<string, { id: string; label: string }>();
    defaultActors.forEach(a => map.set(a.id, a));
    (personas || []).forEach(p => {
      if (p.id) {
        map.set(p.id, { id: p.id, label: p.label || p.id });
      }
    });

    return Array.from(map.values());
  }, [personas]);

  // Dynamic Identity Correlations with cross-platform pattern matching
  const [correlations, setCorrelations] = useState<DigitalIdentityCorrelation[]>([
    {
      id: 'corr-01',
      sourceId: 'actor-01',
      sourceName: 'ShadowOperator_99',
      targetId: 'actor-02',
      targetName: 'NullSector_X',
      sharedFootprint: 'PGP Fingerprint match (4B81...C29F) on Dread & Exploit.in',
      confidence: 0.96,
      vector: 'PGP Key Fingerprint',
      mitreAlignment: 'T1588.002 - Obtain Capabilities: Tool',
      evidenceDetails: [
        'Shared subkey 0x9FA23B44 declared in key-server headers',
        'Co-located GPG sign requests within 350ms timestamp window',
        'Direct reuse of encrypted contact pubkey across Telegram and Jabber'
      ],
      status: 'confirmed',
      timestamp: Date.now() - 3600000 * 24
    },
    {
      id: 'corr-02',
      sourceId: 'actor-02',
      sourceName: 'NullSector_X',
      targetId: 'actor-03',
      targetName: 'CipherGhost',
      sharedFootprint: 'ProtonMail MX alias syntax "ns_ghost_relay@pm.me"',
      confidence: 0.91,
      vector: 'Email Pattern Match',
      mitreAlignment: 'T1589.002 - Gather Victim Email Addresses',
      evidenceDetails: [
        'Deterministic handle structure: prefix permutation with standard salt',
        'Simultaneous registration on 3 Russian-language cyber forums'
      ],
      status: 'confirmed',
      timestamp: Date.now() - 3600000 * 18
    },
    {
      id: 'corr-03',
      sourceId: 'actor-01',
      sourceName: 'ShadowOperator_99',
      targetId: 'actor-04',
      targetName: 'Vortex_Broker',
      sharedFootprint: 'Darknet escrow wallet transaction flow (0.42 BTC split)',
      confidence: 0.88,
      vector: 'Crypto Wallet Overlap',
      mitreAlignment: 'T1585.002 - Establish Accounts: Cloud/Crypto',
      evidenceDetails: [
        'Single-hop transfer to Wasabi Mixer pool address',
        'Zero confirmation delay indicating direct automated API sweep'
      ],
      status: 'suggested',
      timestamp: Date.now() - 3600000 * 12
    },
    {
      id: 'corr-04',
      sourceId: 'actor-03',
      sourceName: 'CipherGhost',
      targetId: 'actor-05',
      targetName: 'KryptonDark',
      sharedFootprint: 'X (Twitter) OSINT alias correlate @cipher_krypt99',
      confidence: 0.84,
      vector: 'Forum Alias ➔ Social Media',
      mitreAlignment: 'T1589.001 - Gather Victim Identity Information',
      evidenceDetails: [
        'Identical GitHub commit author name in leaked repo',
        'Bio description hash matching Telegram channel handle'
      ],
      status: 'suggested',
      timestamp: Date.now() - 3600000 * 8
    },
    {
      id: 'corr-05',
      sourceId: 'actor-05',
      sourceName: 'KryptonDark',
      targetId: 'actor-06',
      targetName: 'ByteProwler',
      sharedFootprint: 'Stylometric syntactic token overlap & cadence synchronization',
      confidence: 0.79,
      vector: 'Stylometric Signature',
      mitreAlignment: 'T1592 - Gather Victim Host/Software Info',
      evidenceDetails: [
        'Distinct punctuation pattern: double semicolon spacing and Cyrillic keyboard glyphs',
        'Inter-keystroke interval correlation score > 0.82'
      ],
      status: 'suggested',
      timestamp: Date.now() - 3600000 * 4
    },
    {
      id: 'corr-06',
      sourceId: 'actor-04',
      sourceName: 'Vortex_Broker',
      targetId: 'actor-07',
      targetName: 'MuleVault_Alpha',
      sharedFootprint: 'Automated USDT TRC20 micro-disbursement loop',
      confidence: 0.95,
      vector: 'Crypto Wallet Overlap',
      mitreAlignment: 'T1585.002 - Establish Accounts: Cloud/Crypto',
      evidenceDetails: [
        'Deterministic payout frequency every 4 hours',
        'Immediate cash-out through peer-to-peer exchange node'
      ],
      status: 'confirmed',
      timestamp: Date.now() - 3600000 * 2
    }
  ]);

  // Communication Pattern Events (24-hour diurnal tracking)
  const communicationEvents: CommunicationPatternEvent[] = useMemo(() => [
    { id: 'comm-1', sourceId: 'actor-01', targetId: 'actor-02', channel: 'Telegram', timestamp: Date.now() - 14400000, hourUTC: 2, frequencyBurst: 'critical', volumeBytes: 48920, encryptionMode: 'MTProto v2', protocolMetadata: { hopCount: 2, relayNode: 'Relay-Frankfurt-04' } },
    { id: 'comm-2', sourceId: 'actor-01', targetId: 'actor-04', channel: 'Matrix/Element', timestamp: Date.now() - 10800000, hourUTC: 3, frequencyBurst: 'high', volumeBytes: 120400, encryptionMode: 'Olm/Megolm', protocolMetadata: { hopCount: 3, relayNode: 'Synapse-Iceland' } },
    { id: 'comm-3', sourceId: 'actor-02', targetId: 'actor-03', channel: 'PGP Encrypted Forum', timestamp: Date.now() - 7200000, hourUTC: 4, frequencyBurst: 'medium', volumeBytes: 31200, encryptionMode: 'RSA-4096 / AES-256', protocolMetadata: { hopCount: 4, relayNode: 'Tor-Onion-V3' } },
    { id: 'comm-4', sourceId: 'actor-03', targetId: 'actor-05', channel: 'Signal', timestamp: Date.now() - 3600000, hourUTC: 5, frequencyBurst: 'high', volumeBytes: 84000, encryptionMode: 'Double Ratchet', protocolMetadata: { hopCount: 1, relayNode: 'Direct-Sealed-Sender' } },
    { id: 'comm-5', sourceId: 'actor-04', targetId: 'actor-07', channel: 'XMPP/Jabber', timestamp: Date.now() - 1800000, hourUTC: 3, frequencyBurst: 'critical', volumeBytes: 240000, encryptionMode: 'OMEMO', protocolMetadata: { hopCount: 2, relayNode: 'Ejabberd-Panama' } },
    { id: 'comm-6', sourceId: 'actor-05', targetId: 'actor-06', channel: 'Tor Hidden Service', timestamp: Date.now() - 900000, hourUTC: 4, frequencyBurst: 'low', volumeBytes: 14000, encryptionMode: 'TLS over Tor', protocolMetadata: { hopCount: 6, relayNode: 'Guard-Relay-CH' } }
  ], []);

  // Diurnal Circadian Activity Profile (24 Hours UTC)
  const diurnalActivityData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      hourNum: i,
      messageCount: 0,
      burstScore: 0,
      entropy: 0
    }));

    // Seed realistic circadian curve peaking in Eastern European / Asian timezone night hours (UTC 01:00 - 06:00)
    hours[0].messageCount = 18;
    hours[1].messageCount = 42;
    hours[2].messageCount = 94; // Peak
    hours[3].messageCount = 112; // High burst
    hours[4].messageCount = 88;
    hours[5].messageCount = 65;
    hours[6].messageCount = 28;
    hours[7].messageCount = 12;
    hours[8].messageCount = 4;
    hours[9].messageCount = 2;
    hours[10].messageCount = 3;
    hours[11].messageCount = 5;
    hours[12].messageCount = 8;
    hours[13].messageCount = 14;
    hours[14].messageCount = 22;
    hours[15].messageCount = 31;
    hours[16].messageCount = 29;
    hours[17].messageCount = 19;
    hours[18].messageCount = 14;
    hours[19].messageCount = 16;
    hours[20].messageCount = 20;
    hours[21].messageCount = 27;
    hours[22].messageCount = 35;
    hours[23].messageCount = 54;

    hours.forEach(h => {
      h.burstScore = Math.round((h.messageCount / 112) * 100);
      h.entropy = parseFloat((Math.sin(h.hourNum * 0.5) * 0.3 + 0.5).toFixed(2));
    });

    return hours;
  }, []);

  // Community Clusters (Syndi-Cells)
  const communityClusters: CommunityCluster[] = useMemo(() => [
    {
      id: 'cluster-alpha',
      name: 'Cell Alpha (Core Infrastructure & C2)',
      theme: 'Command, Payload Compilation & Key Management',
      color: '#00ff88',
      density: 0.88,
      memberIds: ['actor-01', 'actor-02', 'actor-03'],
      bridgePersonaIds: ['actor-01', 'actor-02']
    },
    {
      id: 'cluster-beta',
      name: 'Cell Beta (Financial & Broker Operations)',
      theme: 'Escrow Laundering, Cash-Outs & P2P Swaps',
      color: '#0088ff',
      density: 0.94,
      memberIds: ['actor-04', 'actor-07'],
      bridgePersonaIds: ['actor-04']
    },
    {
      id: 'cluster-gamma',
      name: 'Cell Gamma (Recon & Social Engineering)',
      theme: 'Darknet Forum Infiltration, OSINT & Credentials',
      color: '#ff00ff',
      density: 0.72,
      memberIds: ['actor-05', 'actor-06'],
      bridgePersonaIds: ['actor-05']
    }
  ], []);

  // Comprehensive SNA Metric Data
  const snaMetrics: SNAMetricData[] = useMemo(() => [
    {
      personaId: 'actor-01',
      label: 'ShadowOperator_99',
      role: 'Coordinator / Leader',
      degreeCentrality: 0.92,
      betweennessCentrality: 0.89,
      closenessCentrality: 0.85,
      eigenvectorCentrality: 0.94,
      clusteringCoefficient: 0.78,
      anonymityRiskScore: 88,
      totalDirectConnections: 5,
      dominantTimezone: 'UTC+3 (Moscow/Minsk)',
      primaryCommunicationChannel: 'Telegram / MTProto'
    },
    {
      personaId: 'actor-02',
      label: 'NullSector_X',
      role: 'Technical Specialist',
      degreeCentrality: 0.84,
      betweennessCentrality: 0.76,
      closenessCentrality: 0.79,
      eigenvectorCentrality: 0.82,
      clusteringCoefficient: 0.81,
      anonymityRiskScore: 74,
      totalDirectConnections: 4,
      dominantTimezone: 'UTC+3 (Eastern Europe)',
      primaryCommunicationChannel: 'PGP Encrypted Forum'
    },
    {
      personaId: 'actor-04',
      label: 'Vortex_Broker',
      role: 'Broker / Courier',
      degreeCentrality: 0.88,
      betweennessCentrality: 0.95,
      closenessCentrality: 0.88,
      eigenvectorCentrality: 0.86,
      clusteringCoefficient: 0.65,
      anonymityRiskScore: 92,
      totalDirectConnections: 4,
      dominantTimezone: 'UTC+2 (Kaliningrad/Kyiv)',
      primaryCommunicationChannel: 'Matrix / Synapse'
    },
    {
      personaId: 'actor-03',
      label: 'CipherGhost',
      role: 'Technical Specialist',
      degreeCentrality: 0.68,
      betweennessCentrality: 0.54,
      closenessCentrality: 0.62,
      eigenvectorCentrality: 0.65,
      clusteringCoefficient: 0.74,
      anonymityRiskScore: 65,
      totalDirectConnections: 3,
      dominantTimezone: 'UTC+3 (Moscow)',
      primaryCommunicationChannel: 'Signal Sealed-Sender'
    },
    {
      personaId: 'actor-05',
      label: 'KryptonDark',
      role: 'Peripheral Asset',
      degreeCentrality: 0.58,
      betweennessCentrality: 0.42,
      closenessCentrality: 0.51,
      eigenvectorCentrality: 0.49,
      clusteringCoefficient: 0.59,
      anonymityRiskScore: 58,
      totalDirectConnections: 2,
      dominantTimezone: 'UTC+8 (East Asia)',
      primaryCommunicationChannel: 'X (Twitter) / Telegram'
    },
    {
      personaId: 'actor-07',
      label: 'MuleVault_Alpha',
      role: 'Financial Mule',
      degreeCentrality: 0.45,
      betweennessCentrality: 0.28,
      closenessCentrality: 0.44,
      eigenvectorCentrality: 0.38,
      clusteringCoefficient: 0.90,
      anonymityRiskScore: 82,
      totalDirectConnections: 2,
      dominantTimezone: 'UTC+0 (Western Europe)',
      primaryCommunicationChannel: 'XMPP / OMEMO'
    },
    {
      personaId: 'actor-06',
      label: 'ByteProwler',
      role: 'Peripheral Asset',
      degreeCentrality: 0.38,
      betweennessCentrality: 0.19,
      closenessCentrality: 0.38,
      eigenvectorCentrality: 0.31,
      clusteringCoefficient: 0.50,
      anonymityRiskScore: 49,
      totalDirectConnections: 1,
      dominantTimezone: 'UTC+8 (China Standard)',
      primaryCommunicationChannel: 'Tor Hidden Service'
    }
  ], []);

  // Filtered correlations
  const filteredCorrelations = useMemo(() => {
    return correlations.filter(c => {
      const matchesConfidence = c.confidence >= minConfidence;
      const matchesVector = selectedVectorFilter === 'ALL' || c.vector === selectedVectorFilter;
      const matchesQuery = 
        !searchQuery || 
        c.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.targetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.sharedFootprint.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesConfidence && matchesVector && matchesQuery;
    });
  }, [correlations, minConfidence, selectedVectorFilter, searchQuery]);

  // Construct SNA Visual Graph Nodes and Links
  const graphData = useMemo<{ nodes: SNAVisualNode[]; links: SNAVisualLink[] }>(() => {
    const nodeMap = new Map<string, SNAVisualNode>();

    basePersonas.forEach((p, idx) => {
      const metric = snaMetrics.find(m => m.personaId === p.id);
      const cluster = communityClusters.find(c => c.memberIds.includes(p.id));
      nodeMap.set(p.id, {
        id: p.id,
        label: p.label,
        type: 'persona',
        role: metric?.role || 'Asset',
        clusterId: cluster?.id,
        centrality: metric?.betweennessCentrality || 0.5,
        anonymityRisk: metric?.anonymityRiskScore || 50,
        x: Math.cos((idx / basePersonas.length) * Math.PI * 2) * 220 + 350,
        y: Math.sin((idx / basePersonas.length) * Math.PI * 2) * 220 + 250
      });
    });

    const links: SNAVisualLink[] = [];
    filteredCorrelations.forEach(c => {
      const srcId = typeof c.sourceId === 'object' ? (c.sourceId as any)?.id : c.sourceId;
      const tgtId = typeof c.targetId === 'object' ? (c.targetId as any)?.id : c.targetId;
      if (srcId && tgtId && nodeMap.has(srcId) && nodeMap.has(tgtId)) {
        links.push({
          id: c.id,
          source: srcId,
          target: tgtId,
          relationship: c.vector,
          vector: c.vector,
          confidence: c.confidence,
          mitre: c.mitreAlignment,
          frequency: 1
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links
    };
  }, [basePersonas, snaMetrics, communityClusters, filteredCorrelations]);

  // Shortest Path Solver for Link Analysis
  const handleFindPath = () => {
    if (!pathSource || !pathTarget || pathSource === pathTarget) return;

    // Breadth-first search for unweighted graph
    const adjacency = new Map<string, string[]>();
    graphData.nodes.forEach(n => adjacency.set(n.id, []));

    graphData.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? (l.source as SNAVisualNode).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as SNAVisualNode).id : l.target;
      if (srcId && tgtId && adjacency.has(srcId) && adjacency.has(tgtId)) {
        adjacency.get(srcId)?.push(tgtId);
        adjacency.get(tgtId)?.push(srcId);
      }
    });

    const queue: Array<{ current: string; path: string[] }> = [{ current: pathSource, path: [pathSource] }];
    const visited = new Set<string>([pathSource]);
    let foundPath: string[] = [];

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;
      if (current === pathTarget) {
        foundPath = path;
        break;
      }

      const neighbors = adjacency.get(current) || [];
      for (const nbr of neighbors) {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          queue.push({ current: nbr, path: [...path, nbr] });
        }
      }
    }

    setComputedPath(foundPath);
    if (foundPath.length > 0) {
      showToast(`Shortest Path Found: ${foundPath.length - 1} intermediary link(s).`);
    } else {
      showToast('No connecting communication chain detected between selected personas.');
    }
  };

  // Confirm or Toggle Correlation Status with Audit Logging
  const handleToggleCorrelationStatus = async (corrId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'confirmed' ? 'suggested' : 'confirmed';
    setCorrelations(prev => prev.map(c => c.id === corrId ? { ...c, status: newStatus as any } : c));

    const corr = correlations.find(c => c.id === corrId);
    if (corr && onLinkConfirmed) {
      onLinkConfirmed(corr.sourceId, corr.targetId, `Analyst marked correlation as ${newStatus.toUpperCase()}: ${corr.sharedFootprint}`);
    }

    // Record in Firestore audit logs
    const user = auth.currentUser;
    if (user && corr) {
      try {
        await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'SNA_LINK_CONFIRMATION',
          targetId: corr.id,
          details: `Analyst updated link between ${corr.sourceName} and ${corr.targetName} to ${newStatus}`,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error('Audit log error:', err);
      }
    }

    showToast(`Correlation marked as ${newStatus.toUpperCase()}`);
  };

  // Add Custom Analyst Link Correlation
  const handleAddCorrelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorrSource || !newCorrTarget || newCorrSource === newCorrTarget) {
      showToast('Please select two distinct personas.');
      return;
    }

    const srcObj = basePersonas.find(p => p.id === newCorrSource);
    const tgtObj = basePersonas.find(p => p.id === newCorrTarget);

    const newEntry: DigitalIdentityCorrelation = {
      id: `custom-corr-${Date.now()}`,
      sourceId: newCorrSource,
      sourceName: srcObj?.label || newCorrSource,
      targetId: newCorrTarget,
      targetName: tgtObj?.label || newCorrTarget,
      sharedFootprint: newCorrFootprint || 'Manual Analyst Graph Link Discovery',
      confidence: newCorrConfidence,
      vector: newCorrVector,
      mitreAlignment: 'T1589 - Gather Victim Identity Information',
      evidenceDetails: ['Manually established via analyst link analysis matrix'],
      status: 'confirmed',
      timestamp: Date.now()
    };

    setCorrelations(prev => [newEntry, ...prev]);
    setIsAddCorrelationOpen(false);
    setNewCorrFootprint('');
    showToast('New identity link established and added to graph topology.');

    // Save to Firestore audit log
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'SNA_LINK_CREATION',
          targetId: newEntry.id,
          details: `Manual link created between ${newEntry.sourceName} and ${newEntry.targetName} (${newCorrVector})`,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error('Audit log error:', err);
      }
    }
  };

  // D3 Force Simulation for Interactive Graph Analysis
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0 || activeTab !== 'graph') return;

    const width = svgRef.current.clientWidth || 700;
    const height = svgRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial center transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, height / 8).scale(0.85));

    // Deep clone nodes and links so D3 force simulation doesn't mutate React state or cause invalid source/target mappings
    const simNodes: SNAVisualNode[] = graphData.nodes.map(n => ({ ...n }));
    const simNodeIds = new Set(simNodes.map(n => n.id));
    const simLinks: SNAVisualLink[] = graphData.links
      .filter(l => {
        const s = typeof l.source === 'object' ? (l.source as SNAVisualNode).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as SNAVisualNode).id : l.target;
        return simNodeIds.has(s) && simNodeIds.has(t);
      })
      .map(l => ({
        ...l,
        source: typeof l.source === 'object' ? (l.source as SNAVisualNode).id : l.source,
        target: typeof l.target === 'object' ? (l.target as SNAVisualNode).id : l.target
      }));

    // Force Simulation with cluster community gravity
    const simulation = d3.forceSimulation<SNAVisualNode>(simNodes)
      .force('link', d3.forceLink<SNAVisualNode, SNAVisualLink>(simLinks).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-650))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // Arrow marker definitions for directed edges
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#00ff88');

    // Render Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => {
        const isPathLink = 
          computedPath.length > 1 && 
          computedPath.some((nodeId, idx) => {
            if (idx === computedPath.length - 1) return false;
            const nextNodeId = computedPath[idx + 1];
            const src = typeof d.source === 'object' ? (d.source as SNAVisualNode).id : d.source;
            const tgt = typeof d.target === 'object' ? (d.target as SNAVisualNode).id : d.target;
            return (src === nodeId && tgt === nextNodeId) || (tgt === nodeId && src === nextNodeId);
          });

        if (isPathLink) return '#ffff00';
        switch (d.vector) {
          case 'PGP Key Fingerprint': return '#00ff88';
          case 'Crypto Wallet Overlap': return '#ff00ff';
          case 'Email Pattern Match': return '#0088ff';
          case 'Forum Alias ➔ Social Media': return '#ffaa00';
          case 'Stylometric Signature': return '#ff3366';
          default: return '#555';
        }
      })
      .attr('stroke-width', (d) => {
        const isPathLink = 
          computedPath.length > 1 && 
          computedPath.some((nodeId, idx) => {
            if (idx === computedPath.length - 1) return false;
            const nextNodeId = computedPath[idx + 1];
            const src = typeof d.source === 'object' ? (d.source as SNAVisualNode).id : d.source;
            const tgt = typeof d.target === 'object' ? (d.target as SNAVisualNode).id : d.target;
            return (src === nodeId && tgt === nextNodeId) || (tgt === nodeId && src === nextNodeId);
          });
        return isPathLink ? 3.5 : Math.max(1.5, d.confidence * 3);
      })
      .attr('stroke-dasharray', (d) => d.confidence < 0.85 ? '4,4' : 'none')
      .attr('stroke-opacity', 0.8);

    // Node Groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseover', (event, d) => {
        // Opacity highlight for connected network
        node.style('opacity', (n: any) => {
          if (n.id === d.id) return 1;
          const isConnected = simLinks.some(l => {
            const s = typeof l.source === 'object' ? (l.source as SNAVisualNode).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as SNAVisualNode).id : l.target;
            return (s === d.id && t === n.id) || (t === d.id && s === n.id);
          });
          return isConnected ? 1 : 0.2;
        });

        link.style('stroke-opacity', (l: any) => {
          const s = typeof l.source === 'object' ? (l.source as SNAVisualNode).id : l.source;
          const t = typeof l.target === 'object' ? (l.target as SNAVisualNode).id : l.target;
          return (s === d.id || t === d.id) ? 1 : 0.1;
        });

        const cluster = communityClusters.find(c => c.id === d.clusterId);
        tooltip
          .style('opacity', 1)
          .html(`
            <div class="text-[11px] font-bold text-white uppercase font-mono">${d.label}</div>
            <div class="text-[9px] text-harvest-accent uppercase font-mono font-bold mt-0.5">${d.role}</div>
            <div class="text-[9px] text-gray-400 font-mono mt-1">Betweenness: <span class="text-white">${((d.centrality || 0) * 100).toFixed(0)}%</span></div>
            <div class="text-[9px] text-gray-400 font-mono">Anonymity Degradation: <span class="text-red-400 font-bold">${d.anonymityRisk}%</span></div>
            ${cluster ? `<div class="text-[8px] text-[#00ffcc] font-mono mt-1">${cluster.name}</div>` : ''}
          `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 14}px`)
          .style('top', `${event.pageY - 20}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
        node.style('opacity', 1);
        link.style('stroke-opacity', 0.8);
      })
      .call(d3.drag<SVGGElement, SNAVisualNode>()
        .on('start', (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }) as any);

    // Node outer halo for bridge/keystone hubs
    node.append('circle')
      .attr('r', d => (d.centrality && d.centrality > 0.8) ? 22 : 16)
      .attr('fill', d => {
        const cluster = communityClusters.find(c => c.id === d.clusterId);
        return cluster ? `${cluster.color}15` : '#ffffff10';
      })
      .attr('stroke', d => {
        if (computedPath.includes(d.id)) return '#ffff00';
        if (d.centrality && d.centrality > 0.8) return '#00ff88';
        const cluster = communityClusters.find(c => c.id === d.clusterId);
        return cluster?.color || '#444';
      })
      .attr('stroke-width', d => (computedPath.includes(d.id) ? 3 : 1.5))
      .attr('stroke-dasharray', d => (d.centrality && d.centrality > 0.8 ? '3,3' : 'none'));

    // Node inner core
    node.append('circle')
      .attr('r', d => (d.centrality && d.centrality > 0.8) ? 10 : 7)
      .attr('fill', d => {
        if (computedPath.includes(d.id)) return '#ffff00';
        switch (d.role) {
          case 'Coordinator / Leader': return '#ff0033';
          case 'Broker / Courier': return '#00ff88';
          case 'Technical Specialist': return '#0088ff';
          case 'Financial Mule': return '#ff00ff';
          default: return '#888888';
        }
      });

    // Node Labels
    node.append('text')
      .attr('x', 18)
      .attr('y', 4)
      .text(d => d.label)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, activeTab, computedPath]);

  // Export Graph Matrix Data
  const handleExportCSV = () => {
    const rows = [
      ['Source_Actor', 'Target_Actor', 'Correlation_Vector', 'Confidence', 'Shared_Footprint', 'MITRE_TTP', 'Status'].join(',')
    ];

    correlations.forEach(c => {
      const wrap = (s: any) => `"${String(s || '').replace(/"/g, '""')}"`;
      rows.push([
        wrap(c.sourceName),
        wrap(c.targetName),
        wrap(c.vector),
        wrap(c.confidence),
        wrap(c.sharedFootprint),
        wrap(c.mitreAlignment),
        wrap(c.status)
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SNA_Network_Correlations_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported SNA Correlation Matrix to CSV.');
  };

  return (
    <div className="space-y-6 font-mono text-gray-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#111] border border-harvest-accent/60 text-harvest-accent px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs"
          >
            <Zap size={14} className="animate-pulse text-harvest-accent" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Tactical Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0d0d0d] p-5 rounded-2xl border border-[#222]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent">
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Social Network Analysis & Identity Correlator
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                Graph-Based Link Analysis, Circadian Flow & Cross-Platform Footprint Clustering
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-[#262626]">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'graph' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Route size={12} /> Graph Topology
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'correlations' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Fingerprint size={12} /> Identity Correlator ({correlations.length})
          </button>
          <button
            onClick={() => setActiveTab('comms')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'comms' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={12} /> Temporal Flow
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={12} /> SNA Metrics
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'clusters' ? 'bg-harvest-accent text-black shadow-lg shadow-harvest-accent/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers size={12} /> Syndi-Cells
          </button>
        </div>
      </div>

      {/* TAB 1: GRAPH TOPOLOGY & LINK ANALYSIS */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          {/* Quick Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="FILTER ACTOR / ALIAS..."
                className="bg-transparent text-[10px] uppercase font-bold text-white placeholder-gray-600 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <Filter size={14} className="text-harvest-accent" />
              <select
                value={selectedVectorFilter}
                onChange={e => setSelectedVectorFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase text-gray-300 outline-none w-full"
              >
                <option value="ALL">ALL CORRELATION VECTORS</option>
                <option value="PGP Key Fingerprint">PGP Key Fingerprint</option>
                <option value="Crypto Wallet Overlap">Crypto Wallet Overlap</option>
                <option value="Email Pattern Match">Email Pattern Match</option>
                <option value="Forum Alias ➔ Social Media">Forum Alias ➔ Social Media</option>
                <option value="Stylometric Signature">Stylometric Signature</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-lg border border-[#222]">
              <span className="text-[9px] uppercase text-gray-400 font-bold">Min Confidence:</span>
              <span className="text-[10px] text-harvest-accent font-bold">{(minConfidence * 100).toFixed(0)}%</span>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.05"
                value={minConfidence}
                onChange={e => setMinConfidence(parseFloat(e.target.value))}
                className="w-24 accent-harvest-accent cursor-pointer ml-2"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsAddCorrelationOpen(true)}
                className="bg-harvest-accent/10 hover:bg-harvest-accent/20 border border-harvest-accent/40 text-harvest-accent px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5"
              >
                <GitMerge size={12} /> Link Identities
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5"
              >
                <Download size={12} /> CSV
              </button>
            </div>
          </div>

          {/* Interactive Graph Canvas and Path Tracer */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Graph Visual Stage */}
            <div className="lg:col-span-3 h-[580px] bg-black/80 rounded-2xl border border-[#222] relative overflow-hidden">
              <svg ref={svgRef} className="w-full h-full" />
              <div 
                ref={tooltipRef}
                className="fixed pointer-events-none p-3 rounded-lg bg-black/95 border border-[#333] shadow-2xl z-50 transition-opacity opacity-0"
              />

              {/* Graph Legend Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md p-3 rounded-xl border border-[#222] space-y-1.5">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actor Roles & Keystone Hubs</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-gray-400 uppercase font-mono">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ff0033]" /> Coordinator / Leader</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00ff88]" /> Broker / Courier</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0088ff]" /> Technical Specialist</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ff00ff]" /> Financial Mule</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border border-dashed border-[#00ff88]" /> Keystone Hub (High Centrality)</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ffff00]" /> Active Path Tracer</div>
                </div>
              </div>
            </div>

            {/* Sidebar: Path Finder & Entity Inspector */}
            <div className="space-y-4">
              {/* Path Routing Utility */}
              <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] space-y-3">
                <div className="flex items-center justify-between border-b border-[#222] pb-2">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Route size={13} className="text-harvest-accent" />
                    Shortest Chain Tracer
                  </h4>
                  {computedPath.length > 0 && (
                    <button onClick={() => setComputedPath([])} className="text-[8px] text-gray-500 hover:text-red-400 uppercase">
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase">Source Actor</label>
                    <select
                      value={pathSource}
                      onChange={e => setPathSource(e.target.value)}
                      className="w-full bg-black/60 border border-[#222] rounded-lg p-2 text-[9px] text-white uppercase mt-0.5 outline-none"
                    >
                      <option value="">SELECT SOURCE ACTOR</option>
                      {basePersonas.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase">Target Actor</label>
                    <select
                      value={pathTarget}
                      onChange={e => setPathTarget(e.target.value)}
                      className="w-full bg-black/60 border border-[#222] rounded-lg p-2 text-[9px] text-white uppercase mt-0.5 outline-none"
                    >
                      <option value="">SELECT TARGET ACTOR</option>
                      {basePersonas.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleFindPath}
                    disabled={!pathSource || !pathTarget}
                    className="w-full bg-harvest-accent text-black font-bold py-2 rounded-lg text-[9px] uppercase tracking-wider hover:bg-harvest-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-1"
                  >
                    Solve Intermediary Chain
                  </button>
                </div>

                {computedPath.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-black/60 border border-yellow-500/30 space-y-1.5">
                    <p className="text-[8px] text-yellow-400 font-bold uppercase">Chain Link ({computedPath.length} Nodes):</p>
                    <div className="text-[9px] text-gray-300 font-mono space-y-1">
                      {computedPath.map((nodeId, idx) => {
                        const nodeObj = basePersonas.find(p => p.id === nodeId);
                        return (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-[8px] text-yellow-500 font-bold">{idx + 1}.</span>
                            <span className="text-white font-bold">{nodeObj?.label || nodeId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Node Inspector Drawer */}
              <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] space-y-3">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#222] pb-2">
                  <Eye size={13} className="text-blue-400" />
                  Entity Inspector
                </h4>
                {selectedNode ? (
                  <div className="space-y-3 text-[10px]">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase">Primary Handle</p>
                      <p className="text-sm font-bold text-white">{selectedNode.label}</p>
                      <p className="text-[8px] text-gray-500">ID: {selectedNode.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/50 p-2 rounded border border-[#222]">
                        <p className="text-[8px] text-gray-500 uppercase">Assigned Role</p>
                        <p className="text-[9px] font-bold text-harvest-accent uppercase mt-0.5">{selectedNode.role}</p>
                      </div>
                      <div className="bg-black/50 p-2 rounded border border-[#222]">
                        <p className="text-[8px] text-gray-500 uppercase">Betweenness</p>
                        <p className="text-[9px] font-bold text-blue-400 mt-0.5">{((selectedNode.centrality || 0) * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-[#222]">
                      <p className="text-[8px] text-gray-500 uppercase">Anonymity Degradation Index</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${selectedNode.anonymityRisk || 50}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-red-400 font-bold">{selectedNode.anonymityRisk}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[9px] text-gray-600 italic">
                    Click any node on the graph topology to inspect identity metadata and centrality metrics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-PLATFORM IDENTITY CORRELATOR */}
      {activeTab === 'correlations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cross-Platform Identity Footprint Matches</h3>
              <p className="text-[9px] text-gray-500 uppercase mt-0.5">Correlating disparate aliases, cryptographic keys, and communication channels</p>
            </div>
            <button
              onClick={() => setIsAddCorrelationOpen(true)}
              className="bg-harvest-accent text-black font-bold px-3.5 py-2 rounded-lg text-[10px] uppercase flex items-center gap-1.5 hover:bg-harvest-accent/90"
            >
              <GitMerge size={12} /> Add Link Correlation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCorrelations.map(corr => (
              <motion.div
                key={corr.id}
                whileHover={{ y: -2 }}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  corr.status === 'confirmed' ? 'bg-[#0d0d0d] border-harvest-accent/30' : 'bg-[#0a0a0a] border-[#222]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase">{corr.sourceName}</span>
                    <span className="text-harvest-accent font-mono">➔</span>
                    <span className="text-xs font-bold text-white uppercase">{corr.targetName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-harvest-accent/10 border border-harvest-accent/30 text-harvest-accent">
                      {(corr.confidence * 100).toFixed(0)}% MATCH
                    </span>
                    <button
                      onClick={() => handleToggleCorrelationStatus(corr.id, corr.status)}
                      className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition-all flex items-center gap-1 ${
                        corr.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-red-500/20 hover:text-red-400' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-green-500/20 hover:text-green-400'
                      }`}
                    >
                      {corr.status === 'confirmed' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                      {corr.status === 'confirmed' ? 'CONFIRMED' : 'SUGGESTED'}
                    </button>
                  </div>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#1f1f1f] space-y-1.5">
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase">
                    <span>Vector: <strong className="text-gray-300">{corr.vector}</strong></span>
                    <span>MITRE: <strong className="text-blue-400">{corr.mitreAlignment.split(' - ')[0]}</strong></span>
                  </div>
                  <p className="text-xs text-harvest-accent font-bold font-mono">{corr.sharedFootprint}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">Correlation Evidence Chain:</p>
                  <ul className="space-y-0.5">
                    {corr.evidenceDetails.map((ev, idx) => (
                      <li key={idx} className="text-[9px] text-gray-400 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-harvest-accent font-bold">›</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPORAL COMMUNICATION FLOW & DIURNAL ANALYSIS */}
      {activeTab === 'comms' && (
        <div className="space-y-6">
          {/* Diurnal 24h UTC Activity Histogram */}
          <div className="bg-[#0d0d0d] p-6 rounded-2xl border border-[#222] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#222] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-harvest-accent" />
                  Diurnal Circadian Activity Profile (24-Hour UTC)
                </h3>
                <p className="text-[9px] text-gray-500 uppercase mt-0.5">
                  Analysis of inter-actor messaging peaks indicating primary operational timezones
                </p>
              </div>
              <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded-lg border border-[#222] text-[9px] font-mono">
                <span className="text-gray-500">INFERRED TIMEZONE:</span>
                <span className="text-harvest-accent font-bold">UTC+3 (Eastern Europe / Moscow)</span>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diurnalActivityData}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="hour" stroke="#555" fontSize={9} tickLine={false} />
                  <YAxis stroke="#555" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#00ff88' }}
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey="messageCount" stroke="#00ff88" strokeWidth={2} fill="url(#colorMessages)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Communication Intercept Channels */}
          <div className="bg-[#0d0d0d] p-6 rounded-2xl border border-[#222] space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              Observed Encrypted Communication Streams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {communicationEvents.map(event => (
                <div key={event.id} className="bg-black/60 p-4 rounded-xl border border-[#222] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase">{event.channel}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                      BURST: {event.frequencyBurst.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-300">
                    <span>{event.sourceId}</span>
                    <span className="text-harvest-accent mx-2">↔</span>
                    <span>{event.targetId}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1a1a1a] text-[9px] text-gray-500 space-y-0.5">
                    <div>Encryption: <span className="text-gray-300">{event.encryptionMode}</span></div>
                    <div>Relay Node: <span className="text-blue-400">{event.protocolMetadata.relayNode}</span></div>
                    <div>Payload Size: <span className="text-gray-300 font-mono">{(event.volumeBytes / 1024).toFixed(1)} KB</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUANTITATIVE SNA METRICS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0d0d0d] p-6 rounded-2xl border border-[#222] space-y-4">
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Network Metric Calculations</h3>
              <p className="text-[9px] text-gray-500 uppercase mt-0.5">Quantitative degree, betweenness, and eigenvector centrality indices</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
            >
              <Download size={11} /> Export Matrix
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[#222] text-gray-500 uppercase">
                  <th className="pb-3 px-2">Actor Identifier</th>
                  <th className="pb-3 px-2">Assigned Role</th>
                  <th className="pb-3 px-2">Betweenness</th>
                  <th className="pb-3 px-2">Eigenvector</th>
                  <th className="pb-3 px-2">Degree</th>
                  <th className="pb-3 px-2">Clustering</th>
                  <th className="pb-3 px-2">Anonymity Risk</th>
                  <th className="pb-3 px-2">Dominant TZ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {snaMetrics.map(metric => (
                  <tr key={metric.personaId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 font-bold text-white uppercase">{metric.label}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-white/5 border border-white/10 text-gray-300 uppercase">
                        {metric.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-harvest-accent font-bold">{(metric.betweennessCentrality * 100).toFixed(1)}%</td>
                    <td className="py-3 px-2 text-blue-400 font-bold">{(metric.eigenvectorCentrality * 100).toFixed(1)}%</td>
                    <td className="py-3 px-2 text-gray-300">{(metric.degreeCentrality * 100).toFixed(1)}% ({metric.totalDirectConnections})</td>
                    <td className="py-3 px-2 text-purple-400">{(metric.clusteringCoefficient * 100).toFixed(1)}%</td>
                    <td className="py-3 px-2 font-bold text-red-400">{metric.anonymityRiskScore}%</td>
                    <td className="py-3 px-2 text-gray-400">{metric.dominantTimezone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYNDI-CELL COMMUNITIES & CLUSTERS */}
      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communityClusters.map(cluster => (
            <div 
              key={cluster.id} 
              className="bg-[#0d0d0d] p-5 rounded-2xl border transition-all space-y-4"
              style={{ borderColor: `${cluster.color}40` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">{cluster.name}</h4>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5">{cluster.theme}</p>
                </div>
                <div 
                  className="w-3 h-3 rounded-full shadow-lg"
                  style={{ backgroundColor: cluster.color, boxShadow: `0 0 10px ${cluster.color}` }}
                />
              </div>

              <div className="bg-black/60 p-3 rounded-xl border border-[#222] space-y-2">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Modularity Density:</span>
                  <span className="text-white font-bold font-mono">{(cluster.density * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cluster.density * 100}%`, backgroundColor: cluster.color }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">Identified Members ({cluster.memberIds.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.memberIds.map(memId => {
                    const personaObj = basePersonas.find(p => p.id === memId);
                    return (
                      <span key={memId} className="px-2 py-1 rounded bg-black/60 border border-[#222] text-[9px] text-gray-300 font-bold uppercase">
                        {personaObj?.label || memId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1a1a1a] text-[8px] text-gray-500 space-y-0.5">
                <span>Key Bridge Nodes: </span>
                <span className="text-harvest-accent font-bold">
                  {cluster.bridgePersonaIds.map(b => basePersonas.find(p => p.id === b)?.label || b).join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE IDENTITY CORRELATION MODAL */}
      <AnimatePresence>
        {isAddCorrelationOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-[#333] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <GitMerge size={14} className="text-harvest-accent" />
                  Establish New Identity Correlation Link
                </h3>
                <button onClick={() => setIsAddCorrelationOpen(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddCorrelation} className="space-y-4 text-[10px]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Source Persona</label>
                    <select
                      value={newCorrSource}
                      onChange={e => setNewCorrSource(e.target.value)}
                      required
                      className="w-full bg-black border border-[#222] rounded-lg p-2.5 text-[9px] text-white uppercase mt-1 outline-none"
                    >
                      <option value="">SELECT SOURCE</option>
                      {basePersonas.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-bold">Target Persona</label>
                    <select
                      value={newCorrTarget}
                      onChange={e => setNewCorrTarget(e.target.value)}
                      required
                      className="w-full bg-black border border-[#222] rounded-lg p-2.5 text-[9px] text-white uppercase mt-1 outline-none"
                    >
                      <option value="">SELECT TARGET</option>
                      {basePersonas.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] text-gray-500 uppercase font-bold">Correlation Vector</label>
                  <select
                    value={newCorrVector}
                    onChange={e => setNewCorrVector(e.target.value as IdentityVectorType)}
                    className="w-full bg-black border border-[#222] rounded-lg p-2.5 text-[9px] text-white uppercase mt-1 outline-none"
                  >
                    <option value="PGP Key Fingerprint">PGP Key Fingerprint</option>
                    <option value="Crypto Wallet Overlap">Crypto Wallet Overlap</option>
                    <option value="Email Pattern Match">Email Pattern Match</option>
                    <option value="Forum Alias ➔ Social Media">Forum Alias ➔ Social Media</option>
                    <option value="Stylometric Signature">Stylometric Signature</option>
                    <option value="Dark Web Alias">Dark Web Alias</option>
                    <option value="Infrastructure Re-use">Infrastructure Re-use</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] text-gray-500 uppercase font-bold">Shared Digital Footprint / Evidence</label>
                  <input
                    type="text"
                    required
                    value={newCorrFootprint}
                    onChange={e => setNewCorrFootprint(e.target.value)}
                    placeholder="e.g. Matching PGP Subkey ID 0x8FA12 or shared email alias"
                    className="w-full bg-black border border-[#222] rounded-lg p-2.5 text-[9px] text-white mt-1 outline-none placeholder:text-gray-700 font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[8px] text-gray-500 uppercase font-bold">
                    <span>Analyst Confidence Score</span>
                    <span className="text-harvest-accent font-bold">{(newCorrConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={newCorrConfidence}
                    onChange={e => setNewCorrConfidence(parseFloat(e.target.value))}
                    className="w-full accent-harvest-accent cursor-pointer mt-1"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-harvest-accent text-black font-bold py-2.5 rounded-lg uppercase tracking-wider text-[9px] hover:bg-harvest-accent/90"
                  >
                    Establish Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddCorrelationOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white uppercase text-[9px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
