import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, Wallet, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_TEEN, MOCK_TRANSACTIONS, MOCK_ALERTS, MOCK_RISK_HISTORY } from '@/lib/mock-data';
import { getRiskLevel } from '@/lib/risk-engine';
import RiskMeter from '@/components/RiskMeter';
import TransactionList from '@/components/TransactionList';
import TransactionDetail from '@/components/TransactionDetail';
import type { Transaction } from '@/lib/types';

const scamDistribution = [
  { name: 'Crypto', value: 30, color: 'hsl(38, 92%, 50%)' },
  { name: 'Forex', value: 25, color: 'hsl(0, 72%, 55%)' },
  { name: 'Betting', value: 15, color: 'hsl(280, 70%, 55%)' },
  { name: 'Ponzi', value: 10, color: 'hsl(200, 80%, 50%)' },
  { name: 'Safe', value: 20, color: 'hsl(160, 84%, 44%)' },
];

const TeenDashboard = () => {
  const teen = MOCK_TEEN;
  const riskLevel = getRiskLevel(teen.riskScore);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning,</p>
          <h1 className="text-xl font-bold">{teen.name}</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 glow-green"
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Available Balance</span>
        </div>
        <p className="text-3xl font-bold font-mono text-gradient">
          ${teen.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              riskLevel === 'safe' ? 'bg-safe' : riskLevel === 'warning' ? 'bg-warning' : 'bg-destructive'
            }`} />
            <span className="text-xs text-muted-foreground">
              {riskLevel === 'safe' ? 'Account Safe' : riskLevel === 'warning' ? 'Moderate Risk' : 'High Risk'}
            </span>
          </div>
          {teen.freezeProbability > 30 && (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-medium">Freeze risk {teen.freezeProbability}%</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Risk Meters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h2 className="text-sm font-semibold mb-4">Risk Overview</h2>
        <div className="flex justify-around">
          <RiskMeter score={teen.riskScore} label="Risk Score" />
          <RiskMeter score={teen.freezeProbability} label="Freeze Prob." />
        </div>
      </motion.div>

      {/* Risk Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Risk Trend</h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={MOCK_RISK_HISTORY}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Line type="monotone" dataKey="riskScore" stroke="hsl(160, 84%, 44%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="freezeProbability" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-safe rounded" />
            <span className="text-[10px] text-muted-foreground">Risk Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-destructive rounded border-dashed" />
            <span className="text-[10px] text-muted-foreground">Freeze Prob.</span>
          </div>
        </div>
      </motion.div>

      {/* Scam Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-5"
      >
        <h2 className="text-sm font-semibold mb-3">Scam Category Distribution</h2>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={scamDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                {scamDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {scamDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fraud Alerts */}
      {MOCK_ALERTS.filter(a => !a.read).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-sm font-semibold">Active Alerts</h2>
          {MOCK_ALERTS.filter(a => !a.read).map((alert) => (
            <div
              key={alert.id}
              className={`glass-card p-3.5 border-l-4 ${
                alert.severity === 'critical' ? 'border-l-destructive glow-red' : 'border-l-warning glow-amber'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  alert.severity === 'critical' ? 'text-destructive' : 'text-warning'
                }`} />
                <div>
                  <p className="text-xs font-medium">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <TransactionList transactions={MOCK_TRANSACTIONS} onSelect={setSelectedTx} />
      </motion.div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeenDashboard;
