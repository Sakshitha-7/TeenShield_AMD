import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowRight, AlertTriangle, MapPin, Wifi, WifiOff } from 'lucide-react';
import { detectScamCategory, simulateSenderRisk, calculateRiskScore, calculateFreezeProbability, getRiskLevel } from '@/lib/risk-engine';
import { SCAM_LABELS, type ScamCategory } from '@/lib/types';
import { predictTransaction, buildFeatures } from '@/lib/api';
import { dbApi } from '@/lib/db-api';
import RiskMeter from '@/components/RiskMeter';
import CooldownTimer from '@/components/CooldownTimer';

type Step = 'form' | 'analysis' | 'cooldown' | 'done';

/** Map backend scam_type string to our ScamCategory */
function mapScamType(scamType: string): ScamCategory {
  const map: Record<string, ScamCategory> = {
    crypto_mining: 'crypto_mining',
    forex_trading: 'forex_trading',
    betting_app: 'betting_app',
    ponzi_investment: 'ponzi_investment',
    mule_chain: 'mule_chain',
  };
  return map[scamType?.toLowerCase()] ?? 'none';
}
const US_STATES = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

const SendMoney = () => {
  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [usedApi, setUsedApi] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [recipientState, setRecipientState] = useState('CA');
  const [balance, setBalance] = useState(0);

  // Fetch balance on mount
  useEffect(() => {
    dbApi.getMe().then(data => {
      if (data && data.balance) {
        setBalance(data.balance);
      }
    }).catch(err => console.error("Could not fetch balance for validation"));
  }, []);
  const [analysis, setAnalysis] = useState<{
    riskScore: number;
    freezeProb: number;
    scamCategory: ScamCategory;
    needsParent: boolean;
  } | null>(null);

  const handleAnalyze = async () => {
    const amt = parseFloat(amount);

    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than $0.");
      return;
    }

    if (amt > balance) {
      alert(`Insufficient funds! Your balance is $${balance.toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    const crossState = recipientState !== 'CA';

    try {
      // Try the real FastAPI backend first
      const features = buildFeatures(amt, crossState, false, description);
      const prediction = await predictTransaction(features);
      const riskScore = Math.round(prediction.risk_score);
      const freezeProb = Math.round(prediction.freeze_probability * 100);
      const scamCategory = mapScamType(prediction.scam_type);
      const result = { riskScore, freezeProb, scamCategory, needsParent: riskScore > 70 };
      setAnalysis(result);
      setUsedApi(true);

      if (riskScore > 50) {
        setStep('cooldown');
      } else {
        setStep('analysis');
      }
    } catch {
      // Fallback to local rule-based engine
      const scam = detectScamCategory(amt, description, crossState);
      const sender = simulateSenderRisk();
      const riskScore = calculateRiskScore({
        muleProbability: sender.muleProbability,
        crossStateFlag: crossState,
        highFrequencyFlag: sender.highFrequencyFlag,
        scamCategory: scam,
        amount: amt,
        senderRiskScore: sender.senderRiskScore,
      });
      const freezeProb = calculateFreezeProbability({
        muleProbability: sender.muleProbability,
        crossStateFlag: crossState,
        highFrequencyFlag: sender.highFrequencyFlag,
        scamCategory: scam,
        amount: amt,
        senderRiskScore: sender.senderRiskScore,
      });
      const result = { riskScore, freezeProb, scamCategory: scam, needsParent: riskScore > 70 };
      setAnalysis(result);
      setUsedApi(false);

      if (riskScore > 50) {
        setStep('cooldown');
      } else {
        setStep('analysis');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCooldownComplete = useCallback(() => {
    setStep('analysis');
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const status = analysis?.needsParent ? 'pending_parent' : 'completed';

      await dbApi.createTransaction({
        recipient,
        amount: parseFloat(amount),
        description,
        risk_score: analysis?.riskScore || 0,
        freeze_probability: analysis?.freezeProb || 0,
        scam_category: analysis?.scamCategory || 'none',
        status,
        cross_state_flag: recipientState !== 'CA',
        receiver_state: recipientState
      });

      setStep('done');
    } catch (error) {
      console.error('Failed to submit transaction', error);
      alert('Failed to submit transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center glow-green">
            <Send className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Transaction Submitted</h2>
          <p className="text-sm text-muted-foreground">
            {analysis?.needsParent ? 'Sent for parent approval.' : 'Transaction completed successfully.'}
          </p>
          <button onClick={() => { setStep('form'); setAnalysis(null); setAmount(''); setRecipient(''); setDescription(''); }} className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold">
            New Transfer
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">Send Money</h1>
        <p className="text-sm text-muted-foreground">AI-powered safety analysis before every transfer</p>
      </motion.div>

      {step === 'form' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient</label>
              <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Name or ID" className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex justify-between">
                <span>Amount ($)</span>
                <span className="text-primary font-bold">Avail: ${balance.toLocaleString()}</span>
              </label>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" min="0.01" max={balance} className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this for?" className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient State</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select value={recipientState} onChange={e => setRecipientState(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {recipientState !== 'CA' && (
                <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cross-state transfer detected
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!amount || !recipient || isLoading}
            className={`w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${amount && recipient && !isLoading ? 'gradient-primary text-primary-foreground glow-green' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
          >
            {isLoading ? 'Analyzing…' : 'Analyze & Send'} <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {step === 'cooldown' && analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <CooldownTimer
            seconds={30}
            onComplete={handleCooldownComplete}
            message="High-risk transaction detected. Please read the warning below carefully."
          />
          {analysis.scamCategory !== 'none' && (
            <div className="glass-card p-4 glow-red border-destructive/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-bold text-destructive">Scam Warning</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This transaction matches patterns associated with <strong className="text-foreground">{SCAM_LABELS[analysis.scamCategory]}</strong>.
                Proceeding could increase your account freeze probability and may involve you in a fraud network.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {step === 'analysis' && analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">AI Risk Analysis</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${usedApi ? 'bg-safe/20 text-safe' : 'bg-warning/20 text-warning'}`}>
                {usedApi ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {usedApi ? 'ML API' : 'Local'}
              </span>
            </div>
            <div className="flex justify-around mb-4">
              <RiskMeter score={analysis.riskScore} label="Risk Score" size="sm" />
              <RiskMeter score={analysis.freezeProb} label="Freeze %" size="sm" />
            </div>
            {analysis.scamCategory !== 'none' && (
              <div className="p-3 rounded-lg bg-destructive/10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-semibold text-destructive">{SCAM_LABELS[analysis.scamCategory]}</span>
              </div>
            )}
          </div>

          {analysis.needsParent && (
            <div className="glass-card p-3.5 glow-amber border-warning/30">
              <p className="text-xs text-warning font-medium">⚠ Parent approval required (risk &gt; 70)</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep('form'); setAnalysis(null); }} className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">
              Cancel
            </button>
            <button onClick={handleConfirm} className={`flex-1 py-3 rounded-lg text-sm font-semibold ${getRiskLevel(analysis.riskScore) === 'danger' ? 'gradient-danger text-danger-foreground glow-red' : 'gradient-primary text-primary-foreground glow-green'
              }`}>
              {analysis.needsParent ? 'Request Approval' : 'Confirm Send'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SendMoney;
