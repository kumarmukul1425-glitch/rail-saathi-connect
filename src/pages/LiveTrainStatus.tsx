import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Train, MapPin, Clock, Gauge, AlertTriangle, Search, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface StationStatus {
  name: string;
  code: string;
  scheduled: string;
  actual: string;
  status: string;
  distance: number;
  lat: number;
  lng: number;
}

interface TrainStatus {
  source: string;
  train_number: string;
  train_name: string;
  current_station: string;
  next_station: string;
  delay_minutes: number;
  speed_kmph: number;
  last_updated: string;
  current_position: { lat: number; lng: number };
  stations: StationStatus[];
  pnr_status?: {
    pnr: string;
    status: string;
    chart_prepared: boolean;
    passengers: { name: string; booking_status: string; current_status: string; coach: string; berth: string; berth_type: string }[];
  };
}

export default function LiveTrainStatus() {
  const [trainNumber, setTrainNumber] = useState("");
  const [pnr, setPnr] = useState("");
  const [status, setStatus] = useState<TrainStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"train" | "pnr">("train");

  const handleSearch = async () => {
    if (searchType === "train" && !trainNumber) return;
    if (searchType === "pnr" && !pnr) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("train-status", {
        body: { trainNumber: searchType === "train" ? trainNumber : undefined, pnr: searchType === "pnr" ? pnr : undefined },
      });
      if (error) throw error;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (!status) return;
    const { lat, lng } = status.current_position;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const getDelayColor = (mins: number) => {
    if (mins === 0) return "text-success";
    if (mins <= 30) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Train className="w-5 h-5 text-primary" /> Live Train Status
          </h1>

          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            {(["train", "pnr"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${searchType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {t === "train" ? "Train Number" : "PNR Number"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder={searchType === "train" ? "Enter train number e.g. 12951" : "Enter 10-digit PNR"}
              value={searchType === "train" ? trainNumber : pnr}
              onChange={(e) => searchType === "train" ? setTrainNumber(e.target.value) : setPnr(e.target.value)}
              className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none"
            />
            <Button onClick={handleSearch} disabled={loading} className="bg-primary text-primary-foreground px-5">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Fetching status...</p>
              </div>
            )}

            {status && !loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Train Info Card */}
                <div className="bg-primary rounded-xl p-5 text-primary-foreground">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded font-bold">{status.train_number}</span>
                      <h2 className="text-lg font-bold mt-1">{status.train_name}</h2>
                    </div>
                    {status.source === "simulated" && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Simulated</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <Gauge className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <div className="text-lg font-bold">{status.speed_kmph}</div>
                      <div className="text-xs opacity-60">km/h</div>
                    </div>
                    <div>
                      <Clock className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <div className={`text-lg font-bold ${status.delay_minutes > 0 ? "text-destructive" : ""}`}>
                        {status.delay_minutes > 0 ? `+${status.delay_minutes}m` : "On Time"}
                      </div>
                      <div className="text-xs opacity-60">Delay</div>
                    </div>
                    <div>
                      <MapPin className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <div className="text-sm font-bold truncate">{status.current_station}</div>
                      <div className="text-xs opacity-60">Current</div>
                    </div>
                  </div>
                </div>

                {/* Delay Warning */}
                {status.delay_minutes >= 180 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-destructive">Train delayed by {Math.floor(status.delay_minutes / 60)}h {status.delay_minutes % 60}m</p>
                      <p className="text-xs text-muted-foreground mt-1">You may be eligible for delay compensation. Check "My Bookings" for automatic refund or food voucher.</p>
                    </div>
                  </div>
                )}

                {/* Google Maps Button */}
                <Button onClick={openInMaps} variant="outline" className="w-full">
                  <Navigation className="w-4 h-4 mr-2" /> View Live Position on Google Maps
                </Button>

                {/* Station Timeline */}
                <div className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                  <h3 className="text-sm font-bold text-foreground mb-4">Route Timeline</h3>
                  <div className="space-y-0">
                    {status.stations.map((s, i) => (
                      <div key={s.code} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${s.status === "Departed" ? "bg-success" : s.status === "At Station" ? "bg-accent animate-pulse" : "bg-border"}`} />
                          {i < status.stations.length - 1 && <div className={`w-0.5 h-10 ${s.status === "Departed" ? "bg-success/30" : "bg-border"}`} />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-semibold text-foreground">{s.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">({s.code})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Sch: {s.scheduled}</div>
                              {s.actual !== s.scheduled && (
                                <div className="text-xs text-destructive font-semibold">Act: {s.actual}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-medium ${s.status === "Departed" ? "text-success" : s.status === "At Station" ? "text-accent" : "text-muted-foreground"}`}>
                              {s.status}
                            </span>
                            <span className="text-xs text-muted-foreground">• {s.distance} km</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PNR Status */}
                {status.pnr_status && (
                  <div className="bg-card rounded-xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                    <h3 className="text-sm font-bold text-foreground mb-3">PNR Status: {status.pnr_status.pnr}</h3>
                    <div className="flex gap-3 mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${status.pnr_status.status === "Confirmed" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                        {status.pnr_status.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Chart: {status.pnr_status.chart_prepared ? "✅ Prepared" : "⏳ Not yet"}
                      </span>
                    </div>
                    {status.pnr_status.passengers.map((p, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg p-3 text-sm">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Coach {p.coach} • Berth {p.berth} ({p.berth_type}) • Status: <span className="font-bold text-success">{p.current_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
