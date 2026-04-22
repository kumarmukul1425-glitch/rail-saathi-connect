import { Train, LogIn, LogOut, Menu, X, Bot, Moon, Navigation, Utensils, AlertTriangle, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import AdminNotificationBell from "@/components/AdminNotificationBell";

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Book Tickets", icon: null, auth: false },
    { to: "/live-status", label: "Live Status", icon: Navigation, auth: false },
    { to: "/food", label: "Food Order", icon: Utensils, auth: true },
    { to: "/my-bookings", label: "My Bookings", icon: null, auth: true },
    { to: "/assistant", label: "AI Assistant", icon: Bot, auth: true },
    { to: "/sleep-alert", label: "Sleep Alert", icon: Moon, auth: true },
    { to: "/delay-compensation", label: "Compensation", icon: AlertTriangle, auth: true },
    { to: "/complaints", label: "Complaints", icon: MessageSquare, auth: true },
  ];

  const visibleItems = navItems.filter((n) => !n.auth || user);

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/20">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Train className="w-6 h-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground tracking-tight">RailSaathi</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          {visibleItems.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-1 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              {n.icon && <n.icon className="w-3.5 h-3.5" />}
              {n.label}
            </Link>
          ))}
          <AdminNotificationBell />
          {user ? (
            <button onClick={signOut} className="flex items-center gap-1 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          ) : (
            <Link to="/auth" className="flex items-center gap-1 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Login
            </Link>
          )}
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <AdminNotificationBell />
          <button className="text-primary-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 px-4 pb-4 space-y-2">
          {visibleItems.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">
              {n.icon ? `${n.label}` : n.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { signOut(); setMenuOpen(false); }} className="block text-sm font-medium text-primary-foreground/80 py-2">Logout</button>
          ) : (
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
