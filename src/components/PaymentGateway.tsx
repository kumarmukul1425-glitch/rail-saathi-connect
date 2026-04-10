import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Building2, QrCode, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "upi" | "cards" | "netbanking" | "gpay";

interface PaymentGatewayProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  loading: boolean;
}

const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "gpay", label: "Google Pay", icon: <Smartphone className="w-5 h-5" />, desc: "Pay with Google Pay" },
  { id: "upi", label: "UPI", icon: <QrCode className="w-5 h-5" />, desc: "PhonePe, Paytm, BHIM" },
  { id: "cards", label: "Card", icon: <CreditCard className="w-5 h-5" />, desc: "Credit / Debit Card" },
  { id: "netbanking", label: "Net Banking", icon: <Building2 className="w-5 h-5" />, desc: "All major banks" },
];

const banks = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "BOB", "Kotak", "Yes Bank"];

export default function PaymentGateway({ amount, onSuccess, onCancel, loading }: PaymentGatewayProps) {
  const [selected, setSelected] = useState<PaymentMethod>("gpay");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  const simulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => onSuccess(), 1200);
    }, 2000 + Math.random() * 1000);
  };

  const canPay = () => {
    if (processing || done) return false;
    switch (selected) {
      case "gpay": return true;
      case "upi": return upiId.includes("@");
      case "cards": return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardName.length > 1;
      case "netbanking": return selectedBank.length > 0;
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 border border-border text-center" style={{ boxShadow: "var(--shadow-prominent)" }}>
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground mb-1">Payment Successful!</h2>
        <p className="text-sm text-muted-foreground">₹{amount} paid successfully</p>
        <p className="text-xs text-muted-foreground mt-2">Confirming your booking...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-prominent)" }}>
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Payment</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-success" /> Secure & encrypted
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-bold text-foreground">₹{amount}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Method selector */}
        <div className="grid grid-cols-4 gap-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                selected === m.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 text-muted-foreground"
              )}
            >
              {m.icon}
              <span className="text-[10px] font-semibold leading-tight">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Method-specific form */}
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {selected === "gpay" && (
              <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-3">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm border">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Pay ₹{amount} with Google Pay</p>
                <p className="text-xs text-muted-foreground">You'll receive a payment request on your Google Pay app</p>
              </div>
            )}

            {selected === "upi" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">UPI ID</label>
                <input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm outline-none focus:border-primary/40 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground">Works with PhonePe, Paytm, BHIM, or any UPI app</p>
              </div>
            )}

            {selected === "cards" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Card Number</label>
                  <input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm outline-none focus:border-primary/40 transition-colors mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Cardholder Name</label>
                  <input
                    placeholder="Full name on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm outline-none focus:border-primary/40 transition-colors mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted-foreground">Expiry</label>
                    <input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm outline-none focus:border-primary/40 transition-colors mt-1"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-semibold text-muted-foreground">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full bg-secondary/50 rounded-lg px-3 py-2.5 border border-border text-sm outline-none focus:border-primary/40 transition-colors mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {selected === "netbanking" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">Select Your Bank</label>
                <div className="grid grid-cols-4 gap-2">
                  {banks.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBank(bank)}
                      className={cn(
                        "py-2 px-2 rounded-lg border text-xs font-medium transition-all",
                        selectedBank === bank
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      )}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pay button */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={processing} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={simulatePayment}
            disabled={!canPay() || processing}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            {processing ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
            ) : (
              `Pay ₹${amount}`
            )}
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          This is a simulated payment for demo purposes
        </p>
      </div>
    </motion.div>
  );
}
