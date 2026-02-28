import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { SCAM_LABELS } from '@/lib/types';
import { getRiskLevel } from '@/lib/risk-engine';

interface TransactionListProps {
  transactions: Transaction[];
  onSelect?: (tx: Transaction) => void;
}

const statusConfig = {
  completed: { icon: CheckCircle2, label: 'Completed', className: 'text-safe' },
  paused: { icon: Clock, label: 'Paused', className: 'text-warning' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'text-destructive' },
  pending_parent: { icon: AlertTriangle, label: 'Awaiting Parent', className: 'text-warning' },
};

const typeIcons = {
  incoming: ArrowDownLeft,
  outgoing: ArrowUpRight,
  investment: TrendingUp,
};

const TransactionList = ({ transactions, onSelect }: TransactionListProps) => {
  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const StatusIcon = statusConfig[tx.status].icon;
        const TypeIcon = typeIcons[tx.type];
        const level = getRiskLevel(tx.riskScore);
        const riskColor = { safe: 'text-safe', warning: 'text-warning', danger: 'text-destructive' }[level];

        return (
          <motion.button
            key={tx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect?.(tx)}
            className="w-full glass-card p-3.5 flex items-center gap-3 text-left hover:border-muted-foreground/30 transition-colors"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              tx.type === 'incoming' ? 'bg-safe/10' : 'bg-destructive/10'
            }`}>
              <TypeIcon className={`w-4 h-4 ${tx.type === 'incoming' ? 'text-safe' : 'text-destructive'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusIcon className={`w-3 h-3 ${statusConfig[tx.status].className}`} />
                <span className="text-[10px] text-muted-foreground">{statusConfig[tx.status].label}</span>
                {tx.scamCategory !== 'none' && (
                  <span className="text-[10px] text-destructive font-medium">
                    • {SCAM_LABELS[tx.scamCategory]}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold font-mono ${tx.type === 'incoming' ? 'text-safe' : 'text-foreground'}`}>
                {tx.type === 'incoming' ? '+' : '-'}${tx.amount.toLocaleString()}
              </p>
              <p className={`text-[10px] font-mono ${riskColor}`}>Risk: {tx.riskScore}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default TransactionList;
