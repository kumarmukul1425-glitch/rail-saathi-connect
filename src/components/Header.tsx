import { Train, LogIn, LogOut, User, Menu, X, Bot, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/20">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Train className="w-6 h-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground tracking-tight">RailSaathi</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5">
          <Link to="/" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Book Tickets</Link>
          {user && (
            <>
              <Link to="/my-bookings" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">My Bookings</Link>
              <Link to="/assistant" className="flex items-center gap-1 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"><Bot className="w-3.5 h-3.5" /> AI Assistant</Link>
              <Link to="/sleep-alert" className="flex items-center gap-1 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"><Moon className="w-3.5 h-3.5" /> Sleep Alert</Link>
              <Link to="/complaints" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Complaints</Link>
            </>
          )}
          {user ? (
            <button onClick={signOut} className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 px-4 pb-4 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">Book Tickets</Link>
          {user && (
            <>
              <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">My Bookings</Link>
              <Link to="/assistant" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">🤖 AI Assistant</Link>
              <Link to="/sleep-alert" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">🛏️ Sleep Alert</Link>
              <Link to="/complaints" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-primary-foreground/80 py-2">Complaints</Link>
            </>
          )}
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
