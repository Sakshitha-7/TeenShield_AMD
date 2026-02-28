import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

const Login = () => {
  const { login } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!selected || !email) return;

    setIsLoading(true);
    setError('');

    try {
      await login(email, selected);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-green">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Teen<span className="text-gradient">Shield</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            AI Financial Safety System for Teens
          </p>
        </div>

        {/* Role selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground text-center">Select your role</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelected('teen'); setEmail('Aditya@example.com'); setError(''); }}
              className={`glass-card p-5 flex flex-col items-center gap-3 transition-all duration-200 ${selected === 'teen' && email === 'aarav@example.com' ? 'border-primary glow-green' : 'hover:border-muted-foreground/30'
                }`}
            >
              <User className={`w-7 h-7 ${selected === 'teen' && email === 'aarav@example.com' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-semibold ${selected === 'teen' && email === 'aarav@example.com' ? 'text-primary' : 'text-foreground'}`}>
                Teen
              </span>
            </motion.button>



            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelected('parent'); setEmail('rajesh@example.com'); setError(''); }}
              className={`glass-card p-5 flex flex-col items-center gap-3 transition-all duration-200 ${selected === 'parent' ? 'border-primary glow-green' : 'hover:border-muted-foreground/30'
                }`}
            >
              <Users className={`w-7 h-7 ${selected === 'parent' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-semibold ${selected === 'parent' ? 'text-primary' : 'text-foreground'}`}>
                Parent
              </span>
            </motion.button>
          </div>
        </div>

        {/* Login fields (simulated) */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            defaultValue="••••••••"
          />
        </div>

        {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}

        {/* Login button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={!selected || !email || isLoading}
          className={`w-full py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selected && email && !isLoading
            ? 'gradient-primary text-primary-foreground glow-green'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
        >
          {isLoading ? 'Signing In...' : `Sign In as ${selected === 'teen' ? 'Teen' : selected === 'parent' ? 'Parent' : '...'}`}
        </motion.button>

        <p className="text-xs text-muted-foreground text-center">
          Login runs via the Node MySQL API
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
