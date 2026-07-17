import React, { useState } from 'react';
import { Target } from '../services/dbService';
import { fingerprintInfrastructure } from '../services/geminiService';
import { Network, Server, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { notify } from './Toaster';
import { useEnduringState } from '../hooks/useEnduringState';

interface InfrastructureFingerprintingViewProps {
  target: Target;
  intelligenceContext: string;
}

export const InfrastructureFingerprintingView: React.FC<InfrastructureFingerprintingViewProps> = ({ target, intelligenceContext }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useEnduringState<any | null>(`${target.id}_infra_scan`, null);

  const runFingerprint = async () => {
    setLoading(true);
    try {
      const data = await fingerprintInfrastructure(intelligenceContext, undefined);
      setResults(data);
      notify({ title: 'Fingerprinting Complete', message: 'Infrastructure analysis resolved successfully.', type: 'success' });
    } catch (err: any) {
      notify({ title: 'Scan Failed', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-white uppercase tracking-widest flex items-center gap-2">
          <Network size={14} className="text-[#0088ff]" />
          Advanced Infrastructure Fingerprinting
        </h3>
        <button
          onClick={runFingerprint}
          disabled={loading}
          className="hardware-button-primary px-4 py-2 flex items-center gap-2 text-[10px]"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Server size={14} />}
          {loading ? 'SCANNING...' : 'EXECUTE FINGERPRINT'}
        </button>
      </div>

      {!results && !loading && (
        <div className="hardware-surface p-12 text-center border border-dashed border-white/10">
          <Server size={32} className="mx-auto text-gray-500 mb-4 opacity-50" />
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
            Awaiting infrastructure scan initiation.
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="hardware-surface p-4 border-l-4 border-[#0088ff]">
            <p className="text-[11px] text-gray-300 font-mono leading-relaxed">
              <span className="text-[#0088ff] font-bold">Summary Footprint: </span>
              {results.overallFootprint}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.scans?.map((scan: any, i: number) => (
              <div key={i} className="hardware-surface p-4 space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <h4 className="text-[12px] font-bold text-white font-mono flex items-center gap-2">
                    <Server size={14} className="text-[#0088ff]" /> {scan.asset}
                  </h4>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${scan.riskScore > 75 ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}`}>
                    RISK: {scan.riskScore}/100
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2">
                      <Cpu size={12} /> Service Stack
                    </h5>
                    {scan.services?.map((svc: any, idx: number) => (
                      <div key={idx} className="bg-black/50 p-2 rounded border border-white/5 text-[10px] font-mono">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#00ffcc]">PORT {svc.port}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-white">{svc.service}</span>
                        </div>
                        <div className="text-gray-400">{svc.stack}</div>
                        {svc.vulnerabilities?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {svc.vulnerabilities.map((v: string) => (
                              <div key={v} className="text-red-400 bg-red-400/10 px-1 py-0.5 inline-block rounded mr-1">
                                {v}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h5 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2">
                        <CheckCircle2 size={12} /> TLS Analysis
                      </h5>
                      <div className="bg-black/50 p-2 rounded border border-white/5 text-[10px] font-mono space-y-1 text-gray-400">
                        <p><span className="text-gray-500">Issuer:</span> {scan.tlsAnalysis?.issuer}</p>
                        <p><span className="text-gray-500">SANs:</span> {scan.tlsAnalysis?.subjectAlternativeNames?.join(', ')}</p>
                        {scan.tlsAnalysis?.reusedAcross?.length > 0 && (
                          <p className="text-yellow-500"><span className="text-gray-500">Reused On:</span> {scan.tlsAnalysis?.reusedAcross?.join(', ')}</p>
                        )}
                      </div>
                    </div>

                    {scan.misconfigurations?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2 mb-2">
                          <AlertTriangle size={12} className="text-orange-500" /> Misconfigurations
                        </h5>
                        <ul className="list-disc pl-4 text-[10px] font-mono text-orange-400 space-y-1">
                          {scan.misconfigurations.map((m: string, idx: number) => <li key={idx}>{m}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
