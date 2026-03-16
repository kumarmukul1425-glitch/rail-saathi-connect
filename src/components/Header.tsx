import { Train } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/20">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Train className="w-6 h-6 text-primary-foreground" />
          <span className="text-lg font-bold text-primary-foreground tracking-tight">RailSaathi</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Book Tickets
          </Link>
          <Link to="/pnr" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            PNR Status
          </Link>
          <Link to="/complaints" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Complaints
          </Link>
        </nav>
      </div>
    </header>
  );
}
