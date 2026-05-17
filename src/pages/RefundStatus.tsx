import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Loader2, Receipt, Clock, XCircle, AlertTriangle, Wallet as WalletIcon } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface RefundRow {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
  booking_id: string | null;
  booking?: {
    pnr: string;
    journey_date: string;
    seat_class: string;
    total_fare: number;
    status: string;
    refunded_at: string | null;
    trains?: { train_number: string; train_name: string } | null;
  } | null;
}

export default function RefundStatus() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("wallet_transactions")
        .select("id, amount, reason, created_at, booking_id, booking:bookings(pnr, journey_date, seat_class, total_fare, status, refunded_at, trains(train_number, train_name))")
        .eq("user_id", user.id)
        .eq("type", "refund")
        .order("created_at", { ascending: false });
      const list = (data as any as RefundRow[]) || [];
      setRows(list);
      setTotal(list.reduce((s, r) => s + (r.amount || 0), 0));
      setLoading(false);
    })();
  }, [user]);

  const reasonMeta = (reason: string | null) => {
    const r = (reason || "").toLowerCase();
    if (r.includes("cancel")) return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Train Cancelled" };
    if (r.includes("delay")) return { icon: Clock, color: "text-accent", bg: "bg-accent/10", label: reason || "3hr+ Delay" };
    return { icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted", label: reason || "Refund" };
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" /> Refund Status
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Every auto-refund triggered by 3hr+ delay or cancellation
              </p>
            </div>
            <Link to="/wallet" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5" /> Wallet
            </Link>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-5 mb-6 shadow-lg">
            <div className="text-xs opacity-90">Total Refunded</div>
            <div className="text-3xl font-bold tracking-tight mt-1">₹{total}</div>
            <div className="text-xs opacity-80 mt-1">Across {rows.length} booking{rows.length === 1 ? "" : "s"}</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No refunds yet</p>
              <p className="text-xs text-muted-foreground mt-1">Refunds appear here automatically when a train is delayed 3hr+ or cancelled.</p>
              <Link to="/wallet" className="text-xs text-primary mt-3 inline-block hover:underline">
                Run wallet scan →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const meta = reasonMeta(r.reason);
                const Icon = meta.icon;
                const train = r.booking?.trains;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {train ? `${train.train_name} (${train.train_number})` : "Booking"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            PNR <span className="font-mono font-semibold text-foreground">{r.booking?.pnr || "—"}</span>
                            {r.booking?.seat_class && <> • {r.booking.seat_class}</>}
                            {r.booking?.journey_date && <> • {format(new Date(r.booking.journey_date), "dd MMM yyyy")}</>}
                          </div>
                          <div className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-2 px-2 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-green-600">+₹{r.amount}</div>
                        <div className="text-[10px] text-muted-foreground">100% refund</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>Scanned: <span className="text-foreground font-medium">{format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}</span></span>
                      {r.booking?.refunded_at && (
                        <span>Credited: <span className="text-foreground font-medium">{format(new Date(r.booking.refunded_at), "dd MMM yyyy, HH:mm")}</span></span>
                      )}
                      {r.booking?.total_fare && (
                        <span>Original fare: <span className="text-foreground font-medium">₹{r.booking.total_fare}</span></span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
