import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, collectionGroup, onSnapshot } from '../firebase';
import { Graph, Node, Link } from './Graph';
import { EntityNode, EntityEdge } from '../services/dbService';
import { Network, Loader2 } from 'lucide-react';
import { auth } from '../firebase';

export const GraphDashboardView: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // In a real scenario, we might want to subscribe to changes.
      // For now, let's just fetch all nodes and edges.
      // Using collectionGroup is generally better for querying subcollections across many documents.
      
      const nodesQuery = collectionGroup(db, 'nodes');
      const edgesQuery = collectionGroup(db, 'edges');
      
      const [nodesSnap, edgesSnap] = await Promise.all([
        getDocs(nodesQuery),
        getDocs(edgesQuery)
      ]);

      const fetchedNodes: Node[] = nodesSnap.docs.map(doc => {
        const data = doc.data() as EntityNode;
        return {
          id: doc.id,
          label: data.label,
          type: data.type,
          metadata: data.metadata
        };
      });

      const fetchedLinks: Link[] = edgesSnap.docs.map(doc => {
        const data = doc.data() as EntityEdge;
        return {
          source: data.sourceId,
          target: data.targetId,
          relationship: data.relationship,
          confidence: data.confidence
        };
      });

      setNodes(fetchedNodes);
      setLinks(fetchedLinks);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-black border border-harvest-border rounded-xl p-4">
      <Graph nodes={nodes} links={links} />
    </div>
  );
};
