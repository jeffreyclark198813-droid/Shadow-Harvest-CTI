import React, { useState } from 'react';
import { Search, Loader2, Globe, Server, Shield } from 'lucide-react';
import { ReconFinding, addReconFinding } from '../services/dbService';
import { auth } from '../firebase';

export const ReconScanView: React.FC<{ targetId: string; domain: string }> = ({ targetId, domain }) => {
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, domain })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run recon');
      }
      setResults(data);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={runScan}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-harvest-accent text-black rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        Run Reconnaissance
      </button>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4 hardware-surface p-4">
          <h3 className="mono-label text-gray-400">DNS Records</h3>
          <ul className="text-xs text-gray-300 font-mono space-y-1">
            {results.dnsRecords.map((record: any, i: number) => (
              <li key={i}>{JSON.stringify(record)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
