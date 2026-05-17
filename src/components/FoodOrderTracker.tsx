import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Bike, CheckCircle2, MapPin, Receipt, Radio } from "lucide-react";

interface FoodOrder {
  id: string;
  pnr: string;
  total_price: number;
  status: string;
  items: any;
  delivery_station: string | null;
  created_at: string;
}

const TOTAL_ETA_MIN = 18; // simulated end-to-end delivery time

const STAGES = [
  { key: "placed", label: "Order placed", icon: Receipt, atMin: 0 },
  { key: "preparing", label: "Kitchen preparing", icon: ChefHat, atMin: 3 },
  { key: "out_for_delivery", label: "On the way to your coach", icon: Bike, atMin: 10 },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, atMin: TOTAL_ETA_MIN },
];

function computeStage(createdAt: string, rawStatus: string) {
  if (rawStatus === "delivered") return { idx: 3, elapsed: TOTAL_ETA_MIN, remaining: 0 };
  const elapsed = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 60000);
  let idx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (elapsed >= STAGES[i].atMin) { idx = i; break; }
  }
  return { idx, elapsed, remaining: Math.max(0, TOTAL_ETA_MIN - elapsed) };
}

export default function FoodOrderTracker() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [tick, setTick] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last 60 min
      const { data } = await supabase
        .from("food_orders")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      setOrders((data as FoodOrder[]) || []);
    };
    load();
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user || orders.length === 0) return null;

  // Filter to active (not delivered by elapsed time) + show last 1 delivered for confirmation
  const active = orders.filter((o) => computeStage(o.created_at, o.status).remaining > 0);
  const recentDelivered = orders.find((o) => computeStage(o.created_at, o.status).remaining === 0);
  const display = active.length > 0 ? active : recentDelivered ? [recentDelivered] : [];
  if (display.length === 0) return null;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">Live Orders</h2>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-green-500/10 text-green-600 rounded">
          <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
        </span>
      </div>

      <AnimatePresence>
        {display.map((o) => {
          const { idx, remaining } = computeStage(o.created_at, o.status);
          const stage = STAGES[idx];
          const progressPct = Math.min(100, ((TOTAL_ETA_MIN - remaining) / TOTAL_ETA_MIN) * 100);
          const etaMin = Math.floor(remaining);
          const etaSec = Math.floor((remaining - etaMin) * 60);
          const isOpen = expandedId === o.id;
          const items = Array.isArray(o.items) ? o.items : [];

          return (
            <motion.div
              key={o.id + tick.toString().slice(-1)}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <button onClick={() => setExpandedId(isOpen ? null : o.id)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <motion.div
                      animate={remaining > 0 ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        idx === 3 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <stage.icon className="w-5 h-5" />
                    </motion.div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{stage.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-3 h-3" /> {o.delivery_station || "Station"} • PNR {o.pnr}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {remaining > 0 ? (
                      <>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> ETA
                        </div>
                        <div className="text-base font-bold text-primary tabular-nums">
                          {etaMin}:{etaSec.toString().padStart(2, "0")}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-success">DELIVERED</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${idx === 3 ? "bg-success" : "bg-gradient-to-r from-primary to-accent"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                {/* Stage dots */}
                <div className="flex justify-between mt-2 px-0.5">
                  {STAGES.map((s, i) => (
                    <div key={s.key} className="flex flex-col items-center gap-1" style={{ flex: i === 0 || i === STAGES.length - 1 ? "0 0 auto" : "1" }}>
                      <div
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i <= idx ? (idx === 3 ? "bg-success" : "bg-primary") : "bg-border"
                        } ${i === idx && remaining > 0 ? "ring-2 ring-primary/30 animate-pulse" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-secondary/30"
                  >
                    <div className="p-4 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Timeline</div>
                      {STAGES.map((s, i) => {
                        const done = i <= idx;
                        const Icon = s.icon;
                        return (
                          <div key={s.key} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 text-xs">
                              <div className={`font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {done ? "✓ Completed" : `at ${s.atMin} min`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Items</div>
                        {items.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-foreground">
                            <span>{it.name} × {it.qty}</span>
                            <span>₹{it.price * it.qty}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-border">
                          <span>Total</span><span>₹{o.total_price}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
