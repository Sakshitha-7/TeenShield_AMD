import { motion } from 'framer-motion';
import { X, AlertTriangle, MapPin, Shield, Clock } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { SCAM_LABELS } from '@/lib/types';
import { getRiskLevel } from '@/lib/risk-engine';
import RiskMeter from './RiskMeter';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetail = ({ transaction: tx, onClose }: Props) => {
  const level = getRiskLevel(tx.riskScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass-card p-5 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Transaction Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="text-center py-2">
          <p className={`text-3xl font-bold font-mono ${tx.type === 'incoming' ? 'text-safe' : 'text-foreground'}`}>
            {tx.type === 'incoming' ? '+' : '-'}${tx.amount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{tx.description}</p>
        </div>

        <div className="flex justify-around">
          <RiskMeter score={tx.riskScore} label="Risk" size="sm" />
          <RiskMeter score={tx.freezeProbability} label="Freeze %" size="sm" />
        </div>

        {tx.scamCategory !== 'none' && (
          <div className={`p-3 rounded-lg ${level === 'danger' ? 'bg-destructive/10 glow-red' : 'bg-warning/10 glow-amber'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${level === 'danger' ? 'text-destructive' : 'text-warning'}`} />
              <span className={`text-sm font-semibold ${level === 'danger' ? 'text-destructive' : 'text-warning'}`}>
                {SCAM_LABELS[tx.scamCategory]}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sender</span>
            <span className="font-medium">{tx.senderName}</span>
          </div>
          {tx.crossStateFlag && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Route</span>
              <div className="flex items-center gap-1.5 text-warning">
                <MapPin className="w-3 h-3" />
                <span className="font-medium">{tx.senderState} → {tx.receiverState}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mule Probability</span>
            <span className="font-mono font-medium">{(tx.muleProbability * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{tx.status.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-mono text-xs">{new Date(tx.timestamp).toLocaleString()}</span>
          </div>
          {tx.parentApprovalRequired && (
            <div className="flex items-center gap-2 text-warning">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Parent approval required</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionDetail;
