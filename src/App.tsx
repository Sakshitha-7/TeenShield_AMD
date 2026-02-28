import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import TeenDashboard from "./pages/TeenDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import SendMoney from "./pages/SendMoney";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Login />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={role === 'parent' ? '/parent' : '/dashboard'} replace />} />
        <Route path="/dashboard" element={<TeenDashboard />} />
        <Route path="/send" element={<SendMoney />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/approvals" element={<ParentDashboard />} />
        <Route path="/parent/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
