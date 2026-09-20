import { UnifiedGraphNode, UnifiedGraphEdge, GraphDimension, UnifiedGraphStats } from '../types/unifiedGraph';

export const DIMENSION_COLORS: Record<GraphDimension, { border: string; bg: string; text: string; glow: string }> = {
  infrastructure: {
    border: '#00b4d8',
    bg: 'rgba(0, 180, 216, 0.15)',
    text: '#90e0ef',
    glow: 'rgba(0, 180, 216, 0.4)'
  },
  identity: {
    border: '#d946ef',
    bg: 'rgba(217, 70, 239, 0.15)',
    text: '#f0abfc',
    glow: 'rgba(217, 70, 239, 0.4)'
  },
  financial: {
    border: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  artifact: {
    border: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.4)'
  }
};

export const DIMENSION_LABELS: Record<GraphDimension, string> = {
  infrastructure: 'Infrastructure',
  identity: 'Identities & Personas',
  financial: 'Financial Flows',
  artifact: 'Technical Artifacts'
};

/**
 * Maps arbitrary node types into one of the 4 unified graph dimensions
 */
export function classifyDimension(type: string): GraphDimension {
  const t = (type || '').toLowerCase();
  
  if (['ip', 'domain', 'asn', 'c2_server', 'certificate', 'nameserver', 'subnet', 'server', 'url'].includes(t)) {
    return 'infrastructure';
  }
  if (['persona', 'user', 'identity', 'email', 'social_handle', 'actor', 'pgp', 'alias', 'phone'].includes(t)) {
    return 'identity';
  }
  if (['wallet', 'transaction', 'crypto', 'payment', 'mixer', 'exchange', 'account', 'ledger'].includes(t)) {
    return 'financial';
  }
  if (['code_artifact', 'malware_hash', 'hash', 'metadata_artifact', 'ttp', 'technique', 'vulnerability', 'cve', 'tool', 'file'].includes(t)) {
    return 'artifact';
  }

  // Fallback heuristic
  if (t.includes('wallet') || t.includes('btc') || t === 'eth' || t.includes('ethereum') || t.includes('monero') || t === 'tx') return 'financial';
  if (t.includes('ip') || t.includes('domain') || t.includes('host') || t.includes('dns')) return 'infrastructure';
  if (t.includes('person') || t.includes('user') || t.includes('mail') || t.includes('profile')) return 'identity';
  return 'artifact';
}

/**
 * Calculates graph statistics across the unified dimensions
 */
export function calculateGraphStats(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[]): UnifiedGraphStats {
  const counts = {
    infrastructure: 0,
    identity: 0,
    financial: 0,
    artifact: 0
  };

  (nodes || []).forEach(n => {
    const dim = n.dimension || classifyDimension(n.type || '');
    if (counts[dim] !== undefined) {
      counts[dim]++;
    }
  });

  const n = (nodes || []).length;
  const maxEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
  const density = n > 1 ? Number(((edges || []).length / maxEdges).toFixed(4)) : 0;

  return {
    totalNodes: (nodes || []).length,
    totalEdges: (edges || []).length,
    infrastructureCount: counts.infrastructure,
    identityCount: counts.identity,
    financialCount: counts.financial,
    artifactCount: counts.artifact,
    density
  };
}

/**
 * Maps unified graph node types to official Maltego Entity types
 */
export function mapToMaltegoType(node: UnifiedGraphNode): string {
  const t = (node?.type || '').toLowerCase();
  const dim = node?.dimension || classifyDimension(t);
  switch (t) {
    case 'persona':
    case 'user':
    case 'actor':
      return 'maltego.Person';
    case 'alias':
    case 'social_handle':
      return 'maltego.Alias';
    case 'email':
      return 'maltego.EmailAddress';
    case 'domain':
      return 'maltego.Domain';
    case 'ip':
      return 'maltego.IPv4Address';
    case 'asn':
      return 'maltego.AS';
    case 'nameserver':
      return 'maltego.NSRecord';
    case 'wallet':
      return 'maltego.CryptocurrencyWallet';
    case 'transaction':
      return 'maltego.CryptocurrencyTransaction';
    case 'malware_hash':
    case 'hash':
      return 'maltego.Hash';
    case 'url':
      return 'maltego.URL';
    case 'code_artifact':
    case 'file':
      return 'maltego.Document';
    case 'c2_server':
    case 'server':
      return 'maltego.IPv4Address';
    case 'ttp':
    case 'technique':
      return 'maltego.Phrase';
    default:
      if (dim === 'infrastructure') return 'maltego.Unknown';
      if (dim === 'identity') return 'maltego.Person';
      if (dim === 'financial') return 'maltego.CryptocurrencyWallet';
      return 'maltego.Document';
  }
}

/**
 * Generates Maltego-compatible CSV format structured for Maltego's "Import Graph from Table" wizard
 */
export function exportToMaltegoCsv(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[]): string {
  const headers = [
    'Entity.Type1',
    'Entity.Value1',
    'Entity.Weight1',
    'Entity.Type2',
    'Entity.Value2',
    'Entity.Weight2',
    'Link.Label',
    'Link.Style',
    'Link.Color',
    'Link.Thickness',
    'Link.Notes'
  ];

  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const nodeMap = new Map<string, UnifiedGraphNode>(nodes.map(n => [n.id, n]));

  const rows: string[] = [headers.join(',')];

  edges.forEach(edge => {
    const src = nodeMap.get(typeof edge.source === 'object' ? (edge.source as any).id : edge.source);
    const tgt = nodeMap.get(typeof edge.target === 'object' ? (edge.target as any).id : edge.target);

    if (src && tgt) {
      const srcType = mapToMaltegoType(src);
      const tgtType = mapToMaltegoType(tgt);
      const weight1 = Math.round((src.metadata?.confidence ?? 0.85) * 100);
      const weight2 = Math.round((tgt.metadata?.confidence ?? 0.85) * 100);
      const linkConfidence = edge.confidence ?? 1.0;
      
      // Choose color depending on relationship dimension
      const srcDim = src.dimension || classifyDimension(src.type || '');
      const tgtDim = tgt.dimension || classifyDimension(tgt.type || '');
      let linkColor = '#808080';
      if (srcDim === 'financial' || tgtDim === 'financial') linkColor = '#F59E0B';
      else if (srcDim === 'infrastructure' || tgtDim === 'infrastructure') linkColor = '#00B4D8';
      else if (srcDim === 'identity' || tgtDim === 'identity') linkColor = '#D946EF';
      else linkColor = '#10B981';

      rows.push([
        escapeCsv(srcType),
        escapeCsv(src.label || src.id || 'Unknown'),
        weight1,
        escapeCsv(tgtType),
        escapeCsv(tgt.label || tgt.id || 'Unknown'),
        weight2,
        escapeCsv(edge.relationship || 'RELATES_TO'),
        'solid',
        escapeCsv(linkColor),
        linkConfidence >= 0.9 ? 3 : 2,
        escapeCsv(edge.dataSource ? `Source: ${edge.dataSource}` : '')
      ].join(','));
    }
  });

  return rows.join('\n');
}

/**
 * Generates a Maltego-compliant MTZ Table format mapping ALL provenance & metadata fields for precise ingestion
 */
export function exportToMaltegoMtzTable(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[]): string {
  const headers = [
    'Entity.Type1',
    'Entity.Value1',
    'Entity.Confidence1',
    'Entity.Source1',
    'Entity.Country1',
    'Entity.Dimension1',
    'Entity.Type2',
    'Entity.Value2',
    'Entity.Confidence2',
    'Entity.Source2',
    'Entity.Country2',
    'Entity.Dimension2',
    'Link.Label',
    'Link.Style',
    'Link.Color',
    'Link.Thickness',
    'Link.Confidence',
    'Link.Provenance'
  ];

  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const nodeMap = new Map<string, UnifiedGraphNode>((nodes || []).map(n => [n.id, n]));

  const rows: string[] = [headers.join(',')];

  (edges || []).forEach(edge => {
    const src = nodeMap.get(typeof edge.source === 'object' ? (edge.source as any).id : edge.source);
    const tgt = nodeMap.get(typeof edge.target === 'object' ? (edge.target as any).id : edge.target);

    if (src && tgt) {
      const srcType = mapToMaltegoType(src);
      const tgtType = mapToMaltegoType(tgt);
      
      const conf1 = src.metadata?.confidence ?? 0.85;
      const conf2 = tgt.metadata?.confidence ?? 0.85;
      
      const source1 = src.metadata?.source ?? 'Recon Engine';
      const source2 = tgt.metadata?.source ?? 'Recon Engine';
      
      const country1 = src.metadata?.country ?? 'N/A';
      const country2 = tgt.metadata?.country ?? 'N/A';
      
      const dim1 = src.dimension || classifyDimension(src.type || '');
      const dim2 = tgt.dimension || classifyDimension(tgt.type || '');
      
      const linkLabel = edge.relationship || 'RELATES_TO';
      const linkConfidence = edge.confidence ?? 0.9;
      const linkProvenance = edge.dataSource ?? 'Correlation Logic';
      
      let linkColor = '#808080';
      if (dim1 === 'financial' || dim2 === 'financial') linkColor = '#F59E0B';
      else if (dim1 === 'infrastructure' || dim2 === 'infrastructure') linkColor = '#00B4D8';
      else if (dim1 === 'identity' || dim2 === 'identity') linkColor = '#D946EF';
      else linkColor = '#10B981';

      rows.push([
        escapeCsv(srcType),
        escapeCsv(src.label || src.id || 'Unknown'),
        conf1,
        escapeCsv(source1),
        escapeCsv(country1),
        escapeCsv(dim1),
        escapeCsv(tgtType),
        escapeCsv(tgt.label || tgt.id || 'Unknown'),
        conf2,
        escapeCsv(source2),
        escapeCsv(country2),
        escapeCsv(dim2),
        escapeCsv(linkLabel),
        'solid',
        escapeCsv(linkColor),
        linkConfidence >= 0.9 ? 3 : 2,
        linkConfidence,
        escapeCsv(linkProvenance)
      ].join(','));
    }
  });

  return rows.join('\n');
}

/**
 * Generates standard GraphML XML format ingestible by Maltego, Gephi, Cytoscape, and NetworkX
 */
export function exportToMaltegoGraphML(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[]): string {
  const nodeMap = new Map<string, UnifiedGraphNode>((nodes || []).map(n => [n.id, n]));
  const escapeXml = (unsafe: string) => (unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
    http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <!-- Property Keys -->
  <key id="d_label" for="node" attr.name="label" attr.type="string"/>
  <key id="d_dimension" for="node" attr.name="dimension" attr.type="string"/>
  <key id="d_type" for="node" attr.name="type" attr.type="string"/>
  <key id="d_maltego_type" for="node" attr.name="maltego_type" attr.type="string"/>
  <key id="d_confidence" for="node" attr.name="confidence" attr.type="double"/>
  <key id="d_relationship" for="edge" attr.name="relationship" attr.type="string"/>
  <key id="d_edge_confidence" for="edge" attr.name="confidence" attr.type="double"/>
  
  <graph id="UnifiedIntelligenceGraph" edgedefault="directed">
`;

  (nodes || []).forEach(n => {
    const maltegoType = mapToMaltegoType(n);
    const conf = n.metadata?.confidence ?? 0.9;
    const dim = n.dimension || classifyDimension(n.type || '');
    const typeStr = n.type || 'entity';
    xml += `    <node id="${escapeXml(n.id || '')}">
      <data key="d_label">${escapeXml(n.label || n.id || '')}</data>
      <data key="d_dimension">${escapeXml(dim)}</data>
      <data key="d_type">${escapeXml(typeStr)}</data>
      <data key="d_maltego_type">${escapeXml(maltegoType)}</data>
      <data key="d_confidence">${conf}</data>
    </node>\n`;
  });

  (edges || []).forEach((e, idx) => {
    const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
    const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
    if (nodeMap.has(srcId) && nodeMap.has(tgtId)) {
      xml += `    <edge id="e_${idx}" source="${escapeXml(srcId)}" target="${escapeXml(tgtId)}">
      <data key="d_relationship">${escapeXml(e.relationship || 'RELATES_TO')}</data>
      <data key="d_edge_confidence">${e.confidence ?? 1.0}</data>
    </edge>\n`;
    }
  });

  xml += `  </graph>
</graphml>`;

  return xml;
}

/**
 * Generates an idempotent, production-grade Neo4j Cypher script
 */
export function exportToNeo4jCypher(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[], targetName: string = 'Target'): string {
  const sanitize = (val: string) => (val || '').replace(/"/g, '\\"');
  const sanitizeIdentifier = (val: string) => (val || '').replace(/[^a-zA-Z0-9_]/g, '_');
  const sanitizeRel = (rel: string) => (rel || 'RELATES_TO').toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  let cypher = `// ==========================================================\n`;
  cypher += `// Shadow Harvest CTI - Unified Intelligence Graph Export\n`;
  cypher += `// Target: ${sanitize(targetName)}\n`;
  cypher += `// Generated: ${new Date().toISOString()}\n`;
  cypher += `// Nodes: ${(nodes || []).length} | Edges: ${(edges || []).length}\n`;
  cypher += `// Dimensions: Infrastructure, Identities, Financial Flows, Technical Artifacts\n`;
  cypher += `// ==========================================================\n\n`;

  cypher += `// 1. Create Index Constraints for Performant Graph Traversal\n`;
  cypher += `CREATE CONSTRAINT unique_entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;\n\n`;

  cypher += `// 2. Ingest Nodes with Dimension and Sub-Type Labels\n`;
  (nodes || []).forEach(n => {
    const dim = n.dimension || classifyDimension(n.type || '') || 'artifact';
    const dimLabel = dim.charAt(0).toUpperCase() + dim.slice(1);
    const typeStr = n.type || 'entity';
    const subLabel = sanitizeIdentifier(typeStr.charAt(0).toUpperCase() + typeStr.slice(1));
    const safeId = sanitize(n.id || '');
    const safeLabel = sanitize(n.label || n.id || '');
    const confidence = n.metadata?.confidence ?? 0.9;
    const source = sanitize(n.metadata?.source ?? 'OSINT');

    cypher += `MERGE (n:Entity:${dimLabel}:${subLabel} {id: "${safeId}"})\n`;
    cypher += `ON CREATE SET n.label = "${safeLabel}", n.dimension = "${dim}", n.type = "${typeStr}", n.confidence = ${confidence}, n.source = "${source}", n.createdAt = datetime()\n`;
    cypher += `ON MATCH SET n.label = "${safeLabel}", n.lastSeen = datetime();\n`;
  });

  cypher += `\n// 3. Construct Directional Relationships Across Pillars\n`;
  edges.forEach(e => {
    const srcId = sanitize(typeof e.source === 'object' ? (e.source as any).id : e.source);
    const tgtId = sanitize(typeof e.target === 'object' ? (e.target as any).id : e.target);
    const relType = sanitizeRel(e.relationship);
    const conf = e.confidence ?? 1.0;
    const dataSource = sanitize(e.dataSource ?? 'Attribution Engine');

    cypher += `MATCH (src:Entity {id: "${srcId}"}), (tgt:Entity {id: "${tgtId}"})\n`;
    cypher += `MERGE (src)-[r:${relType}]->(tgt)\n`;
    cypher += `ON CREATE SET r.confidence = ${conf}, r.dataSource = "${dataSource}", r.createdAt = datetime();\n`;
  });

  cypher += `\n// 4. Return Graph Summary\n`;
  cypher += `MATCH (n:Entity) RETURN n.dimension AS Dimension, count(n) AS NodeCount;\n`;

  return cypher;
}

/**
 * Synthesizes a unified intelligence graph by harvesting from all target investigation components
 */
export function synthesizeUnifiedGraphFromTelemetry(existingNodes: any[] = [], existingEdges: any[] = [], personaProfiles: any[] = []): { nodes: UnifiedGraphNode[]; edges: UnifiedGraphEdge[] } {
  const nodeMap = new Map<string, UnifiedGraphNode>();
  const edgeList: UnifiedGraphEdge[] = [];

  // 1. Ingest existing graph nodes
  existingNodes.forEach(n => {
    const dim = classifyDimension(n.type);
    nodeMap.set(n.id, {
      id: n.id,
      label: n.label || n.id,
      dimension: dim,
      type: n.type || 'entity',
      metadata: {
        confidence: n.metadata?.confidence ?? 0.85,
        source: n.metadata?.source ?? 'Recon Scan',
        country: n.location?.country,
        lat: n.location?.lat,
        lng: n.location?.lng
      }
    });
  });

  // 2. Ingest existing links
  existingEdges.forEach(e => {
    const srcId = typeof e.source === 'object' ? e.source.id : e.source;
    const tgtId = typeof e.target === 'object' ? e.target.id : e.target;
    edgeList.push({
      source: srcId,
      target: tgtId,
      relationship: e.relationship || 'RELATES_TO',
      confidence: e.confidence ?? 0.9,
      dataSource: e.dataSource || 'Correlation Engine'
    });
  });

  // 3. Ingest rich behavioral persona profiles into the Unified Graph!
  personaProfiles.forEach((profile: any) => {
    const personaNodeId = profile.personaId || `persona_${profile.id || 'target'}`;
    const personaLabel = profile.identifiers?.usernames?.[0] || 'Target Threat Persona';

    // Ensure Persona node exists
    if (!nodeMap.has(personaNodeId)) {
      nodeMap.set(personaNodeId, {
        id: personaNodeId,
        label: personaLabel,
        dimension: 'identity',
        type: 'persona',
        metadata: {
          confidence: 0.95,
          source: 'Persona Profiling',
          archetype: profile.behavioralSignature?.behavioralArchetype
        }
      });
    }

    // Ingest Identifiers
    profile.identifiers?.emails?.forEach((email: string) => {
      const emailId = `email_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!nodeMap.has(emailId)) {
        nodeMap.set(emailId, {
          id: emailId,
          label: email,
          dimension: 'identity',
          type: 'email',
          metadata: { confidence: 0.9, source: 'Identifier Analysis' }
        });
        edgeList.push({
          source: personaNodeId,
          target: emailId,
          relationship: 'USES_EMAIL',
          confidence: 0.95,
          dataSource: 'Persona Profiling'
        });
      }
    });

    profile.identifiers?.wallets?.forEach((wallet: string) => {
      const walletId = `wallet_${wallet.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!nodeMap.has(walletId)) {
        nodeMap.set(walletId, {
          id: walletId,
          label: `${wallet.slice(0, 8)}...${wallet.slice(-6)}`,
          dimension: 'financial',
          type: 'wallet',
          metadata: { confidence: 0.98, source: 'Financial Tracing', fullAddress: wallet }
        });
        edgeList.push({
          source: personaNodeId,
          target: walletId,
          relationship: 'OWNS_WALLET',
          confidence: 0.98,
          dataSource: 'Persona Profiling'
        });
      }
    });

    // Ingest Inferred Timezone / Regional Indicator Node
    if (profile.behavioralSignature?.timezoneInference) {
      const tzId = `tz_${profile.behavioralSignature.primaryUtcOffset ?? 'inferred'}`;
      if (!nodeMap.has(tzId)) {
        nodeMap.set(tzId, {
          id: tzId,
          label: `Zone: ${profile.behavioralSignature.timezoneInference.slice(0, 30)}`,
          dimension: 'infrastructure',
          type: 'timezone_region',
          metadata: {
            confidence: (profile.behavioralSignature.timezoneConfidence ?? 85) / 100,
            source: 'Geotemporal Cadence Inference',
            offset: profile.behavioralSignature.primaryUtcOffset
          }
        });
        edgeList.push({
          source: personaNodeId,
          target: tzId,
          relationship: 'INFERRED_TIMEZONE',
          confidence: (profile.behavioralSignature.timezoneConfidence ?? 85) / 100,
          dataSource: 'Circadian Cadence Analysis'
        });
      }
    }

    // Ingest Toolchain Signatures
    profile.behavioralSignature?.signatureToolchain?.forEach((tool: string) => {
      const toolId = `tool_${tool.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!nodeMap.has(toolId)) {
        nodeMap.set(toolId, {
          id: toolId,
          label: tool,
          dimension: 'artifact',
          type: 'code_artifact',
          metadata: { confidence: 0.88, source: 'Behavioral Profiling' }
        });
        edgeList.push({
          source: personaNodeId,
          target: toolId,
          relationship: 'UTILIZES_TOOL',
          confidence: 0.88,
          dataSource: 'OPSEC Signature Analysis'
        });
      }
    });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges: edgeList
  };
}

/**
 * Executes a test connection or query to the Neo4j API proxy
 */
export async function testNeo4jConnection(config: { uri: string; username: string; password?: string; database?: string }): Promise<{ success: boolean; message: string; serverInfo?: any }> {
  try {
    const res = await fetch('/api/v1/graph/neo4j/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to reach Neo4j API bridge' };
  }
}

/**
 * Direct sync of unified graph nodes and edges to Neo4j instance
 */
export async function syncToNeo4j(
  config: { uri: string; username: string; password?: string; database?: string },
  nodes: UnifiedGraphNode[],
  edges: UnifiedGraphEdge[],
  targetName: string
): Promise<{ success: boolean; message: string; syncedNodes?: number; syncedEdges?: number }> {
  try {
    const res = await fetch('/api/v1/graph/neo4j/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        nodes,
        edges,
        targetName
      })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync failed via backend endpoint' };
  }
}

/**
 * Executes an arbitrary Cypher query on Neo4j
 */
export async function queryNeo4j(
  config: { uri: string; username: string; password?: string; database?: string },
  cypher: string
): Promise<{ success: boolean; records?: any[]; message?: string }> {
  try {
    const res = await fetch('/api/v1/graph/neo4j/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        cypher
      })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Query execution failed' };
  }
}
