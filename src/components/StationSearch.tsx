import { useState, useRef, useEffect } from "react";
import { searchStations, Station, getStationDisplay } from "@/data/stations";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";

interface StationSearchProps {
  label: string;
  value: Station | null;
  onChange: (station: Station) => void;
  placeholder?: string;
}

export default function StationSearch({ label, value, onChange, placeholder = "Enter station name or code" }: StationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    const r = searchStations(val);
    setResults(r);
    setOpen(r.length > 0);
  };

  const handleSelect = (station: Station) => {
    onChange(station);
    setQuery(getStationDisplay(station));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5 border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <input
          ref={inputRef}
          className="bg-transparent outline-none w-full text-sm font-medium text-foreground placeholder:text-muted-foreground/60"
          value={query || (value ? getStationDisplay(value) : "")}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query) handleChange(query); }}
          placeholder={placeholder}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {results.map((station) => (
              <button
                key={`${station.code}-${station.name}`}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center justify-between group"
                onClick={() => handleSelect(station)}
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{station.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{station.city}, {station.state}</span>
                </div>
                <span className="station-code text-xs group-hover:text-primary">{station.code}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
