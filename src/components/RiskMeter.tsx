import { motion } from 'framer-motion';
import { getRiskLevel } from '@/lib/risk-engine';

interface RiskMeterProps {
  score: number;
  label: string;
  size?: 'sm' | 'lg';
}

const RiskMeter = ({ score, label, size = 'lg' }: RiskMeterProps) => {
  const level = getRiskLevel(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const colorMap = {
    safe: 'text-safe',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  const strokeMap = {
    safe: 'stroke-safe',
    warning: 'stroke-warning',
    danger: 'stroke-destructive',
  };

  const glowMap = {
    safe: 'glow-green',
    warning: 'glow-amber',
    danger: 'glow-red',
  };

  const dim = size === 'lg' ? 'w-32 h-32' : 'w-20 h-20';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-lg';

  return (
    <div className={`flex flex-col items-center gap-2 ${glowMap[level]} rounded-full`}>
      <div className={`relative ${dim}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none"
            className={strokeMap[level]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-bold font-mono ${colorMap[level]}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
};

export default RiskMeter;
