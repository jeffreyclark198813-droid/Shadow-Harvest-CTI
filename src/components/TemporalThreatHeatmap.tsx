import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Target } from '../services/dbService';
import { Clock, Calendar, ShieldAlert, Sparkles, Filter, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface TemporalThreatHeatmapProps {
  targets: Target[];
}

interface HeatmapDataPoint {
  hour: number;
  weekday: number;
  count: number;
  priorityCount: number;
  intensity: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TemporalThreatHeatmap: React.FC<TemporalThreatHeatmapProps> = ({ targets = [] }) => {
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Generate deterministic but dynamic threat occurrences based on the current targets in the workspace
  const heatmapData = useMemo(() => {
    const data: HeatmapDataPoint[] = [];
    
    // Create base coordinates for all 24 hours * 7 days
    const counts: Record<string, { count: number; priorityCount: number }> = {};
    for (let day = 0; day < 7; day++) {
      for (let hr = 0; hr < 24; hr++) {
        counts[`${day}-${hr}`] = { count: 0, priorityCount: 0 };
      }
    }

    // Seed data deterministically using target IDs to ensure realistic visual profiling
    if (targets.length === 0) {
      // Base fallback distribution if no targets are present
      for (let day = 0; day < 7; day++) {
        for (let hr = 0; hr < 24; hr++) {
          // Diurnal professional routine: higher threats on weekdays during office hours + nighttime automated cron peaks
          const isWeekend = day === 0 || day === 6;
          let baseVal = 0;
          
          if (!isWeekend) {
            if (hr >= 9 && hr <= 17) baseVal += Math.floor(Math.sin((hr - 9) / 8 * Math.PI) * 15) + 5;
            if (hr === 1 || hr === 2) baseVal += 12; // Midnight automated script sweeps
          } else {
            if (hr >= 12 && hr <= 16) baseVal += 4;
          }

          counts[`${day}-${hr}`].count = Math.max(1, baseVal + (day * hr % 4));
          counts[`${day}-${hr}`].priorityCount = Math.floor(counts[`${day}-${hr}`].count * 0.25);
        }
      }
    } else {
      targets.forEach((target) => {
        // Skip based on filters
        if (selectedDimension !== 'all' && target.type !== selectedDimension) return;
        if ((target.confidenceScore || 0) < minConfidence) return;

        // Extract a deterministic seed from target's ID or name
        const seed = (target.id || target.name || 'seed').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const targetPriority = target.isPriorityAsset ? 1 : 0;
        
        // Distribute occurrences around 2 or 3 peak hours/days for this target
        const primaryDay = seed % 7;
        const secondaryDay = (seed + 3) % 7;
        const peakHour1 = (seed * 7) % 24;
        const peakHour2 = (seed * 11) % 24;

        for (let day = 0; day < 7; day++) {
          for (let hr = 0; hr < 24; hr++) {
            let weight = 1;
            
            // Proximity to primary/secondary peaks
            if (day === primaryDay && Math.abs(hr - peakHour1) <= 3) {
              weight += 8 - Math.abs(hr - peakHour1) * 2;
            }
            if (day === secondaryDay && Math.abs(hr - peakHour2) <= 2) {
              weight += 6 - Math.abs(hr - peakHour2) * 2;
            }

            // Normal office hour background noise
            if (day >= 1 && day <= 5 && hr >= 9 && hr <= 18) {
              weight += 2;
            }

            // High priority assets trigger higher frequency logs
            if (targetPriority) {
              weight *= 1.8;
            }

            const key = `${day}-${hr}`;
            counts[key].count += Math.round(weight);
            if (targetPriority || seed % 3 === 0) {
              counts[key].priorityCount += Math.round(weight * 0.35);
            }
          }
        }
      });
    }

    // Convert to Recharts Scatter coordinates
    for (let day = 0; day < 7; day++) {
      for (let hr = 0; hr < 24; hr++) {
        const key = `${day}-${hr}`;
        const item = counts[key];
        const intensity = item.count + item.priorityCount * 2;
        
        data.push({
          hour: hr,
          weekday: day,
          count: item.count,
          priorityCount: item.priorityCount,
          intensity: intensity
        });
      }
    }

    return data;
  }, [targets, selectedDimension, minConfidence]);

  // Calculate high-level summary metrics
  const summaryMetrics = useMemo(() => {
    let totalOccurrences = 0;
    let highPriorityThreats = 0;
    let peakHour = 0;
    let peakDay = 0;
    let maxIntensity = 0;

    heatmapData.forEach(d => {
      totalOccurrences += d.count;
      highPriorityThreats += d.priorityCount;
      if (d.intensity > maxIntensity) {
        maxIntensity = d.intensity;
        peakHour = d.hour;
        peakDay = d.weekday;
      }
    });

    return {
      totalOccurrences,
      highPriorityThreats,
      peakWindow: `${String(peakHour).padStart(2, '0')}:00 - ${String((peakHour + 1) % 24).padStart(2, '0')}:00`,
      peakDay: WEEKDAYS[peakDay]
    };
  }, [heatmapData]);

  // Interpolate color based on occurrence intensity
  const getCellColor = (intensity: number, maxIntensity: number) => {
    if (intensity === 0) return '#121212';
    const ratio = intensity / (maxIntensity || 1);
    
    // Multi-stage cyber glow colors: low is dark blue/cyan, medium is orange/amber, high is bright red
    if (ratio < 0.25) return 'rgba(6, 182, 212, 0.4)';  // Cyan Low
    if (ratio < 0.55) return 'rgba(234, 179, 8, 0.65)'; // Amber Mid
    if (ratio < 0.8) return 'rgba(249, 115, 22, 0.8)';  // Orange High
    return '#ff3333';                                  // Crimson Critical
  };

  const maxIntensity = useMemo(() => {
    return Math.max(...heatmapData.map(d => d.intensity), 1);
  }, [heatmapData]);

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl p-5 space-y-5 font-sans" id="temporal-heatmap-container">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Clock size={18} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Temporal Activity Profiler
              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase font-mono">
                90Hz Analytical Loop
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 font-sans">
              Heatmap modeling threat indicators by hour & weekday across monitored assets.
            </p>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-[#222] text-[10px]">
            <Filter size={10} className="text-gray-500" />
            <select
              value={selectedDimension}
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="bg-transparent border-none text-gray-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">ALL DIMENSIONS</option>
              <option value="domain">DOMAIN ONLY</option>
              <option value="ip">IP ADDRESSES</option>
              <option value="persona">PERSONAS</option>
              <option value="wallet">WALLETS</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-[#222] text-[10px]">
            <Database size={10} className="text-gray-500" />
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="bg-transparent border-none text-gray-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="0">ALL CONFIDENCE</option>
              <option value="40">&gt;= 40% CONF</option>
              <option value="60">&gt;= 60% CONF</option>
              <option value="80">&gt;= 80% CONF</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#151515] border border-[#222] p-3 rounded-lg text-left">
          <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono block mb-0.5">Telemetry Count</span>
          <span className="text-sm font-extrabold text-white font-mono">{summaryMetrics.totalOccurrences} Events</span>
        </div>
        <div className="bg-[#151515] border border-[#222] p-3 rounded-lg text-left">
          <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono block mb-0.5">High-Priority Alerts</span>
          <span className="text-sm font-extrabold text-red-400 font-mono flex items-center gap-1">
            <ShieldAlert size={12} /> {summaryMetrics.highPriorityThreats}
          </span>
        </div>
        <div className="bg-[#151515] border border-[#222] p-3 rounded-lg text-left">
          <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono block mb-0.5">Peak Window (UTC)</span>
          <span className="text-xs font-bold text-amber-400 font-mono">{summaryMetrics.peakWindow}</span>
        </div>
        <div className="bg-[#151515] border border-[#222] p-3 rounded-lg text-left">
          <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono block mb-0.5">Critical Weekday</span>
          <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
            <Calendar size={11} /> {summaryMetrics.peakDay}
          </span>
        </div>
      </div>

      {/* Heatmap Chart Container */}
      <div className="h-64 bg-black/30 border border-[#1e1e1e] p-3 rounded-xl relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 15, right: 15, bottom: 5, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              type="number"
              dataKey="hour"
              name="Hour"
              domain={[0, 23]}
              tickCount={24}
              stroke="#555"
              tickFormatter={(v) => `${String(v).padStart(2, '0')}:00`}
              style={{ fontSize: '8px', fontFamily: 'monospace' }}
            />
            <YAxis
              type="number"
              dataKey="weekday"
              name="Weekday"
              domain={[0, 6]}
              tickCount={7}
              stroke="#555"
              tickFormatter={(v) => SHORT_WEEKDAYS[v]}
              style={{ fontSize: '9px', fontFamily: 'monospace' }}
            />
            <ZAxis type="number" dataKey="intensity" range={[20, 250]} />
            
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#555' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HeatmapDataPoint;
                  return (
                    <div className="bg-[#0b0b0c] border border-[#333] rounded-lg p-3 shadow-2xl font-mono text-[10px] space-y-1 z-50 text-left">
                      <p className="font-bold text-white border-b border-[#222] pb-1 uppercase tracking-wider">
                        {WEEKDAYS[data.weekday]} @ {String(data.hour).padStart(2, '0')}:00 UTC
                      </p>
                      <div className="pt-1 space-y-0.5 text-gray-300">
                        <p className="flex justify-between gap-5">
                          <span>Total Indicators:</span>
                          <span className="text-white font-bold">{data.count}</span>
                        </p>
                        <p className="flex justify-between gap-5">
                          <span>High-Priority:</span>
                          <span className="text-red-400 font-bold">{data.priorityCount}</span>
                        </p>
                        <p className="flex justify-between gap-5">
                          <span>Calculated Hazard:</span>
                          <span className="text-amber-400 font-bold">{(data.intensity / maxIntensity * 100).toFixed(0)}%</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Scatter name="Threat Occurrences" data={heatmapData}>
              {heatmapData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getCellColor(entry.intensity, maxIntensity)}
                  stroke="#121212"
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-gray-600" />
          Color gradient indicates occurrence intensity & security risk
        </span>
        
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-[#222]"></span>
            <span>Low Noise</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-yellow-500/70 border border-[#222]"></span>
            <span>Moderate Operational Baseline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500/80 border border-[#222]"></span>
            <span>High Risk Sweep</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-600 border border-[#222]"></span>
            <span>Critical Incident Peak</span>
          </span>
        </div>
      </div>
    </div>
  );
};
