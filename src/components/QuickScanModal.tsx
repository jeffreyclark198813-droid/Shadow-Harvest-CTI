import React, { useState, useEffect } from 'react';
import { Target } from '../services/dbService';
import { X, Search, Activity, Globe, Shield, Code } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickScanModalProps {
  target: Target;
  onClose: () => void;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({ target, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    // Simulate a scan that captures current page content and metadata using browser APIs
    const performScan = async () => {
      setScanning(true);
      
      // Artificial delay for effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const metaTags = Array.from(document.getElementsByTagName('meta')).map(meta => ({
        name: meta.getAttribute('name') || meta.getAttribute('property') || 'unknown',
        content: meta.getAttribute('content') || ''
      })).filter(m => m.name !== 'unknown' && m.content);

      const links = Array.from(document.getElementsByTagName('a')).map(a => a.href).slice(0, 10);
      const scripts = Array.from(document.getElementsByTagName('script')).map(s => s.src).filter(Boolean);

      setMetadata({
        title: document.title,
        url: window.location.href,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        metaTags,
        linksCount: document.getElementsByTagName('a').length,
        scriptsCount: document.getElementsByTagName('script').length,
        sampleLinks: links,
        sampleScripts: scripts,
        timestamp: new Date().toISOString()
      });
      
      setScanning(false);
    };

    performScan();
  }, [target]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-harvest-border rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-harvest-border bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-harvest-accent/10 flex items-center justify-center text-harvest-accent">
              <Search size={16} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase">Quick Scan: {target.name}</h2>
              <p className="text-[10px] text-gray-500 font-mono">Browser Environment Metadata Capture</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {scanning ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-harvest-accent/20 border-t-harvest-accent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={20} className="text-harvest-accent animate-pulse" />
                </div>
              </div>
              <p className="mt-6 font-mono text-[11px] text-harvest-accent animate-pulse tracking-widest">CAPTURING LOCAL ENVIRONMENT DATA...</p>
              <div className="w-48 h-1 bg-gray-900 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-harvest-accent animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          ) : metadata ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-harvest-border rounded p-4">
                  <div className="flex items-center gap-2 mb-3 text-gray-400">
                    <Globe size={14} />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider">Page Context</h3>
                  </div>
                  <div className="space-y-2 font-mono text-[10px]">
                    <div>
                      <span className="text-gray-600 block">Document Title</span>
                      <span className="text-white break-words">{metadata.title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Location</span>
                      <span className="text-white break-all">{metadata.url}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Resolution</span>
                      <span className="text-white">{metadata.screenResolution}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] border border-harvest-border rounded p-4">
                  <div className="flex items-center gap-2 mb-3 text-gray-400">
                    <Shield size={14} />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider">Client Fingerprint</h3>
                  </div>
                  <div className="space-y-2 font-mono text-[10px]">
                    <div>
                      <span className="text-gray-600 block">Platform & Lang</span>
                      <span className="text-white">{metadata.platform} | {metadata.language}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Hardware Concurrency</span>
                      <span className="text-white">{metadata.hardwareConcurrency} cores</span>
                    </div>
                    {metadata.deviceMemory && (
                      <div>
                        <span className="text-gray-600 block">Device Memory</span>
                        <span className="text-white">~{metadata.deviceMemory} GB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-harvest-border rounded p-4">
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Code size={14} />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider">User Agent String</h3>
                </div>
                <div className="bg-black/50 border border-gray-800 rounded p-3">
                  <code className="text-[10px] text-harvest-accent break-all font-mono">
                    {metadata.userAgent}
                  </code>
                </div>
              </div>

              <div className="bg-[#111] border border-harvest-border rounded p-4">
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Activity size={14} />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider">DOM Analysis</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <span className="text-[10px] text-gray-500 font-mono">Discovered Links</span>
                    <span className="text-[11px] font-bold text-white">{metadata.linksCount}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <span className="text-[10px] text-gray-500 font-mono">Discovered Scripts</span>
                    <span className="text-[11px] font-bold text-white">{metadata.scriptsCount}</span>
                  </div>
                  
                  {metadata.metaTags.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-gray-500 font-mono block mb-2">Meta Tags ({metadata.metaTags.length})</span>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {metadata.metaTags.map((meta: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-[9px] font-mono bg-black/50 p-1.5 rounded">
                            <span className="text-harvest-accent min-w-16">{meta.name}:</span>
                            <span className="text-gray-300 truncate">{meta.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 font-mono text-sm">
              Failed to capture metadata.
            </div>
          )}
        </div>
        
        {!scanning && (
          <div className="p-4 border-t border-harvest-border bg-black/50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded transition-colors"
            >
              Close Results
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
