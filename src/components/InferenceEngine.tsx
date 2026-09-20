import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hypothesis } from '../types/intelligence_ops';
import { subscribeToHypotheses } from '../services/dbService';
import { auth } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, TrendingUp, Filter, Target, Zap, AlertCircle, Info, ChevronRight } from 'lucide-react';

export const InferenceEngine: React.FC = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = subscribeToHypotheses(user.uid, (data) => {
      setHypotheses(data);
      if (data.length > 0 && !selectedHypothesis) {
        setSelectedHypothesis(data[0]);
      }
    });
    return () => unsub();
  }, [selectedHypothesis]);

  // Mock hypotheses if empty
  const displayHypotheses = hypotheses.length > 0 ? hypotheses : [
    {
      id: 'hyp-1',
      title: 'APT41 Supply Chain Infiltration',
      description: 'Correlated signatures indicate high probability of lateral movement via compromised update server.',
      currentConfidence: 84,
      trend: [
        { score: 32, timestamp: Date.now() - 86400000 * 4 },
        { score: 45, timestamp: Date.now() - 86400000 * 3 },
        { score: 58, timestamp: Date.now() - 86400000 * 2 },
        { score: 72, timestamp: Date.now() - 86400000 * 1 },
        { score: 84, timestamp: Date.now() },
      ],
      createdBy: 'system'
    },
    {
      id: 'hyp-2',
      title: 'Insider Threat: Node V7-X9',
      description: 'Behavioral drift detected in privileged account access patterns during non-standard operational hours.',
      currentConfidence: 62,
      trend: [
        { score: 12, timestamp: Date.now() - 86400000 * 4 },
        { score: 25, timestamp: Date.now() - 86400000 * 3 },
        { score: 45, timestamp: Date.now() - 86400000 * 2 },
        { score: 55, timestamp: Date.now() - 86400000 * 1 },
        { score: 62, timestamp: Date.now() },
      ],
      createdBy: 'system'
    }
  ];

  const activeHypothesis = selectedHypothesis || displayHypotheses[0];

  const chartData = activeHypothesis.trend.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: p.score,
    fullTime: new Date(p.timestamp).toLocaleString()
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      <div className="lg:col-span-1 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="mono-label text-gray-400 flex items-center gap-2">
            <Filter size={12} className="text-harvest-accent" />
            ACTIVE HYPOTHESES ({displayHypotheses.length})
          </h2>
        </div>

        <div className="space-y-3">
          {displayHypotheses.map((hyp) => (
            <motion.div
              key={hyp.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedHypothesis(hyp)}
              className={`hardware-surface p-4 cursor-pointer transition-all border-l-4 ${
                activeHypothesis.id === hyp.id 
                  ? 'border-harvest-accent bg-harvest-accent/5' 
                  : 'border-transparent hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-tighter max-w-[80%]">{hyp.title}</h3>
                <span className={`text-[10px] font-mono font-bold ${hyp.currentConfidence > 75 ? 'text-red-500' : 'text-harvest-accent'}`}>
                  {hyp.currentConfidence}%
                </span>
              </div>
              <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{hyp.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="mono-label text-gray-400 flex items-center gap-2">
            <TrendingUp size={12} className="text-harvest-accent" />
            CONFIDENCE TREND ANALYSIS
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-harvest-accent shadow-[0_0_5px_#00ff00]" />
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest italic">Probability Evolution Tracked</span>
            </div>
          </div>
        </div>

        <div className="hardware-surface p-6 bg-harvest-card">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tighter flex items-center gap-3">
                {activeHypothesis.title}
                <Target size={16} className="text-harvest-accent" />
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">{activeHypothesis.description}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mb-1">Current Score</p>
              <p className={`text-3xl font-mono font-bold ${activeHypothesis.currentConfidence > 75 ? 'text-red-500' : 'text-harvest-accent'}`}>
                {activeHypothesis.currentConfidence}%
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#00ff00' }}
                  cursor={{ stroke: '#00ff00', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00ff00" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-harvest-border">
             <div className="space-y-2">
                <div className="flex items-center gap-2 text-harvest-accent">
                  <Zap size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">T0 Influx Rate</span>
                </div>
                <p className="text-xl font-mono text-white">4.2 <span className="text-[10px] text-gray-600">art/hr</span></p>
                <p className="text-[8px] text-gray-500">Evidence collection velocity across T0 nodes.</p>
             </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Brain size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Model Convergence</span>
                </div>
                <p className="text-xl font-mono text-white">STABLE</p>
                <p className="text-[8px] text-gray-500">Inference model state following normalization.</p>
             </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Alert Threshold</span>
                </div>
                <p className="text-xl font-mono text-white">85.0%</p>
                <p className="text-[8px] text-gray-500">Automated intercept trigger for high confidence.</p>
             </div>
          </div>
        </div>

        <div className="hardware-surface p-4 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <Info size={16} className="text-gray-600" />
            <p className="text-[10px] text-gray-500 leading-relaxed italic">
              Confidence Trend analysis is calculated by synthesizing multiple T0 evidence artifacts and correlating them against known TTP patterns. 
              The slope represents the rate of analytical probability convergence.
            </p>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-bold text-harvest-accent uppercase tracking-widest hover:underline">
            View Source Trace
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
