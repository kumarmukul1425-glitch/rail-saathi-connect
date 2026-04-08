import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Gift, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function DelayCompensation() {
  const { user } = useAuth();
  const [compensations, setCompensations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCompensations();
  }, [user]);

  const fetchCompensations = async () => {
    const { data } = await supabase.from("delay_compensations").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setCompensations(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" /> Delay Compensation
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          If your train is delayed by 3+ hours, you automatically receive a refund or food voucher.
        </p>

        {/* How it works */}
        <div className="bg-card rounded-xl p-5 border border-border mb-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-bold text-foreground mb-3">How it works</h3>
          <div className="space-y-3">
            {[
              { icon: Clock, text: "Train delayed by 3+ hours detected automatically" },
              { icon: IndianRupee, text: "Partial refund credited to your account OR" },
              { icon: Gift, text: "Free food voucher code for your next food order" },
              { icon: CheckCircle2, text: "Apply voucher at checkout in Food Delivery" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compensations List */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : compensations.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No compensations yet. Your tickets are automatically monitored for delays.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {compensations.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.compensation_type === "refund" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                    {c.compensation_type === "refund" ? "💰 Refund" : "🎫 Food Voucher"}
                  </span>
                  <span className={`text-xs font-bold ${c.status === "redeemed" ? "text-muted-foreground" : "text-success"}`}>
                    {c.status === "redeemed" ? "Used" : "Active"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Delay: {c.delay_hours}h</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₹{c.amount}</p>
                    {c.voucher_code && c.status !== "redeemed" && (
                      <p className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded mt-1">{c.voucher_code}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
