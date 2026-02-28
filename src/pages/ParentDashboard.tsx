import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { dbApi } from '@/lib/db-api';
import { getRiskLevel } from '@/lib/risk-engine';
import { SCAM_LABELS } from '@/lib/types';
import RiskMeter from '@/components/RiskMeter';

const ParentDashboard = () => {
  const [teen, setTeen] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [meData, txData, alertsData] = await Promise.all([
          dbApi.getMe(),
          dbApi.getTransactions(),
          dbApi.getAlerts()
        ]);
        setTeen(meData);
        setTransactions(txData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 3000); // 3-second auto-refresh polling
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !teen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Use the API results for pending tx and risk score variables
  const pendingTx = transactions.filter(t => t.status === 'paused' || t.status === 'pending_parent');

  const riskScore = teen.risk_score !== undefined ? teen.risk_score : teen.riskScore;
  const freezeProb = teen.freeze_probability !== undefined ? teen.freeze_probability : teen.freezeProbability;

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    try {
      // Optimistically hide from UI
      setApprovedIds(prev => new Set(prev).add(id));
      await dbApi.updateTransactionStatus(id, status);
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Failed to update transaction status.");
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Parent Dashboard</p>
          <h1 className="text-xl font-bold">Teen Overview</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Teen Risk Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-bold">{teen.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">{teen.name}</p>
            <p className="text-xs text-muted-foreground">Age {teen.age} • ${teen.balance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-around">
          <RiskMeter score={riskScore} label="Risk Score" size="sm" />
          <RiskMeter score={freezeProb} label="Freeze %" size="sm" />
        </div>
      </motion.div>

      {/* Pending Approvals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-warning" />
          Pending Approvals ({pendingTx.filter(t => !approvedIds.has(t.id)).length})
        </h2>
        <div className="space-y-2">
          {pendingTx.map((tx) => {
            const isHandled = approvedIds.has(tx.id);
            const level = getRiskLevel(tx.riskScore);
            return (
              <div key={tx.id} className={`glass-card p-4 space-y-3 ${level === 'danger' ? 'glow-red border-destructive/30' : 'glow-amber border-warning/30'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tx.senderName} • ${tx.amount.toLocaleString()} • {tx.type}
                    </p>
                    {tx.crossStateFlag && (
                      <p className="text-[10px] text-warning mt-1">Cross-state: {tx.senderState} → {tx.receiverState}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold font-mono ${level === 'danger' ? 'text-destructive' : 'text-warning'}`}>{tx.riskScore}</p>
                    <p className="text-[10px] text-muted-foreground">risk</p>
                  </div>
                </div>
                {tx.scam_category !== 'none' && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs text-destructive font-medium">{SCAM_LABELS[tx.scam_category as keyof typeof SCAM_LABELS]}</span>
                  </div>
                )}
                {!isHandled ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(tx.id, 'completed')} className="flex-1 py-2 rounded-lg bg-safe/20 text-safe text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-safe/30 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => handleAction(tx.id, 'rejected')} className="flex-1 py-2 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/30 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Action taken</p>
                )}
              </div>
            );
          })}
          {pendingTx.length === 0 && (
            <div className="glass-card p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-safe mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Risk Trend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Risk Trend</h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={[
            { date: '2023-10-01', riskScore: 20, freezeProbability: 5 },
            { date: '2023-10-05', riskScore: 22, freezeProbability: 6 },
            { date: '2023-10-10', riskScore: 45, freezeProbability: 15 },
            { date: '2023-10-15', riskScore: 30, freezeProbability: 10 },
            { date: '2023-10-20', riskScore: riskScore || 25, freezeProbability: freezeProb || 8 }
          ]}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Line type="monotone" dataKey="riskScore" stroke="hsl(160, 84%, 44%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="freezeProbability" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* High-Risk Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-destructive" /> High-Risk Alerts
        </h2>
        <div className="space-y-2">
          {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').map(alert => (
            <div key={alert.id} className={`glass-card p-3.5 border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive' : 'border-l-warning'}`}>
              <p className="text-xs">{alert.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.timestamp).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ParentDashboard;
