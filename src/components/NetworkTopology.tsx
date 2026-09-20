import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, Search, Filter, ZoomIn, ZoomOut, RefreshCw, 
  Download, Activity, Layers, HelpCircle, ChevronRight, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'asn' | 'ip' | 'router' | 'domain' | 'sub_interface';
  asn?: string;
  prefix?: string;
  registry?: string;
  confidence: number;
  flowBytes?: number;
  latencyMs?: number;
  status: 'active' | 'quarantined' | 'routing_shift';
  parentId?: string;
  isExpanded?: boolean;
}

export interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  source: string | TopologyNode;
  target: string | TopologyNode;
  relationship: string;
  bytes: number;
  protocol: string;
  confidence: number;
}

export const NetworkTopology: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Base dataset
  const baseNodes: TopologyNode[] = [
    { id: 'AS-15169', label: 'AS15169 (Google backbone proxy)', type: 'asn', asn: 'AS15169', registry: 'ARIN', confidence: 1.0, status: 'active' },
    { id: 'AS-16509', label: 'AS16509 (Amazon C2 ingress gateway)', type: 'asn', asn: 'AS16509', registry: 'ARIN', confidence: 0.98, status: 'active' },
    { id: 'AS-64496', label: 'AS64496 (High-Entropy GovSec tunnel)', type: 'asn', asn: 'AS64496', registry: 'RIPE', confidence: 0.99, status: 'active' },
    { id: 'AS-41211', label: 'AS41211 (Transit Provider)', type: 'asn', asn: 'AS41211', registry: 'APNIC', confidence: 0.92, status: 'routing_shift' },
    
    { id: 'IP-198-51-100-44', label: '198.51.100.44 (Staging Server)', type: 'ip', prefix: '198.51.100.0/24', confidence: 0.95, flowBytes: 142800, latencyMs: 24, status: 'quarantined' },
    { id: 'IP-203-0-113-15', label: '203.0.113.15 (Primary Ingress Router)', type: 'ip', prefix: '203.0.113.0/24', confidence: 0.99, flowBytes: 890400, latencyMs: 12, status: 'active' },
    { id: 'IP-10-0-4-12', label: '10.0.4.12 (Internal Telemetry Relay)', type: 'ip', prefix: '10.0.0.0/16', confidence: 1.0, flowBytes: 2304000, latencyMs: 3, status: 'active' },
    { id: 'IP-192-0-2-88', label: '192.0.2.88 (Secondary Relocation Node)', type: 'ip', prefix: '192.0.2.0/24', confidence: 0.88, flowBytes: 45200, latencyMs: 68, status: 'active' },

    { id: 'RTR-CORE-01', label: 'Router-Core-Alpha (BGP Edge)', type: 'router', confidence: 1.0, flowBytes: 5210000, latencyMs: 2, status: 'active' },
    { id: 'DOM-SEC-SYNC', label: 'intel-telemetry.secure-gateway.net', type: 'domain', confidence: 0.96, status: 'active' }
  ];

  const baseLinks: TopologyLink[] = [
    { source: 'IP-198-51-100-44', target: 'AS-64496', relationship: 'BGP_ANNOUNCEMENT', bytes: 142800, protocol: 'BGP/TCP', confidence: 0.98 },
    { source: 'AS-64496', target: 'RTR-CORE-01', relationship: 'ROUTING_HOP', bytes: 3410000, protocol: 'BGP/OSPF', confidence: 1.0 },
    { source: 'IP-203-0-113-15', target: 'AS-15169', relationship: 'BGP_ANNOUNCEMENT', bytes: 890400, protocol: 'BGP', confidence: 0.99 },
    { source: 'AS-15169', target: 'RTR-CORE-01', relationship: 'ROUTING_HOP', bytes: 4200000, protocol: 'BGP', confidence: 1.0 },
    { source: 'IP-10-0-4-12', target: 'RTR-CORE-01', relationship: 'NETWORK_FLOW', bytes: 2304000, protocol: 'TLSv1.3', confidence: 1.0 },
    { source: 'IP-192-0-2-88', target: 'AS-16509', relationship: 'BGP_ANNOUNCEMENT', bytes: 45200, protocol: 'BGP', confidence: 0.88 },
    { source: 'AS-16509', target: 'AS-41211', relationship: 'ROUTING_HOP', bytes: 610000, protocol: 'BGP', confidence: 0.92 },
    { source: 'AS-41211', target: 'RTR-CORE-01', relationship: 'ROUTING_HOP', bytes: 610000, protocol: 'BGP', confidence: 0.90 },
    { source: 'DOM-SEC-SYNC', target: 'IP-198-51-100-44', relationship: 'DNS_RESOLUTION', bytes: 1200, protocol: 'HTTPS/DNSSEC', confidence: 0.96 }
  ];

  // Dynamic state for active nodes and links
  const [nodes, setNodes] = useState<TopologyNode[]>(baseNodes);
  const [links, setLinks] = useState<TopologyLink[]>(baseLinks);

  // Expanded nodes generate sub-interfaces for D3 visualization
  const toggleNodeExpansion = (nodeId: string) => {
    const nextExpanded = new Set(expandedNodes);
    if (nextExpanded.has(nodeId)) {
      nextExpanded.delete(nodeId);
      // Remove child nodes
      setNodes(prev => prev.filter(n => n.parentId !== nodeId));
      setLinks(prev => prev.filter(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return !srcId.startsWith(`${nodeId}-child`) && !tgtId.startsWith(`${nodeId}-child`);
      }));
    } else {
      nextExpanded.add(nodeId);
      // Add child nodes dynamically to show "expansion"
      const child1Id = `${nodeId}-child-01`;
      const child2Id = `${nodeId}-child-02`;
      
      const newChildren: TopologyNode[] = [
        {
          id: child1Id,
          label: `Sub-Intf alpha for ${nodeId}`,
          type: 'sub_interface',
          confidence: 0.9,
          parentId: nodeId,
          flowBytes: 152000,
          latencyMs: 5,
          status: 'active'
        },
        {
          id: child2Id,
          label: `Sub-Intf beta for ${nodeId}`,
          type: 'sub_interface',
          confidence: 0.85,
          parentId: nodeId,
          flowBytes: 82000,
          latencyMs: 8,
          status: 'active'
        }
      ];

      const newChildrenLinks: TopologyLink[] = [
        { source: nodeId, target: child1Id, relationship: 'LOGICAL_PORT', bytes: 152000, protocol: 'VLAN/QinQ', confidence: 0.95 },
        { source: nodeId, target: child2Id, relationship: 'LOGICAL_PORT', bytes: 82000, protocol: 'VLAN/QinQ', confidence: 0.90 }
      ];

      setNodes(prev => [...prev, ...newChildren]);
      setLinks(prev => [...prev, ...newChildrenLinks]);
    }
    setExpandedNodes(nextExpanded);
  };

  // Filtering & Search
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [nodes, filterType, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return links.filter(l => {
      const srcId = typeof l.source === 'object' ? (l.source as TopologyNode).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as TopologyNode).id : l.target;
      return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
    });
  }, [links, filteredNodeIds]);

  // Compute highlighting relationships
  const highlightedDetails = useMemo(() => {
    if (!hoveredNode) return { adjacentNodes: new Set<string>(), adjacentLinks: new Set<string>() };
    const adjacentNodes = new Set<string>([hoveredNode.id]);
    const adjacentLinks = new Set<string>();

    filteredLinks.forEach((l, idx) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (srcId === hoveredNode.id || tgtId === hoveredNode.id) {
        adjacentNodes.add(srcId);
        adjacentNodes.add(tgtId);
        adjacentLinks.add(`link-${idx}`);
      }
    });

    return { adjacentNodes, adjacentLinks };
  }, [hoveredNode, filteredLinks]);

  // Handle D3 Simulation Setup
  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create central zoomable layout
    const mainGroup = svg.append('g');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Initial positioning simulation forces
    const simNodes = filteredNodes.map(n => ({ ...n }));
    const simLinks = filteredLinks.map(l => {
      // Find the actual source and target objects in the simulated nodes list
      const sourceNode = simNodes.find(node => node.id === (typeof l.source === 'object' ? l.source.id : l.source));
      const targetNode = simNodes.find(node => node.id === (typeof l.target === 'object' ? l.target.id : l.target));
      return {
        ...l,
        source: sourceNode || (typeof l.source === 'object' ? l.source.id : l.source),
        target: targetNode || (typeof l.target === 'object' ? l.target.id : l.target)
      };
    });

    const forceSim = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    if (!simulationRunning) {
      forceSim.stop();
    }

    // Arrow markers for flow directions
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'flow-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', 'rgba(0, 180, 216, 0.7)')
      .attr('d', 'M0,-5L10,0L0,5');

    // Link Elements
    const linkElements = mainGroup.append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d: any) => {
        if (d.relationship === 'BGP_ANNOUNCEMENT') return '#d946ef';
        if (d.relationship === 'LOGICAL_PORT') return '#f59e0b';
        return '#00b4d8';
      })
      .attr('stroke-opacity', (d: any, idx) => {
        if (!hoveredNode) return 0.5;
        return highlightedDetails.adjacentLinks.has(`link-${idx}`) ? 1.0 : 0.1;
      })
      .attr('stroke-width', (d: any, idx) => {
        const baseWidth = Math.max(1.5, Math.min(6, Math.log10(d.bytes + 1)));
        if (!hoveredNode) return baseWidth;
        return highlightedDetails.adjacentLinks.has(`link-${idx}`) ? baseWidth + 2 : baseWidth;
      })
      .attr('marker-end', 'url(#flow-arrow)');

    // Node Group
    const nodeElements = mainGroup.append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => setHoveredNode(d as TopologyNode))
      .on('mouseout', () => setHoveredNode(null))
      .on('click', (event, d) => setSelectedNode(d as TopologyNode))
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        toggleNodeExpansion((d as TopologyNode).id);
      })
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active && simulationRunning) forceSim.alphaTarget(0.25).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active && simulationRunning) forceSim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Render outer structural rings
    nodeElements.append('circle')
      .attr('r', (d: any) => d.type === 'asn' ? 24 : d.type === 'router' ? 20 : 15)
      .attr('fill', 'rgba(17, 17, 17, 0.95)')
      .attr('stroke', (d: any) => {
        if (d.type === 'asn') return '#d946ef'; // Purple
        if (d.type === 'router') return '#a855f7'; // Violet
        if (d.type === 'sub_interface') return '#f59e0b'; // Amber
        return '#00b4d8'; // Blue
      })
      .attr('stroke-opacity', (d: any) => {
        if (!hoveredNode) return 0.8;
        return highlightedDetails.adjacentNodes.has(d.id) ? 1.0 : 0.15;
      })
      .attr('stroke-width', (d: any) => {
        const isCurrentSelected = selectedNode && selectedNode.id === d.id;
        return isCurrentSelected ? 4 : 2;
      })
      .style('filter', (d: any) => {
        const isCurrentSelected = selectedNode && selectedNode.id === d.id;
        return isCurrentSelected ? 'drop-shadow(0 0 8px rgba(0, 180, 216, 0.5))' : 'none';
      });

    // Outer glow pulse for quarantined nodes
    nodeElements.filter((d: any) => d.status === 'quarantined')
      .append('circle')
      .attr('r', 21)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', (d: any) => {
        if (!hoveredNode) return 0.7;
        return highlightedDetails.adjacentNodes.has(d.id) ? 0.9 : 0.15;
      });

    // Colored inner cores representing taxonomy
    nodeElements.append('circle')
      .attr('r', 6)
      .attr('fill', (d: any) => {
        if (d.type === 'asn') return '#d946ef';
        if (d.type === 'router') return '#a855f7';
        if (d.type === 'sub_interface') return '#f59e0b';
        return '#00b4d8';
      })
      .attr('fill-opacity', (d: any) => {
        if (!hoveredNode) return 1.0;
        return highlightedDetails.adjacentNodes.has(d.id) ? 1.0 : 0.2;
      });

    // Text labels of node IPs & ASNs
    nodeElements.append('text')
      .text((d: any) => d.id)
      .attr('x', 0)
      .attr('y', (d: any) => d.type === 'asn' ? 36 : 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('fill-opacity', (d: any) => {
        if (!hoveredNode) return 0.9;
        return highlightedDetails.adjacentNodes.has(d.id) ? 1.0 : 0.2;
      })
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold');

    // Node status pill dots
    nodeElements.append('circle')
      .attr('cx', 12)
      .attr('cy', -12)
      .attr('r', 3.5)
      .attr('fill', (d: any) => {
        if (d.status === 'quarantined') return '#ef4444';
        if (d.status === 'routing_shift') return '#f59e0b';
        return '#10b981';
      });

    // Update coordinates on tick
    forceSim.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      forceSim.stop();
    };
  }, [filteredNodes, filteredLinks, simulationRunning, hoveredNode, selectedNode, expandedNodes]);

  // Export functions
  const handleExportTopology = () => {
    const csvRows = ['Node_ID,Label,Type,ASN,Prefix,Confidence,Status'].join(',');
    const rows = filteredNodes.map(n => `"${n.id}","${n.label}","${n.type}","${n.asn || ''}","${n.prefix || ''}","${n.confidence}","${n.status}"`).join('\n');
    const blob = new Blob([csvRows + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadow_harvest_network_topology.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-5 space-y-5 font-sans" id="network-topology-container">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Network size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Forensic Network Topology Map
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase font-mono">
                D3 Real-Time Force Graph
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Interactive structural routing model depicting autonomous systems, routing hops, and packet flow paths.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSimulationRunning(!simulationRunning)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors flex items-center gap-1.5 ${
              simulationRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Activity size={12} className={simulationRunning ? 'animate-pulse' : ''} />
            <span>{simulationRunning ? 'SIM RUNNING' : 'SIM PAUSED'}</span>
          </button>

          <button
            onClick={handleExportTopology}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono bg-black/40 border border-[#222] text-gray-300 hover:text-white flex items-center gap-1.5"
          >
            <Download size={12} />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 border border-[#222] p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Filter IP, ASN, or Domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151515] border border-[#222] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#151515] px-2 py-1 border border-[#222] rounded-lg">
            <Filter size={12} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs text-gray-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">ALL NODES</option>
              <option value="asn">ASNs ONLY</option>
              <option value="ip">IP ADDRESSES</option>
              <option value="router">CORE ROUTERS</option>
              <option value="sub_interface">SUB-INTERFACES</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
          <span>Active Nodes: <strong className="text-white">{filteredNodes.length}</strong></span>
          <span>Links: <strong className="text-white">{filteredLinks.length}</strong></span>
          <span>Zoom: <strong className="text-cyan-400">{(zoomLevel * 100).toFixed(0)}%</strong></span>
        </div>
      </div>

      {/* Main Graph Playground and Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" ref={containerRef}>
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-3 h-[420px] bg-black/60 border border-[#1e1e1e] rounded-xl relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full block" />
          
          {/* Quick Interaction Tips Overlay */}
          <div className="absolute bottom-3 left-3 bg-black/90 border border-[#222] px-3 py-2 rounded-lg text-[9px] text-gray-400 font-mono space-y-1">
            <p className="font-bold text-white flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-400" /> GRAPH CONTROLS:
            </p>
            <p>• Drag nodes to pin layout dynamically</p>
            <p>• Hover over nodes to highlight relationships</p>
            <p>• Double-click ASN nodes to expand sub-interfaces</p>
          </div>
        </div>

        {/* Selected Node Sidebar Inspector */}
        <div className="bg-[#151515] border border-[#222] p-4 rounded-xl flex flex-col justify-between h-[420px] overflow-y-auto">
          <div>
            <div className="border-b border-[#222] pb-2.5 mb-3">
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Entity Technical Inspector
              </h4>
              <p className="text-[9px] text-gray-500 font-sans mt-0.5">
                Real-time routing characteristics & bandwidth allocation telemetry.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4 text-left font-mono text-[10px]"
                >
                  <div className="space-y-1.5">
                    <span className="text-[8px] uppercase text-gray-500">Selected Node ID</span>
                    <p className="text-xs font-extrabold text-white truncate bg-black/40 p-2 rounded border border-[#222]">
                      {selectedNode.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 p-2 rounded border border-[#222]">
                      <span className="text-[7px] uppercase text-gray-500 block mb-0.5">Device Type</span>
                      <span className="text-white font-bold uppercase">{selectedNode.type}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded border border-[#222]">
                      <span className="text-[7px] uppercase text-gray-500 block mb-0.5">Status Flag</span>
                      <span className={`font-bold uppercase ${
                        selectedNode.status === 'quarantined' ? 'text-red-400' :
                        selectedNode.status === 'routing_shift' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {selectedNode.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-[#222]">
                    {selectedNode.type === 'asn' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">BGP Prefix count:</span>
                          <span className="text-white">1,428 active</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Registry:</span>
                          <span className="text-purple-300">{selectedNode.registry || 'ARIN'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expansion State:</span>
                          <span className="text-cyan-400">
                            {expandedNodes.has(selectedNode.id) ? 'EXPANDED (DBL_CLK)' : 'COLLAPSED (DBL_CLK)'}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'ip' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subnet Block:</span>
                          <span className="text-white">{selectedNode.prefix || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Inferred Latency:</span>
                          <span className="text-amber-400">{selectedNode.latencyMs ?? 15}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Data Transferred:</span>
                          <span className="text-cyan-400">
                            {selectedNode.flowBytes ? `${(selectedNode.flowBytes / 1000).toFixed(1)} KB` : '1.2 KB'}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'sub_interface' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Logical Parent:</span>
                          <span className="text-purple-400 truncate max-w-[80px]">{selectedNode.parentId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Calculated Jitter:</span>
                          <span className="text-emerald-400">0.4ms</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-500">Confidence Score:</span>
                      <span className="text-emerald-400">{(selectedNode.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {selectedNode.type === 'asn' && (
                    <button
                      onClick={() => toggleNodeExpansion(selectedNode.id)}
                      className="w-full mt-2 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 font-bold transition-all text-[9px] uppercase tracking-wider"
                    >
                      {expandedNodes.has(selectedNode.id) ? 'Collapse logical interfaces' : 'Expand logical interfaces'}
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <HelpCircle size={28} className="text-gray-600 mb-2 animate-bounce" />
                  <p className="text-[10px] font-mono text-gray-500">
                    No active node selected. Click any node in the structural topology model to inspect BGP/flow details.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-[#222] pt-2 mt-2">
            <div className="flex items-center gap-2 justify-between text-[8px] font-mono text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-purple-500"></span> ASN
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-cyan-500"></span> IP
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#a855f7]"></span> Router
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
