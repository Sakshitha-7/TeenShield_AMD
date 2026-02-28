import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, User, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dbApi } from '@/lib/db-api';

const Profile = () => {
  const { role, logout } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await dbApi.getMe();
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    }
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center glow-green">
          <User className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground capitalize">{role} Account</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
        {[
          { label: 'Account Settings', icon: User },
          { label: 'Security', icon: Shield },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="w-full glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button onClick={logout} className="w-full glass-card p-4 flex items-center gap-3 text-destructive">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </motion.div>

      <p className="text-center text-[10px] text-muted-foreground pt-4">TeenShield v1.0 • AI Financial Safety</p>
    </div>
  );
};

export default Profile;
