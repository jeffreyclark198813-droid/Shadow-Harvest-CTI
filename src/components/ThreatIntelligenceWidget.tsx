import React, { useState, useEffect } from 'react';
import { Network, Search, Loader2, AlertCircle } from 'lucide-react';

interface ThreatIntel {
  summary: string;
  sources: { title: string; uri: string }[];
}

export const ThreatIntelligenceWidget: React.FC<{ context: string }> = ({ context }) => {
  const [intel, setIntel] = useState<ThreatIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/threat-intel?context=${encodeURIComponent(context)}`)
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch threat intelligence.');
        }
        return res.json();
      })
      .then(data => {
        setIntel(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [context]);

  return (
    <div className="bg-harvest-card border border-harvest-border rounded-xl p-4 space-y-4 h-full overflow-y-auto">
      <h2 className="mono-label text-gray-400 flex items-center gap-2">
        <Network size={12} className="text-harvest-accent" />
        THREAT INTELLIGENCE
      </h2>
      
      {loading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-500 bg-red-500/10 rounded-lg">
          <AlertCircle size={16} />
          <span className="text-xs">{error}</span>
        </div>
      )}
      
      {intel && (
        <div className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">{intel.summary}</p>
          <div className="space-y-2">
            <h3 className="mono-label text-[10px] text-gray-500">Sources</h3>
            {intel?.sources?.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="block text-[10px] text-harvest-accent hover:underline truncate"
              >
                {source.title}
              </a>
            )) || <p className="text-[10px] text-gray-500">No sources found.</p>}
          </div>
        </div>
      )}
    </div>
  );
};
