import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { motion } from "framer-motion";
import { AlertTriangle, TrainFront, Bus, Car, Hotel, Sparkles, RefreshCw, ArrowLeft, Clock, IndianRupee, MapPin, Star, Loader2, Info, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type RescueData = {
  booking: any;
  nextTrains: any[];
  buses: any[];
  cabs: any[];
  hotels: any[];
  refund: { eligible: boolean; tdrEligible: boolean; message: string; maxRefund: number };
  aiSuggestions: string;
};

export default function MissedTrainRescue() {
  const { bookingId: routeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(routeId);
  const [data, setData] = useState<RescueData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings").select("id, pnr, journey_date, status, trains(train_number, train_name, source_code, destination_code, departure_time)")
      .eq("user_id", user.id).neq("status", "refunded").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setBookings(data || []));
  }, [user]);

  const runRescue = async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    setData(null);
    try {
      const { data: r, error } = await supabase.functions.invoke("missed-train-rescue", { body: { bookingId: id } });
      if (error) throw error;
      setData(r);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch rescue options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (routeId) runRescue(routeId); }, [routeId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold mb-2">Please log in</h2>
          <Link to="/auth" className="text-primary hover:underline text-sm">Sign in to access Rescue Mode</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-destructive/5 via-background to-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-muted-foreground mb-3 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/15 via-destructive/5 to-amber-500/10 p-5 mb-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-destructive/10 rounded-full blur-2xl" />
          <div className="flex items-start gap-3 relative">
            <div className="w-11 h-11 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Missed Train Rescue Mode</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Saans lo. Hum aapke liye next options nikaal lete hain — alternate trains, buses, cabs, hotels & refund.</p>
            </div>
          </div>
        </motion.div>

        {/* Booking selector */}
        {!selectedId && (
          <div className="bg-card border border-border rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-foreground mb-3">Which train did you miss?</p>
            {bookings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active bookings found.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <button key={b.id} onClick={() => runRescue(b.id)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{b.trains?.train_number} • {b.trains?.train_name}</div>
                        <div className="text-[11px] text-muted-foreground">{b.trains?.source_code} → {b.trains?.destination_code} • {b.journey_date} • {b.trains?.departure_time}</div>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{b.pnr}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Scanning rescue options...</p>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Selected booking */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Missed</div>
                <div className="text-sm font-bold text-foreground">{data.booking.trains?.train_number} • {data.booking.trains?.train_name}</div>
                <div className="text-[11px] text-muted-foreground">PNR {data.booking.pnr} • Dep {data.booking.trains?.departure_time}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedId(undefined); setData(null); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Change
              </Button>
            </div>

            {/* AI Suggestions */}
            {data.aiSuggestions && (
              <Section icon={Sparkles} title="AI Smart Suggestions" accent="primary">
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm [&>ul]:my-1 [&>p]:m-0">
                  <ReactMarkdown>{data.aiSuggestions}</ReactMarkdown>
                </div>
              </Section>
            )}

            {/* Next Trains */}
            <Section icon={TrainFront} title="Next Fastest Trains" accent="primary">
              {data.nextTrains.length === 0 ? (
                <p className="text-xs text-muted-foreground">No alternate trains found on this route today.</p>
              ) : (
                <div className="space-y-2">
                  {data.nextTrains.map((t) => (
                    <Link key={t.id} to={`/train/${t.train_number}`} className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{t.train_number} • {t.train_name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />{t.departure_time} → {t.arrival_time} • {t.journey_duration}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary">₹{t.sleeper_price}+</div>
                          <div className="text-[10px] text-muted-foreground">Book now</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            {/* Buses */}
            <Section icon={Bus} title="Bus Alternatives" accent="amber">
              <div className="space-y-2">
                {data.buses.map((b, i) => (
                  <Row key={i} title={b.operator} subtitle={`Departs ${b.departs} • ${b.duration} • ${b.seats} seats left`} price={b.fare} />
                ))}
              </div>
            </Section>

            {/* Cabs */}
            <Section icon={Car} title="Cab & Carpool" accent="amber">
              <div className="space-y-2">
                {data.cabs.map((c, i) => (
                  <Row key={i} title={`${c.provider} (${c.type})`} subtitle={`ETA ${c.eta}`} price={c.fare} />
                ))}
              </div>
            </Section>

            {/* Hotels */}
            <Section icon={Hotel} title="Stay Nearby Tonight" accent="amber">
              <div className="space-y-2">
                {data.hotels.map((h, i) => (
                  <Row key={i} title={h.name}
                    subtitle={<span className="flex items-center gap-2"><MapPin className="w-3 h-3" />{h.distance} <Star className="w-3 h-3 fill-amber-400 text-amber-400 ml-1" />{h.rating}</span>}
                    price={h.price} priceSuffix="/night" />
                ))}
              </div>
            </Section>

            {/* Refund */}
            <Section icon={IndianRupee} title="Refund Eligibility" accent="primary">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>{data.refund.message}</p>
              </div>
              <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs font-medium">Estimated max TDR refund</span>
                <span className="text-sm font-bold text-primary">₹{data.refund.maxRefund}</span>
              </div>
              <Button asChild size="sm" className="w-full mt-3">
                <Link to="/complaints">File TDR / Complaint</Link>
              </Button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, accent, children }: { icon: any; title: string; accent: "primary" | "amber"; children: React.ReactNode }) {
  const accentCls = accent === "primary" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentCls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Row({ title, subtitle, price, priceSuffix }: { title: string; subtitle: React.ReactNode; price: number; priceSuffix?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/40 transition">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">{subtitle}</div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className="text-sm font-bold text-foreground">₹{price}<span className="text-[10px] font-normal text-muted-foreground">{priceSuffix}</span></div>
      </div>
    </div>
  );
}
