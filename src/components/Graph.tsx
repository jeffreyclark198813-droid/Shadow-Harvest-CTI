import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Loader2, Zap, Network, Layers, GitMerge, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  relationship: string;
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
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const availableTypes = useMemo(() => Array.from(new Set(nodes.map(n => n.type))), [nodes]);

  const filteredNodes = useMemo(() => nodes.filter(n => !hiddenTypes.has(n.type)), [nodes, hiddenTypes]);
  const filteredLinks = useMemo(() => links.filter(l => 
    !hiddenTypes.has(typeof l.source === 'object' ? (l.source as Node).type : nodes.find(n => n.id === l.source)?.type || '') &&
    !hiddenTypes.has(typeof l.target === 'object' ? (l.target as Node).type : nodes.find(n => n.id === l.target)?.type || '')
  ), [links, hiddenTypes, nodes]);

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

    // Filter simulation
    const simulation = d3.forceSimulation<Node>(filteredNodes)
      .force("link", d3.forceLink<Node, Link>(filteredLinks).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = container.append("g")
      .attr("stroke", "#444")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = container.append("g")
      .attr("stroke", "#111")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .on("click", (event, d) => {
        setSelectedNode(d);
      })
      .on("mouseover", (event, d) => {
        const isKeystone = correlationData?.calculatedCentrality?.some(c => c.nodeId === d.id);
        const cluster = correlationData?.detectedClusters?.find(c => c.nodeIds.includes(d.id));

        tooltip
          .style("opacity", 1)
          .html(`
            <div class="text-[10px] font-bold text-white uppercase tracking-tighter">${d.label}</div>
            <div class="text-[9px] text-gray-500 uppercase tracking-widest mb-1">${d.type}</div>
            ${isKeystone ? '<div class="text-[9px] text-[#00ffcc] font-bold">KEYSTONE NODE</div>' : ''}
            ${cluster ? '<div class="text-[9px] text-[#ff00ff] italic">' + cluster.theme + '</div>' : ''}
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
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
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="hardware-button px-4 py-2 flex items-center gap-2 !bg-black/80 backdrop-blur-md mb-2"
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
        <button 
          onClick={() => setShowPanel(!showPanel)}
          className="hardware-button px-4 py-2 flex items-center gap-2 !bg-black/80 backdrop-blur-md"
        >
          <Network size={14} className="text-harvest-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Correlation Engine</span>
        </button>

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
    </div>
  );
};
