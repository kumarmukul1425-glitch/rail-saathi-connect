import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, RefreshCw, ArrowDownCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Tx {
  id: string;
  amount: number;
  type: string;
  reason: string | null;
  booking_id: string | null;
  created_at: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(w?.balance || 0);
    setTxs((t as Tx[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  const runScan = async () => {
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("auto-refund-scan");
    setScanning(false);
    if (error) {
      toast.error("Scan failed", { description: error.message });
      return;
    }
    const refunded = (data?.results || []).filter((r: any) => r.ok);
    if (refunded.length) {
      toast.success(`${refunded.length} refund(s) processed`, {
        description: refunded.map((r: any) => `PNR ${r.pnr}: ₹${r.amount}`).join(", "),
      });
      load();
    } else {
      toast("No eligible bookings", { description: "All your trains are running on time." });
    }
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
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5" />
              <span className="text-sm opacity-90">Refund Wallet</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={runScan}
              disabled={scanning}
              className="h-8"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Scan refunds
            </Button>
          </div>
          <div className="text-4xl font-bold tracking-tight">₹{balance}</div>
          <div className="text-xs opacity-80 mt-1">Auto-credited on cancellations & 3hr+ delays</div>
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-3">Transaction History</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <ArrowDownCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <Link to="/my-bookings" className="text-xs text-primary mt-2 inline-block hover:underline">
              View bookings
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => (
              <div key={t.id} className="bg-card rounded-xl p-4 border border-border flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                    <ArrowDownCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground capitalize">{t.type}</div>
                    <div className="text-xs text-muted-foreground">{t.reason || "—"}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(t.created_at), "dd MMM yyyy, HH:mm")}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-green-600">+₹{t.amount}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
