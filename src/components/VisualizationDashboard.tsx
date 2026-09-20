import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  IntelligenceReport, MonitoringEvent, NarrativeEvent, Anomaly, EntityNode 
} from '../services/dbService';
import { 
  Calendar, Globe, BarChart3, PieChart as PieChartIcon, 
  Activity, ShieldAlert, Zap, Target 
} from 'lucide-react';
import { motion } from 'motion/react';

interface VisualizationDashboardProps {
  reports: IntelligenceReport[];
  monitoringEvents: MonitoringEvent[];
  narrativeEvents: NarrativeEvent[];
  anomalies: Anomaly[];
  nodes: EntityNode[];
}

export const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  reports,
  monitoringEvents,
  narrativeEvents,
  anomalies,
  nodes
}) => {
  // Timeline Data: Combine all events and sort by timestamp
  const timelineData = useMemo(() => {
    const allEvents = [
      ...reports.map(r => ({ date: r.timestamp?.toDate(), type: 'Report', val: 1 })),
      ...monitoringEvents.map(e => ({ date: e.timestamp?.toDate(), type: 'Monitoring', val: 1 })),
      ...narrativeEvents.map(e => ({ date: e.timestamp?.toDate(), type: 'Narrative', val: 1 })),
      ...anomalies.map(a => ({ date: a.timestamp?.toDate(), type: 'Anomaly', val: 1 }))
    ].filter(e => e.date).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by day
    const grouped: { [key: string]: any } = {};
    allEvents.forEach(e => {
      const day = e.date.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = { day, Report: 0, Monitoring: 0, Narrative: 0, Anomaly: 0, total: 0 };
      grouped[day][e.type]++;
      grouped[day].total++;
    });

    return Object.values(grouped);
  }, [reports, monitoringEvents, narrativeEvents, anomalies]);

  // Severity Distribution
  const severityData = useMemo(() => {
    const counts: { [key: string]: number } = { low: 0, medium: 0, high: 0, critical: 0 };
    [...monitoringEvents, ...anomalies].forEach(e => {
      counts[e.severity]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [monitoringEvents, anomalies]);

  // Entity Type Distribution
  const entityTypeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    nodes.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [nodes]);

  // Anomaly Type Distribution
  const anomalyTypeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    anomalies.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase().replace('_', ' '), value }));
  }, [anomalies]);

  // Geographic Distribution Heatmap Data
  const geoData = useMemo(() => {
    const countries: { [key: string]: number } = {};
    nodes.forEach(n => {
      if (n.location?.country) {
        countries[n.location.country] = (countries[n.location.country] || 0) + 1;
      }
    });
    return Object.entries(countries).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const COLORS = ['#00ff00', '#0088ff', '#ff00ff', '#ff8800', '#ff0000'];

  return (
    <div className="space-y-8 p-6 bg-[#0a0a0a] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] flex items-center gap-3">
          <BarChart3 size={18} className="text-[#00ff00]" />
          Intelligence Visualization Dashboard
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
            <div className="w-2 h-2 rounded-full bg-[#00ff00]" /> Reports
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
            <div className="w-2 h-2 rounded-full bg-[#0088ff]" /> Monitoring
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Anomalies
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] p-6 rounded-lg"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Calendar size={14} className="text-[#00ff00]" />
            Operational Activity Timeline
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="day" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area isAnimationActive={false} type="monotone" dataKey="Report" stroke="#00ff00" fillOpacity={1} fill="url(#colorReport)" />
                <Area isAnimationActive={false} type="monotone" dataKey="Monitoring" stroke="#0088ff" fillOpacity={0} />
                <Area isAnimationActive={false} type="monotone" dataKey="Anomaly" stroke="#ff0000" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Severity Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-[#222] p-6 rounded-lg"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-500" />
            Risk & Severity Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', fontSize: '10px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Entity Type Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-[#222] p-6 rounded-lg"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Target size={14} className="text-[#0088ff]" />
            Infrastructure Composition
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1a1a1a' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', fontSize: '10px' }}
                />
                <Bar isAnimationActive={false} dataKey="value" fill="#0088ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Anomaly Type Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#111] border border-[#222] p-6 rounded-lg"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={14} className="text-[#ff00ff]" />
            Anomaly Classification
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1a1a1a' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', fontSize: '10px' }}
                />
                <Bar isAnimationActive={false} dataKey="value" fill="#ff00ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Geographic Heatmap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111] border border-[#222] p-6 rounded-lg"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Globe size={14} className="text-purple-500" />
            Geographic Infrastructure Heatmap
          </h3>
          <div className="space-y-4">
            {geoData.map(([country, count], i) => (
              <div key={country} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span className="text-white">{country}</span>
                  <span className="text-purple-400">{count} Nodes</span>
                </div>
                <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / nodes.length) * 100}%` }}
                    className="h-full bg-purple-500"
                  />
                </div>
              </div>
            ))}
            {geoData.length === 0 && (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-600 text-[10px] uppercase italic">
                <Globe size={32} className="mb-4 opacity-20" />
                No Geographic Data Resolved
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
