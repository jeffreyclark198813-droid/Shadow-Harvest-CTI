import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ShieldAlert, 
  Mail, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Lock, 
  Globe, 
  DollarSign, 
  Clock, 
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  category: 'credential_leak' | 'infrastructure_change' | 'financial_pattern' | 'sip_anomaly';
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  notifyEmail: boolean;
  notifyInApp: boolean;
  enabled: boolean;
}

interface NotificationEventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  targetEntity: string;
}

export const AutomatedAlertsCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'rules'>('notifications');
  const [emailNotificationAddress, setEmailNotificationAddress] = useState<string>('analyst.sec@govsec.mil');
  const [isSimulatingAlert, setIsSimulatingAlert] = useState(false);

  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      name: 'Credential Leak Association Watch',
      category: 'credential_leak',
      severityThreshold: 'high',
      notifyEmail: true,
      notifyInApp: true,
      enabled: true
    },
    {
      id: 'rule-2',
      name: 'Digital Infrastructure Topology Drift',
      category: 'infrastructure_change',
      severityThreshold: 'medium',
      notifyEmail: false,
      notifyInApp: true,
      enabled: true
    },
    {
      id: 'rule-3',
      name: 'Anomalous Financial / Crypto Transaction Patterns',
      category: 'financial_pattern',
      severityThreshold: 'critical',
      notifyEmail: true,
      notifyInApp: true,
      enabled: true
    },
    {
      id: 'rule-4',
      name: 'PJSIP Trunk & SIP Gateway Interception',
      category: 'sip_anomaly',
      severityThreshold: 'high',
      notifyEmail: true,
      notifyInApp: true,
      enabled: true
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationEventItem[]>([
    {
      id: 'notif-1',
      title: 'New Credential Leak Detected',
      description: 'Target entity "@shadow_operator" found in fresh PasteBin / Dark Web credential dump with active SSH private key fragment.',
      category: 'credential_leak',
      severity: 'critical',
      timestamp: '3 mins ago',
      read: false,
      targetEntity: '@shadow_operator'
    },
    {
      id: 'notif-2',
      title: 'Infrastructure IP Routing Shift',
      description: 'Monitored autonomous system ASN-44210 altered BGP routing table announcing prefix 198.51.100.0/24.',
      category: 'infrastructure_change',
      severity: 'medium',
      timestamp: '24 mins ago',
      read: false,
      targetEntity: '198.51.100.0/24'
    },
    {
      id: 'notif-3',
      title: 'Unusual Financial Transaction Pattern',
      description: 'Wallet 0x71C...38a executed 14 rapid obfuscated coin-join transfers totaling 45.2 BTC within 120 seconds.',
      category: 'financial_pattern',
      severity: 'high',
      timestamp: '1 hour ago',
      read: true,
      targetEntity: '0x71C...38a'
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleTriggerSimulatedAlert = () => {
    setIsSimulatingAlert(true);
    setTimeout(() => {
      const newNotif: NotificationEventItem = {
        id: `notif-${Date.now()}`,
        title: 'High-Priority OSINT Threat Triggered',
        description: 'Automated telemetry detected zero-day exposure and SIP trunk jitter anomaly on target infrastructure node.',
        category: 'sip_anomaly',
        severity: 'critical',
        timestamp: 'Just now',
        read: false,
        targetEntity: 'Target-Omega-9'
      };
      setNotifications(prev => [newNotif, ...prev]);
      setIsSimulatingAlert(false);
    }, 800);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 bg-harvest-card/40 border border-harvest-border rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-harvest-border">
        <div>
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Bell size={16} className="text-harvest-accent animate-bounce" />
            Automated Alerting & Incident Notification Center
          </h2>
          <p className="text-[11px] font-mono text-gray-400 mt-1">
            Real-time multi-channel alerting for credential leaks, infrastructure shifts, and anomalous financial transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'notifications' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Bell size={13} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'rules' 
                ? 'bg-harvest-accent text-black shadow-[0_0_12px_#00ff00]' 
                : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Sliders size={13} />
            <span>Thresholds & Rules</span>
          </button>

          <button
            onClick={handleTriggerSimulatedAlert}
            disabled={isSimulatingAlert}
            className="px-3 py-1.5 bg-harvest-accent/10 hover:bg-harvest-accent/20 border border-harvest-accent/40 rounded-xl text-xs font-mono font-bold text-harvest-accent flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Simulate Real-Time Threat Event"
          >
            <RefreshCw size={13} className={isSimulatingAlert ? 'animate-spin' : ''} />
            <span>{isSimulatingAlert ? 'Simulating...' : 'Test Alert'}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'notifications' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Showing all event alerts ({notifications.length})</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-harvest-accent hover:underline flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  notif.read 
                    ? 'bg-black/30 border-white/5 opacity-70' 
                    : 'bg-harvest-card/80 border-harvest-accent/40 shadow-[0_0_15px_rgba(0,255,0,0.08)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      notif.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      notif.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-harvest-accent/20 text-harvest-accent border border-harvest-accent/30'
                    }`}>
                      {notif.category === 'credential_leak' ? <Lock size={16} /> :
                       notif.category === 'infrastructure_change' ? <Globe size={16} /> :
                       notif.category === 'financial_pattern' ? <DollarSign size={16} /> :
                       <ShieldAlert size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold font-mono text-white">{notif.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          notif.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          notif.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}>
                          {notif.severity} severity
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                          Entity: {notif.targetEntity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-mono mt-2 leading-relaxed">{notif.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {notif.timestamp}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-harvest-accent animate-ping" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Email Destination Configuration */}
          <div className="bg-black/50 border border-harvest-border rounded-2xl p-4 space-y-3 font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail size={14} className="text-harvest-accent" />
              Email Dispatch Configuration (SMTP / Webhook)
            </h3>
            <p className="text-[11px] text-gray-400">
              High-priority events matching configured thresholds will be instantly dispatched to the designated secure mailbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailNotificationAddress}
                onChange={(e) => setEmailNotificationAddress(e.target.value)}
                className="flex-1 bg-black/80 border border-harvest-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-harvest-accent"
                placeholder="analyst@domain.gov"
              />
              <button
                onClick={() => alert(`Test email dispatch queued for ${emailNotificationAddress}`)}
                className="px-4 py-2 bg-harvest-accent/20 hover:bg-harvest-accent/30 border border-harvest-accent/50 rounded-xl text-xs font-bold text-harvest-accent transition-colors"
              >
                Test Dispatch
              </button>
            </div>
          </div>

          {/* Configurable Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Active Alert Triggers & Severity Thresholds</span>
              <span className="text-harvest-accent font-bold">4 Rules Enforced</span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-mono text-white">{rule.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        rule.severityThreshold === 'critical' ? 'bg-red-500/20 text-red-400' :
                        rule.severityThreshold === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        Threshold: {rule.severityThreshold}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase">
                      Category: {rule.category.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={rule.notifyEmail} readOnly className="accent-harvest-accent" />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={rule.notifyInApp} readOnly className="accent-harvest-accent" />
                        <span>In-App</span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        rule.enabled 
                          ? 'bg-harvest-accent/20 border border-harvest-accent/50 text-harvest-accent' 
                          : 'bg-white/5 border border-white/10 text-gray-500'
                      }`}
                    >
                      {rule.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
