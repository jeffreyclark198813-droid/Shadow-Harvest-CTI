import React from 'react';
import { Clock, Globe, Shield, Activity, BarChart2, CheckCircle, AlertTriangle } from 'lucide-react';
import { AdvancedPersonaProfile } from '../services/dbService';

interface BehavioralCadenceViewProps {
  profile: AdvancedPersonaProfile;
  personaLabel: string;
}

export const BehavioralCadenceView: React.FC<BehavioralCadenceViewProps> = ({ profile, personaLabel }) => {
  const behavioral = profile.behavioralSignature;
  const stylometrics = profile.stylometricAnalysis;

  // 24-hour distribution fallback if empty
  const hourly = behavioral.hourlyDistribution && behavioral.hourlyDistribution.length === 24
    ? behavioral.hourlyDistribution
    : [10, 5, 5, 0, 0, 0, 5, 15, 40, 75, 90, 85, 95, 90, 85, 80, 70, 60, 45, 30, 20, 15, 10, 5];

  const weekly = behavioral.weeklyDistribution && behavioral.weeklyDistribution.length > 0
    ? behavioral.weeklyDistribution
    : [
        { day: 'Mon', activity: 85 },
        { day: 'Tue', activity: 92 },
        { day: 'Wed', activity: 88 },
        { day: 'Thu', activity: 90 },
        { day: 'Fri', activity: 75 },
        { day: 'Sat', activity: 40 },
        { day: 'Sun', activity: 25 }
      ];

  // Calculate local time in inferred timezone
  const primaryOffset = typeof behavioral.primaryUtcOffset === 'number' ? behavioral.primaryUtcOffset : 3;
  const nowUtc = new Date();
  const utcHours = nowUtc.getUTCHours();
  const utcMinutes = nowUtc.getUTCMinutes();
  const targetHours = (utcHours + primaryOffset + 24) % 24;
  const targetTimeFormatted = `${String(targetHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;

  const opsecRating = behavioral.opsecHygieneRating ?? 3;
  const lexicalScore = Math.round((stylometrics.lexicalDiversity ?? 0.65) * 100);
  const formalityScore = stylometrics.formalityIndex ?? 58;

  return (
    <div className="space-y-6">
      {/* Top Behavioral Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#262626] p-3.5 rounded-lg">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Cadence Pattern</span>
          <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5 truncate">
            <Activity size={12} className="shrink-0" />
            {behavioral.cadencePattern || 'Diurnal Operations'}
          </span>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-3.5 rounded-lg">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Inferred Timezone</span>
          <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1.5 truncate">
            <Clock size={12} className="shrink-0" />
            UTC{primaryOffset >= 0 ? `+${primaryOffset}` : primaryOffset}:00 ({targetTimeFormatted} Local)
          </span>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-3.5 rounded-lg">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block mb-1">OPSEC Maturity</span>
          <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 truncate">
            <Shield size={12} className="shrink-0" />
            {behavioral.operationalMaturity || 'Disciplined / Intermediate'}
          </span>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-3.5 rounded-lg">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Actor Archetype</span>
          <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5 truncate">
            <BarChart2 size={12} className="shrink-0" />
            {behavioral.behavioralArchetype || 'Initial Access Operator'}
          </span>
        </div>
      </div>

      {/* 24-Hour Diurnal Cadence Heatmap */}
      <div className="bg-[#161616] border border-[#262626] p-4 sm:p-5 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              24-Hour Circadian Activity Cadence (UTC)
            </h5>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Identifies active operational shifts, sleep/dormancy cycles, and scripted cron task schedules.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[9px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Active Peak
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-600"></span> Dormancy
            </span>
          </div>
        </div>

        {/* 24 Bar Visualizer */}
        <div className="pt-2">
          <div className="h-28 flex items-end gap-1 sm:gap-1.5 bg-black/40 p-3 rounded-lg border border-[#222]">
            {hourly.map((val, hour) => {
              const heightPercent = Math.max(8, val);
              const isPeak = val >= 75;
              const isCurrentUtc = hour === utcHours;

              return (
                <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-black/90 border border-cyan-500/40 text-[9px] font-mono p-1 rounded shadow-xl whitespace-nowrap">
                    {String(hour).padStart(2, '0')}:00 UTC - {val}% Activity
                    {isCurrentUtc ? ' (Now)' : ''}
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentUtc
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : isPeak
                        ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                        : val >= 40
                        ? 'bg-cyan-700/80'
                        : 'bg-white/10'
                    }`}
                  />
                  <span className={`text-[8px] font-mono mt-1 ${isCurrentUtc ? 'text-amber-300 font-bold' : 'text-gray-500'}`}>
                    {hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Cadence Insights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[10px] font-mono">
          <div className="bg-black/30 p-2.5 rounded border border-[#222]">
            <span className="text-gray-500 block text-[9px] uppercase">Primary Peak Windows</span>
            <span className="text-cyan-300 font-bold">
              {behavioral.peakWindows && behavioral.peakWindows.length > 0
                ? behavioral.peakWindows.join(' & ')
                : '13:00 - 17:30 UTC & 21:00 - 01:00 UTC'}
            </span>
          </div>

          <div className="bg-black/30 p-2.5 rounded border border-[#222]">
            <span className="text-gray-500 block text-[9px] uppercase">Dormancy Period</span>
            <span className="text-gray-300">
              {behavioral.inactivityDormancy || '02:30 - 08:00 UTC (Estimated Sleep Cycle)'}
            </span>
          </div>

          <div className="bg-black/30 p-2.5 rounded border border-[#222]">
            <span className="text-gray-500 block text-[9px] uppercase">Circadian Rhythm</span>
            <span className="text-purple-300">
              {behavioral.circadianRhythm || 'Diurnal professional routine aligned with UTC+2/UTC+3'}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column: Weekly Cadence & Regional Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Activity Distribution */}
        <div className="bg-[#161616] border border-[#262626] p-4 rounded-lg space-y-3">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={13} className="text-pink-400" />
            Weekly Operational Distribution
          </h5>

          <div className="space-y-2 pt-1">
            {weekly.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-400">{item.day}</span>
                  <span className={item.activity >= 75 ? 'text-pink-400 font-bold' : 'text-gray-400'}>
                    {item.activity}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.activity >= 75 ? 'bg-pink-500' : item.activity >= 40 ? 'bg-pink-800' : 'bg-gray-700'
                    }`}
                    style={{ width: `${item.activity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional & Timezone Inference */}
        <div className="bg-[#161616] border border-[#262626] p-4 rounded-lg space-y-3">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe size={13} className="text-purple-400" />
            Geotemporal & Regional Indicators
          </h5>

          <div className="space-y-2.5 text-[10px] font-mono">
            <div className="bg-black/30 p-2.5 rounded border border-[#222]">
              <span className="text-gray-500 block text-[9px] uppercase">Inferred Timezone Base</span>
              <p className="text-purple-300 font-bold mt-0.5">{behavioral.timezoneInference}</p>
              {behavioral.secondaryCandidateOffsets && behavioral.secondaryCandidateOffsets.length > 0 && (
                <p className="text-[9px] text-gray-500 mt-1">
                  Candidate Variance: {behavioral.secondaryCandidateOffsets.join(', ')}
                </p>
              )}
            </div>

            {behavioral.regionalIndicators && (
              <div className="bg-black/30 p-2.5 rounded border border-[#222]">
                <span className="text-gray-500 block text-[9px] uppercase">Linguistic Regional Markers</span>
                <p className="text-gray-300 mt-0.5">{behavioral.regionalIndicators}</p>
              </div>
            )}

            {behavioral.localeConventions && (
              <div className="bg-black/30 p-2.5 rounded border border-[#222] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase">Date Format</span>
                  <span className="text-cyan-300">{behavioral.localeConventions.dateFormat || 'DD.MM.YYYY'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase">Number Formatting</span>
                  <span className="text-cyan-300">{behavioral.localeConventions.numberFormat || '1.000,00'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stylometric Analysis & Linguistic Signature */}
      <div className="bg-[#161616] border border-[#262626] p-4 sm:p-5 rounded-lg space-y-4">
        <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} className="text-pink-400" />
          Stylometric Linguistic Fingerprint & Language Patterns
        </h5>

        {/* Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-black/40 p-3 rounded-lg border border-[#222]">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-gray-400 uppercase">Lexical Diversity (TTR)</span>
              <span className="text-pink-400 font-bold">{lexicalScore}%</span>
            </div>
            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 rounded-full" style={{ width: `${lexicalScore}%` }} />
            </div>
            <span className="text-[9px] text-gray-500 mt-1 block">
              {lexicalScore >= 70 ? 'Rich vocabulary, low repetitive phrasing' : 'Constrained, specialized vocabulary'}
            </span>
          </div>

          <div className="bg-black/40 p-3 rounded-lg border border-[#222]">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-gray-400 uppercase">Formality Index</span>
              <span className="text-purple-400 font-bold">{formalityScore}/100</span>
            </div>
            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${formalityScore}%` }} />
            </div>
            <span className="text-[9px] text-gray-500 mt-1 block">
              {formalityScore >= 60 ? 'Measured, technical, impersonal tone' : 'Colloquial, conversational tone'}
            </span>
          </div>

          <div className="bg-black/40 p-3 rounded-lg border border-[#222]">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-gray-400 uppercase">Syntactic Complexity</span>
              <span className="text-emerald-400 font-bold uppercase">{stylometrics.syntacticComplexity || 'Moderate'}</span>
            </div>
            <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
            </div>
            <span className="text-[9px] text-gray-500 mt-1 block">
              {stylometrics.sentimentStability || 'Controlled affect, technical register'}
            </span>
          </div>
        </div>

        {/* Dialect Markers, Jargon & Punctuation Quirks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
          {stylometrics.dialectMarkers && stylometrics.dialectMarkers.length > 0 && (
            <div className="bg-black/30 p-3 rounded border border-[#222]">
              <span className="text-[9px] uppercase text-gray-500 block mb-1.5">Identified Dialect Markers</span>
              <div className="flex flex-wrap gap-1">
                {stylometrics.dialectMarkers.map((marker, i) => (
                  <span key={i} className="bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded">
                    {marker}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stylometrics.loanwordsAndJargon && stylometrics.loanwordsAndJargon.length > 0 && (
            <div className="bg-black/30 p-3 rounded border border-[#222]">
              <span className="text-[9px] uppercase text-gray-500 block mb-1.5">Subculture Jargon & Loanwords</span>
              <div className="flex flex-wrap gap-1">
                {stylometrics.loanwordsAndJargon.map((jargon, i) => (
                  <span key={i} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                    {jargon}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Characteristic Writing Style Notes */}
        <div className="bg-black/30 p-3 rounded border border-[#222] text-[10px] space-y-1">
          <p className="text-gray-300">
            <strong className="text-white uppercase font-mono text-[9px] block">Writing Style Profile:</strong>
            {stylometrics.writingStyle}
          </p>
          <p className="text-gray-400 pt-1">
            <strong className="text-white uppercase font-mono text-[9px] block">Vocabulary Assessment:</strong>
            {stylometrics.vocabulary}
          </p>
        </div>
      </div>

      {/* Operational Security & Non-Sensitive Signature Summary */}
      <div className="bg-[#161616] border border-[#262626] p-4 sm:p-5 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            Operational Security (OPSEC) Hygiene & Toolchain
          </h5>

          {/* 5-Shield Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Shield
                key={star}
                size={14}
                className={star <= opsecRating ? 'text-emerald-400 fill-emerald-400/20' : 'text-gray-700'}
              />
            ))}
            <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1.5">
              Level {opsecRating}/5
            </span>
          </div>
        </div>

        <div className="bg-black/40 p-3 rounded border border-[#222] text-[10px] text-gray-300 leading-relaxed font-mono">
          {behavioral.operationalSecurity}
        </div>

        {behavioral.signatureToolchain && behavioral.signatureToolchain.length > 0 && (
          <div>
            <span className="text-[9px] uppercase text-gray-500 font-mono block mb-1.5">Observed Signature Toolchain & Environments</span>
            <div className="flex flex-wrap gap-1.5">
              {behavioral.signatureToolchain.map((tool, idx) => (
                <span key={idx} className="text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
