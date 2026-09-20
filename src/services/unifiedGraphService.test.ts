import { describe, it, expect } from 'vitest';
import { classifyDimension, calculateGraphStats, mapToMaltegoType } from './unifiedGraphService';
import { UnifiedGraphNode, UnifiedGraphEdge } from '../types/unifiedGraph';

describe('Unified Graph Service Tests', () => {
  describe('classifyDimension', () => {
    it('correctly classifies infrastructure types', () => {
      expect(classifyDimension('ip')).toBe('infrastructure');
      expect(classifyDimension('domain')).toBe('infrastructure');
      expect(classifyDimension('c2_server')).toBe('infrastructure');
    });

    it('correctly classifies identity types', () => {
      expect(classifyDimension('persona')).toBe('identity');
      expect(classifyDimension('email')).toBe('identity');
      expect(classifyDimension('social_handle')).toBe('identity');
    });

    it('correctly classifies financial types', () => {
      expect(classifyDimension('wallet')).toBe('financial');
      expect(classifyDimension('transaction')).toBe('financial');
    });

    it('correctly classifies technical artifact types', () => {
      expect(classifyDimension('malware_hash')).toBe('artifact');
      expect(classifyDimension('ttp')).toBe('artifact');
    });

    it('gracefully handles missing or arbitrary types using fallback heuristics', () => {
      expect(classifyDimension('random-btc-address')).toBe('financial');
      expect(classifyDimension('dns-something')).toBe('infrastructure');
      expect(classifyDimension('any-other-thing')).toBe('artifact');
    });
  });

  describe('mapToMaltegoType', () => {
    it('maps specific nodes to accurate Maltego entities', () => {
      const emailNode: UnifiedGraphNode = { id: '1', label: 'attacker@target.com', type: 'email', dimension: 'identity' };
      expect(mapToMaltegoType(emailNode)).toBe('maltego.EmailAddress');

      const domainNode: UnifiedGraphNode = { id: '2', label: 'malicious.com', type: 'domain', dimension: 'infrastructure' };
      expect(mapToMaltegoType(domainNode)).toBe('maltego.Domain');

      const walletNode: UnifiedGraphNode = { id: '3', label: 'bc1...', type: 'wallet', dimension: 'financial' };
      expect(mapToMaltegoType(walletNode)).toBe('maltego.CryptocurrencyWallet');
    });
  });

  describe('calculateGraphStats', () => {
    it('correctly computes metrics for clean graphs', () => {
      const nodes: UnifiedGraphNode[] = [
        { id: 'n1', label: 'node 1', type: 'ip', dimension: 'infrastructure' },
        { id: 'n2', label: 'node 2', type: 'persona', dimension: 'identity' },
        { id: 'n3', label: 'node 3', type: 'wallet', dimension: 'financial' }
      ];
      const edges: UnifiedGraphEdge[] = [
        { source: 'n1', target: 'n2', relationship: 'CONNECTED_TO' }
      ];

      const stats = calculateGraphStats(nodes, edges);
      expect(stats.totalNodes).toBe(3);
      expect(stats.totalEdges).toBe(1);
      expect(stats.infrastructureCount).toBe(1);
      expect(stats.identityCount).toBe(1);
      expect(stats.financialCount).toBe(1);
      expect(stats.artifactCount).toBe(0);
    });
  });
});
