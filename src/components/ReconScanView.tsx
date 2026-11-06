import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { AuditService } from '../services/AuditService';

export const ReconScanView: React.FC<{ targetId: string; domain: string }> = ({ targetId, domain }) => {
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if a string looks like a valid domain or IP address
  const looksLikeDomainOrIp = (str: string) => {
    const trimmed = str.trim().toLowerCase();
    if (!trimmed) return false;
    // Allow localhost specifically
    if (trimmed === 'localhost') return true;
    // Standard validation bounds: no spaces, at least one dot or contains colons (IPv6)
    if (trimmed.includes(' ')) return false;
    if (!trimmed.includes('.') && !trimmed.includes(':')) return false;
    return true;
  };

  const initialDomain = looksLikeDomainOrIp(domain) ? domain.trim() : '';
  const [scanDomain, setScanDomain] = useState<string>(initialDomain);

  const runScan = async () => {
    const targetDomain = scanDomain.trim();
    if (!targetDomain) {
      setError('Please enter a target domain or IP address to perform reconnaissance.');
      return;
    }

    if (!looksLikeDomainOrIp(targetDomain)) {
      setError('Invalid format. Please supply a valid domain (e.g., example.com), an IP address, or "localhost".');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, domain: targetDomain })
      });
      const data = await response.json();
      if (!response.ok) {
        const errMsg = typeof data.error === 'object' && data.error 
          ? (data.error.message || JSON.stringify(data.error)) 
          : data.error;
        
        await AuditService.logOperation(
          'RECON_SCAN_FAILURE',
          `Failed recon scan for ${targetDomain}: ${errMsg}`,
          'failure',
          targetId
        );
        
        throw new Error(errMsg || 'Failed to run recon');
      }

      await AuditService.logOperation(
        'RECON_SCAN_SUCCESS',
        `Successfully performed recon scan for ${targetDomain}`,
        'success',
        targetId,
        { recordCount: data.dnsRecords?.length || 0 }
      );

      setResults(data);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 hardware-surface p-6 rounded-2xl border border-harvest-border bg-harvest-card">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1.5 tracking-wider">
            Target Hostname / IP Address
          </label>
          <input
            type="text"
            value={scanDomain}
            onChange={(e) => setScanDomain(e.target.value)}
            placeholder="e.g., malicious-domain.com or 192.168.1.1"
            className="w-full px-3.5 py-2 bg-black/40 border border-harvest-border rounded-xl text-sm text-gray-200 focus:outline-none focus:border-harvest-accent font-mono transition-colors"
          />
        </div>
        <button 
          onClick={runScan}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-harvest-accent text-black rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 w-full sm:w-auto h-[42px] transition-all cursor-pointer font-mono uppercase tracking-wider text-xs"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={14} />}
          Run Recon
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4 mt-6 pt-4 border-t border-harvest-border">
          <h3 className="mono-label text-gray-400 text-xs">DNS Records Resolved</h3>
          <ul className="text-xs text-gray-300 font-mono space-y-1.5 bg-black/30 p-4 rounded-xl border border-harvest-border/55">
            {results.dnsRecords.map((record: any, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-harvest-accent font-bold">›</span>
                <span>{typeof record === 'string' ? record : JSON.stringify(record)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
