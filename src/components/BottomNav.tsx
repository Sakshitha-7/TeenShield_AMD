import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Send, Bell, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const { role } = useAuth();
  const location = useLocation();

  const teenLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/send', icon: Send, label: 'Send' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const parentLinks = [
    { to: '/parent', icon: LayoutDashboard, label: 'Overview' },
    { to: '/parent/approvals', icon: Shield, label: 'Approvals' },
    { to: '/parent/alerts', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const links = role === 'parent' ? parentLinks : teenLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
