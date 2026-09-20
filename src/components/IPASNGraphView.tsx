import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Globe, 
  Server, 
  Radio, 
  Layers, 
  Activity,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'asn' | 'ip' | 'router' | 'domain';
  asn?: string;
  prefix?: string;
  registry?: string;
  confidence: number;
  uncertainty: number;
  flowBytes?: number;
  latencyMs?: number;
  status: 'active' | 'quarantined' | 'routing_shift';
}

export interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  relationship: 'BGP_ANNOUNCEMENT' | 'NETWORK_FLOW' | 'DNS_RESOLUTION' | 'ROUTING_HOP';
  bytes: number;
  protocol: string;
  confidence: number;
}

export const IPASNGraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const initialNodes: NetworkNode[] = [
    { id: 'AS-15169', label: 'AS15169 (Google Cloud Backbone)', type: 'asn', asn: 'AS15169', registry: 'ARIN', confidence: 1.0, uncertainty: 0.0, status: 'active' },
    { id: 'AS-16509', label: 'AS16509 (Amazon AWS US-East)', type: 'asn', asn: 'AS16509', registry: 'ARIN', confidence: 0.98, uncertainty: 0.02, status: 'active' },
    { id: 'AS-64496', label: 'AS64496 (GovSec Infrastructure Edge)', type: 'asn', asn: 'AS64496', registry: 'RIPE', confidence: 0.99, uncertainty: 0.01, status: 'active' },
    { id: 'AS-41211', label: 'AS41211 (Global Transit Gateway)', type: 'asn', asn: 'AS41211', registry: 'APNIC', confidence: 0.92, uncertainty: 0.08, status: 'routing_shift' },
    
    { id: 'IP-198-51-100-44', label: '198.51.100.44 (Staging C2 Endpoint)', type: 'ip', prefix: '198.51.100.0/24', confidence: 0.95, uncertainty: 0.05, flowBytes: 142800, latencyMs: 24, status: 'quarantined' },
    { id: 'IP-203-0-113-15', label: '203.0.113.15 (Primary Ingress Router)', type: 'ip', prefix: '203.0.113.0/24', confidence: 0.99, uncertainty: 0.01, flowBytes: 890400, latencyMs: 12, status: 'active' },
    { id: 'IP-10-0-4-12', label: '10.0.4.12 (Internal Telemetry Relay)', type: 'ip', prefix: '10.0.0.0/16', confidence: 1.0, uncertainty: 0.0, flowBytes: 2304000, latencyMs: 3, status: 'active' },
    { id: 'IP-192-0-2-88', label: '192.0.2.88 (Secondary Relocation Node)', type: 'ip', prefix: '192.0.2.0/24', confidence: 0.88, uncertainty: 0.12, flowBytes: 45200, latencyMs: 68, status: 'active' },

    { id: 'RTR-CORE-01', label: 'Router-Core-Alpha (BGP Edge)', type: 'router', confidence: 1.0, uncertainty: 0.0, flowBytes: 5210000, latencyMs: 2, status: 'active' },
    { id: 'DOM-SEC-SYNC', label: 'intel-telemetry.secure-gateway.net', type: 'domain', confidence: 0.96, uncertainty: 0.04, status: 'active' }
  ];

  const initialLinks: NetworkLink[] = [
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

  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [links, setLinks] = useState<NetworkLink[]>(initialLinks);

  const filteredNodes = nodes.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || (n.asn && n.asn.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(l => {
    const srcId = typeof l.source === 'object' ? (l.source as NetworkNode).id : l.source;
    const tgtId = typeof l.target === 'object' ? (l.target as NetworkNode).id : l.target;
    return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
  });

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 900;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Simulation
    const simNodes = filteredNodes.map(n => ({ ...n }));
    const simLinks = filteredLinks.map(l => ({ ...l }));

    const simulation = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    if (!simulationRunning) {
      simulation.stop();
    }

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#00ff00')
      .attr('d', 'M0,-5L10,0L0,5');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', '#00ff00')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d: any) => Math.max(1, Math.min(5, Math.log10(d.bytes + 1))))
      .attr('marker-end', 'url(#arrow)');

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        setSelectedNode(d as NetworkNode);
      });

    // Node shapes
    node.append('circle')
      .attr('r', (d: any) => d.type === 'asn' ? 24 : d.type === 'router' ? 20 : 16)
      .attr('fill', (d: any) => {
        if (d.type === 'asn') return '#00ff00';
        if (d.type === 'ip') return d.status === 'quarantined' ? '#ff3333' : '#00bfff';
        if (d.type === 'router') return '#a855f7';
        return '#facc15';
      })
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d: any) => {
        if (d.type === 'asn') return '#00ff00';
        if (d.type === 'ip') return d.status === 'quarantined' ? '#ff3333' : '#00bfff';
        if (d.type === 'router') return '#a855f7';
        return '#facc15';
      })
      .attr('stroke-width', 2);

    // Node icons / inner dots
    node.append('circle')
      .attr('r', 5)
      .attr('fill', (d: any) => {
        if (d.type === 'asn') return '#00ff00';
        if (d.type === 'ip') return d.status === 'quarantined' ? '#ff3333' : '#00bfff';
        if (d.type === 'router') return '#a855f7';
        return '#facc15';
      });

    // Labels
    node.append('text')
      .text((d: any) => d.id)
      .attr('x', 0)
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, simulationRunning]);

  const handleExportCSV = () => {
    const csvRows = ['Node_ID,Label,Type,ASN,Prefix,Confidence,Status'].join(',');
    const rows = filteredNodes.map(n => `"${n.id}","${n.label}","${n.type}","${n.asn || ''}","${n.prefix || ''}","${n.confidence}","${n.status}"`).join('\n');
    const blob = new Blob([csvRows + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ip_asn_network_topology.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 bg-harvest-card/40 border border-harvest-border rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Network size={18} className="text-harvest-accent animate-pulse" />
            IP-to-ASN Mapping & Network Flow Topology Graph
          </h2>
          <p className="text-[11px] font-mono text-gray-400 mt-1">
            Interactive D3 force-directed visualization of autonomous systems, BGP routing announcements, and network flow paths derived from forensic evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSimulationRunning(!simulationRunning)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              simulationRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Activity size={13} />
            <span>{simulationRunning ? 'Simulation Active' : 'Simulation Paused'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-black/50 border border-white/10 text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Download size={13} />
            <span>Export Topology</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/60 border border-harvest-border rounded-2xl p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search IP, ASN or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:border-harvest-accent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-harvest-accent"
            >
              <option value="all">All Types</option>
              <option value="asn">ASNs Only</option>
              <option value="ip">IP Addresses</option>
              <option value="router">Routers</option>
              <option value="domain">Domains</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          <span>Nodes: <strong className="text-white">{filteredNodes.length}</strong></span>
          <span>Links: <strong className="text-white">{filteredLinks.length}</strong></span>
          <span>Zoom: <strong className="text-harvest-accent">{(zoomLevel * 100).toFixed(0)}%</strong></span>
        </div>
      </div>

      {/* Graph & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SVG Canvas Container */}
        <div className="lg:col-span-3 bg-black border border-harvest-border rounded-2xl relative overflow-hidden h-[600px] shadow-inner">
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 text-[11px] font-mono space-y-1.5 pointer-events-none">
            <div className="text-gray-400 uppercase tracking-widest text-[9px] mb-1 font-bold">Node Legend</div>
            <div className="flex items-center gap-2 text-white">
              <span className="w-3 h-3 rounded-full bg-harvest-accent" /> ASN (Autonomous System)
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="w-3 h-3 rounded-full bg-cyan-400" /> IP Endpoint
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="w-3 h-3 rounded-full bg-purple-500" /> Core Router
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="w-3 h-3 rounded-full bg-amber-400" /> Resolved Domain
            </div>
          </div>
        </div>

        {/* Node Inspector Panel */}
        <div className="bg-black/60 border border-harvest-border rounded-2xl p-5 space-y-4 font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-harvest-border">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-harvest-accent" />
                Evidence Inspector
              </h3>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[10px] text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 mt-4 text-xs">
                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Identifier / ID</span>
                  <span className="text-white font-bold">{selectedNode.id}</span>
                </div>

                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Entity Label</span>
                  <span className="text-harvest-accent font-bold">{selectedNode.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Modality Type</span>
                    <span className="text-white uppercase font-bold">{selectedNode.type}</span>
                  </div>
                  <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Status</span>
                    <span className={`font-bold ${selectedNode.status === 'quarantined' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {selectedNode.asn && (
                  <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">BGP ASN & Registry</span>
                    <span className="text-white font-bold">{selectedNode.asn} ({selectedNode.registry || 'IANA'})</span>
                  </div>
                )}

                {selectedNode.prefix && (
                  <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">IP CIDR Prefix</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.prefix}</span>
                  </div>
                )}

                {selectedNode.flowBytes && (
                  <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 text-[10px] block">Aggregated Flow Volume</span>
                    <span className="text-white font-bold">{(selectedNode.flowBytes / 1024).toFixed(1)} KB ({selectedNode.latencyMs}ms latency)</span>
                  </div>
                )}

                <div className="space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 text-[10px] block">Epistemic Confidence & Uncertainty</span>
                  <span className="text-emerald-400 font-bold">Confidence: {selectedNode.confidence} | Uncertainty: {selectedNode.uncertainty}</span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-500 text-xs">
                <Globe size={28} className="mx-auto mb-2 opacity-30" />
                Click any node on the graph to inspect forensic IP-to-ASN attribution metadata.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-harvest-border text-[10px] text-gray-500 text-center">
            DCOIP-X Lossless Provenance & BGP Correlation Engine
          </div>
        </div>
      </div>
    </div>
  );
};
