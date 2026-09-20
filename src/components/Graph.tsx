import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Loader2, Zap, Network, Layers, GitMerge, Filter, ChevronDown, ChevronUp, Search, HelpCircle, Download, Database, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpTooltip } from './HelpTooltip';
import { Neo4jIntegrationModal } from './Neo4jIntegrationModal';
import { calculateGraphStats } from '../services/unifiedGraphService';

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  metadata?: any;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  relationship: string;
  confidence?: number;
  dataSource?: string;
}

export interface CorrelationData {
  calculatedCentrality?: { nodeId: string, centralityScore: number, explanation: string }[];
  detectedClusters?: { clusterId: string, nodeIds: string[], theme: string }[];
  hiddenPaths?: { sourceId: string, targetId: string, path: string[], significance: string }[];
}

interface GraphProps {
  nodes: Node[];
  links: Link[];
  onRunCorrelation?: () => void;
  correlationData?: CorrelationData;
  isAnalyzing?: boolean;
}

export const Graph: React.FC<GraphProps> = ({ nodes, links, onRunCorrelation, correlationData, isAnalyzing }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isNeo4jModalOpen, setIsNeo4jModalOpen] = useState(false);

  const handleExportCSV = () => {
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const csvRows = [
      ['Source_ID', 'Source_Label', 'Source_Type', 'Relationship', 'Target_ID', 'Target_Label', 'Target_Type', 'Confidence', 'DataSource'].join(',')
    ];

    links.forEach(l => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as Node).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as Node).id;
      
      const sourceNode = nodeMap.get(sourceId) || { label: sourceId, type: 'unknown' };
      const targetNode = nodeMap.get(targetId) || { label: targetId, type: 'unknown' };

      const wrap = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      
      csvRows.push([
        wrap(sourceId),
        wrap(sourceNode.label),
        wrap(sourceNode.type),
        wrap(l.relationship),
        wrap(targetId),
        wrap(targetNode.label),
        wrap(targetNode.type),
        wrap(l.confidence || ''),
        wrap(l.dataSource || '')
      ].join(','));
    });

    // Add standalone nodes that have no relationships
    const linkedNodeIds = new Set();
    links.forEach(l => {
      linkedNodeIds.add(typeof l.source === 'string' ? l.source : (l.source as Node).id);
      linkedNodeIds.add(typeof l.target === 'string' ? l.target : (l.target as Node).id);
    });

    nodes.forEach(n => {
      if (!linkedNodeIds.has(n.id)) {
        const wrap = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
        csvRows.push([
          wrap(n.id),
          wrap(n.label),
          wrap(n.type),
          wrap('Standalone'),
          '""',
          '""',
          '""',
          '""',
          wrap(n.metadata?.source || '')
        ].join(','));
      }
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportNeo4j = () => {
    let cypher = '// Neo4j Cypher Import Script\n';
    filteredNodes.forEach(n => {
      const safeType = n.type.replace(/[^a-zA-Z0-9]/g, '_');
      const safeId = n.id.replace(/[^a-zA-Z0-9]/g, '_');
      cypher += `MERGE (n${safeId}:${safeType} {id: "${n.id}", label: "${(n.label||'').replace(/"/g, '\\"')}"})\n`;
    });
    filteredLinks.forEach(l => {
      const srcId = typeof l.source === 'object' ? (l.source as Node).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as Node).id : l.target;
      const safeSrc = srcId.replace(/[^a-zA-Z0-9]/g, '_');
      const safeTgt = tgtId.replace(/[^a-zA-Z0-9]/g, '_');
      const safeRel = (l.relationship||'RELATES_TO').toUpperCase().replace(/[^A-Z0-9]/g, '_');
      cypher += `MERGE (n${safeSrc})-[:${safeRel}]->(n${safeTgt})\n`;
    });

    const blob = new Blob([cypher], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neo4j_import.cypher`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMaltego = () => {
    const csvRows = [];
    csvRows.push(['Entity.Type1', 'Entity.Value1', 'Entity.Type2', 'Entity.Value2', 'Link.Label'].join(','));
    const wrap = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    
    const mapType = (t: string) => {
      switch(t) {
         case 'persona': return 'maltego.Person';
         case 'email': return 'maltego.EmailAddress';
         case 'domain': return 'maltego.Domain';
         case 'ip': return 'maltego.IPv4Address';
         case 'wallet': return 'maltego.CryptocurrencyWallet';
         default: return `maltego.Unknown`;
      }
    };

    filteredLinks.forEach(l => {
      const srcNode = filteredNodes.find(n => n.id === (typeof l.source === 'object' ? (l.source as Node).id : l.source));
      const tgtNode = filteredNodes.find(n => n.id === (typeof l.target === 'object' ? (l.target as Node).id : l.target));
      if (srcNode && tgtNode) {
        csvRows.push([
          wrap(mapType(srcNode.type)),
          wrap(srcNode.label),
          wrap(mapType(tgtNode.type)),
          wrap(tgtNode.label),
          wrap(l.relationship)
        ].join(','));
      }
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maltego_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const availableTypes = useMemo(() => Array.from(new Set(nodes.map(n => n.type))), [nodes]);
  const availableSources = useMemo(() => Array.from(new Set([
    ...nodes.filter(n => n.metadata?.source).map(n => n.metadata.source as string),
    ...links.filter(l => l.dataSource).map(l => l.dataSource as string)
  ])), [nodes, links]);

  const filteredNodes = useMemo(() => {
    return nodes
      .filter(n => !hiddenTypes.has(n.type))
      .filter(n => !n.metadata?.source || !hiddenSources.has(n.metadata.source))
      .filter(n => !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(n => (n.metadata?.confidence !== undefined ? n.metadata.confidence : 1) >= minConfidence);
  }, [nodes, hiddenTypes, hiddenSources, searchQuery, minConfidence]);

  const filteredLinks = useMemo(() => links.filter(l => {
    const srcId = typeof l.source === 'object' ? (l.source as Node).id : l.source;
    const tgtId = typeof l.target === 'object' ? (l.target as Node).id : l.target;
    // Keep link only if both ends are in filteredNodes and link meets confidence
    return filteredNodes.some(n => n.id === srcId) && 
           filteredNodes.some(n => n.id === tgtId) &&
           (!l.dataSource || !hiddenSources.has(l.dataSource)) &&
           (l.confidence !== undefined ? l.confidence : 1) >= minConfidence;
  }), [links, filteredNodes, hiddenSources, minConfidence]);

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll("*").remove();

    const container = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Deep clone nodes and links so D3 force simulation doesn't mutate React state or cause invalid source/target mappings
    const simNodes: Node[] = filteredNodes.map(n => ({ ...n }));
    const simNodeIds = new Set(simNodes.map(n => n.id));
    const simLinks: Link[] = filteredLinks
      .filter(l => {
        const s = typeof l.source === 'object' ? (l.source as Node).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as Node).id : l.target;
        return simNodeIds.has(s) && simNodeIds.has(t);
      })
      .map(l => ({
        ...l,
        source: typeof l.source === 'object' ? (l.source as Node).id : l.source,
        target: typeof l.target === 'object' ? (l.target as Node).id : l.target
      }));

    // Filter simulation
    const simulation = d3.forceSimulation<Node>(simNodes)
      .force("link", d3.forceLink<Node, Link>(simLinks).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = container.append("g")
      .attr("stroke", "#444")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = container.append("g")
      .attr("stroke", "#111")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .on("click", (event, d) => {
        setSelectedNode(d);
      })
      .on("mouseover", (event, d) => {
        // Highlight connected nodes and edges
        node.style("opacity", (n: any) => {
          if (n.id === d.id) return 1;
          const isConnected = filteredLinks.some(l => 
            ((typeof l.source === 'object' ? (l.source as Node).id : l.source) === d.id && (typeof l.target === 'object' ? (l.target as Node).id : l.target) === n.id) ||
            ((typeof l.target === 'object' ? (l.target as Node).id : l.target) === d.id && (typeof l.source === 'object' ? (l.source as Node).id : l.source) === n.id)
          );
          return isConnected ? 1 : 0.15;
        }).style("transition", "opacity 0.2s ease");
        
        link.style("stroke-opacity", (l: any) => {
          return ((typeof l.source === 'object' ? (l.source as Node).id : l.source) === d.id || (typeof l.target === 'object' ? (l.target as Node).id : l.target) === d.id) ? 1 : 0.1;
        }).style("transition", "stroke-opacity 0.2s ease");

        const isKeystone = correlationData?.calculatedCentrality?.some(c => c.nodeId === d.id);
        const cluster = correlationData?.detectedClusters?.find(c => c.nodeIds.includes(d.id));
        const confText = d.metadata?.confidence ? `<div class="text-[9px] text-gray-400">Confidence: <span class="text-white">${Math.round(d.metadata.confidence * 100)}%</span></div>` : '';
        const sourceText = d.metadata?.source ? `<div class="text-[9px] text-gray-400">Source: <span class="text-blue-300">${d.metadata.source}</span></div>` : '';

        tooltip
          .style("opacity", 1)
          .html(`
            <div class="text-[10px] font-bold text-white uppercase tracking-tighter">${d.label}</div>
            <div class="text-[9px] text-gray-500 uppercase tracking-widest mb-1">${d.type}</div>
            ${confText}
            ${sourceText}
            ${isKeystone ? '<div class="text-[9px] text-[#00ffcc] font-bold mt-1">KEYSTONE NODE</div>' : ''}
            ${cluster ? '<div class="text-[9px] text-[#ff00ff] italic mt-1">' + cluster.theme + '</div>' : ''}
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
        node.style("opacity", 1);
        link.style("stroke-opacity", 0.6);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", d => {
        const isKeystone = correlationData?.calculatedCentrality?.some(c => c.nodeId === d.id);
        return isKeystone ? 12 : 8;
      })
      .attr("fill", d => {
        switch (d.type) {
          case 'persona': return '#00ff00';
          case 'email': return '#00ffaa';
          case 'domain': return '#0088ff';
          case 'ip': return '#ff8800';
          case 'certificate': return '#ffff00';
          case 'wallet': return '#ff00ff';
          case 'transaction': return '#aa00ff';
          case 'code_artifact': return '#ff0000';
          case 'metadata_artifact': return '#888888';
          default: return '#555';
        }
      })
      .attr("stroke", d => {
        const isKeystone = correlationData?.calculatedCentrality?.some(c => c.nodeId === d.id);
        return isKeystone ? '#00ffcc' : '#111';
      })
      .attr("stroke-dasharray", d => {
        const cluster = correlationData?.detectedClusters?.find(c => c.nodeIds.includes(d.id));
        return cluster ? "2,2" : "none";
      });

    node.append("text")
      .attr("x", 14)
      .attr("y", 4)
      .text(d => d.label)
      .attr("fill", "#888")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => { simulation.stop(); };
  }, [filteredNodes, filteredLinks, correlationData]);

  return (
    <div className="w-full h-full bg-harvest-bg relative overflow-hidden font-mono">
      <svg ref={svgRef} className="w-full h-full" />
      <div 
        ref={tooltipRef}
        className="fixed pointer-events-none hardware-surface p-2 z-50 backdrop-blur-xl transition-opacity opacity-0"
      />
      
      {/* Node Filters Overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="flex bg-black/80 backdrop-blur-md border border-white/10 rounded overflow-hidden">
          <div className="flex items-center px-2 text-gray-500">
            <Search size={14} />
          </div>
          <input 
            type="text" 
            placeholder="Search entities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[10px] uppercase font-bold text-white placeholder-gray-600 outline-none py-2 px-1 w-48"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="hardware-button px-4 py-2 flex items-center gap-2 !bg-black/80 backdrop-blur-md w-full"
        >
          <Filter size={14} className={hiddenTypes.size > 0 ? "text-harvest-warning" : "text-gray-400"} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Filter Layer</span>
        </button>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="hardware-surface !bg-black/90 p-4 w-64 space-y-2"
            >
              <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Entity Types</h4>
              {availableTypes.map(t => (
                <div key={t} className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id={`filter-${t}`}
                    checked={!hiddenTypes.has(t)}
                    onChange={(e) => {
                      const updated = new Set(hiddenTypes);
                      if (e.target.checked) updated.delete(t);
                      else updated.add(t);
                      setHiddenTypes(updated);
                    }}
                    className="accent-harvest-accent cursor-pointer"
                  />
                  <label htmlFor={`filter-${t}`} className="text-[10px] text-gray-300 font-mono uppercase cursor-pointer">
                    {t.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
              {availableTypes.length === 0 && <p className="text-[9px] text-gray-600 italic">No entities present.</p>}
              
              {availableSources.length > 0 && (
                <div className="pt-2 mt-2 border-t border-white/5">
                  <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Data Sources</h4>
                  {availableSources.map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id={`filter-src-${s}`}
                        checked={!hiddenSources.has(s)}
                        onChange={(e) => {
                          const updated = new Set(hiddenSources);
                          if (e.target.checked) updated.delete(s);
                          else updated.add(s);
                          setHiddenSources(updated);
                        }}
                        className="accent-harvest-accent cursor-pointer"
                      />
                      <label htmlFor={`filter-src-${s}`} className="text-[10px] text-gray-300 font-mono uppercase cursor-pointer truncate">
                        {s}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 mt-2 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Min Confidence</h4>
                  <span className="text-[9px] text-white font-mono">{Math.round(minConfidence * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-harvest-accent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Node Details Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-24 right-4 w-72 hardware-surface !bg-black/90 p-4 z-40"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-harvest-accent uppercase tracking-widest">Entity Inspector</h4>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white">x</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">ID</div>
                <div className="text-[10px] text-white font-mono break-all">{selectedNode.id}</div>
              </div>
              <div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Label</div>
                <div className="text-[11px] font-bold text-gray-300 uppercase">{selectedNode.label}</div>
              </div>
              <div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Type</div>
                <span className="px-2 py-0.5 rounded border border-white/20 bg-white/10 text-[9px] uppercase font-mono">{selectedNode.type}</span>
              </div>
              
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="text-[9px] text-gray-400 font-mono mb-2">Connected Edges ({links.filter(l => 
                  (typeof l.source === 'object' ? l.source.id : l.source) === selectedNode.id || 
                  (typeof l.target === 'object' ? l.target.id : l.target) === selectedNode.id
                ).length}):</div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {links.filter(l => 
                    (typeof l.source === 'object' ? l.source.id : l.source) === selectedNode.id || 
                    (typeof l.target === 'object' ? l.target.id : l.target) === selectedNode.id
                  ).map((l, i) => {
                    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                    const isSource = srcId === selectedNode.id;
                    const otherNodeId = isSource ? tgtId : srcId;
                    const otherNode = nodes.find(n => n.id === otherNodeId);
                    
                    return (
                      <div key={i} className="text-[8px] font-mono text-gray-400 p-1 bg-black/50 border border-white/5 rounded">
                        <span className="text-gray-600">{isSource ? 'OUT:' : 'IN:'}</span> <span className="text-harvest-info uppercase">{l.relationship}</span> {isSource ? '→' : '←'} <span className="text-gray-300 truncate inline-block w-full" title={otherNodeId}>{otherNode?.label || otherNodeId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 hardware-surface p-3 !bg-black/80 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00ff00]" /> Persona</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00ffaa]" /> Email</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0088ff]" /> Domain</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff8800]" /> IP</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ffff00]" /> Cert</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff00ff]" /> Wallet</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#aa00ff]" /> Tx</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff0000]" /> Code</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#888888]" /> Meta</div>
        </div>
      </div>

      {/* Correlation Graph overlay */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsNeo4jModalOpen(true)}
            className="hardware-button px-3.5 py-2 flex items-center gap-2 !bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 backdrop-blur-md transition-all shadow-lg"
          >
            <Database size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Neo4j & Maltego Sync</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="hardware-button px-3 py-2 flex items-center gap-1.5 !bg-black/80 backdrop-blur-md"
          >
            <Download size={13} className="text-gray-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">CSV</span>
          </button>
          <button 
            onClick={handleExportNeo4j}
            className="hardware-button px-3 py-2 flex items-center gap-1.5 !bg-black/80 backdrop-blur-md"
          >
            <Database size={13} className="text-[#0088ff]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0088ff] font-mono">Cypher</span>
          </button>
          <button 
            onClick={handleExportMaltego}
            className="hardware-button px-3 py-2 flex items-center gap-1.5 !bg-black/80 backdrop-blur-md"
          >
            <Share2 size={13} className="text-[#ff00ff]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff00ff] font-mono">Maltego</span>
          </button>
          <HelpTooltip content="The Correlation Engine uses analytical models to find hidden paths, clusters, and keystone hubs within the entity graph." />
          <button 
            onClick={() => setShowPanel(!showPanel)}
            className="hardware-button px-4 py-2 flex items-center gap-2 !bg-black/80 backdrop-blur-md"
          >
            <Network size={14} className="text-harvest-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Correlation Engine</span>
          </button>
        </div>

        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 hardware-surface !bg-black/90 p-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="mono-label !text-harvest-accent flex items-center gap-2"><GitMerge size={12}/> Entity Resolution</h3>
                   {onRunCorrelation && (
                     <button 
                       onClick={onRunCorrelation}
                       disabled={isAnalyzing}
                       className="text-[10px] font-bold text-white bg-harvest-accent/20 hover:bg-harvest-accent/40 border border-harvest-accent/30 rounded px-2 py-1 transition-colors flex items-center gap-1"
                     >
                       {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                       {isAnalyzing ? "Processing..." : "Run ML"}
                     </button>
                   )}
                </div>
                
                {!correlationData && !isAnalyzing && (
                  <p className="text-[10px] text-gray-500 italic">Run correlation engine to detect keystone hubs and evaluate centrality.</p>
                )}

                {correlationData && (
                  <div className="space-y-6">
                    {/* Centrality */}
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-harvest-border pb-1">Keystone Infrastructure</h4>
                      <div className="space-y-2">
                        {correlationData.calculatedCentrality?.map((c, i) => (
                           <div key={i} className="bg-harvest-bg/50 p-2 rounded border border-harvest-border">
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] text-white font-bold">{nodes.find(n => n.id === c.nodeId)?.label || c.nodeId}</span>
                               <span className="text-[9px] text-[#00ffcc] font-bold border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-1 rounded">{c.centralityScore.toFixed(2)}</span>
                             </div>
                             <p className="text-[9px] text-gray-500 leading-tight">{c.explanation}</p>
                           </div>
                        ))}
                      </div>
                    </div>

                    {/* Clusters */}
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-harvest-border pb-1 flex items-center gap-1"><Layers size={10}/> Communities</h4>
                      <div className="space-y-2">
                        {correlationData.detectedClusters?.map((c, i) => (
                           <div key={i} className="bg-harvest-bg/50 p-2 rounded border border-harvest-border">
                             <div className="text-[10px] text-[#ff00ff] font-bold italic mb-1">{c.theme}</div>
                             <div className="text-[9px] text-gray-400">
                               {c.nodeIds.map(nid => nodes.find(n => n.id === nid)?.label || nid).join(", ")}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>

                    {/* Paths */}
                    <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-harvest-border pb-1">Hidden Paths</h4>
                        <div className="space-y-2">
                            {correlationData.hiddenPaths?.map((p, i) => (
                                <div key={i} className="bg-harvest-bg/50 p-2 rounded border border-harvest-border">
                                    <p className="text-[9px] text-gray-500 mb-1">{p.significance}</p>
                                    <div className="text-[9px] text-harvest-warning font-mono break-all">
                                        {p.path.map((pid, idx) => {
                                            const lbl = nodes.find(n => n.id === pid)?.label || pid;
                                            return idx === 0 ? lbl : ` → ${lbl}`;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Neo4j & Maltego Integration Modal */}
      <Neo4jIntegrationModal
        isOpen={isNeo4jModalOpen}
        onClose={() => setIsNeo4jModalOpen(false)}
        nodes={nodes as any}
        edges={links as any}
      />
    </div>
  );
};
