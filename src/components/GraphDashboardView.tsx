import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, collectionGroup, onSnapshot, OperationType, handleFirestoreError } from '../firebase';
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
      if (!user) {
        setLoading(false);
        return;
      }

      try {
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
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'nodes/edges');
      } finally {
        setLoading(false);
      }
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
