import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { dbApi } from '@/lib/db-api';

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await dbApi.getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

  const severityColors: Record<string, string> = {
    critical: 'border-l-destructive glow-red',
    high: 'border-l-warning glow-amber',
    medium: 'border-l-primary',
    low: 'border-l-muted-foreground',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">Fraud Alerts</h1>
        <p className="text-sm text-muted-foreground">{alerts.filter(a => !a.is_read).length} unread alerts</p>
      </motion.div>

      <div className="space-y-2">
        {sorted.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 border-l-4 ${severityColors[alert.severity] || severityColors.medium}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-warning' : 'text-muted-foreground'
                }`} />
              <div>
                <p className="text-sm">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold uppercase ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-warning' : 'text-muted-foreground'
                    }`}>{alert.severity}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
